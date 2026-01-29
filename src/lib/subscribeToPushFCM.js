// subscribeToPushFCM.js - Implementación COMPLETA Firebase FCM con SW Inline
import { supabase } from './supabaseClient';
import { getFCMToken } from './firebase';

export async function subscribeToPushFCM() {
  console.log('🔥 subscribeToPushFCM INICIADA - Versión Inline SW');
  alert('🔥 FCM: Iniciando suscripción Firebase (Service Worker Inline)');

  try {
    // PASO 1: Verificar soporte
    console.log('📱 PASO 1: Verificando soporte FCM');
    alert('📱 PASO 1: Verificando soporte FCM');
    
    if (!('serviceWorker' in navigator) || !('Notification' in window)) {
      throw new Error('FCM no soportado en este navegador');
    }
    
    console.log('✅ Soporte FCM confirmado');
    alert('✅ Soporte FCM confirmado');

    // PASO 2: Solicitar permisos
    console.log('📱 PASO 2: Solicitando permisos');
    alert('📱 PASO 2: Solicitando permisos');
    
    const permission = await Notification.requestPermission();
    console.log('📱 Permission result:', permission);
    alert(`📱 Permission result: ${permission}`);
    
    if (permission !== 'granted') {
      throw new Error('Permiso de notificaciones denegado');
    }
    
    console.log('✅ Permisos concedidos');
    alert('✅ Permisos concedidos');

    // DETECTAR iOS y advertir sobre instalación PWA
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isInStandaloneMode = ('standalone' in window.navigator) && window.navigator.standalone;

    if (isIOS && !isInStandaloneMode) {
      console.log('⚠️ iOS detectado - Recomendando instalación PWA');
      alert('💡 iOS: Para mejores notificaciones, instala la app en pantalla de inicio (Compartir > Añadir a pantalla de inicio)');
    }

    // PASO 3: Crear y registrar Service Worker inline
    console.log('📱 PASO 3: Creando Service Worker inline');
    alert('📱 PASO 3: Creando SW inline (sin archivos externos)');
    
    // Código del Service Worker como string
    const swCode = `
console.log('🔥 FCM SW inline iniciado');

// Importar Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Configuración Firebase (misma que firebase.js)
const firebaseConfig = {
  apiKey: "AIzaSyAoZBfEwYI3JMqfWvxifLigL9bSat4e-0",
  authDomain: "finguide-push.firebaseapp.com",
  projectId: "finguide-push",
  storageBucket: "finguide-push.firebasestorage.app",
  messagingSenderId: "101077654783",
  appId: "1:101077654783:web:ac287c980418fb760840ca",
  measurementId: "G-BRR1CYFPJ0"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Manejar mensajes en background
messaging.onBackgroundMessage(function(payload) {
  console.log('📨 Mensaje FCM recibido en background:', payload);
  
  const notificationTitle = payload.notification?.title || 'FinGuide Alert';
  const notificationOptions = {
    body: payload.notification?.body || 'Tienes una nueva notificación financiera',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
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
      type: payload.data?.type || 'financial'
    }
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Click en notificación
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
});

// Push event adicional (compatibilidad)
self.addEventListener('push', function(event) {
  console.log('📨 Push event recibido:', event);
  
  if (event.data) {
    try {
      const data = event.data.json();
      console.log('📊 Push data:', data);
      
      const title = data.notification?.title || 'FinGuide';
      const options = {
        body: data.notification?.body || 'Nueva actualización financiera',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
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

console.log('🔥 Firebase FCM Service Worker inline cargado exitosamente');
`;

    // Crear Blob del Service Worker y registrar
    const swBlob = new Blob([swCode], { type: 'application/javascript' });
    const swUrl = URL.createObjectURL(swBlob);
    
    let registration;
    try {
      registration = await navigator.serviceWorker.register(swUrl, {
        scope: '/'
      });
      
      console.log('✅ Service Worker inline registrado:', registration.scope);
      alert('✅ SW inline registrado exitosamente');
      
      // Limpiar URL del blob después del registro
      URL.revokeObjectURL(swUrl);
    } catch (swError) {
      console.error('❌ Error registrando SW inline:', swError);
      // Fallback: intentar usar SW existente si hay uno
      try {
        const existingRegistration = await navigator.serviceWorker.getRegistration();
        if (existingRegistration) {
          registration = existingRegistration;
          console.log('✅ Usando SW existente como fallback');
          alert('✅ Usando SW existente como fallback');
        } else {
          throw new Error('No hay Service Worker disponible');
        }
      } catch (fallbackError) {
        throw new Error('No se pudo registrar ningún Service Worker: ' + fallbackError.message);
      }
    }
    
    // Esperar a que esté activo
    await navigator.serviceWorker.ready;
    console.log('✅ Service Worker ready');
    alert('✅ Service Worker ready');

    // PASO 4: Obtener token FCM
    console.log('📱 PASO 4: Obteniendo token FCM');
    alert('📱 PASO 4: Obteniendo token FCM');
    
    const token = await getFCMToken();
    
    if (!token) {
      throw new Error('No se pudo obtener token FCM');
    }
    
    console.log('🎉 Token FCM obtenido:', token.substring(0, 20) + '...');
    alert(`🎉 Token FCM obtenido: ${token.substring(0, 20)}...`);

    // PASO 5: Obtener usuario
    console.log('📱 PASO 5: Obteniendo usuario Supabase');
    alert('📱 PASO 5: Obteniendo usuario Supabase');
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('❌ Error usuario:', userError);
      throw new Error('Usuario no autenticado');
    }
    
    console.log('✅ Usuario obtenido:', user.id);
    alert(`✅ Usuario: ${user.id.substring(0, 8)}...`);

    // PASO 6: Guardar en base de datos
    console.log('📱 PASO 6: Guardando token FCM en DB');
    alert('📱 PASO 6: Guardando token FCM en DB');
    
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: user.id,
        subscription: {
          fcm_token: token,
          type: 'fcm_inline',
          endpoint: `https://fcm.googleapis.com/fcm/send/${token}`,
          created_via: 'firebase_inline_sw',
          device_info: {
            userAgent: navigator.userAgent,
            isIOS: isIOS,
            isStandalone: isInStandaloneMode,
            timestamp: new Date().toISOString()
          }
        },
        endpoint: `https://fcm.googleapis.com/fcm/send/${token}`,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (error) {
      console.error('❌ Error guardando:', error);
      alert(`❌ Error DB: ${error.message}`);
      throw error;
    }
    
    console.log('✅ Token FCM guardado en DB');
    alert('✅ Token FCM guardado en DB');

    // PASO 7: Configurar listener de mensajes en foreground
    console.log('📱 PASO 7: Configurando listeners foreground');
    alert('📱 PASO 7: Configurando listeners foreground');
    
    try {
      const { onMessageListener } = await import('./firebase');
      
      // Configurar listener para mensajes cuando la app está abierta
      onMessageListener()
        .then((payload) => {
          console.log('📨 Mensaje en foreground:', payload);
          
          // Mostrar notificación local si la app está abierta
          if (Notification.permission === 'granted') {
            new Notification(
              payload.notification?.title || 'FinGuide',
              {
                body: payload.notification?.body || 'Nueva notificación financiera',
                icon: '/favicon.ico',
                tag: 'finguide-foreground',
                requireInteraction: true
              }
            );
          }
        })
        .catch((err) => console.log('❌ Error listener foreground:', err));
      
      console.log('✅ Listeners foreground configurados');
      alert('✅ Listeners foreground configurados');
    } catch (listenerError) {
      console.warn('⚠️ No se pudieron configurar listeners foreground:', listenerError);
      // No es crítico, continuar sin listeners
    }

    // PASO 8: Notificación de prueba
    console.log('📱 PASO 8: Enviando notificación de prueba');
    alert('📱 PASO 8: Notificación de prueba');
    
    // Mostrar notificación de confirmación
    if (Notification.permission === 'granted') {
      new Notification('🎉 FinGuide Activado', {
        body: 'Las notificaciones push están ahora activas. Recibirás alertas sobre tus finanzas.',
        icon: '/favicon.ico',
        tag: 'finguide-activation',
        requireInteraction: true
      });
    }

    // PASO 9: Finalización
    console.log('🎉 subscribeToPushFCM COMPLETADA EXITOSAMENTE');
    alert('🎉 FCM: ¡Suscripción completada exitosamente!');
    
    return {
      token,
      type: 'fcm_inline',
      success: true,
      registration_scope: registration.scope,
      ios_info: isIOS ? { isStandalone: isInStandaloneMode } : null
    };

  } catch (error) {
    console.error('❌ ERROR EN subscribeToPushFCM:', error);
    console.error('❌ Error stack:', error.stack);
    
    alert(`❌ ERROR FCM: ${error.message}`);
    
    // Si FCM falla completamente, ofrecer fallback a notificaciones locales
    if (error.message.includes('Service Worker') || error.message.includes('FCM')) {
      console.log('🔄 Intentando fallback a notificaciones locales...');
      alert('🔄 FCM falló, intentando notificaciones locales...');
      
      try {
        return await subscribeToPushLocal();
      } catch (fallbackError) {
        console.error('❌ Fallback también falló:', fallbackError);
        throw new Error(`FCM falló: ${error.message}. Fallback falló: ${fallbackError.message}`);
      }
    }
    
    throw error;
  }
}

// 🔄 Función de fallback para notificaciones locales únicamente
export async function subscribeToPushLocal() {
  console.log('📱 subscribeToPushLocal INICIADA (fallback)');
  alert('📱 Activando notificaciones locales (fallback)');

  try {
    // Solo solicitar permisos de notificación
    const permission = await Notification.requestPermission();
    
    if (permission !== 'granted') {
      throw new Error('Permisos de notificación denegados');
    }

    // Crear token local simple
    const localToken = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Obtener usuario y guardar
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('Usuario no autenticado');
    }

    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: user.id,
        subscription: {
          type: 'local_only',
          token: localToken,
          created_via: 'local_notifications_fallback',
          device_info: {
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
          }
        },
        endpoint: `local://${localToken}`,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (error) throw error;

    console.log('✅ Notificaciones locales activadas');
    alert('✅ Notificaciones locales activadas');
    
    // Mostrar notificación de confirmación
    new Notification('📱 FinGuide - Modo Local', {
      body: 'Notificaciones locales activadas. Recibirás alertas cuando uses la app.',
      icon: '/favicon.ico',
      tag: 'finguide-local-activation'
    });

    return { 
      success: true, 
      type: 'local_only',
      token: localToken 
    };

  } catch (error) {
    console.error('❌ Error en fallback local:', error);
    alert(`❌ Error notificaciones locales: ${error.message}`);
    throw error;
  }
}

// 🗑️ Función para desuscribir (compatible con ambos tipos)
export async function unsubscribeFromPushFCM() {
  console.log('🗑️ Desuscribiendo de push notifications...');
  
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('Usuario no autenticado');
    }

    // Eliminar de la base de datos
    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', user.id);

    if (error) {
      console.error('❌ Error eliminando suscripción:', error);
      throw error;
    }

    // Intentar desregistrar service worker si existe
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        if (registration.scope.includes('firebase-cloud-messaging') || 
            registration.active?.scriptURL?.includes('firebase-messaging')) {
          await registration.unregister();
          console.log('🗑️ Service Worker FCM desregistrado');
        }
      }
    } catch (swError) {
      console.warn('⚠️ No se pudo desregistrar SW:', swError);
    }

    console.log('✅ Desuscripción completada');
    return true;
    
  } catch (error) {
    console.error('❌ Error desuscribiendo:', error);
    throw error;
  }
}