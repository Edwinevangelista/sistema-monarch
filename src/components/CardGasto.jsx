import { ShoppingCart, Edit2, Trash2, Calendar, CreditCard } from 'lucide-react';

export default function CardGasto({ gasto, onEditar, onEliminar }) {
  return (
    <div className="border-2 border-red-500/30 bg-red-500/10 rounded-xl p-4 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{gasto.categoria?.split(' ')[0]}</span>
            <h3 className="text-white font-bold text-base">
              {gasto.categoria?.split(' ').slice(1).join(' ')}
            </h3>
          </div>
          <p className="text-red-400 text-2xl font-bold">
            ${gasto.monto.toFixed(2)}
          </p>
        </div>
        <div className="bg-red-600 p-2 rounded-lg">
          <ShoppingCart className="w-5 h-5 text-white" />
        </div>
      </div>

      {/* Info */}
      <div className="space-y-1 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Calendar className="w-4 h-4" />
          <span>{new Date(gasto.fecha).toLocaleDateString('es-ES')}</span>
        </div>
        {gasto.descripcion && (
          <p className="text-sm text-gray-300">{gasto.descripcion}</p>
        )}
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <CreditCard className="w-4 h-4" />
          <span>{gasto.metodo}</span>
        </div>
      </div>

      {/* Acciones */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onEditar}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold text-sm text-white transition-colors flex items-center justify-center gap-2"
        >
          <Edit2 className="w-4 h-4" />
          Editar
        </button>
        <button
          onClick={onEliminar}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-semibold text-sm text-white transition-colors flex items-center justify-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Eliminar
        </button>
      </div>
    </div>
  );
}
