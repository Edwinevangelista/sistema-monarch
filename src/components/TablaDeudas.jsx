import { useState } from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import ModalAgregarDeuda from './ModalAgregarDeuda';
import ModalConfirmacion from './ModalConfirmacion';

export default function TablaDeudas({ deudas, updateDeuda, deleteDeuda }) {
  const [editando, setEditando] = useState(null);
  const [eliminando, setEliminando] = useState(null);

  const handleEditar = async (datosActualizados) => {
    const result = await updateDeuda(editando.id, datosActualizados);
    if (result.success) {
      setEditando(null);
    }
  };

  const handleEliminar = async () => {
    if (eliminando) {
      await deleteDeuda(eliminando.id);
      setEliminando(null);
    }
  };

  const getPorcentajePagado = (deuda) => {
    if (!deuda.balance || !deuda.saldo) return 0;
    return ((deuda.balance - deuda.saldo) / deuda.balance) * 100;
  };

  if (deudas.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        No hay deudas registradas
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left py-3 px-4 text-gray-300 font-semibold">Cuenta</th>
              <th className="text-right py-3 px-4 text-gray-300 font-semibold">Balance Total</th>
              <th className="text-right py-3 px-4 text-gray-300 font-semibold">Saldo Actual</th>
              <th className="text-right py-3 px-4 text-gray-300 font-semibold">Pago Mín.</th>
              <th className="text-center py-3 px-4 text-gray-300 font-semibold">Progreso</th>
              <th className="text-center py-3 px-4 text-gray-300 font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {deudas.map((deuda) => {
              const porcentaje = getPorcentajePagado(deuda);
              return (
                <tr key={deuda.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                  <td className="py-3 px-4 text-white font-medium">{deuda.cuenta}</td>
                  <td className="py-3 px-4 text-right text-gray-400">
                    ${deuda.balance?.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right text-red-400 font-bold">
                    ${deuda.saldo?.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right text-yellow-400">
                    ${deuda.pago_minimo?.toFixed(2)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all"
                          style={{ width: `${porcentaje}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400">
                        {porcentaje.toFixed(0)}% pagado
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => setEditando(deuda)}
                        className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4 text-white" />
                      </button>
                      <button
                        onClick={() => setEliminando(deuda)}
                        className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {editando && (
        <ModalAgregarDeuda
          onClose={() => setEditando(null)}
          onSave={handleEditar}
          deudaInicial={editando}
        />
      )}

      <ModalConfirmacion
        isOpen={!!eliminando}
        onClose={() => setEliminando(null)}
        onConfirm={handleEliminar}
        titulo="¿Eliminar deuda?"
        mensaje={`¿Estás seguro de eliminar ${eliminando?.cuenta} con saldo de $${eliminando?.saldo?.toFixed(2)}?`}
      />
    </>
  );
}
