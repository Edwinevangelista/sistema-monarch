-- Migration: Tabla de metas financieras
-- Permite al usuario definir objetivos de ahorro/pago con seguimiento
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS metas (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre          TEXT NOT NULL,
  descripcion     TEXT,
  tipo            TEXT NOT NULL DEFAULT 'ahorro'
                    CHECK (tipo IN ('ahorro','emergencia','viaje','deuda','inversion','otro')),
  emoji           TEXT DEFAULT '🎯',
  color           TEXT DEFAULT '#6366f1',
  monto_objetivo  NUMERIC(12,2) NOT NULL DEFAULT 0,
  monto_actual    NUMERIC(12,2) NOT NULL DEFAULT 0,
  fecha_limite    DATE,
  activa          BOOLEAN NOT NULL DEFAULT true,
  completada      BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE metas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "metas_select" ON metas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "metas_insert" ON metas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "metas_update" ON metas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "metas_delete" ON metas FOR DELETE USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS metas_updated_at ON metas;
CREATE TRIGGER metas_updated_at
  BEFORE UPDATE ON metas
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Índice para listado por usuario
CREATE INDEX IF NOT EXISTS idx_metas_user_activa
  ON metas (user_id, activa, completada);
