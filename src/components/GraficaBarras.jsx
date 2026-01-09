import React, { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const GraficaBarras = ({ ingresos = [], gastos = [], gastosFijos = [], suscripciones = [] }) => {
  
  const datosReales = useMemo(() => {
    const hoy = new Date()
    const hace28Dias = new Date(hoy)
    hace28Dias.setDate(hoy.getDate() - 28)
    
    // Crear 4 semanas
    const semanas = []
    for (let i = 0; i < 4; i++) {
      const inicioSemana = new Date(hace28Dias)
      inicioSemana.setDate(hace28Dias.getDate() + (i * 7))
      
      const finSemana = new Date(inicioSemana)
      finSemana.setDate(inicioSemana.getDate() + 6)
      
      semanas.push({
        inicio: inicioSemana,
        fin: finSemana,
        nombre: `S${i + 1}`
      })
    }
    
    // Calcular ingresos y gastos por semana
    return semanas.map(semana => {
      const inicioStr = semana.inicio.toISOString().split('T')[0]
      const finStr = semana.fin.toISOString().split('T')[0]
      
      // Ingresos de la semana
      const ingresosSemanales = ingresos
        .filter(ing => ing.fecha >= inicioStr && ing.fecha <= finStr)
        .reduce((sum, ing) => sum + Number(ing.monto || 0), 0)
      
      // Gastos variables de la semana
      const gastosSemanales = gastos
        .filter(g => g.fecha >= inicioStr && g.fecha <= finStr)
        .reduce((sum, g) => sum + Number(g.monto || 0), 0)
      
      // Gastos fijos que vencen esta semana
      const gastosFijosSemanales = gastosFijos
        .filter(gf => {
          if (gf.estado === 'Pagado' || !gf.dia_venc) return false
          const diaVenc = new Date(semana.inicio.getFullYear(), semana.inicio.getMonth(), gf.dia_venc)
          return diaVenc >= semana.inicio && diaVenc <= semana.fin
        })
        .reduce((sum, gf) => sum + Number(gf.monto || 0), 0)
      
      // Suscripciones que vencen esta semana
      const suscripcionesSemanales = suscripciones
        .filter(sub => {
          if (sub.estado !== 'Activo' || !sub.proximo_pago) return false
          const proxPago = new Date(sub.proximo_pago)
          return proxPago >= semana.inicio && proxPago <= semana.fin
        })
        .reduce((sum, sub) => sum + Number(sub.costo || 0), 0)
      
      const totalGastos = gastosSemanales + gastosFijosSemanales + suscripcionesSemanales
      
      return {
        name: `${semana.inicio.getDate()}/${semana.inicio.getMonth() + 1}`,
        fullDate: `${semana.inicio.getDate()}/${semana.inicio.getMonth() + 1} - ${semana.fin.getDate()}/${semana.fin.getMonth() + 1}`,
        ingresos: Math.round(ingresosSemanales),
        gastos: Math.round(totalGastos)
      }
    })
  }, [ingresos, gastos, gastosFijos, suscripciones])

  if (!datosReales || datosReales.length === 0) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-gray-700">
        <h3 className="text-lg md:text-xl font-bold text-white mb-4">Tendencia Semanal</h3>
        <div className="flex items-center justify-center h-64 text-gray-400">
          No hay datos suficientes para mostrar la tendencia
        </div>
      </div>
    )
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const ingresos = payload.find(p => p.dataKey === 'ingresos')?.value || 0
      const gastos = payload.find(p => p.dataKey === 'gastos')?.value || 0
      const balance = ingresos - gastos
      
      return (
        <div className="bg-gray-900 border-2 border-gray-700 rounded-xl p-3 shadow-2xl">
          <p className="text-white font-bold mb-2">{payload[0].payload.fullDate}</p>
          <div className="space-y-1 text-sm">
            <p className="text-green-400">💵 Ingresos: ${ingresos.toLocaleString()}</p>
            <p className="text-red-400">💸 Gastos: ${gastos.toLocaleString()}</p>
            <div className="pt-2 mt-2 border-t border-gray-700">
              <p className={`font-bold ${balance >= 0 ? 'text-cyan-400' : 'text-red-400'}`}>
                Balance: {balance >= 0 ? '+' : ''}${balance.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg md:text-xl font-bold text-white">Tendencia Semanal</h3>
        <span className="text-xs text-gray-400">Últimas 4 semanas</span>
      </div>
      
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={datosReales} margin={{ top: 20, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey="name" 
            stroke="#9CA3AF"
            style={{ fontSize: '11px' }}
          />
          <YAxis 
            stroke="#9CA3AF"
            style={{ fontSize: '11px' }}
            tickFormatter={(value) => `$${value > 1000 ? (value/1000).toFixed(1) + 'K' : value}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }}
            iconType="circle"
          />
          <Bar 
            dataKey="gastos" 
            fill="#EF4444" 
            radius={[8, 8, 0, 0]}
            name="Gastos"
          />
          <Bar 
            dataKey="ingresos" 
            fill="#10B981" 
            radius={[8, 8, 0, 0]}
            name="Ingresos"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default GraficaBarras