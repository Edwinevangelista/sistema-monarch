import { CheckCircle, Clock, AlertCircle, Edit2, Trash2 } from 'lucide-react';

export default function CardGastoFijo({ gasto, onMarcarPagado, onEditar, onEliminar }) {
  const getEstadoInfo = () => {
    const hoy = new Date();
    const vence = new Date(hoy.getFullYear(), hoy.getMonth(), gasto.dia_venc);
    const diff = Math.round((vence - hoy) / (1000 * 60 * 60 * 24));

    if (gasto.estado === 'Pagado') {
      return {
        color: 'text-green-400',
        bgColor: 'bg-green-500/20 border-green-500',
        icon: <CheckCircle className="w-5 h-5" />,
        texto: 'Pagado'
      };
    }

    if (diff < 0) {
      return {
        color: 'text-red-400',
        bgColor: 'bg-red-500/20 border-red-500',
        icon: <AlertCircle className="w-5 h-5" />,
        texto: `Vencido (${Math.abs(diff)} días)`
      };
    }

    if (diff <= 3) {
      return {
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/20 border-yellow-500',
        icon: <Clock className="w-5 h-5" />,
        texto: `Vence en ${diff} días`
      };
    }

    return {
      color: 'text-gray-400',
      bgColor: 'bg-gray-700/50 border-gray-600',
      icon: <Clock className="w-5 h-5" />,
      texto: `Vence día ${gasto.dia_venc}`
    };
  };

  const estadoInfo = getEstadoInfo();

  return (
    <div className={`border-2 rounded-xl p-4 ${estadoInfo.bgColor} hover:shadow-lg transition-shadow`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-white font-bold text-lg">{gasto.nombre}</h3>
          <p className="text-yellow-400 text-2xl font-bold mt-1">
            ${gasto.monto.toFixed(2)}
          </p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${estadoInfo.bgColor}`}>
          <span className={estadoInfo.color}>
            {estadoInfo.icon}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
        <span>Vence día {gasto.dia_venc}</span>
        <span className={`font-semibold ${estadoInfo.color}`}>
          {estadoInfo.texto}
        </span>
      </div>

      {/* Acciones */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={onMarcarPagado}
          className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
            gasto.estado === 'Pagado'
              ? 'bg-gray-600 hover:bg-gray-700 text-white'
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          <CheckCircle className="w-4 h-4 mx-auto" />
        </button>
        <button
          onClick={onEditar}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold text-sm text-white transition-colors"
        >
          <Edit2 className="w-4 h-4 mx-auto" />
        </button>
        <button
          onClick={onEliminar}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-semibold text-sm text-white transition-colors"
        >
          <Trash2 className="w-4 h-4 mx-auto" />
        </button>
      </div>
    </div>
  );
}
