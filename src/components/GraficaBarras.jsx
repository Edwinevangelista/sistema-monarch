// GraficaBarras.jsx — 2026: más visual, leyenda clara, explicativa para móvil
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Info } from 'lucide-react';

const MESES_CORTOS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

export default function GraficaBarras({
  ingresos = [],
  gastos = [],
  gastosFijos = [],
  suscripciones = [],
  height = 220
}) {
  const chartData = useMemo(() => {
    const mesesMap = {}

    ingresos.forEach(ing => {
      const fecha = new Date(ing.fecha)
      const mes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`
      if (!mesesMap[mes]) mesesMap[mes] = { mes, ingresos: 0, gastosFijos: 0, gastosVariables: 0, suscripciones: 0 }
      mesesMap[mes].ingresos += Number(ing.monto) || 0
    })

    gastos.forEach(g => {
      const fecha = new Date(g.fecha)
      const mes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`
      if (!mesesMap[mes]) mesesMap[mes] = { mes, ingresos: 0, gastosFijos: 0, gastosVariables: 0, suscripciones: 0 }
      mesesMap[mes].gastosVariables += Number(g.monto) || 0
    })

    const hoy = new Date()
    const mesHoy = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`
    gastosFijos.forEach(gf => {
      if (!mesesMap[mesHoy]) mesesMap[mesHoy] = { mes: mesHoy, ingresos: 0, gastosFijos: 0, gastosVariables: 0, suscripciones: 0 }
      mesesMap[mesHoy].gastosFijos += Number(gf.monto) || 0
    })
    suscripciones.forEach(sub => {
      if (sub.estado !== 'Activo') return
      if (!mesesMap[mesHoy]) mesesMap[mesHoy] = { mes: mesHoy, ingresos: 0, gastosFijos: 0, gastosVariables: 0, suscripciones: 0 }
      mesesMap[mesHoy].suscripciones += Number(sub.costo) || 0
    })

    return Object.values(mesesMap)
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

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null
    const data = payload[0]?.payload
    if (!data) return null
    const balance = (data.ingresos || 0) - (data.totalGastos || 0)
    return (
      <div
        className="rounded-2xl p-3.5 min-w-[160px]"
        style={{
          background: 'rgba(15,23,42,0.98)',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <p className="text-white font-black text-sm mb-2.5">{label} {data.año}</p>
        <div className="space-y-1.5">
          {data.ingresos > 0 && (
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-emerald-400 text-xs font-medium">Ingresos</span>
              </div>
              <span className="text-white text-xs font-bold">${data.ingresos.toLocaleString()}</span>
            </div>
          )}
          {data.gastosVariables > 0 && (
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-red-400" />
                <span className="text-red-400 text-xs font-medium">Variables</span>
              </div>
              <span className="text-white text-xs font-bold">${data.gastosVariables.toLocaleString()}</span>
            </div>
          )}
          {data.gastosFijos > 0 && (
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-amber-400 text-xs font-medium">Fijos</span>
              </div>
              <span className="text-white text-xs font-bold">${data.gastosFijos.toLocaleString()}</span>
            </div>
          )}
          {data.suscripciones > 0 && (
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-violet-400" />
                <span className="text-violet-400 text-xs font-medium">Suscripciones</span>
              </div>
              <span className="text-white text-xs font-bold">${data.suscripciones.toLocaleString()}</span>
            </div>
          )}
          <div className="border-t border-white/10 pt-1.5 mt-1.5 flex items-center justify-between gap-4">
            <span className="text-gray-400 text-xs">Balance</span>
            <span className={`text-xs font-black ${balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {balance >= 0 ? '+' : ''}{balance.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    )
  }

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

  // Calcular tendencia
  const ultimoMes = chartData[chartData.length - 1]
  const penultimoMes = chartData[chartData.length - 2]
  const tendencia = penultimoMes
    ? ultimoMes.ingresos - ultimoMes.totalGastos - (penultimoMes.ingresos - penultimoMes.totalGastos)
    : 0

  return (
    <div className="w-full">
      {/* ── HEADER con descripción ── */}
      <div className="flex items-start justify-between mb-3 gap-2">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <TrendingUp className="w-4 h-4 text-blue-400 shrink-0" />
            <h3 className="text-sm font-black text-white">Evolución Mensual</h3>
          </div>
          <p className="text-[10px] text-gray-500 leading-relaxed">
            Compara tus ingresos vs gastos de los últimos {chartData.length} meses
          </p>
        </div>
        {tendencia !== 0 && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold shrink-0 ${
            tendencia > 0
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
              : 'bg-red-500/15 text-red-400 border border-red-500/20'
          }`}>
            {tendencia > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {tendencia > 0 ? '+' : ''}{(tendencia / 1000).toFixed(1)}k
          </div>
        )}
      </div>

      {/* ── GRÁFICA ── */}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={chartData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }} barGap={2} barCategoryGap="30%">
          <CartesianGrid strokeDasharray="2 6" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis
            dataKey="mesNombre"
            stroke="transparent"
            tick={{ fill: '#6b7280', fontSize: 11, fontWeight: 600 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            stroke="transparent"
            tick={{ fill: '#4b5563', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)', radius: 8 }} />
          <Bar dataKey="ingresos" name="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={28}>
            {chartData.map((entry, index) => (
              <Cell key={`ing-${index}`} fill={
                index === chartData.length - 1
                  ? '#10b981'
                  : 'rgba(16,185,129,0.5)'
              } />
            ))}
          </Bar>
          <Bar dataKey="gastosVariables" name="Variables" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={28}>
            {chartData.map((entry, index) => (
              <Cell key={`var-${index}`} fill={
                index === chartData.length - 1
                  ? '#ef4444'
                  : 'rgba(239,68,68,0.5)'
              } />
            ))}
          </Bar>
          <Bar dataKey="gastosFijos" name="Fijos" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={28}>
            {chartData.map((entry, index) => (
              <Cell key={`fijo-${index}`} fill={
                index === chartData.length - 1
                  ? '#f59e0b'
                  : 'rgba(245,158,11,0.5)'
              } />
            ))}
          </Bar>
          <Bar dataKey="suscripciones" name="Suscripciones" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={28}>
            {chartData.map((entry, index) => (
              <Cell key={`sub-${index}`} fill={
                index === chartData.length - 1
                  ? '#8b5cf6'
                  : 'rgba(139,92,246,0.5)'
              } />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* ── LEYENDA + nota ── */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-3 justify-center">
        {[
          { color: 'bg-emerald-400', label: 'Ingresos' },
          { color: 'bg-red-400', label: 'Variables' },
          { color: 'bg-amber-400', label: 'Fijos' },
          { color: 'bg-violet-400', label: 'Suscripciones' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${color}`} />
            <span className="text-[10px] text-gray-500 font-medium">{label}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1 justify-center mt-2">
        <Info className="w-3 h-3 text-gray-700" />
        <span className="text-[10px] text-gray-700">Toca una barra para ver el detalle · Barras opacas = meses anteriores</span>
      </div>
    </div>
  )
}
