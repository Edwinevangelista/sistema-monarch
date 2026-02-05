import React, { useState } from 'react';
import { Edit2, Trash2, CreditCard, TrendingDown, CheckCircle2 } from 'lucide-react';
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

  // --- SUBCOMPONENTE: TARJETA (Para Móvil) ---
  function DeudaCard({ deuda, onEditar, onEliminar }) {
    const porcentaje = getPorcentajePagado(deuda);
    
    return (
      <div className="bg-gradient-to-br from-rose-900/40 to-pink-900/20 backdrop-blur-sm rounded-2xl border border-rose-500/20 p-5 shadow-lg">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
             <div className="bg-rose-500/20 p-2.5 rounded-xl border border-rose-500/30 text-rose-400">
               <CreditCard className="w-6 h-6" />
             </div>
             <div>
               <h4 className="text-white font-bold text-lg">{deuda.cuenta}</h4>
               <span className="text-rose-200 text-xs font-medium">{deuda.tipo || 'Crédito'}</span>
             </div>
          </div>
          <div className="flex gap-2">
             <button onClick={onEditar} className="p-2 bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 rounded-lg transition-colors">
               <Edit2 className="w-4 h-4" />
             </button>
             <button onClick={onEliminar} className="p-2 bg-red-500/20 hover:bg-red-500/40 text-red-300 rounded-lg transition-colors">
               <Trash2 className="w-4 h-4" />
             </button>
          </div>
        </div>

        {/* Datos */}
        <div className="grid grid-cols-2 gap-3 mb-4">
           <div className="bg-black/30 rounded-lg p-3">
              <p className="text-gray-400 text-[10px] uppercase font-bold">Balance Total</p>
              <p className="text-white font-bold text-sm">${deuda.balance?.toFixed(2)}</p>
           </div>
           <div className="bg-black/30 rounded-lg p-3">
              <p className="text-gray-400 text-[10px] uppercase font-bold">Saldo Actual</p>
              <p className="text-rose-400 font-bold text-sm">${deuda.saldo?.toFixed(2)}</p>
           </div>
        </div>

        {/* Barra Progreso */}
        <div>
           <div className="flex justify-between text-xs mb-1.5 text-gray-300">
              <span>Progreso</span>
              <span className="font-bold text-white">{porcentaje.toFixed(0)}% pagado</span>
           </div>
           <div className="w-full bg-gray-700/50 rounded-full h-2.5 overflow-hidden">
              <div className="bg-rose-500 h-full rounded-full transition-all" style={{ width: `${Math.min(100, porcentaje)}%` }} />
           </div>
        </div>
      </div>
    );
  }

  // --- COMPONENTE PRINCIPAL ---
  if (deudas.length === 0) {
    return (
      <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
        <div className="text-5xl mb-3 opacity-50">💳</div>
        <p className="text-gray-400 text-lg">No hay deudas registradas</p>
      </div>
    );
  }

  return (
    <>
      {/* VISTA MÓVIL: CARDS */}
      <div className="block md:hidden space-y-4">
        {deudas.map((deuda) => (
          <DeudaCard 
            key={deuda.id}
            deuda={deuda}
            onEditar={() => setEditando(deuda)}
            onEliminar={() => setEliminando(deuda)}
          />
        ))}
      </div>

      {/* VISTA ESCRITORIO: TABLA */}
      <div className="hidden md:block overflow-x-auto bg-white/5 rounded-2xl border border-white/10">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-4 px-6 text-gray-300 font-semibold text-sm uppercase tracking-wider">Cuenta</th>
              <th className="text-right py-4 px-6 text-gray-300 font-semibold text-sm uppercase tracking-wider">Balance Total</th>
              <th className="text-right py-4 px-6 text-gray-300 font-semibold text-sm uppercase tracking-wider">Saldo Actual</th>
              <th className="text-right py-4 px-6 text-gray-300 font-semibold text-sm uppercase tracking-wider">Pago Mín.</th>
              <th className="text-center py-4 px-6 text-gray-300 font-semibold text-sm uppercase tracking-wider">Progreso</th>
              <th className="text-center py-4 px-6 text-gray-300 font-semibold text-sm uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {deudas.map((deuda) => {
              const porcentaje = getPorcentajePagado(deuda);
              return (
                <tr key={deuda.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-4 px-6 text-white font-medium">{deuda.cuenta}</td>
                  <td className="py-4 px-6 text-right text-gray-400 font-medium">${deuda.balance?.toFixed(2)}</td>
                  <td className="py-4 px-6 text-right text-rose-400 font-bold">${deuda.saldo?.toFixed(2)}</td>
                  <td className="py-4 px-6 text-right text-yellow-400 font-medium">${deuda.pago_minimo?.toFixed(2)}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-full bg-gray-700 rounded-full h-2.5 w-16 overflow-hidden">
                        <div className="bg-rose-500 h-full rounded-full" style={{ width: `${Math.min(100, porcentaje)}%` }} />
                      </div>
                      <span className="text-xs text-gray-400">{porcentaje.toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-center gap-3">
                      <button onClick={() => setEditando(deuda)} className="p-2 bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 rounded-lg transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => setEliminando(deuda)} className="p-2 bg-red-500/20 hover:bg-red-500/40 text-red-300 rounded-lg transition-colors">
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

      {/* MODALES */}
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