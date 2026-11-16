// api/create-checkout-session.js
// Vercel Serverless Function — crea sesión de Stripe Checkout
// ENV vars needed in Vercel:
//   STRIPE_SECRET_KEY      → secret key from Stripe Dashboard (never commit its value)
//   STRIPE_PRICE_ID        → price ID from Stripe Dashboard
//   NEXT_PUBLIC_SITE_URL   → https://sistema-monarch.vercel.app
//   SUPABASE_URL           → your Supabase project URL
//   SUPABASE_ANON_KEY      → anon key from Supabase Dashboard (used only to verify the caller's JWT)
//
// Security (Fase 0): the caller must send its Supabase session token
// (Authorization: Bearer <token>). The token's user id and email must match
// the userId/userEmail in the body, otherwise the request is rejected.
// Previously the endpoint trusted userId/userEmail from the body alone,
// so anyone could create a checkout session linked to another user's id.

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { userId, userEmail, successUrl, cancelUrl } = req.body || {};

  if (!userId || !userEmail) {
    return res.status(400).json({ error: 'userId and userEmail are required' });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://sistema-monarch.vercel.app';

  // Reject redirect URLs that point outside the app.
  for (const url of [successUrl, cancelUrl]) {
    if (url && !url.startsWith(siteUrl)) {
      return res.status(400).json({ error: 'Invalid redirect URL' });
    }
  }

  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_PRICE_ID) {
    return res.status(500).json({ error: 'Checkout is not configured' });
  }

  try {
    // Verify the caller's session token against Supabase.
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    const token = authHeader.slice(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user || user.id !== userId || user.email !== userEmail) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: userEmail,
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      // Pass userId so webhook can link payment to Supabase user
      client_reference_id: userId,
      metadata: { userId },
      success_url: successUrl || `${siteUrl}/dashboard?upgrade=success`,
      cancel_url: cancelUrl || `${siteUrl}/dashboard?upgrade=cancelled`,
      subscription_data: {
        metadata: { userId },
        trial_period_days: 0,
      },
      allow_promotion_codes: true,
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err.message);
    return res.status(500).json({ error: 'Could not start checkout' });
  }
};
