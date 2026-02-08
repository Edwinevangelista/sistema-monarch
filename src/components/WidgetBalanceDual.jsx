// src/components/WidgetBalanceDual.jsx
import React, { useState, useMemo } from 'react'
import { TrendingUp, TrendingDown, Calendar, Clock, BarChart3, Eye, EyeOff, AlertCircle } from 'lucide-react'

/**
 * Widget de Balance Dual - Muestra vista REAL vs PROYECTADA
 * REAL: Solo hasta hoy (evita mostrar usuario siempre en rojo)
 * PROYECTADO: Mes completo (planificación)
 */
const WidgetBalanceDual = ({ 
  calculosReales, 
  calculosProyectados, 
  vistaActiva, 
  setVistaActiva,
  hoy 
}) => {
  const [mostrarDetalles, setMostrarDetalles] = useState(false)
  
  // Datos activos según la vista seleccionada
  const datosActivos = vistaActiva === 'real' ? calculosReales : calculosProyectados
  
  // Métricas calculadas
  const diferenciaTipos = useMemo(() => {
    const diferenciaIngresos = calculosProyectados.totalIngresos - calculosReales.totalIngresos
    const diferenciaGastos = calculosProyectados.totalGastos - calculosReales.totalGastos
    const diferenciaSaldo = calculosProyectados.saldo - calculosReales.saldo
    
    return {
      ingresos: diferenciaIngresos,
      gastos: diferenciaGastos,
      saldo: diferenciaSaldo
    }
  }, [calculosReales, calculosProyectados])
  
  // Información contextual sobre la diferencia de vistas
  const infoContextual = useMemo(() => {
    const diasTranscurridos = hoy.getDate()
    const diasRestantes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate() - hoy.getDate()
    const porcentajeMes = (diasTranscurridos / (diasTranscurridos + diasRestantes)) * 100
    
    return {
      diasTranscurridos,
      diasRestantes, 
      porcentajeMes: Math.round(porcentajeMes),
      fechaFin: new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)
    }
  }, [hoy])
  
  // Colores para el saldo
  const colorSaldo = datosActivos.saldo >= 0 
    ? 'text-green-400' 
    : datosActivos.saldo > -500 
      ? 'text-yellow-400' 
      : 'text-red-400'
  
  const iconoSaldo = datosActivos.saldo >= 0 ? TrendingUp : TrendingDown
  const IconoSaldo = iconoSaldo

  return (
    <div className="max-w-7xl mx-auto px-3 md:px-4 mb-4 md:mb-6">
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-4 md:p-6 shadow-2xl relative overflow-hidden animate-in fade-in slide-in-from-top-4">
        
        {/* Fondo decorativo */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full -mr-20 -mt-20 pointer-events-none" />
        
        {/* Header con toggle */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 md:mb-6 relative z-10 gap-3">
          <div>
            <h3 className="text-base md:text-lg font-bold text-white">Balance Financiero</h3>
            <p className="text-[10px] md:text-xs text-gray-400">
              {vistaActiva === 'real' 
                ? `Hasta hoy (${infoContextual.diasTranscurridos} días)` 
                : `Proyección completa (${infoContextual.diasTranscurridos + infoContextual.diasRestantes} días)`
              }
            </p>
          </div>
          
          {/* Toggle Real vs Proyectado */}
          <div className="flex bg-white/10 backdrop-blur rounded-xl p-1 border border-white/20 w-full md:w-auto">
            <button 
              onClick={() => setVistaActiva('real')}
              className={`flex-1 md:flex-none px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-[10px] md:text-xs font-semibold transition-all ${
                vistaActiva === 'real' 
                  ? 'bg-white text-gray-900 shadow-lg' 
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              📊 Real
            </button>
            <button 
              onClick={() => setVistaActiva('proyectado')}
              className={`flex-1 md:flex-none px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-[10px] md:text-xs font-semibold transition-all ${
                vistaActiva === 'proyectado' 
                  ? 'bg-white text-gray-900 shadow-lg' 
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              🔮 Proyección
            </button>
          </div>
        </div>
        
        {/* Balance Principal */}
        <div className="text-center mb-4 md:mb-6 relative z-10">
          <div className="flex items-center justify-center gap-2 md:gap-3 mb-2">
            <IconoSaldo className={`w-6 h-6 md:w-8 md:h-8 ${colorSaldo}`} />
            <div className={`text-3xl md:text-4xl lg:text-5xl font-black ${colorSaldo}`}>
              ${Math.abs(datosActivos.saldo).toLocaleString()}
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-2">
            <span className={`text-xs md:text-sm font-semibold ${colorSaldo}`}>
              {datosActivos.saldo >= 0 ? 'Disponible' : 'Déficit'}
            </span>
            
            {vistaActiva === 'real' && calculosReales.saldo < 0 && calculosProyectados.saldo >= 0 && (
              <div className="group relative">
                <AlertCircle className="w-3 h-3 md:w-4 md:h-4 text-blue-400 cursor-help" />
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-blue-900 text-white text-xs p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                  Tu proyección mensual es positiva
                </div>
              </div>
            )}
          </div>
          
          {/* Tasa de ahorro */}
          <div className="mt-2">
            <span className="text-[10px] md:text-xs text-gray-400">
              Tasa de ahorro: 
            </span>
            <span className={`text-[10px] md:text-xs font-bold ml-1 ${
              datosActivos.tasaAhorro >= 20 ? 'text-green-400' :
              datosActivos.tasaAhorro >= 10 ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {datosActivos.tasaAhorro.toFixed(1)}%
            </span>
          </div>
        </div>
        
        {/* Desglose Ingresos vs Gastos */}
        <div className="grid grid-cols-2 gap-3 md:gap-4 mb-4 relative z-10">
          
          {/* INGRESOS */}
          <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-3 md:p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 md:gap-2 mb-1">
              <TrendingUp className="w-3 h-3 md:w-4 md:h-4 text-green-400" />
              <span className="text-[10px] md:text-xs text-green-300 uppercase font-semibold">Ingresos</span>
            </div>
            <div className="text-xl md:text-2xl font-bold text-green-400">
              ${datosActivos.totalIngresos.toLocaleString()}
            </div>
            
            {/* Diferencia entre real y proyectado */}
            {diferenciaTipos.ingresos !== 0 && (
              <div className="text-[9px] md:text-[10px] text-green-300/70 mt-1">
                {vistaActiva === 'real' ? 'Esperando' : 'Incluye'}: +${Math.abs(diferenciaTipos.ingresos).toLocaleString()}
              </div>
            )}
          </div>
          
          {/* GASTOS */}
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-3 md:p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 md:gap-2 mb-1">
              <TrendingDown className="w-3 h-3 md:w-4 md:h-4 text-red-400" />
              <span className="text-[10px] md:text-xs text-red-300 uppercase font-semibold">Gastos</span>
            </div>
            <div className="text-xl md:text-2xl font-bold text-red-400">
              ${datosActivos.totalGastos.toLocaleString()}
            </div>
            
            {/* ✨ NUEVO: Desglose de pagados/pendientes */}
            <div className="flex items-center justify-center gap-1.5 md:gap-2 mt-1.5">
              <div className="flex items-center gap-1">
                <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-green-400"></div>
                <span className="text-[9px] md:text-[10px] text-green-300">
                  ${(datosActivos.gastosPagados || 0).toLocaleString()}
                </span>
              </div>
              <span className="text-gray-600 text-[8px]">•</span>
              <div className="flex items-center gap-1">
                <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-orange-400"></div>
                <span className="text-[9px] md:text-[10px] text-orange-300">
                  ${((datosActivos.totalGastos || 0) - (datosActivos.gastosPagados || 0)).toLocaleString()}
                </span>
              </div>
            </div>
            <div className="text-[8px] md:text-[9px] text-gray-500 mt-0.5">
              pagados • pendientes
            </div>
            
            {/* Diferencia entre real y proyectado */}
            {diferenciaTipos.gastos !== 0 && (
              <div className="text-[9px] md:text-[10px] text-red-300/70 mt-1">
                {vistaActiva === 'real' ? 'Pendientes' : 'Incluye'}: +${Math.abs(diferenciaTipos.gastos).toLocaleString()}
              </div>
            )}
          </div>
          
        </div>
        
        {/* Botón para mostrar/ocultar detalles */}
        <button
          onClick={() => setMostrarDetalles(!mostrarDetalles)}
          className="w-full bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/10 rounded-xl p-2.5 md:p-3 text-gray-300 text-xs md:text-sm transition-all flex items-center justify-center gap-2 relative z-10 touch-manipulation"
        >
          {mostrarDetalles ? <EyeOff className="w-3.5 h-3.5 md:w-4 md:h-4" /> : <Eye className="w-3.5 h-3.5 md:w-4 md:h-4" />}
          {mostrarDetalles ? 'Ocultar detalles' : 'Ver detalles'}
        </button>
        
        {/* Panel de detalles expandible */}
        {mostrarDetalles && (
          <div className="mt-4 space-y-3 md:space-y-4 animate-in fade-in slide-in-from-top-2 duration-200 relative z-10">
            
            {/* Comparativa Real vs Proyectado */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 md:p-4">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="w-3.5 h-3.5 md:w-4 md:h-4 text-purple-400" />
                <span className="text-xs md:text-sm font-semibold text-white">Comparativa</span>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="text-center">
                  <div className="text-gray-400 mb-1 text-[10px] md:text-xs">📊 Real (hasta hoy)</div>
                  <div className="text-white font-bold text-sm md:text-base">${calculosReales.saldo.toLocaleString()}</div>
                  <div className="text-gray-500 text-[9px] md:text-[10px]">{infoContextual.porcentajeMes}% del mes</div>
                </div>
                <div className="text-center">
                  <div className="text-gray-400 mb-1 text-[10px] md:text-xs">🔮 Proyectado</div>
                  <div className="text-white font-bold text-sm md:text-base">${calculosProyectados.saldo.toLocaleString()}</div>
                  <div className="text-gray-500 text-[9px] md:text-[10px]">100% del mes</div>
                </div>
              </div>
              
              {/* Diferencia */}
              {diferenciaTipos.saldo !== 0 && (
                <div className="mt-3 pt-3 border-t border-white/10 text-center">
                  <div className={`text-xs md:text-sm font-semibold ${diferenciaTipos.saldo > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    Diferencia: {diferenciaTipos.saldo > 0 ? '+' : ''}${diferenciaTipos.saldo.toLocaleString()}
                  </div>
                  <div className="text-[10px] md:text-xs text-gray-400 mt-1">
                    {diferenciaTipos.saldo > 0 
                      ? 'Tu proyección mejora hacia fin de mes' 
                      : 'Cuidado con los gastos pendientes'
                    }
                  </div>
                </div>
              )}
            </div>
            
            {/* Desglose detallado */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 md:p-4">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-400" />
                <span className="text-xs md:text-sm font-semibold text-white">
                  Desglose {vistaActiva === 'real' ? 'Real' : 'Proyectado'}
                </span>
              </div>
              
              <div className="space-y-2 text-[10px] md:text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">💰 Variables</span>
                  <span className="text-white font-semibold">${datosActivos.gastosVariables.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">📅 Fijos</span>
                  <span className="text-white font-semibold">${datosActivos.gastosFijos.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">🔄 Suscripciones</span>
                  <span className="text-white font-semibold">${datosActivos.suscripciones.toLocaleString()}</span>
                </div>
                
                {vistaActiva === 'proyectado' && calculosProyectados.desglose && (
                  <div className="pt-2 mt-2 border-t border-white/10">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 text-[9px] md:text-[10px]">Días restantes:</span>
                      <span className="text-gray-300 text-[9px] md:text-[10px]">{infoContextual.diasRestantes}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 text-[9px] md:text-[10px]">Promedio diario gastos:</span>
                      <span className="text-gray-300 text-[9px] md:text-[10px]">${calculosProyectados.desglose.promedioDiario.toFixed(0)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Contexto temporal */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 md:p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-400" />
                <span className="text-xs md:text-sm font-semibold text-white">Contexto Temporal</span>
              </div>
              <div className="text-[10px] md:text-xs text-blue-300 leading-relaxed">
                {vistaActiva === 'real' 
                  ? `Han pasado ${infoContextual.diasTranscurridos} días del mes. Quedan ${infoContextual.diasRestantes} días para recibir ingresos y gastos pendientes.`
                  : `Proyección completa del mes incluyendo todos los ingresos recurrentes y gastos programados hasta el ${infoContextual.fechaFin.getDate()}.`
                }
              </div>
              
              {/* Barra de progreso del mes */}
              <div className="mt-3">
                <div className="flex justify-between text-[9px] md:text-[10px] text-gray-400 mb-1">
                  <span>Progreso del mes</span>
                  <span>{infoContextual.porcentajeMes}%</span>
                </div>
                <div className="h-1.5 md:h-2 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                    style={{ width: `${infoContextual.porcentajeMes}%` }}
                  />
                </div>
              </div>
            </div>
            
          </div>
        )}
      </div>
    </div>
  )
}

export default WidgetBalanceDual