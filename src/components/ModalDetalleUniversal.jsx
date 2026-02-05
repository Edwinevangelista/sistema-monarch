import React, { useState, useEffect, useMemo } from 'react'; // ✅ CORREGIDO: Incluir useMemo
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, CreditCard, Calendar, DollarSign, FileText, Repeat, 
  TrendingUp, Info, Wallet, Home, AlertTriangle
} from 'lucide-react';
import { ITEM_TYPES } from '../constants/itemTypes';

export default function ModalDetalleUniversal({
  item,
  type,
  onClose,
  onEditar,
  onPagar
}) {
  // Bloquear scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  // Helpers de visualización según tipo
  const themeConfig = useMemo(() => {
    switch (type) {
      case ITEM_TYPES.DEUDA:
        return { 
          icon: CreditCard, color: 'text-purple-400', bg: 'bg-purple-500/20', border: 'border-purple-500/30',
          label: 'Tarjeta de Crédito', gradient: 'from-purple-900/40 to-indigo-900/40'
        };
      case ITEM_TYPES.SUSCRIPCION:
        return { 
          icon: Repeat, color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/30',
          label: 'Suscripción', gradient: 'from-blue-900/40 to-indigo-900/40'
        };
      case ITEM_TYPES.FIJO:
        return { 
          icon: Calendar, color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30',
          label: 'Gasto Fijo', gradient: 'from-yellow-900/40 to-orange-900/40'
        };
      case ITEM_TYPES.INGRESO:
        return { 
          icon: Wallet, color: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/30',
          label: 'Ingreso', gradient: 'from-emerald-900/40 to-green-900/40'
        };
      default:
        return { 
          icon: FileText, color: 'text-rose-400', bg: 'bg-rose-500/20', border: 'border-rose-500/30',
          label: 'Gasto Variable', gradient: 'from-rose-900/40 to-red-900/40'
        };
    }
  }, [type]);

  const IconComponent = themeConfig.icon;

  if (!item || !themeConfig) return null;

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
          className={`bg-gray-900 w-full h-full md:w-[600px] md:h-auto md:max-h-[90vh] rounded-none md:rounded-3xl shadow-2xl border border-white/10 flex flex-col relative overflow-hidden`}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header con Gradiente Dinámico */}
          <div className={`bg-gradient-to-r ${themeConfig.gradient} backdrop-blur-md p-6 pb-8 border-b border-white/5 shrink-0 relative`}>
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-black/30 hover:bg-black/50 rounded-full text-white/70 hover:text-white transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-start gap-4 md:gap-5 relative z-10">
              <div className={`p-3 md:p-4 rounded-2xl md:rounded-3xl border-2 border-white/20 shadow-lg ${themeConfig.bg} ${themeConfig.color} backdrop-blur-md`}>
                <IconComponent className="w-8 h-8 md:w-10 md:h-10" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-white leading-none mb-1">
                  {type === ITEM_TYPES.DEUDA ? item.cuenta : item.nombre}
                </h2>
                <div className={`text-lg md:text-2xl font-bold ${type === ITEM_TYPES.INGRESO ? 'text-emerald-300' : type === ITEM_TYPES.DEUDA ? 'text-rose-300' : 'text-white'}`}>
                  ${type === ITEM_TYPES.INGRESO ? '+' : ''}{type === ITEM_TYPES.DEUDA && item.saldo ? item.saldo.toLocaleString() : item.monto?.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Contenido Scrollable */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
            
            {/* Fecha (Si aplica) */}
            {(item.fecha || item.vence || item.proximo_pago) && (
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                <div className="flex items-center gap-3 mb-2">
                  <Calendar className={`w-5 h-5 ${themeConfig.color}`} />
                  <span className="text-white text-sm font-bold uppercase tracking-wider">Fecha</span>
                </div>
                <p className="text-white text-lg font-medium">
                  {type === ITEM_TYPES.FIJO 
                    ? `Vence el día ${item.dia_venc} de cada mes`
                    : new Date(item.fecha || item.vence || item.proximo_pago).toLocaleDateString('es-ES', {
                        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                      })
                  }
                </p>
              </div>
            )}

            {/* Detalles Específicos (Categoría / Tipo) */}
            {(item.categoria || item.tipo || item.descripcion) && (
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                 <div className="flex items-center gap-3 mb-2">
                  <Info className={`w-5 h-5 text-gray-400`} />
                  <span className="text-white text-sm font-bold uppercase tracking-wider">Detalles</span>
                </div>
                <div className="space-y-2 text-sm md:text-base">
                   {item.categoria && (
                     <p className="text-gray-300"><span className="text-gray-500 font-medium">Categoría:</span> {item.categoria}</p>
                   )}
                   {item.tipo && (
                     <p className="text-gray-300"><span className="text-gray-500 font-medium">Tipo:</span> {item.tipo}</p>
                   )}
                   {item.descripcion && (
                     <p className="text-white leading-relaxed">{item.descripcion}</p>
                   )}
                </div>
              </div>
            )}

            {/* Metadatos (ID, Created At) */}
            <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
               <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-3">Información técnica</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                 <div className="flex justify-between border-b border-white/5 pb-2">
                   <span className="text-gray-500">ID:</span>
                   <span className="text-gray-300 font-mono text-xs">{item.id.substring(0, 8)}...</span>
                 </div>
                 <div className="flex justify-between border-b border-white/5 pb-2">
                   <span className="text-gray-500">Creado:</span>
                   <span className="text-gray-300">{new Date(item.created_at || Date.now()).toLocaleDateString('es-ES')}</span>
                 </div>
               </div>
            </div>
          </div>

          {/* Footer con Botones de Acción */}
          <div className="p-6 border-t border-white/10 bg-gray-900/80 backdrop-blur-sm shrink-0 z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              {/* Botón Editar */}
              <button
                onClick={() => { if (onEditar) onEditar(item); onClose(); }}
                className="flex items-center justify-center gap-2 py-3 md:py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold text-white transition-all active:scale-95"
              >
                Editar Detalles
              </button>

              {/* Botón Acción (Pagar / Marcar / etc.) */}
              {onPagar && type !== ITEM_TYPES.INGRESO && (
                <button
                  onClick={() => { onPagar(item, type); onClose(); }}
                  className={`flex items-center justify-center gap-2 py-3 md:py-4 rounded-xl font-bold text-white shadow-lg shadow-opacity-20 transition-all active:scale-95 ${themeConfig.bg} hover:opacity-90`}
                >
                  <Home className="w-5 h-5" />
                  {type === ITEM_TYPES.DEUDA ? 'Registrar Pago' : type === ITEM_TYPES.FIJO ? 'Marcar Pagado' : 'Gestionar'}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}