import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db'
import { userSettings, users } from '../db/schema'
import { authenticate } from '../middleware/authenticate'
import { eq } from 'drizzle-orm'
import { encrypt, decrypt, maskKey } from '../lib/crypto'

const router = Router()
router.use(authenticate)

const SettingsSchema = z.object({
  aiEnabled: z.boolean().optional(),
  weekStartsOn: z.union([z.literal(0), z.literal(1)]).optional(),
  apiModel: z.string().max(100).optional(),
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

router.put('/apikey', async (req, res) => {
  const { apiKey } = req.body as { apiKey?: string }

  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 10) {
    res.status(400).json({ error: 'Invalid API key' })
    return
  }

  const encrypted = encrypt(apiKey.trim())
  await db.update(userSettings)
    .set({ apiKeyEncrypted: encrypted, apiProvider: 'gemini' })
    .where(eq(userSettings.userId, req.userId))

  res.json({ configured: true, masked: maskKey(apiKey.trim()), provider: 'gemini' })
})

router.delete('/apikey', async (req, res) => {
  await db.update(userSettings)
    .set({ apiKeyEncrypted: null, apiProvider: null })
    .where(eq(userSettings.userId, req.userId))
  res.json({ configured: false })
})

router.get('/apikey/status', async (req, res) => {
  const [s] = await db.select({
    apiKeyEncrypted: userSettings.apiKeyEncrypted,
    apiProvider: userSettings.apiProvider,
    apiModel: userSettings.apiModel,
  }).from(userSettings).where(eq(userSettings.userId, req.userId))

  res.json({
    configured: !!s?.apiKeyEncrypted,
    provider: s?.apiProvider ?? null,
    model: s?.apiModel ?? null,
  })
})

router.get('/models', async (req, res) => {
  const [s] = await db.select({ apiKeyEncrypted: userSettings.apiKeyEncrypted })
    .from(userSettings).where(eq(userSettings.userId, req.userId))

  if (!s?.apiKeyEncrypted) { res.status(400).json({ error: 'No API key configured' }); return }

  try {
    const apiKey = decrypt(s.apiKeyEncrypted)
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`)
    if (!r.ok) { res.status(r.status).json({ error: 'Gemini API error' }); return }

    const data = await r.json() as { models: { name: string; displayName: string; supportedGenerationMethods: string[] }[] }
    const id = (m: { name: string }) => m.name.replace('models/', '')
    const models = (data.models ?? [])
      .filter((m) =>
        m.supportedGenerationMethods.includes('generateContent') &&
        id(m).startsWith('gemini-') &&
        !id(m).includes('embedding') &&
        !id(m).includes('aqa') &&
        !id(m).includes('nano') &&
        (id(m).includes('flash') || id(m).includes('pro'))
      )
      .map((m) => ({
        id: id(m),
        displayName: m.displayName,
      }))
      .sort((a, b) => a.displayName.localeCompare(b.displayName))

    res.json({ models })
  } catch {
    res.status(500).json({ error: 'Failed to fetch models' })
  }
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
