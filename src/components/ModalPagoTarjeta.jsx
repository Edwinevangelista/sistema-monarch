import React, { useState, useEffect, useCallback, useRef } from 'react'
import { CreditCard, X, Loader2, Info, Calculator, Wallet, Building2 } from 'lucide-react'
import { useCuentasBancarias } from '../hooks/useCuentasBancarias'
import { toast } from 'sonner'
import { roundMoney } from '../utils/money'

const createIdempotencyKey = () => {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID()
  return `pay-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

const ModalPagoTarjeta = ({ onClose, onSave, deudas, deudaPreseleccionada = null }) => {
  const { cuentas } = useCuentasBancarias()
  const [isLoading, setIsLoading] = useState(false)

  const montoInputRef = useRef(null)
  const cuentasSectionRef = useRef(null)
  const idemKeyRef = useRef(createIdempotencyKey())
  const inFlightRef = useRef(false)

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
    document.body.style.width = '100%'
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      document.body.style.overflow = ''
      window.scrollTo(0, scrollY)
    }
  }, [])

  const calcularInteresMensual = useCallback((deuda) => {
    if (!deuda || !deuda.apr || !deuda.saldo) return 0
    const aprDecimal = Number(deuda.apr || 0) > 1 ? Number(deuda.apr) / 100 : Number(deuda.apr || 0)
    const tasaMensual = aprDecimal / 12
    return roundMoney(Number(deuda.saldo || 0) * tasaMensual)
  }, [])

  const distribuirPago = useCallback((montoPago, deuda) => {
    if (!montoPago || montoPago <= 0) return { principal: 0, interes: 0 }
    const saldoActual = Number(deuda.saldo || 0)
    const montoNum = Number(montoPago)
    if (montoNum >= saldoActual) {
      return { interes: 0, principal: roundMoney(saldoActual) }
    }
    const interesMensual = calcularInteresMensual(deuda)
    if (montoNum <= interesMensual) {
      return { interes: roundMoney(montoNum), principal: 0 }
    } else {
      return { interes: interesMensual, principal: roundMoney(montoNum - interesMensual) }
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
        setTimeout(() => { montoInputRef.current?.querySelector('input')?.focus() }, 300)
      }, 500)
    }
  }, [deudaPreseleccionada])

  const handleSeleccionarTarjeta = (cuentaTarjeta) => {
    setFormData({ ...formData, tarjeta: cuentaTarjeta })
  }

  useEffect(() => {
    if (formData.metodo === 'Débito') {
      setTimeout(() => {
        cuentasSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 300)
    }
  }, [formData.metodo])

  const handleSubmit = async () => {
    if (inFlightRef.current) return

    try {
      inFlightRef.current = true
      setIsLoading(true)
      const deudaSeleccionada = deudas.find(d => d.cuenta === formData.tarjeta)
      if (!deudaSeleccionada) { toast.error('Debes seleccionar una tarjeta válida'); return }
      if (!formData.monto || Number(formData.monto) <= 0) { toast.error('Debes ingresar un monto válido'); return }
      if (!formData.cuenta_id) {
        toast.warning('Debes seleccionar la cuenta desde donde saldrá el pago')
        return
      }
      if (formData.cuenta_id) {
        const cuenta = cuentas.find(c => c.id === formData.cuenta_id)
        if (cuenta && Number(cuenta.balance) < Number(formData.monto)) {
          toast.error(`Fondos insuficientes. Saldo: $${Number(cuenta.balance).toFixed(2)} | Monto: $${Number(formData.monto).toFixed(2)}`)
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
        notas: formData.notas,
        idempotency_key: idemKeyRef.current
      })
      onClose()
    } catch (e) {
      console.error('Error registrando pago:', e)
      toast.error('Error al registrar el pago')
    } finally {
      inFlightRef.current = false
      setIsLoading(false)
    }
  }

  const deudaActual = deudas.find(d => d.cuenta === formData.tarjeta)
  const interesMensualCalculado = deudaActual ? calcularInteresMensual(deudaActual) : 0
  const principalNumber = Number(formData.principal || 0)
  const interesNumber = Number(formData.interes || 0)

  const inputClass = "w-full bg-gray-800 text-white px-4 py-3 rounded-xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all appearance-none"

  return (
    <>
      {/* Estilos para ocultar scrollbar y animación */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        input[type=number]::-webkit-inner-spin-button, 
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
        @keyframes modalPop {
          0% { transform: translate(-50%, -45%) scale(0.95); opacity: 0; }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        }
        .modal-animate { animation: modalPop 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>

      {/* OVERLAY DE FONDO */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100]"
        onClick={onClose}
      />

      {/* MODAL CENTRADO (Método Transform para asegurar centrado exacto) */}
      <div
        className="fixed top-1/2 left-1/2 w-[92%] md:w-[500px] lg:w-[550px]
                   bg-gray-900 rounded-3xl shadow-2xl border border-white/10
                   flex flex-col overflow-hidden z-[101] modal-animate"
        style={{ maxHeight: '90vh' }} // Se adapta al 90% de la altura
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* HEADER */}
        <div className="flex-shrink-0 px-6 py-5 border-b border-white/5 bg-gradient-to-r from-purple-950/30 to-gray-900 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-600 rounded-xl shadow-lg shadow-purple-600/20">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white leading-tight">Pago de Tarjeta</h3>
              <p className="text-xs text-gray-400">Registra tu pago</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CONTENIDO SCROLLEABLE INTERNO */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar pb-24">
          
          {/* 1. SELECTOR DE TARJETA */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 block">
              1. Selecciona Tarjeta
            </label>
            <div className="space-y-3">
              {deudas.map((deuda) => {
                const isSelected = formData.tarjeta === deuda.cuenta
                const pagoMinimo = deuda.pago_minimo || 0
                return (
                  <button
                    key={deuda.id}
                    type="button"
                    onClick={() => handleSeleccionarTarjeta(deuda.cuenta)}
                    disabled={isLoading}
                    className={`w-full p-4 rounded-2xl border-2 transition-all text-left active:scale-[0.99] disabled:opacity-50 ${
                      isSelected
                        ? 'border-purple-500 bg-purple-500/10 shadow-[0_0_20px_-5px_rgba(168,85,247,0.3)]'
                        : 'border-white/5 bg-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`font-bold text-sm ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                        {deuda.cuenta}
                      </span>
                      <span className={`font-bold ${isSelected ? 'text-red-400' : 'text-red-500/80'}`}>
                        ${deuda.saldo?.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>APR {((deuda.apr || 0) * 100).toFixed(1)}% • Mín: ${pagoMinimo.toFixed(2)}</span>
                      {isSelected && <span className="text-purple-400 font-semibold">Seleccionada</span>}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* INFO INTERESES */}
          {deudaActual && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-center gap-3">
              <Info className="w-5 h-5 text-blue-400 flex-shrink-0" />
              <div>
                <p className="text-xs text-blue-200/60 font-semibold uppercase">Interés mensual</p>
                <p className="text-lg font-bold text-blue-400">${interesMensualCalculado.toFixed(2)}</p>
              </div>
            </div>
          )}

          {/* 2. MONTO + FECHA */}
          <div ref={montoInputRef} className="grid grid-cols-5 gap-3">
            <div className="col-span-3">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                2. Monto
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">$</span>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  value={formData.monto}
                  onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                  disabled={isLoading}
                  className="w-full pl-9 pr-4 py-3 bg-gray-800 text-white text-lg font-bold rounded-xl border border-white/10 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none placeholder-gray-600"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Fecha
              </label>
              <input
                type="date"
                value={formData.fecha}
                onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                disabled={isLoading}
                className={inputClass + " text-sm"}
              />
            </div>
          </div>

          {/* DISTRIBUCIÓN */}
          {formData.monto && Number(formData.monto) > 0 && (
            <div className="bg-purple-500/5 border border-purple-500/10 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3 text-purple-400">
                <Calculator className="w-4 h-4" />
                <span className="text-sm font-bold uppercase">Distribución</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">A Intereses</span>
                  <span className="font-semibold text-red-400">${interesNumber.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">A Principal</span>
                  <span className="font-semibold text-emerald-400">${principalNumber.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-white/10 text-base font-bold text-white">
                  <span>Nuevo Saldo</span>
                  <span>${((deudaActual?.saldo || 0) - principalNumber).toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* 3. MÉTODO */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              3. Método
            </label>
            <select
              value={formData.metodo}
              onChange={(e) => setFormData({ ...formData, metodo: e.target.value })}
              disabled={isLoading}
              className={inputClass}
            >
              {METODOS_PAGO_COMPLETO.map((metodo) => (
                <option key={metodo} value={metodo}>
                  {metodo === 'Débito' ? '💳 Débito (Cuenta Bancaria)' : metodo}
                </option>
              ))}
            </select>
          </div>

          {/* 4. CUENTAS */}
          <div ref={cuentasSectionRef} className="bg-gray-800/50 rounded-xl p-4 border border-white/5">
              <div className="flex items-center gap-2 mb-3 text-cyan-400">
                <Wallet className="w-4 h-4" />
                <span className="text-sm font-bold uppercase">Cuenta Origen</span>
              </div>
              <div className="space-y-2">
                {cuentas.map((cuenta) => {
                  const isSelected = formData.cuenta_id === cuenta.id
                  return (
                    <button
                      key={cuenta.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, cuenta_id: cuenta.id })}
                      disabled={isLoading}
                      className={`w-full p-3 rounded-lg border text-left transition-all ${
                        isSelected 
                          ? 'border-cyan-500 bg-cyan-500/10' 
                          : 'border-white/5 hover:border-white/20 bg-white/5'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Building2 className={`w-4 h-4 ${isSelected ? 'text-cyan-400' : 'text-gray-500'}`} />
                          <span className={`text-sm font-semibold ${isSelected ? 'text-white' : 'text-gray-300'}`}>{cuenta.nombre}</span>
                        </div>
                        <span className="text-sm font-bold text-gray-200">${Number(cuenta.balance).toFixed(2)}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

          {/* NOTAS */}
          <div>
             <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Notas</label>
             <input value={formData.notas} onChange={(e) => setFormData({ ...formData, notas: e.target.value })} className={inputClass} placeholder="Opcional..." disabled={isLoading} />
          </div>

          {/* Espaciador para que el scroll no tape el footer fijo */}
          <div className="h-6"></div>
        </div>

        {/* FOOTER FIJO EN LA PARTE INFERIOR DEL MODAL */}
        <div className="absolute bottom-0 left-0 right-0 p-5 border-t border-white/5 bg-gray-900/95 backdrop-blur-md z-10">
          <div className="grid grid-cols-2 gap-3">
             <button
              onClick={onClose}
              disabled={isLoading}
              className="w-full py-3.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl font-bold transition-colors border border-white/5"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading || !formData.monto}
              className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-purple-600/30 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Pagar'}
            </button>
          </div>
        </div>

      </div>
    </>
  )
}

export default ModalPagoTarjeta
