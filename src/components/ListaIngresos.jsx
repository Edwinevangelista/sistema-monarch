// ListaIngresos.jsx — 2026: compacta, últimos 3, modal detalle moderno
import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import {
  ArrowUpRight, Edit2, Trash2, Calendar,
  FileText, Search, X, Filter,
  ChevronDown, Building2, TrendingUp
} from 'lucide-react'

// ─── Helpers ────────────────────────────────────────────────────────────────
const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

function fmtFecha(fecha, largo = false) {
  const d = new Date(fecha + 'T00:00:00')
  if (largo) {
    return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  }
  return `${d.getDate()} ${MESES[d.getMonth()]}`
}

function esMesActual(fecha) {
  const d = new Date(fecha)
  const h = new Date()
  return d.getMonth() === h.getMonth() && d.getFullYear() === h.getFullYear()
}

// ─── Modal detalle de ingreso ────────────────────────────────────────────────
function ModalDetalleIngreso({ ingreso, onClose, onEditar, onEliminar }) {
  const [visible, setVisible] = useState(true)

  const cerrar = () => {
    setVisible(false)
    setTimeout(onClose, 280)
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center"
      style={{
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(12px)',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.28s ease',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) cerrar() }}
    >
      <div
        className="relative w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, rgba(12,17,35,0.99) 0%, rgba(5,8,18,0.99) 100%)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 -20px 60px -10px rgba(0,0,0,0.8)',
          transform: visible ? 'translateY(0)' : 'translateY(30px)',
          transition: 'transform 0.28s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        {/* Handle bar mobile */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header con monto destacado */}
        <div
          className="px-5 pt-5 pb-4 relative"
          style={{
            background: 'linear-gradient(135deg, rgba(16,185,129,0.12) 0%, transparent 70%)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <button
            onClick={cerrar}
            className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center bg-white/8 hover:bg-white/15 transition-all touch-manipulation"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>

          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
              style={{
                background: 'rgba(16,185,129,0.18)',
                border: '1px solid rgba(16,185,129,0.3)',
                boxShadow: '0 0 20px rgba(16,185,129,0.2)',
              }}
            >
              <ArrowUpRight className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Ingreso</p>
              <h2 className="text-base font-black text-white truncate">{ingreso.fuente || 'Ingreso'}</h2>
            </div>
          </div>

          <p className="text-3xl font-black text-emerald-400">
            ${Number(ingreso.monto).toLocaleString()}
          </p>
        </div>

        {/* Detalles */}
        <div className="px-5 py-4 space-y-2.5">
          {/* Fecha */}
          <div
            className="flex items-center justify-between p-3 rounded-xl"
            style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}
          >
            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-blue-400 shrink-0" />
              <span className="text-sm font-semibold text-gray-300">Fecha</span>
            </div>
            <span className="text-sm font-bold text-white capitalize">
              {fmtFecha(ingreso.fecha, true)}
            </span>
          </div>

          {/* Cuenta */}
          {ingreso.cuenta_nombre && (
            <div
              className="flex items-center justify-between p-3 rounded-xl"
              style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}
            >
              <div className="flex items-center gap-2.5">
                <Building2 className="w-4 h-4 text-violet-400 shrink-0" />
                <span className="text-sm font-semibold text-gray-300">Cuenta</span>
              </div>
              <span className="text-sm font-bold text-white">{ingreso.cuenta_nombre}</span>
            </div>
          )}

          {/* Descripción */}
          {ingreso.descripcion && (
            <div
              className="p-3 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <FileText className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600">Nota</span>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">{ingreso.descripcion}</p>
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="px-5 pb-6 flex gap-2">
          <button
            onClick={() => { onEditar(ingreso); cerrar() }}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold transition-all touch-manipulation active:scale-[0.97]"
            style={{
              background: 'rgba(59,130,246,0.15)',
              border: '1px solid rgba(59,130,246,0.3)',
              color: '#60a5fa',
            }}
          >
            <Edit2 className="w-4 h-4" />
            Editar
          </button>
          <button
            onClick={() => {
              if (window.confirm('¿Eliminar este ingreso?')) {
                onEliminar(ingreso.id)
                cerrar()
              }
            }}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold transition-all touch-manipulation active:scale-[0.97]"
            style={{
              background: 'rgba(239,68,68,0.12)',
              border: '1px solid rgba(239,68,68,0.25)',
              color: '#f87171',
            }}
          >
            <Trash2 className="w-4 h-4" />
            Eliminar
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ─── Modal lista completa (todos los ingresos) ───────────────────────────────
function ModalTodosIngresos({ ingresos, onClose, onEditar, onEliminar }) {
  const [busqueda, setBusqueda] = useState('')
  const [filtroMes, setFiltroMes] = useState('todos')
  const [ordenar, setOrdenar] = useState('fecha-desc')
  const [mostrarFiltros, setMostrarFiltros] = useState(false)
  const [seleccionado, setSeleccionado] = useState(null)
  const [visible, setVisible] = useState(true)

  const cerrar = () => {
    setVisible(false)
    setTimeout(onClose, 280)
  }

  const mesesUnicos = [...new Set(ingresos.map(ing => {
    const d = new Date(ing.fecha)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  }))].sort().reverse()

  let filtrados = ingresos.filter(ing => {
    const ok = busqueda === '' ||
      ing.fuente?.toLowerCase().includes(busqueda.toLowerCase()) ||
      ing.descripcion?.toLowerCase().includes(busqueda.toLowerCase())
    if (filtroMes === 'todos') return ok
    const d = new Date(ing.fecha)
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    return ok && k === filtroMes
  })

  filtrados.sort((a, b) => {
    if (ordenar === 'fecha-desc') return new Date(b.fecha) - new Date(a.fecha)
    if (ordenar === 'fecha-asc') return new Date(a.fecha) - new Date(b.fecha)
    if (ordenar === 'monto-desc') return Number(b.monto) - Number(a.monto)
    if (ordenar === 'monto-asc') return Number(a.monto) - Number(b.monto)
    return 0
  })

  const totalFiltrado = filtrados.reduce((s, i) => s + Number(i.monto || 0), 0)

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[9998] flex items-end sm:items-center justify-center"
        style={{
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(12px)',
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.28s ease',
        }}
        onClick={(e) => { if (e.target === e.currentTarget) cerrar() }}
      >
        <div
          className="relative w-full sm:max-w-lg flex flex-col rounded-t-3xl sm:rounded-3xl overflow-hidden"
          style={{
            background: 'linear-gradient(160deg, rgba(12,17,35,0.99) 0%, rgba(5,8,18,0.99) 100%)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 -20px 60px -10px rgba(0,0,0,0.9)',
            maxHeight: '90dvh',
            transform: visible ? 'translateY(0)' : 'translateY(30px)',
            transition: 'transform 0.28s cubic-bezier(0.16,1,0.3,1)',
          }}
        >
          {/* Handle bar */}
          <div className="flex justify-center pt-3 sm:hidden shrink-0">
            <div className="w-10 h-1 rounded-full bg-white/20" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Historial</p>
              <h2 className="text-lg font-black text-white">Todos los Ingresos</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 font-black text-sm">${totalFiltrado.toLocaleString()}</span>
              <button
                onClick={cerrar}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-white/8 hover:bg-white/15 transition-all touch-manipulation"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Búsqueda + filtros */}
          <div className="px-5 py-3 space-y-2 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Buscar por fuente o nota..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>

            <button
              onClick={() => setMostrarFiltros(v => !v)}
              className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 hover:text-gray-300 transition-colors touch-manipulation"
            >
              <Filter className="w-3 h-3" />
              Filtros
              <ChevronDown className={`w-3 h-3 transition-transform ${mostrarFiltros ? 'rotate-180' : ''}`} />
              {filtrados.length < ingresos.length && (
                <span className="ml-1 text-emerald-400">{filtrados.length} resultado{filtrados.length !== 1 ? 's' : ''}</span>
              )}
            </button>

            {mostrarFiltros && (
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={filtroMes}
                  onChange={e => setFiltroMes(e.target.value)}
                  className="text-xs text-white px-3 py-2 rounded-xl focus:outline-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <option value="todos">Todos los meses</option>
                  {mesesUnicos.map(mes => {
                    const [y, m] = mes.split('-')
                    const d = new Date(y, m - 1)
                    return (
                      <option key={mes} value={mes}>
                        {d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                      </option>
                    )
                  })}
                </select>
                <select
                  value={ordenar}
                  onChange={e => setOrdenar(e.target.value)}
                  className="text-xs text-white px-3 py-2 rounded-xl focus:outline-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <option value="fecha-desc">Más reciente</option>
                  <option value="fecha-asc">Más antiguo</option>
                  <option value="monto-desc">Mayor monto</option>
                  <option value="monto-asc">Menor monto</option>
                </select>
              </div>
            )}
          </div>

          {/* Lista scrollable */}
          <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
            {filtrados.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <span className="text-3xl mb-2">🔍</span>
                <p className="text-sm text-gray-500">Sin resultados</p>
              </div>
            ) : filtrados.map(ing => (
              <IngresoRow
                key={ing.id}
                ingreso={ing}
                onClick={() => setSeleccionado(ing)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Modal detalle desde lista completa */}
      {seleccionado && (
        <ModalDetalleIngreso
          ingreso={seleccionado}
          onClose={() => setSeleccionado(null)}
          onEditar={(ing) => { onEditar(ing); setSeleccionado(null) }}
          onEliminar={(id) => { onEliminar(id); setSeleccionado(null) }}
        />
      )}
    </>,
    document.body
  )
}

// ─── Fila de ingreso (reutilizable en ambos contextos) ───────────────────────
function IngresoRow({ ingreso, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-2xl transition-all touch-manipulation active:scale-[0.98] text-left"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Icono */}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{
          background: 'rgba(16,185,129,0.15)',
          border: '1px solid rgba(16,185,129,0.25)',
        }}
      >
        <ArrowUpRight className="w-4 h-4 text-emerald-400" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-sm font-bold text-white truncate">{ingreso.fuente || 'Ingreso'}</span>
          {esMesActual(ingreso.fecha) && (
            <span
              className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full shrink-0"
              style={{
                background: 'rgba(16,185,129,0.18)',
                color: '#34d399',
                border: '1px solid rgba(16,185,129,0.3)',
              }}
            >
              Este mes
            </span>
          )}
        </div>
        <p className="text-[11px] text-gray-500 font-medium">
          {fmtFecha(ingreso.fecha)}
          {ingreso.descripcion && ` · ${ingreso.descripcion.substring(0, 28)}${ingreso.descripcion.length > 28 ? '…' : ''}`}
        </p>
      </div>

      {/* Monto */}
      <span className="text-base font-black text-emerald-400 shrink-0">
        +${Number(ingreso.monto).toLocaleString()}
      </span>
    </button>
  )
}

// ─── Componente principal ────────────────────────────────────────────────────
export default function ListaIngresos({ ingresos, onEditar, onEliminar }) {
  const [seleccionado, setSeleccionado] = useState(null)
  const [verTodos, setVerTodos] = useState(false)

  // Estado vacío
  if (!ingresos || ingresos.length === 0) {
    return (
      <div
        className="rounded-3xl p-5"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <div className="flex items-center gap-2.5 mb-4">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.25)' }}
          >
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white">Ingresos Recientes</h3>
          </div>
        </div>
        <div className="flex flex-col items-center py-6 text-center">
          <span className="text-3xl mb-2">💰</span>
          <p className="text-sm text-gray-500 font-medium">Sin ingresos registrados</p>
          <p className="text-xs text-gray-600 mt-1">Agrega tu primer ingreso para comenzar</p>
        </div>
      </div>
    )
  }

  const ordenados = [...ingresos].sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
  const ultimos3 = ordenados.slice(0, 3)
  const totalMes = ingresos
    .filter(i => esMesActual(i.fecha))
    .reduce((s, i) => s + Number(i.monto || 0), 0)

  return (
    <>
      <div
        className="rounded-3xl overflow-hidden"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.25)' }}
            >
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white leading-tight">Ingresos Recientes</h3>
              <p className="text-[10px] text-gray-600 font-medium">{ingresos.length} registros en total</p>
            </div>
          </div>

          {/* Total del mes */}
          {totalMes > 0 && (
            <div className="text-right">
              <p className="text-[9px] text-gray-600 uppercase tracking-wider font-bold">Este mes</p>
              <p className="text-sm font-black text-emerald-400">+${totalMes.toLocaleString()}</p>
            </div>
          )}
        </div>

        {/* Línea separadora */}
        <div className="mx-4 mb-3 h-px bg-white/5" />

        {/* ── Últimos 3 ingresos ── */}
        <div className="px-3 pb-3 space-y-1.5">
          {ultimos3.map(ing => (
            <IngresoRow
              key={ing.id}
              ingreso={ing}
              onClick={() => setSeleccionado(ing)}
            />
          ))}
        </div>

        {/* ── Footer: Ver todos ── */}
        {ingresos.length > 3 && (
          <button
            onClick={() => setVerTodos(true)}
            className="w-full flex items-center justify-center gap-1.5 py-3 text-[11px] font-semibold text-gray-500 hover:text-emerald-400 transition-all touch-manipulation"
            style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
          >
            <Search className="w-3 h-3" />
            Ver todos los ingresos ({ingresos.length})
          </button>
        )}
      </div>

      {/* Modal detalle individual */}
      {seleccionado && (
        <ModalDetalleIngreso
          ingreso={seleccionado}
          onClose={() => setSeleccionado(null)}
          onEditar={onEditar}
          onEliminar={onEliminar}
        />
      )}

      {/* Modal lista completa */}
      {verTodos && (
        <ModalTodosIngresos
          ingresos={ingresos}
          onClose={() => setVerTodos(false)}
          onEditar={onEditar}
          onEliminar={onEliminar}
        />
      )}
    </>
  )
}
