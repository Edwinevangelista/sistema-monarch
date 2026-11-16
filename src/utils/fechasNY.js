// src/utils/fechasNY.js — Fase 1
// Todas las fechas de vencimiento y avisos se calculan en America/New_York.
// Antes todo usaba toISOString() (UTC): entre las 00:00 y las 05:00 de NY
// la fecha UTC ya era el día siguiente y los avisos se desplazaban un día.
// Los archivos api/*.js (CommonJS) no pueden importar este módulo ESM:
// api/cron-notifications.js lleva su propia copia mínima de hoyNY/diffDiasNY.

const ZONA_NY = 'America/New_York'

// 'YYYY-MM-DD' de hoy en Nueva York. Acepta Date o 'YYYY-MM-DD'.
export function hoyNY(fecha = new Date()) {
  const d = fecha instanceof Date ? fecha : parseFechaLocal(fecha)
  if (!d) return null
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA_NY, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(d)
}

// Parsea 'YYYY-MM-DD' (o un ISO con hora) a un Date al mediodía local.
// Mediodía, no medianoche: inmune al cambio UTC y al DST. Nunca usar
// new Date('YYYY-MM-DD') (medianoche UTC) ni new Date(fecha) sin sufijo.
export function parseFechaLocal(fechaStr) {
  if (!fechaStr) return null
  if (fechaStr instanceof Date) return fechaStr
  const soloFecha = String(fechaStr).slice(0, 10)
  const [y, m, d] = soloFecha.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d, 12, 0, 0, 0)
}

// 'YYYY-MM-DD' de un Date local, sin pasar por UTC.
export function formatoFechaLocal(fecha) {
  if (!fecha) return null
  const y = fecha.getFullYear()
  const m = String(fecha.getMonth() + 1).padStart(2, '0')
  const d = String(fecha.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// Días enteros de calendario entre hoy (NY) y la fecha de vencimiento.
// Negativo = vencido. No usa milisegundos ni Math.ceil: a las 8pm una
// deuda que vence "hoy" ya no sale con diff -1.
export function diffDiasNY(fechaVence, hoy = new Date()) {
  const vence = typeof fechaVence === 'string' ? parseFechaLocal(fechaVence) : fechaVence
  if (!vence) return null
  const hoyStr = hoyNY(hoy)
  const venceStr = formatoFechaLocal(vence)
  if (!hoyStr || !venceStr) return null
  const aUTC = (s) => {
    const [y, m, d] = s.split('-').map(Number)
    return Date.UTC(y, m - 1, d)
  }
  return Math.round((aUTC(venceStr) - aUTC(hoyStr)) / 86400000)
}

// Próxima fecha 'YYYY-MM-DD' en que cae un día de mes (dia_venc), a
// partir de hoy: este mes si todavía no pasó, si no el mes siguiente.
// Si el mes no tiene ese día (p. ej. 31 en febrero), usa el último día.
export function proximaFechaDiaMes(dia, hoy = new Date()) {
  const diaNum = Number(dia)
  if (!diaNum || diaNum < 1) return null
  const [y, m, dHoy] = hoyNY(hoy).split('-').map(Number)
  let yy = y
  let mm = m
  if (diaNum < dHoy) {
    mm += 1
    if (mm > 12) { mm = 1; yy += 1 }
  }
  const ultimoDiaMes = new Date(yy, mm, 0).getDate()
  const dd = Math.min(diaNum, ultimoDiaMes)
  return `${yy}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`
}
