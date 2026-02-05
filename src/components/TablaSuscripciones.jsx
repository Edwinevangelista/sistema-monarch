import { useState } from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import ModalSuscripcion from './ModalSuscripcion';
import ModalConfirmacion from './ModalConfirmacion';
import CardSuscripcion from './CardSuscripcion';

export default function TablaSuscripciones({ suscripciones, updateSuscripcion, deleteSuscripcion }) {
  const [editando, setEditando] = useState(null);
  const [eliminando, setEliminando] = useState(null);

  const handleEditar = async (datosActualizados) => {
    const result = await updateSuscripcion(editando.id, datosActualizados);
    if (result.success) {
      setEditando(null);
    }
  };

  const handleEliminar = async () => {
    if (eliminando) {
      await deleteSuscripcion(eliminando.id);
      setEliminando(null);
    }
  };

  const getCostoMensual = (sub) => {
    if (sub.ciclo === 'Anual') return sub.costo / 12;
    if (sub.ciclo === 'Semanal') return sub.costo * 4.33;
    return sub.costo;
  };

  if (suscripciones.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        No hay suscripciones registradas
      </div>
    );
  }

  return (
    <>
      {/* Vista Mobile - Cards */}
      <div className="block md:hidden space-y-3">
        {suscripciones.map((sub) => (
          <CardSuscripcion
            key={sub.id}
            suscripcion={sub}
            onEditar={() => setEditando(sub)}
            onEliminar={() => setEliminando(sub)}
          />
        ))}
      </div>

      {/* Vista Desktop - Tabla */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left py-3 px-4 text-gray-300 font-semibold">Servicio</th>
              <th className="text-center py-3 px-4 text-gray-300 font-semibold">Ciclo</th>
              <th className="text-right py-3 px-4 text-gray-300 font-semibold">Costo</th>
              <th className="text-right py-3 px-4 text-gray-300 font-semibold">Mensual</th>
              <th className="text-center py-3 px-4 text-gray-300 font-semibold">Estado</th>
              <th className="text-center py-3 px-4 text-gray-300 font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {suscripciones.map((sub) => (
              <tr key={sub.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                <td className="py-3 px-4 text-white font-medium">{sub.servicio}</td>
                <td className="py-3 px-4 text-center text-gray-300">{sub.ciclo}</td>
                <td className="py-3 px-4 text-right text-purple-400 font-bold">
                  ${sub.costo.toFixed(2)}
                </td>
                <td className="py-3 px-4 text-right text-gray-400">
                  ${getCostoMensual(sub).toFixed(2)}
                </td>
                <td className="py-3 px-4 text-center">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    sub.estado === 'Activo'
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {sub.estado}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => setEditando(sub)}
                      className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4 text-white" />
                    </button>
                    <button
                      onClick={() => setEliminando(sub)}
                      className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editando && (
        <ModalSuscripcion
          onClose={() => setEditando(null)}
          onSave={handleEditar}
          suscripcionInicial={editando}
        />
      )}

      <ModalConfirmacion
        isOpen={!!eliminando}
        onClose={() => setEliminando(null)}
        onConfirm={handleEliminar}
        titulo="¿Eliminar suscripción?"
        mensaje={`¿Estás seguro de eliminar ${eliminando?.servicio} (${eliminando?.ciclo})?`}
      />
    </>
  );
}
