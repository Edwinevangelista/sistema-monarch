// api/send-push.js
// Vercel Serverless Function — envía web push a un usuario específico
// ENV vars needed in Vercel:
//   VAPID_PUBLIC_KEY   → genera con: npx web-push generate-vapid-keys
//   VAPID_PRIVATE_KEY  → genera con: npx web-push generate-vapid-keys
//   VAPID_MAILTO       → mailto:finguideapp@gmail.com
//   SUPABASE_URL       → https://loluismsoljdsoksuiei.supabase.co
//   SUPABASE_SERVICE_KEY → sk_... (service role key from Supabase dashboard)

const webpush = require('web-push');
const { createClient } = require('@supabase/supabase-js');

const notificationDate = () => new Date().toISOString().split('T')[0];

const reserveNotification = async (supabase, userId, tipo, fecha) => {
  const { error } = await supabase
    .from('notificaciones_enviadas')
    .insert({ user_id: userId, tipo, fecha });

  if (!error) return { reserved: true };
  if (error.code === '23505') return { reserved: false, duplicate: true };
  throw error;
};

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const expectedSecret = process.env.CRON_SECRET || process.env.INTERNAL_API_SECRET;
  const authHeader = req.headers.authorization || '';
  const providedSecret =
    authHeader.startsWith('Bearer ') ? authHeader.slice(7) : req.headers['x-cron-secret'];

  if (!expectedSecret || providedSecret !== expectedSecret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Configure VAPID credentials for this request
  webpush.setVapidDetails(
    process.env.VAPID_MAILTO,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  const { user_id, title, body, icon, data } = req.body;

  if (!user_id || !title || !body) {
    return res.status(400).json({ error: 'user_id, title, and body are required' });
  }

  const tipoNotificacion = data?.tipo || data?.seccion || title;
  const reserva = await reserveNotification(supabase, user_id, tipoNotificacion, notificationDate());
  if (!reserva.reserved) {
    return res.status(200).json({ sent: 0, duplicate: true, message: 'Notification already sent today' });
  }

  // Fetch all push subscriptions for this user
  const { data: subs, error } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('user_id', user_id);

  if (error) {
    console.error('Supabase error fetching subscriptions:', error.message);
    return res.status(500).json({ error: error.message });
  }

  if (!subs || subs.length === 0) {
    return res.status(200).json({ sent: 0, message: 'No subscriptions found for user' });
  }

  const payload = JSON.stringify({
    title,
    body,
    icon: icon || '/icons/FinGuide_AppIcon_192.png',
    data: data || {},
  });

  // Send to all subscriptions for this user (handles multi-device)
  const results = await Promise.allSettled(
    subs.map(sub =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      )
    )
  );

  // Remove expired/invalid subscriptions (410 Gone)
  const expiredEndpoints = [];
  results.forEach((result, i) => {
    if (result.status === 'rejected') {
      const statusCode = result.reason?.statusCode;
      if (statusCode === 410 || statusCode === 404) {
        expiredEndpoints.push(subs[i].endpoint);
      }
      console.error('Push send failed:', result.reason?.message);
    }
  });

  if (expiredEndpoints.length > 0) {
    await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', user_id)
      .in('endpoint', expiredEndpoints);
  }

  const sent = results.filter(r => r.status === 'fulfilled').length;
  return res.status(200).json({ sent, total: subs.length });
};
