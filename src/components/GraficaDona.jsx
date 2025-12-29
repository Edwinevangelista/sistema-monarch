import React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316']

const GraficaDona = ({ data }) => {
  // 🔧 FIX: Validar que data existe y tiene elementos
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <h3 className="text-white text-lg font-semibold mb-4">Gastos por Categoría</h3>
        <div className="flex items-center justify-center h-64 text-gray-400">
          No hay datos de gastos para mostrar
        </div>
      </div>
    )
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 p-3 rounded-lg shadow-lg border border-gray-700">
          <p className="text-white font-semibold">{payload[0].name}</p>
          <p className="text-green-400">${payload[0].value.toLocaleString()}</p>
          <p className="text-gray-400 text-sm">
            {((payload[0].value / data.reduce((sum, item) => sum + item.value, 0)) * 100).toFixed(1)}%
          </p>
        </div>
      )
    }
    return null
  }

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180))
    const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180))

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-sm font-semibold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <h3 className="text-white text-lg font-semibold mb-4">Gastos por Categoría</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            formatter={(value, entry) => (
              <span className="text-white text-sm">
                {value}: ${entry.payload.value.toLocaleString()}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

export default GraficaDona
