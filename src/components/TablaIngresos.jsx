import { useState } from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import ModalIngreso from './ModalIngreso';
import ModalConfirmacion from './ModalConfirmacion';
import CardIngreso from './CardIngreso';

export default function TablaIngresos({ ingresos, updateIngreso, deleteIngreso }) {
  const [editando, setEditando] = useState(null);
  const [eliminando, setEliminando] = useState(null);

  const handleEditar = async (datosActualizados) => {
    const result = await updateIngreso(editando.id, datosActualizados);
    if (result.success) {
      setEditando(null);
    }
  };

  const handleEliminar = async () => {
    if (eliminando) {
      await deleteIngreso(eliminando.id);
      setEliminando(null);
    }
  };

  if (ingresos.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        No hay ingresos registrados
      </div>
    );
  }

  return (
    <>
      {/* Vista Mobile - Cards */}
      <div className="block md:hidden space-y-3">
        {ingresos.map((ingreso) => (
          <CardIngreso
            key={ingreso.id}
            ingreso={ingreso}
            onEditar={() => setEditando(ingreso)}
            onEliminar={() => setEliminando(ingreso)}
          />
        ))}
      </div>

      {/* Vista Desktop - Tabla */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left py-3 px-4 text-gray-300 font-semibold">Fecha</th>
              <th className="text-left py-3 px-4 text-gray-300 font-semibold">Fuente</th>
              <th className="text-left py-3 px-4 text-gray-300 font-semibold">Descripción</th>
              <th className="text-right py-3 px-4 text-gray-300 font-semibold">Monto</th>
              <th className="text-center py-3 px-4 text-gray-300 font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {ingresos.map((ingreso) => (
              <tr key={ingreso.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                <td className="py-3 px-4 text-gray-300">
                  {new Date(ingreso.fecha).toLocaleDateString('es-ES')}
                </td>
                <td className="py-3 px-4 text-white font-medium">{ingreso.fuente}</td>
                <td className="py-3 px-4 text-gray-300">{ingreso.descripcion}</td>
                <td className="py-3 px-4 text-right text-green-400 font-bold">
                  ${ingreso.monto.toFixed(2)}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => setEditando(ingreso)}
                      className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4 text-white" />
                    </button>
                    <button
                      onClick={() => setEliminando(ingreso)}
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
        <ModalIngreso
          onClose={() => setEditando(null)}
          onSave={handleEditar}
          ingresoInicial={editando}
        />
      )}

      <ModalConfirmacion
        isOpen={!!eliminando}
        onClose={() => setEliminando(null)}
        onConfirm={handleEliminar}
        titulo="¿Eliminar ingreso?"
        mensaje={`¿Estás seguro de eliminar el ingreso de $${eliminando?.monto.toFixed(2)} de ${eliminando?.fuente}?`}
      />
    </>
  );
}
