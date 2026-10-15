const CACHE_NAME = 'sonora-shell-v1';

// Pre-cache core application shell assets
const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/offline',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // CRITICAL RULE: NEVER cache audio stream endpoints inside Service Worker cache!
  // Audio streaming uses HTTP Range requests (206) which fail in standard Cache API,
  // and explicitly downloaded offline songs are managed by IndexedDB.
  if (url.pathname.startsWith('/api/stream')) {
    return; // Pass through directly to network/native audio engine
  }

  // Network-first for dynamic API data, Cache-first for static assets
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(JSON.stringify({ error: 'Network unavailable. Running offline.' }), {
          headers: { 'Content-Type': 'application/json' },
          status: 503,
        });
      })
    );
    return;
  }

  // App shell and static chunks: stale-while-revalidate strategy
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch background update
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
          }
        }).catch(() => {});
        return cachedResponse;
      }
      return fetch(event.request).catch(() => {
        // Fallback to offline navigation shell for page navigations
        if (event.request.mode === 'navigate') {
          return caches.match('/offline') || caches.match('/');
        }
      });
    })
  );
});
