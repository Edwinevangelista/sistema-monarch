import { roundMoney } from './money'

// ===========================================
// UTILIDADES PARA CALCULOS DE TARJETAS
// ===========================================

/**
 * Calcula el pago minimo basado en saldo y APR real
 * Regla estandar: mayor entre (2% del saldo + interes mensual) o $25
 * @param {number} saldo - Saldo pendiente de la tarjeta
 * @param {number} apr   - Tasa anual como decimal (0.30 = 30%) o como porcentaje (30)
 * @returns {number} Pago minimo calculado
 */
export const calcularPagoMinimo = (saldo, apr = 0) => {
  const saldoNum = Number(saldo || 0)
  if (saldoNum <= 0) return 0

  // Normalizar APR: si viene como porcentaje (>1), convertir a decimal
  const aprDecimal = Number(apr || 0) > 1 ? Number(apr) / 100 : Number(apr || 0)
  const tasaMensual = aprDecimal / 12
  const interesMes = saldoNum * tasaMensual
  const porcentaje = saldoNum * 0.02

  // Regla real: mayor entre (2% saldo + interes del mes) o minimo $25
  return roundMoney(Math.max(porcentaje + interesMes, 25))
}

const parseFechaLocal = (value) => {
  if (!value) return null
  if (value instanceof Date) return new Date(value.getFullYear(), value.getMonth(), value.getDate())
  const datePart = String(value).split('T')[0].split(' ')[0]
  const [year, month, day] = datePart.split('-').map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day)
}

const toISODateLocal = (date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Calcula la proxima fecha de corte (avanza mes a mes hasta que sea futura)
 * @param {string|Date} venceActual - Fecha de corte actual
 * @returns {string|null} Fecha en formato YYYY-MM-DD o null
 */
export const calcularProximoCorte = (venceActual) => {
  if (!venceActual) return null
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const corte = parseFechaLocal(venceActual)
  if (!corte) return null
  corte.setHours(0, 0, 0, 0)
  // Avanzar mes a mes hasta que sea futuro
  while (corte <= hoy) {
    corte.setMonth(corte.getMonth() + 1)
  }
  return toISODateLocal(corte)
}

/**
 * Calcula la fecha limite de pago (fecha de corte + dias de gracia)
 * @param {string|Date} fechaCorte - Fecha de corte
 * @param {number} diasGracia      - Dias de gracia (default 21)
 * @returns {string|null} Fecha en formato YYYY-MM-DD o null
 */
export const calcularFechaLimitePago = (fechaCorte, diasGracia = 21) => {
  if (!fechaCorte) return null
  const corte = parseFechaLocal(fechaCorte)
  if (!corte) return null
  corte.setDate(corte.getDate() + diasGracia)
  return toISODateLocal(corte)
}

/**
 * Calcula el porcentaje de utilizacion de credito
 * @param {number} saldo  - Saldo actual usado
 * @param {number} limite - Limite de credito total
 * @returns {number|null} Porcentaje 0-100 o null si no hay limite
 */
export const calcularUsoCredito = (saldo, limite) => {
  if (!limite || Number(limite) <= 0) return null
  return Math.min(100, Math.round((Number(saldo || 0) / Number(limite)) * 100))
}

/**
 * Devuelve color segun el porcentaje de uso de credito
 * Verde <30%, Amarillo 30-70%, Rojo >70%
 * @param {number} uso - Porcentaje 0-100
 * @returns {object} { bar, text, label }
 */
export const colorUsoCredito = (uso) => {
  if (uso === null || uso === undefined) return null
  if (uso < 30) return { bar: 'bg-emerald-500', text: 'text-emerald-400', label: 'Saludable' }
  if (uso < 70) return { bar: 'bg-yellow-500',  text: 'text-yellow-400',  label: 'Moderado' }
  return         { bar: 'bg-red-500',    text: 'text-red-400',    label: 'Alto' }
}

/**
 * Obtiene el estado visual de la tarjeta basado en su saldo
 * @param {number} saldo      - Saldo actual
 * @param {string} ultimoPago - Fecha del ultimo pago
 * @returns {object} Estado con badge, color y descripcion
 */
export const getEstadoTarjeta = (saldo, ultimoPago) => {
  const saldoNum = Number(saldo || 0)

  if (saldoNum === 0) {
    return {
      estado: 'saldada',
      badge: 'Saldada',
      color: 'green',
      descripcion: 'Sin deuda pendiente'
    }
  }

  if (saldoNum > 0) {
    return {
      estado: 'activa',
      badge: 'Activa',
      color: 'red',
      descripcion: `Saldo: $${saldoNum.toFixed(2)}`
    }
  }

  return {
    estado: 'inactiva',
    badge: 'Inactiva',
    color: 'gray',
    descripcion: 'Sin movimientos'
  }
}
