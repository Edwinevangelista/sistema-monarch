import { ShoppingCart, Edit2, Trash2, Calendar, CreditCard, Receipt } from 'lucide-react';

export default function CardGasto({ gasto, onEditar, onEliminar }) {
  // Extraer el emoji y el nombre de la categoría de forma segura
  // Asumiendo formato "🍔 Comida"
  const categoriaCompleta = gasto.categoria || '📦 Otros';
  const emoji = categoriaCompleta.charAt(0);
  const nombreCategoria = categoriaCompleta.slice(2) || 'Gasto';

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 hover:border-red-500/30 hover:shadow-[0_0_20px_rgba(248,113,113,0.1)] transition-all duration-300 group">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="bg-gradient-to-br from-red-500/20 to-orange-500/20 p-2.5 rounded-xl border border-red-500/20 group-hover:scale-110 transition-transform">
            <span className="text-2xl filter drop-shadow-sm">{emoji}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-bold text-base truncate group-hover:text-red-200 transition-colors">
              {nombreCategoria}
            </h3>
            {gasto.descripcion && (
              <p className="text-xs text-gray-400 mt-0.5 truncate">{gasto.descripcion}</p>
            )}
          </div>
        </div>
        <div className="bg-red-600/10 p-2 rounded-lg border border-red-500/10 group-hover:bg-red-600/20 transition-colors">
          <ShoppingCart className="w-5 h-5 text-red-400" />
        </div>
      </div>

      {/* Monto Principal */}
      <div className="flex justify-between items-end mb-5 pb-4 border-b border-white/5">
        <div className="flex flex-col gap-0.5">
          <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Total</div>
          <div className="text-2xl font-bold text-white tracking-tight">
            ${gasto.monto?.toFixed(2) || '0.00'}
          </div>
        </div>
        {gasto.cuenta_id && (
          <div className="text-right">
            <Receipt className="w-4 h-4 text-gray-500 mx-auto mb-1" />
            <div className="text-[10px] text-gray-400">Registrado</div>
          </div>
        )}
      </div>

      {/* Detalles Metadata */}
      <div className="space-y-2 mb-5">
        <div className="flex items-center gap-3 text-xs text-gray-400 bg-white/5 p-2 rounded-lg">
          <Calendar className="w-4 h-4 text-gray-500" />
          <span className="font-medium text-gray-300">
            {new Date(gasto.fecha).toLocaleDateString('es-ES', { 
              weekday: 'short', 
              day: 'numeric', 
              month: 'short' 
            })}
          </span>
        </div>
        {gasto.metodo && (
          <div className="flex items-center gap-3 text-xs text-gray-400 bg-white/5 p-2 rounded-lg">
            <CreditCard className="w-4 h-4 text-gray-500" />
            <span className="font-medium text-gray-300">{gasto.metodo}</span>
          </div>
        )}
      </div>

      {/* Acciones */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onEditar}
          className="px-3 py-2 bg-blue-600/80 hover:bg-blue-600 text-white rounded-xl font-semibold text-xs transition-all active:scale-95 flex items-center justify-center gap-1.5 border border-blue-500/20"
        >
          <Edit2 className="w-3.5 h-3.5" />
          Editar
        </button>
        <button
          onClick={onEliminar}
          className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 rounded-xl font-semibold text-xs transition-all active:scale-95 flex items-center justify-center gap-1.5 border border-rose-500/20"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Eliminar
        </button>
      </div>
    </div>
  );
}