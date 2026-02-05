import { Repeat, Edit2, Trash2, Calendar } from 'lucide-react';

export default function CardSuscripcion({ suscripcion, onEditar, onEliminar }) {
  const getCostoMensual = () => {
    if (suscripcion.ciclo === 'Anual') return suscripcion.costo / 12;
    if (suscripcion.ciclo === 'Semanal') return suscripcion.costo * 4.33;
    return suscripcion.costo;
  };

  return (
    <div className="border-2 border-indigo-500/30 bg-indigo-500/10 rounded-xl p-4 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-white font-bold text-lg">{suscripcion.servicio}</h3>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-purple-400 text-2xl font-bold">
              ${suscripcion.costo.toFixed(2)}
            </p>
            <span className="text-sm text-gray-400">/ {suscripcion.ciclo}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <Repeat className="w-5 h-5 text-white" />
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
            suscripcion.estado === 'Activo'
              ? 'bg-green-500/20 text-green-400'
              : 'bg-gray-500/20 text-gray-400'
          }`}>
            {suscripcion.estado}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="space-y-1 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Costo mensual:</span>
          <span className="text-white font-semibold">
            ${getCostoMensual().toFixed(2)}
          </span>
        </div>
        {suscripcion.proximo_pago && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Calendar className="w-4 h-4" />
            <span>Próximo: {new Date(suscripcion.proximo_pago).toLocaleDateString('es-ES')}</span>
          </div>
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
