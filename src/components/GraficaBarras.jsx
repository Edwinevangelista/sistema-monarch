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
  { key: 'ingresos',        label: 'Ingresos',       color: '#10b981', dimColor: 'rgba(16,185,129,0.35)'  },
  { key: 'gastosVariables', label: 'Variables',      color: '#ef4444', dimColor: 'rgba(239,68,68,0.35)'   },
  { key: 'gastosFijos',     label: 'Fijos',          color: '#f59e0b', dimColor: 'rgba(245,158,11,0.35)'  },
  { key: 'suscripciones',   label: 'Suscripciones',  color: '#8b5cf6', dimColor: 'rgba(139,92,246,0.35)'  },
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

  // Tendencia vs mes anterior
  const ultimo = chartData[chartData.length - 1]
  const penultimo = chartData[chartData.length - 2]
  const tendencia = penultimo
    ? (ultimo.ingresos - ultimo.totalGastos) - (penultimo.ingresos - penultimo.totalGastos)
    : 0

  // Mes seleccionado para modal
  const mesDato = mesSel ? chartData.find(d => d.mes === mesSel) : null

  return (
    <div className="w-full">
      {/* ── HEADER ── */}
      <div className="flex items-start justify-between mb-3 gap-2">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <TrendingUp className="w-4 h-4 text-indigo-400 shrink-0" />
            <h3 className="text-sm font-black text-white">Evolución Mensual</h3>
          </div>
          <p className="text-[10px] text-gray-600">
            Últimos {chartData.length} meses · toca una barra para ver el detalle
          </p>
        </div>
        {tendencia !== 0 && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold shrink-0 ${
            tendencia > 0
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
              : 'bg-red-500/15 text-red-400 border border-red-500/20'
          }`}>
            {tendencia > 0
              ? <TrendingUp className="w-3 h-3" />
              : <TrendingDown className="w-3 h-3" />
            }
            {tendencia > 0 ? '+' : ''}{(tendencia / 1000).toFixed(1)}k vs mes ant.
          </div>
        )}
      </div>

      {/* ── GRÁFICA ── */}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={chartData}
          margin={{ top: 4, right: 2, left: -30, bottom: 0 }}
          barGap={1}
          barCategoryGap="28%"
          onClick={(payload) => {
            if (payload?.activePayload?.[0]?.payload?.mes) {
              setMesSel(payload.activePayload[0].payload.mes)
            }
          }}
          style={{ cursor: 'pointer' }}
        >
          <CartesianGrid
            strokeDasharray="2 6"
            stroke="rgba(255,255,255,0.04)"
            vertical={false}
          />
          <XAxis
            dataKey="mesNombre"
            stroke="transparent"
            tick={{ fill: '#6b7280', fontSize: 11, fontWeight: 700 }}
            axisLine={false}
            tickLine={false}
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
            cursor={{ fill: 'rgba(255,255,255,0.035)', radius: 8 }}
          />

          {SERIES.map(s => (
            <Bar key={s.key} dataKey={s.key} name={s.label} radius={[4, 4, 0, 0]} maxBarSize={22}>
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

      {/* ── LEYENDA ── */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-3 justify-center">
        {SERIES.map(s => (
          <div key={s.key} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
            <span className="text-[10px] text-gray-500 font-medium">{s.label}</span>
          </div>
        ))}
      </div>

      {/* ── Botón "Ver resumen completo" (mes actual) ── */}
      <button
        onClick={() => setMesSel(chartData[chartData.length - 1]?.mes)}
        className="w-full mt-3 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-semibold text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-all border border-dashed border-white/8 touch-manipulation"
      >
        Ver detalle del mes actual
        <ArrowRight className="w-3 h-3" />
      </button>

      {/* ── MODAL detalle mes ── */}
      {mesDato && (
        <ModalDetalleMes data={mesDato} onClose={() => setMesSel(null)} />
      )}
    </div>
  )
}
