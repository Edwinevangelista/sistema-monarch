import { useState } from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import ModalGastoVariable from './ModalGastoVariable';
import ModalConfirmacion from './ModalConfirmacion';

export default function TablaGastos({ gastos, updateGasto, deleteGasto }) {
  const [editando, setEditando] = useState(null);
  const [eliminando, setEliminando] = useState(null);

  const handleEditar = async (datosActualizados) => {
    const result = await updateGasto(editando.id, datosActualizados);
    if (result.success) {
      setEditando(null);
    }
  };

  const handleEliminar = async () => {
    if (eliminando) {
      await deleteGasto(eliminando.id);
      setEliminando(null);
    }
  };

  if (gastos.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        No hay gastos registrados
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left py-3 px-4 text-gray-300 font-semibold">Fecha</th>
              <th className="text-left py-3 px-4 text-gray-300 font-semibold">Categoría</th>
              <th className="text-left py-3 px-4 text-gray-300 font-semibold">Descripción</th>
              <th className="text-left py-3 px-4 text-gray-300 font-semibold">Método</th>
              <th className="text-right py-3 px-4 text-gray-300 font-semibold">Monto</th>
              <th className="text-center py-3 px-4 text-gray-300 font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {gastos.map((gasto) => (
              <tr key={gasto.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                <td className="py-3 px-4 text-gray-300">
                  {new Date(gasto.fecha).toLocaleDateString('es-ES')}
                </td>
                <td className="py-3 px-4 text-white font-medium">{gasto.categoria}</td>
                <td className="py-3 px-4 text-gray-300">{gasto.descripcion}</td>
                <td className="py-3 px-4 text-gray-400 text-sm">{gasto.metodo}</td>
                <td className="py-3 px-4 text-right text-red-400 font-bold">
                  ${gasto.monto.toFixed(2)}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => setEditando(gasto)}
                      className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4 text-white" />
                    </button>
                    <button
                      onClick={() => setEliminando(gasto)}
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
        <ModalGastoVariable
          onClose={() => setEditando(null)}
          onSave={handleEditar}
          gastoInicial={editando}
        />
      )}

      <ModalConfirmacion
        isOpen={!!eliminando}
        onClose={() => setEliminando(null)}
        onConfirm={handleEliminar}
        titulo="¿Eliminar gasto?"
        mensaje={`¿Estás seguro de eliminar el gasto de $${eliminando?.monto.toFixed(2)} en ${eliminando?.categoria}?`}
      />
    </>
  );
}
