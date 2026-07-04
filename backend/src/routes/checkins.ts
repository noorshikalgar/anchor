import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db'
import { checkins } from '../db/schema'
import { authenticate } from '../middleware/authenticate'
import { eq, and, gte, lte } from 'drizzle-orm'
import { evaluateSlots } from '../lib/evaluateSlots'

const router = Router()
router.use(authenticate)

const CheckinSchema = z.object({
  id: z.string(),
  habitId: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(['done', 'partial', 'missed', 'pending']),
  reason: z.string().optional(),
  note: z.string().optional(),
  usedFallback: z.boolean().default(false),
})

router.get('/', async (req, res) => {
  const { from, to } = req.query as { from?: string; to?: string }

  let query = db.select().from(checkins).where(eq(checkins.userId, req.userId))

  if (from || to) {
    const conditions = [eq(checkins.userId, req.userId)]
    if (from) conditions.push(gte(checkins.date, from))
    if (to) conditions.push(lte(checkins.date, to))
    query = db.select().from(checkins).where(and(...conditions))
  }

  const rows = await query
  res.json(rows)
})

router.put('/:id', async (req, res) => {
  const parsed = CheckinSchema.safeParse({ ...req.body, id: req.params.id })
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return }

  const { id, ...data } = parsed.data

  const existing = await db.select().from(checkins)
    .where(and(eq(checkins.id, id), eq(checkins.userId, req.userId)))

  let row
  if (existing.length > 0) {
    ;[row] = await db.update(checkins)
      .set({ ...data, loggedAt: new Date() })
      .where(and(eq(checkins.id, id), eq(checkins.userId, req.userId)))
      .returning()
  } else {
    ;[row] = await db.insert(checkins)
      .values({ id, userId: req.userId, ...data })
      .returning()
  }

  // Evaluate slots async — don't block response
  evaluateSlots(req.userId).catch(() => {})

  res.json(row)
})

export default router
