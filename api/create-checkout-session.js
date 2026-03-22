// api/create-checkout-session.js
// Vercel Serverless Function — crea sesión de Stripe Checkout
// ENV vars needed in Vercel:
//   STRIPE_SECRET_KEY      → sk_live_...
//   STRIPE_PRICE_ID        → price_...  ($4.99/mo recurring)
//   NEXT_PUBLIC_SITE_URL   → https://sistema-monarch.vercel.app

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, userEmail, successUrl, cancelUrl } = req.body;

  if (!userId || !userEmail) {
    return res.status(400).json({ error: 'userId and userEmail are required' });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://sistema-monarch.vercel.app';

  try {
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
    return res.status(500).json({ error: err.message });
  }
};
