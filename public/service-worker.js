/* eslint-disable no-restricted-globals */

const CACHE_NAME = 'monarch-v1';

// Instalación - cachear solo lo básico
self.addEventListener('install', (event) => {
  console.log('Service Worker: Instalando...');
  self.skipWaiting(); // Activar inmediatamente
});

// Activación
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activado');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch - solo para requests válidos
self.addEventListener('fetch', (event) => {
  // Solo cachear GET requests
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Solo cachear respuestas exitosas
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Si falla, intentar desde cache
        return caches.match(event.request);
      })
  );
});

// Push Notifications - ESTA ES LA PARTE IMPORTANTE
self.addEventListener('push', (event) => {
  console.log('Push recibido:', event);
  
  const data = event.data ? event.data.json() : {};
  
  const title = data.title || 'Sistema Monarch';
  const options = {
    body: data.body || 'Tienes una nueva notificación',
    icon: '/logo192.png',
    badge: '/logo192.png',
    vibrate: [200, 100, 200],
    tag: 'monarch-notification',
    requireInteraction: false,
    data: data.data || {}
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Click en notificación
self.addEventListener('notificationclick', (event) => {
  console.log('Notificación clickeada');
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});

console.log('Service Worker: Cargado');
