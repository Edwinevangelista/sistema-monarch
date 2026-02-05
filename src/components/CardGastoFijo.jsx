import { CheckCircle, Clock, AlertTriangle, Calendar, CreditCard } from 'lucide-react';

export default function CardGastoFijo({ gasto, onMarcarPagado, onEditar, onEliminar }) {
  const getEstadoInfo = () => {
    if (gasto.estado === 'Pagado') {
      return {
        color: 'text-emerald-400',
        borderClass: 'border-emerald-500/30',
        bgClass: 'bg-emerald-500/10',
        btnClass: 'bg-gray-600 hover:bg-gray-700 text-white',
        icon: <CheckCircle className="w-4 h-4" />,
        texto: 'Pagado',
        urgency: 'none'
      };
    }

    const hoy = new Date();
    const vence = new Date(hoy.getFullYear(), hoy.getMonth(), gasto.dia_venc);
    // Si ya pasó el día de vencimiento de ESTE mes, probablemente es el próximo mes, 
    // pero normalmente el usuario quiere ver el vencimiento relativo.
    // Ajustamos lógica simple: si la fecha es menor que hoy en el mismo mes o estamos en el mes siguiente y paso el día.
    
    // Simplemente calculamos la diferencia basándonos en la fecha del mes actual vs hoy.
    // Si hoy > dia_venc del mes actual -> vencido.
    const esVencido = hoy.getDate() > gasto.dia_venc;
    const diff = gasto.dia_venc - hoy.getDate();

    if (esVencido || diff < 0) {
      return {
        color: 'text-rose-400',
        borderClass: 'border-rose-500/30',
        bgClass: 'bg-rose-500/10',
        btnClass: 'bg-rose-600 hover:bg-rose-700 text-white',
        icon: <AlertTriangle className="w-4 h-4" />,
        texto: `Vencido`,
        urgency: 'pulse-red' // Clase para animación
      };
    }

    if (diff <= 3) {
      return {
        color: 'text-yellow-400',
        borderClass: 'border-yellow-500/30',
        bgClass: 'bg-yellow-500/10',
        btnClass: 'bg-yellow-600 hover:bg-yellow-700 text-white',
        icon: <Clock className="w-4 h-4" />,
        texto: `Vence en ${diff} días`,
        urgency: 'pulse-yellow'
      };
    }

    return {
      color: 'text-orange-400',
      borderClass: 'border-orange-500/30',
      bgClass: 'bg-orange-500/10',
      btnClass: 'bg-blue-600 hover:bg-blue-700 text-white',
      icon: <Calendar className="w-4 h-4" />,
      texto: `Vence día ${gasto.dia_venc}`,
      urgency: 'none'
    };
  };

  const estadoInfo = getEstadoInfo();

  return (
    <div className={`
      bg-white/5 backdrop-blur-md border rounded-2xl p-4 relative overflow-hidden
      transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/10
      ${estadoInfo.borderClass}
      ${estadoInfo.urgency === 'pulse-red' ? 'animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.3)]' : ''}
    `}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-bold text-base truncate pr-2">
            {gasto.nombre}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${estadoInfo.bgClass} ${estadoInfo.color} border-opacity-30`}>
              {estadoInfo.texto}
            </span>
            {gasto.metodo && (
              <span className="text-[10px] text-gray-500 flex items-center gap-1">
                <CreditCard className="w-3 h-3" /> {gasto.metodo}
              </span>
            )}
          </div>
        </div>
        
        <div className={`p-2 rounded-xl bg-white/5 border border-white/5 ${estadoInfo.color}`}>
          {estadoInfo.icon}
        </div>
      </div>

      {/* Monto */}
      <div className="flex items-baseline justify-between mb-4 pb-4 border-b border-white/5">
        <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Total</span>
        <span className="text-2xl font-bold text-white">
          ${gasto.monto?.toFixed(2) || '0.00'}
        </span>
      </div>

      {/* Acciones */}
      <div className="grid grid-cols-3 gap-2 items-center">
        {/* Botón Marcar Pagado (Principal) */}
        <button
          onClick={onMarcarPagado}
          title="Marcar como pagado"
          className={`
            w-12 h-12 rounded-xl flex items-center justify-center transition-all 
            active:scale-90 group shadow-lg
            ${estadoInfo.btnClass}
          `}
        >
          <CheckCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
        </button>

        <button
          onClick={onEditar}
          className="px-3 py-2 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-xl text-sm font-medium transition-colors border border-white/5"
        >
          Editar
        </button>
        <button
          onClick={onEliminar}
          className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 rounded-xl text-sm font-medium transition-colors border border-rose-500/20"
        >
          Eliminar
        </button>
      </div>
    </div>
  );
}