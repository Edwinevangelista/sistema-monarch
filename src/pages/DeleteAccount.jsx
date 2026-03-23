import React from 'react';

export default function DeleteAccount() {
  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 24px', fontFamily: 'system-ui, sans-serif', color: '#1f2937', lineHeight: 1.7 }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>Delete Your FinGuide Account</h1>
      <p style={{ color: '#6b7280', marginBottom: 32 }}>Last updated: March 22, 2026</p>

      <p>You can request the deletion of your FinGuide account and all associated data by following the steps below.</p>

      <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 32, marginBottom: 12 }}>How to Delete Your Account</h2>

      <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: 24, marginBottom: 24 }}>
        <p style={{ margin: 0, fontWeight: 600, marginBottom: 12 }}>Option 1 — From within the app:</p>
        <ol style={{ paddingLeft: 24, margin: 0 }}>
          <li>Open FinGuide and log in</li>
          <li>Go to <strong>Profile</strong> (top right icon)</li>
          <li>Scroll to the bottom and tap <strong>"Delete Account"</strong></li>
          <li>Confirm the deletion</li>
        </ol>
      </div>

      <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: 24, marginBottom: 24 }}>
        <p style={{ margin: 0, fontWeight: 600, marginBottom: 12 }}>Option 2 — By email:</p>
        <p style={{ margin: 0 }}>Send an email to <a href="mailto:finguideapp@gmail.com" style={{ color: '#3b82f6' }}>finguideapp@gmail.com</a> with the subject line <strong>"Account Deletion Request"</strong> and include the email address associated with your account. We will process your request within 7 business days.</p>
      </div>

      <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 32, marginBottom: 12 }}>What Data Gets Deleted</h2>
      <p>When you delete your account, the following data is <strong>permanently deleted</strong>:</p>
      <ul style={{ paddingLeft: 24 }}>
        <li>Your account information (name, email)</li>
        <li>All financial data (income, expenses, debts, subscriptions, accounts)</li>
        <li>Your financial plan and history</li>
        <li>All app preferences and settings</li>
      </ul>

      <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 32, marginBottom: 12 }}>Data Retention</h2>
      <p>Some data may be retained for up to <strong>30 days</strong> in encrypted backups before being permanently erased. Payment records may be retained for up to <strong>7 years</strong> as required by law.</p>

      <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 32, marginBottom: 12 }}>Contact Us</h2>
      <p>If you have questions, contact us at <a href="mailto:finguideapp@gmail.com" style={{ color: '#3b82f6' }}>finguideapp@gmail.com</a></p>

      <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid #e5e7eb', color: '#9ca3af', fontSize: 14 }}>
        © 2026 FinGuide. All rights reserved.
      </div>
    </div>
  );
}
