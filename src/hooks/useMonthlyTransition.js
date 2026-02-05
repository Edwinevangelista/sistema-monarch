import { useCallback } from 'react'
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
    
    // Verificar si ya está marcado como recurrente
    if (ingreso.es_recurrente === true || ingreso.tipo === 'recurrente') {
      return true
    }

    // Verificar por palabras clave
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
   * 📦 Archiva gastos variables del mes anterior
   */
  const archivarGastosVariablesAnteriores = useCallback(async (userId) => {
    const hoy = new Date()
    const mesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)
    const finMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth(), 0)

    const { error } = await supabase
      .from('gastos_variables')
      .update({ 
        archivado: true, 
        fecha_archivado: new Date().toISOString() 
      })
      .eq('user_id', userId)
      .gte('fecha', mesAnterior.toISOString().split('T')[0])
      .lte('fecha', finMesAnterior.toISOString().split('T')[0])
      .is('archivado', false)

    if (error) throw error
    console.log('📦 Gastos variables archivados')
  }, [])

  /**
   * 🔄 Resetea gastos fijos para el nuevo mes
   */
  const resetearGastosFijosParaNuevoMes = useCallback(async (userId) => {
    const { error } = await supabase
      .from('gastos_fijos')
      .update({ estado: 'Pendiente' })
      .eq('user_id', userId)
      .eq('estado', 'Pagado')

    if (error) throw error
    console.log('🔄 Gastos fijos reseteados')
  }, [])

  /**
   * 💰 Genera ingresos recurrentes para el mes actual
   */
  const generarIngresosRecurrentes = useCallback(async (userId) => {
    // Obtener ingresos del mes anterior
    const hoy = new Date()
    const mesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)
    const finMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth(), 0)

    const { data: ingresosAnteriores, error: errorQuery } = await supabase
      .from('ingresos')
      .select('*')
      .eq('user_id', userId)
      .gte('fecha', mesAnterior.toISOString().split('T')[0])
      .lte('fecha', finMesAnterior.toISOString().split('T')[0])

    if (errorQuery) throw errorQuery

    const ingresosRecurrentes = []
    
    for (const ingreso of ingresosAnteriores || []) {
      if (esIngresoRecurrente(ingreso)) {
        const nuevoIngreso = {
          user_id: userId,
          fecha: hoy.toISOString().split('T')[0],
          monto: ingreso.monto,
          fuente: `${ingreso.fuente} (Auto-generado)`,
          descripcion: ingreso.descripcion,
          categoria: ingreso.categoria,
          cuenta_id: ingreso.cuenta_id,
          es_recurrente: true,
          ingreso_origen_id: ingreso.id
        }
        
        ingresosRecurrentes.push(nuevoIngreso)
      }
    }

    if (ingresosRecurrentes.length > 0) {
      const { error } = await supabase
        .from('ingresos')
        .insert(ingresosRecurrentes)

      if (error) throw error
      console.log(`💰 ${ingresosRecurrentes.length} ingresos recurrentes generados`)
    }
  }, [esIngresoRecurrente])

  /**
   * 🔄 Actualiza suscripciones vencidas
   */
  const actualizarSuscripcionesVencidas = useCallback(async (userId) => {
    const hoy = new Date().toISOString().split('T')[0]
    
    const { data: suscripciones, error: errorQuery } = await supabase
      .from('suscripciones')
      .select('*')
      .eq('user_id', userId)
      .eq('estado', 'Activo')
      .lte('proximo_pago', hoy)

    if (errorQuery) throw errorQuery

    for (const sub of suscripciones || []) {
      const nuevaFecha = calcularProximoPago(sub.proximo_pago, sub.ciclo)
      
      const { error } = await supabase
        .from('suscripciones')
        .update({ proximo_pago: nuevaFecha })
        .eq('id', sub.id)

      if (error) throw error
    }

    if (suscripciones?.length > 0) {
      console.log(`🔄 ${suscripciones.length} suscripciones actualizadas`)
    }
  }, [calcularProximoPago])

  /**
   * 🛠️ Procesa la transición completa
   */
  const procesarTransicionCompleta = useCallback(async (userId) => {
    // 1. Archivar gastos variables del mes anterior
    await archivarGastosVariablesAnteriores(userId)
    
    // 2. Resetear gastos fijos
    await resetearGastosFijosParaNuevoMes(userId)
    
    // 3. Generar ingresos recurrentes
    await generarIngresosRecurrentes(userId)
    
    // 4. Actualizar suscripciones vencidas
    await actualizarSuscripcionesVencidas(userId)
  }, [archivarGastosVariablesAnteriores, resetearGastosFijosParaNuevoMes, generarIngresosRecurrentes, actualizarSuscripcionesVencidas])

  /**
   * 📋 Fuerza la transición mensual (para testing)
   */
  const forzarTransicion = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuario no autenticado')

      console.log('🔄 Iniciando transición mensual forzada...')
      
      // Procesar todas las operaciones de transición
      await procesarTransicionCompleta(user.id)
      
      console.log('✅ Transición mensual completada')
      
    } catch (error) {
      console.error('❌ Error en transición forzada:', error)
      throw error
    }
  }, [procesarTransicionCompleta])

  return {
    forzarTransicion,
    esIngresoRecurrente
  }
}