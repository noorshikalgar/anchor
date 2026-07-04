import { format, subDays } from 'date-fns'
import { eq, and, gte } from 'drizzle-orm'
import { db } from '../db'
import { habits, checkins } from '../db/schema'
import { computeStreak } from './streaks'

export async function buildFallbackPlanFromDB(userId: string) {
  const today = format(new Date(), 'yyyy-MM-dd')
  const lookback7 = format(subDays(new Date(), 7), 'yyyy-MM-dd')

  const [allHabits, recent] = await Promise.all([
    db.select().from(habits).where(eq(habits.userId, userId)).orderBy(habits.focusOrder),
    db.select().from(checkins).where(and(eq(checkins.userId, userId), gte(checkins.date, lookback7))),
  ])

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

  const streaks = focusHabits.map((h) => computeStreak(h.id, recent, today))
  const struggling = focusHabits.filter((_, i) => {
    const h7 = recent.filter((c) => c.habitId === focusHabits[i].id)
    return h7.length >= 3 && h7.filter((c) => c.status === 'done' || c.status === 'partial').length / h7.length < 0.5
  })
  const steady = focusHabits.filter((_h, i) => streaks[i] >= 5)
  const canAdd = steady.length >= focusHabits.length && backlog.length > 0

  const recs = focusHabits.map((h, i) => ({
    habitId: h.id,
    action: (struggling.find((s) => s.id === h.id) ? 'shrink' : 'maintain') as 'maintain' | 'shrink' | 'graduate',
    reason: struggling.find((s) => s.id === h.id)
      ? 'Tough week — try the fallback version instead of the full habit.'
      : `${streaks[i]} day streak — keep going.`,
  }))

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
    disruptionPrediction: null,
  }
}
