import { useCallback, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

/**
 * 🔄 Hook para gestionar la transición mensual automática
 */
export const useMonthlyTransition = () => {

  /**
   * 🤖 Detecta si un ingreso es recurrente
   */
  const esIngresoRecurrente = useCallback((ingreso) => {
    const fuentesRecurrentes = [
      'salario', 'sueldo', 'nomina', 'pension', 'renta', 'alquiler',
      'dividendos', 'intereses', 'pension alimenticia', 'beca',
      'freelance recurrente', 'consultoria mensual'
    ]

    const fuente = (ingreso.fuente || '').toLowerCase()
    const descripcion = (ingreso.descripcion || '').toLowerCase()
    
    if (ingreso.es_recurrente === true || ingreso.tipo === 'recurrente') {
      return true
    }

    return fuentesRecurrentes.some(keyword => 
      fuente.includes(keyword) || descripcion.includes(keyword)
    )
  }, [])

  /**
   * 📅 Calcula próximo pago según ciclo
   */
  const calcularProximoPago = useCallback((fechaActual, ciclo) => {
    const fecha = new Date(fechaActual + 'T00:00:00')
    
    switch (ciclo) {
      case 'Mensual':
        fecha.setMonth(fecha.getMonth() + 1)
        break
      case 'Anual':
        fecha.setFullYear(fecha.getFullYear() + 1)
        break
      case 'Semanal':
        fecha.setDate(fecha.getDate() + 7)
        break
      default:
        fecha.setMonth(fecha.getMonth() + 1)
    }
    
    return fecha.toISOString().split('T')[0]
  }, [])

  /**
   * 📦 Archiva gastos variables que NO son del mes actual
   */
  const archivarGastosVariablesAnteriores = useCallback(async (userId) => {
    const hoy = new Date()
    const mesActual = hoy.getMonth()
    const añoActual = hoy.getFullYear()
    const inicioMesActual = new Date(añoActual, mesActual, 1)

    console.log('📦 Archivando gastos variables que NO son del mes actual...')
    console.log(`📅 Mes actual: ${mesActual + 1}/${añoActual}`)

    const { data: gastosArchivados, error } = await supabase
      .from('gastos_variables')  // ✅ BASE TABLE real (gastos_all es VIEW de solo lectura)
      .update({ 
        archivado: true, 
        fecha_archivado: new Date().toISOString() 
      })
      .eq('user_id', userId)
      .lt('fecha', inicioMesActual.toISOString().split('T')[0])
      .or('archivado.is.null,archivado.eq.false')
      .select()

    if (error) {
      console.error('❌ Error archivando gastos:', error)
      throw error
    }

    console.log(`✅ ${gastosArchivados?.length || 0} gastos archivados`)
    
    if (gastosArchivados && gastosArchivados.length > 0) {
      gastosArchivados.forEach(g => {
        console.log('🗄️ Archivado:', g.descripcion || g.categoria, '→', g.fecha)
      })
    }

    return gastosArchivados?.length || 0
  }, [])

  /**
   * 🔄 Resetea gastos fijos para el nuevo mes
   */
  const resetearGastosFijosParaNuevoMes = useCallback(async (userId) => {
    console.log('🔄 Reseteando gastos fijos...')
    
    const { data: gastosReseteados, error } = await supabase
      .from('gastos_fijos')
      .update({ estado: 'Pendiente' })
      .eq('user_id', userId)
      .eq('estado', 'Pagado')
      .select()

    if (error) {
      console.error('❌ Error reseteando gastos fijos:', error)
      throw error
    }

    console.log(`✅ ${gastosReseteados?.length || 0} gastos fijos reseteados`)
    
    if (gastosReseteados && gastosReseteados.length > 0) {
      gastosReseteados.forEach(gf => {
        console.log('🔄 Reseteado:', gf.nombre, '→ Pendiente')
      })
    }

    return gastosReseteados?.length || 0
  }, [])

  /**
   * 💰 Genera ingresos recurrentes para el mes actual
   */
  const generarIngresosRecurrentes = useCallback(async (userId) => {
    console.log('💰 Generando ingresos recurrentes...')
    
    const hoy = new Date()
    const mesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)
    const finMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth(), 0)

    const { data: ingresosAnteriores, error: errorQuery } = await supabase
      .from('ingresos')
      .select('*')
      .eq('user_id', userId)
      .gte('fecha', mesAnterior.toISOString().split('T')[0])
      .lte('fecha', finMesAnterior.toISOString().split('T')[0])

    if (errorQuery) {
      console.error('❌ Error consultando ingresos anteriores:', errorQuery)
      throw errorQuery
    }

    const ingresosRecurrentes = []
    
    for (const ingreso of ingresosAnteriores || []) {
      if (esIngresoRecurrente(ingreso)) {
        const nuevoIngreso = {
          user_id: userId,
          fecha: hoy.toISOString().split('T')[0],
          monto: ingreso.monto,
          fuente: `${ingreso.fuente} (Auto-generado)`,
          descripcion: ingreso.descripcion,
          cuenta_id: ingreso.cuenta_id,
          frecuencia: ingreso.frecuencia || 'Único',
          es_recurrente: true
        }
        
        ingresosRecurrentes.push(nuevoIngreso)
        console.log('💵 Ingreso recurrente detectado:', ingreso.fuente, '→', ingreso.monto)
      }
    }

    if (ingresosRecurrentes.length > 0) {
      const { data: ingresosCreados, error } = await supabase
        .from('ingresos')
        .insert(ingresosRecurrentes)
        .select()

      if (error) {
        console.error('❌ Error creando ingresos recurrentes:', error)
        throw error
      }

      console.log(`✅ ${ingresosCreados?.length || 0} ingresos recurrentes generados`)
      
      if (ingresosCreados && ingresosCreados.length > 0) {
        ingresosCreados.forEach(ing => {
          console.log('💰 Generado:', ing.fuente, '→ $', ing.monto)
        })
      }

      return ingresosCreados?.length || 0
    } else {
      console.log('ℹ️ No hay ingresos recurrentes para generar')
      return 0
    }
  }, [esIngresoRecurrente])

  /**
   * 🔄 Actualiza suscripciones vencidas
   */
  const actualizarSuscripcionesVencidas = useCallback(async (userId) => {
    console.log('🔄 Actualizando suscripciones vencidas...')
    
    const hoy = new Date().toISOString().split('T')[0]
    
    const { data: suscripciones, error: errorQuery } = await supabase
      .from('suscripciones')
      .select('*')
      .eq('user_id', userId)
      .eq('estado', 'Activo')
      .lte('proximo_pago', hoy)

    if (errorQuery) {
      console.error('❌ Error consultando suscripciones:', errorQuery)
      throw errorQuery
    }

    let actualizadas = 0

    for (const sub of suscripciones || []) {
      const nuevaFecha = calcularProximoPago(sub.proximo_pago, sub.ciclo)
      
      const { error } = await supabase
        .from('suscripciones')
        .update({ proximo_pago: nuevaFecha })
        .eq('id', sub.id)
        .eq('user_id', userId)

      if (error) {
        console.error('❌ Error actualizando suscripción:', error)
        throw error
      }

      console.log('🔄 Suscripción actualizada:', sub.servicio, '→', nuevaFecha)
      actualizadas++
    }

    if (actualizadas > 0) {
      console.log(`✅ ${actualizadas} suscripciones actualizadas`)
    } else {
      console.log('ℹ️ No hay suscripciones vencidas para actualizar')
    }

    return actualizadas
  }, [calcularProximoPago])

  /**
   * 📸 PASO 0: Guarda snapshot KPIs del mes que cierra
   */
  const guardarSnapshotMensual = useCallback(async (userId) => {
    const hoy = new Date()
    const mesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)
    const finMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth(), 0)
    const mesKey = `${mesAnterior.getFullYear()}-${String(mesAnterior.getMonth() + 1).padStart(2, '0')}`

    // Verificar que no existe ya el snapshot para este mes
    const { data: existing } = await supabase
      .from('snapshots_mensuales')
      .select('id')
      .eq('user_id', userId)
      .eq('mes', mesKey)
      .maybeSingle()
    if (existing) { console.log(`📸 Snapshot ${mesKey} ya existe, omitiendo`); return }

    const ini = mesAnterior.toISOString().split('T')[0]
    const fin = finMesAnterior.toISOString().split('T')[0]

    // Consultar datos del mes anterior en paralelo
    const [
      { data: ingresos },
      { data: gastosVar },
      { data: gastosFijos },
      { data: suscripciones },
      { data: deudas },
    ] = await Promise.all([
      supabase.from('ingresos').select('monto').eq('user_id', userId).gte('fecha', ini).lte('fecha', fin),
      supabase.from('gastos_variables').select('monto').eq('user_id', userId).gte('fecha', ini).lte('fecha', fin),
      supabase.from('gastos_fijos').select('monto').eq('user_id', userId),
      supabase.from('suscripciones').select('costo,ciclo').eq('user_id', userId).eq('estado', 'Activo'),
      supabase.from('deudas').select('saldo,balance').eq('user_id', userId),
    ])

    const sum = (arr, key) => (arr || []).reduce((s, r) => s + Number(r[key] || 0), 0)

    const totalIngresos       = sum(ingresos, 'monto')
    const totalGastosVariables = sum(gastosVar, 'monto')
    const totalGastosFijos    = sum(gastosFijos, 'monto')
    const totalSuscripciones  = (suscripciones || []).reduce((s, sub) => {
      const c = Number(sub.costo || 0)
      if (sub.ciclo === 'Anual') return s + c / 12
      if (sub.ciclo === 'Semanal') return s + c * 4.33
      return s + c
    }, 0)
    const totalGastos  = totalGastosVariables + totalGastosFijos + totalSuscripciones
    const totalDeudas  = (deudas || []).reduce((s, d) => s + Number(d.saldo || d.balance || 0), 0)
    const saldo        = totalIngresos - totalGastos
    const tasaAhorro   = totalIngresos > 0 ? saldo / totalIngresos : 0

    const { error } = await supabase.from('snapshots_mensuales').insert({
      user_id: userId,
      mes: mesKey,
      total_ingresos: totalIngresos,
      total_gastos_variables: totalGastosVariables,
      total_gastos_fijos: totalGastosFijos,
      total_suscripciones: totalSuscripciones,
      total_gastos: totalGastos,
      total_deudas: totalDeudas,
      saldo,
      tasa_ahorro: tasaAhorro,
      num_transacciones: (ingresos?.length || 0) + (gastosVar?.length || 0),
    })

    if (error) console.warn('⚠️ No se pudo guardar snapshot mensual:', error.message)
    else console.log(`📸 Snapshot ${mesKey} guardado: ingresos=$${totalIngresos.toFixed(0)} saldo=$${saldo.toFixed(0)}`)
  }, [])

  /**
   * 🛠️ Procesa la transición completa
   */
  const procesarTransicionCompleta = useCallback(async (userId) => {
    console.log('🔄 ========================================')
    console.log('🔄 INICIANDO TRANSICIÓN MENSUAL COMPLETA')
    console.log('🔄 ========================================')

    const estadisticas = {
      gastosArchivados: 0,
      gastosFijosReseteados: 0,
      ingresosGenerados: 0,
      suscripcionesActualizadas: 0
    }

    try {
      console.log('\n📸 PASO 0: Guardando snapshot del mes que cierra...')
      await guardarSnapshotMensual(userId)

      console.log('\n📦 PASO 1: Archivando gastos variables...')
      estadisticas.gastosArchivados = await archivarGastosVariablesAnteriores(userId)

      console.log('\n🔄 PASO 2: Reseteando gastos fijos...')
      estadisticas.gastosFijosReseteados = await resetearGastosFijosParaNuevoMes(userId)

      console.log('\n💰 PASO 3: Generando ingresos recurrentes...')
      estadisticas.ingresosGenerados = await generarIngresosRecurrentes(userId)

      console.log('\n🔄 PASO 4: Actualizando suscripciones...')
      estadisticas.suscripcionesActualizadas = await actualizarSuscripcionesVencidas(userId)

      console.log('\n✅ ========================================')
      console.log('✅ TRANSICIÓN MENSUAL COMPLETADA')
      console.log('✅ ========================================')

      return estadisticas

    } catch (error) {
      console.error('❌ Error en transición mensual:', error)
      throw error
    }
  }, [
    guardarSnapshotMensual,
    archivarGastosVariablesAnteriores,
    resetearGastosFijosParaNuevoMes,
    generarIngresosRecurrentes,
    actualizarSuscripcionesVencidas
  ])

  /**
   * 📋 Fuerza la transición mensual (para testing/debugging)
   */
  const forzarTransicion = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuario no autenticado')

      console.log('🔄 Iniciando transición mensual forzada...')
      console.log('👤 Usuario:', user.email)
      
      const estadisticas = await procesarTransicionCompleta(user.id)
      
      const hoy = new Date()
      const mesActual = `${hoy.getFullYear()}-${hoy.getMonth() + 1}`
      localStorage.setItem('ultima_transicion_mensual', mesActual)
      
      console.log('✅ Transición mensual forzada completada exitosamente')
      
      return estadisticas
      
    } catch (error) {
      console.error('❌ Error en transición forzada:', error)
      throw error
    }
  }, [procesarTransicionCompleta])

  /**
   * 🔁 Auto-detección de cambio de mes al montar
   */
  useEffect(() => {
    const checkAndRunTransition = async () => {
      const hoy = new Date()
      const mesActual = `${hoy.getFullYear()}-${hoy.getMonth() + 1}`
      const ultimaTransicion = localStorage.getItem('ultima_transicion_mensual')

      if (ultimaTransicion === mesActual) return // Ya se ejecutó este mes

      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        console.log('🗓️ Nuevo mes detectado → ejecutando transición mensual automática...')
        await procesarTransicionCompleta(user.id)
        localStorage.setItem('ultima_transicion_mensual', mesActual)
        console.log('✅ Transición mensual automática completada:', mesActual)
      } catch (error) {
        console.error('❌ Error en transición mensual automática:', error)
      }
    }

    checkAndRunTransition()
  }, [procesarTransicionCompleta])

  return {
    forzarTransicion,
    esIngresoRecurrente
  }
}
