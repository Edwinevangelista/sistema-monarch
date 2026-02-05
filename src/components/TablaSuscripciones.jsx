import React, { useState } from 'react';
import { Edit2, Trash2, Layers, Calendar, Repeat } from 'lucide-react';
import ModalSuscripcion from './ModalSuscripcion';
import ModalConfirmacion from './ModalConfirmacion';

// --- COMPONENTE TARJETA (Para Móvil) ---
function SuscripcionCard({ sub, onEditar, onEliminar }) {
  const getCostoMensual = (s) => {
    if (s.ciclo === 'Anual') return s.costo / 12;
    if (s.ciclo === 'Semanal') return s.costo * 4.33;
    return s.costo;
  };
  
  const mensual = getCostoMensual(sub);
  
  return (
    <div className="bg-gradient-to-br from-purple-900/40 to-indigo-900/20 backdrop-blur-sm rounded-2xl border border-purple-500/20 p-5 shadow-lg hover:shadow-purple-900/20 transition-all">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Layers className="w-4 h-4 text-purple-400" />
            <h4 className="text-white font-bold text-lg">{sub.servicio}</h4>
          </div>
          <p className="text-purple-200/70 text-sm">{sub.categoria}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onEditar} className="p-2 bg-white/10 hover:bg-white/20 text-purple-300 rounded-xl transition-colors">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={onEliminar} className="p-2 bg-white/10 hover:bg-white/20 text-rose-300 rounded-xl transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <p className="text-purple-300/60 text-[10px] uppercase font-bold">Costo</p>
          <p className="text-white font-bold text-sm">${sub.costo.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-purple-300/60 text-[10px] uppercase font-bold">Ciclo</p>
          <p className="text-gray-300 text-sm">{sub.ciclo}</p>
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-white/10 pt-3 bg-black/20 rounded-xl p-2">
        <span className={`text-xs font-bold uppercase tracking-wider ${
          sub.estado === 'Activo' ? 'text-emerald-400' : 'text-gray-400'
        }`}>
          {sub.estado}
        </span>
        <p className="text-white font-bold text-base">${mensual.toFixed(2)}/mes</p>
      </div>
    </div>
  );
}

// --- COMPONENTE PRINCIPAL ---
export default function TablaSuscripciones({ suscripciones, updateSuscripcion, deleteSuscripcion }) {
  const [editando, setEditando] = useState(null);
  const [eliminando, setEliminando] = useState(null);

  const handleEditar = async (datosActualizados) => {
    const result = await updateSuscripcion(editando.id, datosActualizados);
    if (result.success) setEditando(null);
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
      <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
        <div className="text-5xl mb-3 opacity-30">🔄</div>
        <p className="text-gray-400">No hay suscripciones registradas</p>
      </div>
    );
  }

  return (
    <>
      {/* VISTA MÓVIL */}
      <div className="block md:hidden space-y-4">
        {suscripciones.map((sub) => (
          <SuscripcionCard
            key={sub.id}
            sub={sub}
            onEditar={() => setEditando(sub)}
            onEliminar={() => setEliminando(sub)}
          />
        ))}
      </div>

      {/* VISTA ESCRITORIO */}
      <div className="hidden md:block overflow-x-auto bg-white/5 rounded-2xl border border-white/10 shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              <th className="text-left py-4 px-6 text-gray-300 font-semibold text-sm uppercase tracking-wider">Servicio</th>
              <th className="text-center py-4 px-6 text-gray-300 font-semibold text-sm uppercase tracking-wider">Ciclo</th>
              <th className="text-right py-4 px-6 text-gray-300 font-semibold text-sm uppercase tracking-wider">Costo</th>
              <th className="text-right py-4 px-6 text-gray-300 font-semibold text-sm uppercase tracking-wider">Mensual</th>
              <th className="text-center py-4 px-6 text-gray-300 font-semibold text-sm uppercase tracking-wider">Estado</th>
              <th className="text-center py-4 px-6 text-gray-300 font-semibold text-sm uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {suscripciones.map((sub) => {
              const mensual = getCostoMensual(sub);
              return (
                <tr key={sub.id} className="border-b border-white/5 hover:bg-white/10 transition-colors">
                  <td className="py-4 px-6 text-white font-medium">{sub.servicio}</td>
                  <td className="py-4 px-6 text-center text-gray-300">{sub.ciclo}</td>
                  <td className="py-4 px-6 text-right text-purple-400 font-bold">
                    ${sub.costo.toFixed(2)}
                  </td>
                  <td className="py-4 px-6 text-right text-gray-300 font-medium">
                    ${mensual.toFixed(2)}
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      sub.estado === 'Activo' 
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                        : 'bg-gray-500/20 text-gray-300 border-gray-500/30'
                    }`}>
                      {sub.estado}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-center gap-3">
                      <button onClick={() => setEditando(sub)} className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors" title="Editar">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => setEliminando(sub)} className="p-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors" title="Eliminar">
                        <Trash2 className="w-4 h-4" />
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