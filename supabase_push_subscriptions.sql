-- ============================================================
-- push_subscriptions — Web Push VAPID subscriptions
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- ============================================================

create table if not exists push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  endpoint    text not null,
  p256dh      text,
  auth        text,
  subscription jsonb,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),

  -- One subscription row per user (upsert on conflict)
  unique (user_id)
);

-- RLS: users can only see/modify their own subscriptions
alter table push_subscriptions enable row level security;

create policy "Users manage own push subscription"
  on push_subscriptions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Service role bypasses RLS automatically (needed for cron job)

-- Index for fast lookups by user
create index if not exists idx_push_subs_user_id on push_subscriptions(user_id);

-- If the table already exists but is missing p256dh/auth columns, add them:
-- alter table push_subscriptions add column if not exists p256dh text;
-- alter table push_subscriptions add column if not exists auth text;
