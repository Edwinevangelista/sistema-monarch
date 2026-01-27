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
    const { title, body, type, user_id } = await req.json();

    // Obtener variables - usa los nombres que ya tienes configurados
    const PROJECT_URL = Deno.env.get("PUSH_PROJECT_URL") || Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE_KEY = Deno.env.get("PUSH_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const VAPID_PUBLIC_KEY = Deno.env.get("PUSH_VAPID_PUBLIC_KEY") || Deno.env.get("VAPID_PUBLIC_KEY");
    const VAPID_PRIVATE_KEY = Deno.env.get("PUSH_VAPID_PRIVATE_KEY") || Deno.env.get("VAPID_PRIVATE_KEY");

    console.log("ENV Check:", {
      PROJECT_URL: PROJECT_URL ? "✓" : "✗",
      SERVICE_ROLE_KEY: SERVICE_ROLE_KEY ? "✓" : "✗", 
      VAPID_PUBLIC_KEY: VAPID_PUBLIC_KEY ? "✓" : "✗",
      VAPID_PRIVATE_KEY: VAPID_PRIVATE_KEY ? "✓" : "✗",
    });

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
    if (user_id) {
      query += `&user_id=eq.${user_id}`;
    }

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

    for (const sub of subs) {
      try {
        // ✅ CORREGIDO: Extraer datos del objeto subscription anidado
        const subscriptionData = sub.subscription;
        
        if (!subscriptionData || !subscriptionData.endpoint || !subscriptionData.keys) {
          console.log(`Skipping invalid subscription ${sub.id}`);
          continue;
        }

        await webpush.sendNotification(
          {
            endpoint: subscriptionData.endpoint,
            keys: {
              p256dh: subscriptionData.keys.p256dh,
              auth: subscriptionData.keys.auth,
            },
          },
          JSON.stringify({ 
            title: title || "FinGuide", 
            body: body || "Tienes una notificación",
            type: type || "general"
          })
        );
        sent++;
        console.log(`✓ Sent to subscription ${sub.id}`);
        
      } catch (pushError: any) {
        failed++;
        console.error(`✗ Failed ${sub.id}:`, pushError.message);
        
        // Si expiró (410), eliminar
        if (pushError.statusCode === 410) {
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
      JSON.stringify({ success: true, sent, failed, total: subs.length }),
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