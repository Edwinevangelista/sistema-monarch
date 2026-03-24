// src/components/GuiaPrimerPaso.jsx
// Guía de inicio para usuarios nuevos — 4 pasos en el orden correcto
// Aparece mientras el usuario no haya completado los 4 pasos base
// Se puede minimizar; se cierra automáticamente al completar todo

import { useState, useEffect, useMemo } from 'react'
import { CheckCircle2, ChevronDown, ChevronUp, X, Rocket } from 'lucide-react'

const PASOS = [
  {
    key: 'cuenta',
    emoji: '🏦',
    titulo: 'Agrega tu cuenta bancaria',
    detalle: 'Sin una cuenta no hay balance real. Es el primer paso.',
    cta: 'Agregar cuenta',
    accion: 'cuenta',
  },
  {
    key: 'ingreso',
    emoji: '💰',
    titulo: 'Registra tu ingreso del mes',
    detalle: '¿Cuánto ganaste este mes? Sueldo, freelance, negocio...',
    cta: 'Registrar ingreso',
    accion: 'ingreso',
  },
  {
    key: 'gastoFijo',
    emoji: '🏠',
    titulo: 'Agrega tus gastos fijos',
    detalle: 'Renta, luz, agua, internet — lo que pagas cada mes sin falta.',
    cta: 'Agregar gasto fijo',
    accion: 'gastoFijo',
  },
  {
    key: 'gasto',
    emoji: '🛍️',
    titulo: 'Registra un gasto del día a día',
    detalle: 'Comida, transporte, salidas — los gastos que varían cada mes.',
    cta: 'Registrar gasto',
    accion: 'gasto',
  },
]

export default function GuiaPrimerPaso({
  cuentas      = [],
  ingresos     = [],
  gastosFijos  = [],
  gastos       = [],
  onAccion,
}) {
  const [minimizado, setMinimizado] = useState(false)
  const [cerrada,    setCerrada]    = useState(
    () => !!localStorage.getItem('guia_primer_paso_cerrada')
  )
  const [celebrando, setCelebrando] = useState(false)

  const completados = useMemo(() => ({
    cuenta:    cuentas.length > 0,
    ingreso:   ingresos.length > 0,
    gastoFijo: gastosFijos.length > 0,
    gasto:     gastos.length > 0,
  }), [cuentas, ingresos, gastosFijos, gastos])

  const totalCompletos = Object.values(completados).filter(Boolean).length
  const todoCompleto   = totalCompletos === 4

  // Celebrate + auto-close when all 4 steps are done
  useEffect(() => {
    if (todoCompleto && !cerrada) {
      setCelebrando(true)
      const t = setTimeout(() => {
        localStorage.setItem('guia_primer_paso_cerrada', '1')
        setCerrada(true)
      }, 2800)
      return () => clearTimeout(t)
    }
  }, [todoCompleto, cerrada])

  const handleCerrar = () => {
    localStorage.setItem('guia_primer_paso_cerrada', '1')
    setCerrada(true)
  }

  if (cerrada) return null

  // First incomplete step gets the highlighted CTA
  const primerPendiente = PASOS.find(p => !completados[p.key])?.key

  return (
    <div className="max-w-7xl mx-auto px-3 md:px-4 mt-3">
      <div
        className="relative overflow-hidden rounded-3xl border border-emerald-500/15"
        style={{
          background: 'linear-gradient(135deg, rgba(16,185,129,0.06) 0%, rgba(255,255,255,0.015) 100%)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2), inset 0 1px 0 rgba(16,185,129,0.08)',
        }}
      >
        {/* Top shimmer line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/25 to-transparent" />

        {/* Celebration overlay */}
        {celebrando && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm rounded-3xl animate-in fade-in duration-300">
            <span className="text-4xl mb-2">🎉</span>
            <p className="text-sm font-bold text-emerald-400">¡Todo listo!</p>
            <p className="text-xs text-gray-400 mt-1">Ya puedes ver tu salud financiera real</p>
          </div>
        )}

        <div className="p-4">

          {/* ── Header ── */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Rocket className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <p className="text-xs font-bold text-gray-200">Primeros pasos</p>
                <p className="text-[10px] text-gray-500">Configura tu cuenta en 4 pasos</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Progress chip */}
              <span
                className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border"
                style={{ color: '#34d399', borderColor: '#34d39935', background: '#34d39912' }}
              >
                {totalCompletos}/4
              </span>
              <button
                onClick={() => setMinimizado(v => !v)}
                className="p-1 text-gray-600 hover:text-gray-400 touch-manipulation transition-colors"
                aria-label={minimizado ? 'Expandir' : 'Minimizar'}
              >
                {minimizado
                  ? <ChevronDown className="w-4 h-4" />
                  : <ChevronUp   className="w-4 h-4" />}
              </button>
              <button
                onClick={handleCerrar}
                className="p-1 text-gray-700 hover:text-gray-500 touch-manipulation transition-colors"
                aria-label="Cerrar guía"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* ── Progress bar ── */}
          <div className="h-1 bg-white/6 rounded-full overflow-hidden mb-3">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${(totalCompletos / 4) * 100}%`,
                background: 'linear-gradient(90deg, #10b981, #34d399)',
              }}
            />
          </div>

          {/* ── Steps list ── */}
          {!minimizado && (
            <div className="space-y-2">
              {PASOS.map((paso, i) => {
                const hecho     = completados[paso.key]
                const esCurrent = paso.key === primerPendiente

                return (
                  <div
                    key={paso.key}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-colors"
                    style={{
                      background: hecho
                        ? 'rgba(52,211,153,0.05)'
                        : esCurrent
                        ? 'rgba(255,255,255,0.05)'
                        : 'rgba(255,255,255,0.02)',
                      border: hecho
                        ? '1px solid rgba(52,211,153,0.15)'
                        : esCurrent
                        ? '1px solid rgba(255,255,255,0.10)'
                        : '1px solid rgba(255,255,255,0.04)',
                    }}
                  >
                    {/* Check / step number */}
                    {hecho ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    ) : (
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          esCurrent ? 'border-emerald-500' : 'border-gray-700'
                        }`}
                      >
                        <span className={`text-[9px] font-black ${esCurrent ? 'text-emerald-400' : 'text-gray-600'}`}>
                          {i + 1}
                        </span>
                      </div>
                    )}

                    {/* Emoji */}
                    <span className={`text-base shrink-0 ${hecho ? 'opacity-40' : ''}`}>
                      {paso.emoji}
                    </span>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-[11px] font-semibold leading-tight ${
                        hecho     ? 'text-gray-600 line-through'
                        : esCurrent ? 'text-gray-200'
                        : 'text-gray-500'
                      }`}>
                        {paso.titulo}
                      </p>
                      {/* Show detail only for the current step */}
                      {!hecho && esCurrent && (
                        <p className="text-[10px] text-gray-600 mt-0.5 leading-tight">
                          {paso.detalle}
                        </p>
                      )}
                    </div>

                    {/* CTA button */}
                    {!hecho && (
                      <button
                        onClick={() => onAccion?.(paso.accion)}
                        className={`shrink-0 px-2.5 py-1.5 rounded-xl text-[10px] font-bold touch-manipulation transition-opacity active:opacity-70 ${
                          esCurrent
                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                            : 'bg-white/5 text-gray-600 border border-white/8'
                        }`}
                      >
                        {esCurrent ? paso.cta : 'Agregar'}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
