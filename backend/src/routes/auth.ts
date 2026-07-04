import { Router } from 'express'
import { z } from 'zod'
import rateLimit from 'express-rate-limit'
import { db } from '../db'
import { users, userSettings } from '../db/schema'
import { hashPassword, verifyPassword } from '../lib/hash'
import { signToken, setAuthCookie, clearAuthCookie } from '../lib/auth'
import { authenticate } from '../middleware/authenticate'
import { eq } from 'drizzle-orm'
import { seedHabitsForUser } from './habits'

const router = Router()

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many login attempts, try again in 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
})

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(100),
})

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

router.post('/register', async (req, res) => {
  const parsed = RegisterSchema.safeParse(req.body)
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return }

  const { email, password, name } = parsed.data

  const existing = await db.select().from(users).where(eq(users.email, email.toLowerCase()))
  if (existing.length > 0) { res.status(409).json({ error: 'Email already registered' }); return }

  const passwordHash = await hashPassword(password)
  const [user] = await db.insert(users).values({
    email: email.toLowerCase(),
    passwordHash,
    name,
  }).returning()

  await db.insert(userSettings).values({ userId: user.id })
  await seedHabitsForUser(user.id)

  const token = signToken(user.id)
  setAuthCookie(res, token)
  res.status(201).json({ id: user.id, email: user.email, name: user.name })
})

router.post('/login', loginLimiter, async (req, res) => {
  const parsed = LoginSchema.safeParse(req.body)
  if (!parsed.success) { res.status(400).json({ error: 'Invalid credentials' }); return }

  const { email, password } = parsed.data
  const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase()))
  if (!user) { res.status(401).json({ error: 'Invalid credentials' }); return }

  const valid = await verifyPassword(password, user.passwordHash)
  if (!valid) { res.status(401).json({ error: 'Invalid credentials' }); return }

  const token = signToken(user.id)
  setAuthCookie(res, token)
  res.json({ id: user.id, email: user.email, name: user.name })
})

router.post('/logout', authenticate, (_req, res) => {
  clearAuthCookie(res)
  res.json({ ok: true })
})

router.post('/change-password', authenticate, async (req, res) => {
  const parsed = z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8),
  }).safeParse(req.body)
  if (!parsed.success) { res.status(400).json({ error: 'New password must be at least 8 characters' }); return }

  const [user] = await db.select().from(users).where(eq(users.id, req.userId))
  if (!user) { res.status(404).json({ error: 'User not found' }); return }

  const valid = await verifyPassword(parsed.data.currentPassword, user.passwordHash)
  if (!valid) { res.status(401).json({ error: 'Current password is incorrect' }); return }

  const passwordHash = await hashPassword(parsed.data.newPassword)
  await db.update(users).set({ passwordHash }).where(eq(users.id, req.userId))
  res.json({ ok: true })
})

router.post('/reset-password', async (req, res) => {
  const parsed = z.object({
    email: z.string().email(),
    newPassword: z.string().min(8),
    adminKey: z.string().min(1),
  }).safeParse(req.body)
  if (!parsed.success) { res.status(400).json({ error: 'Invalid request' }); return }

  const expectedKey = process.env.ADMIN_RESET_KEY
  if (!expectedKey || parsed.data.adminKey !== expectedKey) {
    res.status(401).json({ error: 'Invalid admin key' }); return
  }

  const [user] = await db.select().from(users).where(eq(users.email, parsed.data.email.toLowerCase()))
  if (!user) { res.status(404).json({ error: 'No account with that email' }); return }

  const passwordHash = await hashPassword(parsed.data.newPassword)
  await db.update(users).set({ passwordHash }).where(eq(users.id, user.id))
  res.json({ ok: true })
})

router.get('/me', authenticate, async (req, res) => {
  const [user] = await db.select({
    id: users.id,
    email: users.email,
    name: users.name,
  }).from(users).where(eq(users.id, req.userId))

  if (!user) { res.status(404).json({ error: 'User not found' }); return }
  res.json(user)
})

export default router
