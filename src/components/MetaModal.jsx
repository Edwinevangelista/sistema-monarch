// src/components/MetaModal.jsx
// Modal para seleccionar meta - Optimizado para móvil

import { X } from "lucide-react";
import { useEffect } from "react";

export default function MetaModal({ metas, currentGoal, onSelect, onClose }) {
  // Bloquear scroll del body cuando el modal está abierto
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="absolute inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg max-h-[85vh] overflow-hidden shadow-2xl border-t border-white/20 sm:border animate-in slide-in-from-bottom duration-300 sm:slide-in-from-bottom-0">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-purple-600/30 to-indigo-600/30 backdrop-blur-lg border-b border-white/10 p-5 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Elige tu meta</h2>
              <p className="text-purple-200 text-sm mt-1">Selecciona en qué quieres enfocarte</p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(85vh-88px)] p-4 space-y-3">
            {metas.map((meta) => {
              const isActive = meta.key === currentGoal;
              
              return (
                <button
                  key={meta.key}
                  onClick={() => onSelect(meta.key)}
                  className={`
                    w-full rounded-2xl p-5 border-2 transition-all active:scale-98
                    ${isActive 
                      ? 'bg-gradient-to-br ' + meta.color + ' border-white/40 shadow-lg scale-[1.02]' 
                      : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                    }
                  `}
                >
                  <div className="flex items-center gap-4">
                    {/* Emoji grande */}
                    <div className={`
                      w-16 h-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0
                      ${isActive ? 'bg-white/20' : 'bg-white/10'}
                    `}>
                      {meta.emoji}
                    </div>

                    {/* Info */}
                    <div className="flex-1 text-left">
                      <div className="text-white font-bold text-lg mb-1">{meta.label}</div>
                      <div className={`text-sm ${isActive ? 'text-white/90' : 'text-purple-200'}`}>
                        {meta.descripcion}
                      </div>
                    </div>

                    {/* Check si está activo */}
                    {isActive && (
                      <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer con tip */}
          <div className="sticky bottom-0 bg-gradient-to-r from-purple-600/20 to-indigo-600/20 backdrop-blur-lg border-t border-white/10 p-4">
            <div className="flex items-start gap-3">
              <span className="text-xl">💡</span>
              <p className="text-purple-200 text-xs leading-relaxed">
                <span className="font-semibold text-white">Tip:</span> Empieza con "Reporte General" para entender tu situación, luego elige una meta específica.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}