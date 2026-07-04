import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db'
import { userSettings, users } from '../db/schema'
import { authenticate } from '../middleware/authenticate'
import { eq } from 'drizzle-orm'

const router = Router()
router.use(authenticate)

const SettingsSchema = z.object({
  aiEnabled: z.boolean().optional(),
  weekStartsOn: z.union([z.literal(0), z.literal(1)]).optional(),
})

const NameSchema = z.object({
  name: z.string().min(1).max(100),
})

router.get('/', async (req, res) => {
  const [settings] = await db.select().from(userSettings)
    .where(eq(userSettings.userId, req.userId))
  res.json(settings ?? null)
})

router.patch('/', async (req, res) => {
  const parsed = SettingsSchema.safeParse(req.body)
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return }

  const [updated] = await db.update(userSettings)
    .set(parsed.data)
    .where(eq(userSettings.userId, req.userId))
    .returning()

  res.json(updated)
})

router.patch('/name', async (req, res) => {
  const parsed = NameSchema.safeParse(req.body)
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return }

  const [updated] = await db.update(users)
    .set({ name: parsed.data.name })
    .where(eq(users.id, req.userId))
    .returning({ id: users.id, name: users.name, email: users.email })

  res.json(updated)
})

export default router
