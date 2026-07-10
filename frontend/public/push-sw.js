// Imported into the generated Workbox service worker via vite.config workbox.importScripts
self.addEventListener('push', (event) => {
  let data = {}
  try { data = event.data ? event.data.json() : {} } catch { /* ignore bad payloads */ }
  event.waitUntil(
    self.registration.showNotification(data.title || 'Anchor', {
      body: data.body || '',
      icon: '/anchor.svg',
      badge: '/anchor.svg',
      data: { url: data.url || '/' },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
      for (const win of wins) {
        if ('focus' in win) return win.focus()
      }
      return clients.openWindow(url)
    }),
  )
})
