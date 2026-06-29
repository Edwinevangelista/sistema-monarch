// OnboardingModal.jsx — 5-step onboarding for new users
// Props: onClose (required), onAccionRapida (optional), onComplete (alias for onClose)
import { useState, useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import {
  DollarSign,
  Target,
  CreditCard,
  PiggyBank,
  Home,
  Rocket,
  Check,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react'

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const QUICK_AMOUNTS = [500, 1000, 2000, 3000, 5000]
const FREQUENCIES = [
  { key: 'mensual', label: 'Mensual', multiplier: 1 },
  { key: 'quincenal', label: 'Quincenal', multiplier: 2 },
  { key: 'semanal', label: 'Semanal', multiplier: 4.33 },
]

const OBJECTIVES = [
  {
    key: 'deudas',
    emoji: '💳',
    label: 'Salir de deudas',
    desc: 'Pagar lo que debo y quedar libre',
    Icon: CreditCard,
    consejo: 'Empieza listando tus deudas de mayor a menor interés. Paga primero la más cara.',
    modoIA: 'pagar_deudas',
  },
  {
    key: 'ahorro',
    emoji: '🐷',
    label: 'Ahorrar más',
    desc: 'Construir mi fondo de emergencia',
    Icon: PiggyBank,
    consejo: 'Intenta ahorrar al menos el 10% de lo que ganas. Sepáralo apenas recibas tu pago.',
    modoIA: 'ahorrar_mas',
  },
  {
    key: 'gastos',
    emoji: '📊',
    label: 'Controlar mis gastos',
    desc: 'Saber exactamente en qué gasto',
    Icon: Target,
    consejo: 'Registra cada gasto por 7 días. Verás patrones que no sabías que tenías.',
    modoIA: 'controlar_gastos',
  },
  {
    key: 'meta',
    emoji: '🏠',
    label: 'Ahorrar para algo grande',
    desc: 'Casa, carro, viaje u otra meta',
    Icon: Home,
    consejo: 'Define el monto exacto que necesitas y ponle fecha. Así sabrás cuánto guardar por mes.',
    modoIA: 'meta_grande',
  },
]

const PASO_COLORS = [
  { gradient: 'from-blue-600 to-indigo-600', accent: 'text-blue-400', ring: 'ring-blue-500/40', tag: 'blue' },
  { gradient: 'from-emerald-600 to-teal-600', accent: 'text-emerald-400', ring: 'ring-emerald-500/40', tag: 'emerald' },
  { gradient: 'from-orange-600 to-amber-600', accent: 'text-orange-400', ring: 'ring-orange-500/40', tag: 'orange' },
  { gradient: 'from-purple-600 to-violet-600', accent: 'text-purple-400', ring: 'ring-purple-500/40', tag: 'purple' },
  { gradient: 'from-emerald-600 to-green-600', accent: 'text-emerald-400', ring: 'ring-emerald-500/40', tag: 'emerald' },
]

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function parseMonto(val) {
  const n = parseFloat(String(val).replace(/[^0-9.]/g, ''))
  return isNaN(n) ? 0 : n
}

function formatMonto(n) {
  if (!n) return ''
  return n.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

// ─── SUB-COMPONENTS ──────────────────────────────────────────────────────────

function ProgressBar({ current, total }) {
  return (
    <div className="flex gap-1.5 px-5 pt-4">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`flex-1 h-1 rounded-full transition-all duration-500 ${
            i <= current ? 'bg-white' : 'bg-white/15'
          }`}
        />
      ))}
    </div>
  )
}

function StepLabel({ current, total }) {
  return (
    <p className="text-[10px] text-gray-500 font-semibold tracking-widest uppercase mt-2 px-5">
      Paso {current + 1} de {total}
    </p>
  )
}

// ─── PASO 1: BIENVENIDA ───────────────────────────────────────────────────────

function PasoBienvenida() {
  return (
    <div className="flex flex-col flex-1">
      <div className="text-5xl mb-4 select-none">🎉</div>
      <h2 className="text-2xl font-black text-white mb-1 leading-tight">
        ¡Hola! Soy <span className="text-blue-400">FinGuide</span>
      </h2>
      <p className="text-sm text-gray-400 mb-6 leading-relaxed">
        Tu app para saber exactamente a dónde va tu dinero
      </p>
      <div className="space-y-2.5">
        {[
          { emoji: '💰', text: 'Ve cuánto tienes disponible hoy' },
          { emoji: '📅', text: 'Nunca olvides un pago importante' },
          { emoji: '🎯', text: 'Alcanza tus metas de ahorro' },
        ].map(({ emoji, text }) => (
          <div
            key={text}
            className="flex items-center gap-3 p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20"
          >
            <span className="text-xl select-none">{emoji}</span>
            <span className="text-sm text-gray-200 font-medium">{text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── PASO 2: INGRESOS ─────────────────────────────────────────────────────────

function PasoIngresos({ ingresos, setIngresos, frecuencia, setFrecuencia }) {
  const handleQuick = useCallback(
    (amt) => setIngresos(amt === 5000 ? '5000' : String(amt)),
    [setIngresos]
  )

  return (
    <div className="flex flex-col flex-1">
      <h2 className="text-xl font-black text-white mb-1 leading-tight">
        ¿Cuánto ganas al mes?
      </h2>
      <p className="text-xs text-gray-500 mb-4 leading-relaxed">
        No compartimos este dato con nadie. Solo lo usamos para calcular tu presupuesto.
      </p>

      {/* Input grande */}
      <div className="relative mb-3">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-black text-emerald-400 pointer-events-none select-none">
          $
        </span>
        <input
          type="number"
          inputMode="numeric"
          min="0"
          placeholder="0"
          value={ingresos}
          onChange={(e) => setIngresos(e.target.value)}
          className="w-full pl-10 pr-4 py-4 text-2xl font-black text-white rounded-2xl bg-white/8 border border-white/15 focus:border-emerald-500/60 focus:bg-white/10 outline-none transition-all placeholder-gray-600"
        />
      </div>

      {/* Quick picks */}
      <div className="flex gap-2 flex-wrap mb-4">
        {QUICK_AMOUNTS.map((amt) => {
          const label = amt === 5000 ? '$5,000+' : `$${formatMonto(amt)}`
          const active = String(amt) === ingresos
          return (
            <button
              key={amt}
              onClick={() => handleQuick(amt)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all duration-100 touch-manipulation active:scale-95 ${
                active
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                  : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* Frecuencia */}
      <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2">
        ¿Con qué frecuencia cobras?
      </p>
      <div className="flex gap-2 mb-4">
        {FREQUENCIES.map((f) => (
          <button
            key={f.key}
            onClick={() => setFrecuencia(f.key)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all duration-100 touch-manipulation active:scale-95 ${
              frecuencia === f.key
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {ingresos && Number(ingresos) > 0 && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mt-auto">
          <p className="text-xs text-emerald-300 leading-relaxed">
            ✨ Con esta info te diremos cuánto puedes gastar <strong>cada día</strong> sin preocuparte
          </p>
        </div>
      )}
    </div>
  )
}

// ─── PASO 3: OBJETIVO ─────────────────────────────────────────────────────────

function PasoObjetivo({ objetivo, setObjetivo }) {
  return (
    <div className="flex flex-col flex-1">
      <h2 className="text-xl font-black text-white mb-1 leading-tight">
        ¿Qué quieres lograr?
      </h2>
      <p className="text-xs text-gray-500 mb-4 leading-relaxed">
        Esto personaliza los consejos y herramientas que te mostramos.
      </p>
      <div className="space-y-2.5 flex-1">
        {OBJECTIVES.map((obj) => {
          const selected = objetivo === obj.key
          return (
            <button
              key={obj.key}
              onClick={() => setObjetivo(obj.key)}
              className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all duration-100 active:scale-[0.98] touch-manipulation ${
                selected
                  ? 'bg-orange-500/15 border-orange-500/40'
                  : 'bg-white/4 border-white/8 hover:bg-white/8'
              }`}
            >
              <span className="text-2xl select-none shrink-0">{obj.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white">{obj.label}</p>
                <p className="text-xs text-gray-400 leading-snug">{obj.desc}</p>
              </div>
              {selected && <Check className="w-4 h-4 text-orange-400 shrink-0" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── PASO 4: COMPROMISOS FIJOS ────────────────────────────────────────────────

function PasoCompromisos({ nivel, setNivel, totalFijos, setTotalFijos }) {
  const OPCIONES = [
    { key: 'varios', label: 'Sí, tengo varios', desc: 'Renta, luz, internet, préstamos...' },
    { key: 'pocos', label: 'Tengo pocos', desc: 'Solo uno o dos pagos fijos' },
    { key: 'ninguno', label: 'Ninguno por ahora', desc: 'Todo mis gastos son variables' },
  ]

  return (
    <div className="flex flex-col flex-1">
      <h2 className="text-xl font-black text-white mb-1 leading-tight">
        ¿Tienes pagos fijos cada mes?
      </h2>
      <p className="text-xs text-gray-500 mb-4 leading-relaxed">
        Como renta, luz, internet, préstamos...
      </p>

      <div className="space-y-2 mb-4">
        {OPCIONES.map((op) => {
          const selected = nivel === op.key
          return (
            <button
              key={op.key}
              onClick={() => {
                setNivel(op.key)
                if (op.key === 'ninguno') setTotalFijos('')
              }}
              className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all duration-100 active:scale-[0.98] touch-manipulation ${
                selected
                  ? 'bg-purple-500/15 border-purple-500/40'
                  : 'bg-white/4 border-white/8 hover:bg-white/8'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${
                  selected ? 'border-purple-400 bg-purple-500' : 'border-gray-600'
                }`}
              >
                {selected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-white">{op.label}</p>
                <p className="text-xs text-gray-500">{op.desc}</p>
              </div>
            </button>
          )
        })}
      </div>

      {(nivel === 'varios' || nivel === 'pocos') && (
        <div className="mt-auto">
          <p className="text-xs text-gray-400 font-semibold mb-2">
            ¿Cuánto suman aproximadamente?
          </p>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-black text-purple-400 pointer-events-none select-none">
              $
            </span>
            <input
              type="number"
              inputMode="numeric"
              min="0"
              placeholder="0"
              value={totalFijos}
              onChange={(e) => setTotalFijos(e.target.value)}
              className="w-full pl-10 pr-4 py-3.5 text-xl font-black text-white rounded-2xl bg-white/8 border border-white/15 focus:border-purple-500/60 focus:bg-white/10 outline-none transition-all placeholder-gray-600"
            />
          </div>
          <p className="text-[10px] text-gray-600 mt-2 leading-relaxed">
            Los ingresarás uno por uno después. Esto es solo para empezar.
          </p>
        </div>
      )}
    </div>
  )
}

// ─── PASO 5: RESUMEN ──────────────────────────────────────────────────────────

function PasoListo({ ingresos, frecuencia, objetivo, totalFijos, onAccionRapida }) {
  // Normalize income to monthly
  const freq = FREQUENCIES.find((f) => f.key === frecuencia) || FREQUENCIES[0]
  const ingresosMensuales = parseMonto(ingresos) * freq.multiplier
  const compromisos = parseMonto(totalFijos)
  const disponible = Math.max(0, ingresosMensuales - compromisos)
  const diario = Number((disponible / 30).toFixed(2))

  const obj = OBJECTIVES.find((o) => o.key === objetivo)

  const QUICK_ACTIONS = [
    { key: 'cuenta', label: '🏦 Agregar mi cuenta o efectivo' },
    { key: 'ingreso', label: '➕ Registrar mi primer ingreso' },
    { key: 'gasto', label: '💸 Registrar un gasto de hoy' },
  ]

  return (
    <div className="flex flex-col flex-1">
      <div className="text-4xl mb-3 select-none">🚀</div>
      <h2 className="text-xl font-black text-white mb-4 leading-tight">
        ¡Tu perfil está listo!
      </h2>

      {/* Resumen personalizado */}
      <div className="space-y-2 mb-4">
        {ingresosMensuales > 0 && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-gray-300 font-medium">Ingresos</span>
            </div>
            <span className="text-sm font-black text-white">
              ${formatMonto(ingresosMensuales)}/mes
            </span>
          </div>
        )}
        {diario > 0 && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <div className="flex items-center gap-2">
              <Rocket className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-gray-300 font-medium">Presupuesto diario</span>
            </div>
            <span className="text-sm font-black text-white">
              ${formatMonto(diario)}/día
            </span>
          </div>
        )}
        {obj && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-orange-400" />
              <span className="text-xs text-gray-300 font-medium">Tu meta</span>
            </div>
            <span className="text-sm font-black text-white">{obj.label}</span>
          </div>
        )}
      </div>

      {/* Consejo personalizado */}
      {obj && (
        <div className="p-3 rounded-xl bg-white/5 border border-white/10 mb-4">
          <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider mb-1">
            Consejo para ti
          </p>
          <p className="text-xs text-gray-300 leading-relaxed">{obj.consejo}</p>
        </div>
      )}

      {/* Acciones rápidas */}
      {onAccionRapida && (
        <div className="mt-auto space-y-2">
          <p className="text-[10px] text-gray-600 font-semibold uppercase tracking-widest mb-1">
            Tu primer paso
          </p>
          {QUICK_ACTIONS.map((acc) => (
            <button
              key={acc.key}
              onClick={() => onAccionRapida(acc.key)}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 active:scale-[0.98] transition-all duration-100 touch-manipulation group"
            >
              <span className="text-sm font-semibold text-gray-200">{acc.label}</span>
              <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function OnboardingModal({
  onClose,
  onComplete,          // alias for onClose (backward compat)
  onAccionRapida,
  preferencias,        // optional — not used internally but accepted
  setPreferencias,     // optional — not used internally but accepted
}) {
  const handleClose = useMemo(() => onClose || onComplete || (() => {}), [onClose, onComplete])

  const [paso, setPaso] = useState(0)
  const [animando, setAnimando] = useState(false)
  const [dir, setDir] = useState(1) // 1 = forward, -1 = backward

  // Step data
  const [ingresos, setIngresos] = useState('')
  const [frecuencia, setFrecuencia] = useState('mensual')
  const [objetivo, setObjetivo] = useState(null)
  const [nivelFijos, setNivelFijos] = useState(null)
  const [totalFijos, setTotalFijos] = useState('')

  const TOTAL_PASOS = 5
  const esUltimo = paso === TOTAL_PASOS - 1
  const color = PASO_COLORS[paso]

  // Transition helper
  const irA = useCallback(
    (siguiente, direction = 1) => {
      if (animando) return
      setDir(direction)
      setAnimando(true)
      setTimeout(() => {
        setPaso(siguiente)
        setAnimando(false)
      }, 200)
    },
    [animando]
  )

  const avanzar = () => {
    if (paso < TOTAL_PASOS - 1) irA(paso + 1, 1)
  }

  const retroceder = () => {
    if (paso > 0) irA(paso - 1, -1)
  }

  // Persist and close
  const guardarYCerrar = useCallback(() => {
    try {
      const existing = JSON.parse(localStorage.getItem('preferenciasUsuario') || '{}')

      const freq = FREQUENCIES.find((f) => f.key === frecuencia) || FREQUENCIES[0]
      const ingresosMensuales = parseMonto(ingresos) * freq.multiplier
      const obj = OBJECTIVES.find((o) => o.key === objetivo)

      existing.ingresosEstimados = ingresosMensuales || existing.ingresosEstimados
      existing.frecuenciaIngreso = frecuencia
      existing.objetivo = objetivo || existing.objetivo
      existing.compromisosMensualesEstimados = parseMonto(totalFijos) || existing.compromisosMensualesEstimados

      if (obj?.modoIA) {
        existing.modoIA = obj.modoIA
        localStorage.setItem('finGuideObjetivo', obj.modoIA)
      }

      localStorage.setItem('preferenciasUsuario', JSON.stringify(existing))

      // Also sync to setPreferencias if provided
      if (setPreferencias) setPreferencias(existing)
    } catch (_) { /* non-fatal */ }

    localStorage.setItem('onboarding_completado', '1')
    toast.success('¡Bienvenido a FinGuide! 🎉')
    handleClose()
  }, [ingresos, frecuencia, objetivo, totalFijos, handleClose, setPreferencias])

  const handleAccionRapida = useCallback(
    (key) => {
      guardarYCerrar()
      if (onAccionRapida) onAccionRapida(key)
    },
    [guardarYCerrar, onAccionRapida]
  )

  // Translate animation
  const translateClass = animando
    ? dir === 1
      ? '-translate-x-4 opacity-0'
      : 'translate-x-4 opacity-0'
    : 'translate-x-0 opacity-100'

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-md z-[99999] animate-in fade-in duration-300"
        onClick={esUltimo ? guardarYCerrar : undefined}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[100000] flex items-end md:items-center justify-center p-0 md:p-4 pointer-events-none">
        <div
          className="w-full md:max-w-md pointer-events-auto overflow-hidden rounded-t-3xl md:rounded-3xl animate-in fade-in slide-in-from-bottom-4 md:zoom-in-95 duration-300"
          style={{
            background: 'linear-gradient(160deg, rgba(15,23,42,0.99) 0%, rgba(17,24,39,0.97) 100%)',
            backdropFilter: 'blur(40px)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 -20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05) inset',
            maxHeight: '92dvh',
          }}
        >
          {/* Mobile drag handle */}
          <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mt-3 md:hidden" />

          {/* Progress bar */}
          <ProgressBar current={paso} total={TOTAL_PASOS} />
          <StepLabel current={paso} total={TOTAL_PASOS} />

          {/* Step content — animated */}
          <div
            className={`px-5 pt-4 pb-2 flex flex-col transition-all duration-200 ease-out ${translateClass}`}
            style={{ minHeight: 340, maxHeight: 'calc(92dvh - 80px)', overflow: 'hidden auto' }}
          >
            {paso === 0 && <PasoBienvenida />}
            {paso === 1 && (
              <PasoIngresos
                ingresos={ingresos}
                setIngresos={setIngresos}
                frecuencia={frecuencia}
                setFrecuencia={setFrecuencia}
              />
            )}
            {paso === 2 && (
              <PasoObjetivo objetivo={objetivo} setObjetivo={setObjetivo} />
            )}
            {paso === 3 && (
              <PasoCompromisos
                nivel={nivelFijos}
                setNivel={setNivelFijos}
                totalFijos={totalFijos}
                setTotalFijos={setTotalFijos}
              />
            )}
            {paso === 4 && (
              <PasoListo
                ingresos={ingresos}
                frecuencia={frecuencia}
                objetivo={objetivo}
                totalFijos={totalFijos}
                onAccionRapida={onAccionRapida ? handleAccionRapida : null}
              />
            )}
          </div>

          {/* Navigation buttons */}
          <div
            className="px-5 pb-5 pt-3 flex flex-col gap-2 shrink-0"
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 20px), 20px)' }}
          >
            {esUltimo ? (
              <button
                onClick={guardarYCerrar}
                className={`w-full py-3.5 rounded-2xl font-black text-white bg-gradient-to-r ${color.gradient} hover:opacity-90 active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 shadow-lg text-sm`}
              >
                <Rocket className="w-4 h-4" />
                Ir al Dashboard →
              </button>
            ) : (
              <button
                onClick={avanzar}
                className={`w-full py-3.5 rounded-2xl font-black text-white bg-gradient-to-r ${color.gradient} hover:opacity-90 active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 shadow-lg text-sm`}
              >
                {paso === 0 ? 'Empezar →' : 'Continuar →'}
              </button>
            )}

            <div className="flex gap-2">
              {paso > 0 && (
                <button
                  onClick={retroceder}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 active:scale-[0.98] transition-all duration-100 touch-manipulation flex items-center justify-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Atrás
                </button>
              )}
              {!esUltimo && (
                <button
                  onClick={guardarYCerrar}
                  className="flex-1 py-2.5 rounded-xl text-sm text-gray-600 hover:text-gray-400 transition-colors touch-manipulation"
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
