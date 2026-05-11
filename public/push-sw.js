// TicketFlow Push Notification Worker
self.addEventListener('push', function (event) {
  if (!event.data) return

  const data = event.data.json()

  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url ?? '/',
      notificationId: data.notificationId,
    },
    actions: data.actions ?? [],
    tag: data.tag ?? 'ticketflow-notification',
    requireInteraction: data.requireInteraction ?? false,
  }

  event.waitUntil(self.registration.showNotification(data.title, options))
})

self.addEventListener('notificationclick', function (event) {
  event.notification.close()

  const url = event.notification.data?.url ?? '/'
  const notificationId = event.notification.data?.notificationId

  // Marcar como lida no servidor
  if (notificationId) {
    fetch('/api/notifications/' + notificationId + '/read', {
      method: 'POST',
    }).catch(() => {})
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focar aba já aberta se existir
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus()
        }
      }
      // Abrir nova aba
      if (clients.openWindow) {
        return clients.openWindow(url)
      }
    })
  )
})

self.addEventListener('notificationclose', function (event) {
  console.log('[SW] Notification dismissed:', event.notification.tag)
})
