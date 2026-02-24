// src/components/WidgetBalanceDual.jsx — 2026 Design System
import React, { useState, useMemo } from 'react'
import { ChevronDown, ChevronUp, ArrowUpRight, ArrowDownRight, Zap } from 'lucide-react'

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

  // Sistema de colores 2026 - glassmorphism + 3D depth
  const colorConfig = esPositivo
    ? {
        saldo: 'text-white',
        glow: 'shadow-emerald-500/20',
        gradTop: 'from-emerald-500/20 via-teal-500/10 to-transparent',
        borderAccent: 'border-emerald-500/20',
        ringColor: 'ring-emerald-500/30',
        dotColor: 'bg-emerald-400',
        barBg: 'from-emerald-400 to-teal-500',
        label: 'Disponible',
      }
    : esDeficitPequeno
    ? {
        saldo: 'text-amber-300',
        glow: 'shadow-amber-500/20',
        gradTop: 'from-amber-500/20 via-orange-500/10 to-transparent',
        borderAccent: 'border-amber-500/20',
        ringColor: 'ring-amber-500/30',
        dotColor: 'bg-amber-400',
        barBg: 'from-amber-400 to-orange-500',
        label: 'Déficit',
      }
    : {
        saldo: 'text-red-300',
        glow: 'shadow-red-500/20',
        gradTop: 'from-red-500/20 via-rose-500/10 to-transparent',
        borderAccent: 'border-red-500/20',
        ringColor: 'ring-red-500/30',
        dotColor: 'bg-red-400',
        barBg: 'from-red-400 to-rose-500',
        label: 'Déficit',
      }

  const porcentajeGasto = datosActivos.totalIngresos > 0
    ? Math.min(100, Math.round((datosActivos.totalGastos / datosActivos.totalIngresos) * 100))
    : 0

  const barraColor = porcentajeGasto < 70
    ? 'from-emerald-400 to-teal-500'
    : porcentajeGasto < 90
    ? 'from-amber-400 to-orange-500'
    : 'from-red-400 to-rose-500'

  const tasaAhorro = datosActivos.tasaAhorro != null ? Number(datosActivos.tasaAhorro).toFixed(0) : null

  return (
    <div className="max-w-7xl mx-auto px-3 md:px-4 mb-4">
      {/* ── CARD PRINCIPAL 3D ── */}
      <div
        className={`
          relative overflow-hidden rounded-3xl
          bg-gray-900/70 backdrop-blur-2xl
          border border-white/10 ${colorConfig.borderAccent}
          shadow-2xl ${colorConfig.glow}
          ring-1 ${colorConfig.ringColor}
          transition-all duration-500
        `}
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
        }}
      >
        {/* Glow top-left decorativo */}
        <div className={`absolute -top-16 -left-16 w-48 h-48 bg-gradient-to-br ${colorConfig.gradTop} rounded-full blur-3xl pointer-events-none`} />
        {/* Shimmer line top */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        {/* Barra progreso mes — extremo superior */}
        <div className="h-1 bg-white/5 overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${colorConfig.barBg} transition-all duration-1000`}
            style={{ width: `${infoContextual.porcentajeMes}%` }}
          />
        </div>

        <div className="p-4 md:p-5 relative z-10">

          {/* ── ROW 1: Toggle + día ── */}
          <div className="flex items-center justify-between mb-4">
            {/* Toggle pill moderno */}
            <div className="flex bg-black/30 backdrop-blur-sm rounded-xl p-0.5 border border-white/8 gap-0.5">
              {['real', 'proyectado'].map((v) => (
                <button
                  key={v}
                  onClick={() => setVistaActiva(v)}
                  className={`px-3.5 py-1.5 rounded-[10px] text-[11px] font-bold tracking-wide transition-all duration-200 touch-manipulation ${
                    vistaActiva === v
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {v === 'real' ? 'HOY' : 'MES'}
                </button>
              ))}
            </div>

            {/* Indicador de días */}
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <div className={`w-1.5 h-1.5 rounded-full ${colorConfig.dotColor} animate-pulse`} />
              <span className="font-medium">{infoContextual.diasTranscurridos}/{infoContextual.diasTotales}d</span>
            </div>
          </div>

          {/* ── ROW 2: Balance principal ── */}
          <div className="mb-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-500 mb-1.5">
              {colorConfig.label} {vistaActiva === 'proyectado' && '· Proyección'}
            </p>
            <div className="flex items-end gap-3 flex-wrap">
              <span
                className={`text-[2.6rem] md:text-5xl font-black tracking-tighter leading-none ${colorConfig.saldo}`}
                style={{ textShadow: esPositivo ? '0 0 40px rgba(52,211,153,0.3)' : '' }}
              >
                {datosActivos.saldo < 0 ? '-' : ''}${Math.abs(datosActivos.saldo).toLocaleString()}
              </span>
              {vistaActiva === 'real' && diferenciaSaldo !== 0 && (
                <div className={`flex items-center gap-1 mb-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                  diferenciaSaldo > 0
                    ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                    : 'bg-red-500/10 border-red-500/25 text-red-400'
                }`}>
                  {diferenciaSaldo > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {diferenciaSaldo > 0 ? '+' : ''}{Math.abs(diferenciaSaldo).toLocaleString()} proyect.
                </div>
              )}
            </div>

            {/* Barra gasto/ingreso */}
            <div className="mt-3.5 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Gasto vs ingresos</span>
                <span className={`text-[11px] font-bold ${
                  porcentajeGasto > 90 ? 'text-red-400' : porcentajeGasto > 70 ? 'text-amber-400' : 'text-emerald-400'
                }`}>{porcentajeGasto}%</span>
              </div>
              <div className="h-2 bg-white/8 rounded-full overflow-hidden"
                style={{ boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)' }}>
                <div
                  className={`h-full bg-gradient-to-r ${barraColor} rounded-full transition-all duration-700`}
                  style={{ width: `${porcentajeGasto}%` }}
                />
              </div>
            </div>
          </div>

          {/* ── ROW 3: Cards Ingresos / Gastos ── */}
          <div className="grid grid-cols-2 gap-2.5 mb-3">
            {/* Card Ingresos */}
            <div
              className="rounded-2xl p-3.5 border border-white/8 relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(255,255,255,0.03) 100%)',
                boxShadow: 'inset 0 1px 0 rgba(16,185,129,0.15)',
              }}
            >
              <div className="absolute top-2 right-2">
                <ArrowUpRight className="w-4 h-4 text-emerald-500/40" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 mb-1.5">Ingresos</p>
              <p className="text-lg font-black text-emerald-400 leading-none">
                ${datosActivos.totalIngresos.toLocaleString()}
              </p>
              {tasaAhorro != null && (
                <div className={`inline-flex items-center gap-1 mt-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
                  Number(tasaAhorro) >= 20
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : Number(tasaAhorro) >= 10
                    ? 'bg-amber-500/15 text-amber-400'
                    : 'bg-red-500/15 text-red-400'
                }`}>
                  <Zap className="w-2.5 h-2.5" />
                  {tasaAhorro}% ahorro
                </div>
              )}
            </div>

            {/* Card Gastos */}
            <div
              className="rounded-2xl p-3.5 border border-white/8 relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(239,68,68,0.08) 0%, rgba(255,255,255,0.03) 100%)',
                boxShadow: 'inset 0 1px 0 rgba(239,68,68,0.15)',
              }}
            >
              <div className="absolute top-2 right-2">
                <ArrowDownRight className="w-4 h-4 text-red-500/40" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-red-600 mb-1.5">Gastos</p>
              <p className="text-lg font-black text-red-400 leading-none">
                ${datosActivos.totalGastos.toLocaleString()}
              </p>
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                <span className="text-[10px] text-gray-500">
                  <span className="text-emerald-400 font-bold">${(datosActivos.gastosPagados || 0).toLocaleString()}</span> pag.
                </span>
                {((datosActivos.totalGastos || 0) - (datosActivos.gastosPagados || 0)) > 0 && (
                  <>
                    <span className="text-gray-700">·</span>
                    <span className="text-[10px] text-gray-500">
                      <span className="text-orange-400 font-bold">
                        ${((datosActivos.totalGastos || 0) - (datosActivos.gastosPagados || 0)).toLocaleString()}
                      </span> pend.
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ── Toggle desglose ── */}
          <button
            onClick={() => setMostrarDetalles(!mostrarDetalles)}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-medium text-gray-600 hover:text-gray-400 transition-colors touch-manipulation"
          >
            {mostrarDetalles ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {mostrarDetalles ? 'Ocultar desglose' : 'Desglose de gastos'}
          </button>

          {/* ── Desglose expandible ── */}
          {mostrarDetalles && (
            <div className="mt-3 pt-3 border-t border-white/6 space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
              {[
                { label: 'Variables', valor: datosActivos.gastosVariables, gradColor: 'from-rose-400 to-red-500', textColor: 'text-rose-400' },
                { label: 'Fijos', valor: datosActivos.gastosFijos, gradColor: 'from-amber-400 to-orange-500', textColor: 'text-amber-400' },
                { label: 'Suscripciones', valor: datosActivos.suscripciones, gradColor: 'from-violet-400 to-indigo-500', textColor: 'text-violet-400' },
              ].map(({ label, valor, gradColor, textColor }) => {
                const pct = datosActivos.totalGastos > 0
                  ? Math.round(((valor || 0) / datosActivos.totalGastos) * 100)
                  : 0
                return (
                  <div key={label} className="flex items-center gap-3">
                    <span className="text-[11px] text-gray-500 w-24 shrink-0">{label}</span>
                    <div className="flex-1 h-1.5 bg-white/6 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${gradColor} rounded-full transition-all duration-700`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className={`text-[11px] font-bold ${textColor} w-20 text-right shrink-0`}>
                      ${(valor || 0).toLocaleString()}
                    </span>
                  </div>
                )
              })}
              {vistaActiva === 'real' && (
                <p className="text-[10px] text-gray-600 pt-0.5 text-center">
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
