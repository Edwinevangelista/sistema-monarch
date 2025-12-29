import React from 'react'
import { Bell, AlertTriangle, Clock } from 'lucide-react'

const Notificaciones = ({ alertas }) => {
  const getIconoTipo = (tipo) => {
    if (tipo === 'critical') return <AlertTriangle className="w-5 h-5 text-red-400" />
    if (tipo === 'warning') return <Clock className="w-5 h-5 text-yellow-400" />
    return <Bell className="w-5 h-5 text-blue-400" />
  }

  const getColorFondo = (tipo) => {
    if (tipo === 'critical') return 'bg-red-900 bg-opacity-30 border-red-500'
    if (tipo === 'warning') return 'bg-yellow-900 bg-opacity-30 border-yellow-500'
    return 'bg-blue-900 bg-opacity-30 border-blue-500'
  }

  if (alertas.length === 0) {
    return (
      <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-6 shadow-xl border-2 border-green-400">
        <div className="text-center">
          <div className="text-5xl mb-3">✅</div>
          <h3 className="text-xl font-bold text-white mb-2">Todo al día</h3>
          <p className="text-green-100">No tienes pagos urgentes en este momento</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl p-6 shadow-xl border-2 border-purple-400">
      <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
        <Bell className="w-6 h-6 animate-pulse" />
        🔔 ALERTAS DE PAGOS ({alertas.length})
      </h2>
      <div className="space-y-3">
        {alertas.map((alerta, idx) => (
          <div 
            key={idx} 
            className={`flex items-start gap-3 p-4 rounded-xl border-2 ${getColorFondo(alerta.tipo)} backdrop-blur-sm`}
          >
            <div className="mt-0.5">
              {getIconoTipo(alerta.tipo)}
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold text-sm leading-relaxed">
                {alerta.mensaje}
              </p>
              {alerta.monto && (
                <p className="text-gray-300 text-xs mt-1">
                  Monto: ${alerta.monto.toLocaleString('es-MX')}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Notificaciones
