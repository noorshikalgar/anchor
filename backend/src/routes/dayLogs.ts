import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db'
import { dayLogs } from '../db/schema'
import { authenticate } from '../middleware/authenticate'
import { eq, and, gte, lte } from 'drizzle-orm'

const router = Router()
router.use(authenticate)

const DayLogSchema = z.object({
  disrupted: z.boolean(),
  disruptionNote: z.string().optional(),
})

router.get('/', async (req, res) => {
  const { from, to } = req.query as { from?: string; to?: string }
  const conditions = [eq(dayLogs.userId, req.userId)]
  if (from) conditions.push(gte(dayLogs.date, from))
  if (to) conditions.push(lte(dayLogs.date, to))

  const rows = await db.select().from(dayLogs).where(and(...conditions))
  res.json(rows)
})

router.put('/:date', async (req, res) => {
  const date = req.params.date
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) { res.status(400).json({ error: 'Invalid date' }); return }

  const parsed = DayLogSchema.safeParse(req.body)
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return }

  const existing = await db.select().from(dayLogs)
    .where(and(eq(dayLogs.date, date), eq(dayLogs.userId, req.userId)))

  let row
  if (existing.length > 0) {
    ;[row] = await db.update(dayLogs)
      .set(parsed.data)
      .where(and(eq(dayLogs.date, date), eq(dayLogs.userId, req.userId)))
      .returning()
  } else {
    ;[row] = await db.insert(dayLogs)
      .values({ date, userId: req.userId, ...parsed.data })
      .returning()
  }

  res.json(row)
})

export default router
