import React from 'react'
import { Repeat, Calendar, DollarSign, Edit2 } from 'lucide-react'
// Eliminado 'Trash2' porque no se usaba en el render

const ListaSuscripciones = ({ suscripciones, onEditar }) => {
  const calcularProximoPago = (fecha) => {
    if (!fecha) return null
    try {
      const dias = Math.round((new Date(fecha) - new Date()) / (1000 * 60 * 60 * 24))
      return dias
    } catch (e) {
      return null
    }
  }

  const activas = suscripciones.filter(s => s.estado === 'Activo')
  const totalMensual = activas.reduce((sum, s) => {
    if (s.ciclo === 'Anual') return sum + (s.costo / 12)
    if (s.ciclo === 'Semanal') return sum + (s.costo * 4.33)
    return sum + s.costo
  }, 0)

  return (
    <div className="bg-gray-800 rounded-2xl p-6 shadow-xl border-2 border-gray-700 h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Repeat className="w-6 h-6" />
          📱 SUSCRIPCIONES
        </h2>
        <div className="text-right">
          <p className="text-[10px] text-gray-400 uppercase tracking-wider">Gasto Mensual</p>
          <p className="text-lg font-bold text-purple-400 leading-none">
            ${totalMensual.toFixed(2)}
          </p>
        </div>
      </div>

      {activas.length === 0 ? (
        <div className="text-center py-8 flex flex-col items-center justify-center h-40">
          <div className="text-5xl mb-3 opacity-50">📵</div>
          <p className="text-gray-400 text-sm">Sin suscripciones activas</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
          {activas.map((sub, idx) => {
            const diasProximo = calcularProximoPago(sub.proximo_pago)

            return (
              <div key={idx} className="bg-gray-900 rounded-lg p-4 border border-gray-700 hover:border-indigo-500 transition-all group relative overflow-hidden">
                {/* Barra lateral de color para indicar urgencia */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                  diasProximo !== null && diasProximo <= 3 ? 'bg-red-500' : 
                  diasProximo !== null && diasProximo <= 7 ? 'bg-yellow-500' : 'bg-indigo-500'
                }`}></div>

                <div className="flex items-center justify-between mb-2 pl-2">
                  <h3 className="text-white font-bold truncate pr-2">{sub.servicio}</h3>
                  <span className="px-2 py-1 bg-indigo-900/50 text-indigo-300 text-[10px] uppercase font-bold rounded border border-indigo-500/30 flex-shrink-0">
                    {sub.ciclo}
                  </span>
                </div>

                <div className="pl-2 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-gray-400">
                      <DollarSign className="w-4 h-4" />
                      <span className="font-medium text-white">${sub.costo.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm pt-1">
                    {diasProximo !== null ? (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                          diasProximo <= 0 ? 'bg-red-500/20 text-red-400' : 
                          diasProximo <= 3 ? 'bg-orange-500/20 text-orange-400' : 
                          diasProximo <= 7 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'
                        }`}>
                          {diasProximo <= 0 ? 'Vence Hoy' : `Faltan ${diasProximo} días`}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-500 italic">Sin fecha próxima</span>
                    )}
                    
                    {onEditar && (
                       <button 
                       onClick={() => onEditar(sub)}
                       className="text-gray-500 hover:text-white transition-colors p-1 rounded hover:bg-gray-700"
                       title="Editar Suscripción"
                     >
                       <Edit2 className="w-4 h-4" />
                     </button>
                    )}
                  </div>
                  
                  <p className="text-xs text-gray-500 truncate mt-1">{sub.categoria || 'General'}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default ListaSuscripciones