import { useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { generarFechasRecurrentes, necesitaTransicionMensual, marcarTransicionCompletada } from '../utils/financialCalculations'

/**
 * Hook para manejar la transición automática entre meses
 * - Genera ingresos recurrentes
 * - Resetea gastos fijos 
 * - Actualiza suscripciones
 * - Archiva datos del mes anterior
 */
export const useMonthlyTransition = () => {
  
  const obtenerUsuarioActual = useCallback(async () => {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) throw new Error("Usuario no autenticado")
    return user
  }, [])

  const generarIngresosRecurrentes = useCallback(async (fecha) => {
    try {
      console.log('🔄 Generando ingresos recurrentes para:', fecha.toISOString().split('T')[0])
      
      const user = await obtenerUsuarioActual()
      
      // Buscar ingresos con frecuencia definida
      const { data: ingresosRecurrentes, error } = await supabase
        .from('ingresos')
        .select('*')
        .eq('user_id', user.id)
        .not('frecuencia', 'is', null)
        .neq('frecuencia', 'Único')
      
      if (error) throw error
      
      if (!ingresosRecurrentes || ingresosRecurrentes.length === 0) {
        console.log('📋 No hay ingresos recurrentes configurados')
        return
      }
      
      for (const ingreso of ingresosRecurrentes) {
        const nuevasFechas = generarFechasRecurrentes(
          ingreso, 
          fecha.getFullYear(), 
          fecha.getMonth()
        )
        
        for (const fechaNueva of nuevasFechas) {
          // Verificar si ya existe este ingreso para esta fecha
          const { data: existente } = await supabase
            .from('ingresos')
            .select('id')
            .eq('user_id', user.id)
            .eq('fuente', ingreso.fuente)
            .eq('fecha', fechaNueva)
            .single()
          
          if (!existente) {
            // Crear nuevo ingreso recurrente
            const nuevoIngreso = {
              user_id: user.id,
              fuente: ingreso.fuente,
              monto: ingreso.monto,
              fecha: fechaNueva,
              categoria: ingreso.categoria,
              descripcion: `${ingreso.descripcion || ''} (Auto-generado)`.trim(),
              frecuencia: ingreso.frecuencia,
              cuenta_id: ingreso.cuenta_id,
              metodo: ingreso.metodo,
              generado_automaticamente: true
            }
            
            const { error: insertError } = await supabase
              .from('ingresos')
              .insert([nuevoIngreso])
            
            if (insertError) {
              console.error('❌ Error insertando ingreso recurrente:', insertError)
            } else {
              console.log('✅ Ingreso recurrente creado:', nuevoIngreso.fuente, fechaNueva)
            }
          } else {
            console.log('📋 Ingreso recurrente ya existe:', ingreso.fuente, fechaNueva)
          }
        }
      }
    } catch (error) {
      console.error('❌ Error en generarIngresosRecurrentes:', error)
    }
  }, [obtenerUsuarioActual])

  const resetearGastosFijos = useCallback(async (fecha) => {
    try {
      console.log('🔄 Reseteando gastos fijos para:', fecha.toISOString().split('T')[0])
      
      const user = await obtenerUsuarioActual()
      
      // Resetear todos los gastos fijos como "pendientes"
      const { error } = await supabase
        .from('gastos_fijos')
        .update({ estado: 'Pendiente' })
        .eq('user_id', user.id)
        .neq('estado', 'Cancelado')
      
      if (error) throw error
      
      console.log('✅ Gastos fijos reseteados como "Pendiente"')
    } catch (error) {
      console.error('❌ Error en resetearGastosFijos:', error)
    }
  }, [obtenerUsuarioActual])

  const actualizarSuscripciones = useCallback(async (fecha) => {
    try {
      console.log('🔄 Actualizando suscripciones para:', fecha.toISOString().split('T')[0])
      
      const user = await obtenerUsuarioActual()
      
      // Obtener suscripciones activas que vencieron el mes anterior
      const mesAnterior = new Date(fecha.getFullYear(), fecha.getMonth() - 1, 1)
      const finMesAnterior = new Date(fecha.getFullYear(), fecha.getMonth(), 0)
      
      const { data: suscripciones, error } = await supabase
        .from('suscripciones')
        .select('*')
        .eq('user_id', user.id)
        .eq('estado', 'Activo')
        .not('proximo_pago', 'is', null)
      
      if (error) throw error
      
      if (!suscripciones || suscripciones.length === 0) {
        console.log('📋 No hay suscripciones activas')
        return
      }
      
      for (const sub of suscripciones) {
        const proximoPago = new Date(sub.proximo_pago)
        
        // Si el próximo pago era en el mes anterior, actualizar
        if (proximoPago >= mesAnterior && proximoPago <= finMesAnterior) {
          let nuevoProximoPago = calcularProximoPago(sub.proximo_pago, sub.ciclo)
          
          const { error: updateError } = await supabase
            .from('suscripciones')
            .update({ proximo_pago: nuevoProximoPago })
            .eq('id', sub.id)
          
          if (updateError) {
            console.error('❌ Error actualizando suscripción:', updateError)
          } else {
            console.log('✅ Suscripción actualizada:', sub.servicio, nuevoProximoPago)
          }
        }
      }
    } catch (error) {
      console.error('❌ Error en actualizarSuscripciones:', error)
    }
  }, [obtenerUsuarioActual])

  const archivarMesAnterior = useCallback(async (fecha) => {
    try {
      console.log('🗄️ Archivando datos del mes anterior...')
      
      const user = await obtenerUsuarioActual()
      const mesAnterior = fecha.getMonth() === 0 ? 11 : fecha.getMonth() - 1
      const añoAnterior = fecha.getMonth() === 0 ? fecha.getFullYear() - 1 : fecha.getFullYear()
      
      // Crear resumen del mes anterior (opcional, para estadísticas)
      const resumenMes = {
        user_id: user.id,
        año: añoAnterior,
        mes: mesAnterior + 1, // JS usa 0-11, BD usa 1-12
        fecha_creacion: fecha.toISOString(),
        // Aquí podrías calcular totales del mes anterior
        // total_ingresos, total_gastos, etc.
      }
      
      // Opcional: Guardar resumen en tabla "resumenes_mensuales"
      // const { error } = await supabase.from('resumenes_mensuales').insert([resumenMes])
      
      console.log('✅ Archivado completado')
    } catch (error) {
      console.error('❌ Error en archivarMesAnterior:', error)
    }
  }, [obtenerUsuarioActual])

  const ejecutarTransicionMensual = useCallback(async () => {
    try {
      const fecha = new Date()
      console.log('🚀 Iniciando transición mensual para:', fecha.toISOString().split('T')[0])
      
      // Ejecutar todas las tareas de transición
      await Promise.all([
        generarIngresosRecurrentes(fecha),
        resetearGastosFijos(fecha),
        actualizarSuscripciones(fecha),
        archivarMesAnterior(fecha)
      ])
      
      // Marcar como completada
      marcarTransicionCompletada()
      
      console.log('✅ Transición mensual completada exitosamente')
      
      // Opcional: Mostrar notificación al usuario
      if (window.showLocalNotification) {
        window.showLocalNotification('📅 Nuevo mes iniciado', {
          body: 'Tus ingresos recurrentes han sido generados automáticamente',
          icon: '/favicon.ico'
        })
      }
      
    } catch (error) {
      console.error('❌ Error en transición mensual:', error)
    }
  }, [generarIngresosRecurrentes, resetearGastosFijos, actualizarSuscripciones, archivarMesAnterior])

  // Efecto principal: verificar si necesita transición
  useEffect(() => {
    const verificarTransicion = async () => {
      if (necesitaTransicionMensual()) {
        await ejecutarTransicionMensual()
      }
    }
    
    // Verificar inmediatamente al montar
    verificarTransicion()
    
    // Verificar cada hora (opcional, para casos edge)
    const intervalo = setInterval(verificarTransicion, 60 * 60 * 1000)
    
    return () => clearInterval(intervalo)
  }, [ejecutarTransicionMensual])

  // Función manual para forzar transición (útil para testing)
  const forzarTransicion = useCallback(async () => {
    localStorage.removeItem('ultima_transicion_mensual')
    await ejecutarTransicionMensual()
  }, [ejecutarTransicionMensual])

  return {
    forzarTransicion // Exportar para uso manual/debug
  }
}

/**
 * Calcula el próximo pago de una suscripción
 */
const calcularProximoPago = (fechaActualStr, ciclo) => {
  const fecha = new Date(fechaActualStr + 'T00:00:00')
  let nuevaFecha = new Date(fecha)
  
  switch (ciclo) {
    case 'Mensual':
      nuevaFecha.setMonth(nuevaFecha.getMonth() + 1)
      break
    case 'Anual':
      nuevaFecha.setFullYear(nuevaFecha.getFullYear() + 1)
      break
    case 'Semanal':
      nuevaFecha.setDate(nuevaFecha.getDate() + 7)
      break
    case 'Quincenal':
      nuevaFecha.setDate(nuevaFecha.getDate() + 15)
      break
    default:
      // Por defecto, mensual
      nuevaFecha.setMonth(nuevaFecha.getMonth() + 1)
      break
  }
  
  return nuevaFecha.toISOString().split('T')[0]
}