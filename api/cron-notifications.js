// api/cron-notifications.js
// Vercel Cron Job — corre diario a las 9:00am EST (13:00 UTC)
// Busca gastos fijos y suscripciones que vencen en los próximos 3 días
// y envía web push a los usuarios afectados.
//
// ENV vars needed in Vercel:
//   VAPID_PUBLIC_KEY    → genera con: npx web-push generate-vapid-keys
//   VAPID_PRIVATE_KEY   → genera con: npx web-push generate-vapid-keys
//   VAPID_MAILTO        → mailto:finguideapp@gmail.com
//   SUPABASE_URL        → https://loluismsoljdsoksuiei.supabase.co
//   SUPABASE_SERVICE_KEY → service role key from Supabase dashboard
//   CRON_SECRET         → finguide-cron-2025

const webpush = require('web-push');
const { createClient } = require('@supabase/supabase-js');

const reserveNotification = async (supabase, userId, tipo, fecha) => {
  const { error } = await supabase
    .from('notificaciones_enviadas')
    .insert({ user_id: userId, tipo, fecha });

  if (!error) return { reserved: true };
  if (error.code === '23505') return { reserved: false, duplicate: true };
  throw error;
};

module.exports = async (req, res) => {
  // Security: only allow requests with the correct cron secret
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const expectedSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.authorization || '';
  const providedSecret =
    authHeader.startsWith('Bearer ') ? authHeader.slice(7) : req.headers['x-cron-secret'];

  if (!expectedSecret || providedSecret !== expectedSecret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  webpush.setVapidDetails(
    process.env.VAPID_MAILTO,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  // Date range: today through 3 days from now
  const hoy = new Date();
  const en3dias = new Date(hoy);
  en3dias.setDate(hoy.getDate() + 3);
  const hoyStr = hoy.toISOString().split('T')[0];
  const en3diasStr = en3dias.toISOString().split('T')[0];

  // Fetch upcoming fixed expenses (gastos fijos)
  const { data: gastosFijos, error: errorGastos } = await supabase
    .from('gastos_fijos')
    .select('user_id, nombre, monto, fecha_vencimiento')
    .eq('estado', 'Pendiente')
    .gte('fecha_vencimiento', hoyStr)
    .lte('fecha_vencimiento', en3diasStr);

  if (errorGastos) {
    console.error('Error fetching gastos_fijos:', errorGastos.message);
  }

  // Fetch upcoming subscriptions (suscripciones)
  const { data: suscripciones, error: errorSubs } = await supabase
    .from('suscripciones')
    .select('user_id, servicio, costo, proximo_pago')
    .eq('estado', 'Activo')
    .gte('proximo_pago', hoyStr)
    .lte('proximo_pago', en3diasStr);

  if (errorSubs) {
    console.error('Error fetching suscripciones:', errorSubs.message);
  }

  // Group notifications by user_id
  const notifsByUser = {};

  (gastosFijos || []).forEach(g => {
    const dias = Math.ceil((new Date(g.fecha_vencimiento) - hoy) / 86400000);
    const cuandoStr = dias === 0 ? 'hoy' : dias === 1 ? 'mañana' : `en ${dias} días`;
    if (!notifsByUser[g.user_id]) notifsByUser[g.user_id] = [];
    notifsByUser[g.user_id].push({
      tipo: `gasto_fijo:${g.nombre}:${g.fecha_vencimiento}`,
      title: `⚠️ Pago próximo: ${g.nombre}`,
      body: `Vence ${cuandoStr} — $${Number(g.monto).toLocaleString('es')}`,
      data: { seccion: 'alertas' },
    });
  });

  (suscripciones || []).forEach(s => {
    const dias = Math.ceil((new Date(s.proximo_pago) - hoy) / 86400000);
    const cuandoStr = dias === 0 ? 'hoy' : dias === 1 ? 'mañana' : `en ${dias} días`;
    if (!notifsByUser[s.user_id]) notifsByUser[s.user_id] = [];
    notifsByUser[s.user_id].push({
      tipo: `suscripcion:${s.servicio}:${s.proximo_pago}`,
      title: `📱 Suscripción: ${s.servicio}`,
      body: `Se cobra ${cuandoStr} — $${Number(s.costo).toLocaleString('es')}`,
      data: { seccion: 'suscripciones' },
    });
  });

  // Send push notifications to each affected user
  let totalSent = 0;
  const expiredEndpoints = [];

  for (const [userId, notifs] of Object.entries(notifsByUser)) {
    const { data: pushSubs } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', userId);

    if (!pushSubs || pushSubs.length === 0) continue;

    for (const notif of notifs) {
      const reserva = await reserveNotification(supabase, userId, notif.tipo, hoyStr);
      if (!reserva.reserved) continue;

      const payload = JSON.stringify({
        title: notif.title,
        body: notif.body,
        data: notif.data,
        icon: '/icons/FinGuide_AppIcon_192.png',
      });

      const results = await Promise.allSettled(
        pushSubs.map(sub =>
          webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload
          )
        )
      );

      results.forEach((result, i) => {
        if (result.status === 'fulfilled') {
          totalSent++;
        } else {
          const statusCode = result.reason?.statusCode;
          if (statusCode === 410 || statusCode === 404) {
            expiredEndpoints.push(pushSubs[i].endpoint);
          }
          console.error(`Push failed for user ${userId}:`, result.reason?.message);
        }
      });
    }
  }

  // Cleanup expired subscriptions
  if (expiredEndpoints.length > 0) {
    await supabase
      .from('push_subscriptions')
      .delete()
      .in('endpoint', expiredEndpoints);
    console.log(`Cleaned up ${expiredEndpoints.length} expired subscriptions`);
  }

  return res.status(200).json({
    ok: true,
    usuariosNotificados: Object.keys(notifsByUser).length,
    notificacionesEnviadas: totalSent,
    suscripcionesEliminadas: expiredEndpoints.length,
  });
};
