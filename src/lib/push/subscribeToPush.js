import { supabase } from '../supabaseClient';

function urlBase64ToUint8Array(base64String) {
  let cleaned = base64String.replace(/^["']|["']$/g, '').trim();
  const padding = '='.repeat((4 - (cleaned.length % 4)) % 4);
  const base64 = (cleaned + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const raw = atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

export async function subscribeToPush(VAPID_PUBLIC_KEY) {
  console.log('🔔 subscribeToPush ejecutándose');

  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Push no soportado en este navegador');
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Permiso de notificaciones denegado');
  }

  const registration = await navigator.serviceWorker.ready;

  // 🔥 PASO CLAVE QUE TE FALTABA
  const existingSubscription =
    await registration.pushManager.getSubscription();

  if (existingSubscription) {
    console.warn('🔁 Suscripción previa detectada, eliminando...');
    await existingSubscription.unsubscribe();
  }

  const newSubscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
  });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuario no autenticado');

  const { error } = await supabase
    .from('push_subscriptions')
    .upsert({
      user_id: user.id,
      subscription: newSubscription,
      updated_at: new Date().toISOString()
    });

  if (error) {
    console.error('❌ Error guardando suscripción:', error);
    throw error;
  }

  console.log('✅ Push subscription creada correctamente');
  return newSubscription;
}
