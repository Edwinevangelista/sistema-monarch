import React, { useEffect } from 'react';
import { X, Sparkles, Target, Check } from 'lucide-react';

export default function MetaModal({ metas, currentGoal, onSelect, onClose }) {
  // Bloquear scroll del body
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4 bg-black/80 backdrop-blur-sm">
      {/* Contenedor Principal */}
      <div className="bg-gradient-to-br from-purple-900 to-indigo-900 w-full h-full md:w-[500px] md:h-auto md:max-h-[90vh] rounded-none md:rounded-2xl shadow-2xl border border-white/10 flex flex-col relative overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-white/10 bg-white/5 backdrop-blur-lg shrink-0">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-white/20 rounded-xl shadow-inner">
               <Target className="w-6 h-6 text-white" />
             </div>
             <div>
               <h2 className="text-xl md:text-2xl font-bold text-white leading-none">Elige tu meta</h2>
               <p className="text-purple-200 text-xs md:text-sm mt-1">Selecciona en qué quieres enfocarte</p>
             </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition active:scale-95"
          >
            <X className="w-5 h-5 md:w-6 md:h-6 text-white" />
          </button>
        </div>

        {/* Contenido (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3 pb-20 md:pb-6">
          {metas.map((meta) => {
            const isActive = meta.key === currentGoal;

            return (
              <button
                key={meta.key}
                onClick={() => onSelect(meta.key)}
                className={`
                  w-full text-left p-4 md:p-5 rounded-2xl border-2 transition-all duration-200 flex items-center gap-3 md:gap-4 active:scale-[0.98] group relative
                  ${isActive
                    ? 'bg-white/20 border-white/40 shadow-lg shadow-purple-500/20'
                    : 'bg-transparent border-white/10 hover:bg-white/5 hover:border-white/20'
                  }
                `}
              >
                {/* Emoji */}
                <div className={`
                  w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl flex items-center justify-center text-2xl md:text-3xl flex-shrink-0 group-hover:scale-110 transition-transform duration-200
                  ${isActive ? 'bg-white/30' : 'bg-white/10'}
                `}>
                  {meta.emoji}
                </div>

                {/* Texto */}
                <div className="flex-1 text-left min-w-0">
                  <h3 className="text-white font-bold text-base md:text-lg truncate leading-tight">{meta.label}</h3>
                  <p className={`
                    text-[11px] md:text-sm font-bold uppercase tracking-wider
                    ${isActive ? 'text-white/90' : 'text-purple-200'}
                  `}>
                    {meta.tipo || 'General'}
                  </p>
                  {meta.descripcion && (
                    <p className="text-gray-300 text-xs md:text-sm mt-1 leading-tight truncate opacity-90">{meta.descripcion}</p>
                  )}
                </div>

                {/* Check si está activo */}
                {isActive && (
                  <div className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-green-500 shadow-lg shadow-green-500/50 flex items-center justify-center flex-shrink-0 animate-bounce-in">
                     <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 md:p-6 border-t border-white/10 shrink-0 bg-white/5 backdrop-blur-lg">
          <div className="flex items-start gap-2 md:gap-3">
             <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-purple-300 flex-shrink-0" />
             <p className="text-purple-100 text-xs md:text-sm leading-relaxed">
               <span className="font-semibold text-white block">Tip:</span> Empieza con "Reporte General" para entender tu situación, luego elige una meta específica para empezar a ahorrar.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}