// No offline caching: auth pages and API responses must not be cached here.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()))
function binding(write, userId) {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open('hk-push-binding', 1)
    open.onupgradeneeded = () => open.result.createObjectStore('settings')
    open.onerror = () => reject(open.error)
    open.onsuccess = () => {
      const db = open.result
      const tx = db.transaction('settings', write ? 'readwrite' : 'readonly')
      const request = write ? tx.objectStore('settings').put(userId, 'user') : tx.objectStore('settings').get('user')
      tx.oncomplete = () => { db.close(); resolve(write ? userId : request.result) }
      tx.onerror = () => { db.close(); reject(tx.error) }
    }
  })
}
self.addEventListener('message', event => {
  if (event.data?.type !== 'HK_BIND_USER') return
  event.waitUntil(binding(true, event.data.userId).then(() => event.ports[0]?.postMessage({ ok: true })).catch(() => event.ports[0]?.postMessage({ ok: false })))
})
self.addEventListener('push', event => {
  event.waitUntil((async () => {
    let payload
    try { payload = event.data.json() } catch { return }
    if (!payload?.userId || payload.userId !== await binding(false)) return
    await self.registration.showNotification(payload.title || '한끼루프', {
      body: payload.body, tag: payload.id, data: { userId: payload.userId, path: payload.path },
    })
  })())
})
self.addEventListener('notificationclick', event => {
  event.notification.close()
  event.waitUntil((async () => {
    if (event.notification.data?.userId !== await binding(false)) return
    const url = new URL(event.notification.data?.path || '/fridge', self.location.origin)
    if (url.origin !== self.location.origin || !/^\/(fridge|recipe)(\/|$)/.test(url.pathname)) return
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    for (const client of windows) {
      if (new URL(client.url).origin === url.origin) { await client.navigate(url.href); return client.focus() }
    }
    return self.clients.openWindow(url.href)
  })())
})
