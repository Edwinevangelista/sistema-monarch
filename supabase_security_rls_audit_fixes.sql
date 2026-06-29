-- Sistema Monarch / FinGuide
-- Security + RLS hardening for finance tables.
--
-- Run in Supabase SQL Editor or through:
--   supabase db push
--
-- What this does:
-- 1. Enables RLS on finance/user-owned tables that exist.
-- 2. Replaces broad policies with one owner-only policy per table.
-- 3. Adds duplicate-prevention columns/index for generated recurring expenses.
-- 4. Adds verification queries at the bottom.
--
-- IMPORTANT:
-- Run this as a database owner from the Supabase Dashboard SQL Editor.

begin;

do $$
declare
  t text;
  finance_tables text[] := array[
    'perfiles',
    'ingresos',
    'gastos_variables',
    'gastos_fijos',
    'suscripciones',
    'deudas',
    'cuentas_bancarias',
    'movimientos_bancarios',
    'pagos_tarjeta',
    'metas',
    'planes_guardados',
    'snapshots_mensuales',
    'presupuesto_categorias',
    'push_subscriptions'
  ];
begin
  foreach t in array finance_tables loop
    if to_regclass('public.' || quote_ident(t)) is not null then
      execute format('alter table public.%I enable row level security', t);

      if exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name = t
          and column_name = 'user_id'
      ) then
        execute format('drop policy if exists "owner_select_%1$s" on public.%1$I', t);
        execute format('drop policy if exists "owner_insert_%1$s" on public.%1$I', t);
        execute format('drop policy if exists "owner_update_%1$s" on public.%1$I', t);
        execute format('drop policy if exists "owner_delete_%1$s" on public.%1$I', t);

        execute format(
          'create policy "owner_select_%1$s" on public.%1$I for select using (auth.uid() = user_id)',
          t
        );
        execute format(
          'create policy "owner_insert_%1$s" on public.%1$I for insert with check (auth.uid() = user_id)',
          t
        );
        execute format(
          'create policy "owner_update_%1$s" on public.%1$I for update using (auth.uid() = user_id) with check (auth.uid() = user_id)',
          t
        );
        execute format(
          'create policy "owner_delete_%1$s" on public.%1$I for delete using (auth.uid() = user_id)',
          t
        );
      elsif exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name = t
          and column_name = 'id'
          and t = 'perfiles'
      ) then
        execute 'drop policy if exists "profile_select_own" on public.perfiles';
        execute 'drop policy if exists "profile_insert_own" on public.perfiles';
        execute 'drop policy if exists "profile_update_own" on public.perfiles';
        execute 'drop policy if exists "profile_delete_own" on public.perfiles';

        execute 'create policy "profile_select_own" on public.perfiles for select using (auth.uid() = id)';
        execute 'create policy "profile_insert_own" on public.perfiles for insert with check (auth.uid() = id)';
        execute 'create policy "profile_update_own" on public.perfiles for update using (auth.uid() = id) with check (auth.uid() = id)';
        execute 'create policy "profile_delete_own" on public.perfiles for delete using (auth.uid() = id)';
      end if;
    end if;
  end loop;
end $$;

-- Prevent duplicate generated charges for fixed/recurrent/subscription expenses.
-- This is intentionally nullable so existing/manual rows keep working.
alter table if exists public.gastos_variables
  add column if not exists origin_type text,
  add column if not exists origin_id uuid,
  add column if not exists period_key text;

create unique index if not exists gastos_variables_unique_generated_origin_period
on public.gastos_variables(user_id, origin_type, origin_id, period_key)
where origin_type is not null
  and origin_id is not null
  and period_key is not null;

commit;

-- Verification queries:
-- Run these while logged in as a normal authenticated user in Supabase SQL Editor.
-- They should return 0 rows or be blocked by RLS.

select 'gastos_variables_cross_user_visible' as check_name, count(*) as rows_visible
from public.gastos_variables
where user_id <> auth.uid();

select 'deudas_cross_user_visible' as check_name, count(*) as rows_visible
from public.deudas
where user_id <> auth.uid();

select 'cuentas_cross_user_visible' as check_name, count(*) as rows_visible
from public.cuentas_bancarias
where user_id <> auth.uid();

select 'suscripciones_cross_user_visible' as check_name, count(*) as rows_visible
from public.suscripciones
where user_id <> auth.uid();
