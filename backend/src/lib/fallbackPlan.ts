import { format, subDays, parseISO, getDay } from 'date-fns'
import { eq, and, gte } from 'drizzle-orm'
import { db } from '../db'
import { habits, checkins } from '../db/schema'
import { computeStreak } from './streaks'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const REASON_LABELS: Record<string, string> = {
  'late-night': 'late nights',
  'work-ran-long': 'work running long',
  'guests-family': 'guests and family time',
  travel: 'travel',
  health: 'health',
  forgot: 'forgetting',
  other: 'other things',
}

export async function buildFallbackPlanFromDB(userId: string) {
  const today = format(new Date(), 'yyyy-MM-dd')
  const lookback7 = format(subDays(new Date(), 7), 'yyyy-MM-dd')
  const lookback28 = format(subDays(new Date(), 28), 'yyyy-MM-dd')

  const [allHabits, recent28] = await Promise.all([
    db.select().from(habits).where(eq(habits.userId, userId)).orderBy(habits.focusOrder),
    db.select().from(checkins).where(and(eq(checkins.userId, userId), gte(checkins.date, lookback28))),
  ])
  const recent7 = recent28.filter((c) => c.date >= lookback7)

  const focusHabits = allHabits.filter((h) => h.inFocus === 1)
  const backlog = allHabits.filter((h) => h.inFocus === 0)

  if (focusHabits.length === 0) {
    const first = backlog[0]
    return {
      summary: first
        ? `Start with ${first.name} this week. One habit first — anchor everything else to getting this right.`
        : 'Add your first habit from the Focus tab to get started.',
      habitRecommendations: [],
      newHabitSuggestion: first ? { habitId: first.id, reason: 'Start with one habit.' } : null,
      disruptionPrediction: null,
    }
  }

  // Streaks over the full 28-day window so long streaks aren't capped at 7
  const streaks = focusHabits.map((h) => computeStreak(h.id, recent28, today))
  const struggling = focusHabits.filter((h) => {
    const h7 = recent7.filter((c) => c.habitId === h.id)
    return h7.length >= 3 && h7.filter((c) => c.status === 'done' || c.status === 'partial').length / h7.length < 0.5
  })
  const steady = focusHabits.filter((_h, i) => streaks[i] >= 5)
  const canAdd = steady.length >= focusHabits.length && backlog.length > 0

  function topReason(habitId: string): string | null {
    const counts: Record<string, number> = {}
    recent28.filter((c) => c.habitId === habitId && c.reason).forEach((c) => {
      counts[c.reason!] = (counts[c.reason!] ?? 0) + 1
    })
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
    return top && top[1] >= 2 ? top[0] : null
  }

  const recs = focusHabits.map((h, i) => {
    const isStruggling = struggling.some((s) => s.id === h.id)
    if (!isStruggling) {
      return { habitId: h.id, action: 'maintain' as const, reason: `${streaks[i]} day streak — keep going.` }
    }
    const reason = topReason(h.id)
    return {
      habitId: h.id,
      action: 'shrink' as const,
      reason: reason
        ? `Mostly ${REASON_LABELS[reason] ?? reason} getting in the way — switch to the fallback version this week.`
        : 'Tough week — try the fallback version instead of the full habit.',
    }
  })

  // Day-of-week pattern: which day misses the most (28-day window)
  const dayMissed: Record<number, number> = {}
  const dayTotal: Record<number, number> = {}
  recent28.forEach((c) => {
    const dow = getDay(parseISO(c.date))
    dayTotal[dow] = (dayTotal[dow] ?? 0) + 1
    if (c.status === 'missed') dayMissed[dow] = (dayMissed[dow] ?? 0) + 1
  })
  let worstDow = -1
  let worstRate = 0
  Object.entries(dayTotal).forEach(([dow, total]) => {
    const rate = (dayMissed[+dow] ?? 0) / total
    if (rate > worstRate && total >= 3 && (dayMissed[+dow] ?? 0) >= 3) { worstRate = rate; worstDow = +dow }
  })
  const disruptionPrediction = worstDow >= 0 && worstRate > 0.4
    ? `${DAY_NAMES[worstDow]}s have been the hardest — ${dayMissed[worstDow]} of ${dayTotal[worstDow]} logs missed. Plan for fallback versions that day.`
    : null

  let summary = ''
  if (struggling.length > 0) {
    summary = `${struggling.map((h) => h.name).join(' and ')} had a rough week. Stick to fallback versions — showing up matters more than perfection.`
  } else if (canAdd && backlog[0]) {
    summary = `${steady.map((h) => h.name).join(' and ')} ${steady.length === 1 ? 'is' : 'are'} steady. Good time to add ${backlog[0].name} this week.`
  } else {
    summary = `Keep going with ${focusHabits.map((h) => h.name).join(' and ')}. Consistency this week, no changes.`
  }

  return {
    summary,
    habitRecommendations: recs,
    newHabitSuggestion: canAdd && backlog[0] ? { habitId: backlog[0].id, reason: `${steady.map((h) => h.name).join(' and ')} is steady — ready to layer in ${backlog[0].name}.` } : null,
    disruptionPrediction,
  }
}
