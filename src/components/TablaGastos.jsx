import React, { useState } from 'react';
import { Edit2, Trash2, ShoppingCart, Calendar } from 'lucide-react';
import ModalGastoVariable from './ModalGastoVariable'; // Asegúrate que este archivo exista
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
      <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
        <div className="text-5xl mb-3 opacity-50">🛒</div>
        <p className="text-gray-400 text-lg">No hay gastos registrados</p>
      </div>
    );
  }

  // --- SUBCOMPONENTE: TARJETA ---
  function GastoCard({ gasto, onEditar, onEliminar }) {
    const getCatColor = (cat) => {
      if (cat.includes('Comida')) return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      if (cat.includes('Transporte')) return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    };
    
    return (
      <div className="bg-gray-800 rounded-2xl border border-gray-700 p-5 shadow-lg hover:border-orange-500/30 transition-colors">
        <div className="flex justify-between items-start mb-3">
          <div>
            <p className="text-white font-bold text-lg">{gasto.descripcion || gasto.categoria}</p>
            <div className="flex items-center gap-2 mt-1">
               <span className={`text-xs px-2 py-0.5 rounded-full border ${getCatColor(gasto.categoria)}`}>
                 {gasto.categoria}
               </span>
               <span className="text-gray-500 text-xs flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(gasto.fecha).toLocaleDateString()}
               </span>
            </div>
          </div>
          <div className="flex gap-2">
             <button onClick={onEditar} className="p-2 bg-blue-600/20 hover:bg-blue-600 text-white rounded-lg transition-colors">
               <Edit2 className="w-4 h-4" />
             </button>
             <button onClick={onEliminar} className="p-2 bg-red-600/20 hover:bg-red-600 text-white rounded-lg transition-colors">
               <Trash2 className="w-4 h-4" />
             </button>
          </div>
        </div>
        <div className="flex items-center justify-between">
           <div className="text-gray-400 text-sm flex items-center gap-2">
             <ShoppingCart className="w-4 h-4" />
             {gasto.metodo}
           </div>
           <p className="text-red-400 font-bold text-xl">${gasto.monto?.toFixed(2)}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* VISTA MÓVIL */}
      <div className="block md:hidden space-y-4">
        {gastos.map((gasto) => (
          <GastoCard 
            key={gasto.id} 
            gasto={gasto} 
            onEditar={() => setEditando(gasto)}
            onEliminar={() => setEliminando(gasto)}
          />
        ))}
      </div>

      {/* VISTA ESCRITORIO */}
      <div className="hidden md:block overflow-x-auto bg-white/5 rounded-2xl border border-white/10">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              <th className="text-left py-4 px-6 text-gray-300 font-semibold text-sm uppercase tracking-wider">Fecha</th>
              <th className="text-left py-4 px-6 text-gray-300 font-semibold text-sm uppercase tracking-wider">Categoría</th>
              <th className="text-left py-4 px-6 text-gray-300 font-semibold text-sm uppercase tracking-wider">Descripción</th>
              <th className="text-left py-4 px-6 text-gray-300 font-semibold text-sm uppercase tracking-wider">Método</th>
              <th className="text-right py-4 px-6 text-gray-300 font-semibold text-sm uppercase tracking-wider">Monto</th>
              <th className="text-center py-4 px-6 text-gray-300 font-semibold text-sm uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {gastos.map((gasto) => (
              <tr key={gasto.id} className="border-b border-white/5 hover:bg-white/10 transition-colors">
                <td className="py-4 px-6 text-gray-300">
                  {new Date(gasto.fecha).toLocaleDateString()}
                </td>
                <td className="py-4 px-6 text-white font-medium">{gasto.categoria}</td>
                <td className="py-4 px-6 text-white truncate max-w-[150px]">{gasto.descripcion}</td>
                <td className="py-4 px-6 text-gray-400 text-sm">{gasto.metodo}</td>
                <td className="py-4 px-6 text-right text-red-400 font-bold">
                  ${gasto.monto?.toFixed(2)}
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center justify-center gap-3">
                    <button onClick={() => setEditando(gasto)} className="p-2 bg-blue-600/20 hover:bg-blue-600 text-white rounded-lg transition-colors" title="Editar">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => setEliminando(gasto)} className="p-2 bg-red-600/20 hover:bg-red-600 text-white rounded-lg transition-colors" title="Eliminar">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODALES */}
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
        mensaje={`¿Estás seguro de eliminar el gasto de $${eliminando?.monto?.toFixed(2)} en ${eliminando?.categoria}?`}
      />
    </>
  );
}