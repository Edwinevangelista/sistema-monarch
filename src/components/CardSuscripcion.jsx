import { Repeat, Edit2, Trash2, Calendar, Zap } from 'lucide-react';

export default function CardSuscripcion({ suscripcion, onEditar, onEliminar }) {
  // Cálculo inteligente del costo mensual equivalente
  const getCostoMensual = () => {
    const costo = Number(suscripcion.costo) || 0;
    if (suscripcion.ciclo === 'Anual') return costo / 12;
    if (suscripcion.ciclo === 'Semanal') return costo * 4.33;
    return costo;
  };

  const costoMensual = getCostoMensual();
  const esActivo = suscripcion.estado === 'Activo';

  return (
    <div className="bg-white/5 backdrop-blur-md border border-indigo-500/20 rounded-2xl p-5 relative overflow-hidden group hover:border-indigo-500/40 transition-all duration-300">
      
      {/* Fondo decorativo */}
      <div className="absolute -left-4 -top-4 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all" />

      {/* Header */}
      <div className="flex items-start justify-between mb-4 relative z-10">
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-bold text-lg truncate group-hover:text-indigo-300 transition-colors">
            {suscripcion.servicio}
          </h3>
          
          {/* Costo y Ciclo */}
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-bold text-white">
              ${suscripcion.costo?.toFixed(2) || '0.00'}
            </span>
            <span className="text-xs text-indigo-300 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
              {suscripcion.ciclo}
            </span>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          {/* Icono Principal */}
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2.5 rounded-xl shadow-lg shadow-indigo-900/30 group-hover:rotate-6 transition-transform">
            <Repeat className="w-5 h-5 text-white" />
          </div>
          
          {/* Badge de Estado */}
          <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
            esActivo 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]' 
              : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
          }`}>
            {esActivo ? 'Activo' : 'Cancelado'}
          </span>
        </div>
      </div>

      {/* Métricas Inteligentes */}
      <div className="grid grid-cols-2 gap-3 mb-5 relative z-10">
        <div className="bg-white/5 border border-white/5 rounded-xl p-3 text-center">
          <div className="text-[10px] text-indigo-300 uppercase tracking-wide font-bold mb-1">Costo Mensual</div>
          <div className="text-lg font-bold text-white">
            ${costoMensual.toFixed(2)}
          </div>
        </div>
        <div className="bg-white/5 border border-white/5 rounded-xl p-3 text-center">
          <div className="text-[10px] text-indigo-300 uppercase tracking-wide font-bold mb-1 flex items-center justify-center gap-1">
            <Zap className="w-3 h-3" /> Anual
          </div>
          <div className="text-lg font-bold text-white">
            ${(costoMensual * 12).toFixed(0)}
          </div>
        </div>
      </div>

      {/* Info de próximo pago */}
      {esActivo && suscripcion.proximo_pago && (
        <div className="flex items-center gap-3 text-sm text-gray-400 bg-white/5 p-2.5 rounded-lg border border-white/5 mb-5 relative z-10">
          <Calendar className="w-4 h-4 text-indigo-400" />
          <span className="font-medium text-gray-200 truncate">
            Próximo: {new Date(suscripcion.proximo_pago).toLocaleDateString('es-ES')}
          </span>
        </div>
      )}

      {/* Acciones */}
      <div className="grid grid-cols-2 gap-3 relative z-10">
        <button
          onClick={onEditar}
          className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl font-semibold text-sm transition-all active:scale-95 flex items-center justify-center gap-2 border border-white/10"
        >
          <Edit2 className="w-4 h-4" />
          Editar
        </button>
        <button
          onClick={onEliminar}
          className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 rounded-xl font-semibold text-sm transition-all active:scale-95 flex items-center justify-center gap-2 border border-rose-500/20"
        >
          <Trash2 className="w-4 h-4" />
          Eliminar
        </button>
      </div>
    </div>
  );
}