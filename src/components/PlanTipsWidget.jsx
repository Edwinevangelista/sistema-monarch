// ============================================================
// PLAN TIPS WIDGET
// Muestra tips dinámicos y acciones concretas cuando hay
// un plan activo, basados en la situación financiera real.
// ============================================================
import React, { useState, useMemo } from 'react'
import { Lightbulb, ChevronRight, ChevronDown, Zap, Target, AlertTriangle, TrendingDown, Calendar } from 'lucide-react'
import { calcularPagoMinimo, calcularProximoCorte } from '../utils/tarjetasCalculos'

const DIAS_MS = 1000 * 60 * 60 * 24

const diasHasta = (fecha) => {
  if (!fecha) return null
  const hoy = new Date(); hoy.setHours(0,0,0,0)
  const f = new Date(fecha); f.setHours(0,0,0,0)
  return Math.round((f - hoy) / DIAS_MS)
}

const fmt = (n) =>
  `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

export default function PlanTipsWidget({
  activePlan,
  deudas = [],
  gastos = [],
  ingresos = [],
  onOpenPlan,
  onRegisterPayment,
}) {
  const [expanded, setExpanded] = useState(false)

  // ── Métricas del plan (memoizadas para evitar re-render loops) ──────
  const planData = useMemo(() => {
    const config = activePlan?.configuracion
    const orderedDebts = config?.plan?.orderedDebts || []
    const targetDebt = orderedDebts[0] || null
    const montoPago = config?.monthlyPayment || 0
    const totalOriginal = orderedDebts.reduce((s, d) => s + Number(d.balance || d.saldo || 0), 0)
    return { config, orderedDebts, targetDebt, montoPago, totalOriginal }
  }, [activePlan])

  const { orderedDebts, targetDebt, montoPago, totalOriginal } = planData

  // Deuda objetivo en tiempo real
  const deudaRealTarget = useMemo(() => {
    if (!targetDebt) return null
    return deudas.find(d => d.id === targetDebt.id || d.cuenta === targetDebt.nombre) || null
  }, [targetDebt, deudas])

  // Progreso total del plan (real vs original)
  const { totalReal, progresoPlan } = useMemo(() => {
    const tReal = orderedDebts.reduce((s, d) => {
      const dr = deudas.find(x => x.id === d.id || x.cuenta === d.nombre)
      return s + Number(dr?.saldo ?? d.balance ?? d.saldo ?? 0)
    }, 0)
    const pagado = Math.max(0, totalOriginal - tReal)
    const prog = totalOriginal > 0 ? Math.min(100, (pagado / totalOriginal) * 100) : 0
    return { totalReal: tReal, totalPagado: pagado, progresoPlan: prog }
  }, [orderedDebts, deudas, totalOriginal])

  const totalPagado = Math.max(0, totalOriginal - totalReal)

  // Días activo el plan
  const diasActivo = useMemo(() => {
    if (!activePlan?.created_at) return 0
    return Math.round((Date.now() - new Date(activePlan.created_at).getTime()) / DIAS_MS)
  }, [activePlan])

  // Ingresos/gastos del mes actual (memoizados con año+mes como key)
  const mesKey = useMemo(() => {
    const hoy = new Date()
    return `${hoy.getFullYear()}-${hoy.getMonth()}`
  }, [])

  const { ingMes, gstMes } = useMemo(() => {
    const [year, month] = mesKey.split('-').map(Number)
    const ing = ingresos
      .filter(i => { const f = new Date(i.fecha); return f.getFullYear() === year && f.getMonth() === month })
      .reduce((s, i) => s + Number(i.monto || 0), 0)
    const gst = gastos
      .filter(g => { const f = new Date(g.fecha); return f.getFullYear() === year && f.getMonth() === month })
      .reduce((s, g) => s + Number(g.monto || 0), 0)
    return { ingMes: ing, gstMes: gst }
  }, [ingresos, gastos, mesKey])

  const balance = ingMes - gstMes
  const tasaAhorro = ingMes > 0 ? (balance / ingMes) * 100 : 0

  // Categoría top de gasto este mes
  const topCat = useMemo(() => {
    const [year, month] = mesKey.split('-').map(Number)
    const acc = {}
    gastos.forEach(g => {
      const f = new Date(g.fecha)
      if (f.getFullYear() === year && f.getMonth() === month) {
        const cat = (g.categoria || 'Otros').replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}]/gu, '').trim()
        acc[cat] = (acc[cat] || 0) + Number(g.monto || 0)
      }
    })
    const sorted = Object.entries(acc).sort((a, b) => b[1] - a[1])
    return sorted[0] || null
  }, [gastos, mesKey])

  // Deuda con corte más próximo
  const deudaProximaCorte = useMemo(() => {
    return deudas
      .filter(d => Number(d.saldo || 0) > 0 && d.vence)
      .map(d => {
        const proximoCorte = calcularProximoCorte(d.vence)
        return { ...d, diasCorte: diasHasta(proximoCorte) }
      })
      .sort((a, b) => (a.diasCorte ?? 999) - (b.diasCorte ?? 999))[0] || null
  }, [deudas])

  // ── Tips dinámicos ────────────────────────────────────────
  const tips = useMemo(() => {
    const list = []
    const saldoTarget = deudaRealTarget
      ? Number(deudaRealTarget.saldo || 0)
      : Number(targetDebt?.saldo || targetDebt?.balance || 0)

    // TIP 1: Deuda objetivo
    if (targetDebt && saldoTarget > 0) {
      const pagoMin = calcularPagoMinimo(saldoTarget, deudaRealTarget?.apr)
      list.push({
        icon: Target,
        color: 'text-purple-400',
        bg: 'bg-purple-500/10',
        border: 'border-purple-500/20',
        titulo: `Esta semana: ataca "${targetDebt.nombre || 'tu deuda principal'}"`,
        detalle: `Te quedan ${fmt(saldoTarget)} · Pago mínimo este mes: ${fmt(pagoMin)}`,
        accion: onRegisterPayment ? 'Registrar pago ahora' : null,
        onAccion: onRegisterPayment,
        urgente: false,
      })
    }

    // TIP 2: Corte próximo urgente
    if (deudaProximaCorte && deudaProximaCorte.diasCorte !== null && deudaProximaCorte.diasCorte <= 7) {
      const pagoMin = calcularPagoMinimo(deudaProximaCorte.saldo, deudaProximaCorte.apr)
      const urgente = deudaProximaCorte.diasCorte <= 3
      list.push({
        icon: Calendar,
        color: urgente ? 'text-red-400' : 'text-orange-400',
        bg: urgente ? 'bg-red-500/10' : 'bg-orange-500/10',
        border: urgente ? 'border-red-500/20' : 'border-orange-500/20',
        titulo: urgente
          ? `Corte en ${deudaProximaCorte.diasCorte}d: ${deudaProximaCorte.cuenta}`
          : `Corte próximo: ${deudaProximaCorte.cuenta}`,
        detalle: `Paga mínimo ${fmt(pagoMin)} antes del corte para evitar intereses`,
        accion: onRegisterPayment ? 'Pagar ahora' : null,
        onAccion: onRegisterPayment,
        urgente,
      })
    }

    // TIP 3: Tasa de ahorro baja
    if (tasaAhorro < 15 && ingMes > 0) {
      const metaExtra = Math.round(ingMes * 0.05)
      list.push({
        icon: TrendingDown,
        color: 'text-yellow-400',
        bg: 'bg-yellow-500/10',
        border: 'border-yellow-500/20',
        titulo: 'Tasa de ahorro baja este mes',
        detalle: `Ahorras ${tasaAhorro.toFixed(0)}%. Reducir ${fmt(metaExtra)}/mes acelera tu plan.`,
        urgente: false,
      })
    }

    // TIP 4: Categoría de gasto alta
    if (topCat && ingMes > 0 && topCat[1] > ingMes * 0.25) {
      list.push({
        icon: AlertTriangle,
        color: 'text-amber-400',
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/20',
        titulo: `${topCat[0]} consume el ${((topCat[1]/ingMes)*100).toFixed(0)}% de ingresos`,
        detalle: `${fmt(topCat[1])} este mes en esta categoría. Considera reducirla.`,
        urgente: false,
      })
    }

    // TIP 5: Motivación por progreso
    if (diasActivo >= 30 && progresoPlan > 0) {
      list.push({
        icon: Zap,
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/20',
        titulo: `${diasActivo} días en tu plan · ${progresoPlan.toFixed(0)}% completado`,
        detalle: `Has pagado ${fmt(totalPagado)} de ${fmt(totalOriginal)}. ¡Sigue así!`,
        urgente: false,
      })
    }

    // TIP 6: Balance positivo — pago extra
    if (balance > 0 && montoPago > 0 && balance > montoPago * 0.3) {
      list.push({
        icon: Zap,
        color: 'text-blue-400',
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/20',
        titulo: 'Tienes margen para un pago extra',
        detalle: `Balance disponible ${fmt(balance)}. Un pago extra reduce intereses.`,
        accion: onRegisterPayment ? 'Hacer pago extra' : null,
        onAccion: onRegisterPayment,
        urgente: false,
      })
    }

    return list.sort((a, b) => (b.urgente ? 1 : 0) - (a.urgente ? 1 : 0)).slice(0, 4)
  }, [targetDebt, deudaRealTarget, deudaProximaCorte, tasaAhorro, ingMes, topCat, diasActivo, progresoPlan, totalPagado, totalOriginal, balance, montoPago, onRegisterPayment])

  if (!activePlan || tips.length === 0) return null

  const tipsVisibles = expanded ? tips : tips.slice(0, 2)

  return (
    <div className="rounded-2xl overflow-hidden border border-white/8 mb-3"
      style={{ background: 'linear-gradient(135deg, rgba(12,17,36,0.95) 0%, rgba(20,14,40,0.95) 100%)' }}
    >
      {/* Header */}
      <button
        className="w-full flex items-center justify-between px-4 py-3 touch-manipulation"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-xl bg-indigo-500/20 border border-indigo-500/20">
            <Lightbulb className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-left">
            <p className="text-[12px] font-black text-white">
              Tu plan va {progresoPlan >= 50 ? 'muy bien 🔥' : progresoPlan >= 20 ? 'por buen camino' : 'empezando'}
            </p>
            <p className="text-[10px] text-gray-500">
              {progresoPlan.toFixed(0)}% pagado · {tips.length} {tips.length === 1 ? 'acción' : 'acciones'} recomendadas
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Anillo de progreso */}
          <div className="relative w-8 h-8">
            <svg viewBox="0 0 32 32" className="w-full h-full -rotate-90">
              <circle cx="16" cy="16" r="12" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="3"/>
              <circle cx="16" cy="16" r="12" fill="none" stroke="#6366f1" strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${(progresoPlan/100) * 2 * Math.PI * 12} ${2 * Math.PI * 12}`}
                style={{ transition: 'stroke-dasharray 0.8s ease' }}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[8px] font-black text-white">
              {progresoPlan.toFixed(0)}
            </span>
          </div>
          {expanded
            ? <ChevronDown className="w-4 h-4 text-gray-500" />
            : <ChevronRight className="w-4 h-4 text-gray-500" />
          }
        </div>
      </button>

      {/* Tips */}
      <div className="px-3 pb-3 space-y-2">
        {tipsVisibles.map((tip, i) => {
          const Icon = tip.icon
          return (
            <div key={i}
              className={`flex items-start gap-3 p-3 rounded-xl border ${tip.bg} ${tip.border} transition-all`}
            >
              <div className="p-1.5 rounded-lg bg-black/20 flex-shrink-0 mt-0.5">
                <Icon className={`w-3.5 h-3.5 ${tip.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-[12px] font-bold ${tip.urgente ? tip.color : 'text-white'} leading-tight`}>
                  {tip.titulo}
                </p>
                <p className="text-[10px] text-gray-500 mt-0.5 leading-snug">
                  {tip.detalle}
                </p>
                {tip.accion && tip.onAccion && (
                  <button
                    onClick={(e) => { e.stopPropagation(); tip.onAccion() }}
                    className={`mt-1.5 text-[10px] font-bold ${tip.color} flex items-center gap-1 active:opacity-70 touch-manipulation`}
                  >
                    {tip.accion} <ChevronRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          )
        })}

        {/* Mostrar más / menos */}
        {tips.length > 2 && (
          <button
            onClick={() => setExpanded(e => !e)}
            className="w-full text-[10px] text-gray-600 hover:text-gray-400 transition-colors py-1 touch-manipulation"
          >
            {expanded ? 'Ver menos' : `+${tips.length - 2} consejos más`}
          </button>
        )}

        {/* CTA ver plan completo */}
        {onOpenPlan && (
          <button
            onClick={onOpenPlan}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-indigo-600/20 border border-indigo-500/20 text-indigo-400 text-[11px] font-bold hover:bg-indigo-600/30 active:scale-[0.98] transition-all touch-manipulation mt-1"
          >
            <Target className="w-3.5 h-3.5" />
            Ver plan completo
          </button>
        )}
      </div>
    </div>
  )
}
