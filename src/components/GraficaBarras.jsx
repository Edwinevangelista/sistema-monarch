import React, { useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { TrendingUp } from 'lucide-react';

// Colores por defecto para las barras
const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c'];

export default function GraficaBarras({ data = [], height = 300, title = "Grafica" }) {
  
  // Convertir datos si vienen en formato diferente o procesarlos
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    // Asumimos que 'data' es un array de objetos como:
    // { fecha: '2023-10', monto: 500 } o { categoria: 'Comida', monto: 500 }
    return data.map((item, index) => ({
      ...item,
      monto: Number(item.monto) || 0,
      // Asignar color si no tiene uno
      fill: item.fill || COLORS[index % COLORS.length]
    }));
  }, [data]);

  // Customizar el Tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 border border-gray-600 p-2 rounded-lg shadow-xl">
          <p className="text-white text-sm font-semibold">
            {payload[0].payload.categoria || payload[0].payload.fecha}
          </p>
          <p className="text-emerald-400 text-xs">
            ${payload[0].payload.monto.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-gray-900/30 rounded-2xl p-6 border border-white/5 backdrop-blur-sm">
      {title && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            {title}
          </h3>
        </div>
      )}
      
      <div className="w-full">
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255, 255, 255, 0.1)" />
            <XAxis 
              dataKey="categoria" 
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
            />
            <YAxis 
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }} />
            
            {/* LEYENDA CORREGIDA - Sin payload customizado que causaba error */}
            <Legend 
              wrapperStyle={{ paddingTop: '10px' }}
              iconType="circle"
              iconSize={10}
            />
            
            <Bar dataKey="monto" fill="#8884d8" radius={[10, 10, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}