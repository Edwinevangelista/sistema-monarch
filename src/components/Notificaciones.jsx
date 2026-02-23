import React from 'react'
import { AlertTriangle, Clock, Bell, ChevronRight } from 'lucide-react'

const Notificaciones = ({ alertas, onAlertClick }) => {
  if (alertas.length === 0) {
    return (
      <div className="flex items-center gap-3 p-4 bg-emerald-500/8 border border-emerald-500/15 rounded-2xl">
        <div className="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center shrink-0">
          <span className="text-sm">✅</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-emerald-400">Todo al día</p>
          <p className="text-xs text-gray-500">Sin pagos urgentes esta semana</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {alertas.map((alerta, idx) => {
        const esCritico = alerta.tipo === 'critical'
        const esWarning = alerta.tipo === 'warning'

        const diasTexto = alerta.dias != null
          ? alerta.dias < 0 ? `Venció hace ${Math.abs(alerta.dias)}d` : alerta.dias === 0 ? 'Hoy' : `En ${alerta.dias}d`
          : ''

        const badgeClasses = esCritico
          ? 'bg-red-500/20 text-red-400 border-red-500/20'
          : esWarning ? 'bg-orange-500/20 text-orange-400 border-orange-500/20'
          : 'bg-blue-500/20 text-blue-400 border-blue-500/20'

        const cardClasses = esCritico
          ? 'bg-red-500/8 border-red-500/20 hover:bg-red-500/12'
          : esWarning ? 'bg-orange-500/8 border-orange-500/20 hover:bg-orange-500/12'
          : 'bg-blue-500/8 border-blue-500/20 hover:bg-blue-500/12'

        const Icon = esCritico ? AlertTriangle : esWarning ? Clock : Bell

        return (
          <button
            key={idx}
            onClick={() => onAlertClick && onAlertClick(alerta)}
            className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all active:scale-[0.98] touch-manipulation ${cardClasses}`}
          >
            <div className={`p-2 rounded-xl border ${badgeClasses} shrink-0`}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeClasses}`}>
                  {diasTexto}
                </span>
              </div>
              <p className="text-sm font-semibold text-white truncate">{alerta.mensajeCorto}</p>
              {alerta.monto != null && (
                <p className="text-xs text-gray-400">${Number(alerta.monto).toLocaleString()}</p>
              )}
            </div>
            <ChevronRight className="w-4 h-4 text-gray-600 shrink-0" />
          </button>
        )
      })}
    </div>
  )
}

export default Notificaciones
