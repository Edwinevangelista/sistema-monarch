import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const GraficaBarras = ({ data, title }) => {
  return (
    <div className="bg-gray-800 rounded-2xl p-6 shadow-xl border-2 border-gray-700">
      <h2 className="text-xl font-bold text-white mb-4 text-center">
        {title}
      </h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey="name" 
            stroke="#9CA3AF"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="#9CA3AF"
            style={{ fontSize: '12px' }}
          />
          <Tooltip 
            formatter={(value) => `$${value.toLocaleString('es-MX')}`}
            contentStyle={{ 
              backgroundColor: '#1F2937', 
              border: '1px solid #374151',
              borderRadius: '8px'
            }}
            labelStyle={{ color: '#fff' }}
          />
          <Legend 
            wrapperStyle={{ color: '#fff' }}
          />
          <Bar dataKey="ingresos" fill="#10B981" name="Ingresos" radius={[8, 8, 0, 0]} />
          <Bar dataKey="gastos" fill="#EF4444" name="Gastos" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default GraficaBarras
