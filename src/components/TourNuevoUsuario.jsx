// TourNuevoUsuario.jsx — 2026: Guía interactiva para usuarios nuevos (datos en cero)
import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, ChevronRight, ChevronLeft } from 'lucide-react'

// ── Pasos del tour ──────────────────────────────────────────────────────────
const PASOS = [
  {
    id: 'bienvenida',
    emoji: '👋',
    color: '#6366f1',
    glow: 'rgba(99,102,241,0.4)',
    titulo: '¡Bienvenido a FinGuide!',
    subtitulo: 'Tu app de finanzas personales',
    descripcion: 'FinGuide es tu compañero financiero diseñado para jóvenes modernos. Aquí puedes controlar tu dinero, salir de deudas y alcanzar tus metas. ¡Vamos a mostrarte cómo!',
    tip: 'Solo toma 2 minutos conocer la app 🚀',
  },
  {
    id: 'balance',
    emoji: '💰',
    color: '#10b981',
    glow: 'rgba(16,185,129,0.4)',
    titulo: 'Tu Balance General',
    subtitulo: 'La vista más importante',
    descripcion: 'En la parte superior siempre verás tu balance: cuánto entra, cuánto sale y cuánto te queda. Puedes ver el día o el mes completo con un toque.',
    tip: 'El verde = ingresos. El rojo = gastos. Simple.',
    accion: '➡ Agrega tu primer ingreso para empezar',
  },
  {
    id: 'gastos',
    emoji: '📊',
    color: '#f59e0b',
    glow: 'rgba(245,158,11,0.4)',
    titulo: 'Gastos y Categorías',
    subtitulo: 'Conoce en qué gastas tu dinero',
    descripcion: 'Registra tus gastos del día a día y verás automáticamente una gráfica que muestra en qué categorías gastas más: comida, transporte, entretenimiento y más.',
    tip: 'La gráfica de dona te muestra el desglose visual de tus gastos.',
    accion: '➡ Registra un gasto para ver la gráfica',
  },
  {
    id: 'deudas',
    emoji: '💳',
    color: '#ef4444',
    glow: 'rgba(239,68,68,0.4)',
    titulo: 'Control de Deudas',
    subtitulo: 'Sal de deudas con un plan',
    descripcion: 'Agrega tus deudas (tarjetas, préstamos, etc.) y la app te mostrará cuánto debes en total y te ayudará a crear un plan personalizado para pagarlas.',
    tip: 'Primero paga las deudas con mayor interés. Eso te ahorra dinero.',
    accion: '➡ Agrega tu primera deuda',
  },
  {
    id: 'evolucion',
    emoji: '📈',
    color: '#8b5cf6',
    glow: 'rgba(139,92,246,0.4)',
    titulo: 'Evolución Mensual',
    subtitulo: 'Mira tu progreso en el tiempo',
    descripcion: 'La gráfica de barras muestra mes a mes cómo van tus ingresos y gastos. Así puedes ver si estás mejorando o si hay un mes que se salió de control.',
    tip: 'Si las barras verdes crecen y las rojas bajan, ¡vas bien!',
  },
  {
    id: 'alertas',
    emoji: '🔔',
    color: '#f97316',
    glow: 'rgba(249,115,22,0.4)',
    titulo: 'Alertas Inteligentes',
    subtitulo: 'La app trabaja contigo',
    descripcion: 'FinGuide analiza tus finanzas y te manda alertas cuando detecta algo importante: gastos altos, deudas próximas a vencer, o cuando llevas tiempo sin registrar.',
    tip: 'Activa las notificaciones push para no perderte ninguna alerta.',
  },
  {
    id: 'planes',
    emoji: '🎯',
    color: '#06b6d4',
    glow: 'rgba(6,182,212,0.4)',
    titulo: 'Planes Financieros',
    subtitulo: 'Metas que puedes lograr',
    descripcion: 'El Asistente IA puede crear planes personalizados para ti: pagar una deuda en X meses, ahorrar para algo especial o reducir gastos en una categoría específica.',
    tip: 'Cuéntale al asistente tu situación y él creará el plan perfecto.',
    accion: '➡ Toca "Asistente IA" para empezar',
  },
  {
    id: 'listo',
    emoji: '🚀',
    color: '#10b981',
    glow: 'rgba(16,185,129,0.4)',
    titulo: '¡Estás listo!',
    subtitulo: 'Empieza tu camino financiero',
    descripcion: 'Ya conoces lo básico. El primer paso es registrar un ingreso o gasto hoy mismo. La constancia es la clave: usuarios que registran diario mejoran sus finanzas 3x más rápido.',
    tip: 'Consejo pro: Registra apenas gastas o ingresas. Así no olvidas nada.',
    accion: '¡Empecemos!',
    esFinal: true,
  },
]

// ── Componente principal ─────────────────────────────────────────────────────
const TourNuevoUsuario = ({ onCerrar }) => {
  const [paso, setPaso] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Fade-in inicial
    const t = setTimeout(() => setVisible(true), 50)
    return () => clearTimeout(t)
  }, [])

  const total = PASOS.length
  const pasoActual = PASOS[paso]

  const siguiente = () => {
    if (paso < total - 1) {
      setPaso(p => p + 1)
    }
  }

  const anterior = () => {
    if (paso > 0) {
      setPaso(p => p - 1)
    }
  }

  const cerrar = () => {
    // Marcar como visto
    localStorage.setItem('tour_completado', '1')
    setVisible(false)
    setTimeout(() => {
      if (onCerrar) onCerrar()
    }, 300)
  }

  const content = (
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(12px)',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.3s ease',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) cerrar() }}
    >
      {/* ── Tarjeta principal ── */}
      <div
        className="relative w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, rgba(15,20,40,0.98) 0%, rgba(5,8,20,0.99) 100%)',
          border: `1px solid ${pasoActual.color}25`,
          boxShadow: `0 -20px 60px -10px rgba(0,0,0,0.8), 0 0 0 1px ${pasoActual.color}15`,
          transform: visible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'transform 0.3s ease, box-shadow 0.4s ease',
          maxHeight: '90dvh',
        }}
      >
        {/* Barra de progreso top */}
        <div className="h-0.5 w-full bg-white/5">
          <div
            className="h-full transition-all duration-500 ease-out"
            style={{
              width: `${((paso + 1) / total) * 100}%`,
              background: `linear-gradient(90deg, ${pasoActual.color}, ${pasoActual.color}aa)`,
              boxShadow: `0 0 8px ${pasoActual.glow}`,
            }}
          />
        </div>

        {/* Glow de fondo decorativo */}
        <div
          className="absolute top-0 right-0 w-48 h-48 pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${pasoActual.color}18 0%, transparent 70%)`,
            transform: 'translate(25%, -25%)',
          }}
        />

        {/* Botón cerrar */}
        <button
          onClick={cerrar}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center bg-white/8 hover:bg-white/15 transition-all touch-manipulation"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>

        {/* Indicador de paso */}
        <div className="absolute top-4 left-4 z-10">
          <span className="text-[11px] font-bold text-gray-500 tracking-widest uppercase">
            {paso + 1} / {total}
          </span>
        </div>

        <div className="p-6 pt-12">
          {/* Icono animado */}
          <div className="flex items-center justify-center mb-5">
            <div
              className="relative w-20 h-20 rounded-3xl flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${pasoActual.color}30, ${pasoActual.color}10)`,
                border: `1px solid ${pasoActual.color}30`,
                boxShadow: `0 0 30px ${pasoActual.glow}, inset 0 1px 0 rgba(255,255,255,0.1)`,
              }}
            >
              <span className="text-4xl" role="img" aria-label="paso">
                {pasoActual.emoji}
              </span>
              {/* Anillo exterior */}
              <div
                className="absolute inset-0 rounded-3xl"
                style={{
                  border: `1px solid ${pasoActual.color}20`,
                  transform: 'scale(1.2)',
                }}
              />
            </div>
          </div>

          {/* Texto */}
          <div className="text-center mb-5">
            <p
              className="text-[11px] font-bold uppercase tracking-widest mb-1"
              style={{ color: pasoActual.color }}
            >
              {pasoActual.subtitulo}
            </p>
            <h2 className="text-2xl font-black text-white mb-3 leading-tight">
              {pasoActual.titulo}
            </h2>
            <p className="text-sm text-gray-400 leading-relaxed">
              {pasoActual.descripcion}
            </p>
          </div>

          {/* Tip */}
          <div
            className="rounded-2xl p-3 mb-5 flex items-start gap-2.5"
            style={{
              background: `${pasoActual.color}12`,
              border: `1px solid ${pasoActual.color}25`,
            }}
          >
            <span className="text-base shrink-0">💡</span>
            <p
              className="text-xs leading-relaxed font-medium"
              style={{ color: `${pasoActual.color}dd` }}
            >
              {pasoActual.tip}
            </p>
          </div>

          {/* Acción contextual */}
          {pasoActual.accion && !pasoActual.esFinal && (
            <div
              className="rounded-xl p-2.5 mb-4 text-center"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.1)' }}
            >
              <p className="text-[11px] text-gray-500 font-medium">{pasoActual.accion}</p>
            </div>
          )}

          {/* Puntos de navegación */}
          <div className="flex items-center justify-center gap-1.5 mb-5">
            {PASOS.map((_, i) => (
              <button
                key={i}
                onClick={() => setPaso(i)}
                className="transition-all duration-300 rounded-full touch-manipulation"
                style={{
                  width: i === paso ? '20px' : '6px',
                  height: '6px',
                  background: i === paso ? pasoActual.color : 'rgba(255,255,255,0.15)',
                  boxShadow: i === paso ? `0 0 6px ${pasoActual.glow}` : 'none',
                }}
              />
            ))}
          </div>

          {/* Botones de navegación */}
          <div className="flex gap-2">
            {paso > 0 && !pasoActual.esFinal && (
              <button
                onClick={anterior}
                className="flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-white/6 hover:bg-white/10 transition-all text-gray-400 hover:text-white text-sm font-semibold touch-manipulation active:scale-[0.97]"
              >
                <ChevronLeft className="w-4 h-4" />
                Atrás
              </button>
            )}

            {pasoActual.esFinal ? (
              <button
                onClick={cerrar}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm text-white transition-all touch-manipulation active:scale-[0.97]"
                style={{
                  background: `linear-gradient(135deg, ${pasoActual.color}, ${pasoActual.color}cc)`,
                  boxShadow: `0 8px 25px -5px ${pasoActual.glow}`,
                }}
              >
                <span>🚀</span>
                {pasoActual.accion}
              </button>
            ) : (
              <button
                onClick={siguiente}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm text-white transition-all touch-manipulation active:scale-[0.97]"
                style={{
                  background: `linear-gradient(135deg, ${pasoActual.color}, ${pasoActual.color}cc)`,
                  boxShadow: `0 8px 25px -5px ${pasoActual.glow}`,
                }}
              >
                {paso === 0 ? 'Comenzar tour' : 'Siguiente'}
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Skip */}
          {!pasoActual.esFinal && (
            <button
              onClick={cerrar}
              className="w-full mt-3 py-2 text-[11px] text-gray-600 hover:text-gray-400 transition-colors touch-manipulation"
            >
              Saltar tour
            </button>
          )}
        </div>
      </div>
    </div>
  )

  return createPortal(content, document.body)
}

// ── Hook para controlar si mostrar el tour ───────────────────────────────────
export const useTourNuevoUsuario = ({ ingresos = [], gastos = [], deudas = [], cuentas = [] }) => {
  const [mostrar, setMostrar] = useState(false)

  useEffect(() => {
    // Solo mostrar si:
    // 1. El tour no fue completado antes
    // 2. El usuario tiene todo en cero (datos vacíos)
    const tourCompletado = localStorage.getItem('tour_completado')
    const onboardingCompletado = localStorage.getItem('onboarding_completado')

    if (tourCompletado) return

    const todoEnCero =
      ingresos.length === 0 &&
      gastos.length === 0 &&
      deudas.length === 0 &&
      cuentas.length === 0

    // Mostrar después de un pequeño delay para que el dashboard cargue primero
    if (todoEnCero && onboardingCompletado) {
      const t = setTimeout(() => setMostrar(true), 1200)
      return () => clearTimeout(t)
    }
  }, [ingresos.length, gastos.length, deudas.length, cuentas.length])

  const cerrarTour = () => {
    setMostrar(false)
    localStorage.setItem('tour_completado', '1')
  }

  return { mostrar, cerrarTour }
}

export default TourNuevoUsuario
