// src/components/ModalAgregarDeuda.jsx — v2
// Rendered inside ModalWrapper (no own overlay/scroll-lock needed)
// Live payment preview, modern dark theme

import React, { useState, useEffect } from 'react'
import { X, Loader2, DollarSign, Percent, Calendar, Shield } from 'lucide-react'
import { toast } from 'sonner'
import { calcularPagoMinimo } from '../utils/tarjetasCalculos'

const TIPOS = [
  { value: 'Tarjeta',           icon: '💳' },
  { value: 'Préstamo',          icon: '🏦' },
  { value: 'Crédito Personal',  icon: '💰' },
  { value: 'Hipoteca',          icon: '🏠' },
  { value: 'Auto',              icon: '🚗' },
]

export default function ModalAgregarDeuda({ onClose, onSave, deudaInicial = null }) {
  const esEdicion = Boolean(deudaInicial)
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    id:             null,
    cuenta:         '',
    tipo:           'Tarjeta',
    saldo:          '',
    apr:            '',
    limite_credito: '',
    dias_gracia:    '21',
    pago_minimo:    '',
    pago_real:      '',
    vence:          '',
    estado:         'Activa',
  })

  const set = (k, v) => setFormData(p => ({ ...p, [k]: v }))

  useEffect(() => {
    if (deudaInicial) {
      setFormData({
        id:             deudaInicial.id,
        cuenta:         deudaInicial.cuenta || '',
        tipo:           deudaInicial.tipo || 'Tarjeta',
        saldo:          deudaInicial.saldo ?? '',
        apr:            deudaInicial.apr ? (deudaInicial.apr * 100).toString() : '',
        limite_credito: deudaInicial.limite_credito ?? '',
        dias_gracia:    deudaInicial.dias_gracia ?? '21',
        pago_minimo:    deudaInicial.pago_minimo ?? '',
        pago_real:      deudaInicial.pago_real ?? '',
        vence:          deudaInicial.vence || '',
        estado:         deudaInicial.estado || 'Activa',
      })
    } else {
      setFormData({
        id: null, cuenta: '', tipo: 'Tarjeta', saldo: '', apr: '',
        limite_credito: '', dias_gracia: '21', pago_minimo: '',
        pago_real: '', vence: '', estado: 'Activa',
      })
    }
  }, [deudaInicial])

  const handleSubmit = async () => {
    if (!formData.cuenta || formData.saldo === '') {
      toast.error('Completa el nombre y el saldo')
      return
    }
    setLoading(true)
    try {
      const saldoNum = parseFloat(formData.saldo) || 0
      const aprNum   = formData.apr ? parseFloat(formData.apr) / 100 : 0
      const pagoMinAuto = calcularPagoMinimo(saldoNum, aprNum)
      const payload = {
        cuenta:         formData.cuenta,
        tipo:           formData.tipo,
        saldo:          saldoNum,
        apr:            aprNum,
        limite_credito: formData.limite_credito ? parseFloat(formData.limite_credito) : null,
        dias_gracia:    parseInt(formData.dias_gracia, 10) || 21,
        pago_minimo:    parseFloat(formData.pago_minimo) || pagoMinAuto,
        pago_real:      parseFloat(formData.pago_real) || 0,
        vence:          formData.vence || null,
        estado:         formData.estado,
      }
      if (esEdicion && deudaInicial) payload.id = deudaInicial.id
      else delete payload.id

      await onSave(payload)
      onClose()
    } catch (e) {
      console.error('Error al guardar deuda:', e)
      toast.error('Ocurrió un error al guardar la deuda')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full bg-canvas-surface/[0.05] text-white px-4 py-3 rounded-2xl border border-white/[0.08] focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500/30 placeholder-gray-600 transition-colors'
  const selectCls = inputCls

  const saldoNum = parseFloat(formData.saldo) || 0
  const aprNum   = parseFloat(formData.apr) || 0
  const limiteNum = parseFloat(formData.limite_credito) || 0
  const interesMsg = saldoNum && aprNum ? (saldoNum * aprNum / 100 / 12).toFixed(2) : null
  const pagoMinCalc = calcularPagoMinimo(saldoNum, aprNum / 100)
  const usoCred = limiteNum > 0 ? Math.round((saldoNum / limiteNum) * 100) : null

  return (
    <div className="flex flex-col">

      {/* ── HEADER ── */}
      <div className="px-5 pt-3 pb-4 flex items-center justify-between">
        <div>
          <h2 className="text-[17px] font-bold text-white leading-tight">
            {esEdicion ? 'Editar tarjeta / deuda' : 'Nueva tarjeta / deuda'}
          </h2>
          {esEdicion && (
            <p className="text-xs text-ink-muted mt-0.5">{deudaInicial.cuenta}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="md:hidden p-2 bg-canvas-surface/[0.06] hover:bg-canvas-surface/[0.10] rounded-xl text-ink-faint hover:text-white transition-colors touch-manipulation"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* ── FORM BODY ── */}
      <div className="px-5 py-4 space-y-5">

        {/* NOMBRE */}
        <div>
          <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest mb-2">
            Nombre de la tarjeta / cuenta *
          </p>
          <input
            type="text"
            placeholder="Ej: Visa Platinum, Crédito BBVA..."
            value={formData.cuenta}
            onChange={e => set('cuenta', e.target.value)}
            disabled={loading}
            className={inputCls}
            style={{ fontSize: '16px' }}
          />
        </div>

        {/* TIPO — pills */}
        <div>
          <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest mb-2">
            Tipo de deuda
          </p>
          <div className="flex flex-wrap gap-2">
            {TIPOS.map(t => (
              <button
                key={t.value}
                onClick={() => set('tipo', t.value)}
                disabled={loading}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all touch-manipulation active:scale-95 ${
                  formData.tipo === t.value
                    ? 'bg-rose-500/20 border-rose-500/35 text-rose-200'
                    : 'bg-canvas-surface/[0.04] border-white/[0.07] text-ink-faint hover:text-gray-200 hover:bg-canvas-surface/[0.08]'
                }`}
              >
                <span>{t.icon}</span>
                <span>{t.value}</span>
              </button>
            ))}
          </div>
        </div>

        {/* SALDO y APR */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest mb-2">
              <DollarSign className="w-3 h-3 inline mr-0.5" />Saldo actual *
            </p>
            <input
              type="number"
              inputMode="decimal"
              placeholder="0.00"
              value={formData.saldo}
              onChange={e => set('saldo', e.target.value)}
              disabled={loading}
              className={inputCls}
              style={{ fontSize: '16px' }}
            />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest mb-2">
              <Percent className="w-3 h-3 inline mr-0.5" />APR anual
            </p>
            <input
              type="number"
              inputMode="decimal"
              placeholder="Ej: 36.5"
              value={formData.apr}
              onChange={e => set('apr', e.target.value)}
              disabled={loading}
              className={inputCls}
              style={{ fontSize: '16px' }}
            />
          </div>
        </div>

        {/* LÍMITE y DÍAS DE GRACIA — solo tarjeta */}
        {formData.tipo === 'Tarjeta' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest mb-2">
                <Shield className="w-3 h-3 inline mr-0.5" />Límite de crédito
              </p>
              <input
                type="number"
                inputMode="decimal"
                placeholder="Ej: 10000"
                value={formData.limite_credito}
                onChange={e => set('limite_credito', e.target.value)}
                disabled={loading}
                className={inputCls}
                style={{ fontSize: '16px' }}
              />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest mb-2">
                Días de gracia
              </p>
              <input
                type="number"
                inputMode="numeric"
                placeholder="21"
                value={formData.dias_gracia}
                onChange={e => set('dias_gracia', e.target.value)}
                disabled={loading}
                className={inputCls}
                style={{ fontSize: '16px' }}
              />
            </div>
          </div>
        )}

        {/* PAGO MÍNIMO y FECHA DE CORTE */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest mb-2">
              Pago mínimo
              {saldoNum && aprNum && !formData.pago_minimo
                ? <span className="ml-1 text-sky-400 normal-case font-normal">(auto)</span>
                : null
              }
            </p>
            <input
              type="number"
              inputMode="decimal"
              placeholder={saldoNum ? `Auto: $${pagoMinCalc.toFixed(0)}` : '0.00'}
              value={formData.pago_minimo}
              onChange={e => set('pago_minimo', e.target.value)}
              disabled={loading}
              className={inputCls}
              style={{ fontSize: '16px' }}
            />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest mb-2">
              <Calendar className="w-3 h-3 inline mr-0.5" />Fecha de corte
            </p>
            <input
              type="date"
              value={formData.vence}
              onChange={e => set('vence', e.target.value)}
              disabled={loading}
              className={inputCls}
              style={{ fontSize: '16px' }}
            />
          </div>
        </div>

        {/* ESTADO */}
        <div>
          <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest mb-2">
            Estado
          </p>
          <select
            value={formData.estado}
            onChange={e => set('estado', e.target.value)}
            disabled={loading}
            className={selectCls}
            style={{ fontSize: '16px' }}
          >
            <option value="Activa">🟢 Activa</option>
            <option value="Pagada">✅ Pagada</option>
            <option value="Cerrada">🔴 Cerrada</option>
          </select>
        </div>

        {/* PREVIEW CALCULADO */}
        {saldoNum > 0 && (
          <div className="bg-canvas-surface/[0.03] border border-white/[0.07] rounded-2xl p-4 space-y-2.5">
            <p className="text-[10px] font-semibold text-ink-muted uppercase tracking-widest mb-1">
              Cálculo automático
            </p>
            {interesMsg && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-ink-faint">Interés mensual</span>
                <span className="text-sm font-bold text-rose-400">${interesMsg} / mes</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-xs text-ink-faint">Pago mínimo calculado</span>
              <span className="text-sm font-bold text-sky-400">${pagoMinCalc.toFixed(2)}</span>
            </div>
            {usoCred !== null && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-ink-faint">Uso de crédito</span>
                <span className={`text-sm font-bold ${
                  usoCred < 30 ? 'text-emerald-400' : usoCred < 70 ? 'text-amber-400' : 'text-rose-400'
                }`}>
                  {usoCred}%
                </span>
              </div>
            )}
          </div>
        )}

      </div>

      {/* ── FOOTER ── */}
      <div
        className="sticky bottom-0 px-5 py-4 border-t border-white/[0.06] bg-gray-950/95 backdrop-blur-sm"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
      >
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-3.5 bg-canvas-surface/[0.06] hover:bg-canvas-surface/[0.10] text-gray-300 rounded-2xl font-semibold transition-all touch-manipulation disabled:opacity-50 text-sm"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-[2] py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-semibold transition-all touch-manipulation disabled:opacity-50 flex items-center justify-center gap-2 text-sm shadow-lg shadow-rose-900/30"
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" />Guardando...</>
              : esEdicion ? 'Guardar cambios' : '+ Agregar deuda'
            }
          </button>
        </div>
      </div>

    </div>
  )
}
