import React, { useState, useEffect } from 'react'
import { CreditCard, X, ChevronLeft, Loader2, DollarSign, Percent, Calendar, Shield } from 'lucide-react'
import { toast } from 'sonner'
import { calcularPagoMinimo } from '../utils/tarjetasCalculos'

const ModalAgregarDeuda = ({ onClose, onSave, deudaInicial = null }) => {
  const esEdicion = Boolean(deudaInicial)
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    id: null,
    cuenta: '',
    tipo: 'Tarjeta',
    saldo: '',
    apr: '',
    limite_credito: '',
    dias_gracia: '21',
    pago_minimo: '',
    pago_real: '',
    vence: '',
    estado: 'Activa'
  })

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

  useEffect(() => {
    if (deudaInicial) {
      setFormData({
        id: deudaInicial.id,
        cuenta: deudaInicial.cuenta || '',
        tipo: deudaInicial.tipo || 'Tarjeta',
        saldo: deudaInicial.saldo ?? '',
        apr: deudaInicial.apr ? (deudaInicial.apr * 100).toString() : '',
        limite_credito: deudaInicial.limite_credito ?? '',
        dias_gracia: deudaInicial.dias_gracia ?? '21',
        pago_minimo: deudaInicial.pago_minimo ?? '',
        pago_real: deudaInicial.pago_real ?? '',
        vence: deudaInicial.vence || '',
        estado: deudaInicial.estado || 'Activa'
      })
    } else {
      setFormData({
        id: null,
        cuenta: '',
        tipo: 'Tarjeta',
        saldo: '',
        apr: '',
        limite_credito: '',
        dias_gracia: '21',
        pago_minimo: '',
        pago_real: '',
        vence: '',
        estado: 'Activa'
      })
    }
  }, [deudaInicial])

  const handleSubmit = async () => {
    if (!formData.cuenta || formData.saldo === '') {
      toast.error('Por favor completa el nombre y el saldo.')
      return
    }
    setLoading(true)
    try {
      const saldoNum = parseFloat(formData.saldo) || 0
      const aprNum = formData.apr ? parseFloat(formData.apr) / 100 : 0
      // Si el usuario deja pago_minimo vacío, calcularlo automáticamente
      const pagoMinAuto = calcularPagoMinimo(saldoNum, aprNum)
      const payload = {
        cuenta: formData.cuenta,
        tipo: formData.tipo,
        saldo: saldoNum,
        apr: aprNum,
        limite_credito: formData.limite_credito ? parseFloat(formData.limite_credito) : null,
        dias_gracia: parseInt(formData.dias_gracia, 10) || 21,
        pago_minimo: parseFloat(formData.pago_minimo) || pagoMinAuto,
        pago_real: parseFloat(formData.pago_real) || 0,
        vence: formData.vence || null,
        estado: formData.estado
      }
      if (esEdicion && deudaInicial) {
        payload.id = deudaInicial.id
      } else {
        delete payload.id
      }
      await onSave(payload)
      onClose()
    } catch (e) {
      console.error('Error al guardar deuda:', e)
      toast.error('Ocurrió un error al guardar la deuda')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full bg-gray-800 text-white px-4 py-3 rounded-xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 placeholder-gray-600 transition-all"
  const selectClass = "w-full bg-gray-800 text-white px-4 py-3 rounded-xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all"
  const labelClass = "block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5"

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
          className="w-full md:w-[95%] md:max-w-md
                     bg-gray-900 rounded-t-3xl md:rounded-2xl shadow-2xl
                     border-t md:border border-white/10
                     flex flex-col overflow-hidden"
          style={{ maxHeight: 'calc(100dvh - env(safe-area-inset-top, 0px) - 12px)' }}
          onClick={(e) => e.stopPropagation()}
        >

          {/* HEADER */}
          <div className="flex-shrink-0 px-5 pt-5 pb-4 border-b border-white/10 bg-gradient-to-r from-red-950/40 to-gray-900">
            {/* Pill indicator mobile */}
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4 md:hidden" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="p-2 -ml-2 text-gray-400 hover:text-white rounded-xl transition-colors md:hidden"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <div className="p-2.5 bg-red-600 rounded-xl shadow-lg shadow-red-600/30">
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {esEdicion ? 'Editar Deuda' : 'Agregar Tarjeta / Deuda'}
                  </h3>
                  <p className="text-xs text-gray-400">
                    {esEdicion ? 'Modifica los datos de tu tarjeta' : 'Registra una nueva deuda o tarjeta'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="hidden md:flex p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* FORM SCROLLEABLE */}
          <div
            className="flex-1 overflow-y-auto overscroll-contain p-5 space-y-4"
            style={{
              WebkitOverflowScrolling: 'touch',
              paddingBottom: 'calc(env(safe-area-inset-bottom, 16px) + 80px)'
            }}
          >
            {/* Nombre */}
            <div>
              <label className={labelClass}>Nombre de la Tarjeta / Cuenta *</label>
              <input
                type="text"
                placeholder="Ej: Visa Platinum, Crédito BBVA..."
                value={formData.cuenta}
                onChange={(e) => setFormData({ ...formData, cuenta: e.target.value })}
                className={inputClass}
              />
            </div>

            {/* Tipo */}
            <div>
              <label className={labelClass}>Tipo de Deuda</label>
              <select
                value={formData.tipo}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                className={selectClass}
              >
                <option value="Tarjeta">💳 Tarjeta de Crédito</option>
                <option value="Préstamo">🏦 Préstamo Personal</option>
                <option value="Crédito Personal">💰 Crédito Personal</option>
                <option value="Hipoteca">🏠 Hipoteca</option>
                <option value="Auto">🚗 Auto</option>
              </select>
            </div>

            {/* Saldo y APR */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>
                  <DollarSign className="w-3 h-3 inline mr-1" />
                  Saldo Actual *
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={formData.saldo}
                  onChange={(e) => setFormData({ ...formData, saldo: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>
                  <Percent className="w-3 h-3 inline mr-1" />
                  APR Anual
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="Ej: 36.5"
                  value={formData.apr}
                  onChange={(e) => setFormData({ ...formData, apr: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Limite de credito y dias de gracia — solo para tarjetas */}
            {formData.tipo === 'Tarjeta' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>
                    <Shield className="w-3 h-3 inline mr-1" />
                    Limite de Credito
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    placeholder="Ej: 10000"
                    value={formData.limite_credito}
                    onChange={(e) => setFormData({ ...formData, limite_credito: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Dias de Gracia</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder="21"
                    value={formData.dias_gracia}
                    onChange={(e) => setFormData({ ...formData, dias_gracia: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>
            )}

            {/* Pago Minimo y Vencimiento */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>
                  Pago Minimo
                  {formData.saldo && formData.apr && !formData.pago_minimo && (
                    <span className="text-blue-400 ml-1 normal-case font-normal">(auto)</span>
                  )}
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder={
                    formData.saldo
                      ? `Auto: $${calcularPagoMinimo(parseFloat(formData.saldo) || 0, parseFloat(formData.apr) || 0).toFixed(0)}`
                      : '0.00'
                  }
                  value={formData.pago_minimo}
                  onChange={(e) => setFormData({ ...formData, pago_minimo: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>
                  <Calendar className="w-3 h-3 inline mr-1" />
                  Fecha de Corte
                </label>
                <input
                  type="date"
                  value={formData.vence}
                  onChange={(e) => setFormData({ ...formData, vence: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Estado */}
            <div>
              <label className={labelClass}>Estado</label>
              <select
                value={formData.estado}
                onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                className={selectClass}
              >
                <option value="Activa">🟢 Activa</option>
                <option value="Pagada">✅ Pagada</option>
                <option value="Cerrada">🔴 Cerrada</option>
              </select>
            </div>

            {/* Preview info calculado automaticamente */}
            {formData.saldo && (
              <div className="bg-gray-800/80 border border-white/8 rounded-xl p-3 space-y-2">
                {formData.apr && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">Interes mensual</span>
                    <span className="text-sm font-bold text-red-400">
                      ${(parseFloat(formData.saldo) * (parseFloat(formData.apr) / 100) / 12).toFixed(2)} / mes
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">Pago minimo calculado</span>
                  <span className="text-sm font-bold text-blue-400">
                    ${calcularPagoMinimo(parseFloat(formData.saldo) || 0, parseFloat(formData.apr) || 0).toFixed(2)}
                  </span>
                </div>
                {formData.limite_credito && parseFloat(formData.limite_credito) > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">Uso de credito</span>
                    <span className={`text-sm font-bold ${
                      (parseFloat(formData.saldo) / parseFloat(formData.limite_credito)) * 100 < 30
                        ? 'text-emerald-400'
                        : (parseFloat(formData.saldo) / parseFloat(formData.limite_credito)) * 100 < 70
                        ? 'text-yellow-400'
                        : 'text-red-400'
                    }`}>
                      {Math.round((parseFloat(formData.saldo) / parseFloat(formData.limite_credito)) * 100)}%
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div className="flex-shrink-0 p-4 border-t border-white/10 bg-gray-900"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
          >
            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={loading}
                className="flex-1 py-3.5 bg-gray-800 hover:bg-gray-700 active:scale-[0.98] text-white rounded-xl font-semibold transition-all touch-manipulation disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 py-3.5 bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white rounded-xl font-semibold transition-all touch-manipulation disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  esEdicion ? 'Guardar Cambios' : '+ Agregar Deuda'
                )}
              </button>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}

export default ModalAgregarDeuda
