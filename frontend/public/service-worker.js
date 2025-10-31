self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const req = event.request
  const url = new URL(req.url)
  // Only handle same-origin GET requests to avoid breaking cross-origin calls
  if (req.method !== 'GET' || url.origin !== self.location.origin) return
  event.respondWith(
    fetch(req).catch(async () => {
      const cached = await caches.match(req)
      return cached || new Response('', { status: 504 })
    })
  )
});

