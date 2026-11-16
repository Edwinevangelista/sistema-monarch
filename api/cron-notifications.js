// api/cron-notifications.js
// Vercel Cron Job — corre diario a las 13:00 UTC (9:00 EDT / 8:00 EST en NY)
// Fase 1: ÚNICO sistema servidor de avisos. Las funciones Supabase
// cron-alerts / send-push están deprecadas (ver sus cabeceras).
// Cubre gastos fijos, suscripciones Y deudas/tarjetas, con fechas en
// America/New_York y lead-time por ítem (columna aviso_dias, default 3).
//
// Reglas:
// - Gasto fijo: dia_venc es el campo canónico; fecha_vencimiento solo es
//   fallback si no hay dia_venc. Solo estado Pendiente.
// - Suscripción: estado Activo, por proximo_pago.
// - Deuda/tarjeta: estado Activa, saldo > 0 y pago_minimo > 0. El monto
//   del aviso es el PAGO MÍNIMO, nunca el saldo total.
// - Solo avisos de vencimientos próximos (dias 0..lead); los vencidos se
//   ven en la bandeja de alertas de la app, no se reenvían a diario.
// - Dedup: un aviso por evento de vencimiento (tipo incluye id + fecha de
//   vencimiento; la fecha de la reserva ES la fecha de vencimiento).
// - Re-chequeo: antes de cada envío se vuelve a leer el ítem; si ya se
//   pagó o la fecha avanzó, no se envía.
// - El payload lleva actions: [{ action: 'marcar-pagado' }] y data con
//   tipoItem/itemId/monto/nombre/token; el service worker llama a
//   POST /api/marcar-pagado con el token y marca el pago con la app
//   cerrada (Fase 2). Si falta el secreto del token, el aviso sale
//   SIN token y SIN acción (el botón abre la app como en Fase 1) y
//   queda un aviso claro en los logs.
//
// ENV vars needed in Vercel:
//   VAPID_PUBLIC_KEY    → genera con: npx web-push generate-vapid-keys
//   VAPID_PRIVATE_KEY   → genera con: npx web-push generate-vapid-keys
//   VAPID_MAILTO        → mailto:finguideapp@gmail.com
//   SUPABASE_URL        → your Supabase project URL (from Supabase dashboard)
//   SUPABASE_SERVICE_KEY → service role key from Supabase dashboard
//   CRON_SECRET         → a long random value set in Vercel only (never commit its value; rotate it, the old value was in git history)
//   MARCAR_PAGADO_SECRET → valor aleatorio largo para firmar los tokens
//     de "marcar pagado" (ver api/lib/marcarPagadoToken.js y SECURITY.md).
//     Si no está, se usa CRON_SECRET como fallback (se registra en logs).

const webpush = require('web-push');
const { createClient } = require('@supabase/supabase-js');
const { getMarcarPagadoSecret, createMarcarPagadoToken } = require('./lib/marcarPagadoToken');

// ── Fechas en America/New_York (copia mínima de src/utils/fechasNY.js;
//    api/*.js es CommonJS y no puede importar el módulo ESM) ──────────────
const ZONA_NY = 'America/New_York';
const hoyNY = (fecha = new Date()) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA_NY, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(fecha);

const formatoFechaLocal = (fecha) => {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const d = String(fecha.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const diffDiasNY = (venceStr, hoyStr) => {
  if (!venceStr || !hoyStr) return null;
  const aUTC = (s) => {
    const [y, m, d] = s.split('-').map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((aUTC(venceStr) - aUTC(hoyStr)) / 86400000);
};

// Próxima fecha 'YYYY-MM-DD' en que cae un día de mes (dia_venc).
const proximaFechaDiaMes = (dia, hoyStr) => {
  const diaNum = Number(dia);
  if (!diaNum || diaNum < 1) return null;
  const [y, m, dHoy] = hoyStr.split('-').map(Number);
  let yy = y;
  let mm = m;
  if (diaNum < dHoy) {
    mm += 1;
    if (mm > 12) { mm = 1; yy += 1; }
  }
  const ultimoDiaMes = new Date(yy, mm, 0).getDate();
  const dd = Math.min(diaNum, ultimoDiaMes);
  return `${yy}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
};
// ──────────────────────────────────────────────────────────────────────────

const reserveNotification = async (supabase, userId, tipo, fecha) => {
  const { error } = await supabase
    .from('notificaciones_enviadas')
    .insert({ user_id: userId, tipo, fecha });

  if (!error) return { reserved: true };
  if (error.code === '23505') return { reserved: false, duplicate: true };
  throw error;
};

// Intenta la consulta con aviso_dias; si la columna aún no existe en la
// BD (migración supabase_add_aviso_dias.sql sin correr), reintenta sin ella.
const fetchConAvisoDiasFallback = async (conAviso, sinAviso) => {
  const r1 = await conAviso();
  if (!r1.error) return r1;
  if (r1.error.message && r1.error.message.includes('aviso_dias')) return sinAviso();
  return r1;
};

// Re-chequeo justo antes de enviar: el ítem sigue pendiente y su fecha de
// vencimiento no cambió desde que se construyó la lista.
const siguePendiente = async (supabase, notif, hoyStr) => {
  if (notif.tipoItem === 'fijo') {
    const { data } = await supabase
      .from('gastos_fijos').select('estado, dia_venc, fecha_vencimiento').eq('id', notif.itemId).single();
    if (!data || data.estado !== 'Pendiente') return false;
    const vence = data.dia_venc
      ? proximaFechaDiaMes(data.dia_venc, hoyStr)
      : (data.fecha_vencimiento ? String(data.fecha_vencimiento).slice(0, 10) : null);
    return vence === notif.venceFecha;
  }
  if (notif.tipoItem === 'suscripciones') {
    const { data } = await supabase
      .from('suscripciones').select('estado, proximo_pago').eq('id', notif.itemId).single();
    return !!data && data.estado === 'Activo'
      && String(data.proximo_pago).slice(0, 10) === notif.venceFecha;
  }
  if (notif.tipoItem === 'deuda') {
    const { data } = await supabase
      .from('deudas').select('estado, saldo, vence').eq('id', notif.itemId).single();
    return !!data && data.estado === 'Activa'
      && Number(data.saldo || 0) > 0
      && String(data.vence).slice(0, 10) === notif.venceFecha;
  }
  return false;
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

  // Secreto para firmar los tokens de "marcar pagado". Sin él, los
  // avisos salen igual pero sin token y sin acción (no se rompen).
  const secretoToken = getMarcarPagadoSecret();
  if (!secretoToken) {
    console.warn('cron: falta MARCAR_PAGADO_SECRET y CRON_SECRET; los avisos saldrán sin token ni acción de marcar pagado');
  } else if (secretoToken.source !== 'MARCAR_PAGADO_SECRET') {
    console.warn('cron: usando CRON_SECRET como fallback para los tokens; pon MARCAR_PAGADO_SECRET en Vercel');
  }

  // Fechas en America/New_York (no UTC): el cron corre a las 13:00 UTC,
  // que son las 9:00 EDT / 8:00 EST en Nueva York.
  const hoyStr = hoyNY();
  const hoyDate = new Date(hoyStr + 'T12:00:00');
  const en7dias = new Date(hoyDate);
  en7dias.setDate(hoyDate.getDate() + 7);
  const en7diasStr = formatoFechaLocal(en7dias);

  // ── Gastos fijos: dia_venc es canónico; se calcula la próxima fecha ──
  const { data: gastosFijos, error: errorGastos } = await fetchConAvisoDiasFallback(
    () => supabase.from('gastos_fijos')
      .select('id, user_id, nombre, monto, dia_venc, fecha_vencimiento, aviso_dias')
      .eq('estado', 'Pendiente'),
    () => supabase.from('gastos_fijos')
      .select('id, user_id, nombre, monto, dia_venc, fecha_vencimiento')
      .eq('estado', 'Pendiente')
  );

  if (errorGastos) {
    console.error('Error fetching gastos_fijos:', errorGastos.message);
  }

  // ── Suscripciones activas que cobran en los próximos 7 días ──
  const { data: suscripciones, error: errorSubs } = await fetchConAvisoDiasFallback(
    () => supabase.from('suscripciones')
      .select('id, user_id, servicio, costo, proximo_pago, aviso_dias')
      .eq('estado', 'Activo')
      .gte('proximo_pago', hoyStr)
      .lte('proximo_pago', en7diasStr),
    () => supabase.from('suscripciones')
      .select('id, user_id, servicio, costo, proximo_pago')
      .eq('estado', 'Activo')
      .gte('proximo_pago', hoyStr)
      .lte('proximo_pago', en7diasStr)
  );

  if (errorSubs) {
    console.error('Error fetching suscripciones:', errorSubs.message);
  }

  // ── Deudas / tarjetas activas que vencen en los próximos 7 días ──
  // El monto del aviso es el PAGO MÍNIMO, nunca el saldo total.
  const { data: deudas, error: errorDeudas } = await fetchConAvisoDiasFallback(
    () => supabase.from('deudas')
      .select('id, user_id, cuenta, saldo, pago_minimo, vence, aviso_dias')
      .eq('estado', 'Activa')
      .gte('vence', hoyStr)
      .lte('vence', en7diasStr),
    () => supabase.from('deudas')
      .select('id, user_id, cuenta, saldo, pago_minimo, vence')
      .eq('estado', 'Activa')
      .gte('vence', hoyStr)
      .lte('vence', en7diasStr)
  );

  if (errorDeudas) {
    console.error('Error fetching deudas:', errorDeudas.message);
  }

  // Construir la lista de avisos (solo vencimientos próximos, dias 0..lead)
  const notifsByUser = {};
  const pushNotif = (userId, notif) => {
    if (!notifsByUser[userId]) notifsByUser[userId] = [];
    notifsByUser[userId].push(notif);
  };
  const cuandoStr = (dias) => (dias === 0 ? 'hoy' : dias === 1 ? 'mañana' : `en ${dias} días`);

  (gastosFijos || []).forEach(g => {
    const venceFecha = g.dia_venc
      ? proximaFechaDiaMes(g.dia_venc, hoyStr)
      : (g.fecha_vencimiento ? String(g.fecha_vencimiento).slice(0, 10) : null);
    const dias = diffDiasNY(venceFecha, hoyStr);
    const lead = Number(g.aviso_dias ?? 3);
    if (dias == null || dias < 0 || dias > lead) return;
    pushNotif(g.user_id, {
      tipo: `gasto_fijo:${g.id}:${venceFecha}`,
      tipoItem: 'fijo',
      itemId: g.id,
      venceFecha,
      title: `⚠️ Pago próximo: ${g.nombre}`,
      body: `Vence ${cuandoStr(dias)} — $${Number(g.monto).toLocaleString('es')}`,
      data: { seccion: 'alertas', tipoItem: 'fijo', itemId: g.id, monto: Number(g.monto), nombre: g.nombre },
    });
  });

  (suscripciones || []).forEach(s => {
    const venceFecha = String(s.proximo_pago).slice(0, 10);
    const dias = diffDiasNY(venceFecha, hoyStr);
    const lead = Number(s.aviso_dias ?? 3);
    if (dias == null || dias < 0 || dias > lead) return;
    pushNotif(s.user_id, {
      tipo: `suscripcion:${s.id}:${venceFecha}`,
      tipoItem: 'suscripciones',
      itemId: s.id,
      venceFecha,
      title: `📱 Suscripción: ${s.servicio}`,
      body: `Se cobra ${cuandoStr(dias)} — $${Number(s.costo).toLocaleString('es')}`,
      data: { seccion: 'suscripciones', tipoItem: 'suscripciones', itemId: s.id, monto: Number(s.costo), nombre: s.servicio },
    });
  });

  (deudas || []).forEach(d => {
    if (Number(d.saldo || 0) <= 0 || Number(d.pago_minimo || 0) <= 0) return;
    const venceFecha = String(d.vence).slice(0, 10);
    const dias = diffDiasNY(venceFecha, hoyStr);
    const lead = Number(d.aviso_dias ?? 3);
    if (dias == null || dias < 0 || dias > lead) return;
    pushNotif(d.user_id, {
      tipo: `deuda:${d.id}:${venceFecha}`,
      tipoItem: 'deuda',
      itemId: d.id,
      venceFecha,
      title: `💳 Pago de tarjeta: ${d.cuenta}`,
      body: `Mínimo $${Number(d.pago_minimo).toLocaleString('es')} vence ${cuandoStr(dias)}`,
      data: { seccion: 'alertas', tipoItem: 'deuda', itemId: d.id, monto: Number(d.pago_minimo), nombre: d.cuenta },
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
      // Re-chequeo antes de enviar: si ya se pagó o la fecha avanzó, no avisar.
      const ok = await siguePendiente(supabase, notif, hoyStr);
      if (!ok) continue;

      // Dedup por evento de vencimiento (la fecha de la reserva es la
      // fecha de vencimiento, no el día de ejecución).
      const reserva = await reserveNotification(supabase, userId, notif.tipo, notif.venceFecha);
      if (!reserva.reserved) continue;

      // Token firmado para este pago concreto. Sin secreto no hay token
      // ni acción: el aviso sale igual y el botón abre la app (Fase 1).
      let token = null;
      if (secretoToken) {
        try {
          token = createMarcarPagadoToken(secretoToken.secret, {
            userId,
            tipoItem: notif.tipoItem,
            itemId: notif.itemId,
            venceFecha: notif.venceFecha,
            monto: notif.data.monto,
          });
        } catch (e) {
          console.error(`No se pudo firmar el token para ${notif.tipo}:`, e?.message);
        }
      }

      const payload = JSON.stringify({
        title: notif.title,
        body: notif.body,
        data: token ? { ...notif.data, token } : notif.data,
        actions: token ? [{ action: 'marcar-pagado', title: 'Marcar pagado' }] : [],
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
