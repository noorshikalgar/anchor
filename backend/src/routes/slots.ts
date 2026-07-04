import { Router } from 'express'
import { format, subDays } from 'date-fns'
import { eq, and, gte } from 'drizzle-orm'
import { db } from '../db'
import { habits, checkins } from '../db/schema'
import { authenticate } from '../middleware/authenticate'
import { computeStreak } from '../lib/streaks'
import { evaluateSlots } from '../lib/evaluateSlots'

const router = Router()
router.use(authenticate)

router.get('/', async (req, res) => {
  const slotsUnlocked = await evaluateSlots(req.userId)

  const focusHabits = await db.select().from(habits)
    .where(and(eq(habits.userId, req.userId), eq(habits.inFocus, 1)))
    .orderBy(habits.focusOrder)

  const lookback = format(subDays(new Date(), 90), 'yyyy-MM-dd')
  const recentCheckins = await db.select({
    habitId: checkins.habitId,
    date: checkins.date,
    status: checkins.status,
  }).from(checkins).where(and(eq(checkins.userId, req.userId), gte(checkins.date, lookback)))

  const today = format(new Date(), 'yyyy-MM-dd')

  const streakData = focusHabits.map((h) => ({
    habitId: h.id,
    habitName: h.name,
    streak: computeStreak(h.id, recentCheckins, today),
    target: 7,
  }))

  const habitsAt7 = streakData.filter((s) => s.streak >= 7).length

  let nextUnlock: { targetSlots: number; requirement: string } | null = null
  if (slotsUnlocked < 2) {
    const best = Math.max(0, ...streakData.map((s) => s.streak))
    nextUnlock = {
      targetSlots: 2,
      requirement: `${7 - best} more day${7 - best === 1 ? '' : 's'} of ${streakData[0]?.habitName ?? 'your habit'} → slot 2 unlocks`,
    }
  } else if (slotsUnlocked < 3) {
    const needed = Math.max(0, 2 - habitsAt7)
    nextUnlock = {
      targetSlots: 3,
      requirement: `${needed} more habit${needed === 1 ? '' : 's'} need 7-day streak → slot 3 unlocks`,
    }
  }

  res.json({ slotsUnlocked, streaks: streakData, nextUnlock })
})

// Trigger evaluation explicitly (called after checkin)
router.post('/evaluate', async (req, res) => {
  const slotsUnlocked = await evaluateSlots(req.userId)
  res.json({ slotsUnlocked })
})

export default router
