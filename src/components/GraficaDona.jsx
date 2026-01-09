import React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316']

const GraficaDona = ({ data, onCategoryClick }) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-gray-700">
        <h3 className="text-lg md:text-xl font-bold text-white mb-4">Gastos por Categoría</h3>
        <div className="flex items-center justify-center h-64 text-gray-400">
          No hay datos de gastos para mostrar
        </div>
      </div>
    )
  }

  const total = data.reduce((sum, item) => sum + item.value, 0)

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border-2 border-gray-700 rounded-xl p-3 shadow-2xl">
          <p className="text-white font-bold">{payload[0].name}</p>
          <p className="text-green-400 font-semibold">${payload[0].value.toLocaleString()}</p>
          <p className="text-gray-400 text-sm">
            {((payload[0].value / total) * 100).toFixed(1)}%
          </p>
        </div>
      )
    }
    return null
  }

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (percent < 0.05) return null // No mostrar porcentajes menores a 5%
    
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180))
    const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180))

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor="middle" 
        dominantBaseline="central"
        className="text-xs md:text-sm font-bold"
        style={{ textShadow: '0 0 3px rgba(0,0,0,0.8)' }}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg md:text-xl font-bold text-white">Gastos por Categoría</h3>
        {onCategoryClick && (
          <button
            onClick={onCategoryClick}
            className="text-blue-400 hover:text-blue-300 text-xs md:text-sm font-medium transition-colors flex items-center gap-1 group"
          >
            Ver detalles
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
      
      {/* Gráfica */}
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={90}
            innerRadius={40}
            fill="#8884d8"
            dataKey="value"
            onClick={onCategoryClick}
            style={{ cursor: onCategoryClick ? 'pointer' : 'default' }}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[index % COLORS.length]}
                className={onCategoryClick ? 'hover:opacity-80 transition-opacity' : ''}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Leyenda personalizada dentro del contenedor */}
      <div className="mt-4 max-h-[150px] overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {data.map((entry, index) => (
            <div 
              key={index} 
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-700/50 transition-colors cursor-pointer"
              onClick={onCategoryClick}
            >
              <div 
                className="w-3 h-3 rounded-full flex-shrink-0" 
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs md:text-sm font-medium truncate">{entry.name}</p>
                <p className="text-gray-400 text-[10px] md:text-xs">
                  ${entry.value.toLocaleString()} ({((entry.value / total) * 100).toFixed(1)}%)
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default GraficaDona