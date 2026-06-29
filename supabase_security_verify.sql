select
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind in ('r', 'p')
  and c.relname in (
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
  )
order by c.relname;

select
  schemaname,
  tablename,
  policyname,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename in (
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
  )
order by tablename, policyname;

select
  table_name,
  column_name,
  data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'gastos_variables'
  and column_name in ('origin_type', 'origin_id', 'period_key')
order by column_name;

select
  indexname,
  indexdef
from pg_indexes
where schemaname = 'public'
  and tablename = 'gastos_variables'
  and indexname = 'gastos_variables_unique_generated_origin_period';
