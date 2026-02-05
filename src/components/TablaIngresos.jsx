import React, { useState } from 'react';
import { Edit2, Trash2, Wallet, DollarSign, Calendar } from 'lucide-react';
import ModalIngreso from './ModalIngreso';
import ModalConfirmacion from './ModalConfirmacion';

// --- COMPONENTE TARJETA (Para Móvil) ---
function IngresoCard({ ingreso, onEditar, onEliminar }) {
  return (
    <div className="bg-gradient-to-br from-emerald-900/40 to-green-900/20 backdrop-blur-sm rounded-2xl border border-emerald-500/20 p-5 shadow-lg hover:shadow-emerald-900/20 transition-all">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className="text-white font-bold text-lg">{ingreso.fuente}</h4>
          <p className="text-emerald-200/70 text-sm">{ingreso.descripcion}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onEditar} className="p-2 bg-white/10 hover:bg-white/20 text-emerald-300 rounded-xl transition-colors">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={onEliminar} className="p-2 bg-white/10 hover:bg-white/20 text-rose-300 rounded-xl transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-white/10 pt-3">
        <div className="flex items-center gap-2 text-emerald-100/60 text-sm">
          <Calendar className="w-4 h-4" />
          <span>{new Date(ingreso.fecha).toLocaleDateString('es-ES')}</span>
        </div>
        <p className="text-emerald-300 font-bold text-xl">${ingreso.monto.toFixed(2)}</p>
      </div>
    </div>
  );
}

// --- COMPONENTE PRINCIPAL ---
export default function TablaIngresos({ ingresos, updateIngreso, deleteIngreso }) {
  const [editando, setEditando] = useState(null);
  const [eliminando, setEliminando] = useState(null);

  const handleEditar = async (datosActualizados) => {
    const result = await updateIngreso(editando.id, datosActualizados);
    if (result.success) setEditando(null);
  };

  const handleEliminar = async () => {
    if (eliminando) {
      await deleteIngreso(eliminando.id);
      setEliminando(null);
    }
  };

  if (ingresos.length === 0) {
    return (
      <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
        <div className="text-5xl mb-3 opacity-30">💸</div>
        <p className="text-gray-400">No hay ingresos registrados</p>
      </div>
    );
  }

  return (
    <>
      {/* VISTA MÓVIL */}
      <div className="block md:hidden space-y-4">
        {ingresos.map((ingreso) => (
          <IngresoCard
            key={ingreso.id}
            ingreso={ingreso}
            onEditar={() => setEditando(ingreso)}
            onEliminar={() => setEliminando(ingreso)}
          />
        ))}
      </div>

      {/* VISTA ESCRITORIO */}
      <div className="hidden md:block overflow-x-auto bg-white/5 rounded-2xl border border-white/10 shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              <th className="text-left py-4 px-6 text-gray-300 font-semibold text-sm uppercase tracking-wider">Fecha</th>
              <th className="text-left py-4 px-6 text-gray-300 font-semibold text-sm uppercase tracking-wider">Fuente</th>
              <th className="text-left py-4 px-6 text-gray-300 font-semibold text-sm uppercase tracking-wider">Descripción</th>
              <th className="text-right py-4 px-6 text-gray-300 font-semibold text-sm uppercase tracking-wider">Monto</th>
              <th className="text-center py-4 px-6 text-gray-300 font-semibold text-sm uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {ingresos.map((ingreso) => (
              <tr key={ingreso.id} className="border-b border-white/5 hover:bg-white/10 transition-colors">
                <td className="py-4 px-6 text-emerald-100/60">
                  {new Date(ingreso.fecha).toLocaleDateString('es-ES')}
                </td>
                <td className="py-4 px-6 text-white font-medium">{ingreso.fuente}</td>
                <td className="py-4 px-6 text-gray-400 text-sm max-w-xs truncate">{ingreso.descripcion}</td>
                <td className="py-4 px-6 text-right text-emerald-400 font-bold text-base">
                  ${ingreso.monto.toFixed(2)}
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center justify-center gap-3">
                    <button onClick={() => setEditando(ingreso)} className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors" title="Editar">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => setEliminando(ingreso)} className="p-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors" title="Eliminar">
                      <Trash2 className="w-4 h-4" />
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
        mensaje={`¿Estás seguro de eliminar el ingreso de $${eliminando?.monto?.toFixed(2)} de ${eliminando?.fuente}?`}
      />
    </>
  );
}