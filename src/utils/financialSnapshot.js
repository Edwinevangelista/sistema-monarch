const toMoney = (value) => {
  const number = Number(value)
  if (!Number.isFinite(number)) return 0
  return Math.round(number * 100) / 100
}

const parseLocalDate = (value) => {
  if (!value) return null
  if (value instanceof Date) return new Date(value.getFullYear(), value.getMonth(), value.getDate())
  const [year, month, day] = String(value).split('T')[0].split('-').map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day)
}

const dueDateForMonth = (referenceDate, day) => {
  const safeDay = Number(day)
  if (!safeDay) return null
  const lastDay = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0).getDate()
  return new Date(referenceDate.getFullYear(), referenceDate.getMonth(), Math.min(Math.max(1, safeDay), lastDay))
}

const isSameMonth = (date, referenceDate) =>
  date &&
  date.getFullYear() === referenceDate.getFullYear() &&
  date.getMonth() === referenceDate.getMonth()

const daysLeftInMonth = (referenceDate) => {
  const lastDay = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0).getDate()
  return Math.max(1, lastDay - referenceDate.getDate() + 1)
}

const sum = (items, selector) =>
  (Array.isArray(items) ? items : []).reduce((total, item) => toMoney(total + toMoney(selector(item))), 0)

function getPendingCommitments({ gastosFijos = [], suscripciones = [], deudas = [], referenceDate }) {
  const today = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate())

  const fijos = (Array.isArray(gastosFijos) ? gastosFijos : [])
    .filter((item) => item.estado !== 'Pagado')
    .map((item) => ({ item, date: dueDateForMonth(today, item.dia_venc), amount: toMoney(item.monto), label: item.nombre || 'Gasto fijo' }))
    .filter(({ date, amount }) => date && isSameMonth(date, today) && date >= today && amount > 0)

  const subs = (Array.isArray(suscripciones) ? suscripciones : [])
    .filter((item) => item.estado !== 'Cancelado')
    .map((item) => ({ item, date: parseLocalDate(item.proximo_pago), amount: toMoney(item.costo), label: item.servicio || 'Suscripcion' }))
    .filter(({ date, amount }) => date && isSameMonth(date, today) && date >= today && amount > 0)

  const pagosDeuda = (Array.isArray(deudas) ? deudas : [])
    .filter((item) => toMoney(item.saldo) > 0)
    .map((item) => ({ item, date: parseLocalDate(item.vence), amount: toMoney(item.pago_minimo), label: item.cuenta || item.nombre || 'Deuda' }))
    .filter(({ date, amount }) => date && isSameMonth(date, today) && date >= today && amount > 0)

  return [...fijos, ...subs, ...pagosDeuda].sort((a, b) => a.date - b.date)
}

function getTopCategory(gastosMes = []) {
  const totals = {}
  for (const gasto of Array.isArray(gastosMes) ? gastosMes : []) {
    const category = gasto.categoria || 'Otros'
    totals[category] = toMoney((totals[category] || 0) + toMoney(gasto.monto))
  }
  const entries = Object.entries(totals).sort((a, b) => b[1] - a[1])
  if (!entries.length) return null
  return { categoria: entries[0][0], monto: entries[0][1] }
}

function buildAction({ pendingCommitments, cashAfterCommitments, dailySafeSpend, savingsRate, dti, topCategory, totalIngresos, referenceDate }) {
  const urgent = pendingCommitments.find((item) => {
    const days = Math.ceil((item.date - referenceDate) / 86400000)
    return days <= 1
  })

  if (urgent) {
    return {
      tone: 'urgent',
      title: `Paga ${urgent.label}`,
      detail: `Monto próximo: $${urgent.amount.toLocaleString('en-US', { maximumFractionDigits: 2 })}. Evita cargos y protege tu flujo.`,
      cta: 'Ver pagos',
    }
  }

  if (cashAfterCommitments <= 0 || dailySafeSpend <= 0) {
    return {
      tone: 'risk',
      title: 'Congela gastos no esenciales',
      detail: 'Tus compromisos del mes consumen el dinero disponible. Registra solo lo necesario hasta el próximo ingreso.',
      cta: 'Registrar gasto',
    }
  }

  if (dti > 36) {
    return {
      tone: 'warning',
      title: 'Baja presión de deuda',
      detail: `Tus pagos mínimos usan ${dti}% del ingreso. Prioriza la deuda con mayor interés o menor saldo.`,
      cta: 'Ver deudas',
    }
  }

  if (topCategory && totalIngresos > 0 && topCategory.monto > totalIngresos * 0.2) {
    const target = toMoney(topCategory.monto * 0.1)
    return {
      tone: 'warning',
      title: `Recorta ${topCategory.categoria}`,
      detail: `Una reducción de 10% libera cerca de $${target.toLocaleString('en-US', { maximumFractionDigits: 0 })} este mes.`,
      cta: 'Analizar gastos',
    }
  }

  if (savingsRate < 0.2 && totalIngresos > 0) {
    return {
      tone: 'good',
      title: 'Aparta ahorro primero',
      detail: 'Mueve una cantidad pequeña a una meta antes de gastar. El objetivo sano es acercarte al 20%.',
      cta: 'Ver metas',
    }
  }

  return {
    tone: 'good',
    title: 'Mantén el ritmo',
    detail: 'Tus números están bajo control. Registra los movimientos de hoy para conservar una foto real.',
    cta: 'Registrar gasto',
  }
}

export function crearResumenFinanciero({
  cuentas = [],
  deudas = [],
  ingresos = [],
  gastosMes = [],
  gastosFijos = [],
  suscripciones = [],
  saldoMes = 0,
  totalIngresos = 0,
  totalGastos = 0,
  tasaAhorro = 0,
  dti = 0,
  financialHealth = 0,
  referenceDate = new Date(),
} = {}) {
  const today = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate())
  const activosEnCuentas = sum(cuentas, (cuenta) => cuenta.balance)
  const activos = activosEnCuentas > 0 || cuentas.length > 0 ? activosEnCuentas : toMoney(saldoMes)
  const pasivos = sum(deudas, (deuda) => deuda.saldo)
  const patrimonioNeto = toMoney(activos - pasivos)
  const pendingCommitments = getPendingCommitments({ gastosFijos, suscripciones, deudas, referenceDate: today })
  const compromisosPendientes = sum(pendingCommitments, (commitment) => commitment.amount)
  const cashAfterCommitments = toMoney(activos - compromisosPendientes)
  const dailySafeSpend = toMoney(Math.max(0, cashAfterCommitments) / daysLeftInMonth(today))
  const ingresosMes = totalIngresos || sum(ingresos, (ingreso) => ingreso.monto)
  const gastosVariablesMes = sum(gastosMes, (gasto) => gasto.monto)
  const savingsRate = Number.isFinite(Number(tasaAhorro))
    ? Number(tasaAhorro)
    : ingresosMes > 0 ? (ingresosMes - totalGastos) / ingresosMes : 0
  const topCategory = getTopCategory(gastosMes)

  const status =
    cashAfterCommitments < 0 ? 'riesgo' :
    dti > 43 ? 'deuda_alta' :
    savingsRate >= 0.2 && financialHealth >= 70 ? 'saludable' :
    'estable'

  return {
    activos: toMoney(activos),
    pasivos: toMoney(pasivos),
    patrimonioNeto,
    ingresosMes: toMoney(ingresosMes),
    gastosMes: toMoney(totalGastos || gastosVariablesMes),
    gastosVariablesMes: toMoney(gastosVariablesMes),
    compromisosPendientes,
    cashAfterCommitments,
    dailySafeSpend,
    savingsRate,
    dti: Number(dti) || 0,
    financialHealth: Number(financialHealth) || 0,
    status,
    nextCommitment: pendingCommitments[0] || null,
    topCategory,
    action: buildAction({
      pendingCommitments,
      cashAfterCommitments,
      dailySafeSpend,
      savingsRate,
      dti: Number(dti) || 0,
      topCategory,
      totalIngresos: ingresosMes,
      referenceDate: today,
    }),
  }
}

export { toMoney }
