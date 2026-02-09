// Sistema inteligente de cálculos financieros con manejo temporal

// Función auxiliar segura para calcular montos
const safeNumber = (val) => {
  const num = Number(val)
  return isNaN(num) ? 0 : num
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
  console.log('💰 Calculando balances inteligentes...')
  
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
  
  console.log('✅ Cálculos completados:', { real, proyectado })
  
  return { real, proyectado }
}

/**
 * Balance REAL - Solo lo que ya pasó hasta hoy
 */
const calcularBalanceReal = (ingresos, gastos, gastosFijos, suscripciones, inicio, fin) => {
  // Ingresos que ya llegaron
  const ingresosReales = ingresos
    .filter(i => {
      const fecha = i.fecha ? new Date(i.fecha) : null
      return fecha && fecha >= inicio && fecha <= fin
    })
    .reduce((sum, i) => sum + safeNumber(i.monto), 0)
  
  // Gastos variables que ya ocurrieron
  const gastosVariablesReales = gastos
    .filter(g => {
      const fecha = g.fecha ? new Date(g.fecha) : null
      return fecha && fecha >= inicio && fecha <= fin
    })
    .reduce((sum, g) => sum + safeNumber(g.monto), 0)
  
  // Gastos fijos que ya vencieron
  const gastosFijosReales = gastosFijos
    .filter(gf => {
      if (!gf.dia_venc) return false
      const vencimiento = new Date(fin.getFullYear(), fin.getMonth(), gf.dia_venc)
      return vencimiento <= fin && gf.estado !== 'Pagado'
    })
    .reduce((sum, gf) => sum + safeNumber(gf.monto), 0)
  
  // Suscripciones que ya se cobraron este mes
  const suscripcionesReales = suscripciones
    .filter(s => {
      if (s.estado !== 'Activo' || !s.proximo_pago) return false
      const proxPago = new Date(s.proximo_pago)
      return proxPago >= inicio && proxPago <= fin
    })
    .reduce((sum, s) => {
      const costo = safeNumber(s.costo)
      if (s.ciclo === 'Anual') return sum + (costo / 12)
      return sum + costo
    }, 0)
  
// ✨ NUEVO: CALCULAR GASTOS PAGADOS (para visualización)
const gastosPagados = 
  // Gastos variables ya están pagados (todos los registrados)
  gastosVariablesReales +
  // Gastos fijos marcados como "Pagado"
  gastosFijos
    .filter(gf => {
      if (!gf.dia_venc) return false
      const vencimiento = new Date(fin.getFullYear(), fin.getMonth(), gf.dia_venc)
      return vencimiento <= fin && gf.estado === 'Pagado'
    })
    .reduce((sum, gf) => sum + safeNumber(gf.monto), 0) +
  // ✅ CORRECCIÓN: Suscripciones cuyo próximo pago está en el MES SIGUIENTE
  suscripciones
    .filter(s => {
      if (s.estado !== 'Activo' || !s.proximo_pago) return false
      const proxPago = new Date(s.proximo_pago + 'T00:00:00')
      proxPago.setHours(0, 0, 0, 0)
      
      // Si próximo pago es en el mes SIGUIENTE, significa que ya se pagó ESTE mes
      const esMesSiguiente = (
        proxPago.getFullYear() > fin.getFullYear() ||
        (proxPago.getFullYear() === fin.getFullYear() && proxPago.getMonth() > fin.getMonth())
      )
      
      return esMesSiguiente
    })
    .reduce((sum, s) => {
      const costo = safeNumber(s.costo)
      if (s.ciclo === 'Anual') return sum + (costo / 12)
      return sum + costo
    }, 0)
  
  const totalGastos = gastosVariablesReales + gastosFijosReales + suscripcionesReales
  const saldo = ingresosReales - totalGastos
  const tasaAhorro = ingresosReales > 0 ? ((ingresosReales - totalGastos) / ingresosReales) * 100 : 0
  
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
      const fecha = i.fecha ? new Date(i.fecha) : null
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
      const fecha = g.fecha ? new Date(g.fecha) : null
      return fecha && fecha >= inicio && fecha <= fin
    })
    .reduce((sum, g) => sum + safeNumber(g.monto), 0)
  
  // 🔒 CÁLCULO SEGURO DEL PROMEDIO DIARIO
  const msPerDay = 1000 * 60 * 60 * 24
  const diasTranscurridos = Math.max(1, Math.floor((hoy - inicio) / msPerDay))
  const promedioDiario = gastosVariablesActuales / diasTranscurridos
  const diasRestantes = Math.max(0, Math.floor((fin - hoy) / msPerDay))
  
  // Si el promedio no es válido, asumimos 0
  const promedioDiarioSeguro = Number.isFinite(promedioDiario) ? promedioDiario : 0
  
  const gastosVariablesProyectados = gastosVariablesActuales + (promedioDiarioSeguro * diasRestantes)
  
  // Todas las suscripciones activas del mes
  const suscripcionesProyectadas = suscripciones
    .filter(s => s.estado === 'Activo')
    .reduce((sum, s) => {
      const costo = safeNumber(s.costo)
      if (s.ciclo === 'Anual') return sum + (costo / 12)
      if (s.ciclo === 'Semanal') return sum + (costo * 4.33)
      return sum + costo
    }, 0)
  
  const totalGastos = gastosFijosProyectados + gastosVariablesProyectados + suscripcionesProyectadas
  const saldo = totalIngresosProyectados - totalGastos
  const tasaAhorro = totalIngresosProyectados > 0 ? ((totalIngresosProyectados - totalGastos) / totalIngresosProyectados) * 100 : 0
  
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
    
    const fechaIngreso = ing.fecha ? new Date(ing.fecha) : null
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
  const fechaOriginal = new Date(ingreso.fecha)
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