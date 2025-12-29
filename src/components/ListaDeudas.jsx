import React from 'react'
import { CreditCard, TrendingDown, Calendar } from 'lucide-react'

const ListaDeudas = ({ deudas }) => {
  const calcularProgreso = (saldo, pagoMinimo) => {
    if (!pagoMinimo) return 0
    return Math.min((pagoMinimo / saldo) * 100, 100)
  }

  return (
    <div className="bg-gray-800 rounded-2xl p-6 shadow-xl border-2 border-gray-700">
      <h2 className="text-xl font-bold text-white mb-4 bg-gray-700 rounded-lg p-3 text-center flex items-center justify-center gap-2">
        <CreditCard className="w-6 h-6" />
        💳 MIS DEUDAS
      </h2>

      {deudas.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-5xl mb-3">🎉</div>
          <p className="text-gray-400">¡No tienes deudas registradas!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {deudas.map((deuda, idx) => {
            const progreso = calcularProgreso(deuda.saldo, deuda.pago_minimo)
            const diasVencimiento = deuda.vence ? Math.round((new Date(deuda.vence) - new Date()) / (1000 * 60 * 60 * 24)) : null

            return (
              <div key={idx} className="bg-gray-900 rounded-xl p-4 border border-gray-700 hover:border-purple-500 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-white font-bold text-lg">{deuda.cuenta}</h3>
                    <p className="text-gray-400 text-sm">{deuda.tipo}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-red-400 font-bold text-xl">
                      ${deuda.saldo.toLocaleString('es-MX')}
                    </p>
                    <p className="text-gray-400 text-xs">APR: {(deuda.apr * 100).toFixed(1)}%</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400 flex items-center gap-1">
                      <TrendingDown className="w-4 h-4" />
                      Pago mínimo
                    </span>
                    <span className="text-white font-semibold">
                      ${deuda.pago_minimo.toLocaleString('es-MX')}
                    </span>
                  </div>

                  {diasVencimiento !== null && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400 flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Vencimiento
                      </span>
                      <span className={`font-semibold ${
                        diasVencimiento <= 5 ? 'text-red-400' : 
                        diasVencimiento <= 10 ? 'text-yellow-400' : 'text-green-400'
                      }`}>
                        {diasVencimiento <= 0 ? 'VENCIDO' : `en ${diasVencimiento} días`}
                      </span>
                    </div>
                  )}

                  <div className="w-full bg-gray-700 rounded-full h-2 mt-3">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${progreso}%` }}
                    ></div>
                  </div>
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
