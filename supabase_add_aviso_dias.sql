-- FinTrack — Fase 1: lead-time de aviso por ítem
-- ---------------------------------------------------------------------------
-- CÓMO CORRERLO: en Supabase Dashboard → SQL Editor → pegar y Run.
-- No se corre desde la app ni desde Vercel.
--
-- QUÉ HACE: añade `aviso_dias` (días antes del vencimiento para avisar)
-- a gastos fijos, suscripciones y deudas. Default 3 = comportamiento
-- actual del cron de Vercel. 0 = avisar solo el día del vencimiento.
-- La app lee el valor si existe; si la columna aún no existe, la app
-- sigue funcionando (usa el default y reintenta el guardado sin el campo).
-- ---------------------------------------------------------------------------

alter table public.gastos_fijos
  add column if not exists aviso_dias int default 3;

alter table public.suscripciones
  add column if not exists aviso_dias int default 3;

alter table public.deudas
  add column if not exists aviso_dias int default 3;
