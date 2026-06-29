-- Migration: Tabla de planes financieros guardados
-- Almacena planes de ahorro, deuda y otros objetivos con seguimiento
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS planes_guardados (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo              TEXT NOT NULL DEFAULT 'ahorro'
                      CHECK (tipo IN ('ahorro','deuda','emergencia','inversion','retiro','otro')),
  nombre            TEXT NOT NULL,
  descripcion       TEXT,
  configuracion     JSONB DEFAULT '{}',
  meta_principal    TEXT,
  monto_objetivo    NUMERIC(12,2) DEFAULT 0,
  monto_actual      NUMERIC(12,2) DEFAULT 0,
  progreso          NUMERIC(5,2) DEFAULT 0,
  fecha_inicio      DATE DEFAULT CURRENT_DATE,
  fecha_objetivo    DATE,
  meses_duracion    INTEGER,
  activo            BOOLEAN NOT NULL DEFAULT true,
  completado        BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE planes_guardados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "planes_select" ON planes_guardados FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "planes_insert" ON planes_guardados FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "planes_update" ON planes_guardados FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "planes_delete" ON planes_guardados FOR DELETE USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS planes_guardados_updated_at ON planes_guardados;
CREATE TRIGGER planes_guardados_updated_at
  BEFORE UPDATE ON planes_guardados
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Índice para listado por usuario
CREATE INDEX IF NOT EXISTS idx_planes_user_activo
  ON planes_guardados (user_id, activo, completado, created_at DESC);
