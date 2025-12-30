import { Calendar, TrendingUp } from 'lucide-react';

export default function InfoMes() {
  const hoy = new Date();
  const nombreMes = hoy.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  const diaMes = hoy.getDate();
  const nombreDia = hoy.toLocaleDateString('es-ES', { weekday: 'long' });
  
  const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();
  const diasRestantes = ultimoDiaMes - diaMes;
  const progreso = (diaMes / ultimoDiaMes) * 100;

  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 shadow-2xl text-white">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Calendar className="w-8 h-8" />
          <div>
            <h2 className="text-2xl font-bold capitalize">{nombreMes}</h2>
            <p className="text-blue-100 capitalize">{nombreDia} {diaMes}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold">{diasRestantes}</div>
          <div className="text-sm text-blue-100">días restantes</div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span>Progreso del mes</span>
          <span className="font-semibold">{Math.round(progreso)}%</span>
        </div>
        <div className="w-full bg-blue-800/50 rounded-full h-3">
          <div
            className="bg-white h-3 rounded-full transition-all duration-500 flex items-center justify-end pr-1"
            style={{ width: `${progreso}%` }}
          >
            <TrendingUp className="w-3 h-3 text-blue-600" />
          </div>
        </div>
        <div className="flex justify-between text-xs text-blue-200">
          <span>Día 1</span>
          <span>Día {ultimoDiaMes}</span>
        </div>
      </div>
    </div>
  );
}
