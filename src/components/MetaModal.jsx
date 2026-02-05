import React, { useEffect } from 'react';
import { X, Sparkles, Target, Check, ArrowRight, TrendingUp, PiggyBank, Home } from 'lucide-react';

export default function MetaModal({ metas, currentGoal, onSelect, onClose }) {
  // Bloquear scroll del body cuando el modal está abierto
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Mapa de iconos para metas
  const getIconForGoal = (meta) => {
    if (meta.key === 'ahorro') return <TrendingUp className="w-6 h-6 md:w-8 md:h-8" />;
    if (meta.key === 'fondo') return <PiggyBank className="w-6 h-6 md:w-8 md:h-8" />;
    if (meta.key === 'casa') return <Home className="w-6 h-6 md:w-8 md:h-8" />;
    return <Target className="w-6 h-6 md:w-8 md:h-8" />;
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in">
      {/* Contenedor: Pantalla completa en móvil, centrado en escritorio */}
      <div className="bg-gradient-to-br from-purple-900 to-indigo-900 w-full h-full md:h-auto md:w-[600px] md:max-h-[90vh] md:rounded-3xl shadow-2xl border border-white/10 flex flex-col relative overflow-hidden md:p-6">
        
        {/* Fondo Decorativo */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>

        {/* Header (Solo Móvil) */}
        <div className="md:hidden flex items-center justify-between p-6 border-b border-white/10 bg-white/5 backdrop-blur-md shrink-0 z-10">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-white/10 rounded-lg border border-white/20">
               <Target className="w-6 h-6 text-white" />
             </div>
             <div>
               <h2 className="text-xl font-bold text-white leading-tight">Elige tu Meta</h2>
               <p className="text-purple-200 text-xs">En qué quieres enfocarte hoy</p>
             </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white/70 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Contenido Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 z-10 custom-scrollbar">
          
          {/* Subtítulo (Escritorio) */}
          <div className="hidden md:flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
             <div className="p-3 bg-white/10 rounded-xl border border-white/20">
               <Target className="w-8 h-8 text-white" />
             </div>
             <div>
               <h2 className="text-2xl font-bold text-white">Elige tu Meta</h2>
               <p className="text-purple-200">Selecciona un objetivo para comenzar el plan financiero.</p>
             </div>
          </div>

          {/* Grid de Metas */}
          <div className="grid grid-cols-1 md:grid-cols-1 gap-4 md:gap-6">
            {metas.map((meta) => {
              const isActive = meta.key === currentGoal;
              const Icon = getIconForGoal(meta);

              return (
                <button
                  key={meta.key}
                  onClick={() => onSelect(meta.key)}
                  className={`
                    w-full text-left p-5 md:p-6 rounded-2xl md:rounded-3xl border-2 transition-all duration-300 relative overflow-hidden flex items-center justify-between group
                    ${isActive
                      ? 'bg-white/10 border-white/40 shadow-[0_0_20px_rgba(255,255,255,0.2)] scale-[1.02]'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/30 hover:scale-[1.01]'
                    }
                  `}
                >
                  {/* Fondo dinámico activo */}
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 pointer-events-none animate-pulse"></div>
                  )}

                  {/* Izquierda: Icono + Texto */}
                  <div className="flex items-center gap-4 md:gap-5 relative z-10">
                    <div className={`
                      w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-3xl flex items-center justify-center border transition-colors duration-300
                      ${isActive ? 'bg-white text-purple-600 border-white shadow-lg' : 'bg-white/10 border-white/20 text-purple-300'}
                    `}>
                      {Icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className={`text-base md:text-xl font-bold mb-1 transition-colors ${isActive ? 'text-white' : 'text-gray-200'}`}>
                        {meta.label}
                      </h3>
                      <p className={`
                        text-[11px] md:text-sm font-bold uppercase tracking-wider
                        ${isActive ? 'text-purple-200' : 'text-gray-500'}
                      `}>
                        {meta.tipo || 'General'}
                      </p>
                      {meta.description && (
                        <p className={`
                          text-sm mt-1 line-clamp-2
                          ${isActive ? 'text-white/90' : 'text-gray-400'}
                        `}>
                          {meta.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Derecha: Checkmark de Activo */}
                  <div className="relative z-10">
                    {isActive && (
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-green-500 border-4 border-gray-900 shadow-lg flex items-center justify-center animate-in zoom-in-95 duration-300">
                        <Check className="w-5 h-5 text-white" />
                      </div>
                    )}
                    {!isActive && (
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowRight className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer con Tip (Escritorio) */}
        <div className="hidden md:flex items-start gap-3 p-6 pt-4 mt-auto bg-white/5 backdrop-blur-sm border-t border-white/10 shrink-0 z-10">
           <Sparkles className="w-5 h-5 text-purple-300 flex-shrink-0" />
           <p className="text-sm text-purple-100/80 leading-relaxed">
             <span className="font-semibold text-white block mb-1">💡 Tip:</span> 
             Empieza con "Reporte General" para entender tu situación actual, luego elige una meta específica para comenzar a ahorrar de manera inteligente.
           </p>
        </div>

        {/* Botón Cerrar (Solo Móvil) */}
        <div className="md:hidden p-4 border-t border-white/10 bg-gray-900/50 shrink-0 z-10">
           <button
             onClick={onClose}
             className="w-full py-4 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-colors"
           >
             Cancelar
           </button>
        </div>
      </div>
    </div>
  );
}