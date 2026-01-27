/* eslint-disable no-restricted-globals */

const CACHE_NAME = 'finguide-app-v1';

// ==============================
// INSTALL
// ==============================
self.addEventListener('install', (event) => {
  console.log('Service Worker: Instalando...');
  self.skipWaiting();
});

// ==============================
// ACTIVATE
// ==============================
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activado');
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// ==============================
// FETCH
// ==============================
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = event.request.url;

  // Cache SOLO assets estáticos (seguro para finanzas)
  const isStaticAsset =
    url.includes('/static/') ||
    url.includes('/branding/') ||
    event.request.destination === 'image' ||
    event.request.destination === 'style' ||
    event.request.destination === 'script';

  if (!isStaticAsset) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          if (!response || response.status !== 200) return response;

          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });

          return response;
        })
        .catch(() => caches.match(event.request));
    })
  );
});

// ==============================
// PUSH NOTIFICATIONS
// ==============================
self.addEventListener('push', (event) => {
  console.log('Push recibido');

  let data = {};

  if (event.data) {
    try {
      // ✔ Producción real (Supabase / backend)
      data = event.data.json();
    } catch {
      // ✔ Fallback seguro (Chrome DevTools / texto plano)
      console.warn('Push payload no es JSON válido');
      data = {
        title: 'FinGuide (Test)',
        body: event.data.text(),
      };
    }
  }

  const title = data.title || 'FinGuide';

  const options = {
    body: data.body || 'Tienes una nueva notificación',
    icon: '/branding/app/FinGuide_AppIcon_192.png',
    badge: '/branding/app/FinGuide_AppIcon_192.png',
    vibrate: [200, 100, 200],

    // 🔐 TAG dinámico → evita reemplazos silenciosos
    tag: data.tag || `finguide-${Date.now()}`,

    // 🔔 Mantener visible (ideal para alertas financieras)
    requireInteraction: true,

    data: data.data || {}
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
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

console.log('Service Worker: Cargado');
