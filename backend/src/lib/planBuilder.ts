import { format, subDays, parseISO, getDay } from 'date-fns'
import { eq, and, gte } from 'drizzle-orm'
import { db } from '../db'
import { habits, checkins, userSettings, dayLogs } from '../db/schema'
import { computeStreak } from './streaks'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export async function buildPlanInput(userId: string) {
  const today = format(new Date(), 'yyyy-MM-dd')
  const lookback28 = format(subDays(new Date(), 28), 'yyyy-MM-dd')
  const lookback7 = format(subDays(new Date(), 7), 'yyyy-MM-dd')

  const [allHabits, recent28, settings, recentLogs] = await Promise.all([
    db.select().from(habits).where(eq(habits.userId, userId)).orderBy(habits.focusOrder),
    db.select().from(checkins).where(and(eq(checkins.userId, userId), gte(checkins.date, lookback28))),
    db.select().from(userSettings).where(eq(userSettings.userId, userId)),
    db.select({ date: dayLogs.date, note: dayLogs.disruptionNote })
      .from(dayLogs).where(and(eq(dayLogs.userId, userId), gte(dayLogs.date, lookback7))),
  ])

  const focusHabits = allHabits.filter((h) => h.inFocus === 1)
  const backlogHabits = allHabits.filter((h) => h.inFocus === 0)
  const last7 = recent28.filter((c) => c.date >= lookback7)
  const slotsUnlocked = settings[0]?.slotsUnlocked ?? 1

  const focusData = focusHabits.map((h) => {
    const h7 = last7.filter((c) => c.habitId === h.id)
    const done = h7.filter((c) => c.status === 'done').length
    const partial = h7.filter((c) => c.status === 'partial').length
    const completionRateLast7 = h7.length > 0 ? (done + partial * 0.5) / 7 : 0

    const reasonCounts: Record<string, number> = {}
    recent28.filter((c) => c.habitId === h.id && c.reason).forEach((c) => {
      if (c.reason) reasonCounts[c.reason] = (reasonCounts[c.reason] ?? 0) + 1
    })
    const topDisruptionReason = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

    return {
      id: h.id,
      name: h.name,
      slot: h.slot,
      defaultVersion: h.defaultVersion,
      completionRateLast7: Math.round(completionRateLast7 * 100) / 100,
      logsLast7: h7.length,
      streak: computeStreak(h.id, recent28, today),
      topDisruptionReason,
      isNew: h7.length === 0 && recent28.filter((c) => c.habitId === h.id).length === 0,
    }
  })

  // Day-of-week disruption pattern
  const dayMissed: Record<number, number> = {}
  const dayTotal: Record<number, number> = {}
  recent28.forEach((c) => {
    const dow = getDay(parseISO(c.date))
    dayTotal[dow] = (dayTotal[dow] ?? 0) + 1
    if (c.status === 'missed') dayMissed[dow] = (dayMissed[dow] ?? 0) + 1
  })

  let worstDow = -1, worstRate = 0
  Object.entries(dayTotal).forEach(([dow, total]) => {
    const rate = (dayMissed[+dow] ?? 0) / total
    if (rate > worstRate && total >= 2) { worstRate = rate; worstDow = +dow }
  })

  const totalCheckins = recent28.length
  const totalMissed = recent28.filter((c) => c.status === 'missed').length
  const disruptionFrequency = totalCheckins > 0 ? Math.round((totalMissed / totalCheckins) * 100) / 100 : 0

  return {
    currentWeek: {
      startDate: today,
      focusHabits: focusData,
      backlogHabits: backlogHabits.map((h) => ({ id: h.id, name: h.name })),
      slotsUnlocked,
    },
    patterns: {
      mostDisruptedDayOfWeek: worstDow >= 0 && worstRate > 0.4 ? DAY_NAMES[worstDow] : null,
      disruptionFrequency,
    },
    recentDailyNotes: recentLogs
      .filter((l) => l.note)
      .map((l) => ({ date: l.date, note: l.note })),
  }
}
