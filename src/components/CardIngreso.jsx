import { DollarSign, Edit2, Trash2, Calendar, Wallet } from 'lucide-react';

export default function CardIngreso({ ingreso, onEditar, onEliminar }) {
  return (
    <div className="bg-white/5 backdrop-blur-md border border-emerald-500/20 rounded-2xl p-5 relative overflow-hidden group hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] transition-all duration-300">
      
      {/* Decoración de fondo */}
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all" />

      {/* Header */}
      <div className="flex items-start justify-between mb-5 relative z-10">
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-bold text-lg truncate group-hover:text-emerald-300 transition-colors">
            {ingreso.fuente || 'Ingreso'}
          </h3>
          {ingreso.descripcion && (
            <p className="text-sm text-gray-400 mt-1 truncate">
              {ingreso.descripcion}
            </p>
          )}
        </div>
        
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-3 rounded-xl shadow-lg shadow-emerald-900/30 group-hover:scale-105 transition-transform">
          <DollarSign className="w-5 h-5 text-white" />
        </div>
      </div>

      {/* Monto */}
      <div className="flex items-end justify-between mb-5 pb-5 border-b border-white/5 relative z-10">
        <span className="text-xs text-emerald-400/80 uppercase tracking-wider font-bold">Total Recibido</span>
        <div className="text-right">
          <span className="text-3xl font-bold text-white tracking-tight drop-shadow-sm">
            +${ingreso.monto?.toFixed(2) || '0.00'}
          </span>
        </div>
      </div>

      {/* Detalles */}
      <div className="space-y-2 mb-5 relative z-10">
        <div className="flex items-center gap-3 text-sm text-gray-400 bg-white/5 p-2.5 rounded-lg border border-white/5">
          <Calendar className="w-4 h-4 text-emerald-500" />
          <span className="font-medium text-gray-200">
            {new Date(ingreso.fecha).toLocaleDateString('es-ES', { 
              weekday: 'short', 
              day: 'numeric', 
              month: 'short' 
            })}
          </span>
        </div>
      </div>

      {/* Acciones */}
      <div className="grid grid-cols-2 gap-3 relative z-10">
        <button
          onClick={onEditar}
          className="px-4 py-2.5 bg-blue-600/80 hover:bg-blue-600 text-white rounded-xl font-semibold text-sm transition-all active:scale-95 flex items-center justify-center gap-2 border border-blue-500/20"
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