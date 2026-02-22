/* eslint-disable no-restricted-globals */

const CACHE_NAME = 'finguide-app-v3';

// ==============================
// INSTALL — tomar control inmediatamente
// ==============================
self.addEventListener('install', (event) => {
  console.log('Service Worker: Instalando v3...');
  // Forzar activación inmediata sin esperar que se cierren tabs viejas
  event.waitUntil(self.skipWaiting());
});

// ==============================
// ACTIVATE — limpiar caches viejos y tomar control
// ==============================
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activado v3');
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cacheName) => {
          // Eliminar CUALQUIER cache viejo
          if (cacheName !== CACHE_NAME) {
            console.log('SW: Eliminando cache viejo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      )
    ).then(() => {
      // Tomar control de todos los clientes inmediatamente
      return self.clients.claim();
    })
  );
});

// ==============================
// FETCH — Network-first para JS/CSS, cache para imágenes
// ==============================
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = event.request.url;

  // Para scripts y estilos: SIEMPRE red primero (nunca servir JS viejo)
  const isScript = url.includes('/static/js/') || url.includes('/static/css/');
  if (isScript) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Para imágenes y otros assets estáticos: cache-first
  const isStaticAsset =
    url.includes('/branding/') ||
    event.request.destination === 'image';

  if (!isStaticAsset) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200) return response;
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return response;
      });
    })
  );
});

// ==============================
// PUSH NOTIFICATIONS
// ==============================
self.addEventListener('push', (event) => {
  console.log('Push recibido');

  let data = {
    title: 'FinGuide',
    body: 'Tienes una nueva notificación',
    data: {}
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      console.warn('Push payload no es JSON válido');
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/branding/app/FinGuide_AppIcon_192.png',
    badge: '/branding/app/FinGuide_AppIcon_192.png',
    vibrate: [200, 100, 200],
    tag: data.tag || `finguide-${Date.now()}`,
    requireInteraction: true,
    data: data.data || {}
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// ==============================
// NOTIFICATION CLICK
// ==============================
self.addEventListener('notificationclick', (event) => {
  console.log('Notificación clickeada');
  event.notification.close();

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(url) && 'focus' in client) {
            return client.focus();
          }
        }
        return clients.openWindow(url);
      })
  );
});

console.log('Service Worker v3: Cargado');
