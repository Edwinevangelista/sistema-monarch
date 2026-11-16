-- supabase_marcar_pagado.sql
-- Fase 2: auditoría de "Marcar pagado desde la notificación".
-- CORRER en Supabase Dashboard -> SQL Editor (junto con
-- supabase_remove_free_tier_limits.sql y supabase_add_aviso_dias.sql).
--
-- La tabla guarda SOLO la huella sha256 del token (nunca el token),
-- para auditar qué pagos se marcaron desde una notificación y como
-- guarda extra contra doble uso. El endpoint api/marcar-pagado.js
-- funciona también sin esta tabla (los UPDATE condicionales y los
-- chequeos de estado ya impiden duplicar), pero sin ella no queda
-- registro de qué token se usó.

begin;

create table if not exists public.pagos_marcados_token (
  token_hash text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  tipo_item text not null,
  item_id uuid not null,
  vence_fecha date not null,
  monto numeric not null,
  created_at timestamptz not null default now()
);

alter table public.pagos_marcados_token enable row level security;

drop policy if exists "service_role_manage_pagos_marcados_token"
  on public.pagos_marcados_token;
create policy "service_role_manage_pagos_marcados_token"
  on public.pagos_marcados_token
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

commit;
