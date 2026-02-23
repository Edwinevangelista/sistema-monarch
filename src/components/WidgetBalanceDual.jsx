// src/components/WidgetBalanceDual.jsx
import React, { useState, useMemo } from 'react'
import { ChevronDown, ChevronUp, ArrowUpRight, ArrowDownRight } from 'lucide-react'

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

  const datosActivos = vistaActiva === 'real' ? calculosReales : calculosProyectados

  const infoContextual = useMemo(() => {
    const diasTranscurridos = hoy.getDate()
    const diasTotales = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate()
    const diasRestantes = diasTotales - diasTranscurridos
    const porcentajeMes = Math.round((diasTranscurridos / diasTotales) * 100)
    return { diasTranscurridos, diasRestantes, diasTotales, porcentajeMes }
  }, [hoy])

  const diferenciaSaldo = calculosProyectados.saldo - calculosReales.saldo

  const esPositivo = datosActivos.saldo >= 0
  const esDeficitPequeno = datosActivos.saldo > -500 && datosActivos.saldo < 0
  const colorSaldo = esPositivo ? 'text-white' : esDeficitPequeno ? 'text-yellow-300' : 'text-red-300'
  const bgGlow = esPositivo ? 'from-emerald-500/15 to-blue-500/10' : esDeficitPequeno ? 'from-yellow-500/15 to-orange-500/10' : 'from-red-500/15 to-pink-500/10'

  // Barra de progreso de gastos vs ingresos
  const porcentajeGasto = datosActivos.totalIngresos > 0
    ? Math.min(100, Math.round((datosActivos.totalGastos / datosActivos.totalIngresos) * 100))
    : 0
  const colorBarra = porcentajeGasto < 75 ? 'bg-emerald-500' : porcentajeGasto < 90 ? 'bg-yellow-500' : 'bg-red-500'

  return (
    <div className="max-w-7xl mx-auto px-3 md:px-4 mb-4">
      <div className={`bg-gradient-to-br ${bgGlow} bg-gray-900/80 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-top-4`}>

        {/* Barra de progreso del mes — top */}
        <div className="h-0.5 bg-white/5">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-700"
            style={{ width: `${infoContextual.porcentajeMes}%` }}
          />
        </div>

        <div className="p-4 md:p-6">

          {/* Toggle Real / Proyección */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex bg-white/8 rounded-xl p-1 border border-white/10 gap-0.5">
              <button
                onClick={() => setVistaActiva('real')}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  vistaActiva === 'real'
                    ? 'bg-white text-gray-900 shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Hoy
              </button>
              <button
                onClick={() => setVistaActiva('proyectado')}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  vistaActiva === 'proyectado'
                    ? 'bg-white text-gray-900 shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Este mes
              </button>
            </div>
            <span className="text-xs text-gray-500">
              Día {infoContextual.diasTranscurridos}/{infoContextual.diasTotales}
            </span>
          </div>

          {/* Balance principal */}
          <div className="mb-5">
            <p className="text-xs text-gray-400 mb-1 font-medium uppercase tracking-wider">
              {datosActivos.saldo >= 0 ? 'Disponible' : 'Déficit'}
            </p>
            <div className="flex items-end gap-3">
              <span className={`text-4xl md:text-5xl font-black tracking-tight ${colorSaldo}`}>
                {datosActivos.saldo < 0 ? '-' : ''}${Math.abs(datosActivos.saldo).toLocaleString()}
              </span>
              {vistaActiva === 'real' && diferenciaSaldo !== 0 && (
                <span className={`text-sm font-semibold mb-1 ${diferenciaSaldo > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {diferenciaSaldo > 0 ? '+' : ''}{diferenciaSaldo.toLocaleString()} proyect.
                </span>
              )}
            </div>

            {/* Barra visual gasto/ingreso */}
            <div className="mt-3">
              <div className="flex justify-between text-[11px] text-gray-500 mb-1">
                <span>Gastos vs ingresos</span>
                <span className={porcentajeGasto > 90 ? 'text-red-400 font-semibold' : ''}>{porcentajeGasto}%</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full ${colorBarra} rounded-full transition-all duration-700`}
                  style={{ width: `${porcentajeGasto}%` }}
                />
              </div>
            </div>
          </div>

          {/* Ingresos y Gastos — lado a lado */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {/* Ingresos */}
            <div className="bg-white/5 border border-white/8 rounded-2xl p-3.5">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-emerald-500/20 rounded-lg">
                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Ingresos</span>
              </div>
              <p className="text-xl font-bold text-emerald-400">
                ${datosActivos.totalIngresos.toLocaleString()}
              </p>
              {datosActivos.tasaAhorro != null && (
                <p className="text-[11px] text-gray-500 mt-1">
                  Ahorro: <span className={`font-semibold ${datosActivos.tasaAhorro >= 20 ? 'text-emerald-400' : datosActivos.tasaAhorro >= 10 ? 'text-yellow-400' : 'text-red-400'}`}>{Number(datosActivos.tasaAhorro).toFixed(0)}%</span>
                </p>
              )}
            </div>

            {/* Gastos */}
            <div className="bg-white/5 border border-white/8 rounded-2xl p-3.5">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-red-500/20 rounded-lg">
                  <ArrowDownRight className="w-3.5 h-3.5 text-red-400" />
                </div>
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Gastos</span>
              </div>
              <p className="text-xl font-bold text-red-400">
                ${datosActivos.totalGastos.toLocaleString()}
              </p>
              {/* Pagados vs pendientes */}
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[11px] text-gray-500">
                  <span className="text-emerald-400 font-medium">${(datosActivos.gastosPagados || 0).toLocaleString()}</span> pag.
                </span>
                <span className="text-gray-700">·</span>
                <span className="text-[11px] text-gray-500">
                  <span className="text-orange-400 font-medium">${((datosActivos.totalGastos || 0) - (datosActivos.gastosPagados || 0)).toLocaleString()}</span> pend.
                </span>
              </div>
            </div>
          </div>

          {/* Ver desglose */}
          <button
            onClick={() => setMostrarDetalles(!mostrarDetalles)}
            className="w-full flex items-center justify-center gap-1.5 py-2 text-xs text-gray-500 hover:text-gray-300 transition-colors touch-manipulation"
          >
            {mostrarDetalles ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {mostrarDetalles ? 'Ocultar desglose' : 'Ver desglose de gastos'}
          </button>

          {/* Panel expandible */}
          {mostrarDetalles && (
            <div className="mt-3 pt-3 border-t border-white/8 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
              {[
                { label: 'Variables', valor: datosActivos.gastosVariables, color: 'text-rose-400' },
                { label: 'Fijos', valor: datosActivos.gastosFijos, color: 'text-yellow-400' },
                { label: 'Suscripciones', valor: datosActivos.suscripciones, color: 'text-indigo-400' },
              ].map(({ label, valor, color }) => {
                const pct = datosActivos.totalGastos > 0 ? Math.round(((valor || 0) / datosActivos.totalGastos) * 100) : 0
                return (
                  <div key={label} className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 w-24">{label}</span>
                    <div className="flex-1 h-1 bg-white/8 rounded-full overflow-hidden">
                      <div className={`h-full ${color.replace('text-', 'bg-')} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className={`text-xs font-semibold ${color} w-20 text-right`}>${(valor || 0).toLocaleString()}</span>
                  </div>
                )
              })}

              {vistaActiva === 'real' && (
                <p className="text-[11px] text-gray-600 pt-1 text-center">
                  {infoContextual.diasRestantes} días restantes en el mes
                </p>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default WidgetBalanceDual
