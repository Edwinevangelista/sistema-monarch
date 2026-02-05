import React from 'react';
import { Bell, AlertTriangle, Clock, ExternalLink, Check } from 'lucide-react';

export default function Notificaciones({ alertas, onAlertClick }) {
  const getIconoTipo = (tipo) => {
    if (tipo === 'critical') return <AlertTriangle className="w-6 h-6 md:w-8 md:h-8 text-rose-500" />;
    if (tipo === 'warning') return <Clock className="w-6 h-6 md:w-8 md:h-8 text-yellow-500" />;
    return <Bell className="w-6 h-6 md:w-8 md:h-8 text-blue-400" />;
  };

  const getEstiloFondo = (tipo) => {
    switch (tipo) {
      case 'critical':
        return 'bg-gradient-to-br from-rose-900/40 to-red-900/20 border-rose-500/30 shadow-rose-900/10';
      case 'warning':
        return 'bg-gradient-to-br from-yellow-900/30 to-orange-900/20 border-yellow-500/30 shadow-yellow-900/10';
      default:
        return 'bg-gradient-to-br from-blue-900/30 to-indigo-900/20 border-blue-500/30 shadow-blue-900/10';
    }
  };

  const getEstiloTexto = (tipo) => {
     if (tipo === 'critical') return 'text-rose-200';
     if (tipo === 'warning') return 'text-yellow-200';
     return 'text-blue-100';
  }

  if (!alertas || alertas.length === 0) {
    return (
      <div className="bg-gradient-to-r from-emerald-600/20 to-green-600/20 backdrop-blur-sm rounded-3xl p-6 md:p-8 border border-emerald-500/20 shadow-lg relative overflow-hidden">
        {/* Fondo decorativo */}
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl"></div>
        
        <div className="flex items-center justify-center text-center relative z-10">
          <div className="bg-emerald-500/20 p-4 rounded-full mb-4 border border-emerald-400/30 inline-block">
            <Check className="w-12 h-12 text-emerald-400" />
          </div>
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">¡Todo al día!</h3>
          <p className="text-emerald-200 text-base md:text-lg">No tienes pagos urgentes en este momento.</p>
          <p className="text-emerald-300/60 text-sm mt-4">Sigue manteniendo tus finanzas bajo control.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-900/20 to-indigo-900/20 backdrop-blur-sm rounded-3xl p-6 md:p-8 border border-purple-500/20 shadow-xl relative overflow-hidden">
      {/* Fondo decorativo */}
      <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl"></div>

      <div className="flex items-center justify-between mb-6 relative z-10">
        <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
          <div className="relative">
            <Bell className="w-8 h-8 text-purple-400" />
            <span className="absolute top-0 right-0 w-3 h-3 bg-rose-500 rounded-full animate-ping border-2 border-gray-900"></span>
          </div>
          🔔 ALERTAS DE PAGOS
        </h2>
        <span className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full border border-purple-500/30 font-bold text-sm">
          {alertas.length} {alertas.length === 1 ? 'Alerta' : 'Alertas'}
        </span>
      </div>

      <div className="space-y-3 md:space-y-4 relative z-10">
        {alertas.map((alerta, idx) => (
          <div
            key={idx}
            onClick={() => onAlertClick ? onAlertClick(alerta) : null}
            className={`
              relative p-4 md:p-5 rounded-2xl border backdrop-blur-sm transition-all duration-300 cursor-pointer
              hover:scale-[1.01] hover:shadow-xl active:scale-95
              ${getEstiloFondo(alerta.tipo)}
            `}
          >
            <div className="flex items-start gap-4 relative z-20">
              <div className="mt-1 p-2 bg-black/20 rounded-full backdrop-blur-md">
                {getIconoTipo(alerta.tipo)}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-base md:text-lg leading-tight mb-2">
                  {alerta.mensaje}
                </p>
                
                <div className="flex items-center gap-3">
                  {alerta.monto && (
                    <span className="inline-flex items-center px-2 py-1 rounded-lg bg-black/20 text-white text-sm md:text-base font-bold border border-white/10">
                      ${Number(alerta.monto).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  )}
                  <span className="text-gray-400 text-xs md:text-sm flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {new Date(alerta.fecha || Date.now()).toLocaleDateString('es-ES')}
                  </span>
                </div>
              </div>

              {onAlertClick && (
                <div className="shrink-0 opacity-50 hover:opacity-100 transition-opacity">
                  <ExternalLink className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
              )}
            </div>

            {/* Barra de urgencia decorativa para criticos */}
            {alerta.tipo === 'critical' && (
               <div className="mt-3 h-1 w-full bg-rose-500/50 rounded-full overflow-hidden">
                 <div className="h-full bg-rose-400 animate-[width_2s_ease-in-out_infinite] w-full"></div>
               </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer informativo */}
      <p className="text-center text-purple-200/60 text-xs md:text-sm mt-6 relative z-10">
        Toca una alerta para ver detalles o gestionar el pago automáticamente.
      </p>
    </div>
  );
}