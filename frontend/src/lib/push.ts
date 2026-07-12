import { api } from './api'

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(b64)
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}

export function pushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

export async function getPushState(): Promise<'unsupported' | 'denied' | 'subscribed' | 'off'> {
  if (!pushSupported()) return 'unsupported'
  if (Notification.permission === 'denied') return 'denied'
  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.getSubscription()
  return sub ? 'subscribed' : 'off'
}

export async function subscribePush(): Promise<void> {
  const { publicKey } = await api.get<{ publicKey: string }>('/api/push/publickey')
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new Error('Notification permission not granted')
  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  })
  await api.post('/api/push/subscribe', sub.toJSON())
}

export async function unsubscribePush(): Promise<void> {
  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.getSubscription()
  if (!sub) return
  await api.post('/api/push/unsubscribe', { endpoint: sub.endpoint })
  await sub.unsubscribe()
}

export async function sendTestPush(): Promise<void> {
  await api.post('/api/push/test', {})
}
