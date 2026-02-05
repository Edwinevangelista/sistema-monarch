import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ArrowRight } from 'lucide-react';

// Paleta de colores vibrantes para modo oscuro
const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

export default function GraficaDona({ data, onCategoryClick }) {
  // Validación de datos
  const chartData = useMemo(() => {
    if (!data || !Array.isArray(data) || data.length === 0) return [];
    return data.map(item => ({ ...item, value: Number(item.value) || 0 }));
  }, [data]);

  const total = useMemo(() => chartData.reduce((sum, item) => sum + item.value, 0), [chartData]);

  // Tooltip Personalizado Glassmorphism
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900/90 backdrop-blur-md border border-white/10 rounded-xl p-3 shadow-2xl">
          <p className="text-white font-semibold text-sm md:text-base">{payload[0].name}</p>
          <div className="flex items-center justify-between gap-4 mt-2">
            <p className="text-emerald-400 font-bold text-lg">
              ${payload[0].value.toLocaleString()}
            </p>
            <p className="text-gray-300 text-sm font-medium">
              {((payload[0].value / total) * 100).toFixed(1)}%
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Etiquetas de porcentaje dentro de la gráfica (opcional)
  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (percent < 0.05) return null; // No mostrar si es menor al 5%

    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
    const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        className="text-[10px] md:text-sm font-bold"
        style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // Estado Vacío
  if (chartData.length === 0) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-white/10 flex flex-col items-center justify-center h-full min-h-[350px]">
        <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1120.635 5.377l-6.568-6.583a9.001 9.001 0 01-12.756-12.756l.36-.36l.35-.35A9.001 9.001 0 0114 2.535L14 7.364l.35.35.36.36a9.001 9.001 0 01-12.396 12.396l-.36.36-.35.35A9.001 9.001 0 0111.254 21.254z" />
          </svg>
        </div>
        <h3 className="text-white text-lg font-semibold mb-2">Sin gastos registrados</h3>
        <p className="text-gray-400 text-sm">Agrega gastos para ver el desglose por categoría.</p>
      </div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 md:p-6 shadow-xl h-full flex flex-col">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg md:text-xl font-bold text-white">Gastos por Categoría</h3>
        {onCategoryClick && (
          <button
            onClick={onCategoryClick}
            className="text-blue-400 hover:text-blue-300 text-xs md:text-sm font-medium transition-colors flex items-center gap-1 group"
          >
            Ver detalles
            <ArrowRight className="w-3 h-3 md:w-4 md:h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        )}
      </div>

      {/* Gráfica Donut */}
      <div className="relative w-full h-[250px] md:h-[300px] flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomLabel}
              outerRadius={110}
              innerRadius={60}
              fill="#374151"
              paddingAngle={5}
              dataKey="value"
              onClick={onCategoryClick}
              style={{ cursor: onCategoryClick ? 'pointer' : 'default' }}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                  stroke="#1f2937"
                  strokeWidth={1}
                  className={onCategoryClick ? 'hover:opacity-80 transition-opacity duration-200' : ''}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Texto Central Total */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-gray-400 text-[10px] uppercase tracking-wider font-semibold">Total</p>
            <p className="text-white text-xl md:text-2xl font-bold">
              ${total.toLocaleString(undefined, {maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>
      </div>

      {/* Leyenda Personalizada (Lista Legible) */}
      <div className="mt-4 flex-1 overflow-y-auto pr-2 custom-scrollbar max-h-[180px] md:max-h-none">
        <div className="grid grid-cols-1 gap-2">
          {chartData.map((entry, index) => (
            <button
              key={index}
              onClick={onCategoryClick}
              className="flex items-center gap-3 p-2.5 md:p-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10 transition-all active:scale-[0.98] w-full"
            >
              <div
                className="w-3 h-3 md:w-4 md:h-4 rounded-full flex-shrink-0 shadow-sm"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm md:text-base font-medium truncate text-left">
                  {entry.name}
                </p>
                <p className="text-gray-400 text-xs md:text-sm truncate text-left">
                  ${entry.value.toLocaleString()} ({((entry.value / total) * 100).toFixed(1)}%)
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}