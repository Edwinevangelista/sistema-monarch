import { supabase } from './supabaseClient';

export async function unsubscribeFromPush() {
  // 1️⃣ Desuscribirse del navegador
  if ('serviceWorker' in navigator) {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();

    if (sub) {
      await sub.unsubscribe();
      console.log('🔕 Push unsubscribed from browser');
    }
  }

  // 2️⃣ Eliminar de la base de datos (CRÍTICO)
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Usuario no autenticado');
  }

  const { error: deleteError } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('user_id', user.id); // 👈 CLAVE REAL

  if (deleteError) {
    console.error('Error eliminando push en DB:', deleteError);
    throw deleteError;
  }

  console.log('🗑️ Push eliminado de la base de datos');
}
