// Sistema inteligente de cálculos financieros con manejo temporal

// Función auxiliar segura para calcular montos
const safeNumber = (val) => {
  const num = Number(val)
  return isNaN(num) ? 0 : num
}

const parseLocalDate = (value) => {
  if (!value) return null
  if (value instanceof Date) return new Date(value.getFullYear(), value.getMonth(), value.getDate())
  const datePart = String(value).split('T')[0]
  const [year, month, day] = datePart.split('-').map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day)
}

const dueDateForMonth = (year, month, day) => {
  const lastDay = new Date(year, month + 1, 0).getDate()
  const safeDay = Math.min(Math.max(1, Number(day) || 1), lastDay)
  return new Date(year, month, safeDay)
}

const monthlySubscriptionCost = (subscription) => {
  const costo = safeNumber(subscription.costo)
  if (subscription.ciclo === 'Anual') return costo / 12
  if (subscription.ciclo === 'Semanal') return costo * 4.33
  return costo
}

/**
 * Calcula balances financieros con vista real vs proyectada
 * REAL: Solo hasta hoy (lo que realmente ha pasado)
 * PROYECTADO: Mes completo (estimación)
 */
export const calcularBalanceInteligente = (
  ingresos = [],
  gastos = [],
  gastosFijos = [],
  suscripciones = [],
  fechaReferencia = new Date()
) => {
  const hoy = new Date(fechaReferencia)
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
  const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)
  
  // 📊 CÁLCULO REAL: Solo hasta HOY
  const real = calcularBalanceReal(
    ingresos,
    gastos,
    gastosFijos,
    suscripciones,
    inicioMes,
    hoy
  )
  
  // 🔮 CÁLCULO PROYECTADO: Mes completo
  const proyectado = calcularBalanceProyectado(
    ingresos,
    gastos,
    gastosFijos,
    suscripciones,
    inicioMes,
    finMes,
    hoy
  )
  
  return { real, proyectado }
}

/**
 * Balance REAL - Solo lo que ya pasó hasta hoy
 */
const calcularBalanceReal = (ingresos, gastos, gastosFijos, suscripciones, inicio, fin) => {
  // Ingresos que ya llegaron
  const ingresosReales = ingresos
    .filter(i => {
      const fecha = parseLocalDate(i.fecha)
      return fecha && fecha >= inicio && fecha <= fin
    })
    .reduce((sum, i) => sum + safeNumber(i.monto), 0)
  
  // Gastos variables que ya ocurrieron
  const gastosVariablesReales = gastos
    .filter(g => {
      const fecha = parseLocalDate(g.fecha)
      return fecha && fecha >= inicio && fecha <= fin
    })
    .reduce((sum, g) => sum + safeNumber(g.monto), 0)
  
  // Gastos fijos que ya vencieron o fueron pagados este mes.
  // No cuenta vencimientos futuros, para que el saldo real no se adelante.
  const gastosFijosReales = gastosFijos
    .filter(gf => {
      if (!gf.dia_venc) return false
      const vencimiento = dueDateForMonth(fin.getFullYear(), fin.getMonth(), gf.dia_venc)
      return vencimiento <= fin
    })
    .reduce((sum, gf) => sum + safeNumber(gf.monto), 0)
  
  const suscripcionesVencidas = suscripciones.filter(s => {
    if (s.estado !== 'Activo' || !s.proximo_pago) return false
    const proxPago = parseLocalDate(s.proximo_pago)
    return proxPago && proxPago >= inicio && proxPago <= fin
  })

  const suscripcionesPagadasEsteMes = suscripciones.filter(s => {
    if (s.estado !== 'Activo' || !s.proximo_pago) return false
    const proxPago = parseLocalDate(s.proximo_pago)
    if (!proxPago) return false

    // Si el próximo pago quedó después del mes actual, asumimos que este mes ya fue cubierto.
    return (
      proxPago.getFullYear() > fin.getFullYear() ||
      (proxPago.getFullYear() === fin.getFullYear() && proxPago.getMonth() > fin.getMonth())
    )
  })

  const suscripcionesReales = [...new Set([...suscripcionesVencidas, ...suscripcionesPagadasEsteMes])]
    .reduce((sum, s) => sum + monthlySubscriptionCost(s), 0)
  
// ✨ NUEVO: CALCULAR GASTOS PAGADOS (para visualización)
const gastosPagados = 
  // Gastos variables ya están pagados (todos los registrados)
  gastosVariablesReales +
  // Gastos fijos marcados como "Pagado"
  gastosFijos
    .filter(gf => {
      if (!gf.dia_venc) return false
      const vencimiento = dueDateForMonth(fin.getFullYear(), fin.getMonth(), gf.dia_venc)
      return vencimiento <= fin && gf.estado === 'Pagado'
    })
    .reduce((sum, gf) => sum + safeNumber(gf.monto), 0) +
  // ✅ CORRECCIÓN: Suscripciones cuyo próximo pago está en el MES SIGUIENTE
  suscripciones
    .filter(s => {
      if (s.estado !== 'Activo' || !s.proximo_pago) return false
      const proxPago = parseLocalDate(s.proximo_pago)
      
      // Si próximo pago es en el mes SIGUIENTE, significa que ya se pagó ESTE mes
      const esMesSiguiente = (
        proxPago.getFullYear() > fin.getFullYear() ||
        (proxPago.getFullYear() === fin.getFullYear() && proxPago.getMonth() > fin.getMonth())
      )
      
      return esMesSiguiente
    })
    .reduce((sum, s) => {
      return sum + monthlySubscriptionCost(s)
    }, 0)
  
  const totalGastos = gastosVariablesReales + gastosFijosReales + suscripcionesReales
  const saldo = ingresosReales - totalGastos
  const tasaAhorro = ingresosReales > 0 ? (ingresosReales - totalGastos) / ingresosReales : 0
  
  return {
    totalIngresos: ingresosReales,
    gastosVariables: gastosVariablesReales,
    gastosFijos: gastosFijosReales,
    suscripciones: suscripcionesReales,
    totalGastos,
    gastosPagados, // ✨ NUEVO
    saldo,
    tasaAhorro,
    tipo: 'real'
  }
}

/**
 * Balance PROYECTADO - Cómo terminará el mes completo
 */
const calcularBalanceProyectado = (ingresos, gastos, gastosFijos, suscripciones, inicio, fin, hoy) => {
  // Ingresos del mes + proyección de recurrentes
  const ingresosDelMes = ingresos
    .filter(i => {
      const fecha = parseLocalDate(i.fecha)
      return fecha && fecha >= inicio && fecha <= fin
    })
    .reduce((sum, i) => sum + safeNumber(i.monto), 0)
  
  // Proyectar ingresos futuros basados en recurrencia
  const ingresosRecurrentesProyectados = calcularIngresosRecurrentes(ingresos, inicio, fin, hoy)
  
  const totalIngresosProyectados = ingresosDelMes + ingresosRecurrentesProyectados
  
  // Todos los gastos fijos del mes
  const gastosFijosProyectados = gastosFijos
    .reduce((sum, gf) => sum + safeNumber(gf.monto), 0)
  
  // Gastos variables: actuales + proyección
  const gastosVariablesActuales = gastos
    .filter(g => {
      const fecha = parseLocalDate(g.fecha)
      return fecha && fecha >= inicio && fecha <= fin
    })
    .reduce((sum, g) => sum + safeNumber(g.monto), 0)
  
  // 🔒 CÁLCULO SEGURO DEL PROMEDIO DIARIO
  const msPerDay = 1000 * 60 * 60 * 24
  const diasTranscurridos = Math.max(1, Math.floor((hoy - inicio) / msPerDay) + 1)
  const promedioDiario = gastosVariablesActuales / diasTranscurridos
  const diasRestantes = Math.max(0, Math.floor((fin - hoy) / msPerDay))
  
  // Si el promedio no es válido, asumimos 0
  const promedioDiarioSeguro = Number.isFinite(promedioDiario) ? promedioDiario : 0
  
  const gastosVariablesProyectados = gastosVariablesActuales + (promedioDiarioSeguro * diasRestantes)
  
  // Todas las suscripciones activas del mes
  const suscripcionesProyectadas = suscripciones
    .filter(s => s.estado === 'Activo')
    .reduce((sum, s) => sum + monthlySubscriptionCost(s), 0)
  
  const totalGastos = gastosFijosProyectados + gastosVariablesProyectados + suscripcionesProyectadas
  const saldo = totalIngresosProyectados - totalGastos
  const tasaAhorro = totalIngresosProyectados > 0 ? (totalIngresosProyectados - totalGastos) / totalIngresosProyectados : 0
  
  // ✨ NUEVO: GASTOS PAGADOS PROYECTADOS (estimación)
  const gastosPagadosProyectados = 
    gastosVariablesActuales +
    gastosFijos.filter(gf => gf.estado === 'Pagado').reduce((sum, gf) => sum + safeNumber(gf.monto), 0)
  
  // Objeto de desglose
  const desglose = {
    ingresosDelMes,
    ingresosRecurrentesProyectados,
    gastosVariablesActuales,
    promedioDiario: promedioDiarioSeguro, 
    diasRestantes
  }
  
  return {
    totalIngresos: totalIngresosProyectados,
    gastosVariables: gastosVariablesProyectados,
    gastosFijos: gastosFijosProyectados,
    suscripciones: suscripcionesProyectadas,
    totalGastos,
    gastosPagados: gastosPagadosProyectados, // ✨ NUEVO
    saldo,
    tasaAhorro,
    tipo: 'proyectado',
    desglose,
    // ✅ APALANAR PROPIEDADES PARA EVITAR "UNDEFINED" EN WIDGET
    promedioDiario: promedioDiarioSeguro,
    diasRestantes,
    ingresosDelMes,
    ingresosRecurrentes: ingresosRecurrentesProyectados,
    gastosVariablesActuales
  }
}

/**
 * Calcula ingresos recurrentes proyectados para el mes
 */
const calcularIngresosRecurrentes = (ingresos, inicio, fin, hoy) => {
  let proyeccion = 0
  
  ingresos.forEach(ing => {
    if (!ing.frecuencia || ing.frecuencia === 'Único') return
    
    const fechaIngreso = parseLocalDate(ing.fecha)
    if (!fechaIngreso) return
    
    const monto = safeNumber(ing.monto)
    
    if (ing.frecuencia === 'Semanal') {
      const diasRestantes = Math.floor((fin - hoy) / (1000 * 60 * 60 * 24))
      const cobrosRestantes = Math.floor(diasRestantes / 7)
      proyeccion += monto * cobrosRestantes
    }
    
    else if (ing.frecuencia === 'Quincenal') {
      const diaHoy = hoy.getDate()
      if (diaHoy < 15 && fechaIngreso.getDate() === 15) {
        proyeccion += monto
      }
      else if (diaHoy <= 15 && fechaIngreso.getDate() === 1) {
        const proximaQuincena = new Date(hoy.getFullYear(), hoy.getMonth(), 15)
        if (proximaQuincena <= fin) {
          proyeccion += monto
        }
      }
    }
    
    else if (ing.frecuencia === 'Mensual') {
      const diaIngreso = fechaIngreso.getDate()
      const ingresoEsteMes = new Date(hoy.getFullYear(), hoy.getMonth(), diaIngreso)
      if (ingresoEsteMes > hoy && ingresoEsteMes <= fin) {
        proyeccion += monto
      }
    }
  })
  
  return proyeccion
}

/**
 * Genera fechas de ingresos recurrentes para un mes específico
 */
export const generarFechasRecurrentes = (ingreso, año, mes) => {
  const fechas = []
  const fechaOriginal = parseLocalDate(ingreso.fecha) || new Date(año, mes, 1)
  const ultimoDiaMes = new Date(año, mes + 1, 0).getDate()
  
  if (ingreso.frecuencia === 'Mensual') {
    const diaOriginal = fechaOriginal.getDate()
    const diaAjustado = Math.min(diaOriginal, ultimoDiaMes)
    fechas.push(new Date(año, mes, diaAjustado).toISOString().split('T')[0])
  }
  
  else if (ingreso.frecuencia === 'Quincenal') {
    fechas.push(new Date(año, mes, 1).toISOString().split('T')[0])
    if (ultimoDiaMes >= 15) {
      fechas.push(new Date(año, mes, 15).toISOString().split('T')[0])
    }
  }
  
  else if (ingreso.frecuencia === 'Semanal') {
    const primerLunes = encontrarPrimerDiaSemana(año, mes, 1) 
    for (let semana = 0; semana < 5; semana++) {
      const fecha = new Date(primerLunes)
      fecha.setDate(fecha.getDate() + (semana * 7))
      if (fecha.getMonth() === mes) {
        fechas.push(fecha.toISOString().split('T')[0])
      }
    }
  }
  
  return fechas
}

/**
 * Encuentra el primer día específico de la semana en un mes
 */
const encontrarPrimerDiaSemana = (año, mes, diaSemana) => {
  const fecha = new Date(año, mes, 1)
  while (fecha.getDay() !== diaSemana) {
    fecha.setDate(fecha.getDate() + 1)
  }
  return fecha
}

/**
 * Verifica si necesita transición mensual
 */
export const necesitaTransicionMensual = () => {
  const hoy = new Date()
  const ultimaTransicion = localStorage.getItem('ultima_transicion_mensual')
  const mesActual = `${hoy.getFullYear()}-${hoy.getMonth() + 1}`
  
  return ultimaTransicion !== mesActual
}

/**
 * Marca la transición mensual como completada
 */
export const marcarTransicionCompletada = () => {
  const hoy = new Date()
  const mesActual = `${hoy.getFullYear()}-${hoy.getMonth() + 1}`
  localStorage.setItem('ultima_transicion_mensual', mesActual)
}

/**
 * PATRIMONIO NETO = activos bancarios - deudas totales
 */
export const calcularNetWorth = (cuentas = [], deudas = []) => {
  const totalActivos = cuentas.reduce((sum, c) => sum + safeNumber(c.balance), 0)
  const totalPasivos = deudas.reduce((sum, d) => sum + safeNumber(d.saldo), 0)
  return totalActivos - totalPasivos
}

/**
 * DTI mensual = pagos mínimos / ingreso mensual
 * Regla: <20% excelente, 20-36% aceptable, >43% peligro
 */
export const calcularDTI = (deudas = [], totalIngresos = 0) => {
  if (!totalIngresos) return 0
  const pagosMensuales = deudas.reduce((sum, d) => sum + safeNumber(d.pago_minimo), 0)
  return Math.round((pagosMensuales / totalIngresos) * 100)
}

/**
 * REGLA 50/30/20
 * Necesidades: gastos fijos + pagos mínimos de deuda
 * Deseos: gastos variables + suscripciones
 * Ahorro: lo que sobra (meta ≥ 20%)
 */
export const calcularRegla503020 = ({
  totalIngresos = 0,
  totalGastosFijos = 0,
  totalGastosVariables = 0,
  totalSuscripciones = 0,
  deudas = [],
}) => {
  if (!totalIngresos) return { necesidades: 0, deseos: 0, ahorro: 0 }
  const pagosMensualesDeuda = deudas.reduce((s, d) => s + safeNumber(d.pago_minimo), 0)
  const necesidades = totalGastosFijos + pagosMensualesDeuda
  const deseos = totalGastosVariables + totalSuscripciones
  const ahorro = Math.max(0, totalIngresos - necesidades - deseos)
  // Cap each segment so total never exceeds 100% (spending > income scenario)
  const totalGastoPct = Math.round(((necesidades + deseos) / totalIngresos) * 100)
  const overflow = totalGastoPct > 100
  const necPct = Math.round((necesidades / totalIngresos) * 100)
  const desPct = overflow
    ? Math.max(0, 100 - necPct)   // squeeze deseos to fit
    : Math.round((deseos / totalIngresos) * 100)
  return {
    necesidades: necPct,
    deseos: desPct,
    ahorro: Math.round((ahorro / totalIngresos) * 100),
  }
}

/**
 * FINANCIAL HEALTH SCORE — 5 factores profesionales
 * Arranca en 50 (neutral) y gana/pierde puntos por factor.
 */
export const calcularFinancialHealthScore = ({
  totalIngresos = 0,
  totalGastosReales = 0,
  totalGastosFijos = 0,
  totalSuscripciones = 0,
  deudas = [],
}) => {
  let score = 50 // Punto neutral — hay que ganarse cada punto

  // Factor 1: Tasa de ahorro (0-25 pts)
  const tasaAhorro = totalIngresos > 0 ? (totalIngresos - totalGastosReales) / totalIngresos : 0
  if (tasaAhorro >= 0.20) score += 25       // Excelente: ahorra ≥20%
  else if (tasaAhorro >= 0.10) score += 15  // Bueno: ahorra 10-19%
  else if (tasaAhorro >= 0.05) score += 5   // Mínimo: ahorra 5-9%
  else if (tasaAhorro < 0) score -= 15      // Gasta más de lo que gana

  // Factor 2: DTI mensual (0-15 pts)
  const dtiLocal = totalIngresos > 0
    ? deudas.reduce((s, d) => s + safeNumber(d.pago_minimo), 0) / totalIngresos
    : 0
  if (dtiLocal <= 0.20) score += 15        // Excelente: ≤20%
  else if (dtiLocal <= 0.36) score += 8    // Aceptable: 20-36%
  else if (dtiLocal > 0.43) score -= 15    // Peligro: >43% (bancos rechazan préstamos)

  // Factor 3: Deuda total vs ingreso ANUAL (0-15 pts)
  const ingresoAnual = totalIngresos * 12
  const deudaTotal = deudas.reduce((s, d) => s + safeNumber(d.saldo), 0)
  if (deudaTotal === 0) score += 15
  else if (deudaTotal < ingresoAnual * 0.36) score += 10 // Deuda manejable
  else if (deudaTotal < ingresoAnual) score += 5         // Deuda elevada
  else score -= 10                                        // Deuda > ingreso anual

  // Factor 4: Gastos fijos como % del ingreso (0-10 pts)
  const pctFijos = totalIngresos > 0
    ? (totalGastosFijos + totalSuscripciones) / totalIngresos
    : 1
  if (pctFijos <= 0.50) score += 10       // Saludable: compromisos ≤50% ingresos
  else if (pctFijos <= 0.70) score += 5   // Ajustado
  else score -= 10                         // Peligro: compromisos >70%

  // Factor 5: Suscripciones no excesivas (0-5 pts)
  const pctSubs = totalIngresos > 0 ? totalSuscripciones / totalIngresos : 0
  if (pctSubs <= 0.05) score += 5         // Controlado: subs ≤5% ingresos
  else if (pctSubs > 0.10) score -= 5     // Excesivo: subs >10% ingresos

  return Math.max(0, Math.min(100, Math.round(score)))
}

/**
 * DAILY BUDGET — descuenta gastos fijos pendientes del saldo disponible
 * antes de repartirlo entre los días que quedan del mes.
 */
export const calcularDailyBudget = (saldoReal = 0, gastosFijos = [], fechaReferencia = new Date()) => {
  const hoy = new Date(fechaReferencia)
  const diasRestantes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate() - hoy.getDate() + 1
  if (diasRestantes <= 0) return 0
  const fijosPendientes = gastosFijos
    .filter(gf => gf.estado !== 'Pagado' && safeNumber(gf.dia_venc) >= hoy.getDate())
    .reduce((sum, gf) => sum + safeNumber(gf.monto), 0)
  const saldoDisponible = (saldoReal || 0) - fijosPendientes
  if (saldoDisponible <= 0) return 0
  return Math.floor(saldoDisponible / diasRestantes)
}
