import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const GraficaBarras = ({ data }) => {
  // 🔧 FIX: Validar que data existe y tiene elementos
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <h3 className="text-white text-lg font-semibold mb-4">Tendencia Semanal</h3>
        <div className="flex items-center justify-center h-64 text-gray-400">
          No hay datos suficientes para mostrar la tendencia
        </div>
      </div>
    )
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 p-3 rounded-lg shadow-lg border border-gray-700">
          <p className="text-white font-semibold mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: ${entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <h3 className="text-white text-lg font-semibold mb-4">Tendencia Semanal</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="name" stroke="#9CA3AF" />
          <YAxis stroke="#9CA3AF" />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar dataKey="ingresos" fill="#10B981" name="Ingresos" />
          <Bar dataKey="gastos" fill="#EF4444" name="Gastos" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default GraficaBarras
