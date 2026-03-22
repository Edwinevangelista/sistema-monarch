// GraficaBarras.jsx — 2026: evolución mensual con modal de detalle moderno
import React, { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import { TrendingUp, TrendingDown, X, ArrowRight } from 'lucide-react'

const MESES_CORTOS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const MESES_LARGOS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

const SERIES = [
  { key: 'ingresos',        label: 'Ingresos',       color: '#10b981', dimColor: 'rgba(16,185,129,0.30)'  },
  { key: 'gastosVariables', label: 'Variables',      color: '#f97316', dimColor: 'rgba(249,115,22,0.30)'  },
  { key: 'gastosFijos',     label: 'Fijos',          color: '#f59e0b', dimColor: 'rgba(245,158,11,0.30)'  },
  { key: 'suscripciones',   label: 'Suscripciones',  color: '#8b5cf6', dimColor: 'rgba(139,92,246,0.30)'  },
]

// ── Modal de detalle del mes ─────────────────────────────────────────────────
function ModalDetalleMes({ data, onClose }) {
  const [visible, setVisible] = useState(true)

  const cerrar = () => {
    setVisible(false)
    setTimeout(onClose, 280)
  }

  if (!data) return null

  const balance = data.ingresos - data.totalGastos
  const mesNombre = MESES_LARGOS[parseInt(data.mes.split('-')[1]) - 1]
  const año = data.mes.split('-')[0]

  const filas = [
    { label: 'Ingresos',      valor: data.ingresos,        color: '#10b981', bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.25)' },
    { label: 'Gastos variables', valor: data.gastosVariables, color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.25)'  },
    { label: 'Gastos fijos',  valor: data.gastosFijos,     color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)' },
    { label: 'Suscripciones', valor: data.suscripciones,   color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.25)' },
  ].filter(f => f.valor > 0)

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center"
      style={{
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(10px)',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.28s ease',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) cerrar() }}
    >
      <div
        className="relative w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, rgba(12,17,35,0.99) 0%, rgba(5,8,18,0.99) 100%)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 -20px 60px -10px rgba(0,0,0,0.8)',
          transform: visible ? 'translateY(0)' : 'translateY(30px)',
          transition: 'transform 0.28s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        {/* Barra de agarre (mobile) */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between p-5 pb-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-0.5">
              Detalle del mes
            </p>
            <h2 className="text-xl font-black text-white capitalize">
              {mesNombre} {año}
            </h2>
          </div>
          <button
            onClick={cerrar}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-white/8 hover:bg-white/15 transition-all touch-manipulation"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Balance principal */}
        <div className="mx-5 mb-4 p-4 rounded-2xl" style={{
          background: balance >= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
          border: `1px solid ${balance >= 0 ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
        }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">
                Balance del mes
              </p>
              <p className={`text-2xl font-black ${balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {balance >= 0 ? '+' : ''}${Math.abs(balance).toLocaleString()}
              </p>
            </div>
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: balance >= 0 ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)' }}
            >
              {balance >= 0
                ? <TrendingUp className="w-5 h-5 text-emerald-400" />
                : <TrendingDown className="w-5 h-5 text-red-400" />
              }
            </div>
          </div>
        </div>

        {/* Filas de detalle */}
        <div className="px-5 space-y-2 mb-5">
          {filas.map(f => (
            <div
              key={f.label}
              className="flex items-center justify-between p-3 rounded-xl"
              style={{ background: f.bg, border: `1px solid ${f.border}` }}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: f.color }} />
                <span className="text-sm font-semibold text-gray-300">{f.label}</span>
              </div>
              <span className="text-sm font-black text-white">${f.valor.toLocaleString()}</span>
            </div>
          ))}

          {/* Total gastos */}
          {data.totalGastos > 0 && (
            <div className="flex items-center justify-between px-3 pt-1">
              <span className="text-xs text-gray-600 font-medium">Total gastos</span>
              <span className="text-xs font-bold text-red-400">${data.totalGastos.toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* Botón cerrar */}
        <div className="px-5 pb-6">
          <button
            onClick={cerrar}
            className="w-full py-3 rounded-2xl text-sm font-bold text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 transition-all touch-manipulation active:scale-[0.98]"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ── Tooltip del chart ────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const data = payload[0]?.payload
  if (!data) return null
  const balance = (data.ingresos || 0) - (data.totalGastos || 0)
  return (
    <div
      className="rounded-2xl p-3 min-w-[150px]"
      style={{
        background: 'rgba(10,14,28,0.98)',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
        backdropFilter: 'blur(20px)',
      }}
    >
      <p className="text-white font-black text-xs mb-2">{label} {data.año}</p>
      <div className="space-y-1.5">
        {SERIES.map(s => data[s.key] > 0 && (
          <div key={s.key} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
              <span className="text-[10px] font-medium" style={{ color: s.color }}>{s.label}</span>
            </div>
            <span className="text-[10px] font-bold text-white">${data[s.key].toLocaleString()}</span>
          </div>
        ))}
        <div className="border-t border-white/10 pt-1.5 mt-1 flex items-center justify-between">
          <span className="text-[10px] text-gray-500">Balance</span>
          <span className={`text-[10px] font-black ${balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {balance >= 0 ? '+' : ''}${balance.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  )
}

// ── Componente principal ─────────────────────────────────────────────────────
export default function GraficaBarras({
  ingresos = [],
  gastos = [],
  gastosFijos = [],
  suscripciones = [],
  height = 190,
}) {
  const [mesSel, setMesSel] = useState(null)

  const chartData = useMemo(() => {
    const map = {}

    ingresos.forEach(ing => {
      const d = new Date(ing.fecha)
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (!map[k]) map[k] = { mes: k, ingresos: 0, gastosFijos: 0, gastosVariables: 0, suscripciones: 0 }
      map[k].ingresos += Number(ing.monto) || 0
    })

    gastos.forEach(g => {
      const d = new Date(g.fecha)
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (!map[k]) map[k] = { mes: k, ingresos: 0, gastosFijos: 0, gastosVariables: 0, suscripciones: 0 }
      map[k].gastosVariables += Number(g.monto) || 0
    })

    const hoy = new Date()
    const mesHoy = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`
    gastosFijos.forEach(gf => {
      if (!map[mesHoy]) map[mesHoy] = { mes: mesHoy, ingresos: 0, gastosFijos: 0, gastosVariables: 0, suscripciones: 0 }
      map[mesHoy].gastosFijos += Number(gf.monto) || 0
    })
    suscripciones.forEach(sub => {
      if (sub.estado !== 'Activo') return
      if (!map[mesHoy]) map[mesHoy] = { mes: mesHoy, ingresos: 0, gastosFijos: 0, gastosVariables: 0, suscripciones: 0 }
      map[mesHoy].suscripciones += Number(sub.costo) || 0
    })

    return Object.values(map)
      .sort((a, b) => a.mes.localeCompare(b.mes))
      .slice(-6)
      .map(item => {
        const [año, numMes] = item.mes.split('-')
        return {
          ...item,
          mesNombre: MESES_CORTOS[parseInt(numMes) - 1],
          año,
          totalGastos: item.gastosFijos + item.gastosVariables + item.suscripciones,
        }
      })
  }, [ingresos, gastos, gastosFijos, suscripciones])

  // Sin datos
  if (!chartData || chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mb-3">
          <TrendingUp className="w-7 h-7 text-gray-600" />
        </div>
        <p className="text-sm text-gray-500 font-medium">Sin datos suficientes</p>
        <p className="text-xs text-gray-600 mt-1">Agrega ingresos y gastos para ver tu evolución</p>
      </div>
    )
  }

  // Mes actual (último en el chart)
  const ultimo = chartData[chartData.length - 1]

  // Mes seleccionado para modal
  const mesDato = mesSel ? chartData.find(d => d.mes === mesSel) : null

  // Balance del mes actual (último mes en chart)
  const balanceActual = ultimo ? ultimo.ingresos - ultimo.totalGastos : 0
  const balancePct = ultimo?.ingresos > 0 ? Math.min(100, Math.max(0, (balanceActual / ultimo.ingresos) * 100)) : 0

  return (
    <div className="w-full">
      {/* ── HEADER ── */}
      <div className="flex items-start justify-between mb-3 gap-2">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <TrendingUp className="w-4 h-4 text-indigo-400 shrink-0" />
            <h3 className="text-sm font-black text-white">Mes a mes</h3>
          </div>
          <p className="text-[11px] text-gray-600">
            Toca una barra para ver el detalle del mes
          </p>
        </div>
        {/* Badge de balance actual */}
        <div className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-bold shrink-0 ${
          balanceActual >= 0
            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
            : 'bg-orange-500/15 text-orange-400 border border-orange-500/20'
        }`}>
          {balanceActual >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {balanceActual >= 0 ? '+' : ''}${Math.abs(Math.round(balanceActual / 1000))}k este mes
        </div>
      </div>

      {/* ── RESUMEN VISUAL MES ACTUAL ── */}
      {ultimo && (
        <div className="flex items-center gap-2 mb-3 p-2.5 rounded-xl bg-white/4 border border-white/8">
          <div className="flex-1 min-w-0">
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-gray-500">Gastos vs Ingresos</span>
              <span className={`font-bold ${balancePct > 20 ? 'text-emerald-400' : balancePct > 0 ? 'text-yellow-400' : 'text-orange-400'}`}>
                {(100 - balancePct).toFixed(0)}% usado
              </span>
            </div>
            {/* Barra apilada de gastos */}
            <div className="h-3 bg-white/8 rounded-full overflow-hidden flex">
              {[
                { key: 'gastosVariables', color: '#f97316' },
                { key: 'gastosFijos',     color: '#f59e0b' },
                { key: 'suscripciones',   color: '#8b5cf6' },
              ].map(({ key, color }) => {
                const val = ultimo[key] || 0
                const w = ultimo.ingresos > 0 ? (val / ultimo.ingresos) * 100 : 0
                return w > 1 ? (
                  <div key={key} className="h-full" style={{ width: `${w}%`, backgroundColor: color, opacity: 0.85 }} />
                ) : null
              })}
            </div>
          </div>
          {/* Disponible */}
          <div className="text-right flex-shrink-0">
            <p className="text-[9px] text-gray-600">Disponible</p>
            <p className={`text-sm font-black ${balanceActual >= 0 ? 'text-emerald-400' : 'text-orange-400'}`}>
              ${Math.abs(balanceActual).toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>
      )}

      {/* ── GRÁFICA ── */}
      {/* Área táctil ampliada para dedo — altura generosa en mobile */}
      <div
        className="w-full rounded-2xl overflow-hidden"
        style={{ touchAction: 'pan-y', cursor: 'pointer' }}
      >
        <ResponsiveContainer width="100%" height={height}>
          <BarChart
            data={chartData}
            margin={{ top: 6, right: 4, left: -28, bottom: 0 }}
            barGap={2}
            barCategoryGap="22%"
            onClick={(payload) => {
              if (payload?.activePayload?.[0]?.payload?.mes) {
                setMesSel(payload.activePayload[0].payload.mes)
              }
            }}
          >
            <CartesianGrid
              strokeDasharray="2 6"
              stroke="rgba(255,255,255,0.04)"
              vertical={false}
            />
            <XAxis
              dataKey="mesNombre"
              stroke="transparent"
              tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 700 }}
              axisLine={false}
              tickLine={false}
              height={28}
            />
            <YAxis
              stroke="transparent"
              tick={{ fill: '#4b5563', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: 'rgba(255,255,255,0.04)', radius: 10 }}
            />

            {SERIES.map(s => (
              <Bar key={s.key} dataKey={s.key} name={s.label} radius={[5, 5, 0, 0]} maxBarSize={28}>
                {chartData.map((entry, idx) => (
                  <Cell
                    key={`${s.key}-${idx}`}
                    fill={idx === chartData.length - 1 ? s.color : s.dimColor}
                  />
                ))}
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── LEYENDA ── */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 justify-center">
        {SERIES.map(s => (
          <div key={s.key} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
            <span className="text-[11px] text-gray-500 font-semibold">{s.label}</span>
          </div>
        ))}
      </div>

      {/* ── Botones de mes (táctiles, grandes) ── */}
      {/* Meses como chips tocables — alternativa al click en barra */}
      <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
        {chartData.map((d, idx) => (
          <button
            key={d.mes}
            onClick={() => setMesSel(d.mes)}
            className="shrink-0 flex flex-col items-center gap-0.5 px-3.5 py-2.5 rounded-xl transition-all touch-manipulation active:scale-95"
            style={{
              background: mesSel === d.mes
                ? 'rgba(99,102,241,0.2)'
                : idx === chartData.length - 1
                ? 'rgba(255,255,255,0.07)'
                : 'rgba(255,255,255,0.03)',
              border: mesSel === d.mes
                ? '1px solid rgba(99,102,241,0.4)'
                : idx === chartData.length - 1
                ? '1px solid rgba(255,255,255,0.12)'
                : '1px solid rgba(255,255,255,0.05)',
            }}
          >
            <span
              className="text-[11px] font-black"
              style={{ color: mesSel === d.mes ? '#a5b4fc' : idx === chartData.length - 1 ? '#e5e7eb' : '#6b7280' }}
            >
              {d.mesNombre}
            </span>
            {idx === chartData.length - 1 && (
              <span className="text-[8px] text-indigo-400 font-bold uppercase tracking-wider">Este mes</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Botón "Ver detalle" ── */}
      <button
        onClick={() => setMesSel(chartData[chartData.length - 1]?.mes)}
        className="w-full mt-3 flex items-center justify-center gap-1.5 py-3 rounded-2xl text-[12px] font-bold text-gray-400 hover:text-white hover:bg-white/6 transition-all border border-white/7 touch-manipulation active:scale-[0.98]"
      >
        Ver detalle del mes actual
        <ArrowRight className="w-3.5 h-3.5" />
      </button>

      {/* ── MODAL detalle mes ── */}
      {mesDato && (
        <ModalDetalleMes data={mesDato} onClose={() => setMesSel(null)} />
      )}
    </div>
  )
}
