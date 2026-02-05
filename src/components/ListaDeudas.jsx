import React from 'react'
import { CreditCard, TrendingDown, Calendar, Edit2, ArrowRight } from 'lucide-react'

const ListaDeudas = ({
  deudas = [],
  deudaPagadaEsteMes,
  onEditar,
  alVerDetalle
}) => {
  const calcularProgreso = (saldo, pagoMinimo) => {
    if (!saldo || !pagoMinimo || saldo <= 0) return 0
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
        <div className="text-center py-8 h-40 flex flex-col items-center justify-center">
          <div className="text-5xl mb-3 opacity-50">🎉</div>
          <p className="text-gray-400 text-sm">¡Sin deudas registradas!</p>
        </div>
      ) : (
        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
          {deudas.map((deuda) => {
            const pagadaEsteMes = deudaPagadaEsteMes
              ? deudaPagadaEsteMes(deuda.id)
              : false

            const progreso = calcularProgreso(deuda.saldo, deuda.pago_minimo)

            const diasVencimiento =
              pagadaEsteMes || !deuda.vence
                ? null
                : Math.round(
                    (new Date(deuda.vence) - new Date()) /
                      (1000 * 60 * 60 * 24)
                  )

            return (
              <div
                key={deuda.id}
                className="bg-gray-900 rounded-xl p-4 border border-gray-700 hover:border-purple-500 transition-all"
              >
                {/* HEADER */}
                <div className="flex justify-between mb-3">
                  <div className="cursor-pointer" onClick={() => alVerDetalle?.(deuda)}>
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-bold">{deuda.cuenta}</h3>

                      {pagadaEsteMes ? (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-green-500/20 text-green-400 border border-green-500/40">
                          PAGADA ESTE MES
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-gray-700 text-gray-300 border border-gray-600">
                          {deuda.estado || 'ACTIVA'}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-gray-400">
                      {deuda.tipo || 'Tarjeta de Crédito'}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-red-400 font-bold text-lg">
                      ${Number(deuda.saldo || 0).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-400">
                      APR:{' '}
                      {deuda.apr ? `${(deuda.apr * 100).toFixed(1)}%` : 'N/A'}
                    </p>
                  </div>
                </div>

                {/* INFO */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400 flex items-center gap-1">
                      <TrendingDown className="w-4 h-4" />
                      Pago mínimo
                    </span>
                    <span className="text-white font-semibold">
                      ${Number(deuda.pago_minimo || 0).toFixed(2)}
                    </span>
                  </div>

                  {pagadaEsteMes ? (
                    <div className="flex justify-between">
                      <span className="text-gray-400 flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Estado
                      </span>
                      <span className="text-green-400 font-semibold text-xs">
                        CUBIERTO ESTE MES
                      </span>
                    </div>
                  ) : (
                    diasVencimiento !== null && (
                      <div className="flex justify-between">
                        <span className="text-gray-400 flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Vence
                        </span>
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded ${
                            diasVencimiento <= 0
                              ? 'bg-red-500/20 text-red-400'
                              : diasVencimiento <= 5
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-green-500/20 text-green-400'
                          }`}
                        >
                          {diasVencimiento <= 0
                            ? 'VENCIDO'
                            : `en ${diasVencimiento} días`}
                        </span>
                      </div>
                    )
                  )}

                  {/* PROGRESO */}
                  <div className="w-full bg-gray-700 h-1.5 rounded-full mt-2">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-1.5 rounded-full"
                      style={{ width: `${progreso}%` }}
                    />
                  </div>
                </div>

                {/* ACCIONES */}
                <div className="flex gap-2 mt-3 pt-2 border-t border-gray-800">
                  {onEditar && (
                    <button
                      onClick={() => onEditar(deuda)}
                      className="flex-1 text-xs bg-gray-700 hover:bg-purple-600 text-white py-1.5 rounded flex items-center justify-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" /> Editar
                    </button>
                  )}

                  {alVerDetalle && (
                    <button
                      onClick={() => alVerDetalle(deuda)}
                      className="flex-1 text-xs bg-gray-700 hover:bg-gray-600 text-white py-1.5 rounded flex items-center justify-center gap-1"
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
