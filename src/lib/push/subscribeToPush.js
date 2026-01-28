import { supabase } from '../supabaseClient';

function urlBase64ToUint8Array(base64String) {
  console.log('🔧 urlBase64ToUint8Array iniciada');
  alert('🔧 Conversión VAPID iniciada');
  
  let cleaned = base64String.replace(/^["']|["']$/g, '').trim();
  const padding = '='.repeat((4 - (cleaned.length % 4)) % 4);
  const base64 = (cleaned + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const raw = atob(base64);
  const result = Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
  
  console.log('✅ urlBase64ToUint8Array completada');
  alert('✅ Conversión VAPID completada');
  
  return result;
}

export async function subscribeToPush(VAPID_PUBLIC_KEY) {
  // 🚨 LOGGING EXTREMO
  console.log('🔔 subscribeToPush INICIADA');
  console.log('🔔 VAPID recibida:', VAPID_PUBLIC_KEY ? 'EXISTE' : 'UNDEFINED');
  alert('🔔 subscribeToPush INICIADA - ¿VES ESTE ALERT?');
  alert(`🔔 VAPID recibida: ${VAPID_PUBLIC_KEY ? 'EXISTE' : 'UNDEFINED'}`);

  try {
    // PASO 1: Verificar soporte
    console.log('📱 PASO 1: Verificando soporte del navegador');
    alert('📱 PASO 1: Verificando soporte del navegador');
    
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.error('❌ Push no soportado');
      alert('❌ Push no soportado en este navegador');
      throw new Error('Push no soportado en este navegador');
    }
    
    console.log('✅ Soporte confirmado');
    alert('✅ Soporte confirmado');

    // PASO 2: Solicitar permisos
    console.log('📱 PASO 2: Solicitando permisos');
    alert('📱 PASO 2: Solicitando permisos');
    
    const permission = await Notification.requestPermission();
    console.log('📱 Permission result:', permission);
    alert(`📱 Permission result: ${permission}`);
    
    if (permission !== 'granted') {
      console.error('❌ Permisos denegados');
      alert('❌ Permisos denegados');
      throw new Error('Permiso de notificaciones denegado');
    }
    
    console.log('✅ Permisos concedidos');
    alert('✅ Permisos concedidos');

    // PASO 3: Service Worker
    console.log('📱 PASO 3: Obteniendo service worker');
    alert('📱 PASO 3: Obteniendo service worker');
    
    const registration = await navigator.serviceWorker.ready;
    console.log('✅ Service worker ready:', {
      scope: registration.scope,
      state: registration.active?.state
    });
    alert(`✅ Service worker ready. Scope: ${registration.scope}`);

    // PASO 4: Verificar suscripción existente
    console.log('📱 PASO 4: Verificando suscripción existente');
    alert('📱 PASO 4: Verificando suscripción existente');
    
    const existingSubscription = await registration.pushManager.getSubscription();
    
    if (existingSubscription) {
      console.log('🔁 Suscripción previa encontrada, eliminando...');
      alert('🔁 Suscripción previa encontrada, eliminando...');
      
      await existingSubscription.unsubscribe();
      
      console.log('✅ Suscripción previa eliminada');
      alert('✅ Suscripción previa eliminada');
    } else {
      console.log('ℹ️ No hay suscripción previa');
      alert('ℹ️ No hay suscripción previa');
    }

    // PASO 5: Conversión VAPID
    console.log('📱 PASO 5: Convirtiendo VAPID key');
    alert('📱 PASO 5: Convirtiendo VAPID key');
    
    const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
    
    console.log('✅ VAPID key convertida');
    alert('✅ VAPID key convertida');

    // PASO 6: Crear nueva suscripción - AQUÍ SE PUEDE COLGAR
    console.log('📱 PASO 6: Creando push subscription');
    alert('📱 PASO 6: Creando push subscription - CRÍTICO');
    
    console.log('🚨 PUNTO CRÍTICO: Llamando pushManager.subscribe()');
    alert('🚨 PUNTO CRÍTICO: Llamando pushManager.subscribe()');
    
    const newSubscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey
    });
    
    console.log('🎉 Push subscription creada exitosamente');
    alert('🎉 Push subscription creada exitosamente');
    
    console.log('📊 Subscription details:', {
      endpoint: newSubscription.endpoint.substring(0, 50) + '...',
      keys: Object.keys(newSubscription.toJSON().keys || {})
    });

    // PASO 7: Obtener usuario
    console.log('📱 PASO 7: Obteniendo usuario de Supabase');
    alert('📱 PASO 7: Obteniendo usuario de Supabase');
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('❌ Error obteniendo usuario:', userError);
      alert('❌ Error obteniendo usuario');
      throw new Error('Usuario no autenticado');
    }
    
    console.log('✅ Usuario obtenido:', user.id);
    alert(`✅ Usuario obtenido: ${user.id.substring(0, 8)}...`);

    // PASO 8: Guardar en base de datos
    console.log('📱 PASO 8: Guardando subscription en DB');
    alert('📱 PASO 8: Guardando subscription en DB');
    
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: user.id,
        subscription: newSubscription,
        endpoint: newSubscription.endpoint,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (error) {
      console.error('❌ Error guardando suscripción:', error);
      alert(`❌ Error DB: ${error.message}`);
      throw error;
    }
    
    console.log('✅ Subscription guardada en DB');
    alert('✅ Subscription guardada en DB');

    // PASO 9: Finalización
    console.log('🎉 subscribeToPush COMPLETADA EXITOSAMENTE');
    alert('🎉 subscribeToPush COMPLETADA EXITOSAMENTE');
    
    return newSubscription;

  } catch (error) {
    console.error('❌ ERROR EN subscribeToPush:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error name:', error.name);
    console.error('❌ Error message:', error.message);
    
    alert(`❌ ERROR EN subscribeToPush: ${error.message}`);
    
    throw error;
  }
}