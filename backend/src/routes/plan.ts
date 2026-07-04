import { Router } from 'express'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db } from '../db'
import { userSettings } from '../db/schema'
import { authenticate } from '../middleware/authenticate'
import { decrypt } from '../lib/crypto'
import { generatePlan } from '../lib/gemini'
import { buildPlanInput } from '../lib/planBuilder'
import { buildFallbackPlanFromDB } from '../lib/fallbackPlan'

const router = Router()
router.use(authenticate)

const GenerateSchema = z.object({
  userContext: z.string().max(500).optional(),
})

router.post('/generate', async (req, res) => {
  const parsed = GenerateSchema.safeParse(req.body)
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return }

  const [settings] = await db.select().from(userSettings).where(eq(userSettings.userId, req.userId))

  if (!settings?.aiEnabled || !settings.apiKeyEncrypted) {
    const fallback = await buildFallbackPlanFromDB(req.userId)
    res.json({ ...fallback, source: 'rule-based' })
    return
  }

  try {
    const apiKey = decrypt(settings.apiKeyEncrypted)
    const planInput = await buildPlanInput(req.userId)
    const plan = await generatePlan(apiKey, planInput, parsed.data.userContext, settings.apiModel ?? undefined)
    res.json({ ...plan, source: 'gemini' })
  } catch (err: unknown) {
    console.error('Gemini plan error:', err)

    const isAuthError = err instanceof Error && (err.message.includes('API_KEY') || err.message.includes('403'))
    if (isAuthError) {
      res.status(401).json({ error: 'Invalid Gemini API key. Check your key in settings.' })
      return
    }

    // Fall back to rule-based on any other error
    const fallback = await buildFallbackPlanFromDB(req.userId)
    res.json({ ...fallback, source: 'rule-based', warning: 'AI unavailable — showing rule-based plan.' })
  }
})

export default router
