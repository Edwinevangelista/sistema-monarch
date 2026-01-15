import React from 'react';
import { Repeat, Edit2, Trash2, DollarSign, Calendar, AlertTriangle, Clock, Zap } from 'lucide-react';

// Helper para estilos según ciclo
const getStyleCiclo = (ciclo) => {
  switch (ciclo?.toLowerCase()) {
    case 'anual': return { bg: 'bg-purple-500/20', border: 'border-purple-500/30', text: 'text-purple-300', label: 'Anual' };
    case 'semanal': return { bg: 'bg-green-500/20', border: 'border-green-500/30', text: 'text-green-300', label: 'Semanal' };
    default: return { bg: 'bg-blue-500/20', border: 'border-blue-500/30', text: 'text-blue-300', label: 'Mensual' };
  }
};

export default function ListaSuscripciones({ suscripciones, onEditar, onEliminar, onPagarManual }) {
  const suscripcionesActivas = suscripciones.filter(s => s.estado === 'Activo');

  const handleEliminar = (id, servicio) => {
    if (window.confirm(`¿Estás seguro de eliminar la suscripción de ${servicio}?`)) {
      onEliminar(id);
    }
  };

  const getDaysRemaining = (proximoPago) => {
    if (!proximoPago) return null;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fecha = new Date(proximoPago);
    const diff = Math.ceil((fecha - hoy) / (1000 * 60 * 60 * 24));
    return diff;
  };

  if (suscripcionesActivas.length === 0) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-500/20 p-2 rounded-xl border border-indigo-500/30">
              <Repeat className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Suscripciones Activas</h3>
              <p className="text-xs text-gray-400">Control de renovaciones</p>
            </div>
          </div>
          <span className="bg-indigo-500/20 text-indigo-300 text-sm px-3 py-1 rounded-full border border-indigo-500/30">
            0 activas
          </span>
        </div>
        <div className="text-center py-12 h-48 flex flex-col items-center justify-center bg-white/5 rounded-xl border border-dashed border-white/10">
          <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mb-4">
            <Repeat className="w-8 h-8 text-indigo-500/50" />
          </div>
          <p className="text-gray-400">No tienes suscripciones activas.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-white/10 h-full flex flex-col">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-500/20 p-2 rounded-xl border border-indigo-500/30 text-indigo-400">
            <Repeat className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Suscripciones</h3>
            <p className="text-xs text-gray-400">Seguimiento de pagos recurrentes</p>
          </div>
        </div>
        
        <span className="bg-indigo-500/20 text-indigo-300 text-sm px-3 py-1 rounded-full border border-indigo-500/30">
          {suscripcionesActivas.length} activas
        </span>
      </div>

      {/* Lista Scrollable */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar pb-20 md:pb-0 space-y-4">
        {suscripcionesActivas.map((sub) => {
          const daysRemaining = getDaysRemaining(sub.proximo_pago);
          const styleCiclo = getStyleCiclo(sub.ciclo);
          
          // Lógica de urgencia
          let isUrgent = false;
          let urgencyClass = 'border-gray-700';
          let urgencyIcon = null;
          
          if (daysRemaining !== null) {
            if (daysRemaining <= 0) {
              isUrgent = true;
              urgencyClass = 'border-rose-500/50 ring-1 ring-rose-500/20';
              urgencyIcon = <Zap className="w-4 h-4 text-rose-400" />;
            } else if (daysRemaining <= 3) {
              isUrgent = true;
              urgencyClass = 'border-yellow-500/50 ring-1 ring-yellow-500/20';
              urgencyIcon = <AlertTriangle className="w-4 h-4 text-yellow-400" />;
            }
          }

          return (
            <div
              key={sub.id}
              className={`bg-white/5 backdrop-blur-sm border rounded-2xl p-4 md:p-5 transition-all duration-200 hover:border-white/20 group relative overflow-hidden ${urgencyClass}`}
            >
              {/* Fondo de urgencia */}
              {isUrgent && (
                <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 via-transparent to-transparent opacity-20 pointer-events-none" />
              )}

              <div className="flex items-start justify-between mb-4 relative z-10">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {/* Icono + Nombre */}
                  <div className={`p-2.5 rounded-xl border ${styleCiclo.bg} ${styleCiclo.border} ${styleCiclo.text} shadow-sm`}>
                    <Repeat className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <h4 className="text-white font-bold text-base md:text-lg truncate">
                        {sub.servicio}
                        {urgencyIcon && <span className="ml-2">{urgencyIcon}</span>}
                      </h4>
                      {/* Tags */}
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${styleCiclo.bg} ${styleCiclo.border} ${styleCiclo.text}`}>
                          {styleCiclo.label}
                        </span>
                        {sub.categoria && (
                          <span className="text-xs text-gray-400 bg-gray-800/50 px-2 py-0.5 rounded-full border border-gray-700/50">
                            {sub.categoria}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Monto y Ciclo */}
                <div className="text-right">
                  <div className="text-xs text-gray-400 mb-1">/{sub.ciclo}</div>
                  <div className="text-white font-bold text-xl md:text-2xl">
                    ${sub.costo.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Detalles Fecha */}
              {sub.proximo_pago && (
                <div className={`flex items-center justify-between text-xs md:text-sm mb-4 p-3 bg-black/20 rounded-xl ${daysRemaining <= 3 ? 'bg-yellow-500/10' : 'bg-gray-800/50'}`}>
                  <div className="flex items-center gap-2">
                    <Calendar className={`w-4 h-4 ${daysRemaining <= 0 ? 'text-rose-400' : daysRemaining <= 3 ? 'text-yellow-400' : 'text-gray-400'}`} />
                    <span className="text-gray-300">
                      Próximo pago: {new Date(sub.proximo_pago).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                      {daysRemaining !== null && (
                        <span className={`font-semibold ${daysRemaining <= 0 ? 'text-rose-400' : daysRemaining <= 3 ? 'text-yellow-400' : 'text-gray-400'} ml-2`}>
                          ({daysRemaining > 0 ? `en ${daysRemaining} días` : 'Vence hoy'})
                        </span>
                      )}
                    </span>
                  </div>
                  {sub.autopago && (
                    <span className="text-[10px] flex items-center gap-1 text-blue-300">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                      Autopago activo
                    </span>
                  )}
                </div>
              )}

              {/* Acciones */}
              <div className="flex gap-2 md:gap-3 mt-4 pt-4 border-t border-white/5 relative z-10">
                <button
                  onClick={() => onPagarManual(sub)}
                  className="flex-1 md:flex-[2] bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-300 hover:text-emerald-100 py-2 md:py-2.5 rounded-xl text-sm md:text-sm font-semibold transition-all active:scale-95 flex items-center justify-center gap-2 border border-emerald-500/20"
                >
                  <DollarSign className="w-4 h-4" /> Pagar
                </button>

                <button
                  onClick={() => onEditar(sub)}
                  className="p-2 bg-blue-500/10 hover:bg-blue-600/20 text-blue-300 hover:text-white rounded-xl transition-all active:scale-95 border border-blue-500/20"
                  title="Editar"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleEliminar(sub.id, sub.servicio)}
                  className="p-2 bg-rose-500/10 hover:bg-rose-600/20 text-rose-300 hover:text-white rounded-xl transition-all active:scale-95 border border-rose-500/20"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Scrollbar Style */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.5); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(99, 102, 241, 0.7); }
      `}</style>
    </div>
  );
}