// src/components/ModalSuscripcion.jsx — v2
// Rendered inside ModalWrapper (no own overlay needed)
// Category chips, ciclo pills, modern dark theme

import React, { useState, useEffect } from 'react'
import { X, CreditCard, AlertCircle, Loader2, CheckCircle } from 'lucide-react'
import { useCuentasBancarias } from '../hooks/useCuentasBancarias'
import { toast } from 'sonner'

const CATEGORIAS = [
  { e: '📦', l: 'Suscripciones',  v: '📦 Suscripciones' },
  { e: '🎬', l: 'Entretenim.',    v: '🎬 Entretenimiento' },
  { e: '💊', l: 'Salud/Fit.',     v: '💊 Salud / Fitness' },
  { e: '📚', l: 'Educación',      v: '📚 Educación' },
  { e: '💻', l: 'Tecnología',     v: '💻 Tecnología' },
  { e: '🏠', l: 'Hogar',          v: '🏠 Servicios' },
]

const CICLOS = [
  { value: 'Mensual', icon: '📅' },
  { value: 'Anual',   icon: '📆' },
  { value: 'Semanal', icon: '🗓️' },
]

const defaultData = {
  servicio:     '',
  categoria:    '📦 Suscripciones',
  costo:        '',
  ciclo:        'Mensual',
  proximo_pago: new Date().toISOString().split('T')[0],
  descripcion:  '',
  cuenta_id:    '',
  autopago:     false,
  estado:       'Activo',
}

export default function ModalSuscripcion({ onClose, onSave, suscripcionInicial = null }) {
  const { cuentas } = useCuentasBancarias()
  const [formData, setFormData] = useState(defaultData)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setFormData(p => ({ ...p, [k]: v }))

  useEffect(() => {
    if (suscripcionInicial) {
      setFormData({
        servicio:     suscripcionInicial.servicio || '',
        categoria:    suscripcionInicial.categoria || '📦 Suscripciones',
        costo:        String(suscripcionInicial.costo || ''),
        ciclo:        suscripcionInicial.ciclo || 'Mensual',
        proximo_pago: suscripcionInicial.proximo_pago || new Date().toISOString().split('T')[0],
        descripcion:  suscripcionInicial.descripcion || '',
        cuenta_id:    suscripcionInicial.cuenta_id || '',
        autopago:     !!suscripcionInicial.autopago,
        estado:       suscripcionInicial.estado || 'Activo',
        id:           suscripcionInicial.id,
      })
    } else {
      setFormData({ ...defaultData, proximo_pago: new Date().toISOString().split('T')[0] })
    }
  }, [suscripcionInicial])

  const handleSubmit = async () => {
    if (!formData.servicio || !formData.costo || !formData.ciclo) {
      setError('Completa servicio, monto y ciclo')
      return
    }
    setLoading(true)
    setError('')
    try {
      const dataAGuardar = {
        servicio:     formData.servicio,
        categoria:    formData.categoria,
        costo:        parseFloat(formData.costo),
        ciclo:        formData.ciclo,
        proximo_pago: formData.proximo_pago,
        descripcion:  formData.descripcion,
        cuenta_id:    formData.cuenta_id || null,
        autopago:     formData.autopago,
        estado:       formData.estado,
      }
      if (suscripcionInicial) dataAGuardar.id = suscripcionInicial.id
      await onSave(dataAGuardar)
      toast.success(suscripcionInicial ? 'Suscripción actualizada ✓' : 'Suscripción creada ✓')
      onClose()
    } catch (err) {
      console.error('Error al guardar suscripción:', err)
      setError('Ocurrió un error al guardar.')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full bg-white/[0.05] text-white px-4 py-3 rounded-2xl border border-white/[0.08] focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/30 placeholder-gray-600 transition-colors'

  // Costo mensual equivalente preview
  const costo = parseFloat(formData.costo) || 0
  const costoMensual =
    formData.ciclo === 'Anual'   ? costo / 12 :
    formData.ciclo === 'Semanal' ? costo * 4  : costo

  return (
    <div className="flex flex-col">

      {/* ── HEADER ── */}
      <div className="px-5 pt-3 pb-4 flex items-center justify-between">
        <div>
          <h2 className="text-[17px] font-bold text-white leading-tight">
            {suscripcionInicial ? 'Editar suscripción' : 'Nueva suscripción'}
          </h2>
          {suscripcionInicial && (
            <p className="text-xs text-gray-500 mt-0.5">{suscripcionInicial.servicio}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="md:hidden p-2 bg-white/[0.06] hover:bg-white/[0.10] rounded-xl text-gray-400 hover:text-white transition-colors touch-manipulation"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* ── MONTO (prominente) ── */}
      <div className="px-5 py-5 border-y border-white/[0.06] bg-white/[0.015]">
        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-2">
          Monto *
        </p>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-light text-gray-500">$</span>
          <input
            type="number"
            inputMode="decimal"
            placeholder="0.00"
            value={formData.costo}
            onChange={e => set('costo', e.target.value)}
            disabled={loading}
            autoFocus
            className="flex-1 bg-transparent font-bold text-white focus:outline-none placeholder-gray-700"
            style={{ fontSize: '36px' }}
          />
        </div>
        {formData.ciclo !== 'Mensual' && costo > 0 && (
          <p className="mt-2 text-xs text-indigo-400 font-medium">
            ≈ ${costoMensual.toFixed(2)} / mes
          </p>
        )}
      </div>

      {/* ── FORM BODY ── */}
      <div className="px-5 py-5 space-y-5">

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-300 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* SERVICIO */}
        <div>
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-2">
            Servicio *
          </p>
          <input
            type="text"
            placeholder="Ej: Netflix, Spotify, iCloud..."
            value={formData.servicio}
            onChange={e => set('servicio', e.target.value)}
            disabled={loading}
            className={inputCls}
            style={{ fontSize: '16px' }}
          />
        </div>

        {/* CICLO — pills */}
        <div>
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-2">
            Ciclo de pago *
          </p>
          <div className="flex gap-2">
            {CICLOS.map(c => (
              <button
                key={c.value}
                onClick={() => set('ciclo', c.value)}
                disabled={loading}
                className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl border text-[11px] font-semibold transition-all touch-manipulation ${
                  formData.ciclo === c.value
                    ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300'
                    : 'bg-white/[0.04] border-white/[0.07] text-gray-500 hover:text-gray-300'
                }`}
              >
                <span className="text-base leading-none">{c.icon}</span>
                <span>{c.value}</span>
              </button>
            ))}
          </div>
        </div>

        {/* CATEGORÍA — chips */}
        <div>
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-2">
            Categoría
          </p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIAS.map(c => (
              <button
                key={c.v}
                onClick={() => set('categoria', c.v)}
                disabled={loading}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all touch-manipulation active:scale-95 ${
                  formData.categoria === c.v
                    ? 'bg-indigo-500/20 border-indigo-500/35 text-indigo-200'
                    : 'bg-white/[0.04] border-white/[0.07] text-gray-400 hover:text-gray-200 hover:bg-white/[0.08]'
                }`}
              >
                <span>{c.e}</span>
                <span>{c.l}</span>
              </button>
            ))}
          </div>
        </div>

        {/* PRÓXIMO PAGO */}
        <div>
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-2">
            Próximo pago
          </p>
          <input
            type="date"
            value={formData.proximo_pago}
            onChange={e => set('proximo_pago', e.target.value)}
            disabled={loading}
            className={inputCls}
            style={{ fontSize: '16px' }}
          />
        </div>

        {/* CUENTA + AUTOPAGO */}
        <div className="space-y-3">
          <div>
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-2">
              Cuenta de cobro
            </p>
            <select
              value={formData.cuenta_id || ''}
              onChange={e => set('cuenta_id', e.target.value)}
              disabled={loading}
              className={inputCls}
              style={{ fontSize: '16px' }}
            >
              <option value="">Seleccionar cuenta</option>
              {cuentas.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nombre} (${Number(c.balance).toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          {/* Autopago toggle */}
          <div className="flex items-center justify-between px-4 py-3 bg-white/[0.03] rounded-2xl border border-white/[0.07]">
            <div className="flex items-center gap-3">
              <CreditCard className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-white">Autopago</p>
                <p className="text-xs text-gray-500">
                  {formData.autopago ? 'Se cobra automáticamente' : 'Pago manual'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => set('autopago', !formData.autopago)}
              disabled={loading}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                formData.autopago ? 'bg-emerald-600' : 'bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${
                  formData.autopago ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          {formData.autopago && !formData.cuenta_id && (
            <p className="text-[11px] text-amber-400 flex items-center gap-1 px-1">
              <AlertCircle className="w-3 h-3" />
              Selecciona una cuenta para activar el cobro automático
            </p>
          )}
        </div>

        {/* NOTAS */}
        <div>
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-2">
            Notas (opcional)
          </p>
          <textarea
            placeholder="Detalles opcionales..."
            value={formData.descripcion}
            onChange={e => set('descripcion', e.target.value)}
            rows={2}
            disabled={loading}
            className={`${inputCls} resize-none`}
            style={{ fontSize: '16px' }}
          />
        </div>

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
            className="flex-1 py-3.5 bg-white/[0.06] hover:bg-white/[0.10] text-gray-300 rounded-2xl font-semibold transition-all touch-manipulation disabled:opacity-50 text-sm"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-[2] py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-semibold transition-all touch-manipulation disabled:opacity-50 flex items-center justify-center gap-2 text-sm shadow-lg shadow-indigo-900/30"
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" />Guardando...</>
              : <><CheckCircle className="w-4 h-4" />{suscripcionInicial ? 'Actualizar' : 'Crear suscripción'}</>
            }
          </button>
        </div>
      </div>

    </div>
  )
}
