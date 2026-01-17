import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

const COLORS = {
  ingresos: '#10b981',
  gastosFijos: '#f59e0b',
  gastosVariables: '#ef4444',
  suscripciones: '#8b5cf6'
};

export default function GraficaBarras({ 
  ingresos = [], 
  gastos = [], 
  gastosFijos = [], 
  suscripciones = [],
  height = 300 
}) {
  
  const chartData = useMemo(() => {
    // Agrupar por mes
    const mesesMap = {};
    
    // Procesar ingresos
    ingresos.forEach(ing => {
      const fecha = new Date(ing.fecha);
      const mes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
      if (!mesesMap[mes]) {
        mesesMap[mes] = { mes, ingresos: 0, gastosFijos: 0, gastosVariables: 0, suscripciones: 0 };
      }
      mesesMap[mes].ingresos += Number(ing.monto) || 0;
    });
    
    // Procesar gastos variables
    gastos.forEach(g => {
      const fecha = new Date(g.fecha);
      const mes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
      if (!mesesMap[mes]) {
        mesesMap[mes] = { mes, ingresos: 0, gastosFijos: 0, gastosVariables: 0, suscripciones: 0 };
      }
      mesesMap[mes].gastosVariables += Number(g.monto) || 0;
    });
    
    // Procesar gastos fijos
    gastosFijos.forEach(gf => {
      if (!gf.dia_venc) return;
      const hoy = new Date();
      const mes = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
      if (!mesesMap[mes]) {
        mesesMap[mes] = { mes, ingresos: 0, gastosFijos: 0, gastosVariables: 0, suscripciones: 0 };
      }
      mesesMap[mes].gastosFijos += Number(gf.monto) || 0;
    });
    
    // Procesar suscripciones
    suscripciones.forEach(sub => {
      if (sub.estado !== 'Activo') return;
      const hoy = new Date();
      const mes = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
      if (!mesesMap[mes]) {
        mesesMap[mes] = { mes, ingresos: 0, gastosFijos: 0, gastosVariables: 0, suscripciones: 0 };
      }
      mesesMap[mes].suscripciones += Number(sub.costo) || 0;
    });
    
    // Convertir a array y ordenar por fecha
    const resultado = Object.values(mesesMap)
      .sort((a, b) => a.mes.localeCompare(b.mes))
      .slice(-6); // Últimos 6 meses
    
    // Formatear nombres de meses
    return resultado.map(item => ({
      ...item,
      mesNombre: new Date(item.mes + '-01').toLocaleDateString('es-MX', { month: 'short', year: '2-digit' })
    }));
  }, [ingresos, gastos, gastosFijos, suscripciones]);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 border border-white/20 rounded-xl p-3 shadow-xl">
          <p className="text-white font-bold text-sm mb-2">
            {payload[0].payload.mesNombre}
          </p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-3 text-xs">
              <span style={{ color: entry.color }}>{entry.name}:</span>
              <span className="text-white font-bold">${entry.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (!chartData || chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px] text-gray-500">
        <TrendingUp className="w-12 h-12 mb-3 opacity-30" />
        <p className="text-sm">No hay datos para mostrar</p>
        <p className="text-xs text-gray-600 mt-1">Agrega ingresos y gastos para ver tu evolución</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-bold text-base md:text-lg flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-400" />
          Evolución Mensual
        </h3>
      </div>
      
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis 
            dataKey="mesNombre" 
            stroke="#9ca3af" 
            style={{ fontSize: '12px' }}
            tick={{ fill: '#9ca3af' }}
          />
          <YAxis 
            stroke="#9ca3af" 
            style={{ fontSize: '12px' }}
            tick={{ fill: '#9ca3af' }}
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} />
          <Legend 
            wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
            iconType="circle"
          />
          <Bar dataKey="ingresos" name="Ingresos" fill={COLORS.ingresos} radius={[4, 4, 0, 0]} />
          <Bar dataKey="gastosFijos" name="Gastos Fijos" fill={COLORS.gastosFijos} radius={[4, 4, 0, 0]} />
          <Bar dataKey="gastosVariables" name="Gastos Variables" fill={COLORS.gastosVariables} radius={[4, 4, 0, 0]} />
          <Bar dataKey="suscripciones" name="Suscripciones" fill={COLORS.suscripciones} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}