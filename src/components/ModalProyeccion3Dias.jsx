import React, { useEffect, useMemo } from 'react'
import {
  X, ShieldAlert, CheckCircle2, TrendingDown,
  Calendar, Repeat, Wallet, AlertTriangle, ChevronLeft
} from 'lucide-react'

const fmt = (v) => '$' + Number(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/**
 * Modal de proyección financiera a 3 días.
 * Se muestra al entrar a la app (máximo 1 vez por día).
 * Analiza cuentas bancarias vs cargos automáticos en los próximos 3 días.
 */
export default function ModalProyeccion3Dias({ cuentas = [], gastosFijos = [], suscripciones = [], onClose }) {

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

  const hoy = new Date()
  const hoy3 = new Date(hoy)
  hoy3.setDate(hoy3.getDate() + 3)

  // Calcular proyección por cuenta
  const proyeccion = useMemo(() => {
    return cuentas.map(cuenta => {
      const cargos = []

      gastosFijos.forEach(gf => {
        if (gf.cuenta_id !== cuenta.id || !gf.auto_pago || gf.estado === 'Pagado' || !gf.dia_venc) return
        const fechaEstesMes = new Date(hoy.getFullYear(), hoy.getMonth(), gf.dia_venc)
        const fechaSigMes   = new Date(hoy.getFullYear(), hoy.getMonth() + 1, gf.dia_venc)
        const fecha         = fechaEstesMes >= hoy ? fechaEstesMes : fechaSigMes
        if (fecha <= hoy3) {
          cargos.push({
            nombre: gf.nombre,
            monto: Number(gf.monto || 0),
            fecha,
            dias: Math.ceil((fecha - hoy) / 86400000),
            tipo: 'fijo'
          })
        }
      })

      suscripciones.forEach(sub => {
        if (sub.cuenta_id !== cuenta.id || !sub.autopago || sub.estado === 'Cancelado' || !sub.proximo_pago) return
        const fecha = new Date(sub.proximo_pago + 'T00:00:00')
        if (fecha >= hoy && fecha <= hoy3) {
          cargos.push({
            nombre: sub.servicio,
            monto: Number(sub.costo || 0),
            fecha,
            dias: Math.ceil((fecha - hoy) / 86400000),
            tipo: 'suscripcion'
          })
        }
      })

      const totalCargos  = cargos.reduce((s, c) => s + c.monto, 0)
      const balance      = Number(cuenta.balance || 0)
      const saldoFinal   = balance - totalCargos
      const enRiesgo     = saldoFinal < 0

      return {
        cuenta,
        cargos: cargos.sort((a, b) => a.dias - b.dias),
        totalCargos,
        balance,
        saldoFinal,
        enRiesgo
      }
    }).filter(r => r.cargos.length > 0)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cuentas, gastosFijos, suscripciones])

  const cuentasEnRiesgo = proyeccion.filter(r => r.enRiesgo)
  const totalCargos3d   = proyeccion.reduce((s, r) => s + r.totalCargos, 0)
  const hayProblemas    = cuentasEnRiesgo.length > 0

  const diasLabel = (dias) => {
    if (dias === 0) return { t: 'HOY',    c: 'bg-red-500 text-white' }
    if (dias === 1) return { t: 'MAÑANA', c: 'bg-orange-500 text-white' }
    return { t: `+${dias}d`,              c: 'bg-blue-600 text-white' }
  }

  const fechaStr = hoy.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <>
      {/* OVERLAY */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-sm"
        style={{ zIndex: 99998 }}
        onClick={onClose}
      />

      {/* MODAL */}
      <div
        className="fixed inset-0 flex items-end md:items-center md:justify-center"
        style={{ zIndex: 99999 }}
      >
        <div
          className="w-full h-[92vh] md:w-[95%] md:max-w-md md:h-auto md:max-h-[88vh]
                     bg-gray-900 md:rounded-2xl shadow-2xl
                     border-t md:border border-white/10
                     flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >

          {/* HEADER */}
          <div className={`flex-shrink-0 px-4 py-4 border-b border-white/10 ${
            hayProblemas
              ? 'bg-gradient-to-r from-red-950/60 to-gray-900'
              : 'bg-gradient-to-r from-emerald-950/60 to-gray-900'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={onClose} className="p-2 -ml-2 text-gray-400 hover:text-white rounded-xl transition-colors md:hidden">
                  <ChevronLeft className="w-6 h-6" />
                </button>

                <div className={`p-2.5 rounded-xl shadow-lg ${hayProblemas ? 'bg-red-600' : 'bg-emerald-600'}`}>
                  {hayProblemas
                    ? <AlertTriangle className="w-5 h-5 text-white" />
                    : <CheckCircle2 className="w-5 h-5 text-white" />
                  }
                </div>

                <div>
                  <h2 className="text-base font-bold text-white">
                    {hayProblemas ? '⚠️ Proyección próximos 3 días' : '✅ Proyección próximos 3 días'}
                  </h2>
                  <p className="text-xs text-gray-400 capitalize">{fechaStr}</p>
                </div>
              </div>

              <button onClick={onClose} className="hidden md:flex p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Resumen top */}
            {proyeccion.length > 0 && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="bg-white/5 rounded-xl px-3 py-2 text-center">
                  <div className="text-[10px] text-gray-400 mb-0.5">Cargos automáticos</div>
                  <div className="text-base font-bold text-orange-400">{fmt(totalCargos3d)}</div>
                </div>
                <div className="bg-white/5 rounded-xl px-3 py-2 text-center">
                  <div className="text-[10px] text-gray-400 mb-0.5">Cuentas en riesgo</div>
                  <div className={`text-base font-bold ${cuentasEnRiesgo.length > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {cuentasEnRiesgo.length} / {proyeccion.length}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* CONTENIDO */}
          <div
            className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-3"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {proyeccion.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="p-6 bg-emerald-500/10 rounded-full mb-4 border border-emerald-500/20">
                  <CheckCircle2 className="w-14 h-14 text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">¡Sin cargos en 3 días!</h3>
                <p className="text-gray-400 text-sm max-w-xs">
                  No hay cargos automáticos vinculados a cuentas en los próximos 3 días.
                </p>
              </div>
            ) : (
              <>
                {/* Advertencia si hay riesgo */}
                {hayProblemas && (
                  <div className="bg-red-900/30 border border-red-500/40 rounded-xl p-3 flex items-start gap-2.5">
                    <ShieldAlert className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-red-300 leading-relaxed">
                      <span className="font-bold">Fondos insuficientes detectados.</span>{' '}
                      {cuentasEnRiesgo.length === 1
                        ? 'Una cuenta no tendrá saldo suficiente para los cargos automáticos.'
                        : `${cuentasEnRiesgo.length} cuentas no tendrán saldo suficiente.`
                      }{' '}
                      Recarga el saldo antes de que se procesen.
                    </p>
                  </div>
                )}

                {/* Tarjetas por cuenta */}
                {proyeccion.map((r) => (
                  <div
                    key={r.cuenta.id}
                    className={`rounded-2xl border p-4 space-y-3 ${
                      r.enRiesgo
                        ? 'bg-red-900/20 border-red-500/30'
                        : 'bg-white/5 border-white/10'
                    }`}
                  >
                    {/* Header cuenta */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${r.enRiesgo ? 'bg-red-500/20' : 'bg-blue-500/20'}`}>
                          <Wallet className={`w-4 h-4 ${r.enRiesgo ? 'text-red-400' : 'text-blue-400'}`} />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white">{r.cuenta.nombre}</div>
                          {r.cuenta.banco && <div className="text-[10px] text-gray-500">{r.cuenta.banco}</div>}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-400">Balance</div>
                        <div className="text-sm font-bold text-white">{fmt(r.balance)}</div>
                      </div>
                    </div>

                    {/* Cargos próximos */}
                    <div className="space-y-1.5 border-t border-white/5 pt-2">
                      {r.cargos.map((c, i) => {
                        const lbl = diasLabel(c.dias)
                        return (
                          <div key={i} className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${lbl.c}`}>{lbl.t}</span>
                              {c.tipo === 'suscripcion'
                                ? <Repeat className="w-3 h-3 text-purple-400" />
                                : <Calendar className="w-3 h-3 text-blue-400" />
                              }
                              <span className="text-xs text-gray-300 truncate max-w-[130px]">{c.nombre}</span>
                            </div>
                            <span className="text-xs font-semibold text-white">{fmt(c.monto)}</span>
                          </div>
                        )
                      })}
                    </div>

                    {/* Saldo proyectado */}
                    <div className="border-t border-white/10 pt-2 space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Total cargos:</span>
                        <span className="text-white font-semibold">{fmt(r.totalCargos)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Saldo proyectado:</span>
                        <span className={`font-bold ${r.enRiesgo ? 'text-red-400' : 'text-emerald-400'}`}>
                          {fmt(r.saldoFinal)}
                        </span>
                      </div>
                      {r.enRiesgo && (
                        <div className="flex items-center gap-1 pt-1">
                          <TrendingDown className="w-3 h-3 text-red-400" />
                          <span className="text-[11px] text-red-400 font-semibold">
                            Déficit: {fmt(Math.abs(r.saldoFinal))} — Recarga antes de que se cobre
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Disclaimer */}
                <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
                  <p className="text-[10px] text-gray-500 text-center leading-relaxed">
                    ℹ️ Solo incluye cargos automáticos vinculados a cuentas. Este análisis es informativo.
                  </p>
                </div>
              </>
            )}
          </div>

          {/* FOOTER */}
          <div className="flex-shrink-0 p-4 border-t border-white/10 bg-gray-900">
            <button
              onClick={onClose}
              className="w-full py-3.5 bg-gray-800 hover:bg-gray-700 active:scale-[0.98] text-white rounded-xl font-semibold transition-all touch-manipulation"
            >
              Entendido
            </button>
          </div>

        </div>
      </div>
    </>
  )
}
