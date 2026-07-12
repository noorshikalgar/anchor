import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db'
import { pushSubscriptions } from '../db/schema'
import { authenticate } from '../middleware/authenticate'
import { and, eq } from 'drizzle-orm'
import { getPublicKey, pushEnabled, sendToUser } from '../lib/push'

const router = Router()
router.use(authenticate)

const SubscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({ p256dh: z.string(), auth: z.string() }),
})

router.get('/publickey', (_req, res) => {
  if (!pushEnabled) { res.status(503).json({ error: 'Push not configured' }); return }
  res.json({ publicKey: getPublicKey() })
})

router.post('/subscribe', async (req, res) => {
  const parsed = SubscribeSchema.safeParse(req.body)
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return }
  const { endpoint, keys } = parsed.data

  await db.insert(pushSubscriptions)
    .values({ userId: req.userId, endpoint, p256dh: keys.p256dh, auth: keys.auth })
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: { userId: req.userId, p256dh: keys.p256dh, auth: keys.auth },
    })
  res.json({ ok: true })
})

router.post('/unsubscribe', async (req, res) => {
  const endpoint = typeof req.body?.endpoint === 'string' ? req.body.endpoint : null
  if (!endpoint) { res.status(400).json({ error: 'endpoint required' }); return }
  await db.delete(pushSubscriptions)
    .where(and(eq(pushSubscriptions.endpoint, endpoint), eq(pushSubscriptions.userId, req.userId)))
  res.json({ ok: true })
})

router.post('/test', async (req, res) => {
  await sendToUser(req.userId, { title: 'Anchor', body: 'Notifications are working.', url: '/' })
  res.json({ ok: true })
})

export default router
