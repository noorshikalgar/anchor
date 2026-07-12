import cron from 'node-cron'
import { db } from '../db'
import { habits, checkins, pushSubscriptions } from '../db/schema'
import { and, eq, ne } from 'drizzle-orm'
import { pushEnabled, sendToUser } from './push'

const REMINDER_HOUR = Number(process.env.REMINDER_HOUR ?? 20)

function todayStr(): string {
  // Server-local date — set TZ env so "today" matches the household's timezone
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

async function sendEveningReminders(): Promise<void> {
  const today = todayStr()
  const subscribedUsers = await db.selectDistinct({ userId: pushSubscriptions.userId }).from(pushSubscriptions)

  for (const { userId } of subscribedUsers) {
    const focus = await db.select().from(habits)
      .where(and(eq(habits.userId, userId), eq(habits.inFocus, 1)))
    if (focus.length === 0) continue

    const logged = await db.select().from(checkins)
      .where(and(eq(checkins.userId, userId), eq(checkins.date, today), ne(checkins.status, 'pending')))
    const loggedIds = new Set(logged.map((c) => c.habitId))
    const pending = focus.filter((h) => !loggedIds.has(h.id))
    if (pending.length === 0) continue

    const names = pending.slice(0, 3).map((h) => h.name).join(', ')
    await sendToUser(userId, {
      title: 'Evening check-in',
      body: pending.length === 1
        ? `${names} is still unlogged today.`
        : `${pending.length} habits still unlogged: ${names}${pending.length > 3 ? '…' : ''}`,
      url: '/',
    })
  }
}

export function startReminderScheduler(): void {
  if (!pushEnabled) {
    console.log('Push not configured (VAPID keys missing) — reminders disabled')
    return
  }
  cron.schedule(`0 ${REMINDER_HOUR} * * *`, () => {
    sendEveningReminders().catch((err) => console.error('Reminder run failed:', err))
  })
  console.log(`Evening reminder scheduled daily at ${REMINDER_HOUR}:00 (server TZ)`)
}
