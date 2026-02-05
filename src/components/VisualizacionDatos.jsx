import React, { useState, useMemo } from 'react'
import { 
  BarChart3, PieChart, TrendingUp, TrendingDown, Download, 
CreditCard, Target, Eye, X, FileText, RefreshCw,
  ArrowUp, ArrowDown, Minus, AlertTriangle, CheckCircle,
  Building, Clock, Activity, Layers, Wallet
} from 'lucide-react'
import {
  LineChart as RechartsLineChart,
  AreaChart,
  BarChart,
  Bar,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart as RechartsPieChart,
  Pie,
  ReferenceLine
} from 'recharts'

// IMPORTANTE: Importar jsPDF para la función de PDF
import jsPDF from 'jspdf'

// Importaciones de utilidades de exportación reales (si existen)
import { exportToExcel, exportToCSV } from '../utils/exportUtils'

/**
 * Componente de Visualización de Datos Financieros (COMPLETO Y CORREGIDO)
 * Incluye generación de PDF real y manejo de errores.
 */
const VisualizacionDatos = ({ 
  onClose,
  // Datos financieros
  ingresos = [], 
  gastos = [], 
  gastosFijos = [],
  suscripciones = [],
  deudas = [],
  cuentas = [],
  // Cálculos
  calculosReales,
  calculosProyectados
}) => {
  const [pestanaActiva, setPestanaActiva] = useState('resumen')
  const [rangoFecha, setRangoFecha] = useState('mes_actual')


  const [exportando, setExportando] = useState(false)
  const [mostrarOpciones, setMostrarOpciones] = useState(false)

  // Paleta de colores
  const COLORS = {
    ingreso: '#10B981',
    ingresoGlow: 'rgba(16, 185, 129, 0.4)',
    gasto: '#EF4444',
    gastoGlow: 'rgba(239, 68, 68, 0.4)',
    balance: '#3B82F6',
    balanceGlow: 'rgba(59, 130, 246, 0.4)',
    purple: '#8B5CF6',
    orange: '#F59E0B',
    teal: '#14B8A6',
    pink: '#EC4899'
  }

  const CATEGORY_COLORS = [COLORS.purple, COLORS.blue, COLORS.teal, COLORS.orange, COLORS.pink]

  // --- 1. LOGICA DE FECHAS ---
const fechasFiltradas = useMemo(() => {
  const hoy = new Date()
  let inicio
  let fin

  switch (rangoFecha) {
    case 'mes_actual':
      inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
      fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)
      break

    case 'mes_anterior':
      inicio = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)
      fin = new Date(hoy.getFullYear(), hoy.getMonth(), 0)
      break

    case 'trimestre': {
      const trimestre = Math.floor(hoy.getMonth() / 3)
      inicio = new Date(hoy.getFullYear(), trimestre * 3, 1)
      fin = new Date(hoy.getFullYear(), trimestre * 3 + 3, 0)
      break
    }

    case 'año_actual':
      inicio = new Date(hoy.getFullYear(), 0, 1)
      fin = new Date(hoy.getFullYear(), 11, 31)
      break

    default:
      inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
      fin = hoy
  }

  return { inicio, fin }
}, [rangoFecha])


  // --- 2. FILTRADO DE DATOS ---
  const datosFiltrados = useMemo(() => {
    const { inicio, fin } = fechasFiltradas

    const filtrarPorFecha = (items, campoFecha = 'fecha') => {
      return items.filter(item => {
        const fecha = new Date(item[campoFecha])
        return fecha >= inicio && fecha <= fin
      })
    }

    return {
      ingresos: filtrarPorFecha(ingresos),
      gastos: filtrarPorFecha(gastos),
      gastosFijos: gastosFijos.filter(gf => {
        if (!gf.dia_venc) return false
        const vencimiento = new Date(fin.getFullYear(), fin.getMonth(), gf.dia_venc)
        return vencimiento >= inicio && vencimiento <= fin
      }),
      suscripciones: suscripciones.filter(s => {
        if (!s.proximo_pago) return false
        const proxPago = new Date(s.proximo_pago)
        return proxPago >= inicio && proxPago <= fin
      }),
      deudas: deudas,
      cuentas: cuentas
    }
  }, [ingresos, gastos, gastosFijos, suscripciones, deudas, cuentas, fechasFiltradas])

  // --- 3. GENERACIÓN DE DATOS HISTÓRICOS (Últimos 6 meses) ---
  const datosHistoricos = useMemo(() => {
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    const hoy = new Date()
    const mesActual = hoy.getMonth()
    
    return Array.from({ length: 6 }, (_, i) => {
      const mesIndex = (mesActual - 5 + i + 12) % 12
      const año = mesIndex > mesActual ? hoy.getFullYear() - 1 : hoy.getFullYear()
      
      const inicioMes = new Date(año, mesIndex, 1)
      const finMes = new Date(año, mesIndex + 1, 0)
      
      const ingresosDelMes = ingresos.filter(ing => {
        const fecha = new Date(ing.fecha)
        return fecha >= inicioMes && fecha <= finMes
      })
      
      const gastosDelMes = gastos.filter(g => {
        const fecha = new Date(g.fecha)
        return fecha >= inicioMes && fecha <= finMes
      })
      
      const totalIngresos = ingresosDelMes.reduce((sum, ing) => sum + Number(ing.monto || 0), 0)
      const totalGastos = gastosDelMes.reduce((sum, g) => sum + Number(g.monto || 0), 0)
      
      const gastosFijosEstimados = gastosFijos.reduce((sum, gf) => sum + Number(gf.monto || 0), 0)
      const suscripcionesEstimadas = suscripciones.filter(s => s.estado === 'Activo').reduce((sum, s) => sum + Number(s.costo || 0), 0)
      
      const gastosTotales = totalGastos + gastosFijosEstimados + suscripcionesEstimadas
      
      return {
        mes: meses[mesIndex],
        mesCompleto: `${meses[mesIndex]} ${año}`,
        ingresos: totalIngresos,
        gastos: gastosTotales,
        balance: totalIngresos - gastosTotales,
        transacciones: ingresosDelMes.length + gastosDelMes.length
      }
    })
  }, [ingresos, gastos, gastosFijos, suscripciones])

  // --- 4. CÁLCULO DE MÉTRICAS ---
  const metricas = useMemo(() => {
    const { ingresos: ing, gastos: gst, gastosFijos: gf, suscripciones: sub } = datosFiltrados

    const totalIngresos = ing.reduce((sum, i) => sum + Number(i.monto || 0), 0)
    const totalGastos = gst.reduce((sum, g) => sum + Number(g.monto || 0), 0)
    const totalGastosFijos = gf.reduce((sum, g) => sum + Number(g.monto || 0), 0)
    const totalSuscripciones = sub.reduce((sum, s) => sum + Number(s.costo || 0), 0)
    
    const gastosTotales = totalGastos + totalGastosFijos + totalSuscripciones
    const balance = totalIngresos - gastosTotales
    const tasaAhorro = totalIngresos > 0 ? (balance / totalIngresos) * 100 : 0

    const gastosPorCategoria = {}
    gst.forEach(g => {
      const cat = g.categoria || 'Sin categoría'
      gastosPorCategoria[cat] = (gastosPorCategoria[cat] || 0) + Number(g.monto || 0)
    })

    const ingresosPorFuente = {}
    ing.forEach(i => {
      const fuente = i.fuente || 'Sin especificar'
      ingresosPorFuente[fuente] = (ingresosPorFuente[fuente] || 0) + Number(i.monto || 0)
    })

    const deudaTotal = datosFiltrados.deudas.reduce((sum, d) => sum + Number(d.saldo || 0), 0)

    const avgIngresos = datosHistoricos.reduce((a, b) => a + b.ingresos, 0) / datosHistoricos.length
    const avgGastos = datosHistoricos.reduce((a, b) => a + b.gastos, 0) / datosHistoricos.length

    return {
      periodo: `${fechasFiltradas.inicio.toLocaleDateString()} - ${fechasFiltradas.fin.toLocaleDateString()}`,
      totalIngresos,
      totalGastos: gastosTotales,
      balance,
      tasaAhorro,
      gastosPorCategoria,
      ingresosPorFuente,
      deudaTotal,
      avgIngresos,
      avgGastos,
      contadores: {
        ingresos: ing.length,
        gastos: gst.length,
        gastosFijos: gf.length,
        suscripciones: sub.length,
        deudas: datosFiltrados.deudas.length,
        cuentas: datosFiltrados.cuentas.length
      }
    }
  }, [datosFiltrados, fechasFiltradas, datosHistoricos])

  const calcularTendencia = (actual, anterior) => {
    if (!anterior || anterior === 0) return { porcentaje: 0, direccion: 'igual' }
    const porcentaje = ((actual - anterior) / anterior) * 100
    const direccion = porcentaje > 0 ? 'subida' : porcentaje < 0 ? 'bajada' : 'igual'
    return { porcentaje: Math.abs(porcentaje), direccion }
  }

  const tendencias = {
    ingresos: calcularTendencia(metricas.totalIngresos, datosHistoricos[4]?.ingresos || 0),
    gastos: calcularTendencia(metricas.totalGastos, datosHistoricos[4]?.gastos || 0),
    balance: calcularTendencia(metricas.balance, datosHistoricos[4]?.balance || 0)
  }

  // --- 5. PREPARACIÓN DE DATOS PARA GRÁFICAS ---
  const dataPieChart = useMemo(() => {
    return Object.entries(metricas.gastosPorCategoria)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)
  }, [metricas.gastosPorCategoria])

  const pestanas = [
    { id: 'resumen', nombre: 'Resumen', icono: Layers },
    { id: 'tendencias', nombre: 'Tendencias', icono: Activity },
    { id: 'comparativo', nombre: 'Comparativo', icono: BarChart3 },
    { id: 'deudas', nombre: 'Deudas', icono: CreditCard },
  ]

  // --- 6. HELPER PDF (Definido UNA SOLA VEZ) ---
  const dibujarTabla = (doc, headers, data, startY, title) => {
    try {
      let y = startY
      const pageWidth = doc.internal.pageSize.getWidth()
      const margin = 20
      const tableWidth = pageWidth - (margin * 2)
      const colWidth = tableWidth / headers.length

      doc.setFont("helvetica", "bold")
      doc.setFontSize(12)
      doc.setTextColor(50, 50, 50)
      
      if (title) {
        doc.text(title, margin, y)
        y += 7
      }

      // Cabecera
      doc.setFillColor(240, 240, 240)
      doc.rect(margin, y, tableWidth, 10, 'F')
      doc.setTextColor(0, 0, 0)
      
      headers.forEach((h, i) => {
        doc.text(h, margin + (colWidth * i) + 2, y + 7)
      })
      y += 10

      // Filas
      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      
      data.forEach((row, rowIndex) => {
        if (rowIndex % 2 === 0) {
          doc.setFillColor(250, 250, 250)
          doc.rect(margin, y, tableWidth, 8, 'F')
        }
        
        row.forEach((cell, i) => {
          let cellText = String(cell || '')
          const x = margin + (colWidth * i) + 2
          
          if (typeof cell === 'number' || (typeof cell === 'string' && cell.includes('$'))) {
            doc.text(cellText, margin + (colWidth * (i + 1)) - 5, y + 5, { align: 'right' })
          } else {
            doc.text(cellText, x, y + 5)
          }
        })
        y += 8
      })
      
      return y + 10
    } catch (e) {
      console.error("Error dibujando tabla PDF:", e)
      return startY
    }
  }

  // --- 7. EXPORTACIÓN (PDF REAL Y COMPLETO) ---
  const handleExportar = async (tipo) => {
    setExportando(true)
    setMostrarOpciones(false)
    
    try {
      const data = {
        tipo: pestanaActiva,
        periodo: metricas.periodo,
        datos: datosFiltrados,
        metricas,
        historicos: datosHistoricos
      }
      
      const nombreArchivo = `finguide-${pestanaActiva}-${new Date().toISOString().split('T')[0]}`

      // --- CASO PDF (Generación Real) ---
      if (tipo === 'pdf') {
        if (typeof jsPDF === 'undefined') {
          throw new Error('La librería jsPDF no está instalada. Ejecuta: npm install jspdf')
        }

        const doc = new jsPDF()
        const pageWidth = doc.internal.pageSize.getWidth()
        let y = 20

        // 1. Encabezado
        doc.setFont("helvetica", "bold")
        doc.setFontSize(22)
        doc.setTextColor(59, 130, 246) 
        doc.text("FinGuide Reporte", pageWidth / 2, y, { align: 'center' })
        
        y += 10
        doc.setFontSize(14)
        doc.setTextColor(100, 100, 100)
        doc.text(`Reporte de ${pestanas.find(p => p.id === pestanaActiva).nombre}`, pageWidth / 2, y, { align: 'center' })
        
        y += 15
        doc.setDrawColor(220, 220, 220)
        doc.line(20, y, pageWidth - 20, y)
        y += 10

        // 2. Info Periodo
        doc.setFont("helvetica", "bold")
        doc.setFontSize(12)
        doc.setTextColor(50, 50, 50)
        doc.text(`Período:`, 20, y)
        doc.setFont("helvetica", "normal")
        doc.text(metricas.periodo, 45, y)
        
        y += 10
        doc.setFont("helvetica", "bold")
        doc.text(`Fecha de Generación:`, 20, y)
        doc.setFont("helvetica", "normal")
        doc.text(new Date().toLocaleString(), 60, y)

        y += 20

        // 3. Tarjetas
        const metricsData = [
          { label: 'Ingresos', val: (metricas.totalIngresos || 0), color: [16, 185, 129] },
          { label: 'Gastos', val: (metricas.totalGastos || 0), color: [239, 68, 68] },
          { label: 'Balance', val: (metricas.balance || 0), color: [59, 130, 246] },
          { label: 'Deuda', val: (metricas.deudaTotal || 0), color: [139, 92, 246] }
        ]

        const cardWidth = 40
        const cardXStart = 20
        
        metricsData.forEach((m, i) => {
          const x = cardXStart + (i * cardWidth) + (i * 5)
          
          doc.setFillColor(...m.color, 10)
          doc.roundedRect(x, y, cardWidth, 30, 3, 3, 'FD')
          doc.setDrawColor(...m.color)
          doc.roundedRect(x, y, cardWidth, 30, 3, 3, 'S')
          
          doc.setTextColor(...m.color)
          doc.setFont("helvetica", "bold")
          doc.setFontSize(10)
          doc.text(m.label, x + 5, y + 8)
          
          doc.setTextColor(0, 0, 0)
          doc.setFont("helvetica", "bold")
          doc.setFontSize(14)
          const valNum = Number(m.val)
          const valStr = isNaN(valNum) ? '0' : valNum.toLocaleString()
          doc.text(`$${valStr}`, x + 5, y + 20)
        })

        y += 50

        // 4. Contenido Dinámico
        doc.setFont("helvetica", "bold")
        doc.setFontSize(16)
        doc.setTextColor(50, 50, 50)
        doc.text("Detalle Financiero", 20, y)
        y += 15

        if (pestanaActiva === 'resumen' || pestanaActiva === 'tendencias' || pestanaActiva === 'comparativo') {
          // Tabla Histórica
          const headers = ["Mes", "Ingresos", "Gastos", "Balance"]
          const rows = datosHistoricos.map(d => [
            d.mesCompleto,
            `$${(d.ingresos || 0).toLocaleString()}`,
            `$${(d.gastos || 0).toLocaleString()}`,
            `$${(d.balance || 0).toLocaleString()}`
          ])
          y = dibujarTabla(doc, headers, rows, y, "Evolución Últimos 6 Meses")

          // Tabla Categorías
          if (pestanaActiva === 'resumen' && dataPieChart.length > 0) {
            const catHeaders = ["Categoría", "Monto"]
            const catRows = dataPieChart.map(c => [c.name, `$${(c.value || 0).toLocaleString()}`])
            y = dibujarTabla(doc, catHeaders, catRows, y, "Gastos por Categoría")
          }
        }

        if (pestanaActiva === 'deudas') {
          const headers = ["Deuda / Banco", "Saldo", "Interés"]
          const rows = datosFiltrados.deudas.map(d => [
            `${(d.nombre || d.cuenta || 'N/A')} (${d.tipo || 'Tarjeta'})`,
            `$${(d.saldo || 0).toLocaleString()}`,
            d.interes_anual ? `${d.interes_anual}%` : '-'
          ])
          y = dibujarTabla(doc, headers, rows, y, "Detalle de Deudas Activas")
        }

        // 5. Pie de Página
        const pageCount = doc.internal.getNumberOfPages()
        for(let i = 1; i <= pageCount; i++) {
          doc.setPage(i)
          doc.setFontSize(10)
          doc.setTextColor(150)
          doc.text(`Página ${i} de ${pageCount}`, pageWidth / 2, 285, { align: 'center' })
        }

        // 6. Descarga Segura (Método Blob)
        const pdfOutput = doc.output('blob')
        const url = URL.createObjectURL(pdfOutput)
        const a = document.createElement('a')
        a.href = url
        a.download = `${nombreArchivo}.pdf`
        document.body.appendChild(a)
        a.click()
        setTimeout(() => {
          document.body.removeChild(a)
          window.URL.revokeObjectURL(url)
        }, 100)

      } else if (tipo === 'xlsx') {
        if (typeof exportToExcel === 'function') await exportToExcel(data, { nombreArchivo })
        else alert('Función Excel no disponible.')
      } else if (tipo === 'csv') {
        if (typeof exportToCSV === 'function') await exportToCSV(data, { nombreArchivo })
        else alert('Función CSV no disponible.')
      } else if (tipo === 'json') {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${nombreArchivo}.json`
        a.click()
        URL.revokeObjectURL(url)
      }
      
    } catch (error) {
      console.error('Error al exportar:', error)
      alert(`Error: ${error.message}`)
    } finally {
      setExportando(false)
    }
  }

  // --- COMPONENTES UI ---

  // Tarjeta Métrica
  const TarjetaMetrica = ({ titulo, valor, valorAnterior, tendencia, icono: Icono, formato = 'moneda', color, subtitulo }) => {
    const isPositive = valor >= 0
    
    const formatear = (v) => {
      if (formato === 'moneda') return `$${v.toLocaleString()}`
      if (formato === 'porcentaje') return `${v.toFixed(1)}%`
      return v.toLocaleString()
    }

    const colorMap = {
      ingreso: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400' },
      gasto: { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400' },
      balance: { bg: isPositive ? 'bg-blue-500/10' : 'bg-red-500/10', border: isPositive ? 'border-blue-500/20' : 'border-red-500/20', text: isPositive ? 'text-blue-400' : 'text-red-400' },
      default: { bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-400' },
      red: { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400' },
      yellow: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', text: 'text-yellow-400' },
      purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-400' }
    }
    const theme = colorMap[color] || colorMap.default

    return (
      <div className={`bg-gradient-to-br from-white/5 to-transparent backdrop-blur-xl rounded-3xl p-6 border ${theme.border} hover:border-white/20 transition-all duration-300 relative overflow-hidden group`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-all" />
        <div className="relative z-10 flex flex-col h-full justify-between">
          <div className="flex items-start justify-between mb-4">
            <div className={`p-3 rounded-2xl ${theme.bg} shadow-lg border border-white/5`}>
              <Icono className={`w-6 h-6 ${theme.text}`} />
            </div>
            {tendencia && (
              <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${tendencia.direccion === 'subida' ? 'bg-green-500/10 text-green-400 border-green-500/20' : tendencia.direccion === 'bajada' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
                {tendencia.direccion === 'subida' ? <ArrowUp className="w-3 h-3"/> : tendencia.direccion === 'bajada' ? <ArrowDown className="w-3 h-3"/> : <Minus className="w-3 h-3"/>}
                {tendencia.porcentaje.toFixed(1)}%
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-gray-100 uppercase tracking-wider leading-tight">{titulo}</h3>
            {subtitulo && (<p className="text-xs text-gray-400 font-medium">{subtitulo}</p>)}
            <div className={`text-3xl font-extrabold text-white mt-1 ${theme.text} drop-shadow-sm`}>{formatear(valor)}</div>
          </div>

          {valorAnterior !== undefined && (
             <div className="text-xs text-gray-500 mt-3 font-mono border-t border-white/5 pt-2">vs Anterior: <span className="text-gray-300">{formatear(valorAnterior)}</span></div>
          )}
        </div>
      </div>
    )
  }

  // --- RENDERIZADO PRINCIPAL ---
  const renderizarContenido = () => {
    switch (pestanaActiva) {
      case 'resumen':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <TarjetaMetrica titulo="Ingresos" valor={metricas.totalIngresos} valorAnterior={datosHistoricos[4]?.ingresos} tendencia={tendencias.ingresos} icono={TrendingUp} color="ingreso" />
              <TarjetaMetrica titulo="Gastos" valor={metricas.totalGastos} valorAnterior={datosHistoricos[4]?.gastos} tendencia={tendencias.gastos} icono={TrendingDown} color="gasto" />
              <TarjetaMetrica titulo="Balance" valor={metricas.balance} valorAnterior={datosHistoricos[4]?.balance} tendencia={tendencias.balance} icono={Wallet} color="balance" subtitulo="Disponible para ahorro" />
              <TarjetaMetrica titulo="Ahorro" valor={metricas.tasaAhorro} icono={Target} formato="porcentaje" color="default" subtitulo="Tasa de eficiencia" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Gráfica Flujo de Caja */}
              <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm rounded-3xl p-8 border border-white/10 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2"><Activity className="w-5 h-5 text-blue-400" />Flujo de Caja</h3>
                    <p className="text-sm text-gray-400 ml-7">Evolución comparativa últimos 6 meses</p>
                  </div>
                  <div className="flex gap-4 text-xs font-bold">
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />Ingresos</div>
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400"><div className="w-2 h-2 rounded-full bg-red-500" />Gastos</div>
                  </div>
                </div>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={datosHistoricos} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10B981" stopOpacity={0.5}/><stop offset="95%" stopColor="#10B981" stopOpacity={0.05}/></linearGradient>
                        <linearGradient id="colorGastos" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#EF4444" stopOpacity={0.5}/><stop offset="95%" stopColor="#EF4444" stopOpacity={0.05}/></linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff" strokeOpacity={0.05} vertical={false} />
                      <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12, fontWeight: 500}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} tickFormatter={(v) => `$${v/1000}k`} />
                      <Tooltip contentStyle={{ backgroundColor: 'rgba(17, 24, 39, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }} itemStyle={{ color: '#fff', fontWeight: 'bold' }} formatter={(value) => [`$${value.toLocaleString()}`, '']} cursor={{ stroke: '#fff', strokeWidth: 1, strokeDasharray: '3 3' }} />
                      <Area type="monotone" dataKey="ingresos" stroke="#10B981" strokeWidth={3} fill="url(#colorIngresos)" activeDot={{ r: 6 }} />
                      <Area type="monotone" dataKey="gastos" stroke="#EF4444" strokeWidth={3} fill="url(#colorGastos)" activeDot={{ r: 6 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Gráfica Distribución Mejorada */}
              <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm rounded-3xl p-8 border border-white/10 flex flex-col relative overflow-hidden">
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl" />
                <div className="flex items-center justify-between mb-6">
                  <div><h3 className="text-xl font-bold text-white flex items-center gap-2"><PieChart className="w-5 h-5 text-purple-400" />Distribución de Gastos</h3><p className="text-sm text-gray-400 ml-7">Categorías principales</p></div>
                  <span className="text-xs bg-purple-500/20 text-purple-300 px-2.5 py-1 rounded-full border border-purple-500/20 font-semibold">{Object.keys(metricas.gastosPorCategoria).length} Categorías</span>
                </div>
                <div className="flex flex-col md:flex-row gap-8 items-center h-full justify-center">
                  <div className="relative w-64 h-64 shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie data={dataPieChart} cx="50%" cy="50%" innerRadius={65} outerRadius={100} paddingAngle={3} dataKey="value" stroke="#111827" strokeWidth={4}>
                          {dataPieChart.map((entry, index) => <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />)}
                        </Pie>
                      </RechartsPieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-xs text-gray-400 uppercase tracking-widest font-bold">Total</span>
                      <span className="text-2xl font-extrabold text-white mt-1 drop-shadow-lg">{metricas.totalGastos > 0 ? `$${(metricas.totalGastos / 1000).toFixed(1)}k` : '$0'}</span>
                    </div>
                  </div>
                  <div className="flex-1 w-full space-y-4 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
                    {dataPieChart.length > 0 ? (
                      dataPieChart.map((cat, i) => {
                        const pct = ((cat.value / metricas.totalGastos) * 100).toFixed(0)
                        return (
                          <div key={cat.name} className="group hover:bg-white/5 p-2 rounded-lg transition-colors">
                            <div className="flex justify-between items-center mb-1.5">
                              <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px] transition-transform group-hover:scale-125" style={{ backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length], boxShadow: `0 0 8px ${CATEGORY_COLORS[i % CATEGORY_COLORS.length]}` }} />
                                <span className="text-gray-200 font-medium text-sm truncate max-w-[100px]">{cat.name}</span>
                              </div>
                              <div className="flex items-center gap-3"><span className="text-xs font-bold text-white bg-white/10 px-2 py-0.5 rounded">{pct}%</span><span className="text-xs font-mono text-gray-400">${cat.value.toLocaleString()}</span></div>
                            </div>
                            <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                              <div className="h-full rounded-full transition-all duration-1000 ease-out relative" style={{ width: `${pct}%`, backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }}><div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-50" /></div>
                            </div>
                          </div>
                        )
                      })
                    ) : (<div className="text-center py-8 text-gray-500 text-sm italic">No hay gastos registrados en este período.</div>)}
                  </div>
                </div>
              </div>
            </div>

            {metricas.balance < 0 && (
              <div className="bg-gradient-to-r from-red-500/10 to-transparent border-l-4 border-red-500 p-6 rounded-r-2xl flex items-start gap-4 animate-in slide-in-from-left-2">
                <div className="p-2 bg-red-500/20 rounded-full text-red-400 shrink-0"><AlertTriangle className="w-6 h-6" /></div>
                <div><h4 className="text-lg font-bold text-white">Déficit Detectado</h4><p className="text-gray-400 text-sm mt-1">Tu balance actual es negativo (${Math.abs(metricas.balance).toLocaleString()}). Se recomienda revisar los gastos de suscripciones o fijos.</p></div>
              </div>
            )}
          </div>
        )

      case 'tendencias':
        return (
          <div className="space-y-8">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white/5 p-6 rounded-3xl border border-white/10"><h3 className="text-lg font-bold text-white mb-6">Ingresos vs Promedio</h3><div className="h-72"><ResponsiveContainer width="100%" height="100%"><RechartsLineChart data={datosHistoricos}><CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} /><XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF'}} /><YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF'}} tickFormatter={(v)=>`$${v}`} /><Tooltip contentStyle={{backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px'}} /><ReferenceLine y={metricas.avgIngresos} stroke="#10B981" strokeDasharray="5 5" label="Promedio" /><Line type="monotone" dataKey="ingresos" stroke="#10B981" strokeWidth={3} dot={{fill: '#10B981', strokeWidth: 2, r: 4}} activeDot={{r: 6}} /></RechartsLineChart></ResponsiveContainer></div></div>
                <div className="bg-white/5 p-6 rounded-3xl border border-white/10"><h3 className="text-lg font-bold text-white mb-6">Gastos vs Promedio</h3><div className="h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={datosHistoricos}><CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} /><XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF'}} /><YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF'}} tickFormatter={(v)=>`$${v}`} /><Tooltip contentStyle={{backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px'}} cursor={{fill: 'rgba(239,68,68,0.1)'}} /><ReferenceLine y={metricas.avgGastos} stroke="#EF4444" strokeDasharray="5 5" /><Bar dataKey="gastos" fill="#EF4444" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div></div>
             </div>
          </div>
        )

      case 'comparativo':
        return (
           <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
             <table className="w-full text-left">
                <thead className="bg-white/5 text-gray-300 text-sm uppercase tracking-wider font-bold">
                  <tr>
                    <th className="p-4">Mes</th>
                    <th className="p-4 text-right">Ingresos</th>
                    <th className="p-4 text-right">Gastos</th>
                    <th className="p-4 text-right">Balance</th>
                    <th className="p-4 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {datosHistoricos.map((d, i) => (
                    <tr key={i} className="hover:bg-white/5 transition-colors group">
                      <td className="p-4 text-white font-medium">{d.mesCompleto}</td>
                      <td className="p-4 text-right font-mono text-emerald-400">{`$${d.ingresos.toLocaleString()}`}</td>
                      <td className="p-4 text-right font-mono text-red-400">{`$${d.gastos.toLocaleString()}`}</td>
                      <td className={`p-4 text-right font-mono font-bold ${d.balance >= 0 ? 'text-blue-400' : 'text-red-400'}`}>{d.balance >= 0 ? '+' : ''}{`$${d.balance.toLocaleString()}`}</td>
                      <td className="p-4 text-center">{d.balance >= 0 ? <CheckCircle className="w-5 h-5 text-green-500 mx-auto" /> : <AlertTriangle className="w-5 h-5 text-red-500 mx-auto" />}</td>
                    </tr>
                  ))}
                </tbody>
             </table>
           </div>
        )

      case 'deudas':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <TarjetaMetrica titulo="Deuda Total" descripcion="Suma de todos los saldos pendientes" valor={metricas.deudaTotal} icono={CreditCard} color="red" />
              <TarjetaMetrica titulo="Número de Deudas" descripcion="Cantidad de tarjetas y préstamos activos" valor={metricas.contadores.deudas} icono={Building} formato="numero" color="yellow" />
              <TarjetaMetrica titulo="Promedio por Deuda" descripcion="Saldo promedio por cuenta de crédito" valor={metricas.contadores.deudas > 0 ? metricas.deudaTotal / metricas.contadores.deudas : 0} icono={Target} color="purple" />
            </div>
            <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <div className="flex items-center gap-3 mb-6"><CreditCard className="w-6 h-6 text-red-400" /><h3 className="text-lg font-bold text-white">Detalle de Pasivos</h3><span className="text-sm text-gray-400">({datosFiltrados.deudas.length} elementos)</span></div>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {datosFiltrados.deudas.map((deuda, idx) => (
                  <div key={idx} className="flex justify-between items-center p-4 bg-black/20 rounded-xl border border-white/5 hover:bg-white/5 transition-colors group">
                    <div className="flex-1 min-w-0 mr-4">
                      <div className="text-white font-bold text-base truncate group-hover:text-red-300 transition-colors">{deuda.nombre || deuda.cuenta || 'Deuda sin nombre'}</div>
                      <div className="text-gray-400 text-sm mt-1 flex items-center gap-2">
                        {deuda.banco && (<span className="bg-white/10 px-2 py-0.5 rounded text-xs text-gray-300 border border-white/5">{deuda.banco}</span>)}
                        <span className="truncate">{deuda.tipo || 'Tarjeta'}</span>
                      </div>
                      {deuda.interes_anual && (<div className="text-yellow-400 text-xs mt-2 font-mono flex items-center gap-1"><Clock className="w-3 h-3"/> Tasa: {deuda.interes_anual}% anual</div>)}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-red-400 font-mono font-bold text-lg">{`${(deuda.saldo || 0).toLocaleString()}`}</div>
                      {deuda.limite_credito && (<div className="text-gray-500 text-xs">Límite: {`${(deuda.limite_credito || 0).toLocaleString()}`}</div>)}
                    </div>
                  </div>
                ))}
                {datosFiltrados.deudas.length === 0 && (<div className="text-center py-12 text-gray-500 bg-white/5 rounded-2xl border border-dashed border-gray-700"><CheckCircle className="w-12 h-12 mx-auto mb-4 text-gray-600" /><p>No tienes deudas registradas</p></div>)}
              </div>
            </div>
          </div>
        )
      default: return null
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
      <div className="bg-[#111827] text-gray-100 rounded-3xl w-full max-w-7xl h-[95vh] max-h-[1000px] flex flex-col shadow-2xl border border-white/10 relative overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-white/10 bg-[#111827]/95 backdrop-blur z-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-lg shadow-purple-500/20">
                <Eye className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 tracking-tight">FinGuide</h1>
                <p className="text-sm text-gray-400 font-medium">Visualización Inteligente de Datos</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
               <select value={rangoFecha} onChange={(e) => setRangoFecha(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all">
                <option value="mes_actual" className="bg-gray-900">Mes Actual</option>
                <option value="mes_anterior" className="bg-gray-900">Mes Anterior</option>
                <option value="trimestre" className="bg-gray-900">Trimestre</option>
                <option value="año_actual" className="bg-gray-900">Año Actual</option>
              </select>

              <div className="relative">
                <button onClick={() => setMostrarOpciones(!mostrarOpciones)} className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2">
                  <Download className="w-4 h-4" /> Exportar
                </button>
                
                {mostrarOpciones && (
                  <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-top-2 duration-200">
                    {['pdf', 'excel', 'csv', 'json'].map(t => (
                      <button key={t} onClick={() => handleExportar(t)} disabled={exportando} className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-50">
                         <FileText className="w-4 h-4 text-gray-400" />
                         {t.toUpperCase()}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button onClick={onClose} className="p-2.5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
          
          {rangoFecha === 'personalizado' && (
             <div className="flex gap-4 mt-4">
               <input type="date" className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
               <input type="date" className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
             </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 py-4 border-b border-white/10 bg-[#111827]/95 backdrop-blur shrink-0 z-10">
          <div className="flex gap-2">
            {pestanas.map(p => {
              const Icono = p.icono
              return (
                <button key={p.id} onClick={() => setPestanaActiva(p.id)} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${pestanaActiva === p.id ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                  <Icono className="w-4 h-4" /> {p.nombre}
                </button>
              )
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8 bg-[#0B1120] overflow-y-auto">
          {exportando && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-gray-800 rounded-2xl p-6 flex items-center gap-4">
                <RefreshCw className="w-6 h-6 text-blue-400 animate-spin" />
                <span className="text-white font-semibold">Generando documento...</span>
              </div>
            </div>
          )}
          {renderizarContenido()}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-[#111827] text-xs text-center text-gray-500">
          Visualizando {metricas.periodo}
        </div>

      </div>
    </div>
  )
}

export default VisualizacionDatos