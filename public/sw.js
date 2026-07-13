// Service Worker avec stratégies de cache
const CACHE_NAME = 'garba-drinks-v1';
const ASSETS_CACHE = 'garba-drinks-assets-v1';
const DATA_CACHE = 'garba-drinks-data-v1';

// Assets statiques à pré-cacher
const PRECACHE_ASSETS = [
  '/',
  '/offline',
];

// Installation du Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS)),
      self.skipWaiting(),
    ])
  );
});

// Activation
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (
            cacheName !== CACHE_NAME &&
            cacheName !== ASSETS_CACHE &&
            cacheName !== DATA_CACHE
          ) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Interception des requêtes
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorer les requêtes non-HTTP(S)
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Pour les assets statiques: cache-first
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Pour les requêtes API: network-first
  if (url.pathname.startsWith('/api/') || url.hostname.includes('supabase')) {
    event.respondWith(networkFirstWithFallback(request));
    return;
  }

  // Pour les pages: stale-while-revalidate
  event.respondWith(staleWhileRevalidate(request));
});

// Stratégie: Cache-First (pour assets)
function cacheFirst(request) {
  return caches.match(request).then((response) => {
    if (response) {
      return response;
    }
    return fetch(request).then((response) => {
      if (!response || response.status !== 200 || response.type !== 'basic') {
        return response;
      }
      const responseToCache = response.clone();
      caches.open(ASSETS_CACHE).then((cache) => {
        cache.put(request, responseToCache);
      });
      return response;
    });
  });
}

// Stratégie: Network-First avec fallback cache
function networkFirstWithFallback(request) {
  return fetch(request)
    .then((response) => {
      if (!response || response.status !== 200 || response.type !== 'basic') {
        return response;
      }
      const responseToCache = response.clone();
      caches.open(DATA_CACHE).then((cache) => {
        cache.put(request, responseToCache);
      });
      return response;
    })
    .catch(() => {
      return caches.match(request).then((response) => {
        if (response) {
          return response;
        }
        // Retourner une page offline si disponible
        return caches.match('/offline');
      });
    });
}

// Stratégie: Stale-While-Revalidate (pour les pages)
function staleWhileRevalidate(request) {
  return caches.match(request).then((cachedResponse) => {
    const fetchPromise = fetch(request).then((response) => {
      if (!response || response.status !== 200 || response.type !== 'basic') {
        return response;
      }
      const responseToCache = response.clone();
      caches.open(CACHE_NAME).then((cache) => {
        cache.put(request, responseToCache);
      });
      return response;
    });

    return cachedResponse || fetchPromise;
  });
}

// Déterminer si c'est un asset statique
function isStaticAsset(pathname) {
  return (
    /\.(js|css|woff2?|ttf|eot|svg|png|jpg|jpeg|gif|webp|ico|json)$/.test(
      pathname
    ) ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/icons/')
  );
}

// Écoute pour synchroniser les ventes en attente au retour du réseau
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SYNC_PENDING_VENTES') {
    // Message reçu depuis le client
    syncPendingVentes();
  }
});

// Fonction auxiliaire pour la synchronisation (sera complétée avec IndexedDB)
function syncPendingVentes() {
  // Cette fonction sera appelée en parallèle avec IndexedDB côté client
  console.log('[SW] Synchronisation des ventes en attente...');
}
