import React from 'react'
import { Repeat, Calendar, DollarSign } from 'lucide-react'

const ListaSuscripciones = ({ suscripciones }) => {
  const calcularProximoPago = (fecha) => {
    if (!fecha) return null
    const dias = Math.round((new Date(fecha) - new Date()) / (1000 * 60 * 60 * 24))
    return dias
  }

  const activas = suscripciones.filter(s => s.estado === 'Activo')
  const totalMensual = activas.reduce((sum, s) => {
    if (s.ciclo === 'Anual') return sum + (s.costo / 12)
    if (s.ciclo === 'Semanal') return sum + (s.costo * 4.33)
    return sum + s.costo
  }, 0)

  return (
    <div className="bg-gray-800 rounded-2xl p-6 shadow-xl border-2 border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Repeat className="w-6 h-6" />
          📱 SUSCRIPCIONES
        </h2>
        <div className="text-right">
          <p className="text-xs text-gray-400">Total mensual</p>
          <p className="text-lg font-bold text-purple-400">
            ${totalMensual.toFixed(2)}
          </p>
        </div>
      </div>

      {activas.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-400">No tienes suscripciones activas</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activas.map((sub, idx) => {
            const diasProximo = calcularProximoPago(sub.proximo_pago)

            return (
              <div key={idx} className="bg-gray-900 rounded-lg p-4 border border-gray-700 hover:border-indigo-500 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-white font-bold">{sub.servicio}</h3>
                  <span className="px-2 py-1 bg-indigo-600 text-white text-xs rounded-full">
                    {sub.ciclo}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-gray-400">
                    <DollarSign className="w-4 h-4" />
                    <span>${sub.costo.toLocaleString('es-MX')}</span>
                  </div>

                  {diasProximo !== null && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className={`text-xs font-semibold ${
                        diasProximo <= 3 ? 'text-red-400' : 
                        diasProximo <= 7 ? 'text-yellow-400' : 'text-green-400'
                      }`}>
                        {diasProximo <= 0 ? 'Hoy' : `en ${diasProximo}d`}
                      </span>
                    </div>
                  )}
                </div>

                <p className="text-xs text-gray-500 mt-2">{sub.categoria}</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default ListaSuscripciones
