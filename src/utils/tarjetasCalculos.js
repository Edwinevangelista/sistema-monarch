// ===========================================
// 💳 UTILIDADES PARA CÁLCULOS DE TARJETAS
// ===========================================

/**
 * Calcula el pago mínimo basado en el saldo actual
 * @param {number} saldo - Saldo pendiente de la tarjeta
 * @param {number} apr - Tasa anual (ejemplo: 0.30 para 30%)
 * @returns {number} Pago mínimo calculado
 */
export const calcularPagoMinimo = (saldo, apr = 0) => {
  const saldoNum = Number(saldo || 0)
  
  if (saldoNum <= 0) return 0
  
  // Opción 1: 2% del saldo o $25 (lo que sea mayor)
  const porcentaje = saldoNum * 0.02
  return Math.max(porcentaje, 25)
}

/**
 * Obtiene el estado visual de la tarjeta basado en su saldo
 * @param {number} saldo - Saldo actual
 * @param {string} ultimoPago - Fecha del último pago
 * @returns {object} Estado con badge, color y descripción
 */
export const getEstadoTarjeta = (saldo, ultimoPago) => {
  const saldoNum = Number(saldo || 0)
  
  if (saldoNum === 0) {
    return {
      estado: 'saldada',
      badge: '✅ Saldada',
      color: 'green',
      descripcion: 'Sin deuda pendiente'
    }
  }
  
  if (saldoNum > 0) {
    return {
      estado: 'activa',
      badge: '💳 Activa',
      color: 'red',
      descripcion: `Saldo: $${saldoNum.toFixed(2)}`
    }
  }
  
  return {
    estado: 'inactiva',
    badge: '⏸️ Inactiva',
    color: 'gray',
    descripcion: 'Sin movimientos'
  }
}