import { Repeat, Edit2, Trash2, Calendar } from 'lucide-react';

export default function CardSuscripcion({ suscripcion, onEditar, onEliminar }) {
  const getCostoMensual = () => {
    if (suscripcion.ciclo === 'Anual')   return suscripcion.costo / 12;
    if (suscripcion.ciclo === 'Semanal') return suscripcion.costo * 4.33;
    return suscripcion.costo;
  };

  const getCostoAnual = () => {
    if (suscripcion.ciclo === 'Anual')   return suscripcion.costo;
    if (suscripcion.ciclo === 'Semanal') return suscripcion.costo * 4.33 * 12;
    return suscripcion.costo * 12;
  };

  const costoMensual = getCostoMensual();
  const costoAnual   = getCostoAnual();
  const esAnual      = suscripcion.ciclo === 'Anual';

  return (
    <div className="border border-indigo-500/20 bg-indigo-500/8 rounded-2xl p-4 hover:bg-indigo-500/12 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-bold text-base leading-tight truncate">{suscripcion.servicio}</h3>
          <div className="flex items-baseline gap-1.5 mt-1 flex-wrap">
            <p className="text-indigo-300 text-xl font-black tabular-nums">
              ${costoMensual.toFixed(2)}
            </p>
            <span className="text-xs text-gray-500">/mes</span>
            {/* Badge ciclo de cobro */}
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
              esAnual
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                : suscripcion.ciclo === 'Semanal'
                ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                : 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20'
            }`}>
              {suscripcion.ciclo}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <div className={`p-2 rounded-xl ${suscripcion.estado === 'Activo' ? 'bg-indigo-600' : 'bg-gray-600'}`}>
            <Repeat className="w-4 h-4 text-white" />
          </div>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            suscripcion.estado === 'Activo'
              ? 'bg-emerald-500/15 text-emerald-400'
              : 'bg-gray-500/15 text-gray-500'
          }`}>
            {suscripcion.estado}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="space-y-1.5 mb-3 bg-black/20 rounded-xl p-2.5">
        {/* Costo anual real — la cifra que la gente suele ignorar */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 text-xs">Costo anual real:</span>
          <span className={`font-black text-sm tabular-nums ${costoAnual > 100 ? 'text-orange-400' : 'text-gray-300'}`}>
            ${costoAnual.toFixed(2)}
          </span>
        </div>
        {esAnual && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">Cobrado como:</span>
            <span className="text-amber-400 font-semibold">${suscripcion.costo.toFixed(2)} de una vez</span>
          </div>
        )}
        {suscripcion.proximo_pago && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span>Próximo: {new Date(suscripcion.proximo_pago + 'T12:00:00').toLocaleDateString('es', { day: 'numeric', month: 'short' })}</span>
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
