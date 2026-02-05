import { DollarSign, Edit2, Trash2, Calendar } from 'lucide-react';

export default function CardIngreso({ ingreso, onEditar, onEliminar }) {
  return (
    <div className="border-2 border-green-500/30 bg-green-500/10 rounded-xl p-4 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-white font-bold text-lg">{ingreso.fuente}</h3>
          <p className="text-green-400 text-2xl font-bold mt-1">
            ${ingreso.monto.toFixed(2)}
          </p>
        </div>
        <div className="bg-green-600 p-2 rounded-lg">
          <DollarSign className="w-5 h-5 text-white" />
        </div>
      </div>

      {/* Info */}
      <div className="space-y-1 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Calendar className="w-4 h-4" />
          <span>{new Date(ingreso.fecha).toLocaleDateString('es-ES')}</span>
        </div>
        {ingreso.descripcion && (
          <p className="text-sm text-gray-300">{ingreso.descripcion}</p>
        )}
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
