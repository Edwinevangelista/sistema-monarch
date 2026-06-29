-- Migration: Add subscription/plan columns to perfiles table
-- Run this in the Supabase SQL Editor

ALTER TABLE perfiles
  ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free'
    CHECK (plan IN ('free', 'trial', 'premium')),
  ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS trial_used BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT DEFAULT NULL;

-- Index for fast lookups by plan (e.g. find all premium users for push notifications)
CREATE INDEX IF NOT EXISTS idx_perfiles_plan ON perfiles (plan);

-- RLS: users can read their own plan columns (already covered by existing policy)
-- No changes needed to existing RLS policies.

-- Helper view for checking if a user is currently on an active premium plan
CREATE OR REPLACE VIEW v_user_plan AS
SELECT
  id,
  plan,
  plan_expires_at,
  trial_used,
  trial_ends_at,
  CASE
    WHEN plan = 'premium' AND (plan_expires_at IS NULL OR plan_expires_at > NOW()) THEN true
    WHEN plan = 'trial' AND trial_ends_at IS NOT NULL AND trial_ends_at > NOW() THEN true
    ELSE false
  END AS is_active_premium
FROM perfiles;
