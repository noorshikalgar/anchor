import { format, subDays } from 'date-fns'
import { eq, and, gte } from 'drizzle-orm'
import { db } from '../db'
import { habits, checkins, userSettings } from '../db/schema'
import { computeStreak, determineSlotsFromStreaks } from './streaks'

export async function evaluateSlots(userId: string): Promise<number> {
  const [settings] = await db.select().from(userSettings).where(eq(userSettings.userId, userId))
  if (!settings) return 1

  const focusHabits = await db.select().from(habits)
    .where(and(eq(habits.userId, userId), eq(habits.inFocus, 1)))
    .orderBy(habits.focusOrder)

  if (focusHabits.length === 0) return settings.slotsUnlocked

  const lookback = format(subDays(new Date(), 90), 'yyyy-MM-dd')
  const recentCheckins = await db.select({
    habitId: checkins.habitId,
    date: checkins.date,
    status: checkins.status,
  }).from(checkins).where(and(eq(checkins.userId, userId), gte(checkins.date, lookback)))

  const today = format(new Date(), 'yyyy-MM-dd')
  const streaks = focusHabits.map((h) => computeStreak(h.id, recentCheckins, today))

  const newSlots = determineSlotsFromStreaks(streaks, settings.slotsUnlocked)

  if (newSlots !== settings.slotsUnlocked) {
    await db.update(userSettings)
      .set({ slotsUnlocked: newSlots })
      .where(eq(userSettings.userId, userId))
  }

  return newSlots
}
