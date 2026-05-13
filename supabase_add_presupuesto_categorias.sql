-- Migration: Add presupuesto_categorias JSONB column to perfiles
-- Allows per-category budget limits to sync across devices
-- Run in Supabase SQL Editor

ALTER TABLE perfiles
  ADD COLUMN IF NOT EXISTS presupuesto_categorias JSONB DEFAULT '{}';

-- Optional index for JSONB queries
CREATE INDEX IF NOT EXISTS idx_perfiles_presupuesto
  ON perfiles USING gin(presupuesto_categorias);
