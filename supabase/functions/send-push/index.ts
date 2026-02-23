import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import webpush from "npm:web-push";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { title, body, type, user_id, data: extraData } = await req.json();

    const PROJECT_URL = Deno.env.get("PUSH_PROJECT_URL") || Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE_KEY = Deno.env.get("PUSH_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const VAPID_PUBLIC_KEY = Deno.env.get("PUSH_VAPID_PUBLIC_KEY") || Deno.env.get("VAPID_PUBLIC_KEY");
    const VAPID_PRIVATE_KEY = Deno.env.get("PUSH_VAPID_PRIVATE_KEY") || Deno.env.get("VAPID_PRIVATE_KEY");

    if (!PROJECT_URL || !SERVICE_ROLE_KEY || !VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      return new Response(
        JSON.stringify({ error: "Missing environment variables" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    webpush.setVapidDetails(
      "mailto:edwin_evangelista@hotmail.com",
      VAPID_PUBLIC_KEY,
      VAPID_PRIVATE_KEY
    );

    // Obtener suscripciones
    let query = `${PROJECT_URL}/rest/v1/push_subscriptions?select=*`;
    if (user_id) query += `&user_id=eq.${user_id}`;

    const res = await fetch(query, {
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      },
    });

    const subs = await res.json();
    console.log(`Found ${subs.length} subscriptions`);

    if (subs.length === 0) {
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: "No subscriptions found" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const sub of subs) {
      try {
        const subscriptionData = sub.subscription;

        // ✅ Soporta el nuevo formato web_push (endpoint + keys en el objeto subscription)
        let endpoint: string | null = null;
        let p256dh: string | null = null;
        let auth: string | null = null;

        if (subscriptionData?.type === 'web_push') {
          // Nuevo formato: endpoint y keys dentro del objeto subscription
          endpoint = subscriptionData.endpoint;
          p256dh = subscriptionData.keys?.p256dh;
          auth = subscriptionData.keys?.auth;
        } else if (subscriptionData?.endpoint && subscriptionData?.keys) {
          // Formato legacy con endpoint+keys directamente
          endpoint = subscriptionData.endpoint;
          p256dh = subscriptionData.keys?.p256dh;
          auth = subscriptionData.keys?.auth;
        }

        if (!endpoint || !p256dh || !auth) {
          console.log(`Skipping subscription ${sub.id} — no web push data (type: ${subscriptionData?.type})`);
          continue;
        }

        const payload = JSON.stringify({
          title: title || "FinGuide",
          body: body || "Tienes una notificación",
          type: type || "general",
          tag: `finguide-${type || 'general'}-${Date.now()}`,
          data: { url: "/", ...extraData }
        });

        await webpush.sendNotification(
          { endpoint, keys: { p256dh, auth } },
          payload
        );

        sent++;
        console.log(`✓ Sent to ${sub.id} (${subscriptionData?.strategy || 'unknown'})`);

      } catch (pushError: any) {
        failed++;
        const msg = `✗ Failed ${sub.id}: ${pushError.message}`;
        console.error(msg);
        errors.push(msg);

        // Limpiar suscripciones expiradas
        if (pushError.statusCode === 410 || pushError.statusCode === 404) {
          await fetch(`${PROJECT_URL}/rest/v1/push_subscriptions?id=eq.${sub.id}`, {
            method: "DELETE",
            headers: {
              apikey: SERVICE_ROLE_KEY,
              Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
            },
          });
          console.log(`Deleted expired subscription ${sub.id}`);
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, sent, failed, total: subs.length, errors }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err: any) {
    console.error("Function error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
