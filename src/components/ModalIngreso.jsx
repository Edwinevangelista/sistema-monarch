// src/components/ModalIngreso.jsx — v2
// Rendered inside ModalWrapper (no own overlay needed)
// Compact frequency pills, prominent amount, clean dark theme

import React, { useState, useEffect } from 'react'
import { X, Loader2, CheckCircle, AlertCircle, Repeat, Info } from 'lucide-react'
import { useCuentasBancarias } from '../hooks/useCuentasBancarias'
import { toast } from 'sonner'

const FRECUENCIAS = [
  { value: 'Único',     icon: '📅' },
  { value: 'Semanal',   icon: '📆' },
  { value: 'Quincenal', icon: '🗓️' },
  { value: 'Mensual',   icon: '📊' },
]

export default function ModalIngreso({ onClose, onSave, ingresoInicial = null }) {
  const { cuentas } = useCuentasBancarias()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showFreqInfo, setShowFreqInfo] = useState(false)

  const [formData, setFormData] = useState({
    fecha:      new Date().toISOString().split('T')[0],
    fuente:     '',
    descripcion:'',
    monto:      '',
    cuenta_id:  '',
    frecuencia: 'Único',
  })

  const set = (k, v) => setFormData(p => ({ ...p, [k]: v }))

  useEffect(() => {
    if (ingresoInicial) {
      setFormData({
        fecha:       ingresoInicial.fecha || new Date().toISOString().split('T')[0],
        fuente:      ingresoInicial.fuente || '',
        descripcion: ingresoInicial.descripcion || '',
        monto:       ingresoInicial.monto?.toString() || '',
        cuenta_id:   ingresoInicial.cuenta_id || '',
        frecuencia:  ingresoInicial.frecuencia || 'Único',
      })
    }
  }, [ingresoInicial])

  const handleSubmit = async () => {
    if (!formData.fuente || !formData.monto) {
      setError('Completa fuente y monto')
      return
    }
    setIsLoading(true)
    setError('')
    try {
      const dataToSave = {
        fecha:       formData.fecha,
        fuente:      formData.fuente,
        descripcion: formData.descripcion,
        monto:       parseFloat(formData.monto),
        cuenta_id:   formData.cuenta_id || null,
        frecuencia:  formData.frecuencia,
      }
      if (ingresoInicial?.id) dataToSave.id = ingresoInicial.id

      await onSave(dataToSave)

      if (formData.frecuencia !== 'Único') {
        toast.success(`Ingreso ${formData.frecuencia.toLowerCase()} guardado — se proyectará en tu balance`)
      } else {
        toast.success('Ingreso registrado ✓')
      }
      onClose()
    } catch (err) {
      console.error('Error guardando ingreso:', err)
      setError('Error al guardar el ingreso. Intenta de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  // Proyección mensual preview
  const monto = parseFloat(formData.monto) || 0
  const proyeccion =
    formData.frecuencia === 'Semanal'   ? monto * 4 :
    formData.frecuencia === 'Quincenal' ? monto * 2 :
    formData.frecuencia === 'Mensual'   ? monto      : null

  const inputCls = 'w-full bg-white/[0.05] text-white px-4 py-3 rounded-2xl border border-white/[0.08] focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/30 placeholder-gray-600 transition-colors'

  return (
    <div className="flex flex-col">

      {/* ── HEADER ── */}
      <div className="px-5 pt-3 pb-4 flex items-center justify-between">
        <div>
          <h2 className="text-[17px] font-bold text-white leading-tight">
            {ingresoInicial ? 'Editar ingreso' : 'Nuevo ingreso'}
          </h2>
          {ingresoInicial && (
            <p className="text-xs text-gray-500 mt-0.5">{ingresoInicial.fuente}</p>
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
            value={formData.monto}
            onChange={e => set('monto', e.target.value)}
            disabled={isLoading}
            autoFocus
            className="flex-1 bg-transparent font-bold text-white focus:outline-none placeholder-gray-700"
            style={{ fontSize: '36px' }}
          />
        </div>
        {/* Proyección inline */}
        {proyeccion && (
          <p className="mt-2 text-xs text-emerald-400 font-medium">
            ≈ ${proyeccion.toLocaleString()} / mes
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

        {/* FUENTE */}
        <div>
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-2">
            Fuente *
          </p>
          <input
            type="text"
            placeholder="Ej: Salario, Freelance, Nómina..."
            value={formData.fuente}
            onChange={e => set('fuente', e.target.value)}
            disabled={isLoading}
            className={inputCls}
            style={{ fontSize: '16px' }}
          />
        </div>

        {/* FRECUENCIA — pill row */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest">
              Frecuencia
            </p>
            <button
              type="button"
              onClick={() => setShowFreqInfo(v => !v)}
              className="text-gray-600 hover:text-gray-400 transition-colors"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          </div>
          {showFreqInfo && (
            <div className="mb-3 px-3 py-2.5 bg-indigo-500/8 border border-indigo-500/20 rounded-xl">
              <p className="text-[11px] text-indigo-300 leading-relaxed">
                <Repeat className="w-3 h-3 inline mr-1" />
                Si es recurrente, se proyectará en tu balance mensual automáticamente.
              </p>
            </div>
          )}
          <div className="flex gap-2">
            {FRECUENCIAS.map(f => (
              <button
                key={f.value}
                onClick={() => set('frecuencia', f.value)}
                disabled={isLoading}
                className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl border text-[11px] font-semibold transition-all touch-manipulation ${
                  formData.frecuencia === f.value
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                    : 'bg-white/[0.04] border-white/[0.07] text-gray-500 hover:text-gray-300'
                }`}
              >
                <span className="text-base leading-none">{f.icon}</span>
                <span>{f.value}</span>
              </button>
            ))}
          </div>
        </div>

        {/* CUENTA BANCARIA */}
        <div>
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-2">
            Cuenta destino
          </p>
          <select
            value={formData.cuenta_id}
            onChange={e => set('cuenta_id', e.target.value)}
            disabled={isLoading}
            className={inputCls}
            style={{ fontSize: '16px' }}
          >
            <option value="">Sin asignar</option>
            {cuentas.map(c => (
              <option key={c.id} value={c.id}>
                {c.nombre} (${Number(c.balance).toFixed(2)})
              </option>
            ))}
          </select>
        </div>

        {/* FECHA */}
        <div>
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-2">
            Fecha
          </p>
          <input
            type="date"
            value={formData.fecha}
            onChange={e => set('fecha', e.target.value)}
            disabled={isLoading}
            className={inputCls}
            style={{ fontSize: '16px' }}
          />
        </div>

        {/* DESCRIPCIÓN */}
        <div>
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-2">
            Notas (opcional)
          </p>
          <textarea
            placeholder="Detalles adicionales..."
            value={formData.descripcion}
            onChange={e => set('descripcion', e.target.value)}
            rows={2}
            disabled={isLoading}
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
            disabled={isLoading}
            className="flex-1 py-3.5 bg-white/[0.06] hover:bg-white/[0.10] text-gray-300 rounded-2xl font-semibold transition-all touch-manipulation disabled:opacity-50 text-sm"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-[2] py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-semibold transition-all touch-manipulation disabled:opacity-50 flex items-center justify-center gap-2 text-sm shadow-lg shadow-emerald-900/30"
          >
            {isLoading
              ? <><Loader2 className="w-4 h-4 animate-spin" />Guardando...</>
              : <><CheckCircle className="w-4 h-4" />{ingresoInicial ? 'Actualizar' : 'Guardar ingreso'}</>
            }
          </button>
        </div>
      </div>

    </div>
  )
}
