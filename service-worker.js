const CACHE_NAME = 'meu-treino-shell-v2';

const APP_FILES = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(APP_FILES);
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();

      await Promise.all(
        keys
          .filter(key =>
            key.startsWith('meu-treino-shell-') &&
            key !== CACHE_NAME
          )
          .map(key => caches.delete(key))
      );

      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;

  if (
    req.method !== 'GET' ||
    new URL(req.url).origin !== self.location.origin
  ) return;

  if (new URL(req.url).pathname.endsWith('/service-worker.js')) return;

  if (req.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req, { cache: 'no-store' });

          if (fresh && fresh.ok) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put('./index.html', fresh.clone());
          }

          return fresh;
        } catch (err) {
          return (
            await caches.match('./index.html')
          ) || Response.error();
        }
      })()
    );

    return;
  }

  event.respondWith(
    (async () => {
      const cached = await caches.match(req);

      if (cached) return cached;

      try {
        const fresh = await fetch(req, { cache: 'no-cache' });

        if (fresh && fresh.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(req, fresh.clone());
        }

        return fresh;
      } catch (err) {
        return Response.error();
      }
    })()
  );
});
