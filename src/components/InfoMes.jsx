import React from 'react';
import { Calendar, TrendingUp, AlertCircle } from 'lucide-react';

export default function InfoMes() {
  const hoy = new Date();
  const nombreMes = hoy.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  const diaMes = hoy.getDate();
  const nombreDia = hoy.toLocaleDateString('es-ES', { weekday: 'long' });

  const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();
  const diasRestantes = Math.max(0, ultimoDiaMes - diaMes);
  const progreso = (diaMes / ultimoDiaMes) * 100;

  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-5 md:p-6 shadow-2xl shadow-blue-900/20 border border-blue-400/30 relative overflow-hidden">
      {/* Efecto de brillo de fondo */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-8 -mt-8" />

      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-xl border border-white/20">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-white capitalize leading-none">
              {nombreMes}
            </h2>
            <p className="text-blue-100 text-sm md:text-base capitalize">
              {nombreDia} {diaMes}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl md:text-4xl font-bold text-white">
            {diasRestantes}
          </div>
          <div className="text-xs md:text-sm text-blue-100 font-medium uppercase tracking-wider">
            Días Restantes
          </div>
        </div>
      </div>

      {/* Barra de Progreso */}
      <div className="space-y-2 relative z-10">
        <div className="flex justify-between text-xs md:text-sm font-semibold text-blue-100">
          <span>Progreso del mes</span>
          <span>{Math.round(progreso)}%</span>
        </div>
        <div className="w-full bg-black/20 rounded-full h-3 md:h-4 overflow-hidden backdrop-blur-sm">
          <div
            className="h-full bg-white/90 rounded-full transition-all duration-700 ease-out flex items-center justify-end pr-1 shadow-[0_0_10px_rgba(255,255,255,0.3)]"
            style={{ width: `${progreso}%` }}
          >
            <TrendingUp className="w-3 h-3 md:w-4 md:h-4 text-blue-600" />
          </div>
        </div>
        
        {/* Marcas de inicio y fin */}
        <div className="flex justify-between text-[10px] md:text-xs text-blue-200/70 font-medium">
          <span>Día 1</span>
          <span>Día {ultimoDiaMes}</span>
        </div>
      </div>
    </div>
  );
}