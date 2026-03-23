import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px', fontFamily: 'system-ui, sans-serif', color: '#1f2937', lineHeight: 1.7 }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>Privacy Policy</h1>
      <p style={{ color: '#6b7280', marginBottom: 32 }}>Last updated: March 22, 2026</p>

      <p>FinGuide ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use the FinGuide app.</p>

      <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 32, marginBottom: 12 }}>1. Information We Collect</h2>
      <p>We collect the following information when you use FinGuide:</p>
      <ul style={{ paddingLeft: 24 }}>
        <li><strong>Account information:</strong> email address and name when you register.</li>
        <li><strong>Financial data:</strong> income, expenses, debts, and bank accounts you manually enter.</li>
        <li><strong>Device information:</strong> device type, operating system, and app version for troubleshooting.</li>
        <li><strong>Usage data:</strong> features used and session duration to improve the app.</li>
      </ul>

      <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 32, marginBottom: 12 }}>2. How We Use Your Information</h2>
      <ul style={{ paddingLeft: 24 }}>
        <li>To provide and maintain the FinGuide service.</li>
        <li>To sync your financial data across your devices.</li>
        <li>To send important notifications about your finances (if enabled).</li>
        <li>To process payments for Premium subscriptions via Stripe.</li>
        <li>To improve the app based on usage patterns.</li>
      </ul>

      <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 32, marginBottom: 12 }}>3. Data Storage and Security</h2>
      <p>Your data is stored securely using Supabase, which uses industry-standard encryption (AES-256) at rest and TLS in transit. We never sell your personal or financial data to third parties.</p>

      <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 32, marginBottom: 12 }}>4. Third-Party Services</h2>
      <p>We use the following third-party services:</p>
      <ul style={{ paddingLeft: 24 }}>
        <li><strong>Supabase</strong> – database and authentication (<a href="https://supabase.com/privacy" style={{ color: '#3b82f6' }}>Privacy Policy</a>)</li>
        <li><strong>Stripe</strong> – payment processing (<a href="https://stripe.com/privacy" style={{ color: '#3b82f6' }}>Privacy Policy</a>)</li>
        <li><strong>Vercel</strong> – hosting (<a href="https://vercel.com/legal/privacy-policy" style={{ color: '#3b82f6' }}>Privacy Policy</a>)</li>
      </ul>

      <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 32, marginBottom: 12 }}>5. Your Rights</h2>
      <p>You have the right to:</p>
      <ul style={{ paddingLeft: 24 }}>
        <li>Access and export your personal data at any time.</li>
        <li>Delete your account and all associated data.</li>
        <li>Opt out of non-essential communications.</li>
      </ul>
      <p>To exercise these rights, contact us at <a href="mailto:finguideapp@gmail.com" style={{ color: '#3b82f6' }}>finguideapp@gmail.com</a>.</p>

      <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 32, marginBottom: 12 }}>6. Children's Privacy</h2>
      <p>FinGuide is not intended for children under 13. We do not knowingly collect data from children under 13.</p>

      <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 32, marginBottom: 12 }}>7. Changes to This Policy</h2>
      <p>We may update this policy periodically. We will notify you of significant changes via email or in-app notification.</p>

      <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 32, marginBottom: 12 }}>8. Contact Us</h2>
      <p>If you have questions about this Privacy Policy, contact us at:</p>
      <p><strong>Email:</strong> <a href="mailto:finguideapp@gmail.com" style={{ color: '#3b82f6' }}>finguideapp@gmail.com</a><br />
      <strong>Website:</strong> <a href="https://sistema-monarch.vercel.app" style={{ color: '#3b82f6' }}>https://sistema-monarch.vercel.app</a></p>

      <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid #e5e7eb', color: '#9ca3af', fontSize: 14 }}>
        © 2026 FinGuide. All rights reserved.
      </div>
    </div>
  );
}
