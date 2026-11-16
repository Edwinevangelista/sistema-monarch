// firebase-messaging-sw.js - Service Worker FCM COMPLETO
// ⚠️ IMPORTANTE: Este archivo debe ir en /public/firebase-messaging-sw.js

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// 🔥 CONFIGURACIÓN FIREBASE REAL (misma que firebase.js)
const firebaseConfig = {
  apiKey: "AIzaSyAoZBfEwYI3JMqfWvxifLigL9bSat4e-0",
  authDomain: "finguide-push.firebaseapp.com",
  projectId: "finguide-push",
  storageBucket: "finguide-push.firebasestorage.app",
  messagingSenderId: "101077654783",
  appId: "1:101077654783:web:ac287c980418fb760840ca",
  measurementId: "G-BRR1CYFPJ0"
};

// Inicializar Firebase en Service Worker
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// 🎯 MANEJAR MENSAJES EN BACKGROUND
messaging.onBackgroundMessage(function(payload) {
  console.log('📨 Mensaje FCM recibido en background:', payload);
  
  const notificationTitle = payload.notification?.title || 'FinGuide Alert';
  // Fase 2: pasar el token y los datos del pago para la acción
  // "Marcar pagado" (si el servidor los mandó en payload.data).
  const datosPago = payload.data || {};
  const acciones = datosPago.token
    ? [
        { action: 'marcar-pagado', title: 'Marcar pagado' },
        { action: 'open', title: 'Ver Dashboard' },
      ]
    : [
        { action: 'open', title: 'Ver Dashboard' },
        { action: 'dismiss', title: 'Descartar' },
      ];
  const notificationOptions = {
    body: payload.notification?.body || 'Tienes una nueva notificación financiera',
    icon: '/favicon-192x192.png',
    badge: '/favicon-96x96.png',
    tag: 'finguide-notification',
    requireInteraction: true,
    actions: acciones,
    data: {
      url: datosPago.url || '/dashboard',
      timestamp: Date.now(),
      type: datosPago.type || 'general',
      tipoItem: datosPago.tipoItem,
      itemId: datosPago.itemId,
      monto: datosPago.monto,
      nombre: datosPago.nombre,
      token: datosPago.token,
    }
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// 🔔 CLICK EN NOTIFICACIÓN
self.addEventListener('notificationclick', function(event) {
  console.log('👆 Click en notificación FCM:', event);

  event.notification.close();

  const data = event.notification.data || {};

  // Fase 2: "Marcar pagado" con token — marca en el servidor con la
  // app cerrada, igual que en service-worker.js. Sin token, abre la
  // app con ?accion=marcar-pagado (fallback de Fase 1).
  if (event.action === 'marcar-pagado' && data.tipoItem && data.itemId) {
    const abrirApp = () => clients.openWindow(
      'https://sistema-monarch.vercel.app/?accion=marcar-pagado&tipo='
      + encodeURIComponent(data.tipoItem) + '&id=' + encodeURIComponent(data.itemId)
    );
    if (!data.token) {
      event.waitUntil(abrirApp());
      return;
    }
    event.waitUntil(
      (async () => {
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 15000);
          let resp;
          try {
            resp = await fetch(self.location.origin + '/api/marcar-pagado', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token: data.token }),
              signal: controller.signal,
            });
          } finally {
            clearTimeout(timer);
          }
          const resultado = resp && resp.ok ? await resp.json().catch(() => null) : null;
          if (!resultado || resultado.ok !== true) throw new Error('fallo al marcar');
          return self.registration.showNotification(
            resultado.yaProcesado
              ? 'Ya estaba pagado: ' + (resultado.nombre || data.nombre || 'Pago')
              : '✅ Pagado: ' + (resultado.nombre || data.nombre || 'Pago'),
            {
              body: resultado.yaProcesado
                ? 'Este pago ya estaba marcado, no se duplicó.'
                : '$' + Number(resultado.monto ?? data.monto ?? 0).toLocaleString('es') + ' marcado como pagado',
              icon: '/favicon-192x192.png',
              tag: 'finguide-pagado-' + data.itemId,
              data: { url: '/dashboard' },
            }
          );
        } catch {
          return self.registration.showNotification('No se pudo marcar pagado', {
            body: (data.nombre || 'Pago') + ' — toca para abrir la app y marcarlo ahí',
            icon: '/favicon-192x192.png',
            tag: 'finguide-pagado-error-' + data.itemId,
            data: { accion: 'marcar-pagado', tipoItem: data.tipoItem, itemId: data.itemId },
          });
        }
      })()
    );
    return;
  }

  // La notificación de error trae accion=marcar-pagado: abrir la app
  // para marcar el pago ahí.
  if (data.accion === 'marcar-pagado' && data.tipoItem && data.itemId) {
    event.waitUntil(
      clients.openWindow(
        'https://sistema-monarch.vercel.app/?accion=marcar-pagado&tipo='
        + encodeURIComponent(data.tipoItem) + '&id=' + encodeURIComponent(data.itemId)
      )
    );
    return;
  }

  if (event.action === 'open' || !event.action) {
    const urlToOpen = event.notification.data?.url || '/dashboard';
    
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then(clientList => {
        // Si hay ventana de FinGuide abierta, enfocarla
        for (const client of clientList) {
          if (client.url.includes('sistema-monarch.vercel.app') && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Si no, abrir nueva ventana
        if (clients.openWindow) {
          return clients.openWindow('https://sistema-monarch.vercel.app' + urlToOpen);
        }
      })
    );
  }
  // Si es 'dismiss', no hacer nada (ya se cerró)
});

// 📧 PUSH EVENT (para compatibilidad adicional)
self.addEventListener('push', function(event) {
  console.log('📨 Push event recibido:', event);
  
  if (event.data) {
    try {
      const data = event.data.json();
      console.log('📊 Push data:', data);
      
      const title = data.notification?.title || 'FinGuide';
      const options = {
        body: data.notification?.body || 'Nueva actualización financiera',
        icon: '/favicon-192x192.png',
        badge: '/favicon-96x96.png',
        tag: 'finguide-push'
      };
      
      event.waitUntil(
        self.registration.showNotification(title, options)
      );
    } catch (error) {
      console.error('❌ Error procesando push data:', error);
    }
  }
});

console.log('🔥 Firebase FCM Service Worker cargado exitosamente');