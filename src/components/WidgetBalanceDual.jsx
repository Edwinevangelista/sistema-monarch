import React from 'react'
import { Eye, Calendar, TrendingUp, TrendingDown } from 'lucide-react'

export default function WidgetBalanceDual({ 
  calculosReales, 
  calculosProyectados, 
  vistaActiva, 
  setVistaActiva, 
  hoy 
}) {
  // Validar que existan los cálculos
  if (!calculosReales || !calculosProyectados) {
    return (
      <div className="max-w-7xl mx-auto px-3 md:px-4 mb-6">
        <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-1">
          <div className="bg-black/20 rounded-2xl p-4 md:p-5 text-center">
            <p className="text-gray-400">Cargando datos...</p>
          </div>
        </div>
      </div>
    )
  }

  // Seleccionar qué cálculos mostrar según la vista activa
  const calculos = vistaActiva === 'real' ? calculosReales : calculosProyectados
  const calculosComparacion = vistaActiva === 'real' ? calculosProyectados : calculosReales
  
  const diferenciaSaldo = calculosComparacion.saldo - calculos.saldo
  const porcentajeGastado = calculos.totalIngresos > 0 
    ? ((calculos.totalGastos / calculos.totalIngresos) * 100).toFixed(1)
    : 0

  // Calcular progreso del mes (días transcurridos)
  const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)
  const diasMes = ultimoDiaMes.getDate()
  const diaActual = hoy.getDate()
  const progresoMes = Math.round((diaActual / diasMes) * 100)

  return (
    <div id="balance-widget" className="max-w-7xl mx-auto px-3 md:px-4 mb-6 animate-in fade-in slide-in-from-top-4 delay-100">
      <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-1">
        <div className="bg-black/20 rounded-2xl p-4 md:p-5">
          
          {/* TOGGLE VISTA REAL VS PROYECTADA */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2">
              <button
                onClick={() => setVistaActiva('real')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all ${
                  vistaActiva === 'real'
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/50'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                <Eye className="w-4 h-4" />
                A la Fecha
              </button>
              <button
                onClick={() => setVistaActiva('proyectado')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all ${
                  vistaActiva === 'proyectado'
                    ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/50'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                <Calendar className="w-4 h-4" />
                Proyección
              </button>
            </div>
            
            {/* CÍRCULO DE PROGRESO DEL MES */}
            <div className="flex items-center gap-2">
              <div className="relative w-10 h-10">
                <svg className="w-10 h-10 -rotate-90">
                  <circle
                    cx="20"
                    cy="20"
                    r="16"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                    className="text-gray-700"
                  />
                  <circle
                    cx="20"
                    cy="20"
                    r="16"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 16}`}
                    strokeDashoffset={`${2 * Math.PI * 16 * (1 - progresoMes / 100)}`}
                    className="text-blue-500 transition-all duration-500"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-white">{progresoMes}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* ETIQUETA DE VISTA ACTIVA */}
          <div className="mb-2 text-center">
            <div className="text-xs md:text-sm font-semibold text-gray-400 uppercase tracking-wider">
              {vistaActiva === 'real' ? '✅ Vista Real (Hasta Hoy)' : '🔮 Proyección del Mes'}
            </div>
          </div>

          {/* SALDO PRINCIPAL */}
          <div className="mb-4 text-center">
            <div className="text-xs md:text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">
              {vistaActiva === 'real' ? 'Balance Actual' : 'Balance Proyectado'}
            </div>
            <div className={`text-3xl md:text-5xl font-bold tracking-tight transition-all ${
              calculos.saldo >= 0 
                ? 'text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-300' 
                : 'text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-red-300'
            }`}>
              ${calculos.saldo.toLocaleString()}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {vistaActiva === 'real' 
                ? hoy.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })
                : `Fin de ${hoy.toLocaleDateString(undefined, { month: 'long' })}`
              }
            </div>
          </div>

          {/* PREVIEW DE LA OTRA VISTA */}
          <div className="mb-4 px-3 py-2 bg-white/5 border border-white/10 rounded-xl">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">
                {vistaActiva === 'real' ? '🔮 Proyección fin de mes:' : '👁️ Real hasta hoy:'}
              </span>
              <div className="flex items-center gap-1.5">
                <span className={`font-bold ${calculosComparacion.saldo >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  ${calculosComparacion.saldo.toLocaleString()}
                </span>
                {diferenciaSaldo !== 0 && (
                  <>
                    {diferenciaSaldo > 0 ? (
                      <TrendingUp className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-rose-400" />
                    )}
                    <span className={`text-[10px] ${diferenciaSaldo > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {diferenciaSaldo > 0 ? 'Mejorará' : 'Reducirá'} ${Math.abs(diferenciaSaldo).toLocaleString()}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* BARRA DE PROGRESO */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-400 mb-2">
              <span>Gastos (${calculos.totalGastos.toLocaleString()})</span>
              <span>{porcentajeGastado}% de ingresos</span>
            </div>
            <div className="h-3 bg-gray-700/50 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ${
                  calculos.totalIngresos > 0 && calculos.totalGastos > calculos.totalIngresos 
                    ? 'bg-red-500' 
                    : 'bg-gradient-to-r from-blue-500 to-purple-500'
                }`}
                style={{ width: `${Math.min(100, porcentajeGastado)}%` }}
              />
            </div>
          </div>

          {/* KPI GRID */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/5 border border-white/5 rounded-xl p-2 md:p-3 text-center hover:bg-white/10 transition-colors">
              <div className="text-[10px] md:text-xs text-emerald-400 mb-1 font-medium">Ingresos</div>
              <div className="text-sm md:text-lg font-bold text-white">
                ${calculos.totalIngresos.toLocaleString()}
              </div>
            </div>
            <div className="bg-white/5 border border-white/5 rounded-xl p-2 md:p-3 text-center hover:bg-white/10 transition-colors">
              <div className="text-[10px] md:text-xs text-rose-400 mb-1 font-medium">Gastos</div>
              <div className="text-sm md:text-lg font-bold text-white">
                ${calculos.totalGastos.toLocaleString()}
              </div>
            </div>
            <div className={`bg-white/5 border border-white/5 rounded-xl p-2 md:p-3 text-center hover:bg-white/10 transition-colors ${
              calculos.tasaAhorro < 0 ? 'bg-red-500/10' : ''
            }`}>
              <div className="text-[10px] md:text-xs text-blue-400 mb-1 font-medium">Ahorro</div>
              <div className={`text-sm md:text-lg font-bold ${
                calculos.tasaAhorro < 0 ? 'text-red-400' : 'text-white'
              }`}>
                {calculos.tasaAhorro.toFixed(1)}%
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}