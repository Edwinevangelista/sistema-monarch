import { useState, useMemo } from 'react'
import { showConfirm } from '../utils/confirm'
import { ITEM_TYPES } from '../constants/itemTypes'
import {
  X,
  Edit2,
  CheckCircle,
  CreditCard,
  Calendar,
  Info,
  Wallet,
  FileText,
  Repeat,
  Loader2,
  Tag,
  Banknote,
  ShoppingCart,
  Clock,
  ArrowDownCircle,
  Receipt,
  AlertCircle,
  Shield,
  Percent,
  ChevronRight,
  AlertTriangle,
  Zap,
} from 'lucide-react'

import {
  getEstadoTarjeta,
  calcularPagoMinimo,
  calcularUsoCredito,
  colorUsoCredito,
  calcularProximoCorte,
  calcularFechaLimitePago,
} from '../utils/tarjetasCalculos'

export default function ModalDetalleUniversal({
  item,
  type,
  status,
  pagos = [],
  gastos = [],
  onClose,
  onEditar,
  onPagar,
  isPagando = false
}) {
  // =========================
  // Helpers seguros
  // =========================
  const getMonto = () => {
    if (type === ITEM_TYPES.DEUDA) return Number(item.saldo || 0)
    if (type === ITEM_TYPES.SUSCRIPCION) return Number(item.costo || 0)
    return Number(item.monto || 0)
  }

  const getTitle = () => {
    return item.nombre || item.descripcion || item.servicio || item.cuenta || 'Sin título'
  }

  const fmtMonto = (n) =>
    `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const fmtFechaCorta = (fechaStr) => {
    if (!fechaStr) return null
    return new Date(fechaStr + 'T00:00:00').toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const getDiaSemana = (fechaStr) => {
    if (!fechaStr) return null
    const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
    return dias[new Date(fechaStr + 'T00:00:00').getDay()]
  }

  // =========================
  // Themes
  // =========================
  const themes = {
    [ITEM_TYPES.DEUDA]:       { color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30', gradient: 'from-purple-950/60 via-gray-900 to-gray-900', accentBar: 'bg-purple-500', label: 'Deuda / Tarjeta' },
    [ITEM_TYPES.FIJO]:        { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', gradient: 'from-yellow-950/50 via-gray-900 to-gray-900', accentBar: 'bg-yellow-500', label: 'Gasto Fijo' },
    [ITEM_TYPES.SUSCRIPCION]: { color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/30',   gradient: 'from-blue-950/50 via-gray-900 to-gray-900',   accentBar: 'bg-blue-500',   label: 'Suscripción' },
    [ITEM_TYPES.VARIABLE]:    { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', gradient: 'from-orange-950/50 via-gray-900 to-gray-900', accentBar: 'bg-orange-500', label: 'Gasto Variable' },
  }
  const t = themes[type] || { color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/30', gradient: 'from-gray-800 to-gray-900', accentBar: 'bg-gray-500', label: 'Detalle' }

  // =========================
  // Método pago helpers (solo variables)
  // =========================
  const getMetodoIcon = (metodo) => {
    if (!metodo) return Banknote
    const m = metodo.toLowerCase()
    if (m.includes('débito') || m.includes('debito')) return CreditCard
    if (m.includes('tarjeta') || m.includes('crédito') || m.includes('credito')) return CreditCard
    if (m.includes('transferencia')) return ArrowDownCircle
    if (m.includes('efectivo')) return Banknote
    return Receipt
  }

  const getMetodoColor = (metodo) => {
    if (!metodo) return 'text-gray-400'
    const m = metodo.toLowerCase()
    if (m.includes('débito') || m.includes('debito')) return 'text-blue-400'
    if (m.includes('crédito') || m.includes('credito') || m.includes('tarjeta')) return 'text-purple-400'
    if (m.includes('efectivo')) return 'text-green-400'
    if (m.includes('transferencia')) return 'text-cyan-400'
    return 'text-gray-300'
  }

  // =========================
  // Estado suscripcion
  // =========================
  let isSuscripcionPagada = false
  if (type === ITEM_TYPES.SUSCRIPCION) {
    const hoy = new Date(); hoy.setHours(0,0,0,0)
    const pp = new Date((item.proximo_pago || hoy.toISOString().split('T')[0]) + 'T00:00:00'); pp.setHours(0,0,0,0)
    isSuscripcionPagada = pp.getFullYear() > hoy.getFullYear() || (pp.getFullYear() === hoy.getFullYear() && pp.getMonth() > hoy.getMonth())
  }
  const isGastoFijoPagado = type === ITEM_TYPES.FIJO && item.estado === 'Pagado'
  

  // =========================
  // SHARED: Card de detalle pequeño
  // =========================
  const DetailCard = ({ icon: Icon, iconColor, label, value, valueClass = 'text-white', fullWidth = false }) => (
    <div className={`bg-gray-800/60 rounded-xl p-3 border border-white/5 ${fullWidth ? 'col-span-2' : ''}`}>
      <div className="flex items-center gap-2 mb-1.5">
        <Icon className={`w-3.5 h-3.5 ${iconColor || 'text-gray-500'}`} />
        <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">{label}</span>
      </div>
      <p className={`font-semibold text-sm truncate ${valueClass}`}>{value}</p>
    </div>
  )

  // =========================
  // SHARED: Hero monto
  // =========================
  const MontoHero = ({ monto, badgeContent, badgeBg = 'bg-green-500/15 border-green-500/25', badgeTextClass = 'text-green-400', subtitle }) => (
    <div className="mx-5 mb-0 bg-black/25 rounded-2xl px-5 py-4 flex items-center justify-between border border-white/5">
      <div>
        <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Monto</p>
        <span className="text-3xl font-black text-white tracking-tight">{fmtMonto(monto)}</span>
      </div>
      <div className="flex flex-col items-end gap-1">
        {badgeContent && (
          <div className={`flex items-center gap-1.5 border px-3 py-1.5 rounded-full ${badgeBg}`}>
            {badgeContent}
          </div>
        )}
        {subtitle && <span className="text-xs text-gray-500">{subtitle}</span>}
      </div>
    </div>
  )

  // =========================
  // SHARED: Header
  // =========================
  const ModalHeader = ({ icon: Icon, title, subtitle: sub }) => (
    <div className={`bg-gradient-to-br ${t.gradient} px-5 pt-5 pb-4`}>
      {/* Accent bar top */}
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${t.accentBar} opacity-60 rounded-t-2xl`} />
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${t.bg} border ${t.border}`}>
            <Icon className={`w-5 h-5 ${t.color}`} />
          </div>
          <div>
            <span className={`text-[10px] font-bold uppercase tracking-widest ${t.color} opacity-80`}>{t.label}</span>
            <h2 className="text-white font-bold text-lg leading-tight max-w-[220px] truncate">{title}</h2>
            {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
          </div>
        </div>
        <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl transition-colors ml-2 shrink-0">
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  )

  // =========================
  // RENDER: GASTO VARIABLE
  // =========================
  if (type === ITEM_TYPES.VARIABLE) {
    const MetodoIcon = getMetodoIcon(item.metodo)
    const metodoColor = getMetodoColor(item.metodo)

    return (
      <div className="bg-gray-900 rounded-2xl w-full overflow-hidden flex flex-col relative">
        <ModalHeader
          icon={ShoppingCart}
          title={item.descripcion || item.nombre || 'Gasto'}
          subtitle={item.categoria || null}
        />

        <MontoHero
          monto={getMonto()}
          subtitle={item.fecha ? getDiaSemana(item.fecha) : null}
          badgeContent={<><CheckCircle className="w-3.5 h-3.5 text-green-400" /><span className="text-xs font-semibold text-green-400">Pagado</span></>}
        />

        {/* Línea fade */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/8 to-transparent mx-5 mt-4 mb-1" />

        {/* GRID detalles */}
        <div className="px-5 py-3 grid grid-cols-2 gap-2.5">
          {item.fecha && (
            <DetailCard icon={Calendar} iconColor="text-orange-400/70" label="Fecha" value={fmtFechaCorta(item.fecha)} />
          )}
          {item.categoria && (
            <DetailCard icon={Tag} iconColor="text-orange-400/70" label="Categoría" value={item.categoria} />
          )}
          {item.metodo && (
            <DetailCard icon={MetodoIcon} iconColor={metodoColor} label="Método" value={item.metodo} valueClass={metodoColor} />
          )}
          {item.cuenta_nombre && (
            <DetailCard icon={Wallet} iconColor="text-gray-400" label="Cuenta" value={item.cuenta_nombre} />
          )}
          {item.archivado && (
            <div className="col-span-2 flex items-center gap-2 px-3 py-2 bg-gray-700/25 rounded-xl border border-gray-700/40">
              <Clock className="w-3.5 h-3.5 text-gray-500" />
              <span className="text-xs text-gray-500">Archivado · mes anterior</span>
            </div>
          )}
        </div>

        {/* Notas */}
        {item.descripcion && item.descripcion.length > 40 && (
          <div className="mx-5 mb-3 bg-gray-800/40 rounded-xl p-3 border border-white/5">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-3.5 h-3.5 text-gray-500" />
              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Notas</span>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">{item.descripcion}</p>
          </div>
        )}

        {/* Footer */}
        <div className="px-5 pb-5 pt-2">
          <div className="h-px bg-gradient-to-r from-transparent via-white/8 to-transparent mb-3" />
          <button
            onClick={() => onEditar && onEditar(item, type)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-gray-200 hover:text-white rounded-xl font-semibold transition-all border border-white/8 hover:border-white/15 active:scale-95"
          >
            <Edit2 className="w-4 h-4" />
            Editar Gasto
          </button>
        </div>
      </div>
    )
  }

  // =========================
  // RENDER: SUSCRIPCIÓN
  // =========================
  if (type === ITEM_TYPES.SUSCRIPCION) {
    const badgeContent = isSuscripcionPagada
      ? <><CheckCircle className="w-3.5 h-3.5 text-green-400" /><span className="text-xs font-semibold text-green-400">Al día</span></>
      : <><AlertCircle className="w-3.5 h-3.5 text-yellow-400" /><span className="text-xs font-semibold text-yellow-400">Pendiente</span></>

    const badgeBg = isSuscripcionPagada
      ? 'bg-green-500/15 border-green-500/25'
      : 'bg-yellow-500/15 border-yellow-500/25'

    return (
      <div className="bg-gray-900 rounded-2xl w-full overflow-hidden flex flex-col relative">
        <ModalHeader icon={Repeat} title={item.servicio || item.nombre || 'Suscripción'} subtitle={item.ciclo || null} />

        <MontoHero monto={getMonto()} badgeContent={badgeContent} badgeBg={badgeBg} />

        <div className="h-px bg-gradient-to-r from-transparent via-white/8 to-transparent mx-5 mt-4 mb-1" />

        <div className="px-5 py-3 grid grid-cols-2 gap-2.5">
          <DetailCard icon={Calendar} iconColor="text-blue-400/70" label="Próximo Cobro"
            value={item.proximo_pago ? fmtFechaCorta(item.proximo_pago) : '—'}
          />
          <DetailCard icon={Repeat} iconColor="text-blue-400/70" label="Ciclo" value={item.ciclo || '—'} />
          {item.cuenta_nombre && (
            <DetailCard icon={Wallet} iconColor="text-gray-400" label="Cuenta" value={item.cuenta_nombre} />
          )}
          <DetailCard
            icon={CheckCircle}
            iconColor={item.autopago ? 'text-green-400' : 'text-gray-500'}
            label="Autopago"
            value={item.autopago ? 'Activado' : 'Inactivo'}
            valueClass={item.autopago ? 'text-green-400' : 'text-gray-400'}
          />
        </div>

        {item.descripcion && (
          <div className="mx-5 mb-3 bg-gray-800/40 rounded-xl p-3 border border-white/5">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-3.5 h-3.5 text-gray-500" />
              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Notas</span>
            </div>
            <p className="text-gray-300 text-sm">{item.descripcion}</p>
          </div>
        )}

        {/* Footer */}
        <div className="px-5 pb-5 pt-2 space-y-2">
          <div className="h-px bg-gradient-to-r from-transparent via-white/8 to-transparent mb-3" />
          {isSuscripcionPagada ? (
            <>
              <button
                onClick={async () => {
                  const ok = await showConfirm({
                    titulo: 'Undo payment?',
                    mensaje: 'This will return the amount to your account and adjust the next payment date.',
                    textoConfirmar: 'Undo Payment',
                    textoCancel: 'Keep it',
                  });
                  if (!ok) return;
                  onClose();
                  window.deshacerPagoSuscripcion?.(item, type);
                }}
                disabled={isPagando}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-900/20 hover:bg-red-900/40 text-red-400 hover:text-red-300 rounded-xl font-medium transition-all border border-red-900/30 active:scale-95"
              >
                <X className="w-4 h-4" /> Deshacer Pago
              </button>
              <button
                onClick={() => onEditar?.(item, type)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-xl font-medium transition-all border border-white/8 active:scale-95"
              >
                <Edit2 className="w-4 h-4" /> Editar Suscripción
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onPagar?.(item, type)}
                disabled={isPagando}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all border active:scale-95 ${t.bg} ${t.border} ${t.color} ${isPagando ? 'opacity-70 cursor-wait' : 'hover:opacity-90'}`}
              >
                {isPagando ? <><Loader2 className="w-4 h-4 animate-spin" /> Procesando...</> : <><CheckCircle className="w-4 h-4" /> Pagar ahora</>}
              </button>
              <button
                onClick={() => onEditar?.(item, type)}
                disabled={isPagando}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-xl font-medium transition-all border border-white/8 active:scale-95"
              >
                <Edit2 className="w-4 h-4" /> Editar Suscripción
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  // =========================
  // RENDER: GASTO FIJO
  // =========================
  if (type === ITEM_TYPES.FIJO) {
    const badgeContent = isGastoFijoPagado
      ? <><CheckCircle className="w-3.5 h-3.5 text-green-400" /><span className="text-xs font-semibold text-green-400">Pagado</span></>
      : <><AlertCircle className="w-3.5 h-3.5 text-yellow-400" /><span className="text-xs font-semibold text-yellow-400">Pendiente</span></>
    const badgeBg = isGastoFijoPagado ? 'bg-green-500/15 border-green-500/25' : 'bg-yellow-500/15 border-yellow-500/25'

    return (
      <div className="bg-gray-900 rounded-2xl w-full overflow-hidden flex flex-col relative">
        <ModalHeader icon={Calendar} title={item.nombre || 'Gasto Fijo'} subtitle={item.categoria || null} />

        <MontoHero monto={getMonto()} badgeContent={badgeContent} badgeBg={badgeBg} />

        <div className="h-px bg-gradient-to-r from-transparent via-white/8 to-transparent mx-5 mt-4 mb-1" />

        <div className="px-5 py-3 grid grid-cols-2 gap-2.5">
          <DetailCard icon={Calendar} iconColor="text-yellow-400/70" label="Día de Vencimiento"
            value={item.dia_venc ? `Día ${item.dia_venc}` : '—'}
          />
          <DetailCard icon={CheckCircle} iconColor={isGastoFijoPagado ? 'text-green-400' : 'text-yellow-400'} label="Estado"
            value={item.estado || '—'}
            valueClass={isGastoFijoPagado ? 'text-green-400' : 'text-yellow-400'}
          />
          {item.cuenta_nombre && (
            <DetailCard icon={Wallet} iconColor="text-gray-400" label="Cuenta" value={item.cuenta_nombre} />
          )}
          {item.categoria && (
            <DetailCard icon={Tag} iconColor="text-gray-400" label="Categoría" value={item.categoria} />
          )}
        </div>

        {item.descripcion && (
          <div className="mx-5 mb-3 bg-gray-800/40 rounded-xl p-3 border border-white/5">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-3.5 h-3.5 text-gray-500" />
              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Notas</span>
            </div>
            <p className="text-gray-300 text-sm">{item.descripcion}</p>
          </div>
        )}

        <div className="px-5 pb-5 pt-2 space-y-2">
          <div className="h-px bg-gradient-to-r from-transparent via-white/8 to-transparent mb-3" />
          {!isGastoFijoPagado && (
            <button
              onClick={() => onPagar?.(item, type)}
              disabled={isPagando}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all border active:scale-95 ${t.bg} ${t.border} ${t.color} ${isPagando ? 'opacity-70 cursor-wait' : 'hover:opacity-90'}`}
            >
              {isPagando ? <><Loader2 className="w-4 h-4 animate-spin" /> Procesando...</> : <><CheckCircle className="w-4 h-4" /> Marcar Pagado</>}
            </button>
          )}
          <button
            onClick={() => onEditar?.(item, type)}
            disabled={isPagando}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-xl font-medium transition-all border border-white/8 active:scale-95"
          >
            <Edit2 className="w-4 h-4" /> Editar Gasto Fijo
          </button>
        </div>
      </div>
    )
  }

  // =========================
  // RENDER: DEUDA / TARJETA
  // =========================
  if (type === ITEM_TYPES.DEUDA) {
    const saldo = Number(item.saldo || 0)
    const apr = Number(item.apr || 0)
    const limite = Number(item.limite_credito || item.limite || 0)
    const diasGracia = Number(item.dias_gracia || 21)
    const esTarjeta = item.tipo === 'Tarjeta' || !item.tipo

    // Estado y badge
    const estadoTarjeta = getEstadoTarjeta(saldo, item.ultimo_pago)
    const badgeByEstado = {
      green: { content: <><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /><span className="text-xs font-semibold text-emerald-400">Saldada</span></>, bg: 'bg-emerald-500/15 border-emerald-500/25' },
      red:   { content: <><AlertCircle className="w-3.5 h-3.5 text-red-400" /><span className="text-xs font-semibold text-red-400">Con deuda</span></>, bg: 'bg-red-500/15 border-red-500/25' },
      gray:  { content: <><Info className="w-3.5 h-3.5 text-gray-400" /><span className="text-xs font-semibold text-gray-400">{estadoTarjeta.badge}</span></>, bg: 'bg-gray-500/15 border-gray-500/25' },
    }
    const badge = badgeByEstado[estadoTarjeta.color] || badgeByEstado.gray

    // Pagos calculados
    const pagoMinDinamico = calcularPagoMinimo(saldo, apr)
    const aprPct = apr > 1 ? apr : apr * 100  // normalizar
    const interesMensual = saldo * (aprPct / 100 / 12)
    // Pago sugerido: mínimo + 20% extra para reducir capital más rápido
    const pagoSugerido = saldo > 0 ? Math.min(saldo, pagoMinDinamico * 1.5) : 0

    // Uso de crédito
    const usoPorc = calcularUsoCredito(saldo, limite)
    const usoColor = colorUsoCredito(usoPorc)

    // Fechas
    const proximoCorte = calcularProximoCorte(item.vence)
    const fechaLimitePago = calcularFechaLimitePago(proximoCorte, diasGracia)
    const diasHastaCorte = proximoCorte
      ? Math.round((new Date(proximoCorte) - new Date()) / (1000 * 60 * 60 * 24))
      : null
    const diasHastaPago = fechaLimitePago
      ? Math.round((new Date(fechaLimitePago) - new Date()) / (1000 * 60 * 60 * 24))
      : null
    const fmtFecha = (f) => f
      ? new Date(f).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: '2-digit' })
      : null

    // ── Historial: tabs y filtro por mes ──────────────────────
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [histTab, setHistTab] = useState('pagos')
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [mesFiltro, setMesFiltro] = useState(() => {
      const h = new Date()
      return `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, '0')}`
    })

    const [anoFiltro, mesIdxFiltro] = mesFiltro.split('-').map(Number)

    const pagosDelMes = pagos
      .filter(p => {
        if (p.deuda_id !== item.id) return false
        const f = new Date(p.fecha)
        return f.getFullYear() === anoFiltro && f.getMonth() + 1 === mesIdxFiltro
      })
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))

    const comprasDelMes = gastos
      .filter(g => {
        if (g.deuda_id !== item.id) return false
        const f = new Date(g.fecha)
        return f.getFullYear() === anoFiltro && f.getMonth() + 1 === mesIdxFiltro
      })
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))

    const totalPagadoMes = pagosDelMes.reduce((s, p) => s + Number(p.monto_total || 0), 0)
    const totalGastadoMes = comprasDelMes.reduce((s, g) => s + Number(g.monto || 0), 0)

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const mesesDisponibles = useMemo(() => {
      const todos = [
        ...pagos.filter(p => p.deuda_id === item.id).map(p => p.fecha),
        ...gastos.filter(g => g.deuda_id === item.id).map(g => g.fecha),
      ]
      const unicos = [...new Set(todos.map(f => f.slice(0, 7)))].sort().reverse()
      if (!unicos.includes(mesFiltro)) unicos.unshift(mesFiltro)
      return unicos.slice(0, 12)
    }, [pagos, gastos, item.id, mesFiltro])

    // Estado de pago este mes
    const hoy = new Date()
    const pagadaEsteMes = pagos.filter(p => p.deuda_id === item.id).some(p => {
      const f = new Date(p.fecha)
      return f.getMonth() === hoy.getMonth() && f.getFullYear() === hoy.getFullYear()
    })

    // Estado del vencimiento
    let estadoVenceLabel = null
    let estadoVenceClass = 'text-gray-400'
    if (diasHastaPago !== null) {
      if (diasHastaPago < 0) { estadoVenceLabel = 'VENCIDO'; estadoVenceClass = 'text-red-400 font-black' }
      else if (diasHastaPago === 0) { estadoVenceLabel = 'VENCE HOY'; estadoVenceClass = 'text-red-400 font-black' }
      else if (diasHastaPago <= 3) { estadoVenceLabel = `En ${diasHastaPago}d`; estadoVenceClass = 'text-orange-400 font-bold' }
      else if (diasHastaPago <= 7) { estadoVenceLabel = `En ${diasHastaPago}d`; estadoVenceClass = 'text-yellow-400 font-bold' }
      else { estadoVenceLabel = `En ${diasHastaPago}d`; estadoVenceClass = 'text-emerald-400' }
    }

    return (
      <div className="bg-gray-900 rounded-2xl w-full overflow-hidden flex flex-col relative">

        {/* HEADER */}
        <ModalHeader icon={CreditCard} title={item.cuenta || item.nombre || 'Tarjeta'} subtitle={item.tipo || 'Tarjeta de Crédito'} />

        {/* ── HERO: Saldo + estado ──────────────────────────── */}
        <div className="mx-4 mb-0 rounded-2xl overflow-hidden border border-white/6"
          style={{ background: 'linear-gradient(135deg, rgba(88,28,135,0.25) 0%, rgba(17,24,39,0.8) 100%)' }}>
          <div className="px-5 pt-4 pb-3 flex items-start justify-between">
            <div>
              <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-1">Saldo actual</p>
              <p className="text-4xl font-black text-white tracking-tight leading-none">
                {fmtMonto(saldo)}
              </p>
              {limite > 0 && (
                <p className="text-[11px] text-gray-500 mt-1">de {fmtMonto(limite)} disponibles</p>
              )}
            </div>
            <div className="flex flex-col items-end gap-1.5 mt-1">
              <div className={`flex items-center gap-1.5 border px-3 py-1.5 rounded-full ${badge.bg}`}>
                {badge.content}
              </div>
              {pagadaEsteMes && (
                <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
                  <CheckCircle className="w-3 h-3" /> Pagada este mes
                </div>
              )}
            </div>
          </div>

          {/* Barra uso de crédito */}
          {esTarjeta && usoPorc !== null && usoColor && (
            <div className="px-5 pb-4">
              <div className="flex justify-between text-[10px] mb-1.5">
                <span className="text-gray-500">Uso de crédito</span>
                <span className={`font-bold ${usoColor.text}`}>{usoPorc}% · {usoColor.label}</span>
              </div>
              <div className="h-2 rounded-full bg-white/8 overflow-hidden">
                <div className={`h-full rounded-full ${usoColor.bar} transition-all duration-700`}
                  style={{ width: `${usoPorc}%` }} />
              </div>
              {usoPorc >= 70 && (
                <div className="flex items-center gap-1 mt-1.5">
                  <AlertTriangle className="w-3 h-3 text-red-400 flex-shrink-0" />
                  <span className="text-[10px] text-red-400">Uso alto afecta tu score crediticio</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── GRID: Fechas y APR ────────────────────────────── */}
        <div className="px-4 pt-3 grid grid-cols-2 gap-2">

          {/* APR */}
          {apr > 0 && (
            <div className="bg-gray-800/60 rounded-xl p-3 border border-white/5">
              <div className="flex items-center gap-1.5 mb-1">
                <Percent className="w-3 h-3 text-red-400" />
                <span className="text-[9px] text-gray-500 uppercase tracking-wider font-semibold">APR Anual</span>
              </div>
              <p className="text-sm font-bold text-red-400">{(aprPct).toFixed(1)}%</p>
              <p className="text-[9px] text-gray-600 mt-0.5">Interés mensual: {fmtMonto(interesMensual)}</p>
            </div>
          )}

          {/* Límite de crédito */}
          {limite > 0 && (
            <div className="bg-gray-800/60 rounded-xl p-3 border border-white/5">
              <div className="flex items-center gap-1.5 mb-1">
                <Shield className="w-3 h-3 text-purple-400" />
                <span className="text-[9px] text-gray-500 uppercase tracking-wider font-semibold">Límite</span>
              </div>
              <p className="text-sm font-bold text-white">{fmtMonto(limite)}</p>
              {usoPorc !== null && (
                <p className="text-[9px] text-gray-600 mt-0.5">Disponible: {fmtMonto(limite - saldo)}</p>
              )}
            </div>
          )}

          {/* Fecha de corte */}
          {proximoCorte && (
            <div className="bg-gray-800/60 rounded-xl p-3 border border-white/5">
              <div className="flex items-center gap-1.5 mb-1">
                <Calendar className="w-3 h-3 text-blue-400" />
                <span className="text-[9px] text-gray-500 uppercase tracking-wider font-semibold">Próx. Corte</span>
              </div>
              <p className="text-sm font-bold text-white">{fmtFecha(proximoCorte)}</p>
              {diasHastaCorte !== null && (
                <p className={`text-[9px] mt-0.5 ${diasHastaCorte <= 3 ? 'text-orange-400 font-bold' : 'text-gray-600'}`}>
                  {diasHastaCorte === 0 ? 'Hoy' : diasHastaCorte === 1 ? 'Mañana' : `en ${diasHastaCorte}d`}
                </p>
              )}
            </div>
          )}

          {/* Fecha límite de pago */}
          {fechaLimitePago && (
            <div className={`rounded-xl p-3 border ${
              diasHastaPago !== null && diasHastaPago <= 3
                ? 'bg-red-900/20 border-red-500/20'
                : diasHastaPago !== null && diasHastaPago <= 7
                ? 'bg-orange-900/20 border-orange-500/20'
                : 'bg-gray-800/60 border-white/5'
            }`}>
              <div className="flex items-center gap-1.5 mb-1">
                <AlertCircle className={`w-3 h-3 ${diasHastaPago !== null && diasHastaPago <= 7 ? 'text-orange-400' : 'text-gray-500'}`} />
                <span className="text-[9px] text-gray-500 uppercase tracking-wider font-semibold">Pagar antes de</span>
              </div>
              <p className="text-sm font-bold text-white">{fmtFecha(fechaLimitePago)}</p>
              {estadoVenceLabel && (
                <p className={`text-[9px] mt-0.5 font-semibold ${estadoVenceClass}`}>{estadoVenceLabel}</p>
              )}
            </div>
          )}

          {/* Último pago */}
          {item.ultimo_pago && (
            <div className="bg-gray-800/60 rounded-xl p-3 border border-white/5">
              <div className="flex items-center gap-1.5 mb-1">
                <CheckCircle className="w-3 h-3 text-emerald-400" />
                <span className="text-[9px] text-gray-500 uppercase tracking-wider font-semibold">Último Pago</span>
              </div>
              <p className="text-sm font-bold text-white">{fmtFecha(item.ultimo_pago)}</p>
            </div>
          )}
        </div>

        {/* ── PAGOS SUGERIDOS ───────────────────────────────── */}
        {saldo > 0 && (
          <div className="mx-4 mt-3 rounded-2xl overflow-hidden border border-white/6"
            style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(17,24,39,0.6) 100%)' }}>
            <div className="px-4 pt-3 pb-1">
              <p className="text-[9px] text-gray-500 uppercase tracking-widest font-semibold mb-2.5 flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-emerald-400" /> Pagos recomendados
              </p>
              <div className="grid grid-cols-3 gap-2 pb-3">
                {/* Pago mínimo */}
                <div className="text-center">
                  <p className="text-[9px] text-gray-500 mb-1">Mínimo</p>
                  <p className="text-[13px] font-black text-yellow-400">{fmtMonto(pagoMinDinamico)}</p>
                  <p className="text-[8px] text-gray-600 mt-0.5">Solo intereses</p>
                </div>
                {/* Pago sugerido */}
                <div className="text-center border-x border-white/6">
                  <p className="text-[9px] text-gray-500 mb-1">Sugerido</p>
                  <p className="text-[13px] font-black text-emerald-400">{fmtMonto(pagoSugerido)}</p>
                  <p className="text-[8px] text-gray-600 mt-0.5">Reduce capital</p>
                </div>
                {/* Pago total */}
                <div className="text-center">
                  <p className="text-[9px] text-gray-500 mb-1">Total</p>
                  <p className="text-[13px] font-black text-blue-400">{fmtMonto(saldo)}</p>
                  <p className="text-[8px] text-gray-600 mt-0.5">Saldo 0</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── HISTORIAL COMPLETO: Tabs Pagos / Compras ─────── */}
        {(pagos.some(p => p.deuda_id === item.id) || gastos.some(g => g.deuda_id === item.id)) && (
          <div className="mx-4 mt-3">

            {/* TABS */}
            <div className="flex gap-1 mb-3 bg-gray-800/60 rounded-xl p-1">
              {[
                { key: 'pagos', label: 'Pagos', count: pagos.filter(p => p.deuda_id === item.id).length, color: 'text-purple-400' },
                { key: 'compras', label: 'Compras', count: gastos.filter(g => g.deuda_id === item.id).length, color: 'text-orange-400' },
              ].map(tab => (
                <button key={tab.key}
                  onClick={() => setHistTab(tab.key)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-bold transition-all touch-manipulation ${
                    histTab === tab.key ? 'bg-gray-700 text-white' : 'text-gray-500'
                  }`}
                >
                  {tab.label}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 ${histTab === tab.key ? tab.color : 'text-gray-600'}`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* FILTRO POR MES */}
            {mesesDisponibles.length > 0 && (
              <div className="flex items-center gap-2 mb-2.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                {mesesDisponibles.map(mes => {
                  const [a, m] = mes.split('-')
                  const label = new Date(Number(a), Number(m) - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
                  return (
                    <button key={mes}
                      onClick={() => setMesFiltro(mes)}
                      className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all touch-manipulation ${
                        mesFiltro === mes ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400'
                      }`}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            )}

            {/* RESUMEN DEL MES */}
            {histTab === 'pagos' && pagosDelMes.length > 0 && (
              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-purple-500/8 border border-purple-500/15 mb-2">
                <span className="text-[10px] text-gray-400">{pagosDelMes.length} {pagosDelMes.length === 1 ? 'pago' : 'pagos'}</span>
                <span className="text-[12px] font-black text-emerald-400">{fmtMonto(totalPagadoMes)}</span>
              </div>
            )}
            {histTab === 'compras' && comprasDelMes.length > 0 && (
              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-orange-500/8 border border-orange-500/15 mb-2">
                <span className="text-[10px] text-gray-400">{comprasDelMes.length} {comprasDelMes.length === 1 ? 'compra' : 'compras'}</span>
                <span className="text-[12px] font-black text-orange-400">{fmtMonto(totalGastadoMes)}</span>
              </div>
            )}

            {/* LISTA DE PAGOS */}
            {histTab === 'pagos' && (
              <div className="space-y-1.5">
                {pagosDelMes.length === 0 ? (
                  <div className="text-center py-6 text-gray-600 text-[11px]">Sin pagos registrados este mes</div>
                ) : pagosDelMes.map((p, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-gray-800/50 border border-white/5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold text-white">{fmtMonto(p.monto_total || p.monto || 0)}</p>
                        <p className="text-[9px] text-gray-500">{fmtFecha(p.fecha)}{p.metodo ? ` · ${p.metodo}` : ''}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {p.a_principal > 0 && <p className="text-[9px] text-emerald-600">Capital: {fmtMonto(p.a_principal)}</p>}
                      {p.intereses > 0 && <p className="text-[9px] text-red-400/70">Interés: {fmtMonto(p.intereses)}</p>}
                      {p.metodo && !p.a_principal && !p.intereses && <p className="text-[9px] text-gray-600">{p.metodo}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* LISTA DE COMPRAS */}
            {histTab === 'compras' && (
              <div className="space-y-1.5">
                {comprasDelMes.length === 0 ? (
                  <div className="text-center py-6 text-gray-600 text-[11px]">Sin compras registradas este mes</div>
                ) : comprasDelMes.map((g, i) => {
                  const cat = (g.categoria || 'Otro').replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}]/gu, '').trim()
                  return (
                    <div key={i} className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-gray-800/50 border border-white/5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-orange-500/10 border border-orange-500/15 flex items-center justify-center flex-shrink-0">
                          <ShoppingCart className="w-3.5 h-3.5 text-orange-400" />
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold text-white leading-tight max-w-[150px] truncate">
                            {g.descripcion || cat}
                          </p>
                          <p className="text-[9px] text-gray-500">{cat} · {fmtFecha(g.fecha)}</p>
                        </div>
                      </div>
                      <p className="text-[12px] font-bold text-orange-300">{fmtMonto(g.monto)}</p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Notas */}
        {item.descripcion && (
          <div className="mx-4 mt-3 bg-gray-800/40 rounded-xl p-3 border border-white/5">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-3.5 h-3.5 text-gray-500" />
              <span className="text-[9px] text-gray-500 uppercase tracking-wider font-semibold">Notas</span>
            </div>
            <p className="text-gray-300 text-xs leading-relaxed">{item.descripcion}</p>
          </div>
        )}

        {/* ── ACCIONES ─────────────────────────────────────── */}
        <div className="px-4 pb-5 pt-3 space-y-2">
          <div className="h-px bg-gradient-to-r from-transparent via-white/8 to-transparent mb-3" />
          {saldo > 0 && (
            <button
              onClick={() => onPagar?.(item, type)}
              disabled={isPagando}
              className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl font-bold transition-all border active:scale-[0.98] touch-manipulation bg-purple-600/20 border-purple-500/30 text-purple-300 hover:bg-purple-600/30"
            >
              {isPagando
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Procesando...</>
                : <><CreditCard className="w-4 h-4" /> Registrar Pago</>}
            </button>
          )}
          <button
            onClick={() => onEditar?.(item, type)}
            disabled={isPagando}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-xl font-medium transition-all border border-white/8 active:scale-[0.98] touch-manipulation"
          >
            <Edit2 className="w-4 h-4" /> Editar Tarjeta
          </button>
          {saldo > 0 && diasHastaPago !== null && diasHastaPago <= 5 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-orange-500/8 border border-orange-500/15">
              <AlertTriangle className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
              <p className="text-[10px] text-orange-300 leading-snug">
                Paga antes del {fmtFecha(fechaLimitePago)} para evitar cargos por mora
              </p>
              <ChevronRight className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
            </div>
          )}
        </div>
      </div>
    )
  }

  // =========================
  // RENDER: FALLBACK (por si acaso)
  // =========================
  return (
    <div className="bg-gray-900 rounded-2xl w-full overflow-hidden flex flex-col relative">
      <div className="p-5 flex items-center justify-between border-b border-white/10">
        <h2 className="text-white font-bold">{getTitle()}</h2>
        <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 text-gray-400 rounded-xl"><X className="w-5 h-5" /></button>
      </div>
      <div className="p-5">
        <p className="text-3xl font-black text-white">{fmtMonto(getMonto())}</p>
      </div>
      <div className="px-5 pb-5">
        <button onClick={() => onEditar?.(item, type)} className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-semibold border border-white/8 active:scale-95 flex items-center justify-center gap-2">
          <Edit2 className="w-4 h-4" /> Editar
        </button>
      </div>
    </div>
  )
}
