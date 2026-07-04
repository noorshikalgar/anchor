import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db'
import { habits } from '../db/schema'
import { authenticate } from '../middleware/authenticate'
import { eq, and } from 'drizzle-orm'

const router = Router()
router.use(authenticate)

const STARTER_HABITS = [
  { id: 'sleep', name: 'Sleep', category: 'sleep', icon: 'moon', defaultVersion: 'Lights out by 11pm, up by 6:30am', fallbackVersion: 'Wake-up at 6:30am regardless of when you slept', slot: 'before-sleep' },
  { id: 'diet', name: 'Diet', category: 'diet', icon: 'salad', defaultVersion: 'No junk food after 9pm, drink 2L water', fallbackVersion: 'Just drink water today, skip the junk rule', slot: 'after-dinner' },
  { id: 'gym', name: 'Gym / Exercise', category: 'exercise', icon: 'dumbbell', defaultVersion: '45 min workout at gym', fallbackVersion: '10 min walk or 20 bodyweight squats at home', slot: 'morning' },
  { id: 'coding', name: 'Coding / Learning', category: 'deep-work', icon: 'code', defaultVersion: '45 min focused coding or course session', fallbackVersion: '15 min — read docs or watch one tutorial video', slot: 'after-dinner' },
  { id: 'reading', name: 'Reading', category: 'reading', icon: 'book-open', defaultVersion: '30 min reading before sleep', fallbackVersion: '10 min — read one chapter or article', slot: 'before-sleep' },
  { id: 'hair-care', name: 'Hair Care', category: 'grooming', icon: 'sparkles', defaultVersion: 'Oil + scalp massage 3x/week, consistent shampoo schedule', fallbackVersion: 'Apply oil — even 5 min counts', slot: 'morning' },
  { id: 'digital-detox', name: 'Screen Limit', category: 'digital-wellbeing', icon: 'smartphone', defaultVersion: 'No phone after 10pm, max 1hr YouTube/day', fallbackVersion: 'Put phone away 30 min before sleep', slot: 'before-sleep' },
]

export async function seedHabitsForUser(userId: string) {
  const values = STARTER_HABITS.map((h, i) => ({
    ...h,
    userId,
    inFocus: 0 as const,
    focusOrder: i,
  }))
  await db.insert(habits).values(values).onConflictDoNothing()
}

const UpdateHabitSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  inFocus: z.union([z.literal(0), z.literal(1)]).optional(),
  focusOrder: z.number().int().optional(),
  slot: z.string().optional(),
  defaultVersion: z.string().optional(),
  fallbackVersion: z.string().optional(),
})

router.get('/', async (req, res) => {
  const rows = await db.select().from(habits)
    .where(eq(habits.userId, req.userId))
    .orderBy(habits.focusOrder)
  res.json(rows)
})

router.patch('/:id', async (req, res) => {
  const parsed = UpdateHabitSchema.safeParse(req.body)
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return }

  const [updated] = await db.update(habits)
    .set(parsed.data)
    .where(and(eq(habits.id, req.params.id), eq(habits.userId, req.userId)))
    .returning()

  if (!updated) { res.status(404).json({ error: 'Habit not found' }); return }
  res.json(updated)
})

router.patch('/:id/focus', async (req, res) => {
  const { inFocus, focusOrder } = req.body as { inFocus: 0 | 1; focusOrder: number }

  const [updated] = await db.update(habits)
    .set({ inFocus, focusOrder })
    .where(and(eq(habits.id, req.params.id), eq(habits.userId, req.userId)))
    .returning()

  if (!updated) { res.status(404).json({ error: 'Habit not found' }); return }
  res.json(updated)
})

export default router
