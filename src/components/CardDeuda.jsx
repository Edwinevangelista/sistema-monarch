import { CreditCard, Edit2, Trash2 } from 'lucide-react';

export default function CardDeuda({ deuda, onEditar, onEliminar }) {
  const getPorcentajePagado = () => {
    if (!deuda.balance || !deuda.saldo) return 0;
    return ((deuda.balance - deuda.saldo) / deuda.balance) * 100;
  };

  const porcentaje = getPorcentajePagado();

  return (
    <div className="border-2 border-purple-500/30 bg-purple-500/10 rounded-xl p-4 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-white font-bold text-lg">{deuda.cuenta}</h3>
          <p className="text-red-400 text-2xl font-bold mt-1">
            ${deuda.saldo?.toFixed(2)}
          </p>
          <p className="text-sm text-gray-400">
            de ${deuda.balance?.toFixed(2)}
          </p>
        </div>
        <div className="bg-purple-600 p-2 rounded-lg">
          <CreditCard className="w-5 h-5 text-white" />
        </div>
      </div>

      {/* Progreso */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-gray-400">Progreso de pago</span>
          <span className="text-green-400 font-semibold">{porcentaje.toFixed(0)}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all"
            style={{ width: `${porcentaje}%` }}
          />
        </div>
      </div>

      {/* Info */}
      <div className="space-y-1 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Pago mínimo:</span>
          <span className="text-yellow-400 font-semibold">
            ${deuda.pago_minimo?.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Acciones */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onEditar}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold text-sm text-white transition-colors flex items-center justify-center gap-2"
        >
          <Edit2 className="w-4 h-4" />
          Editar
        </button>
        <button
          onClick={onEliminar}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-semibold text-sm text-white transition-colors flex items-center justify-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Eliminar
        </button>
      </div>
    </div>
  );
}
