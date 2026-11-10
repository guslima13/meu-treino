const CACHE_NAME = 'meu-treino-pwa-v6';
const APP_SHELL = ['./', './index.html', './manifest.json', './icons/icon-192-v2.png', './icons/icon-512.svg'];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    try { await cache.addAll(APP_SHELL); } catch (err) { console.warn('Cache inicial parcial; o app continuará online.', err); }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('meu-treino-pwa-') && key !== CACHE_NAME).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;

  // For page navigation, prefer the live GitHub Pages version to avoid stale app updates.
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        const fresh = await fetch(req, { cache: 'no-cache' });
        if (fresh && fresh.ok) await cache.put('./index.html', fresh.clone());
        return fresh;
      } catch (err) {
        return (await cache.match(req)) || (await cache.match('./index.html')) || Response.error();
      }
    })());
    return;
  }

  // Static files: cache first, then network and update the cache.
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(req);
    if (cached) return cached;
    try {
      const response = await fetch(req);
      if (response && response.ok) await cache.put(req, response.clone());
      return response;
    } catch (err) {
      return Response.error();
    }
  })());
});
