import React from 'react';

export default function Privacy() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px', fontFamily: 'sans-serif', color: '#1f2937', lineHeight: '1.7' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '8px' }}>Privacy Policy</h1>
      <p style={{ color: '#6b7280', marginBottom: '32px' }}>Last updated: March 22, 2026</p>

      <p>FinGuide ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our mobile application and web service.</p>

      <h2 style={{ fontSize: '1.4rem', fontWeight: '600', marginTop: '32px', marginBottom: '12px' }}>Information We Collect</h2>
      <ul style={{ paddingLeft: '24px' }}>
        <li><strong>Account Information:</strong> Name and email address when you register.</li>
        <li><strong>Financial Data:</strong> Income, expenses, debts, subscriptions, and bank account information that you manually enter into the app.</li>
        <li><strong>Usage Data:</strong> How you interact with the app to improve our service.</li>
      </ul>

      <h2 style={{ fontSize: '1.4rem', fontWeight: '600', marginTop: '32px', marginBottom: '12px' }}>How We Use Your Information</h2>
      <ul style={{ paddingLeft: '24px' }}>
        <li>To provide and maintain the FinGuide service</li>
        <li>To authenticate your account and keep it secure</li>
        <li>To sync your financial data across your devices</li>
        <li>To send important notifications about your finances (with your permission)</li>
        <li>To improve and optimize our app</li>
      </ul>

      <h2 style={{ fontSize: '1.4rem', fontWeight: '600', marginTop: '32px', marginBottom: '12px' }}>Data Security</h2>
      <p>All data is encrypted in transit using TLS/HTTPS. Your financial data is stored securely using Supabase, which employs industry-standard security practices. We do not sell your personal information to third parties.</p>

      <h2 style={{ fontSize: '1.4rem', fontWeight: '600', marginTop: '32px', marginBottom: '12px' }}>Third-Party Services</h2>
      <p>We use the following third-party services:</p>
      <ul style={{ paddingLeft: '24px' }}>
        <li><strong>Supabase:</strong> Database and authentication provider</li>
        <li><strong>Stripe:</strong> Payment processing for subscriptions</li>
        <li><strong>Vercel:</strong> Hosting provider</li>
      </ul>

      <h2 style={{ fontSize: '1.4rem', fontWeight: '600', marginTop: '32px', marginBottom: '12px' }}>Your Rights</h2>
      <ul style={{ paddingLeft: '24px' }}>
        <li>Access your personal data at any time from within the app</li>
        <li>Request deletion of your account and all associated data</li>
        <li>Export your financial data</li>
        <li>Opt out of non-essential communications</li>
      </ul>

      <h2 style={{ fontSize: '1.4rem', fontWeight: '600', marginTop: '32px', marginBottom: '12px' }}>Account Deletion</h2>
      <p>You can request deletion of your account and all associated data by emailing us at <a href="mailto:finguideapp@gmail.com" style={{ color: '#3b82f6' }}>finguideapp@gmail.com</a> with the subject "Delete My Account". We will process your request within 30 days.</p>

      <h2 style={{ fontSize: '1.4rem', fontWeight: '600', marginTop: '32px', marginBottom: '12px' }}>Children's Privacy</h2>
      <p>FinGuide is intended for users 18 years and older. We do not knowingly collect information from children under 18.</p>

      <h2 style={{ fontSize: '1.4rem', fontWeight: '600', marginTop: '32px', marginBottom: '12px' }}>Changes to This Policy</h2>
      <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page.</p>

      <h2 style={{ fontSize: '1.4rem', fontWeight: '600', marginTop: '32px', marginBottom: '12px' }}>Contact Us</h2>
      <p>If you have questions about this Privacy Policy, contact us at:</p>
      <p><strong>Email:</strong> <a href="mailto:finguideapp@gmail.com" style={{ color: '#3b82f6' }}>finguideapp@gmail.com</a></p>
      <p><strong>Website:</strong> <a href="https://sistema-monarch.vercel.app" style={{ color: '#3b82f6' }}>https://sistema-monarch.vercel.app</a></p>
    </div>
  );
}
