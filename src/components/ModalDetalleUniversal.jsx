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
  TrendingDown,
  AlertCircle
} from 'lucide-react'

import { getEstadoTarjeta } from '../utils/tarjetasCalculos'

export default function ModalDetalleUniversal({
  item,
  type,
  status,
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
    `$${Number(n).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const fmtFechaCorta = (fechaStr) => {
    if (!fechaStr) return null
    return new Date(fechaStr + 'T00:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
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
  const isPagado = isGastoFijoPagado || isSuscripcionPagada

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
                onClick={() => { if (window.confirm('¿Deshacer el pago?\n\nEsto devolverá el dinero a tu cuenta y ajustará la fecha de próximo pago.')) { onClose(); window.deshacerPagoSuscripcion?.(item, type) } }}
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
    const estadoTarjeta = getEstadoTarjeta(item.saldo, item.ultimo_pago)
    const badgeByEstado = {
      green: { content: <><CheckCircle className="w-3.5 h-3.5 text-green-400" /><span className="text-xs font-semibold text-green-400">{estadoTarjeta.badge}</span></>, bg: 'bg-green-500/15 border-green-500/25' },
      red:   { content: <><AlertCircle className="w-3.5 h-3.5 text-red-400" /><span className="text-xs font-semibold text-red-400">{estadoTarjeta.badge}</span></>, bg: 'bg-red-500/15 border-red-500/25' },
      gray:  { content: <><Info className="w-3.5 h-3.5 text-gray-400" /><span className="text-xs font-semibold text-gray-400">{estadoTarjeta.badge}</span></>, bg: 'bg-gray-500/15 border-gray-500/25' },
    }
    const badge = badgeByEstado[estadoTarjeta.color] || badgeByEstado.gray

    return (
      <div className="bg-gray-900 rounded-2xl w-full overflow-hidden flex flex-col relative">
        <ModalHeader icon={CreditCard} title={item.cuenta || item.nombre || 'Tarjeta'} subtitle={item.tipo || null} />

        <MontoHero monto={getMonto()} badgeContent={badge.content} badgeBg={badge.bg} subtitle="Saldo actual" />

        <div className="h-px bg-gradient-to-r from-transparent via-white/8 to-transparent mx-5 mt-4 mb-1" />

        <div className="px-5 py-3 grid grid-cols-2 gap-2.5">
          {item.limite && (
            <DetailCard icon={TrendingDown} iconColor="text-purple-400/70" label="Límite de Crédito" value={fmtMonto(item.limite)} />
          )}
          {item.ultimo_pago && (
            <DetailCard icon={Calendar} iconColor="text-purple-400/70" label="Último Pago" value={fmtFechaCorta(item.ultimo_pago)} />
          )}
          {item.proximo_pago && (
            <DetailCard icon={Calendar} iconColor="text-gray-400" label="Próximo Pago" value={fmtFechaCorta(item.proximo_pago)} />
          )}
          {item.cuenta_nombre && (
            <DetailCard icon={Wallet} iconColor="text-gray-400" label="Banco / Cuenta" value={item.cuenta_nombre} />
          )}
          {status && (
            <DetailCard icon={Info} iconColor="text-purple-400/70" label="Estado" value={status.label || 'Activa'} valueClass="text-green-400" />
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
          <button
            onClick={() => onPagar?.(item, type)}
            disabled={isPagando}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all border active:scale-95 ${t.bg} ${t.border} ${t.color} ${isPagando ? 'opacity-70 cursor-wait' : 'hover:opacity-90'}`}
          >
            {isPagando ? <><Loader2 className="w-4 h-4 animate-spin" /> Procesando...</> : <><CreditCard className="w-4 h-4" /> Registrar Pago</>}
          </button>
          <button
            onClick={() => onEditar?.(item, type)}
            disabled={isPagando}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-xl font-medium transition-all border border-white/8 active:scale-95"
          >
            <Edit2 className="w-4 h-4" /> Editar Deuda
          </button>
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
