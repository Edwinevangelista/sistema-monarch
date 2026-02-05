// src/components/MetricasAvanzadas.jsx
import React, { useMemo } from 'react'
import { TrendingUp, TrendingDown, AlertTriangle, Target, PieChart, BarChart3, DollarSign, CreditCard, Calendar, Percent } from 'lucide-react'

/**
 * Componente de métricas avanzadas y análisis financiero
 * Muestra KPIs calculados y análisis de tendencias
 */
const MetricasAvanzadas = ({ 
  ingresos = [], 
  gastos = [], 
  gastosFijos = [],
  suscripciones = [],
  deudas = [],
  calculosReales,
  calculosProyectados,
  hoy 
}) => {

  // Análisis avanzado de métricas
  const analisisAvanzado = useMemo(() => {
    const mesActual = hoy.getMonth()
    const añoActual = hoy.getFullYear()
    
    // Comparativa mes anterior
    const mesAnterior = mesActual === 0 ? 11 : mesActual - 1
    const añoComparativa = mesActual === 0 ? añoActual - 1 : añoActual
    
    const inicioMesAnterior = new Date(añoComparativa, mesAnterior, 1)
    const finMesAnterior = new Date(añoComparativa, mesAnterior + 1, 0)
    
    // Datos mes anterior
    const ingresosMesAnterior = ingresos
      .filter(i => {
        const fecha = new Date(i.fecha)
        return fecha >= inicioMesAnterior && fecha <= finMesAnterior
      })
      .reduce((sum, i) => sum + Number(i.monto || 0), 0)
    
    const gastosMesAnterior = gastos
      .filter(g => {
        const fecha = new Date(g.fecha)
        return fecha >= inicioMesAnterior && fecha <= finMesAnterior
      })
      .reduce((sum, g) => sum + Number(g.monto || 0), 0)
    
    // Tendencias
    const tendenciaIngresos = ingresosMesAnterior > 0 ? 
      ((calculosReales.totalIngresos - ingresosMesAnterior) / ingresosMesAnterior) * 100 : 0
    
    const tendenciaGastos = gastosMesAnterior > 0 ? 
      ((calculosReales.totalGastos - gastosMesAnterior) / gastosMesAnterior) * 100 : 0
    
    // Métricas de eficiencia
    const eficienciaGasto = calculosReales.totalIngresos > 0 ? 
      (calculosReales.totalGastos / calculosReales.totalIngresos) * 100 : 0
    
    const velocidadQuemaEfectivo = calculosReales.totalGastos > 0 && hoy.getDate() > 1 ? 
      calculosReales.totalGastos / hoy.getDate() : 0
    
    // Proyección de fin de mes
    const diasRestantes = new Date(añoActual, mesActual + 1, 0).getDate() - hoy.getDate()
    const proyeccionGastos = velocidadQuemaEfectivo * diasRestantes
    
    // Análisis de deudas
    const deudaTotal = deudas.reduce((sum, d) => sum + Number(d.saldo || 0), 0)
    const ratioDeudaIngresos = calculosReales.totalIngresos > 0 ? 
      (deudaTotal / calculosReales.totalIngresos) * 100 : 0
    
    const interesesMensuales = deudas.reduce((sum, d) => 
      sum + ((Number(d.saldo || 0) * Number(d.interes || 0)) / 100 / 12), 0
    )
    
    // Categorización de gastos
    const gastosPorCategoria = {}
    gastos.forEach(g => {
      const cat = g.categoria || 'Sin categoría'
      gastosPorCategoria[cat] = (gastosPorCategoria[cat] || 0) + Number(g.monto || 0)
    })
    
    // Encontrar categoría más cara
    const categoriaMasCara = Object.entries(gastosPorCategoria)
      .sort(([,a], [,b]) => b - a)[0]
    
    // Score de salud financiera (0-100)
    let scoreFinanciero = 50 // Base
    
    // Factores positivos
    if (calculosReales.saldo > 0) scoreFinanciero += 15
    if (calculosReales.tasaAhorro > 20) scoreFinanciero += 15
    else if (calculosReales.tasaAhorro > 10) scoreFinanciero += 10
    
    if (tendenciaIngresos > 0) scoreFinanciero += 10
    if (ratioDeudaIngresos < 30) scoreFinanciero += 10
    
    // Factores negativos
    if (calculosReales.saldo < 0) scoreFinanciero -= 20
    if (eficienciaGasto > 100) scoreFinanciero -= 15
    if (ratioDeudaIngresos > 50) scoreFinanciero -= 15
    if (tendenciaGastos > 20) scoreFinanciero -= 10
    
    scoreFinanciero = Math.max(0, Math.min(100, scoreFinanciero))
    
    return {
      mesAnterior: {
        ingresos: ingresosMesAnterior,
        gastos: gastosMesAnterior
      },
      tendencias: {
        ingresos: tendenciaIngresos,
        gastos: tendenciaGastos
      },
      eficiencia: {
        gastos: eficienciaGasto,
        velocidadQuema: velocidadQuemaEfectivo,
        proyeccionGastos
      },
      deudas: {
        total: deudaTotal,
        ratioIngresos: ratioDeudaIngresos,
        interesesMensuales
      },
      categorias: {
        porCategoria: gastosPorCategoria,
        masCara: categoriaMasCara
      },
      scoreFinanciero,
      alertas: []
    }
  }, [ingresos, gastos, deudas, calculosReales, hoy])
  
  // Generar alertas basadas en métricas
  useMemo(() => {
    const alertas = []
    
    if (analisisAvanzado.eficiencia.gastos > 90) {
      alertas.push({
        tipo: 'warning',
        titulo: 'Alta eficiencia de gasto',
        mensaje: `Estás gastando ${analisisAvanzado.eficiencia.gastos.toFixed(1)}% de tus ingresos`,
        icono: AlertTriangle,
        color: 'yellow'
      })
    }
    
    if (analisisAvanzado.tendencias.gastos > 20) {
      alertas.push({
        tipo: 'warning', 
        titulo: 'Gastos en aumento',
        mensaje: `Tus gastos aumentaron ${analisisAvanzado.tendencias.gastos.toFixed(1)}% vs mes anterior`,
        icono: TrendingUp,
        color: 'red'
      })
    }
    
    if (analisisAvanzado.deudas.ratioIngresos > 40) {
      alertas.push({
        tipo: 'danger',
        titulo: 'Alto nivel de deuda',
        mensaje: `Tu deuda representa ${analisisAvanzado.deudas.ratioIngresos.toFixed(1)}% de tus ingresos`,
        icono: CreditCard,
        color: 'red'
      })
    }
    
    if (analisisAvanzado.scoreFinanciero < 40) {
      alertas.push({
        tipo: 'danger',
        titulo: 'Score financiero bajo',
        mensaje: 'Considera revisar tus hábitos de gasto y ahorro',
        icono: Target,
        color: 'red'
      })
    }
    
    analisisAvanzado.alertas = alertas
  }, [analisisAvanzado])
  
  // Función para obtener color del score
  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-yellow-400'  
    if (score >= 40) return 'text-orange-400'
    return 'text-red-400'
  }
  
  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">Análisis Avanzado</h3>
          <p className="text-sm text-gray-400">Métricas e insights de tus finanzas</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-400">Score Financiero</div>
          <div className={`text-3xl font-black ${getScoreColor(analisisAvanzado.scoreFinanciero)}`}>
            {Math.round(analisisAvanzado.scoreFinanciero)}
          </div>
        </div>
      </div>
      
      {/* KPIs Principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* Eficiencia de Gasto */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Percent className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-blue-300 uppercase font-semibold">Eficiencia</span>
          </div>
          <div className={`text-xl font-bold ${analisisAvanzado.eficiencia.gastos > 90 ? 'text-red-400' : 'text-blue-400'}`}>
            {analisisAvanzado.eficiencia.gastos.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-400">de ingresos gastados</div>
        </div>
        
        {/* Velocidad de Quema */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-orange-400" />
            <span className="text-xs text-orange-300 uppercase font-semibold">Quema Diaria</span>
          </div>
          <div className="text-xl font-bold text-orange-400">
            ${Math.round(analisisAvanzado.eficiencia.velocidadQuema)}
          </div>
          <div className="text-xs text-gray-400">por día promedio</div>
        </div>
        
        {/* Ratio Deuda/Ingresos */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <CreditCard className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-purple-300 uppercase font-semibold">Ratio Deuda</span>
          </div>
          <div className={`text-xl font-bold ${analisisAvanzado.deudas.ratioIngresos > 40 ? 'text-red-400' : 'text-purple-400'}`}>
            {analisisAvanzado.deudas.ratioIngresos.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-400">vs ingresos</div>
        </div>
        
        {/* Intereses Mensuales */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-red-400" />
            <span className="text-xs text-red-300 uppercase font-semibold">Intereses</span>
          </div>
          <div className="text-xl font-bold text-red-400">
            ${Math.round(analisisAvanzado.deudas.interesesMensuales)}
          </div>
          <div className="text-xs text-gray-400">pérdida mensual</div>
        </div>
        
      </div>
      
      {/* Comparativa con Mes Anterior */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
        <h4 className="text-white font-bold mb-3 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-cyan-400" />
          Comparativa Mensual
        </h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-sm text-gray-400 mb-1">Tendencia Ingresos</div>
            <div className={`text-2xl font-bold flex items-center justify-center gap-2 ${
              analisisAvanzado.tendencias.ingresos >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {analisisAvanzado.tendencias.ingresos >= 0 ? 
                <TrendingUp className="w-5 h-5" /> : 
                <TrendingDown className="w-5 h-5" />
              }
              {Math.abs(analisisAvanzado.tendencias.ingresos).toFixed(1)}%
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-sm text-gray-400 mb-1">Tendencia Gastos</div>
            <div className={`text-2xl font-bold flex items-center justify-center gap-2 ${
              analisisAvanzado.tendencias.gastos <= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {analisisAvanzado.tendencias.gastos >= 0 ? 
                <TrendingUp className="w-5 h-5" /> : 
                <TrendingDown className="w-5 h-5" />
              }
              {Math.abs(analisisAvanzado.tendencias.gastos).toFixed(1)}%
            </div>
          </div>
        </div>
      </div>
      
      {/* Top Insights */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
        <h4 className="text-white font-bold mb-3 flex items-center gap-2">
          <PieChart className="w-5 h-5 text-purple-400" />
          Insights Clave
        </h4>
        
        <div className="space-y-3">
          {/* Categoría más cara */}
          {analisisAvanzado.categorias.masCara && (
            <div className="p-3 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-semibold">Tu categoría más cara:</div>
                  <div className="text-sm text-gray-400">{analisisAvanzado.categorias.masCara[0]}</div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-red-400">
                    ${analisisAvanzado.categorias.masCara[1].toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-400">
                    {calculosReales.totalGastos > 0 ? 
                      ((analisisAvanzado.categorias.masCara[1] / calculosReales.totalGastos) * 100).toFixed(1) : 0
                    }% del total
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Proyección fin de mes */}
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white font-semibold">Proyección gastos fin de mes:</div>
                <div className="text-sm text-blue-300">
                  Al ritmo actual (${Math.round(analisisAvanzado.eficiencia.velocidadQuema)}/día)
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-blue-400">
                  ${Math.round(calculosReales.totalGastos + analisisAvanzado.eficiencia.proyeccionGastos).toLocaleString()}
                </div>
                <div className="text-xs text-gray-400">
                  +${Math.round(analisisAvanzado.eficiencia.proyeccionGastos)} adicionales
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Alertas */}
      {analisisAvanzado.alertas.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <h4 className="text-white font-bold mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            Alertas de Análisis
          </h4>
          
          <div className="space-y-2">
            {analisisAvanzado.alertas.map((alerta, idx) => {
              const Icono = alerta.icono
              const colorClasses = {
                yellow: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300',
                red: 'bg-red-500/10 border-red-500/30 text-red-300',
                orange: 'bg-orange-500/10 border-orange-500/30 text-orange-300'
              }
              
              return (
                <div key={idx} className={`p-3 rounded-lg border ${colorClasses[alerta.color]}`}>
                  <div className="flex items-start gap-3">
                    <Icono className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold">{alerta.titulo}</div>
                      <div className="text-sm opacity-90">{alerta.mensaje}</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
      
    </div>
  )
}

export default MetricasAvanzadas