import { useState } from 'react';
import { Edit2, Trash2, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import ModalGastoFijo from './ModalGastoFijo';
import ModalConfirmacion from './ModalConfirmacion';
import CardGastoFijo from './CardGastoFijo';

export default function TablaGastosFijos({ gastosFijos, updateGastoFijo, updateEstado, deleteGastoFijo }) {
  const [editando, setEditando] = useState(null);
  const [eliminando, setEliminando] = useState(null);

  const handleEditar = async (datosActualizados) => {
    const result = await updateGastoFijo(editando.id, datosActualizados);
    if (result.success) {
      setEditando(null);
    }
  };

  const handleEliminar = async () => {
    if (eliminando) {
      await deleteGastoFijo(eliminando.id);
      setEliminando(null);
    }
  };

  const handleCambiarEstado = async (id, estadoActual) => {
    const nuevoEstado = estadoActual === 'Pagado' ? 'Pendiente' : 'Pagado';
    await updateEstado(id, nuevoEstado);
  };

  const getEstadoInfo = (gastoFijo) => {
    const hoy = new Date();
    const vence = new Date(hoy.getFullYear(), hoy.getMonth(), gastoFijo.dia_venc);
    const diff = Math.round((vence - hoy) / (1000 * 60 * 60 * 24));

    if (gastoFijo.estado === 'Pagado') {
      return {
        color: 'text-green-400',
        bgColor: 'bg-green-500/20',
        icon: <CheckCircle className="w-5 h-5" />,
        texto: 'Pagado'
      };
    }

    if (diff < 0) {
      return {
        color: 'text-red-400',
        bgColor: 'bg-red-500/20',
        icon: <AlertCircle className="w-5 h-5" />,
        texto: `Vencido (${Math.abs(diff)} días)`
      };
    }

    if (diff <= 3) {
      return {
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/20',
        icon: <Clock className="w-5 h-5" />,
        texto: `Vence en ${diff} días`
      };
    }

    return {
      color: 'text-gray-400',
      bgColor: 'bg-gray-700/50',
      icon: <Clock className="w-5 h-5" />,
      texto: `Vence día ${gastoFijo.dia_venc}`
    };
  };

  if (gastosFijos.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        No hay gastos fijos registrados
      </div>
    );
  }

  return (
    <>
      {/* Vista Mobile - Cards */}
      <div className="block md:hidden space-y-3">
        {gastosFijos.map((gf) => (
          <CardGastoFijo
            key={gf.id}
            gasto={gf}
            onMarcarPagado={() => handleCambiarEstado(gf.id, gf.estado)}
            onEditar={() => setEditando(gf)}
            onEliminar={() => setEliminando(gf)}
          />
        ))}
      </div>

      {/* Vista Desktop - Tabla */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left py-3 px-4 text-gray-300 font-semibold">Nombre</th>
              <th className="text-center py-3 px-4 text-gray-300 font-semibold">Día Venc.</th>
              <th className="text-right py-3 px-4 text-gray-300 font-semibold">Monto</th>
              <th className="text-center py-3 px-4 text-gray-300 font-semibold">Estado</th>
              <th className="text-center py-3 px-4 text-gray-300 font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {gastosFijos.map((gf) => {
              const estadoInfo = getEstadoInfo(gf);
              return (
                <tr key={gf.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                  <td className="py-3 px-4 text-white font-medium">{gf.nombre}</td>
                  <td className="py-3 px-4 text-center text-gray-300">{gf.dia_venc}</td>
                  <td className="py-3 px-4 text-right text-yellow-400 font-bold">
                    ${gf.monto.toFixed(2)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-2">
                      <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${estadoInfo.bgColor}`}>
                        <span className={estadoInfo.color}>{estadoInfo.icon}</span>
                        <span className={`text-sm font-semibold ${estadoInfo.color}`}>
                          {estadoInfo.texto}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleCambiarEstado(gf.id, gf.estado)}
                        className={`p-2 rounded-lg transition-colors ${
                          gf.estado === 'Pagado'
                            ? 'bg-gray-600 hover:bg-gray-700'
                            : 'bg-green-600 hover:bg-green-700'
                        }`}
                        title={gf.estado === 'Pagado' ? 'Marcar Pendiente' : 'Marcar Pagado'}
                      >
                        <CheckCircle className="w-4 h-4 text-white" />
                      </button>
                      <button
                        onClick={() => setEditando(gf)}
                        className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4 text-white" />
                      </button>
                      <button
                        onClick={() => setEliminando(gf)}
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
        <ModalGastoFijo
          onClose={() => setEditando(null)}
          onSave={handleEditar}
          gastoInicial={editando}
        />
      )}

      <ModalConfirmacion
        isOpen={!!eliminando}
        onClose={() => setEliminando(null)}
        onConfirm={handleEliminar}
        titulo="¿Eliminar gasto fijo?"
        mensaje={`¿Estás seguro de eliminar ${eliminando?.nombre} de $${eliminando?.monto.toFixed(2)}?`}
      />
    </>
  );
}
