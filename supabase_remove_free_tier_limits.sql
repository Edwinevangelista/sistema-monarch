-- FinTrack — Fase 1: quitar los límites del plan gratis en la base de datos
-- ---------------------------------------------------------------------------
-- CÓMO CORRERLO: en Supabase Dashboard → SQL Editor → pegar y Run.
-- No se corre desde la app ni desde Vercel.
--
-- POR QUÉ: src/config/limites.js ya deja todo gratis en la pantalla, pero
-- estos triggers seguían rechazando el 3er insert en la base de datos
-- (error P0001 "Has alcanzado el límite del plan gratis"). Sin este paso,
-- la app diría gratis pero guardar la 3ª cuenta o deuda fallaría.
-- Definidos originalmente en supabase_feature_gating.sql.
--
-- VERIFICAR DESPUÉS (con un usuario de prueba): crear 3 cuentas bancarias
-- y 3 deudas/tarjetas; las 3 deben guardarse sin error.
-- ---------------------------------------------------------------------------

drop trigger if exists enforce_free_tier_cuentas on public.cuentas_bancarias;
drop trigger if exists enforce_free_tier_deudas on public.deudas;
drop function if exists public.enforce_free_tier_quantity_limits();
