import React, { useEffect } from 'react'
import {
  X, ChevronLeft, CheckCircle2, ShieldAlert,
  Wallet, Calendar, Repeat, TrendingDown, AlertTriangle
} from 'lucide-react'

const fmt = (v) => Number(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function ModalCoberturaCuentas({ coberturaCuentas = [], onClose }) {

  // 🔒 Bloqueo de scroll
  useEffect(() => {
    const scrollY = window.scrollY
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.left = '0'
    document.body.style.right = '0'
    document.body.style.width = '100%'
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.left = ''
      document.body.style.right = ''
      document.body.style.width = ''
      document.body.style.overflow = ''
      window.scrollTo(0, scrollY)
    }
  }, [])

  const cuentasEnRiesgo   = coberturaCuentas.filter(r => r.tieneProblem)
  const cuentasOk         = coberturaCuentas.filter(r => !r.tieneProblem)

  const getBarColor = (totalCargos, balance) => {
    if (balance === 0) return 'bg-red-500'
    const pct = (totalCargos / balance) * 100
    if (pct > 100) return 'bg-red-500'
    if (pct > 75)  return 'bg-orange-500'
    return 'bg-emerald-500'
  }

  const getBarWidth = (totalCargos, balance) => {
    if (balance === 0) return '100%'
    return `${Math.min((totalCargos / balance) * 100, 100)}%`
  }

  const getDiasLabel = (dias) => {
    if (dias === 0) return { text: 'HOY',    cls: 'bg-orange-500 text-white' }
    if (dias === 1) return { text: 'MAÑANA', cls: 'bg-yellow-500 text-black' }
    return { text: `${dias}d`,              cls: 'bg-blue-600 text-white' }
  }

  return (
    <>
      {/* OVERLAY */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        style={{ zIndex: 99998 }}
        onClick={onClose}
      />

      {/* MODAL CONTAINER */}
      <div
        className="fixed inset-0 flex items-end md:items-center md:justify-center"
        style={{ zIndex: 99999 }}
      >
        <div
          className="w-full h-full md:w-[95%] md:max-w-lg md:h-auto md:max-h-[85vh]
                     bg-gray-900 md:rounded-2xl shadow-2xl
                     border-t md:border border-white/10
                     flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >

          {/* HEADER */}
          <div className="flex-shrink-0 bg-gray-900 border-b border-white/10 px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Botón atrás mobile */}
                <button
                  onClick={onClose}
                  className="p-2 -ml-2 text-gray-400 hover:text-white active:bg-gray-800 rounded-xl transition-colors md:hidden"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>

                <div className="relative">
                  <div className="p-2.5 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl shadow-lg">
                    <ShieldAlert className="w-5 h-5 text-white" />
                  </div>
                  {cuentasEnRiesgo.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-gray-900">
                      {cuentasEnRiesgo.length}
                    </span>
                  )}
                </div>

                <div>
                  <h2 className="text-lg font-bold text-white">Cobertura de Cuentas</h2>
                  <p className="text-xs text-gray-400">
                    {cuentasEnRiesgo.length > 0
                      ? <span className="text-orange-400">{cuentasEnRiesgo.length} cuenta{cuentasEnRiesgo.length > 1 ? 's' : ''} con fondos insuficientes</span>
                      : <span className="text-emerald-400">Todas las cuentas cubiertas</span>
                    }
                    {' · próximos 30 días'}
                  </p>
                </div>
              </div>

              {/* Cerrar desktop */}
              <button
                onClick={onClose}
                className="hidden md:flex p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* CONTENIDO SCROLLEABLE */}
          <div
            className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-3"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >

            {coberturaCuentas.length === 0 ? (
              /* Estado vacío */
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="p-6 bg-emerald-500/10 rounded-full mb-6 border border-emerald-500/20">
                  <CheckCircle2 className="w-16 h-16 text-emerald-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">¡Todo cubierto!</h3>
                <p className="text-gray-400 max-w-xs">
                  No hay cargos automáticos vinculados a cuentas en los próximos 30 días.
                </p>
              </div>
            ) : (
              <>
                {/* Cuentas en riesgo primero */}
                {cuentasEnRiesgo.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 px-1">
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                      <span className="text-sm font-semibold text-red-400">Fondos insuficientes</span>
                    </div>
                    {cuentasEnRiesgo.map((r) => (
                      <CuentaCard key={r.cuenta.id} r={r} getBarColor={getBarColor} getBarWidth={getBarWidth} getDiasLabel={getDiasLabel} />
                    ))}
                  </div>
                )}

                {/* Cuentas cubiertas */}
                {cuentasOk.length > 0 && (
                  <div className="space-y-3">
                    {cuentasEnRiesgo.length > 0 && (
                      <div className="flex items-center gap-2 px-1 pt-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span className="text-sm font-semibold text-emerald-400">Con cobertura suficiente</span>
                      </div>
                    )}
                    {cuentasOk.map((r) => (
                      <CuentaCard key={r.cuenta.id} r={r} getBarColor={getBarColor} getBarWidth={getBarWidth} getDiasLabel={getDiasLabel} />
                    ))}
                  </div>
                )}

                {/* Disclaimer */}
                <div className="mt-4 p-3 bg-white/5 border border-white/10 rounded-xl">
                  <p className="text-[11px] text-gray-500 text-center leading-relaxed">
                    ℹ️ Análisis informativo. Solo incluye cargos automáticos vinculados a cuentas.
                    Revisa manualmente si tienes débitos adicionales no registrados.
                  </p>
                </div>
              </>
            )}
          </div>

          {/* FOOTER MOBILE */}
          <div className="md:hidden flex-shrink-0 p-4 border-t border-white/10 bg-gray-900">
            <button
              onClick={onClose}
              className="w-full py-3.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-semibold transition-colors"
            >
              Cerrar
            </button>
          </div>

        </div>
      </div>
    </>
  )
}

function CuentaCard({ r, getBarColor, getBarWidth, getDiasLabel }) {
  const { cuenta, cargosProximos, totalCargos, balance, deficit, tieneProblem } = r
  const pct = balance > 0 ? Math.min((totalCargos / balance) * 100, 100) : 100

  return (
    <div className={`rounded-2xl border p-4 space-y-3 ${
      tieneProblem
        ? 'bg-red-900/20 border-red-500/30'
        : 'bg-blue-900/15 border-blue-500/20'
    }`}>

      {/* Encabezado de cuenta */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl ${tieneProblem ? 'bg-red-500/20' : 'bg-blue-500/20'}`}>
            <Wallet className={`w-4 h-4 ${tieneProblem ? 'text-red-400' : 'text-blue-400'}`} />
          </div>
          <div>
            <div className="text-sm font-bold text-white">{cuenta.nombre}</div>
            {cuenta.banco && <div className="text-[11px] text-gray-400">{cuenta.banco}</div>}
          </div>
        </div>
        <div className="text-right">
          <div className={`text-base font-bold ${tieneProblem ? 'text-red-400' : 'text-emerald-400'}`}>
            ${fmt(balance)}
          </div>
          <div className="text-[10px] text-gray-500">balance actual</div>
        </div>
      </div>

      {/* Barra de cobertura */}
      <div>
        <div className="flex justify-between text-[10px] text-gray-400 mb-1">
          <span>Cargos próximos</span>
          <span>{Math.round(pct)}% del balance</span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${getBarColor(totalCargos, balance)}`}
            style={{ width: getBarWidth(totalCargos, balance) }}
          />
        </div>
      </div>

      {/* Lista de cargos */}
      <div className="space-y-1.5">
        {cargosProximos.map((cargo, idx) => {
          const badge = getDiasLabel(cargo.dias)
          return (
            <div key={idx} className="flex items-center justify-between py-1 border-b border-white/5 last:border-0">
              <div className="flex items-center gap-2">
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${badge.cls}`}>{badge.text}</span>
                {cargo.tipo === 'suscripcion'
                  ? <Repeat className="w-3 h-3 text-purple-400 flex-shrink-0" />
                  : <Calendar className="w-3 h-3 text-blue-400 flex-shrink-0" />
                }
                <span className="text-xs text-gray-300 truncate max-w-[120px]">{cargo.nombre}</span>
              </div>
              <span className="text-xs font-semibold text-white flex-shrink-0">${fmt(cargo.monto)}</span>
            </div>
          )
        })}
      </div>

      {/* Resumen */}
      <div className="pt-2 border-t border-white/10 space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">Total cargos (30 días):</span>
          <span className="font-semibold text-white">${fmt(totalCargos)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">Balance disponible:</span>
          <span className={`font-semibold ${tieneProblem ? 'text-red-400' : 'text-emerald-400'}`}>${fmt(balance)}</span>
        </div>
        {tieneProblem && (
          <div className="flex items-center justify-between text-xs mt-1 pt-1 border-t border-red-500/20">
            <span className="text-red-400 flex items-center gap-1">
              <TrendingDown className="w-3 h-3" /> Déficit estimado:
            </span>
            <span className="font-bold text-red-400">-${fmt(deficit)}</span>
          </div>
        )}
      </div>

    </div>
  )
}
