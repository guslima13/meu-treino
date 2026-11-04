const CACHE_NAME = 'meu-treino-shell-v2';

const APP_FILES = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(APP_FILES);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
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
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  if (
    req.method !== 'GET' ||
    url.origin !== self.location.origin ||
    url.pathname.endsWith('/service-worker.js')
  ) {
    return;
  }

  // HTML: prioriza sempre a versão publicada no servidor.
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req, { cache: 'no-store' });

        if (fresh && fresh.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put('./index.html', fresh.clone());
        }

        return fresh;
      } catch (err) {
        return (
          await caches.match(req) ||
          await caches.match('./index.html') ||
          Response.error()
        );
      }
    })());

    return;
  }

  // Outros arquivos: tenta atualizar pela rede e usa o cache offline.
  event.respondWith((async () => {
    try {
      const fresh = await fetch(req, { cache: 'no-cache' });

      if (fresh && fresh.ok) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(req, fresh.clone());
      }

      return fresh;
    } catch (err) {
      return (await caches.match(req)) || Response.error();
    }
  })());
});
```
