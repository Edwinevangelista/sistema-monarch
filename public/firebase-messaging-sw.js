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
  const notificationOptions = {
    body: payload.notification?.body || 'Tienes una nueva notificación financiera',
    icon: '/favicon-192x192.png',
    badge: '/favicon-96x96.png',
    tag: 'finguide-notification',
    requireInteraction: true,
    actions: [
      {
        action: 'open',
        title: 'Ver Dashboard'
      },
      {
        action: 'dismiss', 
        title: 'Descartar'
      }
    ],
    data: {
      url: payload.data?.url || '/dashboard',
      timestamp: Date.now(),
      type: payload.data?.type || 'general'
    }
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// 🔔 CLICK EN NOTIFICACIÓN
self.addEventListener('notificationclick', function(event) {
  console.log('👆 Click en notificación FCM:', event);
  
  event.notification.close();
  
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