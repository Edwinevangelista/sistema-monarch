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

// Determina si un pago mensual de deuda ya fue cubierto este mes
// basándose en ultimo_pago. Si ultimo_pago está en el mes de referencia, está al día.
function deudaPagadaEsteMes(deuda, today) {
  if (!deuda.ultimo_pago) return false
  const up = parseLocalDate(deuda.ultimo_pago)
  return up && up.getFullYear() === today.getFullYear() && up.getMonth() === today.getMonth()
}

// Calcula cuántos meses de atraso tiene una deuda (para recurring_bill / installment)
function mesesAtraso(venceStr, ultimoPagoStr, today) {
  if (!venceStr) return 0
  const vence = parseLocalDate(venceStr)
  if (!vence) return 0
  // Si el vencimiento fue este mes o futuro, no hay atraso
  if (vence >= new Date(today.getFullYear(), today.getMonth(), 1)) return 0
  // Si ya se pagó este mes, no hay atraso
  if (ultimoPagoStr) {
    const up = parseLocalDate(ultimoPagoStr)
    if (up && up >= new Date(today.getFullYear(), today.getMonth(), 1)) return 0
  }
  // Calcular meses desde la fecha de vencimiento
  const meses = (today.getFullYear() - vence.getFullYear()) * 12 + (today.getMonth() - vence.getMonth())
  return Math.max(0, meses)
}

function getPendingCommitments({ gastosFijos = [], suscripciones = [], deudas = [], referenceDate }) {
  const today = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate())
  const inicioMes = new Date(today.getFullYear(), today.getMonth(), 1)

  // Gastos fijos: incluir los pendientes de este mes (ya vencidos O próximos)
  // Si dia_venc ya pasó pero estado sigue Pendiente → overdue, igual cuenta
  const fijos = (Array.isArray(gastosFijos) ? gastosFijos : [])
    .filter((item) => item.estado !== 'Pagado')
    .map((item) => {
      const date = dueDateForMonth(today, item.dia_venc)
      const overdue = date && date < today
      return {
        item,
        date: date || today,
        amount: toMoney(item.monto),
        label: item.nombre || 'Gasto fijo',
        overdue,
        priority: overdue ? 'high' : 'medium',
      }
    })
    .filter(({ date, amount }) => date && isSameMonth(date, today) && amount > 0)

  const subs = (Array.isArray(suscripciones) ? suscripciones : [])
    .filter((item) => item.estado !== 'Cancelado')
    .map((item) => ({ item, date: parseLocalDate(item.proximo_pago), amount: toMoney(item.costo), label: item.servicio || 'Suscripcion', priority: 'low' }))
    .filter(({ date, amount }) => date && isSameMonth(date, today) && date >= today && amount > 0)

  // Deudas: usar pago_minimo como obligación mensual, NO el saldo total
  // Incluir si:
  //   a) vence este mes y no se ha pagado este mes
  //   b) vence pasado (meses anteriores) y no se ha pagado este mes → overdue
  const pagosDeuda = (Array.isArray(deudas) ? deudas : [])
    .filter((item) => toMoney(item.saldo) > 0 && toMoney(item.pago_minimo) > 0)
    .filter((item) => !deudaPagadaEsteMes(item, today))
    .map((item) => {
      const venceDate = parseLocalDate(item.vence)
      const atraso = mesesAtraso(item.vence, item.ultimo_pago, today)
      const overdue = atraso > 0

      // Fecha de referencia para ordenar: si vence en el futuro usar esa fecha,
      // si ya pasó usar hoy (ya debería haberse pagado)
      const displayDate = venceDate
        ? (venceDate >= inicioMes ? venceDate : today)
        : today

      // Para installment_loan (Auto, Personal, Préstamo) el impacto es solo pago_minimo
      // Para revolving (Tarjeta) igual — nunca usar saldo total como obligación mensual
      return {
        item,
        date: displayDate,
        amount: toMoney(item.pago_minimo),
        label: item.cuenta || 'Deuda',
        overdue,
        atraso,
        priority: overdue ? (item.tipo === 'Auto' ? 'critical' : 'high') : 'medium',
      }
    })
    // Incluir deudas con vence este mes, o sin fecha de vence pero que no se han pagado este mes
    .filter(({ item, overdue }) => {
      const venceDate = parseLocalDate(item.vence)
      if (overdue) return true // Vencida → siempre incluir
      if (!venceDate) return true // Sin fecha → siempre pendiente
      return isSameMonth(venceDate, today) || venceDate >= inicioMes
    })

  const all = [...fijos, ...subs, ...pagosDeuda]

  // Ordenar: overdue primero, luego por fecha
  return all.sort((a, b) => {
    if (a.overdue && !b.overdue) return -1
    if (!a.overdue && b.overdue) return 1
    return a.date - b.date
  })
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
  // Primero: deudas/fijos vencidos (overdue) tienen mayor prioridad
  const overdue = pendingCommitments.find((item) => item.overdue)
  if (overdue) {
    const mesesStr = overdue.atraso > 1 ? ` (${overdue.atraso} meses)` : ''
    return {
      tone: 'risk',
      title: `${overdue.label} vencido${mesesStr}`,
      detail: `Pago de $${overdue.amount.toLocaleString('en-US', { maximumFractionDigits: 2 })} pendiente. Regulariza cuanto antes para evitar cargos.`,
      cta: 'Ver pagos',
    }
  }

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
