import React, { useEffect, useMemo } from 'react'; // <-- Se eliminó useState aquí
import { motion, AnimatePresence } from "framer-motion";
import { X, BarChart3, Hash, PieChart } from "lucide-react";

export default function ModalDetallesCategorias({
  gastosPorCategoria,
  onClose,
}) {
  // Bloquear scroll del body
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Procesar datos
  const { entries, total } = useMemo(() => {
    if (!gastosPorCategoria) return { entries: [], total: 0 };
    
    const entries = Object.entries(gastosPorCategoria)
      .map(([categoria, monto]) => ({ categoria, monto: Number(monto) || 0 }))
      .sort((a, b) => b.monto - a.monto);
      
    const total = entries.reduce((sum, item) => sum + item.monto, 0);
    return { entries, total };
  }, [gastosPorCategoria]);

  if (!entries || entries.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-gray-900 rounded-3xl max-w-sm w-full p-8 text-center border border-white/10 shadow-2xl"
        >
          <PieChart className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Sin Datos</h2>
          <p className="text-gray-400">No hay gastos registrados para mostrar detalles.</p>
          <button
            onClick={onClose}
            className="mt-6 px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors"
          >
            Cerrar
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-gray-900 w-full h-full md:w-[600px] md:h-auto md:max-h-[90vh] rounded-none md:rounded-3xl shadow-2xl border border-white/10 flex flex-col relative overflow-hidden"
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-900/50 to-blue-900/50 backdrop-blur-md p-5 md:p-6 border-b border-white/5 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-500/20 p-2.5 rounded-xl border border-indigo-500/30 text-indigo-400 shadow-sm">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-white">Detalles por Categoría</h2>
                  <p className="text-indigo-200 text-xs md:text-sm">Análisis de tu presupuesto</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-indigo-300 hover:text-white transition-colors"
              >
                <X className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </div>
          </div>

          {/* Resumen Total (Sticky Top) */}
          <div className="p-4 md:p-6 bg-gray-800/30 border-b border-white/5 shrink-0 z-10">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm md:text-base">Total del periodo:</span>
              <span className="text-2xl md:text-3xl font-bold text-emerald-400">
                ${total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>

          {/* Lista de Categorías con Barras (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar pb-20 md:pb-6">
            <div className="space-y-4 md:space-y-5">
              {entries.map((item, index) => {
                const percentage = total > 0 ? (item.monto / total) * 100 : 0;
                
                // Colores dinámicos por índice
                let barColor = 'bg-indigo-500';
                let iconBg = 'bg-indigo-500/20';
                let textColor = 'text-indigo-200';
                
                if (index === 0) { barColor = 'bg-rose-500'; iconBg = 'bg-rose-500/20'; textColor = 'text-rose-200'; }
                else if (index === 1) { barColor = 'bg-orange-500'; iconBg = 'bg-orange-500/20'; textColor = 'text-orange-200'; }
                else if (index === 2) { barColor = 'bg-yellow-500'; iconBg = 'bg-yellow-500/20'; textColor = 'text-yellow-200'; }

                return (
                  <motion.div
                    key={item.categoria}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white/5 border border-white/5 rounded-2xl p-3 md:p-5 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`p-2 rounded-lg ${iconBg} ${textColor} border border-opacity-30`}>
                          <Hash className="w-4 h-4" />
                        </div>
                        <h3 className="text-white font-semibold text-sm md:text-base truncate">
                          {item.categoria}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2 text-sm md:text-base">
                        <span className={`font-bold ${textColor}`}>
                          ${item.monto.toLocaleString()}
                        </span>
                        <span className="text-gray-500 text-xs">
                          ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                    
                    {/* Barra Visual */}
                    <div className="w-full bg-gray-700/30 rounded-full h-2 md:h-2.5 overflow-hidden">
                      <motion.div 
                        className={`h-full rounded-full ${barColor} shadow-sm`}
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.8, delay: index * 0.05, ease: "easeOut" }}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Footer Mobile */}
          <div className="md:hidden p-4 border-t border-white/5 bg-gray-900/50 shrink-0">
             <button
               onClick={onClose}
               className="w-full py-3.5 bg-white/5 hover:bg-white/10 text-white rounded-xl font-semibold transition-colors border border-white/10"
             >
               Cerrar
             </button>
          </div>

          {/* Estilos personalizados para scrollbar (Standard React way) */}
          <style>{`
            .custom-scrollbar::-webkit-scrollbar { width: 6px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.05); border-radius: 10px; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.5); border-radius: 10px; }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(99, 102, 241, 0.7); }
          `}</style>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}