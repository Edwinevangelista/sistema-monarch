-- Agregar columna deuda_id a gastos_variables
-- Permite vincular un gasto a una tarjeta de crédito específica
-- para poder mostrar el historial de compras por tarjeta

ALTER TABLE gastos_variables
ADD COLUMN IF NOT EXISTS deuda_id UUID REFERENCES deudas(id) ON DELETE SET NULL;

-- Crear índice para acelerar consultas por tarjeta
CREATE INDEX IF NOT EXISTS idx_gastos_variables_deuda_id
ON gastos_variables(deuda_id)
WHERE deuda_id IS NOT NULL;
