import React from 'react'
import { CreditCard, TrendingDown, Calendar, Edit2, ArrowRight, AlertCircle } from 'lucide-react'
import {
  calcularPagoMinimo,
  calcularUsoCredito,
  colorUsoCredito,
  calcularFechaLimitePago,
  calcularProximoCorte,
} from '../utils/tarjetasCalculos'

const ListaDeudas = ({
  deudas = [],
  deudaPagadaEsteMes,
  onEditar,
  alVerDetalle
}) => {
  const fmt = (n) => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const diasHasta = (fecha) => {
    if (!fecha) return null
    const hoy = new Date(); hoy.setHours(0,0,0,0)
    const f = new Date(fecha); f.setHours(0,0,0,0)
    return Math.round((f - hoy) / (1000 * 60 * 60 * 24))
  }

  const fmtFecha = (fecha) => {
    if (!fecha) return null
    return new Date(fecha).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
  }

  return (
    <div className="bg-gray-800 rounded-2xl p-6 shadow-xl border-2 border-gray-700 h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <CreditCard className="w-6 h-6" />
          MIS DEUDAS
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
          <p className="text-gray-400 text-sm">Sin deudas registradas</p>
        </div>
      ) : (
        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
          {deudas.map((deuda) => {
            const pagadaEsteMes = deudaPagadaEsteMes ? deudaPagadaEsteMes(deuda.id) : false
            const esTarjeta = deuda.tipo === 'Tarjeta' || !deuda.tipo

            // Pago mínimo dinámico (calculado siempre desde saldo y APR real)
            const pagoMinDinamico = calcularPagoMinimo(deuda.saldo, deuda.apr)

            // Uso de crédito
            const usoPorc = calcularUsoCredito(deuda.saldo, deuda.limite_credito)
            const usoColor = colorUsoCredito(usoPorc)

            // Fechas: próxima fecha de corte (siempre futura) y límite de pago
            const proximoCorte = calcularProximoCorte(deuda.vence)
            const diasCorte = diasHasta(proximoCorte)
            const diasGracia = Number(deuda.dias_gracia || 21)
            const fechaLimitePago = calcularFechaLimitePago(proximoCorte, diasGracia)
            const diasPago = diasHasta(fechaLimitePago)

            return (
              <div
                key={deuda.id}
                className="bg-gray-900 rounded-xl p-4 border border-gray-700 hover:border-purple-500/50 transition-all"
              >
                {/* HEADER */}
                <div className="flex justify-between mb-3">
                  <div className="cursor-pointer flex-1 min-w-0 pr-2" onClick={() => alVerDetalle?.(deuda)}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-white font-bold truncate">{deuda.cuenta}</h3>

                      {pagadaEsteMes ? (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-green-500/20 text-green-400 border border-green-500/40 whitespace-nowrap">
                          PAGADA
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-gray-700 text-gray-300 border border-gray-600 whitespace-nowrap">
                          {deuda.estado || 'ACTIVA'}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-gray-400 mt-0.5">
                      {deuda.tipo || 'Tarjeta de Credito'}
                      {deuda.apr ? ` · APR ${(Number(deuda.apr) * 100).toFixed(1)}%` : ''}
                    </p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="text-red-400 font-bold text-lg leading-none">
                      {fmt(deuda.saldo)}
                    </p>
                    {deuda.limite_credito > 0 && (
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        de {fmt(deuda.limite_credito)}
                      </p>
                    )}
                  </div>
                </div>

                {/* BARRA USO DE CREDITO — solo para tarjetas con límite */}
                {esTarjeta && usoPorc !== null && usoColor && (
                  <div className="mb-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] text-gray-500">Uso de credito</span>
                      <span className={`text-[10px] font-bold ${usoColor.text}`}>
                        {usoPorc}% · {usoColor.label}
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 h-1.5 rounded-full">
                      <div
                        className={`${usoColor.bar} h-1.5 rounded-full transition-all`}
                        style={{ width: `${usoPorc}%` }}
                      />
                    </div>
                    {usoPorc >= 70 && (
                      <div className="flex items-center gap-1 mt-1">
                        <AlertCircle className="w-3 h-3 text-red-400 flex-shrink-0" />
                        <span className="text-[10px] text-red-400">
                          Uso alto afecta tu score crediticio
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* INFO: pago mínimo y fechas */}
                <div className="space-y-1.5 text-sm">
                  {/* Pago mínimo */}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 flex items-center gap-1 text-xs">
                      <TrendingDown className="w-3.5 h-3.5" />
                      Pago minimo
                    </span>
                    {Number(deuda.saldo) <= 0 ? (
                      <span className="text-emerald-400 font-semibold text-xs">Saldada</span>
                    ) : (
                      <span className="text-white font-semibold text-xs">
                        {fmt(pagoMinDinamico)}
                      </span>
                    )}
                  </div>

                  {/* Fechas de corte y límite de pago */}
                  {!pagadaEsteMes && proximoCorte && (
                    <>
                      {/* Fecha de corte */}
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 flex items-center gap-1 text-xs">
                          <Calendar className="w-3.5 h-3.5" />
                          Corte
                        </span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                          diasCorte !== null && diasCorte <= 3
                            ? 'bg-orange-500/20 text-orange-400'
                            : 'bg-gray-700/60 text-gray-300'
                        }`}>
                          {fmtFecha(proximoCorte)}
                          {diasCorte !== null && ` (${diasCorte === 0 ? 'hoy' : diasCorte === 1 ? 'mañana' : `en ${diasCorte}d`})`}
                        </span>
                      </div>

                      {/* Fecha límite de pago */}
                      {fechaLimitePago && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400 flex items-center gap-1 text-xs">
                            <Calendar className="w-3.5 h-3.5" />
                            Pagar antes de
                          </span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                            diasPago !== null && diasPago <= 0
                              ? 'bg-red-500/20 text-red-400'
                              : diasPago !== null && diasPago <= 5
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-green-500/10 text-green-400'
                          }`}>
                            {fmtFecha(fechaLimitePago)}
                            {diasPago !== null && ` (${diasPago <= 0 ? 'VENCIDO' : diasPago === 1 ? 'mañana' : `en ${diasPago}d`})`}
                          </span>
                        </div>
                      )}
                    </>
                  )}

                  {pagadaEsteMes && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 flex items-center gap-1 text-xs">
                        <Calendar className="w-3.5 h-3.5" />
                        Estado
                      </span>
                      <span className="text-green-400 font-semibold text-xs">
                        CUBIERTO ESTE MES
                      </span>
                    </div>
                  )}
                </div>

                {/* ACCIONES */}
                <div className="flex gap-2 mt-3 pt-2 border-t border-gray-800">
                  {onEditar && (
                    <button
                      onClick={() => onEditar(deuda)}
                      className="flex-1 text-xs bg-gray-700 hover:bg-purple-600 active:scale-[0.98] text-white py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all touch-manipulation"
                    >
                      <Edit2 className="w-3 h-3" /> Editar
                    </button>
                  )}

                  {alVerDetalle && (
                    <button
                      onClick={() => alVerDetalle(deuda)}
                      className="flex-1 text-xs bg-gray-700 hover:bg-gray-600 active:scale-[0.98] text-white py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all touch-manipulation"
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
