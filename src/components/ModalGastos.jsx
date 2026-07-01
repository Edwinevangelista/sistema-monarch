// src/components/ModalGastos.jsx — v2
// Rendered inside ModalWrapper (no own overlay/wrapper needed)
// Chip-based category selection, prominent amount input, clean dark theme

import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { X, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { useCuentasBancarias } from '../hooks/useCuentasBancarias'
import { useDeudas } from '../hooks/useDeudas'
import { toast } from 'sonner'

const CATS_VAR = [
  { e: '🍔', l: 'Comida' },
  { e: '🚗', l: 'Transporte' },
  { e: '🎬', l: 'Entretenim.' },
  { e: '👕', l: 'Ropa' },
  { e: '💊', l: 'Salud' },
  { e: '🏠', l: 'Hogar' },
  { e: '🎓', l: 'Educación' },
  { e: '🎁', l: 'Regalos' },
  { e: '📱', l: 'Teléfono' },
  { e: '⚡', l: 'Servicios' },
  { e: '📦', l: 'Otros' },
]

const CATS_FIJO = [
  { e: '🏠', l: 'Renta' },
  { e: '⚡', l: 'Luz' },
  { e: '💧', l: 'Agua' },
  { e: '📡', l: 'Internet' },
  { e: '📱', l: 'Teléfono' },
  { e: '🚗', l: 'Seguro Auto' },
  { e: '🏥', l: 'Seg. Médico' },
  { e: '🎓', l: 'Colegiatura' },
  { e: '💳', l: 'Préstamo' },
  { e: '📦', l: 'Otros' },
]

const catVal = ({ e, l }) => `${e} ${l}`

const createIdempotencyKey = () => {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID()
  return `expense-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export default function ModalGastos({
  onClose,
  onSaveVariable,
  onSaveFijo,
  gastoInicial = null,
  tipoInicial = 'variable',
}) {
  const { cuentas } = useCuentasBancarias()
  const { deudas } = useDeudas()
  const idempotencyKeyRef = useRef(createIdempotencyKey())

  const [tipoGasto, setTipoGasto] = useState(
    gastoInicial?.dia_venc != null ? 'fijo' : tipoInicial
  )
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    categoria: '',
    descripcion: '',
    monto: '',
    metodo: 'Efectivo',
    cuenta_id: '',
    deuda_id: '',
    nombre: '',
    dia_venc: '',
    estado: 'Pendiente',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setFormData(p => ({ ...p, [k]: v }))

  useEffect(() => {
    if (gastoInicial) {
      const esFijo = gastoInicial.dia_venc != null
      setTipoGasto(esFijo ? 'fijo' : 'variable')
      setFormData({
        fecha: gastoInicial.fecha || new Date().toISOString().split('T')[0],
        categoria: gastoInicial.categoria || '',
        descripcion: gastoInicial.descripcion || '',
        monto: gastoInicial.monto?.toString() || '',
        metodo: gastoInicial.metodo || 'Efectivo',
        cuenta_id: gastoInicial.cuenta_id || '',
        deuda_id: gastoInicial.deuda_id || '',
        nombre: gastoInicial.nombre || '',
        dia_venc: gastoInicial.dia_venc?.toString() || '',
        estado: gastoInicial.estado || 'Pendiente',
      })
    } else {
      setTipoGasto(tipoInicial)
      setFormData({
        fecha: new Date().toISOString().split('T')[0],
        categoria: '', descripcion: '', monto: '', metodo: 'Efectivo',
        cuenta_id: '', deuda_id: '', nombre: '', dia_venc: '', estado: 'Pendiente',
      })
    }
  }, [gastoInicial]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleAccountChange = (val) => {
    const esCuenta = cuentas.some(c => c.id === val)
    const esTarjeta = deudas.some(d => d.id === val)
    setFormData(p => ({
      ...p,
      cuenta_id: esCuenta ? val : '',
      deuda_id: esTarjeta ? val : '',
      metodo: (esCuenta || esTarjeta) ? 'Tarjeta' : 'Efectivo',
    }))
  }

  const handleSubmit = async () => {
    if (!formData.categoria || !formData.monto) {
      setError('Completa categoría y monto')
      return
    }
    if (tipoGasto === 'fijo' && !formData.nombre) {
      setError('Escribe el nombre del gasto fijo')
      return
    }
    if (tipoGasto === 'fijo' && !formData.dia_venc) {
      setError('Indica el día de vencimiento (1-31)')
      return
    }

    setLoading(true)
    setError('')
    try {
      if (tipoGasto === 'variable') {
        const payload = {
          fecha: formData.fecha,
          categoria: formData.categoria,
          descripcion: formData.descripcion,
          monto: parseFloat(formData.monto),
          metodo: formData.metodo,
          cuenta_id: formData.cuenta_id || null,
          deuda_id: formData.deuda_id || null,
          idempotency_key: idempotencyKeyRef.current,
        }
        if (gastoInicial?.id) payload.id = gastoInicial.id
        await onSaveVariable(payload)
        toast.success('Gasto registrado ✓')
      } else {
        const payloadFijo = {
          nombre: formData.nombre,
          categoria: formData.categoria,
          monto: parseFloat(formData.monto),
          dia_venc: parseInt(formData.dia_venc),
          estado: formData.estado,
          cuenta_id: formData.cuenta_id || null,
          deuda_id: formData.deuda_id || null,
        }
        if (gastoInicial?.id) payloadFijo.id = gastoInicial.id
        await onSaveFijo(payloadFijo)
        toast.success('Gasto fijo registrado ✓')
      }
      onClose()
    } catch (err) {
      setError(err?.message || 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  const cats = tipoGasto === 'variable' ? CATS_VAR : CATS_FIJO
  const accountVal = formData.deuda_id || formData.cuenta_id || ''
  const isVar = tipoGasto === 'variable'

  const inputCls = `w-full bg-canvas-surface/[0.05] text-white px-4 py-3 rounded-2xl border border-white/[0.08] focus:outline-none focus:ring-2 placeholder-gray-600 transition-colors ${
    isVar
      ? 'focus:ring-rose-500/40 focus:border-rose-500/30'
      : 'focus:ring-amber-500/40 focus:border-amber-500/30'
  }`

  return (
    <div className="flex flex-col">

      {/* ── HEADER ── */}
      <div className="px-5 pt-3 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-[17px] font-bold text-white leading-tight">
              {gastoInicial ? 'Editar gasto' : 'Nuevo gasto'}
            </h2>
            {gastoInicial && (
              <p className="text-xs text-ink-muted mt-0.5">
                {gastoInicial.nombre || gastoInicial.descripcion}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="md:hidden p-2 bg-canvas-surface/[0.06] hover:bg-canvas-surface/[0.10] rounded-xl text-ink-faint hover:text-white transition-colors touch-manipulation"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Type toggle */}
        <div className="flex gap-1.5 p-1 bg-canvas-surface/[0.03] rounded-2xl border border-white/[0.06]">
          {[
            { id: 'variable', emoji: '🛒', label: 'Variable' },
            { id: 'fijo',     emoji: '📅', label: 'Fijo mensual' },
          ].map(t => (
            <motion.button
              key={t.id}
              whileTap={{ scale: 0.96 }}
              onClick={() => { setTipoGasto(t.id); set('categoria', '') }}
              disabled={loading}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all touch-manipulation ${
                tipoGasto === t.id
                  ? t.id === 'variable'
                    ? 'bg-rose-500/15 text-rose-300 border border-rose-500/20'
                    : 'bg-amber-500/15 text-amber-300 border border-amber-500/20'
                  : 'text-ink-muted border border-transparent hover:text-ink-faint'
              }`}
            >
              <span>{t.emoji}</span>
              <span>{t.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* ── MONTO (prominente) ── */}
      <div className="px-5 py-5 border-y border-white/[0.06] bg-canvas-surface/[0.015]">
        <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest mb-2">
          Monto *
        </p>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-light text-ink-muted">$</span>
          <input
            type="number"
            inputMode="decimal"
            placeholder="0.00"
            value={formData.monto}
            onChange={e => set('monto', e.target.value)}
            disabled={loading}
            autoFocus
            className="flex-1 bg-transparent font-bold text-white focus:outline-none placeholder-gray-700"
            style={{ fontSize: '36px' }}
          />
        </div>
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

        {/* FIJO — Nombre */}
        {tipoGasto === 'fijo' && (
          <div>
            <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest mb-2">
              Nombre *
            </p>
            <input
              type="text"
              placeholder="Ej: Renta, Luz, Seguro..."
              value={formData.nombre}
              onChange={e => set('nombre', e.target.value)}
              disabled={loading}
              className={inputCls}
              style={{ fontSize: '16px' }}
            />
          </div>
        )}

        {/* CATEGORÍA — chips */}
        <div>
          <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest mb-2">
            Categoría *
          </p>
          <div className="flex flex-wrap gap-2">
            {cats.map(c => {
              const val = catVal(c)
              const active = formData.categoria === val
              return (
                <motion.button
                  key={val}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => set('categoria', val)}
                  disabled={loading}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all touch-manipulation ${
                    active
                      ? isVar
                        ? 'bg-rose-500/20 border-rose-500/35 text-rose-200'
                        : 'bg-amber-500/20 border-amber-500/35 text-amber-200'
                      : 'bg-canvas-surface/[0.04] border-canvas-border text-ink-faint hover:text-ink-muted hover:bg-canvas-elevated'
                  }`}
                >
                  <span>{c.e}</span>
                  <span>{c.l}</span>
                </motion.button>
              )
            })}
          </div>
        </div>

        {/* VARIABLE — Descripción + Fecha */}
        {tipoGasto === 'variable' && (
          <>
            <div>
              <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest mb-2">
                Descripción
              </p>
              <input
                type="text"
                placeholder="Ej: Supermercado, Gasolina..."
                value={formData.descripcion}
                onChange={e => set('descripcion', e.target.value)}
                disabled={loading}
                className={inputCls}
                style={{ fontSize: '16px' }}
              />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest mb-2">
                Fecha
              </p>
              <input
                type="date"
                value={formData.fecha}
                onChange={e => set('fecha', e.target.value)}
                disabled={loading}
                className={inputCls}
                style={{ fontSize: '16px' }}
              />
            </div>
          </>
        )}

        {/* FIJO — Día de vencimiento + Estado */}
        {tipoGasto === 'fijo' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest mb-2">
                Día de venc. *
              </p>
              <input
                type="number"
                inputMode="numeric"
                min="1"
                max="31"
                placeholder="15"
                value={formData.dia_venc}
                onChange={e => set('dia_venc', e.target.value)}
                disabled={loading}
                className={inputCls}
                style={{ fontSize: '16px' }}
              />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest mb-2">
                Estado
              </p>
              <div className="flex gap-2 h-[50px]">
                {[
                  { val: 'Pendiente', label: '⏳', color: 'amber' },
                  { val: 'Pagado',    label: '✅', color: 'emerald' },
                ].map(s => (
                  <button
                    key={s.val}
                    onClick={() => set('estado', s.val)}
                    disabled={loading}
                    className={`flex-1 flex items-center justify-center gap-1 rounded-xl border text-[11px] font-semibold transition-all touch-manipulation ${
                      formData.estado === s.val
                        ? s.color === 'amber'
                          ? 'bg-amber-500/15 border-amber-500/25 text-amber-300'
                          : 'bg-emerald-500/15 border-emerald-500/25 text-emerald-300'
                        : 'bg-canvas-surface/[0.04] border-white/[0.07] text-ink-muted'
                    }`}
                  >
                    <span>{s.label}</span>
                    <span>{s.val}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CUENTA / TARJETA */}
        <div>
          <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest mb-2">
            Cuenta de pago
          </p>
          <select
            value={accountVal}
            onChange={e => handleAccountChange(e.target.value)}
            disabled={loading}
            className={inputCls}
            style={{ fontSize: '16px' }}
          >
            <option value="">Efectivo (sin cuenta)</option>
            {cuentas.length > 0 && (
              <optgroup label="🏦 Cuentas bancarias">
                {cuentas.map(c => (
                  <option key={`c-${c.id}`} value={c.id}>
                    {c.nombre} — ${Number(c.balance || 0).toFixed(2)}
                  </option>
                ))}
              </optgroup>
            )}
            {deudas.filter(d => d.estado !== 'Saldada').length > 0 && (
              <optgroup label="💳 Tarjetas de crédito">
                {deudas.filter(d => d.estado !== 'Saldada').map(d => (
                  <option key={`d-${d.id}`} value={d.id}>
                    {d.cuenta} — ${Number(d.saldo || 0).toFixed(2)}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </div>

      </div>

      {/* ── FOOTER ── */}
      <div
        className="sticky bottom-0 px-5 py-4 border-t border-canvas-border backdrop-blur-xl"
        style={{ background: 'rgba(8,11,17,0.95)', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
      >
        <div className="flex gap-3">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-3.5 bg-canvas-elevated border border-canvas-border text-ink-muted rounded-2xl font-semibold transition-all touch-manipulation disabled:opacity-50 text-sm"
          >
            Cancelar
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleSubmit}
            disabled={loading}
            className={`flex-[2] py-3.5 text-white rounded-2xl font-black transition-all touch-manipulation disabled:opacity-50 flex items-center justify-center gap-2 text-sm shadow-lg ${
              isVar
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-900/40'
                : 'bg-amber-600 hover:bg-amber-700 shadow-amber-900/40'
            }`}
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Guardando...</>
            ) : (
              <><CheckCircle className="w-4 h-4" />{gastoInicial ? 'Actualizar' : 'Guardar gasto'}</>
            )}
          </motion.button>
        </div>
      </div>

    </div>
  )
}
