const CACHE_NAME = 'dato-curioso-v2';
const DYNAMIC_CACHE = 'dato-curioso-dynamic-v2';


// Recursos esenciales de la aplicación (App Shell)
const STATIC_ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './datos.json',
  './manifest.webmanifest',
  './manifest.json',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png',
  './icons/favicon-16.png',
  'https://fonts.googleapis.com/css2?family=VT323&display=swap'
];

// Instalación: precachear recursos base
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Usar allSettled o agregar individuales para tolerancia a fallos
      try {
        await cache.addAll(STATIC_ASSETS);
      } catch (err) {
        console.warn('[SW] Algunos recursos estáticos no pudieron ser cacheados en lote, intentando uno a uno:', err);
        for (const asset of STATIC_ASSETS) {
          try {
            await cache.add(asset);
          } catch (e) {
            console.warn('[SW] No se pudo cachear:', asset, e);
          }
        }
      }
    })
  );
  self.skipWaiting();
});

// Activación: limpieza de cachés antiguas y tomar control de clientes
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== DYNAMIC_CACHE) {
            console.log('[SW] Eliminando caché obsoleta:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Intercepción de peticiones (Fetch)
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar esquemas no HTTP/HTTPS (extensiones, etc.)
  if (!url.protocol.startsWith('http')) return;

  // 1. Navegación (Páginas HTML): Network-First con fallback a caché
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) return cachedResponse;
          return caches.match('./index.html') || caches.match('./');
        })
    );
    return;
  }

  // 2. Datos JSON (datos.json): Network-First con fallback a caché para tener siempre los últimos datos
  if (url.pathname.endsWith('datos.json')) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // 3. Imágenes (ima/dia-*.jpg, icons, etc.): Cache-First con fallback a red y guardado dinámico
  if (request.destination === 'image' || url.pathname.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i)) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        }).catch((err) => {
          console.warn('[SW] Imagen no disponible offline:', url.pathname);
          // Retornar el icono SVG como fallback genérico de imagen si no hay red
          return caches.match('./icons/icon.svg');
        });
      })
    );
    return;
  }

  // 4. Fuentes de Google y otros recursos estáticos: Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, responseClone));
        }
        return networkResponse;
      }).catch(() => null);

      return cachedResponse || fetchPromise;
    })
  );
});

// 5. Gestión del clic en notificaciones locales
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlObjetivo = (event.notification.data && event.notification.data.url) ? event.notification.data.url : './index.html';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Si ya hay una pestaña o ventana abierta, enfocarla
      for (const client of windowClients) {
        if (client.url.includes('index.html') && 'focus' in client) {
          return client.focus();
        }
      }
      // Si no hay ventanas activas, abrir una nueva con index.html
      if (clients.openWindow) {
        return clients.openWindow(urlObjetivo);
      }
    })
  );
});

