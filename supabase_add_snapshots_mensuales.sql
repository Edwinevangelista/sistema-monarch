-- Migration: Tabla de snapshots mensuales
-- Guarda KPIs financieros auditados al cierre de cada mes
-- Los datos son inmutables una vez guardados (historial real)
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS snapshots_mensuales (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mes             TEXT NOT NULL,           -- formato 'YYYY-MM'
  total_ingresos  NUMERIC(12,2) DEFAULT 0,
  total_gastos_variables NUMERIC(12,2) DEFAULT 0,
  total_gastos_fijos     NUMERIC(12,2) DEFAULT 0,
  total_suscripciones    NUMERIC(12,2) DEFAULT 0,
  total_gastos    NUMERIC(12,2) DEFAULT 0,
  total_deudas    NUMERIC(12,2) DEFAULT 0,
  saldo           NUMERIC(12,2) DEFAULT 0,
  tasa_ahorro     NUMERIC(6,4)  DEFAULT 0, -- porcentaje como decimal (0.15 = 15%)
  num_transacciones INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, mes)
);

-- RLS
ALTER TABLE snapshots_mensuales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "snapshots_select" ON snapshots_mensuales
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "snapshots_insert" ON snapshots_mensuales
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Solo se permite INSERT, no UPDATE — los snapshots son inmutables
-- Para regenerar, borrar y reinsertar

-- Índice para consultas por usuario + mes
CREATE INDEX IF NOT EXISTS idx_snapshots_user_mes
  ON snapshots_mensuales (user_id, mes DESC);
