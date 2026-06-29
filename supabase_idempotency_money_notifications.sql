begin;

alter table if exists public.gastos_variables
  add column if not exists idempotency_key text;

create unique index if not exists gastos_variables_idempotency_key_unique
on public.gastos_variables(idempotency_key)
where idempotency_key is not null;

create table if not exists public.notificaciones_enviadas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tipo text not null,
  fecha date not null,
  created_at timestamptz not null default now(),
  unique (user_id, tipo, fecha)
);

alter table public.notificaciones_enviadas enable row level security;

drop policy if exists "service_role_manage_notificaciones_enviadas" on public.notificaciones_enviadas;
create policy "service_role_manage_notificaciones_enviadas"
on public.notificaciones_enviadas
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

commit;
