/**
 * formatters.js — Utilidades de formato compartidas para toda la app
 * Uso: import { fmt, fmtPct, fmtCompact } from '../utils/formatters'
 */

/**
 * Formatea un número como moneda.
 * - Montos >= $10,000 → sin decimales: $12,500
 * - Montos < $10,000  → con 2 decimales: $1,234.56
 * - Siempre con separador de miles
 * @param {number} amount
 * @param {boolean} forceDecimals — fuerza siempre 2 decimales
 */
export function fmt(amount, forceDecimals = false) {
  const n = Number(amount) || 0
  const absN = Math.abs(n)
  const sign = n < 0 ? '-' : ''

  if (forceDecimals || absN < 10_000) {
    return `${sign}$${absN.toLocaleString('es-MX', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }

  return `${sign}$${absN.toLocaleString('es-MX', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`
}

/**
 * Formato compacto para espacios reducidos.
 * $1,234,567 → $1.2M | $123,456 → $123K | $1,234 → $1,234
 */
export function fmtCompact(amount) {
  const n = Number(amount) || 0
  const abs = Math.abs(n)
  const sign = n < 0 ? '-' : ''

  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`
  if (abs >= 100_000)   return `${sign}$${Math.round(abs / 1_000)}K`
  if (abs >= 10_000)    return `${sign}$${(abs / 1_000).toFixed(1)}K`
  return fmt(n)
}

/**
 * Formatea un porcentaje.
 * fmtPct(0.205) → "20.5%"
 * fmtPct(20.5, false) → "20.5%" (si ya viene como 0-100)
 * @param {number} value — valor 0-1 (decimal) por defecto
 * @param {boolean} isDecimal — true si el valor ya es 0-1
 */
export function fmtPct(value, isDecimal = true) {
  const pct = isDecimal ? (Number(value) || 0) * 100 : (Number(value) || 0)
  return `${pct.toFixed(1).replace('.0', '')}%`
}

/**
 * Formatea días restantes de forma legible
 * fmtDays(1) → "mañana" | fmtDays(0) → "hoy" | fmtDays(7) → "en 7 días"
 */
export function fmtDays(days) {
  if (days === 0) return 'hoy'
  if (days === 1) return 'mañana'
  if (days < 0)  return `hace ${Math.abs(days)} días`
  return `en ${days} días`
}

/**
 * Alias corto para compatibilidad
 */
export const formatCurrency = fmt
export const formatPct = fmtPct
export const formatCompact = fmtCompact
