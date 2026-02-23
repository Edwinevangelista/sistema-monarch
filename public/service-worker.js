/* eslint-disable no-restricted-globals */
// FinGuide Service Worker v4
// ✅ Web Push real: recibe eventos push del servidor aunque la app esté cerrada

const CACHE_NAME = 'finguide-app-v4';

// ==============================
// INSTALL
// ==============================
self.addEventListener('install', (event) => {
  console.log('SW v4: Instalando...');
  event.waitUntil(self.skipWaiting());
});

// ==============================
// ACTIVATE
// ==============================
self.addEventListener('activate', (event) => {
  console.log('SW v4: Activado');
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('SW: Eliminando cache viejo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

// ==============================
// FETCH — Network-first para JS/CSS, cache para imágenes
// ==============================
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = event.request.url;

  const isScript = url.includes('/static/js/') || url.includes('/static/css/') || url.includes('/assets/');
  if (isScript) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  const isStaticAsset = url.includes('/branding/') || url.includes('/icons/') || event.request.destination === 'image';
  if (!isStaticAsset) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200) return response;
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      });
    })
  );
});

// ==============================
// PUSH — recibe notificaciones del servidor (app cerrada ✅)
// ==============================
self.addEventListener('push', (event) => {
  console.log('SW v4: Push recibido');

  let payload = {
    title: 'FinGuide',
    body: 'Tienes una nueva notificación',
    tag: 'finguide-' + Date.now(),
    requireInteraction: false,
    data: { url: '/' }
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      payload = { ...payload, ...parsed };
    } catch {
      payload.body = event.data.text();
    }
  }

  const options = {
    body: payload.body,
    icon: '/icons/FinGuide_AppIcon_192.png',
    badge: '/icons/FinGuide_AppIcon_192.png',
    vibrate: [200, 100, 200],
    tag: payload.tag,
    requireInteraction: payload.requireInteraction || false,
    silent: false,
    data: payload.data || { url: '/' }
  };

  event.waitUntil(
    self.registration.showNotification(payload.title, options)
  );
});

// ==============================
// NOTIFICATION CLICK
// ==============================
self.addEventListener('notificationclick', (event) => {
  console.log('SW v4: Notificación clickeada');
  event.notification.close();

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Buscar tab ya abierto con la app
        for (const client of clientList) {
          if ('focus' in client) {
            client.focus();
            if (client.navigate) client.navigate(url);
            return;
          }
        }
        // Abrir nueva ventana si no hay ninguna abierta
        return clients.openWindow(url);
      })
  );
});

// ==============================
// PUSH SUBSCRIPTION CHANGE — renovar suscripción automáticamente
// ==============================
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('SW v4: Suscripción push cambió, renovando...');
  // El cliente JS manejará la renovación cuando vuelva a abrir la app
  // via initializeNotificationsOnLoad()
  event.waitUntil(Promise.resolve());
});

console.log('SW v4: Cargado ✅');
