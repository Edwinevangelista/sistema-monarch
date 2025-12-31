import React from 'react'
import { CreditCard, TrendingDown, Calendar, Edit2, ArrowRight } from 'lucide-react'
// Eliminado 'Trash2' porque no se usaba en el render

const ListaDeudas = ({ deudas, onEditar, alVerDetalle, alEliminar }) => {
  const calcularProgreso = (saldo, pagoMinimo) => {
    if (!pagoMinimo) return 0
    return Math.min((pagoMinimo / saldo) * 100, 100)
  }

  return (
    <div className="bg-gray-800 rounded-2xl p-6 shadow-xl border-2 border-gray-700 h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <CreditCard className="w-6 h-6" />
          💳 MIS DEUDAS
        </h2>
        {deudas.length > 0 && (
          <span className="bg-purple-500/20 text-purple-400 text-xs px-2 py-1 rounded-full border border-purple-500/30">
            {deudas.length}
          </span>
        )}
      </div>

      {deudas.length === 0 ? (
        <div className="text-center py-8 flex flex-col items-center justify-center h-40">
          <div className="text-5xl mb-3 opacity-50">🎉</div>
          <p className="text-gray-400 text-sm">¡Sin deudas registradas!</p>
        </div>
      ) : (
        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
          {deudas.map((deuda, idx) => {
            const progreso = calcularProgreso(deuda.saldo, deuda.pago_minimo)
            const diasVencimiento = deuda.vence 
              ? Math.round((new Date(deuda.vence) - new Date()) / (1000 * 60 * 60 * 24)) 
              : null

            return (
              <div key={idx} className="bg-gray-900 rounded-xl p-4 border border-gray-700 hover:border-purple-500 transition-all group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 cursor-pointer" onClick={() => alVerDetalle && alVerDetalle(deuda)}>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-white font-bold text-lg">{deuda.cuenta}</h3>
                      <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded border ${
                        deuda.estado === 'Pagado' ? 'border-green-500 text-green-400 bg-green-500/10' : 'border-gray-600 text-gray-400'
                      }`}>
                        {deuda.estado || 'Activa'}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm">{deuda.tipo || 'Tarjeta de Crédito'}</p>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-red-400 font-bold text-xl">
                      ${deuda.saldo.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-gray-400 text-xs">Tasa: {deuda.apr ? (deuda.apr * 100).toFixed(1) + '%' : 'N/A'}</p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400 flex items-center gap-1">
                      <TrendingDown className="w-4 h-4" />
                      Pago Mínimo
                    </span>
                    <span className="text-white font-semibold">
                      ${deuda.pago_minimo.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {diasVencimiento !== null && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400 flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Vence
                      </span>
                      <span className={`font-semibold text-xs px-2 py-0.5 rounded ${
                        diasVencimiento <= 0 ? 'bg-red-500/20 text-red-400' : 
                        diasVencimiento <= 5 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'
                      }`}>
                        {diasVencimiento <= 0 ? 'VENCIDO' : `en ${diasVencimiento} días`}
                      </span>
                    </div>
                  )}

                  <div className="w-full bg-gray-700 rounded-full h-1.5 mt-3">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${progreso}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t border-gray-800 mt-2 opacity-0 group-hover:opacity-100 transition-opacity md:opacity-100">
                  {onEditar && (
                    <button 
                      onClick={() => onEditar(deuda)}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-gray-700 hover:bg-purple-600 text-white text-xs rounded-lg transition-colors"
                      title="Editar Deuda"
                    >
                      <Edit2 className="w-3 h-3" /> Editar
                    </button>
                  )}
                  {alVerDetalle && (
                    <button 
                      onClick={() => alVerDetalle(deuda)}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded-lg transition-colors"
                    >
                      Ver <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default ListaDeudas