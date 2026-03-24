// OnboardingModal.jsx — Solo primera vez real + más monedas + guarda modo
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

// ─── PASOS ───────────────────────────────────────────────────────────────────
const PASOS = [
  {
    id: 'bienvenida',
    titulo: '¡Bienvenido a FinGuide!',
    emoji: '🎉',
    subtitulo: 'Tu asistente financiero personal',
    descripcion: 'Toma el control de tus finanzas. Registra ingresos, gastos, deudas y suscripciones — todo en un solo lugar.',
    color: 'from-blue-600 to-purple-600',
    accentColor: 'text-blue-400',
    bgAccent: 'bg-blue-500/10 border-blue-500/20',
    icono: Wallet,
    features: [
      { icono: TrendingUp, texto: 'Balance en tiempo real' },
      { icono: BarChart3, texto: 'Gráficas inteligentes' },
      { icono: Target, texto: 'Metas de ahorro personalizadas' },
    ],
  },
  {
    id: 'moneda',
    titulo: '¿Con qué moneda trabajas?',
    emoji: '💱',
    subtitulo: 'Configura tu moneda principal',
    descripcion: 'Elige tu país y moneda. La app se adapta completamente a tu configuración.',
    color: 'from-emerald-600 to-teal-600',
    accentColor: 'text-emerald-400',
    bgAccent: 'bg-emerald-500/10 border-emerald-500/20',
    icono: DollarSign,
    esConfiguracion: true,
  },
  {
    id: 'objetivo',
    titulo: '¿Cuál es tu meta principal?',
    emoji: '🎯',
    subtitulo: 'Personaliza tu experiencia',
    descripcion: 'Saber tu objetivo nos ayuda a mostrarte las herramientas y consejos más útiles para ti.',
    color: 'from-orange-600 to-pink-600',
    accentColor: 'text-orange-400',
    bgAccent: 'bg-orange-500/10 border-orange-500/20',
    icono: PiggyBank,
    esObjetivo: true,
  },
  {
    id: 'listo',
    titulo: '¡Todo configurado!',
    emoji: '🚀',
    subtitulo: 'Estás listo para empezar',
    descripcion: 'Empieza registrando tu primer ingreso o conectando tu cuenta bancaria. ¡El control financiero comienza hoy!',
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

// ─── MONEDAS — Latinoamérica + mundo ─────────────────────────────────────────
const MONEDAS = [
  // Latinoamérica
  { codigo: 'DOP', simbolo: 'RD$', nombre: 'Peso Dominicano', pais: 'República Dominicana', flag: '🇩🇴' },
  { codigo: 'MXN', simbolo: '$', nombre: 'Peso Mexicano', pais: 'México', flag: '🇲🇽' },
  { codigo: 'COP', simbolo: '$', nombre: 'Peso Colombiano', pais: 'Colombia', flag: '🇨🇴' },
  { codigo: 'ARS', simbolo: '$', nombre: 'Peso Argentino', pais: 'Argentina', flag: '🇦🇷' },
  { codigo: 'CLP', simbolo: '$', nombre: 'Peso Chileno', pais: 'Chile', flag: '🇨🇱' },
  { codigo: 'GTQ', simbolo: 'Q', nombre: 'Quetzal', pais: 'Guatemala', flag: '🇬🇹' },
  { codigo: 'PEN', simbolo: 'S/', nombre: 'Sol', pais: 'Perú', flag: '🇵🇪' },
  { codigo: 'BOB', simbolo: 'Bs', nombre: 'Boliviano', pais: 'Bolivia', flag: '🇧🇴' },
  { codigo: 'PYG', simbolo: '₲', nombre: 'Guaraní', pais: 'Paraguay', flag: '🇵🇾' },
  { codigo: 'UYU', simbolo: '$', nombre: 'Peso Uruguayo', pais: 'Uruguay', flag: '🇺🇾' },
  { codigo: 'HNL', simbolo: 'L', nombre: 'Lempira', pais: 'Honduras', flag: '🇭🇳' },
  { codigo: 'CRC', simbolo: '₡', nombre: 'Colón', pais: 'Costa Rica', flag: '🇨🇷' },
  { codigo: 'VES', simbolo: 'Bs.S', nombre: 'Bolívar', pais: 'Venezuela', flag: '🇻🇪' },
  { codigo: 'BRL', simbolo: 'R$', nombre: 'Real', pais: 'Brasil', flag: '🇧🇷' },
  { codigo: 'PAB', simbolo: 'B/.', nombre: 'Balboa', pais: 'Panamá', flag: '🇵🇦' },
  // Global
  { codigo: 'USD', simbolo: '$', nombre: 'Dólar Estadounidense', pais: 'Estados Unidos', flag: '🇺🇸' },
  { codigo: 'EUR', simbolo: '€', nombre: 'Euro', pais: 'Europa', flag: '🇪🇺' },
  { codigo: 'GBP', simbolo: '£', nombre: 'Libra', pais: 'Reino Unido', flag: '🇬🇧' },
  { codigo: 'CAD', simbolo: 'C$', nombre: 'Dólar Canadiense', pais: 'Canadá', flag: '🇨🇦' },
]

const OBJETIVOS = [
  { key: 'deudas', emoji: '💳', label: 'Salir de deudas', desc: 'Quiero pagar todo lo que debo', modoIA: 'pagar_deudas' },
  { key: 'ahorro', emoji: '🐖', label: 'Ahorrar más', desc: 'Quiero construir mi fondo de emergencia', modoIA: 'ahorrar_mas' },
  { key: 'gastos', emoji: '📉', label: 'Controlar gastos', desc: 'Quiero saber exactamente en qué gasto', modoIA: 'controlar_gastos' },
  { key: 'inversion', emoji: '📈', label: 'Empezar a invertir', desc: 'Quiero hacer crecer mi dinero', modoIA: 'diagnostico' },
]

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
export default function OnboardingModal({ onClose, onAccionRapida }) {
  const [paso, setPaso] = useState(0)
  const [monedaSeleccionada, setMonedaSeleccionada] = useState('USD')
  const [objetivoSeleccionado, setObjetivoSeleccionado] = useState(null)
  const [animando, setAnimando] = useState(false)
  const [busqueda, setBusqueda] = useState('')

  const pasoActual = PASOS[paso]
  const totalPasos = PASOS.length
  const esUltimoPaso = paso === totalPasos - 1

  const monedasFiltradas = MONEDAS.filter(m =>
    busqueda === '' ||
    m.pais.toLowerCase().includes(busqueda.toLowerCase()) ||
    m.codigo.toLowerCase().includes(busqueda.toLowerCase()) ||
    m.nombre.toLowerCase().includes(busqueda.toLowerCase())
  )

  const avanzar = () => {
    if (animando) return
    setAnimando(true)
    setTimeout(() => {
      setPaso((p) => Math.min(p + 1, totalPasos - 1))
      setAnimando(false)
      setBusqueda('')
    }, 180)
  }

  const guardarYCerrar = () => {
    try {
      const preferencias = JSON.parse(localStorage.getItem('preferenciasUsuario') || '{}')
      preferencias.moneda = monedaSeleccionada

      // Guardar moneda elegida con su símbolo
      const monedaData = MONEDAS.find(m => m.codigo === monedaSeleccionada)
      if (monedaData) {
        preferencias.simboloMoneda = monedaData.simbolo
        preferencias.paisMoneda = monedaData.pais
      }

      // Guardar objetivo y modo IA correspondiente
      if (objetivoSeleccionado) {
        const objData = OBJETIVOS.find(o => o.label === objetivoSeleccionado)
        preferencias.objetivo = objetivoSeleccionado
        if (objData?.modoIA) {
          preferencias.modoIA = objData.modoIA
          // Sincronizar con AsistenteFinancieroV2
          localStorage.setItem('finGuideObjetivo', objData.modoIA)
        }
      }

      localStorage.setItem('preferenciasUsuario', JSON.stringify(preferencias))
    } catch (e) { /* no fatal */ }

    localStorage.setItem('onboarding_completado', '1')
    const monedaData = MONEDAS.find(m => m.codigo === monedaSeleccionada)
    toast.success(`¡Bienvenido! Configurado con ${monedaData?.pais || monedaSeleccionada} 🎉`)
    onClose()
  }

  const handleAccionRapida = (key) => {
    guardarYCerrar()
    if (onAccionRapida) onAccionRapida(key)
  }

  const monedaActual = MONEDAS.find(m => m.codigo === monedaSeleccionada)

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-md z-[99999] animate-in fade-in duration-300"
        onClick={esUltimoPaso ? guardarYCerrar : undefined}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[100000] flex items-end md:items-center justify-center p-0 md:p-4 pointer-events-none">
        <div
          className={`
            w-full md:max-w-sm pointer-events-auto overflow-hidden
            rounded-t-3xl md:rounded-3xl
            transition-all duration-180
            ${animando ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}
            animate-in fade-in slide-in-from-bottom-4 md:zoom-in-95 duration-300
          `}
          style={{
            background: 'linear-gradient(160deg, rgba(15,23,42,0.99) 0%, rgba(17,24,39,0.97) 100%)',
            backdropFilter: 'blur(40px)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 -20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05) inset',
            maxHeight: pasoActual.esConfiguracion ? '90dvh' : '85dvh',
          }}
        >
          {/* Pill mobile */}
          <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mt-3 md:hidden" />

          {/* Barra progreso */}
          <div className="flex gap-1.5 px-5 pt-4 pb-0">
            {PASOS.map((_, i) => (
              <div
                key={i}
                className={`flex-1 h-1 rounded-full transition-all duration-500 ${
                  i <= paso ? 'bg-white' : 'bg-white/15'
                }`}
              />
            ))}
          </div>

          {/* Botón cerrar (último paso) */}
          {esUltimoPaso && (
            <button
              onClick={guardarYCerrar}
              className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Contenido */}
          <div className="p-5 pt-4 flex flex-col" style={{ maxHeight: 'calc(90dvh - 32px)', overflow: 'hidden' }}>
            {/* Icono + título */}
            <div className="shrink-0">
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${pasoActual.color} flex items-center justify-center mb-3 shadow-lg`}>
                <pasoActual.icono className="w-6 h-6 text-white" />
              </div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-lg">{pasoActual.emoji}</span>
                <h2 className="text-lg font-black text-white leading-tight">{pasoActual.titulo}</h2>
              </div>
              <p className="text-xs text-gray-400 mb-4 leading-relaxed">{pasoActual.descripcion}</p>
            </div>

            {/* ── PASO 1: Features ── */}
            {pasoActual.features && (
              <div className="space-y-2 mb-5 shrink-0">
                {pasoActual.features.map(({ icono: Ic, texto }) => (
                  <div key={texto} className={`flex items-center gap-3 p-3 rounded-xl border ${pasoActual.bgAccent}`}>
                    <Ic className={`w-4 h-4 ${pasoActual.accentColor} shrink-0`} />
                    <span className="text-sm text-gray-200 font-medium">{texto}</span>
                  </div>
                ))}
              </div>
            )}

            {/* ── PASO 2: Selector de moneda con buscador ── */}
            {pasoActual.esConfiguracion && (
              <div className="flex flex-col flex-1 overflow-hidden mb-4">
                {/* Moneda seleccionada actual */}
                {monedaActual && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 mb-3 shrink-0">
                    <span className="text-xl">{monedaActual.flag}</span>
                    <div>
                      <p className="text-xs font-black text-white">{monedaActual.pais}</p>
                      <p className="text-[10px] text-emerald-400">{monedaActual.simbolo} · {monedaActual.codigo}</p>
                    </div>
                    <Check className="w-4 h-4 text-emerald-400 ml-auto" />
                  </div>
                )}

                {/* Buscador */}
                <input
                  type="text"
                  placeholder="Buscar país o moneda..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/8 border border-white/10 text-sm text-white placeholder-gray-500 mb-2 outline-none focus:border-emerald-500/50 focus:bg-white/10 transition-all shrink-0"
                />

                {/* Lista scrolleable */}
                <div className="overflow-y-auto flex-1" style={{ WebkitOverflowScrolling: 'touch' }}>
                  <div className="grid grid-cols-1 gap-1.5 pb-2">
                    {monedasFiltradas.map((m) => (
                      <button
                        key={m.codigo}
                        onClick={() => setMonedaSeleccionada(m.codigo)}
                        className={`flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all duration-100 touch-manipulation ${
                          monedaSeleccionada === m.codigo
                            ? 'bg-emerald-500/15 border-emerald-500/40'
                            : 'bg-white/4 border-white/8 hover:bg-white/8'
                        }`}
                      >
                        <span className="text-lg shrink-0">{m.flag}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-white truncate">{m.pais}</p>
                          <p className="text-[10px] text-gray-500">{m.simbolo} · {m.codigo}</p>
                        </div>
                        {monedaSeleccionada === m.codigo && (
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── PASO 3: Objetivo ── */}
            {pasoActual.esObjetivo && (
              <div className="space-y-2 mb-4 shrink-0">
                {OBJETIVOS.map((obj) => (
                  <button
                    key={obj.key}
                    onClick={() => setObjetivoSeleccionado(obj.label)}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all duration-100 active:scale-[0.98] touch-manipulation ${
                      objetivoSeleccionado === obj.label
                        ? 'bg-orange-500/15 border-orange-500/40'
                        : 'bg-white/4 border-white/8 hover:bg-white/8'
                    }`}
                  >
                    <span className="text-2xl shrink-0">{obj.emoji}</span>
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
              <div className="space-y-2 mb-4 shrink-0">
                {pasoActual.acciones.map((acc) => (
                  <button
                    key={acc.key}
                    onClick={() => handleAccionRapida(acc.key)}
                    className="w-full flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 active:scale-[0.98] transition-all duration-100 touch-manipulation group"
                  >
                    <span className="text-sm font-semibold text-gray-200">{acc.label}</span>
                    <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>
            )}

            {/* ── Botón principal ── */}
            <div className="shrink-0">
              {!esUltimoPaso ? (
                <button
                  onClick={avanzar}
                  className={`w-full py-3.5 rounded-2xl font-black text-white bg-gradient-to-r ${pasoActual.color} hover:opacity-90 active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 shadow-lg text-sm`}
                >
                  Continuar <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={guardarYCerrar}
                  className="w-full py-3.5 rounded-2xl font-black text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:opacity-90 active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 shadow-lg text-sm"
                >
                  ¡Empezar ahora! <Sparkles className="w-4 h-4" />
                </button>
              )}

              {!esUltimoPaso && (
                <button
                  onClick={guardarYCerrar}
                  className="w-full text-center text-xs text-gray-600 hover:text-gray-400 mt-3 py-1 transition-colors"
                >
                  Omitir por ahora
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
