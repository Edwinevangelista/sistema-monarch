import { CreditCard, Edit2, Trash2, AlertTriangle } from 'lucide-react';

export default function CardDeuda({ deuda, onEditar, onEliminar }) {
  const getPorcentajePagado = () => {
    // Manejo seguro de valores undefined o 0
    const saldo = Number(deuda.saldo) || 0;
    const balance = Number(deuda.balance) || 0;
    if (balance === 0) return 0;
    return ((balance - saldo) / balance) * 100;
  };

  const porcentaje = Math.max(0, Math.min(100, getPorcentajePagado()));
  const isDeudaAlta = (deuda.saldo / (deuda.balance || 1)) > 0.8;

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 hover:border-purple-500/30 hover:shadow-[0_0_20px_rgba(168,85,247,0.1)] transition-all duration-300 group">
      {/* Header con Icono */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-white mb-1 group-hover:text-purple-300 transition-colors">
            {deuda.cuenta || 'Tarjeta'}
          </h3>
          <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">
            Saldo Pendiente
          </p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-3 rounded-xl shadow-lg shadow-purple-900/30 group-hover:scale-105 transition-transform">
          <CreditCard className="w-6 h-6 text-white" />
        </div>
      </div>

      {/* Montos Principales */}
      <div className="mb-5">
        <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 tracking-tight">
          ${deuda.saldo?.toFixed(2) || '0.00'}
        </div>
        <div className="text-sm text-gray-400 mt-1">
          de ${deuda.balance?.toFixed(2) || '0.00'}
        </div>
      </div>

      {/* Barra de Progreso */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs mb-2 font-medium">
          <span className="text-gray-400">Progreso</span>
          <span className={`font-bold ${porcentaje >= 80 ? 'text-green-400' : 'text-blue-400'}`}>
            {porcentaje.toFixed(0)}%
          </span>
        </div>
        <div className="h-2.5 w-full bg-gray-700/50 rounded-full overflow-hidden shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(52,211,153,0.3)]"
            style={{ width: `${porcentaje}%` }}
          />
        </div>
      </div>

      {/* Información Detallada */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white/5 rounded-lg p-2.5 border border-white/5">
          <div className="text-[10px] text-gray-400 uppercase mb-1">Pago Mínimo</div>
          <div className="text-sm font-bold text-yellow-400">
            ${deuda.pago_minimo?.toFixed(2) || '0.00'}
          </div>
        </div>
        {deuda.interes && (
          <div className="bg-white/5 rounded-lg p-2.5 border border-white/5">
            <div className="text-[10px] text-gray-400 uppercase mb-1">Interés TAE</div>
            <div className="text-sm font-bold text-white">
              {deuda.interes}%
            </div>
          </div>
        )}
      </div>

      {/* Botones de Acción */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onEditar}
          className="px-4 py-2.5 bg-blue-600/80 hover:bg-blue-600 text-white rounded-xl font-semibold text-sm transition-all active:scale-95 flex items-center justify-center gap-2 border border-blue-500/20"
        >
          <Edit2 className="w-4 h-4" />
          Editar
        </button>
        <button
          onClick={onEliminar}
          className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 rounded-xl font-semibold text-sm transition-all active:scale-95 flex items-center justify-center gap-2 border border-rose-500/20"
        >
          <Trash2 className="w-4 h-4" />
          Eliminar
        </button>
      </div>
    </div>
  );
}