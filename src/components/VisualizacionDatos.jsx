// VisualizacionDatos.jsx — "Mis Reportes" 2026 v2
// Datos correctos por rango, PDF profesional sin emojis, mobile-first
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

// ── Constantes ───────────────────────────────────────────────────────────────
const MESES     = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const MESES_L   = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const CAT_COLORS = ['#8b5cf6','#06b6d4','#f59e0b','#ec4899','#10b981','#3b82f6']

const TABS = [
  { id: 'resumen',     label: 'Resumen',    emoji: '📊' },
  { id: 'comparar',   label: 'Comparar',   emoji: '📅' },
  { id: 'categorias', label: 'Categorias', emoji: '🏷' },
  { id: 'deudas',     label: 'Deudas',     emoji: '💳' },
]

const RANGOS = [
  { id: 'mes_actual',   label: 'Este mes',  meses: 1 },
  { id: 'mes_anterior', label: 'Mes ant.',  meses: 1 },
  { id: 'trimestre',    label: 'Trimestre', meses: 3 },
  { id: 'año_actual',   label: 'Este año',  meses: 12 },
]

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmt  = (n) => `$${Number(n || 0).toLocaleString('es-DO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
const fmtK = (n) => Math.abs(n) >= 1000 ? `$${(n/1000).toFixed(1)}k` : `$${Number(n||0).toFixed(0)}`

// Rango de fechas según selección
function getRango(id) {
  const hoy = new Date()
  switch (id) {
    case 'mes_actual':
      return {
        inicio: new Date(hoy.getFullYear(), hoy.getMonth(), 1),
        fin:    new Date(hoy.getFullYear(), hoy.getMonth()+1, 0),
        meses: 1,
      }
    case 'mes_anterior':
      return {
        inicio: new Date(hoy.getFullYear(), hoy.getMonth()-1, 1),
        fin:    new Date(hoy.getFullYear(), hoy.getMonth(), 0),
        meses: 1,
      }
    case 'trimestre': {
      const t = Math.floor(hoy.getMonth()/3)
      return {
        inicio: new Date(hoy.getFullYear(), t*3, 1),
        fin:    new Date(hoy.getFullYear(), t*3+3, 0),
        meses: 3,
      }
    }
    case 'año_actual':
      return {
        inicio: new Date(hoy.getFullYear(), 0, 1),
        fin:    new Date(hoy.getFullYear(), 11, 31),
        meses: hoy.getMonth()+1, // meses transcurridos
      }
    default:
      return { inicio: new Date(hoy.getFullYear(), hoy.getMonth(), 1), fin: hoy, meses: 1 }
  }
}

// Filtra array por campo fecha dentro de un rango
const enRango = (arr, ini, fin, campo = 'fecha') =>
  arr.filter(x => { const f = new Date(x[campo]); return f >= ini && f <= fin })

// Total fijos + subs activos (recurrentes mensuales) multiplicado por nMeses
const totalRecurrente = (gastosFijos, suscripciones, nMeses = 1) => {
  const fijos = gastosFijos.reduce((s, x) => s + Number(x.monto||0), 0)
  const subs  = suscripciones.filter(s => s.estado === 'Activo').reduce((s, x) => s + Number(x.costo||0), 0)
  return (fijos + subs) * nMeses
}

// ── Subcomponentes ────────────────────────────────────────────────────────────
function Tendencia({ actual, anterior }) {
  if (!anterior || anterior === 0) return null
  const pct = ((actual - anterior) / anterior) * 100
  const up = pct > 0
  return (
    <span className="flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{
      background: up ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
      color: up ? '#34d399' : '#f87171',
      border: `1px solid ${up ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
    }}>
      {up ? <ArrowUp className="w-2.5 h-2.5"/> : <ArrowDown className="w-2.5 h-2.5"/>}
      {Math.abs(pct).toFixed(0)}%
    </span>
  )
}

function MetricCard({ label, value, prev, color = '#10b981', icon: Icon, sub, isPercent }) {
  const display = isPercent ? `${Number(value||0).toFixed(1)}%` : fmt(value)
  return (
    <div className="flex-1 min-w-0 rounded-2xl p-4 flex flex-col gap-2" style={{ background:'rgba(255,255,255,0.04)', border:`1px solid ${color}20` }}>
      <div className="flex items-center justify-between">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background:`${color}18` }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        {prev !== undefined && !isPercent && <Tendencia actual={value} anterior={prev} />}
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600">{label}</p>
        <p className="text-xl font-black text-white mt-0.5">{display}</p>
        {sub && <p className="text-[10px] text-gray-600 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-2xl p-3 min-w-[140px]" style={{ background:'rgba(10,14,28,0.98)', border:'1px solid rgba(255,255,255,0.1)', boxShadow:'0 20px 40px rgba(0,0,0,0.6)', backdropFilter:'blur(20px)' }}>
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
  ingresos     = [],
  gastos       = [],
  gastosFijos  = [],
  suscripciones = [],
  deudas       = [],
}) => {
  const [tab,        setTab]        = useState('resumen')
  const [rango,      setRango]      = useState('mes_actual')
  const [exportando, setExportando] = useState(false)
  const [visible,    setVisible]    = useState(true)

  const cerrar = () => { setVisible(false); setTimeout(onClose, 300) }

  // ── Histórico de los últimos 6 meses — datos CORRECTOS ───────────────────
  // GastosFijos y suscripciones son RECURRENTES: se aplican a CADA mes completo
  const historico = useMemo(() => {
    const hoy = new Date()
    const fixedMonthly  = gastosFijos.reduce((s, x) => s + Number(x.monto||0), 0)
    const subsMonthly   = suscripciones.filter(s => s.estado === 'Activo').reduce((s, x) => s + Number(x.costo||0), 0)
    const recurrenteMes = fixedMonthly + subsMonthly

    return Array.from({ length: 6 }, (_, i) => {
      const offset = 5 - i
      const d    = new Date(hoy.getFullYear(), hoy.getMonth() - offset, 1)
      const mes  = d.getMonth()
      const año  = d.getFullYear()
      const ini  = new Date(año, mes, 1)
      const fin  = new Date(año, mes+1, 0)

      const totalIng = enRango(ingresos, ini, fin).reduce((s, x) => s + Number(x.monto||0), 0)
      const totalGst = enRango(gastos,   ini, fin).reduce((s, x) => s + Number(x.monto||0), 0)

      // Gastos recurrentes se aplican a TODOS los meses (son mensuales)
      const gastoTotal = totalGst + recurrenteMes

      return {
        mes:      MESES[mes],
        mesLargo: `${MESES_L[mes]} ${año}`,
        ingresos: totalIng,
        gastoVar: totalGst,
        gastoRec: recurrenteMes,
        gastos:   gastoTotal,
        balance:  totalIng - gastoTotal,
        esActual: i === 5,
      }
    })
  }, [ingresos, gastos, gastosFijos, suscripciones])

  // ── Métricas del rango seleccionado ──────────────────────────────────────
  const metricas = useMemo(() => {
    const { inicio, fin, meses } = getRango(rango)

    const ing = enRango(ingresos, inicio, fin)
    const gst = enRango(gastos,   inicio, fin)

    const totalIng = ing.reduce((s, x) => s + Number(x.monto||0), 0)
    const totalGst = gst.reduce((s, x) => s + Number(x.monto||0), 0)

    // Gastos recurrentes × número de meses cubiertos por el rango
    const recurrente  = totalRecurrente(gastosFijos, suscripciones, meses)
    const gastosTotales = totalGst + recurrente
    const balance     = totalIng - gastosTotales
    const tasaAhorro  = totalIng > 0 ? (balance / totalIng) * 100 : 0
    const deudaTotal  = deudas.reduce((s, d) => s + Number(d.saldo||0), 0)

    // Categorías solo de gastos variables (los recurrentes son fijos)
    const porCategoria = {}
    gst.forEach(g => {
      const c = g.categoria || 'Otros'
      porCategoria[c] = (porCategoria[c] || 0) + Number(g.monto||0)
    })
    // Agregar gastosFijos como categoría "Gastos fijos"
    if (gastosFijos.length > 0) {
      const tFijos = gastosFijos.reduce((s, x) => s + Number(x.monto||0), 0) * meses
      if (tFijos > 0) porCategoria['Gastos fijos'] = (porCategoria['Gastos fijos']||0) + tFijos
    }
    // Agregar suscripciones
    const tSubs = suscripciones.filter(s => s.estado === 'Activo').reduce((s, x) => s + Number(x.costo||0), 0) * meses
    if (tSubs > 0) porCategoria['Suscripciones'] = (porCategoria['Suscripciones']||0) + tSubs

    // Mes anterior para comparar tendencias (siempre el mes inmediatamente anterior al rango)
    const mesAntIni  = new Date(inicio.getFullYear(), inicio.getMonth()-1, 1)
    const mesAntFin  = new Date(inicio.getFullYear(), inicio.getMonth(), 0)
    const ingAnt     = enRango(ingresos, mesAntIni, mesAntFin).reduce((s, x) => s + Number(x.monto||0), 0)
    const gstAnt     = enRango(gastos,   mesAntIni, mesAntFin).reduce((s, x) => s + Number(x.monto||0), 0)
    const recurrAnt  = totalRecurrente(gastosFijos, suscripciones, 1)
    const gstAntTotal = gstAnt + recurrAnt

    // Promedio mensual del histórico (excluyendo meses en cero)
    const mesesConData = historico.filter(h => h.ingresos > 0 || h.gastos > 0)
    const promedioIng  = mesesConData.length > 0 ? mesesConData.reduce((s, h) => s + h.ingresos, 0) / mesesConData.length : 0
    const promedioGst  = mesesConData.length > 0 ? mesesConData.reduce((s, h) => s + h.gastos,   0) / mesesConData.length : 0

    // Proyección fin de mes (solo para mes actual)
    let proyeccionMes = null
    if (rango === 'mes_actual') {
      const hoy        = new Date()
      const diasMes    = fin.getDate()
      const diaActual  = hoy.getDate()
      const ritmoDiario = diaActual > 0 ? totalGst / diaActual : 0
      proyeccionMes = ritmoDiario * diasMes + recurrente
    }

    return {
      totalIng, gastosTotales, balance, tasaAhorro, deudaTotal,
      porCategoria, inicio, fin, meses,
      prev: { ingresos: ingAnt, gastos: gstAntTotal },
      promedioIng, promedioGst,
      proyeccionMes,
      recurrente,
    }
  }, [rango, ingresos, gastos, gastosFijos, suscripciones, deudas, historico])

  const pieData = useMemo(() =>
    Object.entries(metricas.porCategoria)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)
  , [metricas.porCategoria])

  const rangoLabel = RANGOS.find(r => r.id === rango)?.label || rango

  // ── Exportar PDF PROFESIONAL ──────────────────────────────────────────────
  const exportarPDF = async () => {
    setExportando(true)
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const W   = doc.internal.pageSize.getWidth()   // 210
      const H   = doc.internal.pageSize.getHeight()  // 297
      const M   = 16   // margin
      const CW  = W - M*2  // content width = 178
      let y = 0

      // ── PORTADA / ENCABEZADO ──────────────────────────────────────────────
      // Franja superior oscura
      doc.setFillColor(10, 14, 38)
      doc.rect(0, 0, W, 38, 'F')

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(18)
      doc.setTextColor(255, 255, 255)
      doc.text('FinGuide - Mis Reportes', W/2, 16, { align: 'center' })

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(180, 180, 200)
      doc.text(`${rangoLabel}  |  Generado: ${new Date().toLocaleDateString('es-DO')}  |  Periodo: ${metricas.inicio.toLocaleDateString('es-DO')} - ${metricas.fin.toLocaleDateString('es-DO')}`, W/2, 26, { align: 'center' })

      doc.setTextColor(100, 100, 150)
      doc.setFontSize(7.5)
      doc.text('Reporte confidencial generado automaticamente por FinGuide App', W/2, 34, { align: 'center' })

      y = 46

      // ── SECCION 1: RESUMEN EJECUTIVO ─────────────────────────────────────
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(40, 40, 80)
      doc.text('1. RESUMEN EJECUTIVO', M, y)
      doc.setDrawColor(200, 200, 230)
      doc.line(M, y+2, W-M, y+2)
      y += 8

      // 4 tarjetas métricas
      const cardW  = (CW - 6) / 4
      const cards  = [
        { label: 'INGRESOS',   value: metricas.totalIng,      color: [16,185,129] },
        { label: 'GASTOS',     value: metricas.gastosTotales,  color: [239,68,68]  },
        { label: 'BALANCE',    value: metricas.balance,        color: metricas.balance >= 0 ? [59,130,246] : [220,50,50] },
        { label: 'DEUDA TOTAL',value: metricas.deudaTotal,     color: [139,92,246] },
      ]
      cards.forEach((c, i) => {
        const x = M + i*(cardW+2)
        // fondo con color suave
        doc.setFillColor(c.color[0], c.color[1], c.color[2])
        doc.setGState(new doc.GState({ opacity: 0.12 }))
        doc.roundedRect(x, y, cardW, 22, 2, 2, 'F')
        doc.setGState(new doc.GState({ opacity: 1 }))
        doc.setDrawColor(...c.color)
        doc.roundedRect(x, y, cardW, 22, 2, 2, 'S')

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(6.5)
        doc.setTextColor(...c.color)
        doc.text(c.label, x + cardW/2, y+7, { align: 'center' })

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(11)
        doc.setTextColor(20, 20, 20)
        const valStr = fmt(c.value)
        doc.text(valStr, x + cardW/2, y+17, { align: 'center' })
      })
      y += 28

      // Indicadores clave en línea
      const tasaAhorro = metricas.tasaAhorro
      const estado = tasaAhorro >= 20 ? 'Excelente' : tasaAhorro >= 10 ? 'Bueno' : tasaAhorro >= 0 ? 'Regular' : 'Deficit'

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8.5)
      doc.setTextColor(60,60,60)
      const kpis = [
        `Tasa de ahorro: ${tasaAhorro.toFixed(1)}%  (${estado})`,
        `Gastos variables: ${fmt(metricas.gastosTotales - metricas.recurrente)}`,
        `Gastos recurrentes: ${fmt(metricas.recurrente)}`,
        metricas.proyeccionMes ? `Proyeccion fin de mes: ${fmt(metricas.proyeccionMes)}` : null,
      ].filter(Boolean)
      kpis.forEach(kpi => { doc.text(`- ${kpi}`, M+4, y); y += 5.5 })

      // Alerta si deficit
      if (metricas.balance < 0) {
        y += 2
        doc.setFillColor(255, 240, 240)
        doc.roundedRect(M, y, CW, 12, 2, 2, 'F')
        doc.setDrawColor(220, 60, 60)
        doc.roundedRect(M, y, CW, 12, 2, 2, 'S')
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(8)
        doc.setTextColor(180, 30, 30)
        doc.text('ATENCION: Balance negativo este periodo. Tus gastos superan tus ingresos.', M+4, y+8)
        y += 17
      } else {
        y += 5
      }

      // ── SECCION 2: EVOLUCION MENSUAL ──────────────────────────────────────
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(40, 40, 80)
      doc.text('2. EVOLUCION MENSUAL (ultimos 6 meses)', M, y)
      doc.setDrawColor(200, 200, 230)
      doc.line(M, y+2, W-M, y+2)
      y += 8

      // Encabezado tabla
      const colWidths  = [42, 35, 35, 35, 31]
      const colHeaders = ['Mes', 'Ingresos', 'Gastos Var.', 'G. Recur.', 'Balance']
      const colX       = colHeaders.map((_, i) => M + colWidths.slice(0, i).reduce((a, b) => a+b, 0))

      doc.setFillColor(40, 40, 80)
      doc.rect(M, y, CW, 8, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7.5)
      doc.setTextColor(255,255,255)
      colHeaders.forEach((h, i) => doc.text(h, colX[i]+1, y+5.5))
      y += 8

      historico.forEach((row, ri) => {
        const isEven = ri % 2 === 0
        if (isEven) {
          doc.setFillColor(245,245,255)
          doc.rect(M, y, CW, 7, 'F')
        }
        if (row.esActual) {
          doc.setDrawColor(99,102,241)
          doc.setLineWidth(0.4)
          doc.rect(M, y, CW, 7, 'S')
          doc.setLineWidth(0.2)
        }
        doc.setFont('helvetica', row.esActual ? 'bold' : 'normal')
        doc.setFontSize(7.5)
        doc.setTextColor(30,30,30)
        doc.text(row.mesLargo, colX[0]+1, y+5)

        const vals = [row.ingresos, row.gastoVar, row.gastoRec, row.balance]
        vals.forEach((v, i) => {
          const isBalance = i === 3
          doc.setTextColor(isBalance ? (v >= 0 ? 16 : 200) : 30, isBalance ? (v >= 0 ? 120 : 30) : 30, isBalance ? (v >= 0 ? 80 : 30) : 30)
          doc.text(fmt(v), colX[i+1] + colWidths[i+1] - 2, y+5, { align: 'right' })
        })
        y += 7
      })

      // Fila promedio
      doc.setFillColor(230,230,250)
      doc.rect(M, y, CW, 7, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7.5)
      doc.setTextColor(50,50,100)
      doc.text('Promedio mensual', colX[0]+1, y+5)
      doc.text(fmt(metricas.promedioIng), colX[1] + colWidths[1] - 2, y+5, { align: 'right' })
      doc.text(fmt(metricas.promedioGst), colX[2] + colWidths[2] - 2, y+5, { align: 'right' })
      y += 12

      // ── SECCION 3: ANALISIS DE GASTOS POR CATEGORIA ───────────────────────
      if (pieData.length > 0) {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(10)
        doc.setTextColor(40, 40, 80)
        doc.text('3. DISTRIBUCION DE GASTOS POR CATEGORIA', M, y)
        doc.setDrawColor(200, 200, 230)
        doc.line(M, y+2, W-M, y+2)
        y += 8

        const catColX = [M, M+80, M+120, M+148, M+162]
        doc.setFillColor(40,40,80)
        doc.rect(M, y, CW, 7, 'F')
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(7)
        doc.setTextColor(255,255,255)
        ;['Categoria', 'Monto', '% del Total', 'Barra', ''].forEach((h, i) => doc.text(h, catColX[i]+1, y+5))
        y += 7

        pieData.forEach((cat, ri) => {
          if (ri % 2 === 0) { doc.setFillColor(248,248,255); doc.rect(M, y, CW, 7, 'F') }
          const pct = metricas.gastosTotales > 0 ? (cat.value / metricas.gastosTotales) * 100 : 0
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(7.5)
          doc.setTextColor(30,30,30)
          doc.text(cat.name.substring(0, 18), catColX[0]+1, y+5)
          doc.text(fmt(cat.value), catColX[1] + 38, y+5, { align: 'right' })
          doc.text(`${pct.toFixed(1)}%`, catColX[2]+1, y+5)
          // Mini barra visual
          doc.setFillColor(200,200,220)
          doc.rect(catColX[3]+1, y+2, 30, 3, 'F')
          const barW = Math.max(1, (pct/100) * 30)
          const colArr = [
            [139,92,246],[6,182,212],[245,158,11],[236,72,153],[16,185,129],[59,130,246]
          ]
          doc.setFillColor(...(colArr[ri % colArr.length]))
          doc.rect(catColX[3]+1, y+2, barW, 3, 'F')
          y += 7
        })
        y += 5
      }

      // ── SECCION 4: ANALISIS DE DEUDAS ────────────────────────────────────
      if (deudas.length > 0) {
        // Nueva página si no hay espacio
        if (y > H - 60) { doc.addPage(); y = M }

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(10)
        doc.setTextColor(40, 40, 80)
        doc.text('4. ANALISIS DE DEUDAS', M, y)
        doc.setDrawColor(200, 200, 230)
        doc.line(M, y+2, W-M, y+2)
        y += 8

        const dColX = [M, M+65, M+105, M+135, M+158]
        doc.setFillColor(100,30,30)
        doc.rect(M, y, CW, 7, 'F')
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(7)
        doc.setTextColor(255,255,255)
        ;['Deuda / Institución', 'Tipo', 'Saldo', 'Interes Anual', 'Uso Crédito'].forEach((h, i) => doc.text(h, dColX[i]+1, y+5))
        y += 7

        deudas.forEach((d, ri) => {
          if (ri % 2 === 0) { doc.setFillColor(255,248,248); doc.rect(M, y, CW, 7, 'F') }
          const pctUso = d.limite_credito > 0 ? Math.min(100, (d.saldo/d.limite_credito)*100) : 0
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(7.5)
          doc.setTextColor(30,30,30)
          doc.text((d.nombre||d.cuenta||'Deuda').substring(0, 22), dColX[0]+1, y+5)
          doc.text(d.tipo||'Tarjeta', dColX[1]+1, y+5)
          doc.setTextColor(180,30,30)
          doc.text(fmt(d.saldo), dColX[2] + 28, y+5, { align: 'right' })
          doc.setTextColor(30,30,30)
          doc.text(d.interes_anual ? `${d.interes_anual}%` : '-', dColX[3]+1, y+5)
          if (d.limite_credito > 0) {
            const barColor = pctUso > 70 ? [220,60,60] : pctUso > 40 ? [200,140,20] : [30,150,80]
            doc.setFillColor(210,210,210)
            doc.rect(dColX[4]+1, y+2.5, 25, 3, 'F')
            doc.setFillColor(...barColor)
            doc.rect(dColX[4]+1, y+2.5, Math.max(1,(pctUso/100)*25), 3, 'F')
            doc.setFontSize(6.5)
            doc.setTextColor(80,80,80)
            doc.text(`${pctUso.toFixed(0)}%`, dColX[4]+27, y+5)
          } else {
            doc.setFontSize(6.5)
            doc.setTextColor(150,150,150)
            doc.text('N/D', dColX[4]+1, y+5)
          }
          y += 7
        })

        // Total deudas
        doc.setFillColor(220,220,240)
        doc.rect(M, y, CW, 7, 'F')
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(7.5)
        doc.setTextColor(50,50,100)
        doc.text('Total deuda', dColX[0]+1, y+5)
        doc.setTextColor(180,30,30)
        doc.text(fmt(metricas.deudaTotal), dColX[2] + 28, y+5, { align: 'right' })
        y += 12
      }

      // ── SECCION 5: RECOMENDACIONES ────────────────────────────────────────
      if (y > H - 55) { doc.addPage(); y = M }

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(40, 40, 80)
      const numSec = deudas.length > 0 ? '5' : '4'
      doc.text(`${numSec}. PUNTOS DE ACCION`, M, y)
      doc.setDrawColor(200, 200, 230)
      doc.line(M, y+2, W-M, y+2)
      y += 8

      const recomendaciones = []
      if (metricas.balance < 0) {
        recomendaciones.push(`Deficit de ${fmt(Math.abs(metricas.balance))} - Revisar gastos no esenciales y aumentar ingresos.`)
      }
      if (metricas.tasaAhorro < 10 && metricas.tasaAhorro >= 0) {
        recomendaciones.push(`Tasa de ahorro del ${metricas.tasaAhorro.toFixed(1)}% - Meta recomendada: 20%. Reduce gastos variables.`)
      }
      if (metricas.deudaTotal > metricas.totalIng * 3 && metricas.deudaTotal > 0) {
        recomendaciones.push(`Deuda elevada (${fmt(metricas.deudaTotal)}). Considera plan de pago agresivo con metodo avalancha.`)
      }
      if (metricas.recurrente > metricas.totalIng * 0.4 && metricas.totalIng > 0) {
        recomendaciones.push(`Gastos recurrentes representan el ${((metricas.recurrente/metricas.totalIng)*100).toFixed(0)}% de tus ingresos. Revisa suscripciones activas.`)
      }
      if (metricas.proyeccionMes && metricas.proyeccionMes > metricas.totalIng && metricas.totalIng > 0) {
        recomendaciones.push(`Proyeccion de fin de mes: ${fmt(metricas.proyeccionMes)}. Tu ritmo actual supera tus ingresos.`)
      }
      if (recomendaciones.length === 0) {
        recomendaciones.push('Tus finanzas estan bien encaminadas. Mantiene el ritmo de ahorro actual.')
        recomendaciones.push('Considera incrementar el fondo de emergencia (3-6 meses de gastos).')
      }

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8.5)
      doc.setTextColor(40, 40, 40)
      recomendaciones.forEach((r, i) => {
        const lines = doc.splitTextToSize(`${i+1}. ${r}`, CW - 6)
        doc.text(lines, M+3, y)
        y += lines.length * 5.5 + 2
      })

      // ── PIE DE PÁGINA ────────────────────────────────────────────────────
      const totalPages = doc.internal.getNumberOfPages()
      for (let pg = 1; pg <= totalPages; pg++) {
        doc.setPage(pg)
        doc.setFillColor(10, 14, 38)
        doc.rect(0, H-12, W, 12, 'F')
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(7)
        doc.setTextColor(150, 150, 180)
        doc.text('FinGuide App - Reporte Financiero Personal - Informacion confidencial', M, H-5)
        doc.text(`Pagina ${pg} de ${totalPages}`, W-M, H-5, { align: 'right' })
      }

      // ── DESCARGA ─────────────────────────────────────────────────────────
      const blob = doc.output('blob')
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `finguide-reporte-${rango}-${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url) }, 100)
      toast.success('Reporte PDF descargado correctamente')
    } catch (e) {
      console.error('Error PDF:', e)
      toast.error('Error generando PDF: ' + e.message)
    } finally {
      setExportando(false)
    }
  }

  // ── Render de cada tab ───────────────────────────────────────────────────
  const renderTab = () => {
    switch (tab) {
      // ── RESUMEN ──────────────────────────────────────────────────────────
      case 'resumen': return (
        <div className="space-y-4">
          {/* 4 metrics */}
          <div className="grid grid-cols-2 gap-3">
            <MetricCard label="Ingresos"     value={metricas.totalIng}     prev={metricas.prev?.ingresos} color="#10b981" icon={TrendingUp} />
            <MetricCard label="Gastos total" value={metricas.gastosTotales} prev={metricas.prev?.gastos}  color="#ef4444" icon={TrendingDown} />
            <MetricCard label="Balance"  value={metricas.balance} color={metricas.balance >= 0 ? '#3b82f6' : '#ef4444'} icon={Wallet}
              sub={metricas.balance >= 0 ? 'Mes positivo ✓' : 'Atencion: gastos > ingresos'} />
            <MetricCard label="Tasa de ahorro" value={metricas.tasaAhorro} color="#8b5cf6" icon={Sparkles} isPercent
              sub={metricas.tasaAhorro >= 20 ? 'Excelente' : metricas.tasaAhorro >= 10 ? 'Buen ritmo' : metricas.tasaAhorro >= 0 ? 'Mejorable' : 'En deficit'} />
          </div>

          {/* Desglose gastos variables vs recurrentes */}
          <div className="rounded-2xl p-4 space-y-3" style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-[11px] font-black text-white uppercase tracking-wider">Desglose de gastos</p>
            {[
              { label:'Variables (este periodo)', value: metricas.gastosTotales - metricas.recurrente, color:'#ef4444' },
              { label:'Recurrentes (fijos + suscr.)', value: metricas.recurrente, color:'#f59e0b' },
            ].map(item => {
              const pct = metricas.gastosTotales > 0 ? (item.value / metricas.gastosTotales) * 100 : 0
              return (
                <div key={item.label}>
                  <div className="flex justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: item.color }}/>
                      <span className="text-[11px] text-gray-400">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-500">{pct.toFixed(0)}%</span>
                      <span className="text-[12px] font-black text-white">{fmt(item.value)}</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background:'rgba(255,255,255,0.06)' }}>
                    <div className="h-full rounded-full transition-all duration-700" style={{ width:`${pct}%`, background:item.color }}/>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Proyección fin de mes (solo mes actual) */}
          {metricas.proyeccionMes && (
            <div className="rounded-2xl p-4" style={{
              background: metricas.proyeccionMes > metricas.totalIng ? 'rgba(239,68,68,0.07)' : 'rgba(16,185,129,0.07)',
              border:`1px solid ${metricas.proyeccionMes > metricas.totalIng ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}`,
            }}>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-600 mb-1">Proyeccion fin de mes</p>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xl font-black text-white">{fmt(metricas.proyeccionMes)}</p>
                  <p className="text-[10px] text-gray-600 mt-0.5">Basado en tu ritmo actual de gasto</p>
                </div>
                {metricas.proyeccionMes > metricas.totalIng
                  ? <span className="text-[11px] font-bold text-red-400">Superara ingresos</span>
                  : <span className="text-[11px] font-bold text-emerald-400">Dentro del presupuesto</span>
                }
              </div>
            </div>
          )}

          {/* Gráfica área */}
          <div className="rounded-2xl p-4" style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-[11px] font-black text-white uppercase tracking-wider mb-3">Flujo de caja · 6 meses</p>
            <ResponsiveContainer width="100%" height={150}>
              <AreaChart data={historico} margin={{ top:4, right:4, left:-28, bottom:0 }}>
                <defs>
                  <linearGradient id="gI" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/><stop offset="95%" stopColor="#10b981" stopOpacity={0.02}/></linearGradient>
                  <linearGradient id="gG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.35}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0.02}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 6" stroke="rgba(255,255,255,0.04)" vertical={false}/>
                <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fill:'#6b7280', fontSize:11, fontWeight:700 }}/>
                <YAxis axisLine={false} tickLine={false} tick={{ fill:'#4b5563', fontSize:10 }} tickFormatter={fmtK}/>
                <Tooltip content={<CustomTooltip />}/>
                <Area type="monotone" dataKey="ingresos" name="Ingresos" stroke="#10b981" strokeWidth={2} fill="url(#gI)" dot={false} activeDot={{ r:4, fill:'#10b981' }}/>
                <Area type="monotone" dataKey="gastos"   name="Gastos"   stroke="#ef4444" strokeWidth={2} fill="url(#gG)" dot={false} activeDot={{ r:4, fill:'#ef4444' }}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Alerta déficit */}
          {metricas.balance < 0 && (
            <div className="flex items-start gap-3 p-3 rounded-2xl" style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)' }}>
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5"/>
              <div>
                <p className="text-[12px] font-bold text-red-400">Balance negativo este periodo</p>
                <p className="text-[11px] text-gray-500 mt-0.5">Tus gastos superan tus ingresos por {fmt(Math.abs(metricas.balance))}. Revisa tus suscripciones y gastos no esenciales.</p>
              </div>
            </div>
          )}
        </div>
      )

      // ── COMPARAR ─────────────────────────────────────────────────────────
      case 'comparar': return (
        <div className="space-y-4">
          <p className="text-[11px] text-gray-600 font-medium">Comparacion mes a mes — ultimos 6 meses</p>

          <div className="rounded-2xl p-4" style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)' }}>
            <ResponsiveContainer width="100%" height={170}>
              <BarChart data={historico} margin={{ top:4, right:4, left:-28, bottom:0 }} barGap={2} barCategoryGap="25%">
                <CartesianGrid strokeDasharray="2 6" stroke="rgba(255,255,255,0.04)" vertical={false}/>
                <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fill:'#6b7280', fontSize:11, fontWeight:700 }}/>
                <YAxis axisLine={false} tickLine={false} tick={{ fill:'#4b5563', fontSize:10 }} tickFormatter={fmtK}/>
                <Tooltip content={<CustomTooltip />} cursor={{ fill:'rgba(255,255,255,0.03)', radius:8 }}/>
                <Bar dataKey="ingresos" name="Ingresos" radius={[4,4,0,0]} maxBarSize={22}>
                  {historico.map((d,i) => <Cell key={i} fill={d.esActual ? '#10b981' : 'rgba(16,185,129,0.3)'}/>)}
                </Bar>
                <Bar dataKey="gastos" name="Gastos" radius={[4,4,0,0]} maxBarSize={22}>
                  {historico.map((d,i) => <Cell key={i} fill={d.esActual ? '#ef4444' : 'rgba(239,68,68,0.3)'}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-4 justify-center mt-2">
              {[{color:'#10b981',label:'Ingresos'},{color:'#ef4444',label:'Gastos'}].map(s => (
                <div key={s.label} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background:s.color }}/><span className="text-[10px] text-gray-500 font-semibold">{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tabla mes a mes — solo meses con datos */}
          <div className="rounded-2xl overflow-hidden" style={{ border:'1px solid rgba(255,255,255,0.07)' }}>
            <div className="grid grid-cols-4 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-gray-600" style={{ background:'rgba(255,255,255,0.04)' }}>
              <span>Mes</span><span className="text-right">Ingresos</span><span className="text-right">Gastos</span><span className="text-right">Balance</span>
            </div>
            {historico.map((d, i) => (
              <div key={i} className="grid grid-cols-4 px-3 py-3 border-t border-white/5"
                style={{ background: d.esActual ? 'rgba(99,102,241,0.08)' : 'transparent' }}>
                <span className="text-[11px] font-bold text-white flex items-center gap-1">
                  {d.mes}{d.esActual && <span className="text-[8px] text-indigo-400 font-black">actual</span>}
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

      // ── CATEGORÍAS ───────────────────────────────────────────────────────
      case 'categorias': return (
        <div className="space-y-4">
          {pieData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3" style={{ background:'rgba(255,255,255,0.05)' }}>
                <PieChart className="w-8 h-8 text-gray-600"/>
              </div>
              <p className="text-sm font-semibold text-gray-500">Sin gastos en este periodo</p>
              <p className="text-xs text-gray-600 mt-1">Cambia el rango de fecha o agrega gastos</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-4 rounded-2xl p-4" style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)' }}>
                <div className="relative shrink-0" style={{ width:110, height:110 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={32} outerRadius={50} paddingAngle={3} dataKey="value" stroke="transparent">
                        {pieData.map((_, i) => <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]}/>)}
                      </Pie>
                    </RechartsPieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[8px] text-gray-500 font-bold uppercase">Total</span>
                    <span className="text-[12px] font-black text-white leading-tight">{fmtK(metricas.gastosTotales)}</span>
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
                            <span className="text-[11px] font-semibold text-gray-300 truncate max-w-[90px]">{cat.name}</span>
                          </div>
                          <span className="text-[10px] font-black text-white">{pct}%</span>
                        </div>
                        <div className="h-1 rounded-full" style={{ background:'rgba(255,255,255,0.06)' }}>
                          <div className="h-full rounded-full transition-all duration-700" style={{ width:`${pct}%`, background: CAT_COLORS[i % CAT_COLORS.length] }}/>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
              <div className="space-y-2">
                {pieData.map((cat, i) => (
                  <div key={cat.name} className="flex items-center justify-between p-3 rounded-xl" style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm" style={{ background:`${CAT_COLORS[i % CAT_COLORS.length]}18` }}>
                        {['🛒','🏠','🚗','🎭','🍔','💊'][i] || '📦'}
                      </div>
                      <div>
                        <p className="text-[12px] font-bold text-white">{cat.name}</p>
                        <p className="text-[10px] text-gray-600">{metricas.gastosTotales > 0 ? ((cat.value/metricas.gastosTotales)*100).toFixed(0) : 0}% del total de gastos</p>
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

      // ── DEUDAS ───────────────────────────────────────────────────────────
      case 'deudas': return (
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1 rounded-2xl p-4" style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)' }}>
              <p className="text-[10px] font-black uppercase tracking-widest text-red-400 mb-1">Deuda total</p>
              <p className="text-2xl font-black text-white">{fmt(metricas.deudaTotal)}</p>
            </div>
            <div className="flex-1 rounded-2xl p-4" style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)' }}>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-600 mb-1">Deudas activas</p>
              <p className="text-2xl font-black text-white">{deudas.length}</p>
              <p className="text-[10px] text-gray-600">cuentas registradas</p>
            </div>
          </div>
          {deudas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <CheckCircle className="w-12 h-12 text-emerald-600 mb-3"/>
              <p className="text-sm font-semibold text-gray-500">Sin deudas registradas</p>
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
                    {d.interes_anual && <p className="text-[10px] text-yellow-500 font-bold mb-2">{d.interes_anual}% interes anual</p>}
                    {d.limite_credito > 0 && (
                      <div>
                        <div className="flex justify-between text-[9px] text-gray-600 mb-1">
                          <span>Uso: {pctUso.toFixed(0)}%</span>
                          <span>Limite: {fmt(d.limite_credito)}</span>
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

  // ── Render principal ──────────────────────────────────────────────────────
  const content = (
    <div
      className="fixed inset-0 z-[9998] flex items-end sm:items-center justify-center"
      style={{ background:'rgba(0,0,0,0.75)', backdropFilter:'blur(14px)', opacity:visible?1:0, transition:'opacity 0.3s ease' }}
      onClick={e => { if (e.target === e.currentTarget) cerrar() }}
    >
      <div
        className="relative w-full sm:max-w-lg flex flex-col rounded-t-[2rem] sm:rounded-[2rem] overflow-hidden"
        style={{
          background:'linear-gradient(160deg, rgba(12,17,36,0.99) 0%, rgba(5,8,18,0.99) 100%)',
          border:'1px solid rgba(255,255,255,0.08)',
          boxShadow:'0 -24px 80px -12px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.05)',
          maxHeight:'92dvh',
          transform:visible?'translateY(0)':'translateY(30px)',
          transition:'transform 0.32s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-24 pointer-events-none" style={{ background:'radial-gradient(ellipse, rgba(99,102,241,0.1) 0%, transparent 70%)' }}/>

        {/* Handle mobile */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-white/15"/>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background:'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow:'0 4px 16px rgba(99,102,241,0.4)' }}>
              <BarChart2 className="w-4 h-4 text-white"/>
            </div>
            <div>
              <h1 className="text-[15px] font-black text-white leading-tight">Mis Reportes</h1>
              <p className="text-[10px] text-gray-600 font-medium">Analisis financiero personal</p>
            </div>
          </div>
          <button onClick={cerrar} className="w-8 h-8 rounded-full flex items-center justify-center bg-white/7 hover:bg-white/14 transition-all touch-manipulation">
            <X className="w-4 h-4 text-gray-500"/>
          </button>
        </div>

        {/* Rango + Export */}
        <div className="px-5 pb-3 flex items-center gap-2 shrink-0">
          <div className="flex gap-1.5 flex-1 overflow-x-auto scrollbar-hide">
            {RANGOS.map(r => (
              <button key={r.id} onClick={() => setRango(r.id)}
                className="shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all touch-manipulation active:scale-95"
                style={{ background:rango===r.id?'rgba(99,102,241,0.25)':'rgba(255,255,255,0.05)', color:rango===r.id?'#a5b4fc':'#6b7280', border:`1px solid ${rango===r.id?'rgba(99,102,241,0.4)':'rgba(255,255,255,0.07)'}` }}
              >{r.label}</button>
            ))}
          </div>
          <button onClick={exportarPDF} disabled={exportando}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all touch-manipulation active:scale-95 disabled:opacity-50"
            style={{ background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', boxShadow:'0 4px 14px rgba(99,102,241,0.35)' }}
          >
            {exportando ? <span className="animate-spin text-sm">⏳</span> : <><Download className="w-3.5 h-3.5"/>PDF</>}
          </button>
        </div>

        {/* Tabs */}
        <div className="px-5 pb-3 flex gap-1.5 overflow-x-auto scrollbar-hide shrink-0">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-[12px] font-bold transition-all touch-manipulation active:scale-95"
              style={{ background:tab===t.id?'rgba(255,255,255,0.1)':'rgba(255,255,255,0.04)', color:tab===t.id?'#fff':'#6b7280', border:`1px solid ${tab===t.id?'rgba(255,255,255,0.18)':'rgba(255,255,255,0.05)'}` }}
            ><span>{t.emoji}</span>{t.label}</button>
          ))}
        </div>

        <div className="h-px mx-5 shrink-0" style={{ background:'rgba(255,255,255,0.06)' }}/>

        {/* Contenido scrollable */}
        <div className="flex-1 overflow-y-auto p-5 overscroll-contain" style={{ WebkitOverflowScrolling:'touch' }}>
          {renderTab()}
        </div>

        {/* Footer */}
        <div className="px-5 pb-6 pt-3 shrink-0">
          <div className="flex items-center justify-between text-[10px] text-gray-700">
            <span>{metricas.inicio?.toLocaleDateString('es-DO')} – {metricas.fin?.toLocaleDateString('es-DO')}</span>
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
