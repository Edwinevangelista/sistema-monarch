import { useState } from 'react'
import { toast } from 'sonner'
import {
  Wallet,
  TrendingUp,
  Target,
  Sparkles,
  ChevronRight,
  Check,
  DollarSign,
  PiggyBank,
  BarChart3,
  X,
} from 'lucide-react'

// ─── PASOS DEL ONBOARDING ───────────────────────────────────────────────────
const PASOS = [
  {
    id: 'bienvenida',
    titulo: '¡Bienvenido a FinGuide! 🎉',
    subtitulo: 'Tu asistente financiero personal',
    descripcion:
      'Toma el control total de tus finanzas. Registra ingresos, gastos, deudas y suscripciones en un solo lugar.',
    color: 'from-blue-600 to-purple-600',
    accentColor: 'text-blue-400',
    bgAccent: 'bg-blue-500/10 border-blue-500/20',
    icono: Wallet,
    features: [
      { icono: TrendingUp, texto: 'Balance en tiempo real' },
      { icono: BarChart3, texto: 'Gráficas inteligentes' },
      { icono: Target, texto: 'Metas de ahorro' },
    ],
  },
  {
    id: 'moneda',
    titulo: '¿Con qué moneda trabajas? 💱',
    subtitulo: 'Configura tu moneda principal',
    descripcion:
      'Elige la moneda que usas en tu día a día. Puedes cambiarla en cualquier momento desde tu perfil.',
    color: 'from-emerald-600 to-teal-600',
    accentColor: 'text-emerald-400',
    bgAccent: 'bg-emerald-500/10 border-emerald-500/20',
    icono: DollarSign,
    esConfiguracion: true,
  },
  {
    id: 'objetivo',
    titulo: '¿Cuál es tu meta principal? 🎯',
    subtitulo: 'Personaliza tu experiencia',
    descripcion:
      'Saber tu objetivo nos ayuda a mostrarte las herramientas más relevantes para ti.',
    color: 'from-orange-600 to-pink-600',
    accentColor: 'text-orange-400',
    bgAccent: 'bg-orange-500/10 border-orange-500/20',
    icono: PiggyBank,
    esObjetivo: true,
  },
  {
    id: 'listo',
    titulo: '¡Todo configurado! 🚀',
    subtitulo: 'Estás listo para empezar',
    descripcion:
      'Tu cuenta está lista. Comienza registrando tu primer ingreso o conectando tu cuenta bancaria.',
    color: 'from-green-600 to-emerald-600',
    accentColor: 'text-green-400',
    bgAccent: 'bg-green-500/10 border-green-500/20',
    icono: Sparkles,
    acciones: [
      { label: '➕ Registrar ingreso', key: 'ingreso' },
      { label: '💸 Registrar gasto', key: 'gasto' },
      { label: '🏦 Agregar cuenta', key: 'cuenta' },
    ],
  },
]

const MONEDAS = [
  { codigo: 'MXN', simbolo: '$', nombre: 'Peso Mexicano', flag: '🇲🇽' },
  { codigo: 'USD', simbolo: '$', nombre: 'Dólar Americano', flag: '🇺🇸' },
  { codigo: 'COP', simbolo: '$', nombre: 'Peso Colombiano', flag: '🇨🇴' },
  { codigo: 'ARS', simbolo: '$', nombre: 'Peso Argentino', flag: '🇦🇷' },
  { codigo: 'EUR', simbolo: '€', nombre: 'Euro', flag: '🇪🇺' },
  { codigo: 'BRL', simbolo: 'R$', nombre: 'Real Brasileño', flag: '🇧🇷' },
]

const OBJETIVOS = [
  { key: 'deudas', emoji: '💳', label: 'Salir de deudas', desc: 'Quiero pagar todo lo que debo' },
  { key: 'ahorro', emoji: '🐖', label: 'Ahorrar más', desc: 'Quiero construir un fondo de emergencia' },
  { key: 'gastos', emoji: '📉', label: 'Controlar gastos', desc: 'Quiero saber en qué gasto mi dinero' },
  { key: 'inversion', emoji: '📈', label: 'Empezar a invertir', desc: 'Quiero hacer crecer mi dinero' },
]

// ─── COMPONENTE PRINCIPAL ────────────────────────────────────────────────────
export default function OnboardingModal({ onClose, onAccionRapida }) {
  const [paso, setPaso] = useState(0)
  const [monedaSeleccionada, setMonedaSeleccionada] = useState('MXN')
  const [objetivoSeleccionado, setObjetivoSeleccionado] = useState(null)
  const [animando, setAnimando] = useState(false)

  const pasoActual = PASOS[paso]
  const totalPasos = PASOS.length
  const esUltimoPaso = paso === totalPasos - 1

  const avanzar = () => {
    if (animando) return
    setAnimando(true)
    setTimeout(() => {
      setPaso((p) => Math.min(p + 1, totalPasos - 1))
      setAnimando(false)
    }, 200)
  }

  const guardarYCerrar = () => {
    // Persistir preferencias elegidas
    try {
      const preferencias = JSON.parse(localStorage.getItem('preferenciasUsuario') || '{}')
      preferencias.moneda = monedaSeleccionada
      if (objetivoSeleccionado) preferencias.objetivo = objetivoSeleccionado
      localStorage.setItem('preferenciasUsuario', JSON.stringify(preferencias))
    } catch (e) { /* no fatal */ }

    localStorage.setItem('onboarding_completado', '1')
    toast.success('¡Bienvenido a FinGuide! 🎉 Todo está listo.')
    onClose()
  }

  const handleAccionRapida = (key) => {
    localStorage.setItem('onboarding_completado', '1')
    onClose()
    if (onAccionRapida) onAccionRapida(key)
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md z-[99999] animate-in fade-in duration-300"
        onClick={esUltimoPaso ? guardarYCerrar : undefined}
      />

      {/* Modal centrado */}
      <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 pointer-events-none">
        <div
          className={`
            w-full max-w-sm bg-gray-900 rounded-3xl border border-white/10 shadow-2xl
            pointer-events-auto overflow-hidden
            transition-all duration-200
            ${animando ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}
            animate-in fade-in zoom-in-95 duration-300
          `}
        >
          {/* Barra de progreso top */}
          <div className="flex gap-1 p-4 pb-0">
            {PASOS.map((_, i) => (
              <div
                key={i}
                className={`flex-1 h-1 rounded-full transition-all duration-500 ${
                  i <= paso ? 'bg-white' : 'bg-white/20'
                }`}
              />
            ))}
          </div>

          {/* Botón cerrar (solo en último paso) */}
          {esUltimoPaso && (
            <button
              onClick={guardarYCerrar}
              className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Contenido del paso */}
          <div className="p-6 pt-4">
            {/* Icono animado */}
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${pasoActual.color} flex items-center justify-center mb-4 shadow-lg`}>
              <pasoActual.icono className="w-7 h-7 text-white" />
            </div>

            <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${pasoActual.accentColor}`}>
              Paso {paso + 1} de {totalPasos}
            </p>
            <h2 className="text-xl font-bold text-white mb-1">{pasoActual.titulo}</h2>
            <p className="text-sm text-gray-400 mb-5 leading-relaxed">{pasoActual.descripcion}</p>

            {/* ── PASO 1: Features highlight ── */}
            {pasoActual.features && (
              <div className="space-y-2 mb-5">
                {pasoActual.features.map(({ icono: Ic, texto }) => (
                  <div key={texto} className={`flex items-center gap-3 p-3 rounded-xl border ${pasoActual.bgAccent}`}>
                    <Ic className={`w-4 h-4 ${pasoActual.accentColor} shrink-0`} />
                    <span className="text-sm text-gray-200 font-medium">{texto}</span>
                  </div>
                ))}
              </div>
            )}

            {/* ── PASO 2: Selector de moneda ── */}
            {pasoActual.esConfiguracion && (
              <div className="grid grid-cols-2 gap-2 mb-5">
                {MONEDAS.map((m) => (
                  <button
                    key={m.codigo}
                    onClick={() => setMonedaSeleccionada(m.codigo)}
                    className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all duration-150 ${
                      monedaSeleccionada === m.codigo
                        ? 'bg-emerald-500/20 border-emerald-500/50 ring-1 ring-emerald-500/50'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <span className="text-xl">{m.flag}</span>
                    <div>
                      <p className="text-xs font-bold text-white">{m.codigo}</p>
                      <p className="text-xs text-gray-400 truncate">{m.nombre}</p>
                    </div>
                    {monedaSeleccionada === m.codigo && (
                      <Check className="w-3.5 h-3.5 text-emerald-400 ml-auto shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* ── PASO 3: Selector de objetivo ── */}
            {pasoActual.esObjetivo && (
              <div className="space-y-2 mb-5">
                {OBJETIVOS.map((obj) => (
                  <button
                    key={obj.key}
                    onClick={() => setObjetivoSeleccionado(obj.label)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-150 ${
                      objetivoSeleccionado === obj.label
                        ? 'bg-orange-500/20 border-orange-500/50 ring-1 ring-orange-500/50'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <span className="text-2xl">{obj.emoji}</span>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-white">{obj.label}</p>
                      <p className="text-xs text-gray-400">{obj.desc}</p>
                    </div>
                    {objetivoSeleccionado === obj.label && (
                      <Check className="w-4 h-4 text-orange-400 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* ── PASO 4: Acciones rápidas ── */}
            {pasoActual.acciones && (
              <div className="space-y-2 mb-5">
                {pasoActual.acciones.map((acc) => (
                  <button
                    key={acc.key}
                    onClick={() => handleAccionRapida(acc.key)}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-150 group"
                  >
                    <span className="text-sm font-medium text-gray-200">{acc.label}</span>
                    <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
                  </button>
                ))}
              </div>
            )}

            {/* ── Botón de acción principal ── */}
            {!esUltimoPaso ? (
              <button
                onClick={avanzar}
                className={`w-full py-3 rounded-2xl font-bold text-white bg-gradient-to-r ${pasoActual.color} hover:opacity-90 active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 shadow-lg`}
              >
                Continuar <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={guardarYCerrar}
                className="w-full py-3 rounded-2xl font-bold text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:opacity-90 active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 shadow-lg"
              >
                ¡Empezar ahora! <Sparkles className="w-4 h-4" />
              </button>
            )}

            {/* Skip link */}
            {!esUltimoPaso && (
              <button
                onClick={guardarYCerrar}
                className="w-full text-center text-xs text-gray-500 hover:text-gray-400 mt-3 py-1 transition-colors"
              >
                Omitir configuración
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
