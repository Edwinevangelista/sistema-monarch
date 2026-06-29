// src/components/MetasFinancieras.jsx
// Módulo de Metas Financieras — crear, abonar y seguir objetivos de ahorro/pago
// Diseño mobile-first, dark theme consistente con el resto del sistema

import { useState, useMemo } from 'react'
import {
  Target, Plus, X, Check, ChevronDown, ChevronUp,
  Pencil, Trash2, PiggyBank, Plane, CreditCard,
  TrendingUp, Shield, Sparkles, Calendar
} from 'lucide-react'
import { useMetas } from '../hooks/useMetas'
import { toast } from 'sonner'

// ── Configuración de tipos ───────────────────────────────────────────────
const TIPOS = [
  { key: 'ahorro',     label: 'Ahorro',       emoji: '💰', color: '#10b981', icon: PiggyBank },
  { key: 'emergencia', label: 'Emergencia',   emoji: '🛡️', color: '#f59e0b', icon: Shield    },
  { key: 'viaje',      label: 'Viaje',        emoji: '✈️', color: '#3b82f6', icon: Plane     },
  { key: 'deuda',      label: 'Pagar deuda',  emoji: '💳', color: '#ef4444', icon: CreditCard},
  { key: 'inversion',  label: 'Inversión',    emoji: '📈', color: '#8b5cf6', icon: TrendingUp},
  { key: 'otro',       label: 'Otro',         emoji: '🎯', color: '#6366f1', icon: Target    },
]

const tipoConfig = (tipo) => TIPOS.find(t => t.key === tipo) || TIPOS[5]

const fmt = (n) => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
const diasRestantes = (d) => {
  if (!d) return null
  const diff = Math.ceil((new Date(d + 'T12:00:00') - new Date()) / (1000 * 60 * 60 * 24))
  return diff
}

// ── Modal de creación / edición ──────────────────────────────────────────
function ModalMeta({ meta, onSave, onClose }) {
  const editando = !!meta?.id
  const [form, setForm] = useState({
    nombre:         meta?.nombre         || '',
    tipo:           meta?.tipo           || 'ahorro',
    monto_objetivo: meta?.monto_objetivo || '',
    monto_actual:   meta?.monto_actual   || 0,
    fecha_limite:   meta?.fecha_limite   || '',
    descripcion:    meta?.descripcion    || '',
  })
  const [saving, setSaving] = useState(false)

  const cfg = tipoConfig(form.tipo)

  const handleSave = async () => {
    if (!form.nombre.trim()) { toast.error('El nombre es obligatorio'); return }
    if (!form.monto_objetivo || Number(form.monto_objetivo) <= 0) { toast.error('La meta debe ser mayor a $0'); return }
    setSaving(true)
    try {
      await onSave({
        nombre: form.nombre.trim(),
        tipo: form.tipo,
        emoji: cfg.emoji,
        color: cfg.color,
        monto_objetivo: Number(form.monto_objetivo),
        monto_actual: Number(form.monto_actual) || 0,
        fecha_limite: form.fecha_limite || null,
        descripcion: form.descripcion.trim() || null,
      })
      onClose()
    } catch (e) {
      toast.error('Error guardando meta: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="bg-gray-900 w-full md:max-w-md rounded-t-3xl md:rounded-2xl border border-white/10 shadow-2xl flex flex-col"
        style={{ maxHeight: 'calc(100dvh - env(safe-area-inset-top, 0px) - 1rem)' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 shrink-0">
          <h3 className="text-white font-bold text-lg">{editando ? 'Editar meta' : 'Nueva meta'}</h3>
          <button onClick={onClose} className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Tipo */}
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 block">Tipo de meta</label>
            <div className="grid grid-cols-3 gap-2">
              {TIPOS.map(t => (
                <button
                  key={t.key}
                  onClick={() => setForm(f => ({ ...f, tipo: t.key }))}
                  className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border transition-all ${form.tipo === t.key ? 'border-current' : 'border-white/10 bg-white/3'}`}
                  style={form.tipo === t.key ? { borderColor: t.color, background: `${t.color}18`, color: t.color } : { color: '#9ca3af' }}
                >
                  <span className="text-lg">{t.emoji}</span>
                  <span className="text-[10px] font-semibold leading-tight text-center">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Nombre */}
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5 block">Nombre</label>
            <input
              type="text"
              placeholder={`Ej. ${cfg.emoji} Fondo de emergencia`}
              value={form.nombre}
              onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
              className="w-full bg-white/6 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Montos */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5 block">Meta ($)</label>
              <input
                type="number"
                min="1"
                placeholder="5,000"
                value={form.monto_objetivo}
                onChange={e => setForm(f => ({ ...f, monto_objetivo: e.target.value }))}
                className="w-full bg-white/6 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5 block">Ya tengo ($)</label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={form.monto_actual}
                onChange={e => setForm(f => ({ ...f, monto_actual: e.target.value }))}
                className="w-full bg-white/6 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Fecha límite */}
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5 block">Fecha límite (opcional)</label>
            <input
              type="date"
              value={form.fecha_limite}
              onChange={e => setForm(f => ({ ...f, fecha_limite: e.target.value }))}
              className="w-full bg-white/6 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Actions — siempre visible, fuera del scroll */}
        <div className="p-5 pt-3 border-t border-white/10 shrink-0" style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))' }}>
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3.5 rounded-xl font-bold text-white text-sm disabled:opacity-50 transition-all active:scale-95"
            style={{ background: `linear-gradient(135deg, ${cfg.color}, ${cfg.color}bb)` }}
          >
            {saving ? 'Guardando…' : editando ? 'Guardar cambios' : `Crear meta ${cfg.emoji}`}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Modal de abono ────────────────────────────────────────────────────────
function ModalAbono({ meta, onAbono, onClose }) {
  const [monto, setMonto] = useState('')
  const [saving, setSaving] = useState(false)
  const faltante = Number(meta.monto_objetivo) - Number(meta.monto_actual)
  const cfg = tipoConfig(meta.tipo)

  const handleAbono = async () => {
    const v = Number(monto)
    if (!v || v <= 0) { toast.error('Ingresa un monto válido'); return }
    setSaving(true)
    try {
      await onAbono(meta.id, v)
      toast.success(`${fmt(v)} abonados a "${meta.nombre}" ${cfg.emoji}`)
      onClose()
    } catch (e) {
      toast.error('Error: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="bg-gray-900 w-full md:max-w-sm rounded-t-3xl md:rounded-2xl border border-white/10 shadow-2xl flex flex-col"
        style={{ maxHeight: 'calc(100dvh - env(safe-area-inset-top, 0px) - 1rem)' }}>
        <div className="flex items-center justify-between p-5 border-b border-white/10 shrink-0">
          <h3 className="text-white font-bold">Abonar a meta</h3>
          <button onClick={onClose} className="p-2 rounded-full bg-white/5 text-gray-400"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-5 overflow-y-auto flex-1">
          <div className="text-center py-2">
            <p className="text-gray-400 text-sm">{meta.nombre}</p>
            <p className="text-white text-2xl font-black mt-1">{fmt(meta.monto_actual)} <span className="text-gray-600 text-base font-normal">/ {fmt(meta.monto_objetivo)}</span></p>
            <p className="text-gray-500 text-xs mt-1">Faltan {fmt(faltante)}</p>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase mb-1.5 block">¿Cuánto abonás?</label>
            <div className="flex gap-2 mb-3">
              {[50, 100, 200].map(v => (
                <button key={v} onClick={() => setMonto(String(v))} className="flex-1 py-2 rounded-lg bg-white/6 hover:bg-white/10 text-gray-300 text-sm font-bold border border-white/10">
                  {fmt(v)}
                </button>
              ))}
            </div>
            <input
              type="number"
              min="1"
              placeholder="Otro monto…"
              value={monto}
              onChange={e => setMonto(e.target.value)}
              className="w-full bg-white/6 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
        <div className="p-5 pt-3 border-t border-white/10 shrink-0" style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))' }}>
          <button
            onClick={handleAbono}
            disabled={saving || !monto}
            className="w-full py-3.5 rounded-xl font-bold text-white text-sm bg-gradient-to-r from-emerald-600 to-teal-600 disabled:opacity-50 active:scale-95 transition-transform"
          >
            {saving ? 'Guardando…' : `Abonar ${monto ? fmt(monto) : ''}`}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Tarjeta de meta ───────────────────────────────────────────────────────
function TarjetaMeta({ meta, onAbono, onEditar, onEliminar }) {
  const cfg = tipoConfig(meta.tipo)
  const pct = meta.monto_objetivo > 0 ? Math.min(100, (Number(meta.monto_actual) / Number(meta.monto_objetivo)) * 100) : 0
  const dias = diasRestantes(meta.fecha_limite)
  const urgente = dias !== null && dias <= 30 && dias >= 0
  const vencida = dias !== null && dias < 0

  return (
    <div
      className="rounded-2xl border p-4 relative overflow-hidden"
      style={{
        background: meta.completada
          ? 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(5,150,105,0.04) 100%)'
          : 'rgba(255,255,255,0.03)',
        borderColor: meta.completada ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.08)',
      }}
    >
      {/* Glow cuando está completada */}
      {meta.completada && <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at top left, rgba(16,185,129,0.06) 0%, transparent 60%)' }} />}

      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-2xl shrink-0">{meta.emoji || cfg.emoji}</span>
          <div className="min-w-0">
            <p className="text-white font-bold text-sm truncate">{meta.nombre}</p>
            <p className="text-xs font-medium" style={{ color: cfg.color }}>{cfg.label}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {!meta.completada && (
            <button onClick={() => onAbono(meta)} className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-colors" title="Abonar">
              <Plus className="w-4 h-4" />
            </button>
          )}
          <button onClick={() => onEditar(meta)} className="p-1.5 rounded-lg bg-white/6 text-gray-400 hover:bg-white/12 transition-colors" title="Editar">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onEliminar(meta.id)} className="p-1.5 rounded-lg bg-white/6 text-gray-500 hover:bg-red-500/20 hover:text-red-400 transition-colors" title="Eliminar">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Montos */}
      <div className="flex items-end justify-between mb-2">
        <div>
          <span className="text-xl font-black text-white tabular-nums">{fmt(meta.monto_actual)}</span>
          <span className="text-sm text-gray-500 ml-1">/ {fmt(meta.monto_objetivo)}</span>
        </div>
        <span className="text-lg font-black tabular-nums" style={{ color: meta.completada ? '#10b981' : cfg.color }}>
          {pct.toFixed(0)}%
        </span>
      </div>

      {/* Barra de progreso */}
      <div className="h-2.5 rounded-full overflow-hidden mb-2" style={{ background: 'rgba(255,255,255,0.07)' }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            background: meta.completada
              ? 'linear-gradient(90deg, #10b981, #34d399)'
              : `linear-gradient(90deg, ${cfg.color}cc, ${cfg.color})`,
            boxShadow: pct >= 100 ? `0 0 8px ${cfg.color}55` : 'none',
          }}
        />
      </div>

      {/* Footer: fecha + faltante */}
      <div className="flex items-center justify-between text-xs">
        {meta.completada ? (
          <span className="text-emerald-400 font-bold flex items-center gap-1"><Check className="w-3.5 h-3.5" /> ¡Meta alcanzada!</span>
        ) : (
          <span className="text-gray-500">Faltan <strong className="text-gray-300">{fmt(Number(meta.monto_objetivo) - Number(meta.monto_actual))}</strong></span>
        )}
        {meta.fecha_limite && (
          <span className={`flex items-center gap-1 font-medium ${vencida ? 'text-red-400' : urgente ? 'text-amber-400' : 'text-gray-500'}`}>
            <Calendar className="w-3 h-3" />
            {vencida ? 'Vencida' : dias === 0 ? 'Hoy' : `${dias}d`}
          </span>
        )}
      </div>
    </div>
  )
}

// ── Componente principal ─────────────────────────────────────────────────
export default function MetasFinancieras() {
  const { metas, loading, addMeta, updateMeta, deleteMeta, abonarMeta } = useMetas()
  const [expandido, setExpandido] = useState(false)
  const [showModalMeta, setShowModalMeta] = useState(false)
  const [editandoMeta, setEditandoMeta] = useState(null)
  const [abonadoA, setAbonadoA] = useState(null)

  const stats = useMemo(() => {
    const activas    = metas.filter(m => !m.completada)
    const completadas = metas.filter(m => m.completada)
    const totalMeta  = metas.reduce((s, m) => s + Number(m.monto_objetivo || 0), 0)
    const totalActual = metas.reduce((s, m) => s + Number(m.monto_actual || 0), 0)
    const pctGlobal  = totalMeta > 0 ? Math.round((totalActual / totalMeta) * 100) : 0
    return { activas: activas.length, completadas: completadas.length, totalMeta, totalActual, pctGlobal }
  }, [metas])

  const handleSaveMeta = async (data) => {
    if (editandoMeta?.id) {
      await updateMeta(editandoMeta.id, data)
      toast.success('Meta actualizada')
    } else {
      await addMeta(data)
      toast.success('¡Meta creada! 🎯')
    }
    setEditandoMeta(null)
  }

  const handleEliminar = async (id) => {
    await deleteMeta(id)
    toast.success('Meta eliminada')
  }

  if (loading) return null

  return (
    <div className="max-w-7xl mx-auto px-3 md:px-4 mt-3">
      <div
        className="relative overflow-hidden rounded-3xl border border-white/10"
        style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.06) 0%, rgba(255,255,255,0.02) 100%)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.06)',
        }}
      >
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />

        {/* Header — siempre visible */}
        <button
          onClick={() => setExpandido(v => !v)}
          className="w-full flex items-center justify-between px-4 py-3.5 touch-manipulation"
        >
          <div className="flex items-center gap-2.5">
            <Target className="w-4 h-4 text-indigo-400 shrink-0" />
            <div className="text-left">
              <p className="text-sm font-bold text-gray-200">Mis Metas</p>
              <p className="text-[10px] text-gray-600 mt-0.5">
                {metas.length === 0
                  ? 'Crea tu primera meta financiera'
                  : `${stats.activas} activa${stats.activas !== 1 ? 's' : ''} · ${stats.pctGlobal}% alcanzado${stats.completadas > 0 ? ` · ${stats.completadas} completada${stats.completadas !== 1 ? 's' : ''}` : ''}`
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {metas.length > 0 && (
              <span className="text-xs font-black tabular-nums px-2 py-0.5 rounded-full" style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>
                {fmt(stats.totalActual)} / {fmt(stats.totalMeta)}
              </span>
            )}
            {expandido
              ? <ChevronUp className="w-4 h-4 text-gray-500" />
              : <ChevronDown className="w-4 h-4 text-gray-500" />
            }
          </div>
        </button>

        {/* Contenido expandido */}
        {expandido && (
          <div className="px-3 pb-4 border-t border-white/6 pt-3 animate-in fade-in slide-in-from-top-2 duration-200 space-y-3">

            {/* Barra global de progreso (si hay metas) */}
            {metas.length > 0 && (
              <div className="px-1">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-gray-500">Progreso total</span>
                  <span className="font-bold text-indigo-400">{stats.pctGlobal}%</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${stats.pctGlobal}%`, background: 'linear-gradient(90deg, #6366f1, #8b5cf6)' }}
                  />
                </div>
              </div>
            )}

            {/* Lista de metas */}
            {metas.length > 0 && (
              <div className="space-y-2">
                {metas.map(meta => (
                  <TarjetaMeta
                    key={meta.id}
                    meta={meta}
                    onAbono={setAbonadoA}
                    onEditar={m => { setEditandoMeta(m); setShowModalMeta(true) }}
                    onEliminar={handleEliminar}
                  />
                ))}
              </div>
            )}

            {/* Empty state */}
            {metas.length === 0 && (
              <div className="text-center py-6">
                <Sparkles className="w-10 h-10 text-indigo-400/40 mx-auto mb-2" />
                <p className="text-gray-400 text-sm font-medium">Define tu primera meta</p>
                <p className="text-gray-600 text-xs mt-1">Fondo de emergencia, viaje, pago de deuda…</p>
              </div>
            )}

            {/* Botón crear */}
            <button
              onClick={() => { setEditandoMeta(null); setShowModalMeta(true) }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/8 transition-colors text-sm font-semibold"
            >
              <Plus className="w-4 h-4" />
              Nueva meta
            </button>
          </div>
        )}
      </div>

      {/* Modales */}
      {showModalMeta && (
        <ModalMeta
          meta={editandoMeta}
          onSave={handleSaveMeta}
          onClose={() => { setShowModalMeta(false); setEditandoMeta(null) }}
        />
      )}
      {abonadoA && (
        <ModalAbono
          meta={abonadoA}
          onAbono={abonarMeta}
          onClose={() => setAbonadoA(null)}
        />
      )}
    </div>
  )
}
