import webpush from 'web-push'
import { db } from '../db'
import { pushSubscriptions } from '../db/schema'
import { eq } from 'drizzle-orm'

const PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY
const SUBJECT = process.env.VAPID_SUBJECT ?? 'mailto:admin@anchor.local'

export const pushEnabled = Boolean(PUBLIC_KEY && PRIVATE_KEY)

if (pushEnabled) {
  webpush.setVapidDetails(SUBJECT, PUBLIC_KEY!, PRIVATE_KEY!)
}

export function getPublicKey(): string | null {
  return PUBLIC_KEY ?? null
}

export interface PushPayload {
  title: string
  body: string
  url?: string
}

export async function sendToUser(userId: string, payload: PushPayload): Promise<void> {
  if (!pushEnabled) return
  const subs = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId))
  await Promise.all(subs.map(async (sub) => {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload),
      )
    } catch (err: unknown) {
      // 404/410 = subscription expired or revoked — drop it
      const status = (err as { statusCode?: number }).statusCode
      if (status === 404 || status === 410) {
        await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, sub.endpoint))
      }
    }
  }))
}
