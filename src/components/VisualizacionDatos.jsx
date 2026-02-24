// VisualizacionDatos.jsx — "Mis Reportes" 2026
// Diseño moderno, mobile-first, comparación de meses, exportación PDF
import React, { useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import {
  BarChart2, TrendingUp, TrendingDown, Download,
  X, ChevronRight, ArrowUp, ArrowDown,
  AlertTriangle, CheckCircle,
  Wallet, PieChart, Sparkles
} from 'lucide-react'
import {
  AreaChart, BarChart, Bar, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
  PieChart as RechartsPieChart, Pie
} from 'recharts'
import jsPDF from 'jspdf'
import { toast } from 'sonner'

// ── Constantes ──────────────────────────────────────────────────────────────
const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const MESES_LARGOS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const CAT_COLORS = ['#8b5cf6','#06b6d4','#f59e0b','#ec4899','#10b981','#3b82f6']

const TABS = [
  { id: 'resumen',    label: 'Resumen',    emoji: '📊' },
  { id: 'comparar',  label: 'Comparar',   emoji: '📅' },
  { id: 'categorias',label: 'Categorías', emoji: '🏷️' },
  { id: 'deudas',    label: 'Deudas',     emoji: '💳' },
]

const RANGOS = [
  { id: 'mes_actual',   label: 'Este mes'   },
  { id: 'mes_anterior', label: 'Mes ant.'   },
  { id: 'trimestre',    label: 'Trimestre'  },
  { id: 'año_actual',   label: 'Este año'   },
]

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n, prefix = '$') => `${prefix}${Number(n || 0).toLocaleString('es-DO')}`
const fmtK = (n) => n >= 1000 ? `$${(n/1000).toFixed(1)}k` : `$${n}`

function getRango(id) {
  const hoy = new Date()
  switch (id) {
    case 'mes_actual':
      return { inicio: new Date(hoy.getFullYear(), hoy.getMonth(), 1), fin: new Date(hoy.getFullYear(), hoy.getMonth()+1, 0) }
    case 'mes_anterior':
      return { inicio: new Date(hoy.getFullYear(), hoy.getMonth()-1, 1), fin: new Date(hoy.getFullYear(), hoy.getMonth(), 0) }
    case 'trimestre': {
      const t = Math.floor(hoy.getMonth()/3)
      return { inicio: new Date(hoy.getFullYear(), t*3, 1), fin: new Date(hoy.getFullYear(), t*3+3, 0) }
    }
    case 'año_actual':
      return { inicio: new Date(hoy.getFullYear(), 0, 1), fin: new Date(hoy.getFullYear(), 11, 31) }
    default:
      return { inicio: new Date(hoy.getFullYear(), hoy.getMonth(), 1), fin: hoy }
  }
}

// ── Subcomponentes ────────────────────────────────────────────────────────────

// Pill de tendencia
function Tendencia({ actual, anterior }) {
  if (!anterior || anterior === 0) return null
  const pct = ((actual - anterior) / anterior) * 100
  const up = pct > 0
  return (
    <span
      className="flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
      style={{
        background: up ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
        color: up ? '#34d399' : '#f87171',
        border: `1px solid ${up ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
      }}
    >
      {up ? <ArrowUp className="w-2.5 h-2.5"/> : <ArrowDown className="w-2.5 h-2.5"/>}
      {Math.abs(pct).toFixed(0)}%
    </span>
  )
}

// Tarjeta métrica
function MetricCard({ label, value, prev, color = '#10b981', icon: Icon, sub }) {
  return (
    <div
      className="flex-1 min-w-0 rounded-2xl p-4 flex flex-col gap-2"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: `1px solid ${color}20`,
      }}
    >
      <div className="flex items-center justify-between">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        {prev !== undefined && <Tendencia actual={value} anterior={prev} />}
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600">{label}</p>
        <p className="text-xl font-black text-white mt-0.5">{fmt(value)}</p>
        {sub && <p className="text-[10px] text-gray-600 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

// Tooltip personalizado
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-2xl p-3 min-w-[140px]" style={{
      background: 'rgba(10,14,28,0.98)',
      border: '1px solid rgba(255,255,255,0.1)',
      boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
      backdropFilter: 'blur(20px)',
    }}>
      <p className="text-white font-black text-[11px] mb-2">{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center justify-between gap-3 mb-1">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color || p.fill }} />
            <span className="text-[10px] text-gray-400">{p.name}</span>
          </div>
          <span className="text-[10px] font-bold text-white">{fmtK(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
const VisualizacionDatos = ({
  onClose,
  ingresos = [],
  gastos = [],
  gastosFijos = [],
  suscripciones = [],
  deudas = [],
  cuentas = [],
}) => {
  const [tab, setTab] = useState('resumen')
  const [rango, setRango] = useState('mes_actual')
  const [exportando, setExportando] = useState(false)
  const [visible, setVisible] = useState(true)

  const cerrar = () => {
    setVisible(false)
    setTimeout(onClose, 300)
  }

  // ── Datos históricos 6 meses ──────────────────────────────────────────────
  const historico = useMemo(() => {
    const hoy = new Date()
    return Array.from({ length: 6 }, (_, i) => {
      const offset = 5 - i
      const d = new Date(hoy.getFullYear(), hoy.getMonth() - offset, 1)
      const mes = d.getMonth()
      const año = d.getFullYear()
      const ini = new Date(año, mes, 1)
      const fin = new Date(año, mes+1, 0)

      const totalIng = ingresos
        .filter(x => { const f = new Date(x.fecha); return f >= ini && f <= fin })
        .reduce((s, x) => s + Number(x.monto||0), 0)
      const totalGst = gastos
        .filter(x => { const f = new Date(x.fecha); return f >= ini && f <= fin })
        .reduce((s, x) => s + Number(x.monto||0), 0)
      const totalFijos = gastosFijos.reduce((s, x) => s + Number(x.monto||0), 0)
      const totalSubs = suscripciones.filter(s => s.estado === 'Activo').reduce((s, x) => s + Number(x.costo||0), 0)

      // Solo mes actual acumula fijos y subs
      const gastoTotal = totalGst + (i === 5 ? totalFijos + totalSubs : 0)
      return {
        mes: MESES[mes],
        mesLargo: `${MESES_LARGOS[mes]} ${año}`,
        ingresos: totalIng,
        gastos: gastoTotal,
        balance: totalIng - gastoTotal,
        esActual: i === 5,
      }
    })
  }, [ingresos, gastos, gastosFijos, suscripciones])

  // ── Datos del rango seleccionado ──────────────────────────────────────────
  const metricas = useMemo(() => {
    const { inicio, fin } = getRango(rango)
    const enRango = arr => arr.filter(x => { const f = new Date(x.fecha); return f >= inicio && f <= fin })

    const ing = enRango(ingresos)
    const gst = enRango(gastos)
    const totalIng = ing.reduce((s, x) => s + Number(x.monto||0), 0)
    const totalGst = gst.reduce((s, x) => s + Number(x.monto||0), 0)
    const totalFijos = rango === 'mes_actual' ? gastosFijos.reduce((s, x) => s + Number(x.monto||0), 0) : 0
    const totalSubs = rango === 'mes_actual' ? suscripciones.filter(s => s.estado === 'Activo').reduce((s, x) => s + Number(x.costo||0), 0) : 0
    const gastosTotales = totalGst + totalFijos + totalSubs
    const balance = totalIng - gastosTotales
    const tasaAhorro = totalIng > 0 ? (balance / totalIng) * 100 : 0
    const deudaTotal = deudas.reduce((s, d) => s + Number(d.saldo||0), 0)

    // Por categoría
    const porCategoria = {}
    gst.forEach(g => { const c = g.categoria||'Otros'; porCategoria[c] = (porCategoria[c]||0) + Number(g.monto||0) })

    const prev = historico[historico.length - 2] || null

    return { totalIng, gastosTotales, balance, tasaAhorro, deudaTotal, porCategoria, prev, inicio, fin }
  }, [rango, ingresos, gastos, gastosFijos, suscripciones, deudas, historico])

  const pieData = useMemo(() =>
    Object.entries(metricas.porCategoria)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)
  , [metricas.porCategoria])

  // ── Exportar PDF ──────────────────────────────────────────────────────────
  const exportarPDF = async () => {
    setExportando(true)
    try {
      const doc = new jsPDF()
      const W = doc.internal.pageSize.getWidth()
      let y = 20

      // Header
      doc.setFillColor(10, 14, 38)
      doc.rect(0, 0, W, 40, 'F')
      doc.setTextColor(255,255,255)
      doc.setFont('helvetica','bold')
      doc.setFontSize(18)
      doc.text('FinGuide · Mis Reportes', W/2, 20, { align: 'center' })
      doc.setFontSize(9)
      doc.setFont('helvetica','normal')
      doc.setTextColor(180,180,180)
      const rangoLabel = RANGOS.find(r => r.id === rango)?.label || rango
      doc.text(`${rangoLabel} · Generado el ${new Date().toLocaleDateString('es-DO')}`, W/2, 30, { align: 'center' })

      y = 55
      // Métricas principales
      const cards = [
        { label: 'Ingresos', value: metricas.totalIng, color: [16,185,129] },
        { label: 'Gastos',   value: metricas.gastosTotales, color: [239,68,68] },
        { label: 'Balance',  value: metricas.balance,   color: [59,130,246] },
        { label: 'Deuda',    value: metricas.deudaTotal, color: [139,92,246] },
      ]
      const cw = (W - 40) / 4
      cards.forEach((c, i) => {
        const x = 20 + i * (cw + 2.5)
        doc.setFillColor(...c.color)
        doc.roundedRect(x, y, cw-2, 25, 3, 3, 'F')
        doc.setFont('helvetica','bold')
        doc.setFontSize(7)
        doc.setTextColor(255,255,255)
        doc.text(c.label, x+4, y+8)
        doc.setFontSize(11)
        doc.text(fmt(c.value), x+4, y+20)
      })
      y += 35

      // Tabla histórico
      doc.setFont('helvetica','bold')
      doc.setFontSize(12)
      doc.setTextColor(40,40,40)
      doc.text('Evolución últimos 6 meses', 20, y)
      y += 8

      const headers = ['Mes','Ingresos','Gastos','Balance']
      const colW = (W-40)/4
      doc.setFillColor(230,230,230)
      doc.rect(20, y, W-40, 8, 'F')
      doc.setFontSize(8)
      doc.setFont('helvetica','bold')
      doc.setTextColor(0)
      headers.forEach((h,i) => doc.text(h, 22+i*colW, y+5.5))
      y += 8

      doc.setFont('helvetica','normal')
      doc.setFontSize(9)
      historico.forEach((row, ri) => {
        if (ri % 2 === 0) { doc.setFillColor(248,248,248); doc.rect(20, y, W-40, 7, 'F') }
        const cols = [row.mesLargo, fmt(row.ingresos), fmt(row.gastos), fmt(row.balance)]
        cols.forEach((v,i) => {
          doc.setTextColor(i === 3 ? (row.balance >= 0 ? 16 : 200) : 40, i === 3 ? (row.balance >= 0 ? 185 : 40) : 40, i === 3 ? (row.balance >= 0 ? 129 : 40) : 40)
          doc.text(v, 22+i*colW, y+5)
        })
        y += 7
      })
      y += 10

      // Categorías de gasto
      if (pieData.length > 0) {
        doc.setFont('helvetica','bold')
        doc.setFontSize(12)
        doc.setTextColor(40,40,40)
        doc.text('Top categorías de gasto', 20, y)
        y += 8
        pieData.forEach((cat, i) => {
          const pct = metricas.gastosTotales > 0 ? ((cat.value/metricas.gastosTotales)*100).toFixed(0) : 0
          doc.setFont('helvetica','normal')
          doc.setFontSize(9)
          doc.setTextColor(60,60,60)
          doc.text(`${i+1}. ${cat.name}`, 24, y)
          doc.text(`${fmt(cat.value)}  (${pct}%)`, W-20, y, { align: 'right' })
          y += 6
        })
      }

      // Footer
      doc.setFontSize(8)
      doc.setTextColor(160,160,160)
      doc.text('FinGuide App — Datos confidenciales', W/2, 285, { align: 'center' })

      // Descarga
      const blob = doc.output('blob')
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `finguide-reporte-${rango}-${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url) }, 100)
      toast.success('📄 Reporte PDF descargado')
    } catch (e) {
      console.error(e)
      toast.error('Error generando PDF: ' + e.message)
    } finally {
      setExportando(false)
    }
  }

  // ── Tabs content ─────────────────────────────────────────────────────────
  const renderTab = () => {
    switch (tab) {
      // ── RESUMEN ────────────────────────────────────────────────────────
      case 'resumen':
        return (
          <div className="space-y-4">
            {/* Cards de métricas */}
            <div className="grid grid-cols-2 gap-3">
              <MetricCard label="Ingresos" value={metricas.totalIng} prev={metricas.prev?.ingresos} color="#10b981" icon={TrendingUp} />
              <MetricCard label="Gastos" value={metricas.gastosTotales} prev={metricas.prev?.gastos} color="#ef4444" icon={TrendingDown} />
              <MetricCard
                label="Balance"
                value={metricas.balance}
                color={metricas.balance >= 0 ? '#3b82f6' : '#ef4444'}
                icon={Wallet}
                sub={metricas.balance >= 0 ? 'Mes positivo ✓' : 'Revisa tus gastos'}
              />
              <MetricCard
                label="Tasa de ahorro"
                value={metricas.tasaAhorro.toFixed(1) + '%'}
                color="#8b5cf6"
                icon={Sparkles}
                sub={metricas.tasaAhorro >= 20 ? 'Muy bien 🎉' : metricas.tasaAhorro >= 10 ? 'Puedes mejorar' : 'Ahorra más'}
              />
            </div>

            {/* Flujo de caja — gráfica área */}
            <div
              className="rounded-2xl p-4"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <p className="text-[11px] font-black text-white uppercase tracking-wider mb-3">Flujo de caja · 6 meses</p>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={historico} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gIng" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.02}/>
                    </linearGradient>
                    <linearGradient id="gGst" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.35}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 6" stroke="rgba(255,255,255,0.04)" vertical={false}/>
                  <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fill:'#6b7280', fontSize:11, fontWeight:700 }}/>
                  <YAxis axisLine={false} tickLine={false} tick={{ fill:'#4b5563', fontSize:10 }} tickFormatter={fmtK}/>
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke:'rgba(255,255,255,0.06)', strokeWidth:1 }}/>
                  <Area type="monotone" dataKey="ingresos" name="Ingresos" stroke="#10b981" strokeWidth={2} fill="url(#gIng)" dot={false} activeDot={{ r:4, fill:'#10b981' }}/>
                  <Area type="monotone" dataKey="gastos" name="Gastos" stroke="#ef4444" strokeWidth={2} fill="url(#gGst)" dot={false} activeDot={{ r:4, fill:'#ef4444' }}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Alerta déficit */}
            {metricas.balance < 0 && (
              <div className="flex items-start gap-3 p-3 rounded-2xl" style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)' }}>
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5"/>
                <div>
                  <p className="text-[12px] font-bold text-red-400">Balance negativo este período</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">Tus gastos superan tus ingresos por {fmt(Math.abs(metricas.balance))}. Revisa tus suscripciones y gastos fijos.</p>
                </div>
              </div>
            )}
          </div>
        )

      // ── COMPARAR ──────────────────────────────────────────────────────
      case 'comparar':
        return (
          <div className="space-y-4">
            <p className="text-[11px] text-gray-600 font-medium">Comparación mes a mes — últimos 6 meses</p>

            {/* Gráfica barras comparativa */}
            <div className="rounded-2xl p-4" style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)' }}>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={historico} margin={{ top:4, right:4, left:-28, bottom:0 }} barGap={2} barCategoryGap="25%">
                  <CartesianGrid strokeDasharray="2 6" stroke="rgba(255,255,255,0.04)" vertical={false}/>
                  <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fill:'#6b7280', fontSize:11, fontWeight:700 }}/>
                  <YAxis axisLine={false} tickLine={false} tick={{ fill:'#4b5563', fontSize:10 }} tickFormatter={fmtK}/>
                  <Tooltip content={<CustomTooltip />} cursor={{ fill:'rgba(255,255,255,0.03)', radius:8 }}/>
                  <Bar dataKey="ingresos" name="Ingresos" radius={[4,4,0,0]} maxBarSize={20}>
                    {historico.map((d,i) => <Cell key={i} fill={d.esActual ? '#10b981' : 'rgba(16,185,129,0.3)'}/>)}
                  </Bar>
                  <Bar dataKey="gastos" name="Gastos" radius={[4,4,0,0]} maxBarSize={20}>
                    {historico.map((d,i) => <Cell key={i} fill={d.esActual ? '#ef4444' : 'rgba(239,68,68,0.3)'}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-4 justify-center mt-2">
                {[{color:'#10b981',label:'Ingresos'},{color:'#ef4444',label:'Gastos'}].map(s => (
                  <div key={s.label} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ background:s.color }}/>
                    <span className="text-[10px] text-gray-500 font-semibold">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tabla comparativa */}
            <div className="rounded-2xl overflow-hidden" style={{ border:'1px solid rgba(255,255,255,0.07)' }}>
              <div className="grid grid-cols-4 gap-0 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-gray-600" style={{ background:'rgba(255,255,255,0.04)' }}>
                <span>Mes</span><span className="text-right">Ingresos</span><span className="text-right">Gastos</span><span className="text-right">Balance</span>
              </div>
              {historico.map((d, i) => (
                <div
                  key={i}
                  className="grid grid-cols-4 gap-0 px-3 py-3 border-t border-white/5 transition-all"
                  style={{ background: d.esActual ? 'rgba(255,255,255,0.05)' : 'transparent' }}
                >
                  <span className="text-[11px] font-bold text-white flex items-center gap-1">
                    {d.mes}
                    {d.esActual && <span className="text-[8px] text-indigo-400 font-black">actual</span>}
                  </span>
                  <span className="text-[11px] font-bold text-emerald-400 text-right">{fmtK(d.ingresos)}</span>
                  <span className="text-[11px] font-bold text-red-400 text-right">{fmtK(d.gastos)}</span>
                  <span className={`text-[11px] font-black text-right ${d.balance >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                    {d.balance >= 0 ? '+' : ''}{fmtK(d.balance)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )

      // ── CATEGORÍAS ────────────────────────────────────────────────────
      case 'categorias':
        return (
          <div className="space-y-4">
            {pieData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3" style={{ background:'rgba(255,255,255,0.05)' }}>
                  <PieChart className="w-8 h-8 text-gray-600"/>
                </div>
                <p className="text-sm font-semibold text-gray-500">Sin gastos en este período</p>
                <p className="text-xs text-gray-600 mt-1">Cambia el rango de fecha o agrega gastos</p>
              </div>
            ) : (
              <>
                {/* Donut chart */}
                <div className="flex items-center gap-4 rounded-2xl p-4" style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)' }}>
                  <div className="relative shrink-0" style={{ width:120, height:120 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={36} outerRadius={55} paddingAngle={3} dataKey="value" stroke="transparent">
                          {pieData.map((_, i) => <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]}/>)}
                        </Pie>
                      </RechartsPieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-[9px] text-gray-500 font-bold uppercase">Total</span>
                      <span className="text-[13px] font-black text-white leading-tight">{fmtK(metricas.gastosTotales)}</span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    {pieData.map((cat, i) => {
                      const pct = metricas.gastosTotales > 0 ? ((cat.value / metricas.gastosTotales)*100).toFixed(0) : 0
                      return (
                        <div key={cat.name}>
                          <div className="flex justify-between mb-0.5">
                            <div className="flex items-center gap-1.5">
                              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: CAT_COLORS[i % CAT_COLORS.length] }}/>
                              <span className="text-[11px] font-semibold text-gray-300 truncate max-w-[80px]">{cat.name}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-black text-white">{pct}%</span>
                            </div>
                          </div>
                          <div className="h-1 rounded-full" style={{ background:'rgba(255,255,255,0.06)' }}>
                            <div className="h-full rounded-full transition-all duration-700" style={{ width:`${pct}%`, background: CAT_COLORS[i % CAT_COLORS.length] }}/>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Lista detallada */}
                <div className="space-y-2">
                  {pieData.map((cat, i) => (
                    <div
                      key={cat.name}
                      className="flex items-center justify-between p-3 rounded-xl"
                      style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm" style={{ background:`${CAT_COLORS[i % CAT_COLORS.length]}18` }}>
                          {['🛒','🏠','🚗','🎭','🍔','💊'][i] || '📦'}
                        </div>
                        <div>
                          <p className="text-[12px] font-bold text-white">{cat.name}</p>
                          <p className="text-[10px] text-gray-600">{metricas.gastosTotales > 0 ? ((cat.value/metricas.gastosTotales)*100).toFixed(0) : 0}% del total</p>
                        </div>
                      </div>
                      <p className="text-[13px] font-black text-white">{fmt(cat.value)}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )

      // ── DEUDAS ────────────────────────────────────────────────────────
      case 'deudas':
        return (
          <div className="space-y-4">
            {/* Resumen deudas */}
            <div className="flex gap-3">
              <div className="flex-1 rounded-2xl p-4" style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)' }}>
                <p className="text-[10px] font-black uppercase tracking-widest text-red-400 mb-1">Deuda total</p>
                <p className="text-2xl font-black text-white">{fmt(metricas.deudaTotal)}</p>
              </div>
              <div className="flex-1 rounded-2xl p-4" style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)' }}>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-600 mb-1">Número</p>
                <p className="text-2xl font-black text-white">{deudas.length}</p>
                <p className="text-[10px] text-gray-600">deudas activas</p>
              </div>
            </div>

            {/* Lista deudas */}
            {deudas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <CheckCircle className="w-12 h-12 text-emerald-600 mb-3"/>
                <p className="text-sm font-semibold text-gray-500">Sin deudas registradas</p>
                <p className="text-xs text-gray-600 mt-1">¡Excelente! O agrega tus deudas para hacer seguimiento</p>
              </div>
            ) : (
              <div className="space-y-3">
                {deudas.map((d, i) => {
                  const pctUso = d.limite_credito > 0 ? Math.min(100, (d.saldo / d.limite_credito)*100) : 0
                  return (
                    <div key={i} className="rounded-2xl p-4" style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)' }}>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-[13px] font-black text-white">{d.nombre || d.cuenta || 'Deuda'}</p>
                          <p className="text-[10px] text-gray-600">{d.tipo || 'Tarjeta'}{d.banco ? ` · ${d.banco}` : ''}</p>
                        </div>
                        <p className="text-[15px] font-black text-red-400">{fmt(d.saldo)}</p>
                      </div>
                      {d.interes_anual && (
                        <p className="text-[10px] text-yellow-500 font-bold mb-2">📈 {d.interes_anual}% anual</p>
                      )}
                      {d.limite_credito > 0 && (
                        <div>
                          <div className="flex justify-between text-[9px] text-gray-600 mb-1">
                            <span>Uso: {pctUso.toFixed(0)}%</span>
                            <span>Límite: {fmt(d.limite_credito)}</span>
                          </div>
                          <div className="h-1.5 rounded-full" style={{ background:'rgba(255,255,255,0.06)' }}>
                            <div className="h-full rounded-full transition-all duration-700" style={{ width:`${pctUso}%`, background: pctUso > 70 ? '#ef4444' : pctUso > 40 ? '#f59e0b' : '#10b981' }}/>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      default: return null
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  const content = (
    <div
      className="fixed inset-0 z-[9998] flex items-end sm:items-center justify-center"
      style={{
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(14px)',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.3s ease',
      }}
      onClick={e => { if (e.target === e.currentTarget) cerrar() }}
    >
      <div
        className="relative w-full sm:max-w-lg flex flex-col rounded-t-[2rem] sm:rounded-[2rem] overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, rgba(12,17,36,0.99) 0%, rgba(5,8,18,0.99) 100%)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 -24px 80px -12px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.05)',
          maxHeight: '92dvh',
          transform: visible ? 'translateY(0)' : 'translateY(30px)',
          transition: 'transform 0.32s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        {/* Top glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-24 pointer-events-none" style={{ background:'radial-gradient(ellipse, rgba(99,102,241,0.1) 0%, transparent 70%)' }}/>

        {/* Handle */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-white/15"/>
        </div>

        {/* ── HEADER ── */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background:'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow:'0 4px 16px rgba(99,102,241,0.4)' }}>
              <BarChart2 className="w-4.5 h-4.5 text-white"/>
            </div>
            <div>
              <h1 className="text-[15px] font-black text-white leading-tight">Mis Reportes</h1>
              <p className="text-[10px] text-gray-600 font-medium">Análisis financiero personal</p>
            </div>
          </div>
          <button onClick={cerrar} className="w-8 h-8 rounded-full flex items-center justify-center bg-white/7 hover:bg-white/14 transition-all touch-manipulation">
            <X className="w-4 h-4 text-gray-500"/>
          </button>
        </div>

        {/* ── CONTROLES: Rango + Export ── */}
        <div className="px-5 pb-3 flex items-center gap-2 shrink-0">
          {/* Rango pills */}
          <div className="flex gap-1.5 flex-1 overflow-x-auto scrollbar-hide">
            {RANGOS.map(r => (
              <button
                key={r.id}
                onClick={() => setRango(r.id)}
                className="shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all touch-manipulation active:scale-95"
                style={{
                  background: rango === r.id ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.05)',
                  color: rango === r.id ? '#a5b4fc' : '#6b7280',
                  border: `1px solid ${rango === r.id ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.07)'}`,
                }}
              >
                {r.label}
              </button>
            ))}
          </div>
          {/* Botón exportar PDF */}
          <button
            onClick={exportarPDF}
            disabled={exportando}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all touch-manipulation active:scale-95 disabled:opacity-50"
            style={{ background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', boxShadow:'0 4px 14px rgba(99,102,241,0.35)' }}
          >
            {exportando ? (
              <span className="animate-spin">⏳</span>
            ) : (
              <><Download className="w-3.5 h-3.5"/>PDF</>
            )}
          </button>
        </div>

        {/* ── TABS ── */}
        <div className="px-5 pb-3 flex gap-1.5 overflow-x-auto scrollbar-hide shrink-0">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-[12px] font-bold transition-all touch-manipulation active:scale-95"
              style={{
                background: tab === t.id ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)',
                color: tab === t.id ? '#fff' : '#6b7280',
                border: `1px solid ${tab === t.id ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.05)'}`,
              }}
            >
              <span>{t.emoji}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="h-px mx-5 shrink-0" style={{ background:'rgba(255,255,255,0.06)' }}/>

        {/* ── CONTENIDO ── */}
        <div className="flex-1 overflow-y-auto p-5 overscroll-contain" style={{ WebkitOverflowScrolling:'touch' }}>
          {renderTab()}
        </div>

        {/* ── FOOTER ── */}
        <div className="px-5 pb-6 pt-3 shrink-0">
          <div className="flex items-center justify-between text-[10px] text-gray-700">
            <span>📅 {metricas.inicio?.toLocaleDateString('es-DO')} – {metricas.fin?.toLocaleDateString('es-DO')}</span>
            <button onClick={cerrar} className="flex items-center gap-1 text-gray-600 hover:text-gray-400 touch-manipulation transition-colors">
              Cerrar <ChevronRight className="w-3 h-3"/>
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(content, document.body)
}

export default VisualizacionDatos
