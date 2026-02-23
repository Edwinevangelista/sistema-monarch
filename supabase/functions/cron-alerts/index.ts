// cron-alerts/index.ts
// Edge Function que se ejecuta como cron diario (ej: cada mañana a las 9am)
// Envía notificaciones push reales a usuarios con app cerrada
// Configurar en Supabase Dashboard > Edge Functions > cron-alerts
// Cron schedule: "0 9 * * *" (cada día a las 9am UTC)

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import webpush from "npm:web-push";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const PROJECT_URL = Deno.env.get("SUPABASE_URL");
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY") || Deno.env.get("PUSH_VAPID_PUBLIC_KEY");
  const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY") || Deno.env.get("PUSH_VAPID_PRIVATE_KEY");

  if (!PROJECT_URL || !SERVICE_ROLE_KEY || !VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    return new Response(JSON.stringify({ error: "Missing env vars" }), { status: 500, headers: corsHeaders });
  }

  webpush.setVapidDetails("mailto:edwin_evangelista@hotmail.com", VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

  const headers = { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` };

  const hoy = new Date().toISOString().split("T")[0];
  const en7Dias = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const diaHoy = new Date().getDate();

  let totalEnviadas = 0;
  let totalFallidas = 0;

  // Obtener todas las suscripciones web_push válidas
  const subsRes = await fetch(`${PROJECT_URL}/rest/v1/push_subscriptions?select=*`, { headers });
  const todasSubs: any[] = await subsRes.json();
  const subsWebPush = todasSubs.filter(s => s.subscription?.type === 'web_push' && s.subscription?.endpoint && s.subscription?.keys);

  console.log(`Procesando ${subsWebPush.length} suscripciones web_push de ${todasSubs.length} totales`);

  // ── Para cada usuario con suscripción válida ──
  for (const sub of subsWebPush) {
    const userId = sub.user_id;
    const { endpoint, keys } = sub.subscription;
    const alertas: { title: string; body: string; tag: string; requireInteraction: boolean }[] = [];

    // 1. DEUDAS PRÓXIMAS A VENCER (≤ 7 días)
    const deudasRes = await fetch(
      `${PROJECT_URL}/rest/v1/deudas?select=cuenta,saldo,vence&user_id=eq.${userId}&estado=eq.Activa&vence=gte.${hoy}&vence=lte.${en7Dias}`,
      { headers }
    );
    const deudas: any[] = await deudasRes.json();

    for (const deuda of (deudas || []).slice(0, 3)) {
      const diasRestantes = Math.ceil(
        (new Date(deuda.vence).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      if (diasRestantes <= 7) {
        const urgente = diasRestantes <= 2;
        alertas.push({
          title: urgente ? "🚨 Pago Urgente" : "💳 Pago Próximo",
          body: `${deuda.cuenta}: $${Number(deuda.saldo || 0).toFixed(2)} — vence en ${diasRestantes} día${diasRestantes !== 1 ? "s" : ""}`,
          tag: `debt-vence-${deuda.cuenta?.replace(/\s/g, "")}`,
          requireInteraction: urgente
        });
      }
    }

    // 2. GASTOS FIJOS CON AUTOPAGO (vencen en ≤ 3 días)
    const gfRes = await fetch(
      `${PROJECT_URL}/rest/v1/gastos_fijos?select=nombre,monto,dia_venc&user_id=eq.${userId}&autopago=eq.true`,
      { headers }
    );
    const gastosFijos: any[] = await gfRes.json();

    for (const gf of (gastosFijos || [])) {
      const diasHasta = (gf.dia_venc - diaHoy + 31) % 31;
      if (diasHasta >= 0 && diasHasta <= 3) {
        alertas.push({
          title: "⚡ Cobro Automático",
          body: `${gf.nombre}: $${Number(gf.monto || 0).toFixed(2)} — ${diasHasta === 0 ? "hoy" : `en ${diasHasta} día(s)`}`,
          tag: `autopago-${gf.nombre?.replace(/\s/g, "")}`,
          requireInteraction: diasHasta === 0
        });
      }
    }

    // 3. SUSCRIPCIONES PRÓXIMAS A RENOVAR (≤ 5 días)
    const susRes = await fetch(
      `${PROJECT_URL}/rest/v1/suscripciones?select=nombre,monto,fecha_cobro&user_id=eq.${userId}&activa=eq.true`,
      { headers }
    );
    const suscripciones: any[] = await susRes.json();

    for (const sus of (suscripciones || [])) {
      if (!sus.fecha_cobro) continue;
      const diasHasta = Math.ceil(
        (new Date(sus.fecha_cobro).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      if (diasHasta >= 0 && diasHasta <= 5) {
        alertas.push({
          title: "📺 Renovación Próxima",
          body: `${sus.nombre}: $${Number(sus.monto || 0).toFixed(2)} se cobra ${diasHasta === 0 ? "hoy" : `en ${diasHasta} día(s)`}`,
          tag: `suscripcion-${sus.nombre?.replace(/\s/g, "")}`,
          requireInteraction: diasHasta <= 1
        });
      }
    }

    // Enviar alertas al usuario
    for (const alerta of alertas) {
      try {
        await webpush.sendNotification(
          { endpoint, keys: { p256dh: keys.p256dh, auth: keys.auth } },
          JSON.stringify({
            title: alerta.title,
            body: alerta.body,
            tag: alerta.tag,
            requireInteraction: alerta.requireInteraction,
            data: { url: "/" }
          })
        );
        totalEnviadas++;
        console.log(`✓ [${userId.substring(0, 8)}] ${alerta.title}: ${alerta.body}`);
      } catch (err: any) {
        totalFallidas++;
        console.error(`✗ [${userId.substring(0, 8)}] Error:`, err.message);
        // Limpiar suscripciones expiradas
        if (err.statusCode === 410 || err.statusCode === 404) {
          await fetch(`${PROJECT_URL}/rest/v1/push_subscriptions?id=eq.${sub.id}`, {
            method: "DELETE",
            headers
          });
        }
      }
    }
  }

  const resultado = {
    success: true,
    fecha: hoy,
    suscripcionesProcesadas: subsWebPush.length,
    notificacionesEnviadas: totalEnviadas,
    notificacionesFallidas: totalFallidas
  };

  console.log("Resultado cron-alerts:", resultado);

  return new Response(JSON.stringify(resultado), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
});
