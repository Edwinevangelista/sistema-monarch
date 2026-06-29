begin;

drop policy if exists "Users can delete own deudas" on public.deudas;
drop policy if exists "Users can insert own deudas" on public.deudas;
drop policy if exists "Users can update own deudas" on public.deudas;
drop policy if exists "Users can view own deudas" on public.deudas;

drop policy if exists "Users can delete own gastos_fijos" on public.gastos_fijos;
drop policy if exists "Users can insert own gastos_fijos" on public.gastos_fijos;
drop policy if exists "Users can update own gastos_fijos" on public.gastos_fijos;
drop policy if exists "Users can view own gastos_fijos" on public.gastos_fijos;

drop policy if exists "Users can delete own gastos_variables" on public.gastos_variables;
drop policy if exists "Users can insert own gastos_variables" on public.gastos_variables;
drop policy if exists "Users can update own gastos_variables" on public.gastos_variables;
drop policy if exists "Users can view own gastos_variables" on public.gastos_variables;

drop policy if exists "Users can delete own ingresos" on public.ingresos;
drop policy if exists "Users can insert own ingresos" on public.ingresos;
drop policy if exists "Users can update own ingresos" on public.ingresos;
drop policy if exists "Users can view own ingresos" on public.ingresos;

drop policy if exists "Users can delete own suscripciones" on public.suscripciones;
drop policy if exists "Users can insert own suscripciones" on public.suscripciones;
drop policy if exists "Users can update own suscripciones" on public.suscripciones;
drop policy if exists "Users can view own suscripciones" on public.suscripciones;

commit;
