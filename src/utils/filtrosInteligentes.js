// ============================================
// 🧠 FILTROS INTELIGENTES PARA TRANSICIÓN MENSUAL
// ============================================

// Tipos de filtros disponibles
export const FILTRO_TIPOS = {
  MES_ACTUAL: 'mes_actual',
  MES_ANTERIOR: 'mes_anterior', 
  TRIMESTRE: 'trimestre',
  AÑO_ACTUAL: 'año_actual',
  TODOS: 'todos'
}

/**
 * 📅 Obtiene el rango de fechas según el tipo de filtro
 */
const obtenerRangoFechas = (tipoFiltro) => {
  const hoy = new Date()
  const año = hoy.getFullYear()
  const mes = hoy.getMonth()

  switch (tipoFiltro) {
    case FILTRO_TIPOS.MES_ACTUAL:
      return {
        inicio: new Date(año, mes, 1),
        fin: new Date(año, mes + 1, 0, 23, 59, 59)
      }
    
    case FILTRO_TIPOS.MES_ANTERIOR:
      return {
        inicio: new Date(año, mes - 1, 1),
        fin: new Date(año, mes, 0, 23, 59, 59)
      }
    
    case FILTRO_TIPOS.TRIMESTRE:
      const inicioTrimestre = Math.floor(mes / 3) * 3
      return {
        inicio: new Date(año, inicioTrimestre, 1),
        fin: new Date(año, inicioTrimestre + 3, 0, 23, 59, 59)
      }
    
    case FILTRO_TIPOS.AÑO_ACTUAL:
      return {
        inicio: new Date(año, 0, 1),
        fin: new Date(año, 11, 31, 23, 59, 59)
      }
    
    case FILTRO_TIPOS.TODOS:
    default:
      return null // Sin filtro de fecha
  }
}

/**
 * 💰 Filtra ingresos con lógica de recurrencia
 */
const filtrarIngresos = (ingresos, tipoFiltro) => {
  const rango = obtenerRangoFechas(tipoFiltro)
  
  if (!rango) return ingresos // Sin filtro

  return ingresos.filter(ingreso => {
    if (!ingreso.fecha) return false
    const fechaIngreso = new Date(ingreso.fecha + 'T00:00:00')
    return fechaIngreso >= rango.inicio && fechaIngreso <= rango.fin
  })
}

/**
 * 🛒 Filtra gastos variables (EXCLUYE archivados Y autopagos de suscripciones Y importaciones bancarias)
 */
const filtrarGastosVariables = (gastos, tipoFiltro) => {
  const rango = obtenerRangoFechas(tipoFiltro)

  // Métodos que indican importación bancaria (excluir)
  const METODOS_BANCARIOS = ['Estado de Cuenta', 'Autopago']

  // PASO 1: Excluir archivados, importaciones bancarias y autopagos de suscripciones
  const gastosLimpios = gastos.filter(gasto => {
    if (gasto.archivado === true) return false

    // Excluir importaciones del banco (Estado de Cuenta = importados con LectorEstadoCuenta)
    if (gasto.metodo && METODOS_BANCARIOS.includes(gasto.metodo)) return false

    // Autopagos de suscripciones (ya aparecen en su propia sección)
    if (gasto.categoria === '📅 Suscripciones') return false
    if (gasto.descripcion?.includes('Autopago:')) return false

    return true
  })

  // PASO 2: Filtrar por rango de fechas
  if (!rango) return gastosLimpios

  return gastosLimpios.filter(gasto => {
    if (!gasto.fecha) return false
    const fechaGasto = new Date(gasto.fecha + 'T00:00:00')
    return fechaGasto >= rango.inicio && fechaGasto <= rango.fin
  })
}

/**
 * 🏠 Filtra gastos fijos (naturaleza mensual recurrente)
 */
const filtrarGastosFijos = (gastosFijos, tipoFiltro) => {
  // Los gastos fijos son de naturaleza mensual recurrente
  return gastosFijos.filter(gf => gf.estado !== 'Cancelado')
}

/**
 * 🔄 Filtra suscripciones activas
 */
const filtrarSuscripciones = (suscripciones, tipoFiltro) => {
  return suscripciones.filter(sub => sub.estado === 'Activo')
}

/**
 * 📊 FUNCIÓN PRINCIPAL: Obtiene datos filtrados con lógica inteligente
 */
export const obtenerDatosFiltrados = (datos, tipoFiltro = FILTRO_TIPOS.MES_ACTUAL) => {
  const {
    ingresos = [],
    gastosVariables = [],
    gastosFijos = [],
    suscripciones = [],
    deudas = []
  } = datos

  return {
    ingresos: filtrarIngresos(ingresos, tipoFiltro),
    gastosVariables: filtrarGastosVariables(gastosVariables, tipoFiltro),
    gastosFijos: filtrarGastosFijos(gastosFijos, tipoFiltro),
    suscripciones: filtrarSuscripciones(suscripciones, tipoFiltro),
    deudas
  }
}

/**
 * 📈 Verifica si existen datos archivados
 */
export const hayDatosArchivados = (gastos) => {
  return Array.isArray(gastos) && gastos.some(gasto => gasto.archivado === true)
}

/**
 * 📊 Obtiene estadísticas de la transición mensual
 */
export const obtenerEstadisticasTransicion = (datos) => {
  const { gastosVariables = [], ingresos = [] } = datos
  
  // Gastos archivados
  const gastosArchivados = gastosVariables.filter(g => g.archivado === true)
  const totalGastosArchivados = gastosArchivados.length
  const montoGastosArchivados = gastosArchivados.reduce((sum, g) => sum + (g.monto || 0), 0)
  
  // Ingresos recurrentes generados (auto-generados este mes)
  const ingresosRecurrentes = ingresos.filter(i => i.es_recurrente === true)
  const ingresosRecurrentesGenerados = ingresosRecurrentes.length
  const montoIngresosRecurrentes = ingresosRecurrentes.reduce((sum, i) => sum + (i.monto || 0), 0)
  
  // Fecha de última transición (aproximada)
  const fechaUltimaTransicion = gastosArchivados.length > 0 
    ? gastosArchivados[0].fecha_archivado || new Date().toISOString()
    : null

  return {
    totalGastosArchivados,
    montoGastosArchivados,
    ingresosRecurrentesGenerados,
    montoIngresosRecurrentes,
    gastosDelMesAnterior: 0, // Por ahora 0
    fechaUltimaTransicion
  }
}