begin;

create table if not exists public.user_plan (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'premium')),
  updated_at timestamptz default now()
);

alter table public.user_plan enable row level security;

drop policy if exists "user_plan_select_own" on public.user_plan;
drop policy if exists "user_plan_service_role_all" on public.user_plan;

create policy "user_plan_select_own"
on public.user_plan
for select
using (auth.uid() = user_id);

create policy "user_plan_service_role_all"
on public.user_plan
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

create or replace function public.create_default_user_plan()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_plan (user_id, plan)
  values (new.id, 'free')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_user_plan on auth.users;
create trigger on_auth_user_created_user_plan
after insert on auth.users
for each row execute function public.create_default_user_plan();

insert into public.user_plan (user_id, plan)
select id, 'free'
from auth.users
on conflict (user_id) do nothing;

create or replace function public.enforce_free_tier_quantity_limits()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan text;
  v_count integer;
  v_limit integer;
  v_table text := tg_table_name;
begin
  select coalesce(plan, 'free')
    into v_plan
  from public.user_plan
  where user_id = new.user_id;

  v_plan := coalesce(v_plan, 'free');

  if v_plan = 'premium' then
    return new;
  end if;

  if v_table = 'cuentas_bancarias' then
    v_limit := 2;
    select count(*) into v_count
    from public.cuentas_bancarias
    where user_id = new.user_id;
  elsif v_table = 'deudas' then
    v_limit := 2;
    select count(*) into v_count
    from public.deudas
    where user_id = new.user_id;
  else
    return new;
  end if;

  if v_count >= v_limit then
    raise exception 'Has alcanzado el límite del plan gratis (% registros)', v_limit
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_free_tier_cuentas on public.cuentas_bancarias;
create trigger enforce_free_tier_cuentas
before insert on public.cuentas_bancarias
for each row execute function public.enforce_free_tier_quantity_limits();

drop trigger if exists enforce_free_tier_deudas on public.deudas;
create trigger enforce_free_tier_deudas
before insert on public.deudas
for each row execute function public.enforce_free_tier_quantity_limits();

commit;
