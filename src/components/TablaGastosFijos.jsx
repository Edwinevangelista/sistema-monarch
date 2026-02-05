import React, { useState, useMemo } from 'react';
import { Edit2, Trash2, CheckCircle, Clock, AlertTriangle, CreditCard } from 'lucide-react';
import ModalGastoFijo from './ModalGastoFijo';
import ModalConfirmacion from './ModalConfirmacion';

// --- COMPONENTE TARJETA (Para Móvil) ---
function GastoFijoCard({ gasto, onMarcarPagado, onEditar, onEliminar }) {
  const estadoInfo = useMemo(() => {
    const hoy = new Date();
    const vence = new Date(hoy.getFullYear(), hoy.getMonth(), gasto.dia_venc);
    const diff = Math.floor((vence - hoy) / (1000 * 60 * 60 * 24));

    if (gasto.estado === 'Pagado') {
      return {
        color: 'bg-emerald-600',
        border: 'border-emerald-500',
        text: 'text-emerald-400',
        icon: <CheckCircle className="w-5 h-5" />,
        label: 'Pagado'
      };
    }

    if (diff < 0) {
      return {
        color: 'bg-rose-600',
        border: 'border-rose-500',
        text: 'text-rose-400',
        icon: <AlertTriangle className="w-5 h-5" />,
        label: `Vencido (${Math.abs(diff)} días)`
      };
    }

    if (diff <= 3) {
      return {
        color: 'bg-yellow-600',
        border: 'border-yellow-500',
        text: 'text-yellow-400',
        icon: <Clock className="w-5 h-5" />,
        label: `Vence en ${diff} días`
      };
    }

    return {
      color: 'bg-gray-600',
      border: 'border-gray-500',
      text: 'text-gray-400',
      icon: <Clock className="w-5 h-5" />,
      label: `Vence día ${gasto.dia_venc}`
    };
  }, [gasto]);

  return (
    <div className="bg-gray-800 rounded-2xl border border-gray-700 p-5 shadow-lg relative overflow-hidden">
      {/* Header con Estado */}
      <div className={`bg-gradient-to-r ${estadoInfo.color} p-4 rounded-xl flex items-start justify-between mb-4`}>
        <div className="flex items-center gap-3 text-white">
          <div className={`p-2 bg-white/20 rounded-lg border border-white/30 ${estadoInfo.text}`}>
            {estadoInfo.icon}
          </div>
          <div>
            <h4 className="font-bold text-lg">{gasto.nombre}</h4>
            <p className="text-xs text-white/80 uppercase tracking-wider">{gasto.tipo || 'Gasto Fijo'}</p>
          </div>
        </div>
      </div>

      {/* Cuerpo */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-900/50 rounded-xl p-3 text-center">
          <p className="text-gray-500 text-[10px] uppercase font-bold">Monto</p>
          <p className="text-white font-bold text-lg">${gasto.monto.toFixed(2)}</p>
        </div>
        <div className="bg-gray-900/50 rounded-xl p-3 text-center">
          <p className="text-gray-500 text-[10px] uppercase font-bold">Vence</p>
          <p className="text-gray-300 font-medium text-sm">Día {gasto.dia_venc}</p>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex gap-2">
        <button
          onClick={() => onMarcarPagado(gasto.id, gasto.estado)}
          className={`flex-1 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 border-2 ${
            gasto.estado === 'Pagado' 
              ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600' 
              : 'bg-emerald-600 border-emerald-500 text-white hover:bg-emerald-700'
          }`}
        >
          {gasto.estado === 'Pagado' ? <Clock className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          {gasto.estado === 'Pagado' ? 'Marcar Pend.' : 'Marcar Pag.'}
        </button>
        <button
          onClick={onEditar}
          className="p-3 bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 rounded-xl transition-colors border border-blue-500/30"
        >
          <Edit2 className="w-5 h-5" />
        </button>
        <button
          onClick={onEliminar}
          className="p-3 bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 rounded-xl transition-colors border border-rose-500/30"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

// --- COMPONENTE PRINCIPAL ---
export default function TablaGastosFijos({ gastosFijos, updateGastoFijo, updateEstado, deleteGastoFijo }) {
  const [editando, setEditando] = useState(null);
  const [eliminando, setEliminando] = useState(null);

  const handleEditar = async (datosActualizados) => {
    const result = await updateGastoFijo(editando.id, datosActualizados);
    if (result.success) setEditando(null);
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

  // Helper para tabla
  const getEstadoInfoTabla = (gasto) => {
    const hoy = new Date();
    const vence = new Date(hoy.getFullYear(), hoy.getMonth(), gasto.dia_venc);
    const diff = Math.floor((vence - hoy) / (1000 * 60 * 60 * 24));

    if (gasto.estado === 'Pagado') {
      return { text: 'Pagado', class: 'bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full text-xs font-bold border border-emerald-500/30' };
    }
    if (diff < 0) {
      return { text: `Vencido ${Math.abs(diff)}d`, class: 'bg-rose-500/20 text-rose-400 px-2 py-1 rounded-full text-xs font-bold border border-rose-500/30' };
    }
    if (diff <= 3) {
      return { text: `Vence en ${diff}d`, class: 'bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full text-xs font-bold border border-yellow-500/30' };
    }
    return { text: `Día ${gasto.dia_venc}`, class: 'bg-gray-700 text-gray-300 px-2 py-1 rounded-full text-xs font-bold' };
  };

  if (gastosFijos.length === 0) {
    return (
      <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
        <div className="text-5xl mb-3 opacity-30">📅</div>
        <p className="text-gray-400">No hay gastos fijos registrados</p>
      </div>
    );
  }

  return (
    <>
      {/* VISTA MÓVIL */}
      <div className="block md:hidden space-y-4">
        {gastosFijos.map((gf) => (
          <GastoFijoCard
            key={gf.id}
            gasto={gf}
            onMarcarPagado={handleCambiarEstado}
            onEditar={() => setEditando(gf)}
            onEliminar={() => setEliminando(gf)}
          />
        ))}
      </div>

      {/* VISTA ESCRITORIO */}
      <div className="hidden md:block overflow-x-auto bg-white/5 rounded-2xl border border-white/10 shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              <th className="text-left py-4 px-6 text-gray-300 font-semibold">Nombre</th>
              <th className="text-center py-4 px-6 text-gray-300 font-semibold">Día Venc.</th>
              <th className="text-right py-4 px-6 text-gray-300 font-semibold">Monto</th>
              <th className="text-center py-4 px-6 text-gray-300 font-semibold">Estado</th>
              <th className="text-center py-4 px-6 text-gray-300 font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {gastosFijos.map((gf) => {
              const estado = getEstadoInfoTabla(gf);
              return (
                <tr key={gf.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-4 px-6 text-white font-medium">{gf.nombre}</td>
                  <td className="py-4 px-6 text-center text-gray-300">{gf.dia_venc}</td>
                  <td className="py-4 px-6 text-right text-yellow-400 font-bold">
                    ${gf.monto.toFixed(2)}
                  </td>
                  <td className="py-4 px-6">
                    <span className={estado.class}>{estado.text}</span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleCambiarEstado(gf.id, gf.estado)}
                        className={`p-2 rounded-lg transition-colors ${
                          gf.estado === 'Pagado'
                            ? 'bg-gray-600 hover:bg-gray-700 text-gray-300'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                        title={gf.estado === 'Pagado' ? 'Marcar Pendiente' : 'Marcar Pagado'}
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditando(gf)}
                        className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEliminando(gf)}
                        className="p-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors"
                        title="Eliminar"
                      >
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
        mensaje={`¿Estás seguro de eliminar ${eliminando?.nombre} de $${eliminando?.monto?.toFixed(2)}?`}
      />
    </>
  );
}