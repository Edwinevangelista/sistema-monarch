import React, { useState, useEffect, useCallback, useRef } from 'react'
import { CreditCard, X, Loader2, Info, Calculator, Wallet, Building2 } from 'lucide-react'
import { useCuentasBancarias } from '../hooks/useCuentasBancarias'

const ModalPagoTarjeta = ({ onClose, onSave, deudas, deudaPreseleccionada = null }) => { // ✅ Agregar prop
  const { cuentas } = useCuentasBancarias()
  const [isLoading, setIsLoading] = useState(false)
  
  const montoInputRef = useRef(null)
  const cuentasSectionRef = useRef(null)

  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    tarjeta: deudaPreseleccionada?.cuenta || deudas[0]?.cuenta || '', // ✅ Usar deuda preseleccionada
    monto: '',
    principal: '',
    interes: '',
    metodo: 'Efectivo',
    cuenta_id: '',
    notas: ''
  })

  const METODOS_PAGO_COMPLETO = [
    'Efectivo',
    'Tarjeta',
    'Transferencia',
    'Cheque',
    'Débito'
  ]

  const calcularInteresMensual = useCallback((deuda) => {
    if (!deuda || !deuda.apr || !deuda.saldo) return 0
    const tasaMensual = deuda.apr / 12
    return deuda.saldo * tasaMensual
  }, [])

  const distribuirPago = useCallback((montoPago, deuda) => {
    if (!montoPago || montoPago <= 0) {
      return { principal: 0, interes: 0 }
    }

    const interesMensual = calcularInteresMensual(deuda)
    
    if (montoPago <= interesMensual) {
      return {
        interes: montoPago,
        principal: 0
      }
    } else {
      return {
        interes: interesMensual,
        principal: montoPago - interesMensual
      }
    }
  }, [calcularInteresMensual])

  useEffect(() => {
    if (formData.monto && formData.tarjeta) {
      const deudaSeleccionada = deudas.find(d => d.cuenta === formData.tarjeta)
      if (deudaSeleccionada) {
        const { principal, interes } = distribuirPago(
          Number(formData.monto),
          deudaSeleccionada
        )
        
        setFormData(prev => ({
          ...prev,
          principal: principal.toFixed(2),
          interes: interes.toFixed(2)
        }))
      }
    }
  }, [formData.monto, formData.tarjeta, deudas, distribuirPago])

  // ✅ Scroll automático al montar si hay deuda preseleccionada
  useEffect(() => {
    if (deudaPreseleccionada && montoInputRef.current) {
      setTimeout(() => {
        montoInputRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
        })
        
        setTimeout(() => {
          montoInputRef.current?.querySelector('input')?.focus()
        }, 1200)
      }, 800)
    }
  }, [deudaPreseleccionada])

  // ✅ Scroll más lento al seleccionar tarjeta manualmente
  const handleSeleccionarTarjeta = (cuentaTarjeta) => {
    setFormData({ ...formData, tarjeta: cuentaTarjeta })
    
    setTimeout(() => {
      if (montoInputRef.current) {
        montoInputRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
        })
        
        setTimeout(() => {
          montoInputRef.current?.querySelector('input')?.focus()
        }, 1200)
      }
    }, 600)
  }

  // ✅ Scroll más lento para sección de cuentas
  useEffect(() => {
    if (formData.metodo === 'Débito') {
      setTimeout(() => {
        if (cuentasSectionRef.current) {
          cuentasSectionRef.current.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start',
          })
        }
      }, 800)
    }
  }, [formData.metodo])

  const handleSubmit = async () => {
    try {
      setIsLoading(true)

      const deudaSeleccionada = deudas.find(d => d.cuenta === formData.tarjeta)
      if (!deudaSeleccionada) {
        alert('Debes seleccionar una tarjeta válida')
        return
      }

      if (!formData.monto || Number(formData.monto) <= 0) {
        alert('Debes ingresar un monto válido')
        return
      }

      if (formData.metodo === 'Débito' && !formData.cuenta_id) {
        alert('⚠️ Debes seleccionar una cuenta bancaria para débito automático')
        if (cuentasSectionRef.current) {
          cuentasSectionRef.current.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          })
        }
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

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div 
        className="bg-gray-800 rounded-2xl p-6 max-w-md w-full border-2 border-purple-500 max-h-[90vh] overflow-y-auto"
        style={{ 
          scrollBehavior: 'smooth',
          scrollPaddingTop: '20px'
        }}
      >
        <div className="flex items-center justify-between mb-6 sticky top-0 bg-gray-800 pb-2 z-10 border-b border-gray-700">
          <h3 className="text-2xl font-bold text-white flex items-center gap-2">
            <CreditCard className="w-7 h-7 text-purple-400" />
            Pago de Tarjeta
          </h3>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-white disabled:opacity-50" 
            disabled={isLoading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          {/* SELECTOR DE TARJETA */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-3">
              1️⃣ Selecciona la Tarjeta a Pagar *
            </label>
            
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
                    className={`
                      w-full p-4 rounded-xl border-2 transition-all duration-300 text-left
                      ${isSelected 
                        ? 'border-purple-500 bg-purple-500/20 shadow-lg shadow-purple-500/20' 
                        : 'border-gray-600 bg-gray-700 hover:border-gray-500 hover:bg-gray-650'
                      }
                      disabled:opacity-50
                    `}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <CreditCard className={`w-4 h-4 ${isSelected ? 'text-purple-400' : 'text-gray-400'}`} />
                          <span className={`font-bold ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                            {deuda.cuenta}
                          </span>
                        </div>
                        
                        <div className="text-xs text-gray-400 space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span>Tipo:</span>
                            <span className="text-gray-300">{deuda.tipo || 'Tarjeta de Crédito'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span>APR:</span>
                            <span className="text-yellow-400 font-semibold">
                              {((deuda.apr || 0) * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span>Pago mínimo:</span>
                            <span className="text-orange-400 font-semibold">
                              ${pagoMinimo.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-xs text-gray-400 mb-1">Saldo</div>
                        <div className={`text-2xl font-bold ${isSelected ? 'text-red-400' : 'text-red-500'}`}>
                          ${deuda.saldo?.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {deuda.balance && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                          <span>Usado</span>
                          <span>{((deuda.saldo / deuda.balance) * 100).toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-gray-600 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-500 ${
                              (deuda.saldo / deuda.balance) > 0.8 
                                ? 'bg-red-500' 
                                : (deuda.saldo / deuda.balance) > 0.5 
                                ? 'bg-yellow-500' 
                                : 'bg-green-500'
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
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 transition-all duration-300">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-blue-300">
                  <p className="font-semibold mb-1">Interés mensual estimado:</p>
                  <p className="text-base font-bold text-blue-400">${interesMensualCalculado.toFixed(2)}</p>
                  <p className="text-blue-400 mt-1 text-[10px]">
                    Calculado con APR {((deudaActual.apr || 0) * 100).toFixed(1)}% sobre ${deudaActual.saldo?.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* MONTO + FECHA */}
          <div ref={montoInputRef} className="grid grid-cols-2 gap-4 scroll-mt-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                2️⃣ Monto a Pagar *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-400 text-lg">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={formData.monto}
                  onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                  disabled={isLoading}
                  className="w-full pl-8 pr-4 py-3 bg-gray-700 border-2 border-gray-600 rounded-lg text-white text-lg font-semibold focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 focus:outline-none disabled:opacity-50 transition-all duration-300"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Fecha
              </label>
              <input
                type="date"
                value={formData.fecha}
                onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                disabled={isLoading}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none disabled:opacity-50 transition-all duration-300"
              />
            </div>
          </div>

          {/* DISTRIBUCIÓN AUTOMÁTICA */}
          {formData.monto && Number(formData.monto) > 0 && (
            <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-lg p-4 transition-all duration-300">
              <div className="flex items-center gap-2 mb-3">
                <Calculator className="w-4 h-4 text-purple-400" />
                <h4 className="text-sm font-bold text-white">Distribución del Pago</h4>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">A Intereses:</span>
                  <span className="text-sm font-bold text-red-400">
                    ${interesNumber.toFixed(2)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">A Principal (reduce saldo):</span>
                  <span className="text-sm font-bold text-green-400">
                    ${principalNumber.toFixed(2)}
                  </span>
                </div>

                <div className="pt-2 border-t border-gray-700">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-300 font-semibold">Nuevo Saldo:</span>
                    <span className="text-base font-bold text-white">
                      ${((deudaActual?.saldo || 0) - principalNumber).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {principalNumber === 0 && interesNumber > 0 && (
                <div className="mt-3 p-2 bg-yellow-500/20 border border-yellow-500/30 rounded text-xs text-yellow-300">
                  ⚠️ Este pago solo cubre intereses. El saldo no se reducirá.
                </div>
              )}

              {principalNumber > 0 && (
                <div className="mt-3 p-2 bg-green-500/20 border border-green-500/30 rounded text-xs text-green-300">
                  ✅ Reducirás tu deuda en ${principalNumber.toFixed(2)}
                </div>
              )}
            </div>
          )}

          {/* MÉTODO DE PAGO */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              3️⃣ Método de Pago *
            </label>
            <select
              value={formData.metodo}
              onChange={(e) => {
                setFormData({ 
                  ...formData, 
                  metodo: e.target.value,
                  cuenta_id: e.target.value === 'Débito' ? '' : formData.cuenta_id
                })
              }}
              disabled={isLoading}
              className="w-full px-4 py-3 bg-gray-700 border-2 border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none disabled:opacity-50 transition-all duration-300"
            >
              {METODOS_PAGO_COMPLETO.map((metodo) => (
                <option key={metodo} value={metodo}>
                  {metodo === 'Débito' ? '💳 Débito (de mis cuentas)' : metodo}
                </option>
              ))}
            </select>
          </div>

          {/* SELECTOR DE CUENTA BANCARIA */}
          {formData.metodo === 'Débito' && (
            <div 
              ref={cuentasSectionRef}
              className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-2 border-cyan-500/30 rounded-xl p-4 scroll-mt-4 transition-all duration-300"
            >
              <div className="flex items-center gap-2 mb-3">
                <Wallet className="w-5 h-5 text-cyan-400" />
                <h4 className="text-sm font-bold text-white">4️⃣ Selecciona Cuenta para Débito *</h4>
              </div>

              {cuentas.length === 0 ? (
                <div className="text-center py-4 text-gray-400 text-sm">
                  <Building2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No tienes cuentas bancarias registradas</p>
                  <p className="text-xs mt-1">Agrega una cuenta primero</p>
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
                        className={`
                          w-full p-3 rounded-lg border-2 transition-all duration-300 text-left
                          ${isSelected 
                            ? 'border-cyan-500 bg-cyan-500/20 scale-[1.02]' 
                            : tieneFondos
                            ? 'border-gray-600 bg-gray-700 hover:border-cyan-500/50 hover:scale-[1.01]'
                            : 'border-red-500/30 bg-red-500/10 opacity-60'
                          }
                          disabled:cursor-not-allowed disabled:hover:scale-100
                        `}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Building2 className={`w-4 h-4 ${isSelected ? 'text-cyan-400' : 'text-gray-400'}`} />
                            <div>
                              <div className={`font-semibold text-sm ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                                {cuenta.nombre}
                              </div>
                              <div className="text-xs text-gray-400">
                                {cuenta.tipo} • {cuenta.banco || 'Sin banco'}
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className={`text-lg font-bold ${
                              tieneFondos 
                                ? isSelected ? 'text-cyan-400' : 'text-green-400'
                                : 'text-red-400'
                            }`}>
                              ${Number(cuenta.balance).toFixed(2)}
                            </div>
                            {!tieneFondos && formData.monto && (
                              <div className="text-xs text-red-400">Fondos insuficientes</div>
                            )}
                          </div>
                        </div>

                        {isSelected && (
                          <div className="mt-2 text-xs text-cyan-400 font-semibold flex items-center gap-1">
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
                <div className="mt-3 p-3 bg-gray-900 rounded-lg border border-cyan-500/20 transition-all duration-300">
                  <div className="text-xs text-gray-400 space-y-1">
                    <div className="flex justify-between">
                      <span>Saldo actual:</span>
                      <span className="text-white font-semibold">${Number(cuentaSeleccionada.balance).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>A debitar:</span>
                      <span className="text-red-400 font-semibold">-${Number(formData.monto).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-gray-700">
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
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Notas (opcional)
            </label>
            <input
              value={formData.notas}
              onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
              disabled={isLoading}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none disabled:opacity-50 transition-all duration-300"
              placeholder="Detalles del pago"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6 sticky bottom-0 bg-gray-800 pt-4 border-t border-gray-700">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-600 transition-all duration-300 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || !formData.monto}
            className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 active:scale-95 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                {formData.metodo === 'Débito' ? '💳 Debitar y Pagar' : 'Registrar Pago'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ModalPagoTarjeta