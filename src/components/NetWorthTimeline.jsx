// NetWorthTimeline.jsx — Evolución de patrimonio neto con sparkline
import { useMemo, useEffect, useState } from 'react'
import { LineChart, Line, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

const fmt = (n) => {
  const abs = Math.abs(n)
  const sign = n < 0 ? '-' : ''
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(1)}k`
  return `${sign}$${abs.toLocaleString('es', { maximumFractionDigits: 0 })}`
}

const NWTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const val = payload[0]?.value
  const pos = val >= 0
  return (
    <div className="px-3 py-2 rounded-xl text-xs"
      style={{ background: 'rgba(10,15,30,0.97)', border: '1px solid rgba(255,255,255,0.1)' }}>
      <p className="text-gray-400 mb-0.5">{label}</p>
      <p className={`font-black text-sm ${pos ? 'text-emerald-400' : 'text-red-400'}`}>{fmt(val)}</p>
    </div>
  )
}

export default function NetWorthTimeline({ netWorthActual = 0 }) {
  const [snapshots, setSnapshots] = useState([])

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('snapshots_mensuales')
        .select('mes, total_ingresos, total_gastos, saldo, total_deudas')
        .eq('user_id', user.id)
        .order('mes', { ascending: true })
        .limit(12)
      if (data && data.length > 0) setSnapshots(data)
    }
    load()
  }, [])

  const chartData = useMemo(() => {
    const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
    const historico = snapshots.map(s => {
      const [, mm] = s.mes.split('-')
      return {
        mes: MESES[parseInt(mm) - 1],
        nw: Math.round((s.total_ingresos || 0) - (s.total_gastos || 0)),
      }
    })

    // Agregar mes actual
    const hoy = new Date()
    const mesLabel = MESES[hoy.getMonth()]
    if (historico.length === 0 || historico[historico.length - 1].mes !== mesLabel) {
      historico.push({ mes: mesLabel, nw: Math.round(netWorthActual), isNow: true })
    } else {
      historico[historico.length - 1] = { mes: mesLabel, nw: Math.round(netWorthActual), isNow: true }
    }
    return historico
  }, [snapshots, netWorthActual])

  const prev = chartData.length >= 2 ? chartData[chartData.length - 2]?.nw : null
  const delta = prev !== null ? netWorthActual - prev : null
  const pctDelta = prev && prev !== 0 ? Math.round((delta / Math.abs(prev)) * 100) : null
  const trend = delta === null ? 'neutral' : delta > 0 ? 'up' : delta < 0 ? 'down' : 'neutral'
  const lineColor = trend === 'up' ? '#10b981' : trend === 'down' ? '#ef4444' : '#6366f1'
  const pos = netWorthActual >= 0

  return (
    <div className="rounded-3xl border border-white/8 p-4"
      style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)' }}>

      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Patrimonio Neto</p>
          <p className={`text-3xl font-black mt-0.5 ${pos ? 'text-white' : 'text-red-400'}`}>
            {fmt(netWorthActual)}
          </p>
          <p className="text-[10px] text-gray-600 mt-0.5">cuentas − deudas totales</p>
        </div>
        <div className="text-right">
          {delta !== null && (
            <div className={`flex items-center gap-1 justify-end text-xs font-bold ${trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-gray-500'}`}>
              {trend === 'up' ? <TrendingUp className="w-3.5 h-3.5" /> : trend === 'down' ? <TrendingDown className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
              {delta >= 0 ? '+' : ''}{fmt(delta)}
            </div>
          )}
          {pctDelta !== null && (
            <p className="text-[10px] text-gray-500 mt-0.5">vs mes ant.</p>
          )}
        </div>
      </div>

      {chartData.length >= 2 ? (
        <ResponsiveContainer width="100%" height={60}>
          <LineChart data={chartData} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
            <Tooltip content={<NWTooltip />} />
            <ReferenceLine y={0} stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />
            <Line
              type="monotone"
              dataKey="nw"
              stroke={lineColor}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4, fill: lineColor, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-14 rounded-xl bg-white/3 border border-dashed border-white/8">
          <p className="text-[11px] text-gray-600">Historial disponible tras el primer mes</p>
        </div>
      )}

      {/* Mini eje */}
      {chartData.length >= 2 && (
        <div className="flex justify-between mt-1.5">
          <span className="text-[9px] text-gray-600">{chartData[0]?.mes}</span>
          <span className="text-[9px] text-gray-500 font-bold">Ahora</span>
        </div>
      )}
    </div>
  )
}
