// api/stripe-webhook.js
// Vercel Serverless Function — maneja eventos de Stripe
// ENV vars needed in Vercel:
//   STRIPE_SECRET_KEY         → sk_live_...
//   STRIPE_WEBHOOK_SECRET     → whsec_...  (from Stripe Dashboard → Webhooks)
//   SUPABASE_URL              → https://xxx.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY → service_role key (NOT the anon key)

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

// Disable Vercel's automatic body parsing — Stripe needs the raw body for signature verification
module.exports.config = { api: { bodyParser: false } }

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    // req.body must be the raw buffer — set via vercel.json or middleware
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return res.status(400).json({ error: `Webhook error: ${err.message}` });
  }

  // Use service role key so webhook can bypass RLS
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const setUserPlan = async (userId, plan, expiresAt, stripeCustomerId, stripeSubId) => {
    const { error } = await supabase
      .from('perfiles')
      .update({
        plan,
        plan_expires_at: expiresAt,
        stripe_customer_id: stripeCustomerId || null,
        stripe_subscription_id: stripeSubId || null,
      })
      .eq('id', userId);
    if (error) console.error('Supabase update error:', error);
  };

  try {
    switch (event.type) {

      // ✅ Payment succeeded → activate premium
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.client_reference_id || session.metadata?.userId;
        if (!userId) break;

        // Get subscription end date from Stripe
        const sub = await stripe.subscriptions.retrieve(session.subscription);
        const expiresAt = new Date(sub.current_period_end * 1000).toISOString();

        await setUserPlan(userId, 'premium', expiresAt, session.customer, session.subscription);
        console.log(`✅ Premium activated for user ${userId} until ${expiresAt}`);
        break;
      }

      // 🔄 Subscription renewed → extend expiry
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        if (invoice.billing_reason !== 'subscription_cycle') break;

        const sub = await stripe.subscriptions.retrieve(invoice.subscription);
        const userId = sub.metadata?.userId;
        if (!userId) break;

        const expiresAt = new Date(sub.current_period_end * 1000).toISOString();
        await setUserPlan(userId, 'premium', expiresAt, invoice.customer, invoice.subscription);
        console.log(`🔄 Premium renewed for user ${userId} until ${expiresAt}`);
        break;
      }

      // ❌ Subscription cancelled or payment failed → downgrade to free
      case 'customer.subscription.deleted':
      case 'invoice.payment_failed': {
        const obj = event.data.object;
        const subId = obj.subscription || obj.id;
        const sub = await stripe.subscriptions.retrieve(subId).catch(() => null);
        const userId = sub?.metadata?.userId;
        if (!userId) break;

        await setUserPlan(userId, 'free', null, null, null);
        console.log(`❌ Plan downgraded to free for user ${userId}`);
        break;
      }

      default:
        console.log(`Unhandled event: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('Webhook handler error:', err);
    return res.status(500).json({ error: err.message });
  }
};
