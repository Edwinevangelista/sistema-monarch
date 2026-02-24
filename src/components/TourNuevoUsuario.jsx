// TourNuevoUsuario.jsx — 2026: Tour interactivo con acciones reales para nuevos usuarios
import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, ChevronRight, ChevronLeft, Plus } from 'lucide-react'

// ── Pasos del tour ───────────────────────────────────────────────────────────
// Cada paso puede tener `accionBtn` y `accionKey` para abrir un modal real
const PASOS = [
  {
    id: 'bienvenida',
    emoji: '👋',
    color: '#6366f1',
    glow: 'rgba(99,102,241,0.4)',
    titulo: '¡Bienvenido a FinGuide!',
    subtitulo: 'Tu app de finanzas para 2026',
    descripcion: 'En menos de 2 minutos aprenderás cómo registrar tu dinero, ver tus gastos y tomar el control total de tus finanzas personales.',
    tip: 'Es gratis, rápido y funciona sin conexión 🚀',
  },
  {
    id: 'ingreso',
    emoji: '💰',
    color: '#10b981',
    glow: 'rgba(16,185,129,0.4)',
    titulo: 'Registra tus Ingresos',
    subtitulo: '¿Cuánto entra cada mes?',
    descripcion: 'El primer paso es registrar de dónde viene tu dinero: salario, freelance, negocio, renta... Toca el botón verde "+" y selecciona "Ingreso".',
    tip: 'Registra tu ingreso principal hoy mismo para ver cómo funciona la app.',
    accionBtn: '+ Agregar mi primer ingreso',
    accionKey: 'ingreso',
    dondeSe: 'Menú inferior → botón verde "+"',
  },
  {
    id: 'gasto',
    emoji: '🛒',
    color: '#f59e0b',
    glow: 'rgba(245,158,11,0.4)',
    titulo: 'Registra tus Gastos',
    subtitulo: '¿En qué se va el dinero?',
    descripcion: 'Cada vez que gastes, registra el monto y la categoría: comida, transporte, entretenimiento, salud... La gráfica se actualiza automáticamente.',
    tip: 'Los gastos más pequeños son los que más se acumulan. ¡Registra todo!',
    accionBtn: '+ Agregar mi primer gasto',
    accionKey: 'gasto',
    dondeSe: 'Menú inferior → botón verde "+" → Gasto variable',
  },
  {
    id: 'cuenta',
    emoji: '🏦',
    color: '#06b6d4',
    glow: 'rgba(6,182,212,0.4)',
    titulo: 'Vincula una Cuenta',
    subtitulo: 'Bancos, efectivo, digital',
    descripcion: 'Agrega tus cuentas bancarias o de dinero digital (banco, efectivo, OXXO Pay, etc.). La app calcula el balance de cada cuenta automáticamente.',
    tip: 'Puedes tener múltiples cuentas y ver el total combinado.',
    accionBtn: '+ Agregar mi primera cuenta',
    accionKey: 'cuenta',
    dondeSe: 'Dashboard → sección "Cuentas Bancarias"',
  },
  {
    id: 'deudas',
    emoji: '💳',
    color: '#ef4444',
    glow: 'rgba(239,68,68,0.4)',
    titulo: '¿Tienes Deudas?',
    subtitulo: 'Regístralas y tenlas bajo control',
    descripcion: 'Si tienes tarjetas de crédito, préstamos o deudas, agrégalas aquí. La app te muestra cuánto debes en total y el Asistente IA puede crear un plan para pagarlas.',
    tip: 'Conocer tus deudas exactas es el primer paso para eliminarlas.',
    accionBtn: '+ Agregar una deuda',
    accionKey: 'deuda',
    dondeSe: 'Dashboard → sección "Mis Deudas"',
  },
  {
    id: 'asistente',
    emoji: '🤖',
    color: '#8b5cf6',
    glow: 'rgba(139,92,246,0.4)',
    titulo: 'Tu Asistente IA',
    subtitulo: 'Tu asesor financiero personal',
    descripcion: 'Una vez que tengas datos, el Asistente IA analiza tus finanzas y te da recomendaciones personalizadas. También puede crear planes de ahorro y deuda.',
    tip: 'Toca "Analizar finanzas" en el Asistente para ver tu primer diagnóstico.',
    dondeSe: 'Dashboard → sección "Asistente IA"',
  },
  {
    id: 'listo',
    emoji: '🚀',
    color: '#10b981',
    glow: 'rgba(16,185,129,0.4)',
    titulo: '¡Ya estás listo!',
    subtitulo: 'Empieza tu camino financiero',
    descripcion: 'Comienza registrando un ingreso o gasto hoy. La constancia es la clave: con solo 30 segundos al día tendrás el control total de tu dinero.',
    tip: 'Tip pro: Activa las notificaciones para recordatorios diarios 🔔',
    accionBtn: '¡Empezar ahora!',
    esFinal: true,
  },
]

// ── Componente principal ─────────────────────────────────────────────────────
const TourNuevoUsuario = ({ onCerrar, onAccion }) => {
  const [paso, setPaso] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60)
    return () => clearTimeout(t)
  }, [])

  const total = PASOS.length
  const pasoActual = PASOS[paso]

  const siguiente = () => {
    if (paso < total - 1) setPaso(p => p + 1)
  }
  const anterior = () => {
    if (paso > 0) setPaso(p => p - 1)
  }

  const cerrar = (completado = false) => {
    localStorage.setItem('tour_completado', '1')
    setVisible(false)
    setTimeout(() => {
      if (onCerrar) onCerrar(completado)
    }, 300)
  }

  // Ejecutar acción real (abre modal en dashboard) y avanza al siguiente paso
  const ejecutarAccion = (key) => {
    if (onAccion && key) onAccion(key)
    // Cerrar tour si es la acción final, sino avanzar
    if (pasoActual.esFinal) {
      cerrar(true)
    } else {
      siguiente()
    }
  }

  const content = (
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center"
      style={{
        background: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(16px)',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.3s ease',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) cerrar() }}
    >
      <div
        className="relative w-full sm:max-w-sm rounded-t-[2rem] sm:rounded-[2rem] overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, rgba(13,18,38,0.99) 0%, rgba(5,8,18,0.99) 100%)',
          border: `1px solid ${pasoActual.color}22`,
          boxShadow: `0 -24px 80px -12px rgba(0,0,0,0.9), 0 0 0 1px ${pasoActual.color}12, inset 0 1px 0 rgba(255,255,255,0.05)`,
          transform: visible ? 'translateY(0)' : 'translateY(24px)',
          transition: 'transform 0.32s cubic-bezier(0.16,1,0.3,1)',
          maxHeight: '92dvh',
        }}
      >
        {/* Barra de progreso top */}
        <div className="h-[3px] w-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <div
            className="h-full transition-all duration-500 ease-out rounded-full"
            style={{
              width: `${((paso + 1) / total) * 100}%`,
              background: `linear-gradient(90deg, ${pasoActual.color}, ${pasoActual.color}99)`,
              boxShadow: `0 0 12px ${pasoActual.glow}`,
            }}
          />
        </div>

        {/* Glow decorativo */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse, ${pasoActual.color}15 0%, transparent 70%)`,
          }}
        />

        {/* Handle bar mobile */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-white/15" />
        </div>

        {/* Top bar: step + close */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <span
            className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
            style={{
              background: `${pasoActual.color}18`,
              color: pasoActual.color,
              border: `1px solid ${pasoActual.color}30`,
            }}
          >
            {paso + 1} de {total}
          </span>
          <button
            onClick={() => cerrar()}
            className="w-7 h-7 rounded-full flex items-center justify-center bg-white/7 hover:bg-white/14 transition-all touch-manipulation"
          >
            <X className="w-3.5 h-3.5 text-gray-500" />
          </button>
        </div>

        <div className="px-5 pb-2 overflow-y-auto" style={{ maxHeight: 'calc(92dvh - 100px)' }}>
          {/* Emoji icon */}
          <div className="flex justify-center mb-4">
            <div
              className="w-[76px] h-[76px] rounded-[22px] flex items-center justify-center relative"
              style={{
                background: `linear-gradient(135deg, ${pasoActual.color}28, ${pasoActual.color}0a)`,
                border: `1px solid ${pasoActual.color}28`,
                boxShadow: `0 0 40px ${pasoActual.glow}60, inset 0 1px 0 rgba(255,255,255,0.08)`,
              }}
            >
              <span className="text-[2.4rem] leading-none">{pasoActual.emoji}</span>
              {/* pulse ring */}
              <div
                className="absolute inset-0 rounded-[22px] animate-ping"
                style={{
                  border: `1px solid ${pasoActual.color}20`,
                  animationDuration: '3s',
                }}
              />
            </div>
          </div>

          {/* Texto */}
          <div className="text-center mb-4">
            <p
              className="text-[10px] font-black uppercase tracking-[0.15em] mb-1.5"
              style={{ color: pasoActual.color }}
            >
              {pasoActual.subtitulo}
            </p>
            <h2 className="text-[1.4rem] font-black text-white mb-2.5 leading-tight">
              {pasoActual.titulo}
            </h2>
            <p className="text-[13px] text-gray-400 leading-relaxed">
              {pasoActual.descripcion}
            </p>
          </div>

          {/* Dónde se hace */}
          {pasoActual.dondeSe && (
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl mb-3"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <span className="text-[11px]">📍</span>
              <span className="text-[11px] text-gray-500 font-medium">{pasoActual.dondeSe}</span>
            </div>
          )}

          {/* Tip */}
          <div
            className="rounded-2xl px-3.5 py-3 mb-4 flex items-start gap-2.5"
            style={{
              background: `${pasoActual.color}0f`,
              border: `1px solid ${pasoActual.color}22`,
            }}
          >
            <span className="text-sm shrink-0 mt-0.5">💡</span>
            <p
              className="text-[12px] leading-relaxed font-medium"
              style={{ color: `${pasoActual.color}cc` }}
            >
              {pasoActual.tip}
            </p>
          </div>

          {/* Dots de navegación */}
          <div className="flex items-center justify-center gap-1.5 mb-4">
            {PASOS.map((_, i) => (
              <button
                key={i}
                onClick={() => setPaso(i)}
                className="transition-all duration-300 rounded-full touch-manipulation"
                style={{
                  width: i === paso ? '20px' : '6px',
                  height: '6px',
                  background: i === paso ? pasoActual.color : 'rgba(255,255,255,0.12)',
                  boxShadow: i === paso ? `0 0 8px ${pasoActual.glow}` : 'none',
                }}
              />
            ))}
          </div>

          {/* Botones */}
          <div className="flex flex-col gap-2 pb-6">
            {/* Botón de acción principal (abre modal real) */}
            {pasoActual.accionBtn && (
              <button
                onClick={() => ejecutarAccion(pasoActual.accionKey)}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-[13px] text-white transition-all touch-manipulation active:scale-[0.97]"
                style={{
                  background: `linear-gradient(135deg, ${pasoActual.color}, ${pasoActual.color}cc)`,
                  boxShadow: `0 8px 30px -6px ${pasoActual.glow}`,
                }}
              >
                {!pasoActual.esFinal && <Plus className="w-4 h-4" />}
                {pasoActual.esFinal && <span>🚀</span>}
                {pasoActual.accionBtn}
              </button>
            )}

            {/* Navegación atrás / siguiente */}
            <div className="flex gap-2">
              {paso > 0 && (
                <button
                  onClick={anterior}
                  className="flex items-center gap-1 px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/9 transition-all text-gray-500 hover:text-gray-300 text-[13px] font-semibold touch-manipulation active:scale-[0.97]"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Atrás
                </button>
              )}

              {!pasoActual.esFinal && (
                <button
                  onClick={siguiente}
                  className={`flex items-center justify-center gap-1.5 py-3 rounded-2xl text-[13px] font-semibold transition-all touch-manipulation active:scale-[0.97] ${
                    pasoActual.accionBtn ? 'flex-1 bg-white/6 hover:bg-white/10 text-gray-400 hover:text-white' : 'flex-1 text-white'
                  }`}
                  style={!pasoActual.accionBtn ? {
                    background: `linear-gradient(135deg, ${pasoActual.color}, ${pasoActual.color}cc)`,
                    boxShadow: `0 8px 30px -6px ${pasoActual.glow}`,
                  } : {}}
                >
                  {paso === 0 ? 'Comenzar' : pasoActual.accionBtn ? 'Saltar este paso' : 'Siguiente'}
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Saltar tour */}
            {!pasoActual.esFinal && (
              <button
                onClick={() => cerrar()}
                className="py-1.5 text-[11px] text-gray-700 hover:text-gray-500 transition-colors touch-manipulation text-center"
              >
                Saltar tour completo
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(content, document.body)
}

// ── Hook: controla cuándo mostrar el tour ────────────────────────────────────
// Lógica: mostrar si usuario es NUEVO (todo en cero) y no completó el tour
// NO requiere onboarding_completado para cubrir también login con Google
export const useTourNuevoUsuario = ({
  ingresos = [],
  gastos = [],
  deudas = [],
  cuentas = [],
}) => {
  const [mostrar, setMostrar] = useState(false)

  useEffect(() => {
    // Si ya completó el tour, nunca mostrar
    if (localStorage.getItem('tour_completado')) return

    const todoEnCero =
      ingresos.length === 0 &&
      gastos.length === 0 &&
      deudas.length === 0 &&
      cuentas.length === 0

    if (todoEnCero) {
      // Delay para que el dashboard cargue completamente
      // Si el onboarding aún está activo, esperar más
      const onboardingActivo = !localStorage.getItem('onboarding_completado')
      const delay = onboardingActivo ? 3500 : 1400

      const t = setTimeout(() => setMostrar(true), delay)
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
