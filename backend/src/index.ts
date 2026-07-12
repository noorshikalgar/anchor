import 'dotenv/config'
import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'

import authRouter from './routes/auth'
import habitsRouter from './routes/habits'
import checkinsRouter from './routes/checkins'
import dayLogsRouter from './routes/dayLogs'
import settingsRouter from './routes/settings'
import slotsRouter from './routes/slots'
import planRouter from './routes/plan'
import pushRouter from './routes/push'
import coachRouter from './routes/coach'
import { startReminderScheduler } from './lib/reminders'

const app = express()
const PORT = process.env.PORT ?? 3001

app.set('trust proxy', 1)
app.use(express.json())
app.use(cookieParser())

app.use(cors({
  origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  credentials: true,
}))

app.use('/auth', authRouter)
app.use('/api/habits', habitsRouter)
app.use('/api/checkins', checkinsRouter)
app.use('/api/daylogs', dayLogsRouter)
app.use('/api/settings', settingsRouter)
app.use('/api/slots', slotsRouter)
app.use('/api/plan', planRouter)
app.use('/api/push', pushRouter)
app.use('/api/coach', coachRouter)

app.get('/health', (_req, res) => res.json({ ok: true }))

app.listen(PORT, () => {
  console.log(`Anchor backend running on :${PORT}`)
  startReminderScheduler()
})
