// subscribeToPushFCM.js - Nueva implementación con Firebase
import { supabase } from '../supabaseClient';
import { getFCMToken } from './firebase';

export async function subscribeToPushFCM() {
  console.log('🔥 subscribeToPushFCM INICIADA');
  console.log('🔥 FCM: Iniciando suscripción Firebase');

  try {
    // PASO 1: Verificar soporte
    console.log('📱 PASO 1: Verificando soporte FCM');
    console.log('📱 PASO 1: Verificando soporte FCM');
    
    if (!('serviceWorker' in navigator) || !('Notification' in window)) {
      throw new Error('FCM no soportado en este navegador');
    }
    
    console.log('✅ Soporte FCM confirmado');
    console.log('✅ Soporte FCM confirmado');

    // PASO 2: Solicitar permisos
    console.log('📱 PASO 2: Solicitando permisos');
    console.log('📱 PASO 2: Solicitando permisos');
    
    const permission = await Notification.requestPermission();
    console.log('📱 Permission result:', permission);
    console.log(`📱 Permission result: ${permission}`);
    
    if (permission !== 'granted') {
      throw new Error('Permiso de notificaciones denegado');
    }
    
    console.log('✅ Permisos concedidos');
    console.log('✅ Permisos concedidos');

    // PASO 3: Registrar Service Worker FCM
    console.log('📱 PASO 3: Registrando SW FCM');
    console.log('📱 PASO 3: Registrando SW FCM');
    
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/firebase-cloud-messaging-push-scope'
    });
    
    console.log('✅ Service Worker FCM registrado:', registration.scope);
    console.log(`✅ SW FCM registrado: ${registration.scope.substring(0, 50)}...`);
    
    // Esperar a que esté activo
    await navigator.serviceWorker.ready;
    console.log('✅ Service Worker FCM ready');
    console.log('✅ Service Worker FCM ready');

    // PASO 4: Obtener token FCM
    console.log('📱 PASO 4: Obteniendo token FCM');
    console.log('📱 PASO 4: Obteniendo token FCM - SIN VAPID KEYS');
    
    const token = await getFCMToken();
    
    if (!token) {
      throw new Error('No se pudo obtener token FCM');
    }
    
    console.log('🎉 Token FCM obtenido:', token.substring(0, 20) + '...');
    console.log(`🎉 Token FCM obtenido: ${token.substring(0, 20)}...`);

    // PASO 5: Obtener usuario
    console.log('📱 PASO 5: Obteniendo usuario Supabase');
    console.log('📱 PASO 5: Obteniendo usuario Supabase');
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('❌ Error usuario:', userError);
      throw new Error('Usuario no autenticado');
    }
    
    console.log('✅ Usuario obtenido:', user.id);
    console.log(`✅ Usuario: ${user.id.substring(0, 8)}...`);

    // PASO 6: Guardar en base de datos (estructura FCM)
    console.log('📱 PASO 6: Guardando token FCM en DB');
    console.log('📱 PASO 6: Guardando token FCM en DB');
    
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: user.id,
        subscription: {
          fcm_token: token,
          type: 'fcm',
          endpoint: `https://fcm.googleapis.com/fcm/send/${token}`,
          created_via: 'firebase'
        },
        endpoint: `https://fcm.googleapis.com/fcm/send/${token}`,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (error) {
      console.error('❌ Error guardando:', error);
      console.log(`❌ Error DB: ${error.message}`);
      throw error;
    }
    
    console.log('✅ Token FCM guardado en DB');
    console.log('✅ Token FCM guardado en DB');

    // PASO 7: Configurar listener de mensajes
    console.log('📱 PASO 7: Configurando listeners FCM');
    console.log('📱 PASO 7: Configurando listeners FCM');
    
    // Importar dinámicamente el listener
    const { onMessageListener } = await import('./firebase');
    
    // Configurar listener para mensajes en foreground
    onMessageListener()
      .then((payload) => {
        console.log('📨 Mensaje en foreground:', payload);
        
        // Mostrar notificación local si la app está abierta
        if (Notification.permission === 'granted') {
          new Notification(
            payload.notification?.title || 'FinGuide',
            {
              body: payload.notification?.body || 'Nueva notificación',
              icon: '/favicon-192x192.png'
            }
          );
        }
      })
      .catch((err) => console.log('❌ Error listener:', err));
    
    console.log('✅ Listeners configurados');
    console.log('✅ Listeners configurados');

    // PASO 8: Finalización
    console.log('🎉 subscribeToPushFCM COMPLETADA EXITOSAMENTE');
    console.log('🎉 FCM: ¡Suscripción completada exitosamente!');
    
    return {
      token,
      type: 'fcm',
      success: true
    };

  } catch (error) {
    console.error('❌ ERROR EN subscribeToPushFCM:', error);
    console.error('❌ Error stack:', error.stack);
    
    console.log(`❌ ERROR FCM: ${error.message}`);
    
    throw error;
  }
}

// 🗑️ Función para desuscribir FCM
export async function unsubscribeFromPushFCM() {
  console.log('🗑️ Desuscribiendo FCM...');
  
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
      console.error('❌ Error eliminando suscripción FCM:', error);
      throw error;
    }

    console.log('✅ Suscripción FCM eliminada');
    return true;
    
  } catch (error) {
    console.error('❌ Error desuscribiendo FCM:', error);
    throw error;
  }
}