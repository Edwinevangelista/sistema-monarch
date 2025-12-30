-- Agregar columna recurrente a gastos_fijos
ALTER TABLE gastos_fijos 
ADD COLUMN IF NOT EXISTS recurrente BOOLEAN DEFAULT true;

-- Actualizar gastos existentes como recurrentes por defecto
UPDATE gastos_fijos 
SET recurrente = true 
WHERE recurrente IS NULL;
