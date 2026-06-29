// CashFlowForecast.jsx — Proyección de flujo de caja para los próximos 30 días
import { useMemo } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { Calendar, AlertCircle, CheckCircle2 } from 'lucide-react'

const fmt = (n) => {
  const abs = Math.abs(n)
  if (abs >= 1000) return `${n < 0 ? '-' : ''}$${(abs / 1000).toFixed(1)}k`
  return `${n < 0 ? '-' : ''}$${abs.toLocaleString('es', { maximumFractionDigits: 0 })}`
}

function buildForecast({ saldoActual, ingresosMensuales, gastosFijos, suscripciones }) {
  const hoy = new Date()
  const diasEnMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate()
  // Gasto diario estimado (gastos variables = saldo libre / días restantes)
  const compromisosMensuales = gastosFijos + suscripciones
  const gastoFijoDiario = compromisosMensuales / diasEnMes

  let saldo = saldoActual
  const puntos = []

  for (let i = 0; i <= 30; i++) {
    const fecha = new Date(hoy)
    fecha.setDate(hoy.getDate() + i)
    const dia = fecha.getDate()
    const mes = fecha.toLocaleDateString('es', { month: 'short' })

    // Simular ingresos al día 1 o 15 de cada mes
    let entradas = 0
    if (dia === 1 || dia === 15) entradas = ingresosMensuales / 2

    // Salidas fijas distribuidas
    const salidas = gastoFijoDiario

    if (i > 0) {
      saldo = saldo + entradas - salidas
    }

    puntos.push({
      dia: i === 0 ? 'Hoy' : `${dia} ${mes}`,
      saldo: Math.round(saldo),
      entradas: Math.round(entradas),
      salidas: Math.round(salidas),
    })
  }

  return puntos
}

const ForecastTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const saldo = payload[0]?.value
  const pos = saldo >= 0
  return (
    <div className="px-3 py-2 rounded-xl text-xs"
      style={{ background: 'rgba(10,15,30,0.97)', border: '1px solid rgba(255,255,255,0.1)' }}>
      <p className="text-gray-400 mb-1">{label}</p>
      <p className={`font-black text-sm ${pos ? 'text-emerald-400' : 'text-red-400'}`}>{fmt(saldo)}</p>
    </div>
  )
}

export default function CashFlowForecast({
  saldoActual = 0,
  totalIngresos = 0,
  totalGastosFijos = 0,
  totalSuscripciones = 0,
  gastosFijos = [],
  suscripciones = [],
}) {

  const forecast = useMemo(() => buildForecast({
    saldoActual,
    ingresosMensuales: totalIngresos,
    gastosFijos: totalGastosFijos,
    suscripciones: totalSuscripciones,
  }), [saldoActual, totalIngresos, totalGastosFijos, totalSuscripciones])

  const saldoFinal = forecast[forecast.length - 1]?.saldo ?? saldoActual
  const minSaldo = Math.min(...forecast.map(p => p.saldo))
  const hayRiesgo = minSaldo < 0
  const diasNegativos = forecast.filter(p => p.saldo < 0).length

  // Próximos pagos importantes (próximos 14 días)
  const proximos = useMemo(() => {
    const ahora = new Date()
    const items = []
    gastosFijos.forEach(g => {
      if (g.estado === 'Pendiente' && g.fecha_vencimiento) {
        const diff = Math.ceil((new Date(g.fecha_vencimiento) - ahora) / (1000 * 60 * 60 * 24))
        if (diff >= 0 && diff <= 14) items.push({ nombre: g.nombre, monto: g.monto, dias: diff, tipo: 'fijo' })
      }
    })
    suscripciones.forEach(s => {
      if (s.estado === 'Activo' && s.proximo_pago) {
        const diff = Math.ceil((new Date(s.proximo_pago) - ahora) / (1000 * 60 * 60 * 24))
        if (diff >= 0 && diff <= 14) items.push({ nombre: s.servicio, monto: s.costo, dias: diff, tipo: 'sub' })
      }
    })
    return items.sort((a, b) => a.dias - b.dias).slice(0, 5)
  }, [gastosFijos, suscripciones])

  // Color gradiente según estado
  const gradColor = hayRiesgo ? '#ef4444' : saldoFinal > saldoActual ? '#10b981' : '#f59e0b'

  return (
    <div className="max-w-7xl mx-auto px-3 md:px-4 mt-4">
      <div className="rounded-3xl border border-white/8 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/15">
              <Calendar className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Proyección 30 días</p>
              <p className="text-[10px] text-gray-500">Basado en tus ingresos y compromisos</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-500">Saldo estimado</p>
            <p className={`text-lg font-black ${saldoFinal >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {fmt(saldoFinal)}
            </p>
          </div>
        </div>

        {/* Alerta si hay riesgo */}
        {hayRiesgo && (
          <div className="mx-4 mb-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20">
            <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
            <p className="text-xs text-red-300 font-medium">
              Saldo negativo proyectado en {diasNegativos} día{diasNegativos !== 1 ? 's' : ''}. Considera reducir gastos.
            </p>
          </div>
        )}

        {!hayRiesgo && (
          <div className="mx-4 mb-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/8 border border-emerald-500/15">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <p className="text-xs text-emerald-300 font-medium">Flujo saludable — sin déficit proyectado</p>
          </div>
        )}

        {/* Área chart */}
        <div className="px-2 pb-1">
          <ResponsiveContainer width="100%" height={120}>
            <AreaChart data={forecast} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="cashGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={gradColor} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={gradColor} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <XAxis dataKey="dia" hide />
              <YAxis hide />
              <Tooltip content={<ForecastTooltip />} />
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" strokeDasharray="4 4" />
              <Area
                type="monotone"
                dataKey="saldo"
                stroke={gradColor}
                strokeWidth={2}
                fill="url(#cashGrad)"
                dot={false}
                activeDot={{ r: 4, fill: gradColor, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Próximos pagos */}
        {proximos.length > 0 && (
          <div className="px-4 pb-4">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2.5">Próximos 14 días</p>
            <div className="space-y-2">
              {proximos.map((p, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${p.dias <= 3 ? 'bg-red-400' : p.dias <= 7 ? 'bg-amber-400' : 'bg-gray-500'}`} />
                    <span className="text-xs text-gray-200 font-medium">{p.nombre}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-gray-500">{p.dias === 0 ? 'Hoy' : p.dias === 1 ? 'Mañana' : `En ${p.dias}d`}</span>
                    <span className="text-xs font-bold text-white">${Number(p.monto || 0).toLocaleString('es', { maximumFractionDigits: 0 })}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
