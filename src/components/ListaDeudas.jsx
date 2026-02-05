import React from 'react';
import { CreditCard, TrendingDown, Calendar, Edit2, ArrowRight, AlertTriangle } from 'lucide-react';

export default function ListaDeudas({ 
  deudas = [], 
  deudaPagadaEsteMes, 
  onEditar, 
  alVerDetalle 
}) => {
  
  const calcularEstado = (deuda) => {
    const hoy = new Date();
    hoy.setHours(0,0,0,0);

    // Si ya se pagó este mes
    if (deudaPagadaEsteMes && deudaPagadaEsteMes(deuda.id)) {
      return {
        texto: 'Pagado este mes',
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/20'
      };
    }

    if (!deuda.vence) {
      return {
        texto: 'Sin fecha',
        color: 'text-gray-400',
        bg: 'bg-gray-700/30',
        border: 'border-gray-700/30'
      };
    }

    const fechaVence = new Date(deuda.vence);
    const diffDias = Math.ceil((fechaVence - hoy) / (1000 * 60 * 60 * 24));

    if (diffDias < 0) {
      return {
        texto: 'Vencido',
        color: 'text-rose-400',
        bg: 'bg-rose-500/10',
        border: 'border-rose-500/20'
      };
    }

    if (diffDias <= 5) {
      return {
        texto: `${diffDias} días`,
        color: 'text-orange-400',
        bg: 'bg-orange-500/10',
        border: 'border-orange-500/20'
      };
    }

    return {
      texto: `${diffDias} días`,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20'
    };
  };

  const getProgress = (deuda) => {
    const saldo = Number(deuda.saldo) || 0;
    const total = Number(deuda.balance) || 1; // total histórico o límite
    const pagoMin = Number(deuda.pago_minimo) || 0;
    
    // Un cálculo simple de progreso: (Saldo pagado / Total inicial) invertido visualmente
    // O bien: (1 - (SaldoActual / SaldoTotal)) * 100
    if (!saldo || !total) return 0;
    // Usamos balance si existe (limite credito), sino saldo 0. Esto es aproximado visualmente.
    const limite = Number(deuda.balance) || (Number(deuda.saldo) * 1.5);
    const pagado = limite - saldo;
    const progreso = Math.max(0, Math.min(100, (pagado / limite) * 100));
    return progreso;
  };

  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 md:p-6 shadow-xl h-full flex flex-col">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="bg-purple-500/20 p-2 rounded-xl border border-purple-500/30 text-purple-300">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white">Mis Deudas</h2>
            <p className="text-xs md:text-sm text-gray-400">Control y seguimiento</p>
          </div>
        </div>
        
        {deudas.length > 0 && (
          <span className="bg-purple-500/20 text-purple-300 text-xs font-bold px-3 py-1 rounded-full border border-purple-500/30">
            {deudas.length} Activas
          </span>
        )}
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pb-20 md:pb-0">
        {deudas.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center py-12 text-gray-500">
            <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mb-4">
              <CreditCard className="w-8 h-8 text-gray-500" />
            </div>
            <p className="text-sm">No tienes deudas registradas.</p>
            <p className="text-xs text-gray-600">¡Buen trabajo!</p>
          </div>
        ) : (
          deudas.map((deuda) => {
            const estado = calcularEstado(deuda);
            const progreso = getProgress(deuda);

            return (
              <div
                key={deuda.id}
                className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 md:p-5 transition-all duration-200 group relative overflow-hidden"
              >
                {/* Barra de progreso lateral (Mobile) */}
                <div 
                  className="absolute top-0 left-0 h-full w-1.5 bg-gradient-to-b from-purple-500 to-indigo-500 transition-all duration-700"
                  style={{ width: `${progreso}%` }}
                />

                {/* Contenido */}
                <div className="flex items-start justify-between pl-4 relative z-10">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-white font-bold text-base md:text-lg truncate">{deuda.cuenta || deuda.nombre}</h3>
                      <span className={`text-[10px] md:text-xs px-2 py-0.5 rounded-full border font-medium ${estado.bg} ${estado.color} ${estado.border}`}>
                        {estado.texto}
                      </span>
                    </div>
                    
                    <p className="text-gray-400 text-xs md:text-sm mb-3">
                      {deuda.tipo || 'Crédito'} • APR: {deuda.apr ? `${(deuda.apr * 100).toFixed(1)}%` : 'N/A'}
                    </p>

                    <div className="flex items-center gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 text-[10px] uppercase">Saldo</p>
                        <p className="text-rose-400 font-bold text-lg md:text-xl">
                          ${Number(deuda.saldo || 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="w-px h-8 bg-gray-700"></div>
                      <div>
                        <p className="text-gray-500 text-[10px] uppercase">Pago Mín.</p>
                        <p className="text-blue-400 font-bold text-sm md:text-base">
                          ${Number(deuda.pago_minimo || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Botones de Acción */}
                    {onEditar && (
                      <button
                        onClick={() => onEditar(deuda)}
                        className="p-2 bg-white/5 hover:bg-blue-600 hover:text-white rounded-lg text-gray-400 transition-all active:scale-95"
                        title="Editar Deuda"
                      >
                        <Edit2 className="w-4 h-4 md:w-5 md:h-5" />
                      </button>
                    )}
                    
                    {alVerDetalle && (
                      <button
                        onClick={() => alVerDetalle(deuda)}
                        className="p-2 bg-white/5 hover:bg-purple-600 hover:text-white rounded-lg text-gray-400 transition-all active:scale-95"
                        title="Ver Detalles / Pagar"
                      >
                        <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Barra de progreso inferior (Desktop) */}
                <div className="mt-4 pt-4 border-t border-white/5">
                   <div className="flex justify-between text-xs text-gray-400 mb-1">
                     <span>Progreso de Pago</span>
                     <span className="text-purple-300">{Math.round(progreso)}%</span>
                   </div>
                   <div className="w-full bg-gray-700/50 rounded-full h-1.5 overflow-hidden">
                     <div 
                       className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
                       style={{ width: `${progreso}%` }}
                     />
                   </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}