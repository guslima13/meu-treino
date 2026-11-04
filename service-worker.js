const CACHE_NAME = 'meu-treino-v4';
const CACHE_PREFIX = 'meu-treino-';

const APP_SHELL = new URL('./index.html', self.registration.scope);

// Instala a nova versão
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.add(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

// Ativa a nova versão e apaga caches antigos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key =>
              key.startsWith(CACHE_PREFIX) &&
              key !== CACHE_NAME
            )
            .map(key => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Atualiza as páginas quando houver conexão
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  if (event.request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(event.request);

          if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(APP_SHELL, response.clone());
          }

          return response;

        } catch (error) {
          const cached = await caches.match(APP_SHELL);

          if (cached) return cached;

          throw error;
        }
      })()
    );
  }
});
