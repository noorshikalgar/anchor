import { Router } from 'express'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db } from '../db'
import { userSettings } from '../db/schema'
import { authenticate } from '../middleware/authenticate'
import { decrypt } from '../lib/crypto'
import { generateCoachReply } from '../lib/coach'

const router = Router()
router.use(authenticate)

const MessageSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.string().min(1).max(1000),
  })).min(1).max(30),
})

// Per-user daily message cap (in-memory; single-instance deployment)
const DAILY_LIMIT = 60
const usage = new Map<string, { day: string; count: number }>()

function underLimit(userId: string): boolean {
  const day = new Date().toDateString()
  const u = usage.get(userId)
  if (!u || u.day !== day) { usage.set(userId, { day, count: 1 }); return true }
  if (u.count >= DAILY_LIMIT) return false
  u.count++
  return true
}

router.post('/message', async (req, res) => {
  const parsed = MessageSchema.safeParse(req.body)
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return }

  const last = parsed.data.messages[parsed.data.messages.length - 1]
  if (last.role !== 'user') { res.status(400).json({ error: 'Last message must be from the user' }); return }

  const [settings] = await db.select().from(userSettings).where(eq(userSettings.userId, req.userId))
  if (!settings?.aiEnabled || !settings.apiKeyEncrypted) {
    res.status(503).json({ error: 'Coach is offline — enable AI planning and add your Gemini key in the You tab.' })
    return
  }

  if (!underLimit(req.userId)) {
    res.status(429).json({ error: 'Daily coach limit reached — back tomorrow.' })
    return
  }

  try {
    const apiKey = decrypt(settings.apiKeyEncrypted)
    const reply = await generateCoachReply(apiKey, req.userId, parsed.data.messages, settings.apiModel ?? undefined)
    res.json({ reply })
  } catch (err: unknown) {
    console.error('Coach error:', err)
    const isAuthError = err instanceof Error && (err.message.includes('API_KEY') || err.message.includes('403'))
    if (isAuthError) {
      res.status(401).json({ error: 'Invalid Gemini API key. Check your key in settings.' })
      return
    }
    res.status(502).json({ error: 'Coach could not respond — try again in a moment.' })
  }
})

export default router
