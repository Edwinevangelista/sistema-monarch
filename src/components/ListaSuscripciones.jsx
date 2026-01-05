// src/components/ListaSuscripciones.jsx
import React from 'react'
import { Repeat, Edit2, Trash2, DollarSign, Calendar, AlertCircle } from 'lucide-react'

const ListaSuscripciones = ({ suscripciones, onEditar, onEliminar, onPagarManual }) => {
  const obtenerColorCiclo = (ciclo) => {
    const colores = {
      'Mensual': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      'Anual': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      'Semanal': 'bg-green-500/20 text-green-300 border-green-500/30'
    }
    return colores[ciclo] || 'bg-gray-500/20 text-gray-300 border-gray-500/30'
  }

  const obtenerDiasRestantes = (proximoPago) => {
    if (!proximoPago) return null
    const hoy = new Date()
    const fecha = new Date(proximoPago)
    const diff = Math.ceil((fecha - hoy) / (1000 * 60 * 60 * 24))
    return diff
  }

  const suscripcionesActivas = suscripciones.filter(s => s.estado === 'Activo')

  const handleEliminar = (id, servicio) => {
    // ✅ SOLUCIÓN: Usar window.confirm explícitamente
    if (window.confirm(`¿Estás seguro de eliminar la suscripción de ${servicio}?`)) {
      onEliminar(id)
    }
  }

  if (suscripcionesActivas.length === 0) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Repeat className="w-6 h-6 text-indigo-400" />
            Suscripciones Activas
          </h3>
          <span className="bg-indigo-500/20 text-indigo-300 text-sm px-3 py-1 rounded-full border border-indigo-500/30">
            0 activas
          </span>
        </div>
        <div className="text-center py-8 text-gray-400">
          <Repeat className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>No tienes suscripciones activas</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Repeat className="w-6 h-6 text-indigo-400" />
          Suscripciones Activas
        </h3>
        <span className="bg-indigo-500/20 text-indigo-300 text-sm px-3 py-1 rounded-full border border-indigo-500/30">
          {suscripcionesActivas.length} activas
        </span>
      </div>

      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {suscripcionesActivas.map((sub) => {
          const diasRestantes = obtenerDiasRestantes(sub.proximo_pago)
          const esUrgente = diasRestantes !== null && diasRestantes <= 3

          return (
            <div
              key={sub.id}
              className={`bg-gray-700/50 rounded-xl p-4 border transition-all hover:bg-gray-700 ${
                esUrgente ? 'border-yellow-500/50 ring-1 ring-yellow-500/20' : 'border-gray-600'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-white flex items-center gap-2">
                    {sub.servicio}
                    {esUrgente && <AlertCircle className="w-4 h-4 text-yellow-400" />}
                  </h4>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className={`text-xs px-2 py-1 rounded-full border ${obtenerColorCiclo(sub.ciclo)}`}>
                      {sub.ciclo}
                    </span>
                    {sub.categoria && (
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-600/50 text-gray-300 border border-gray-500/30">
                        {sub.categoria}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-white">${sub.costo}</div>
                  <div className="text-xs text-gray-400">/{sub.ciclo}</div>
                </div>
              </div>

              {sub.proximo_pago && (
                <div className={`flex items-center gap-2 text-sm mb-3 ${
                  esUrgente ? 'text-yellow-400' : 'text-gray-400'
                }`}>
                  <Calendar className="w-4 h-4" />
                  <span>
                    Próximo pago: {new Date(sub.proximo_pago).toLocaleDateString('es-ES')}
                    {diasRestantes !== null && (
                      <span className="ml-2 font-semibold">
                        ({diasRestantes > 0 ? `en ${diasRestantes} días` : 'Hoy'})
                      </span>
                    )}
                  </span>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => onPagarManual(sub)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600/20 hover:bg-green-600/30 text-green-300 rounded-lg transition-colors text-sm"
                >
                  <DollarSign className="w-4 h-4" />
                  Pagar Ahora
                </button>
                <button
                  onClick={() => onEditar(sub)}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleEliminar(sub.id, sub.servicio)}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-300 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {sub.autopago && (
                <div className="mt-2 flex items-center gap-2 text-xs text-emerald-400">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                  Autopago activado
                </div>
              )}
            </div>
          )
        })}
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(99, 102, 241, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(99, 102, 241, 0.7);
        }
      `}</style>
    </div>
  )
}

export default ListaSuscripciones