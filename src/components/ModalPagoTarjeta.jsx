import React, { useState, useEffect, useCallback, useRef } from 'react'
import { CreditCard, X, ChevronLeft, Loader2, Info, Calculator, Wallet, Building2 } from 'lucide-react'
import { useCuentasBancarias } from '../hooks/useCuentasBancarias'

const ModalPagoTarjeta = ({ onClose, onSave, deudas, deudaPreseleccionada = null }) => {
  const { cuentas } = useCuentasBancarias()
  const [isLoading, setIsLoading] = useState(false)

  const montoInputRef = useRef(null)
  const cuentasSectionRef = useRef(null)

  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    tarjeta: deudaPreseleccionada?.cuenta || deudas[0]?.cuenta || '',
    monto: '',
    principal: '',
    interes: '',
    metodo: 'Efectivo',
    cuenta_id: '',
    notas: ''
  })

  const METODOS_PAGO_COMPLETO = ['Efectivo', 'Tarjeta', 'Transferencia', 'Cheque', 'Débito']

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

  const calcularInteresMensual = useCallback((deuda) => {
    if (!deuda || !deuda.apr || !deuda.saldo) return 0
    const tasaMensual = deuda.apr / 12
    return deuda.saldo * tasaMensual
  }, [])

  const distribuirPago = useCallback((montoPago, deuda) => {
    if (!montoPago || montoPago <= 0) return { principal: 0, interes: 0 }
    const saldoActual = Number(deuda.saldo || 0)
    const montoNum = Number(montoPago)
    if (montoNum >= saldoActual) {
      return { interes: 0, principal: saldoActual }
    }
    const interesMensual = calcularInteresMensual(deuda)
    if (montoNum <= interesMensual) {
      return { interes: montoNum, principal: 0 }
    } else {
      return { interes: interesMensual, principal: montoNum - interesMensual }
    }
  }, [calcularInteresMensual])

  useEffect(() => {
    if (formData.monto && formData.tarjeta) {
      const deudaSeleccionada = deudas.find(d => d.cuenta === formData.tarjeta)
      if (deudaSeleccionada) {
        const { principal, interes } = distribuirPago(Number(formData.monto), deudaSeleccionada)
        setFormData(prev => ({ ...prev, principal: principal.toFixed(2), interes: interes.toFixed(2) }))
      }
    }
  }, [formData.monto, formData.tarjeta, deudas, distribuirPago])

  useEffect(() => {
    if (deudaPreseleccionada && montoInputRef.current) {
      setTimeout(() => {
        montoInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        setTimeout(() => { montoInputRef.current?.querySelector('input')?.focus() }, 1200)
      }, 800)
    }
  }, [deudaPreseleccionada])

  const handleSeleccionarTarjeta = (cuentaTarjeta) => {
    setFormData({ ...formData, tarjeta: cuentaTarjeta })
    setTimeout(() => {
      if (montoInputRef.current) {
        montoInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
        setTimeout(() => { montoInputRef.current?.querySelector('input')?.focus() }, 1200)
      }
    }, 600)
  }

  useEffect(() => {
    if (formData.metodo === 'Débito') {
      setTimeout(() => {
        cuentasSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 800)
    }
  }, [formData.metodo])

  const handleSubmit = async () => {
    try {
      setIsLoading(true)
      const deudaSeleccionada = deudas.find(d => d.cuenta === formData.tarjeta)
      if (!deudaSeleccionada) { alert('Debes seleccionar una tarjeta válida'); return }
      if (!formData.monto || Number(formData.monto) <= 0) { alert('Debes ingresar un monto válido'); return }
      if (formData.metodo === 'Débito' && !formData.cuenta_id) {
        alert('⚠️ Debes seleccionar una cuenta bancaria para débito automático')
        cuentasSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        return
      }
      if (formData.metodo === 'Débito' && formData.cuenta_id) {
        const cuenta = cuentas.find(c => c.id === formData.cuenta_id)
        if (cuenta && Number(cuenta.balance) < Number(formData.monto)) {
          alert(`❌ Fondos insuficientes\n\nSaldo disponible: $${Number(cuenta.balance).toFixed(2)}\nMonto a pagar: $${Number(formData.monto).toFixed(2)}`)
          return
        }
      }
      await onSave({
        deuda_id: deudaSeleccionada.id,
        monto_total: Number(formData.monto),
        a_principal: Number(formData.principal),
        intereses: Number(formData.interes),
        metodo: formData.metodo,
        cuenta_id: formData.cuenta_id || null,
        fecha: formData.fecha,
        notas: formData.notas
      })
      onClose()
    } catch (e) {
      console.error('Error registrando pago:', e)
      alert('Error al registrar el pago')
    } finally {
      setIsLoading(false)
    }
  }

  const deudaActual = deudas.find(d => d.cuenta === formData.tarjeta)
  const interesMensualCalculado = deudaActual ? calcularInteresMensual(deudaActual) : 0
  const principalNumber = Number(formData.principal || 0)
  const interesNumber = Number(formData.interes || 0)
  const cuentaSeleccionada = cuentas.find(c => c.id === formData.cuenta_id)

  const inputClass = "w-full bg-gray-800 text-white px-4 py-3 rounded-xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"

  return (
    <>
      {/* OVERLAY */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        style={{ zIndex: 99998 }}
        onClick={onClose}
      />

      {/* MODAL */}
      <div
        className="fixed inset-0 flex items-end md:items-center md:justify-center"
        style={{ zIndex: 99999 }}
      >
        <div
          className="w-full md:w-[95%] md:max-w-lg
                     bg-gray-900 rounded-t-3xl md:rounded-2xl shadow-2xl
                     border-t md:border border-white/10
                     flex flex-col overflow-hidden"
          style={{ maxHeight: 'calc(100dvh - env(safe-area-inset-top, 0px) - 12px)' }}
          onClick={(e) => e.stopPropagation()}
        >

          {/* HEADER */}
          <div className="flex-shrink-0 px-5 pt-5 pb-4 border-b border-white/10 bg-gradient-to-r from-purple-950/40 to-gray-900">
            {/* Pill indicator mobile */}
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4 md:hidden" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="p-2 -ml-2 text-gray-400 hover:text-white rounded-xl transition-colors md:hidden"
                  disabled={isLoading}
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <div className="p-2.5 bg-purple-600 rounded-xl shadow-lg shadow-purple-600/30">
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Pago de Tarjeta</h3>
                  <p className="text-xs text-gray-400">Registra y distribuye tu pago</p>
                </div>
              </div>
              <button
                onClick={onClose}
                disabled={isLoading}
                className="hidden md:flex p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* CONTENIDO SCROLLEABLE */}
          <div
            className="flex-1 overflow-y-auto overscroll-contain p-5 space-y-5"
            style={{
              WebkitOverflowScrolling: 'touch',
              paddingBottom: 'calc(env(safe-area-inset-bottom, 16px) + 80px)'
            }}
          >

            {/* 1. SELECTOR DE TARJETA */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                1️⃣ Selecciona la tarjeta a pagar *
              </p>
              <div className="space-y-2">
                {deudas.map((deuda) => {
                  const isSelected = formData.tarjeta === deuda.cuenta
                  const pagoMinimo = deuda.pago_minimo || 0
                  return (
                    <button
                      key={deuda.id}
                      type="button"
                      onClick={() => handleSeleccionarTarjeta(deuda.cuenta)}
                      disabled={isLoading}
                      className={`w-full p-4 rounded-2xl border-2 transition-all text-left active:scale-[0.98] touch-manipulation disabled:opacity-50 ${
                        isSelected
                          ? 'border-purple-500 bg-purple-500/15 shadow-lg shadow-purple-500/10'
                          : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <CreditCard className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-purple-400' : 'text-gray-400'}`} />
                            <span className={`font-bold text-sm truncate ${isSelected ? 'text-white' : 'text-gray-200'}`}>
                              {deuda.cuenta}
                            </span>
                          </div>
                          <div className="flex gap-3 text-xs text-gray-400 flex-wrap">
                            <span>{deuda.tipo || 'Tarjeta de Crédito'}</span>
                            <span className="text-yellow-400 font-semibold">APR {((deuda.apr || 0) * 100).toFixed(1)}%</span>
                            <span className="text-orange-400">Mín: ${pagoMinimo.toFixed(2)}</span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-xs text-gray-500 mb-0.5">Saldo</div>
                          <div className={`text-xl font-bold ${isSelected ? 'text-red-400' : 'text-red-500'}`}>
                            ${deuda.saldo?.toFixed(2)}
                          </div>
                        </div>
                      </div>

                      {deuda.balance && (
                        <div className="mt-3">
                          <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                            <span>Usado</span>
                            <span>{((deuda.saldo / deuda.balance) * 100).toFixed(0)}%</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full transition-all ${
                                (deuda.saldo / deuda.balance) > 0.8 ? 'bg-red-500' :
                                (deuda.saldo / deuda.balance) > 0.5 ? 'bg-yellow-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min((deuda.saldo / deuda.balance) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {isSelected && (
                        <div className="mt-2 text-xs text-purple-400 font-semibold flex items-center gap-1">
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
                          Tarjeta seleccionada
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* INFO DE INTERESES */}
            {deudaActual && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-blue-300">
                  <p className="font-semibold mb-0.5">Interés mensual estimado:</p>
                  <p className="text-lg font-bold text-blue-400">${interesMensualCalculado.toFixed(2)}</p>
                  <p className="text-blue-400/70 text-[10px] mt-0.5">
                    APR {((deudaActual.apr || 0) * 100).toFixed(1)}% sobre ${deudaActual.saldo?.toFixed(2)}
                  </p>
                </div>
              </div>
            )}

            {/* 2. MONTO + FECHA */}
            <div ref={montoInputRef} className="grid grid-cols-2 gap-3 scroll-mt-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                  2️⃣ Monto a pagar *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">$</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    value={formData.monto}
                    onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                    disabled={isLoading}
                    className="w-full pl-7 pr-4 py-3 bg-gray-800 border-2 border-white/10 rounded-xl text-white text-lg font-bold focus:border-purple-500 focus:outline-none disabled:opacity-50 transition-all"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                  Fecha
                </label>
                <input
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                  disabled={isLoading}
                  className={inputClass}
                />
              </div>
            </div>

            {/* DISTRIBUCIÓN AUTOMÁTICA */}
            {formData.monto && Number(formData.monto) > 0 && (
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Calculator className="w-4 h-4 text-purple-400" />
                  <h4 className="text-sm font-bold text-white">Distribución del Pago</h4>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">A intereses:</span>
                    <span className="text-sm font-bold text-red-400">${interesNumber.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">A principal (reduce saldo):</span>
                    <span className="text-sm font-bold text-emerald-400">${principalNumber.toFixed(2)}</span>
                  </div>
                  <div className="pt-2 border-t border-white/10 flex justify-between items-center">
                    <span className="text-xs font-semibold text-gray-300">Nuevo saldo:</span>
                    <span className="text-base font-bold text-white">
                      ${((deudaActual?.saldo || 0) - principalNumber).toFixed(2)}
                    </span>
                  </div>
                </div>
                {principalNumber === 0 && interesNumber > 0 && (
                  <div className="mt-3 p-2.5 bg-yellow-500/15 border border-yellow-500/20 rounded-lg text-xs text-yellow-300">
                    ⚠️ Este pago solo cubre intereses. El saldo no se reducirá.
                  </div>
                )}
                {principalNumber > 0 && (
                  <div className="mt-3 p-2.5 bg-emerald-500/15 border border-emerald-500/20 rounded-lg text-xs text-emerald-300">
                    ✅ Reducirás tu deuda en ${principalNumber.toFixed(2)}
                  </div>
                )}
              </div>
            )}

            {/* 3. MÉTODO DE PAGO */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                3️⃣ Método de pago *
              </label>
              <select
                value={formData.metodo}
                onChange={(e) => setFormData({ ...formData, metodo: e.target.value, cuenta_id: e.target.value === 'Débito' ? '' : formData.cuenta_id })}
                disabled={isLoading}
                className={inputClass}
              >
                {METODOS_PAGO_COMPLETO.map((metodo) => (
                  <option key={metodo} value={metodo}>
                    {metodo === 'Débito' ? '💳 Débito (de mis cuentas)' : metodo}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. SELECTOR DE CUENTA BANCARIA */}
            {formData.metodo === 'Débito' && (
              <div
                ref={cuentasSectionRef}
                className="bg-cyan-500/10 border border-cyan-500/20 rounded-2xl p-4 scroll-mt-4"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Wallet className="w-4 h-4 text-cyan-400" />
                  <h4 className="text-sm font-bold text-white">4️⃣ Cuenta para débito *</h4>
                </div>
                {cuentas.length === 0 ? (
                  <div className="text-center py-6 text-gray-400 text-sm">
                    <Building2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p>No tienes cuentas bancarias registradas</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {cuentas.map((cuenta) => {
                      const isSelected = formData.cuenta_id === cuenta.id
                      const tieneFondos = !formData.monto || Number(cuenta.balance) >= Number(formData.monto)
                      return (
                        <button
                          key={cuenta.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, cuenta_id: cuenta.id })}
                          disabled={isLoading || !tieneFondos}
                          className={`w-full p-3 rounded-xl border-2 transition-all text-left active:scale-[0.98] touch-manipulation ${
                            isSelected ? 'border-cyan-500 bg-cyan-500/15' :
                            tieneFondos ? 'border-white/10 bg-white/5 hover:border-white/20' :
                            'border-red-500/20 bg-red-500/5 opacity-60'
                          } disabled:cursor-not-allowed`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Building2 className={`w-4 h-4 ${isSelected ? 'text-cyan-400' : 'text-gray-400'}`} />
                              <div>
                                <div className={`font-semibold text-sm ${isSelected ? 'text-white' : 'text-gray-200'}`}>
                                  {cuenta.nombre}
                                </div>
                                <div className="text-[10px] text-gray-500">
                                  {cuenta.banco || 'Sin banco'}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`text-base font-bold ${tieneFondos ? (isSelected ? 'text-cyan-400' : 'text-emerald-400') : 'text-red-400'}`}>
                                ${Number(cuenta.balance).toFixed(2)}
                              </div>
                              {!tieneFondos && formData.monto && (
                                <div className="text-[10px] text-red-400">Fondos insuficientes</div>
                              )}
                            </div>
                          </div>
                          {isSelected && (
                            <div className="mt-1.5 text-xs text-cyan-400 font-semibold flex items-center gap-1">
                              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                              Se debitará de esta cuenta
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}

                {cuentaSeleccionada && formData.monto && (
                  <div className="mt-3 p-3 bg-gray-900/60 rounded-xl border border-cyan-500/15">
                    <div className="text-xs space-y-1.5">
                      <div className="flex justify-between text-gray-400">
                        <span>Saldo actual:</span>
                        <span className="text-white font-semibold">${Number(cuentaSeleccionada.balance).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-gray-400">
                        <span>A debitar:</span>
                        <span className="text-red-400 font-semibold">-${Number(formData.monto).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between pt-1.5 border-t border-white/10">
                        <span className="font-semibold text-white">Nuevo saldo:</span>
                        <span className="text-cyan-400 font-bold">
                          ${(Number(cuentaSeleccionada.balance) - Number(formData.monto)).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* NOTAS */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                Notas (opcional)
              </label>
              <input
                value={formData.notas}
                onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                disabled={isLoading}
                className={inputClass}
                placeholder="Detalles del pago..."
              />
            </div>

          </div>

          {/* FOOTER */}
          <div
            className="flex-shrink-0 p-4 border-t border-white/10 bg-gray-900"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
          >
            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 py-3.5 bg-gray-800 hover:bg-gray-700 active:scale-[0.98] text-white rounded-xl font-semibold transition-all touch-manipulation disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={isLoading || !formData.monto}
                className="flex-1 py-3.5 bg-purple-600 hover:bg-purple-700 active:scale-[0.98] text-white rounded-xl font-semibold transition-all touch-manipulation disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  formData.metodo === 'Débito' ? '💳 Debitar y Pagar' : 'Registrar Pago'
                )}
              </button>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}

export default ModalPagoTarjeta
