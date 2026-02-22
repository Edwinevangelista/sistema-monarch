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
  MapPin,
  Clock,
  TrendingDown,
  ArrowDownCircle,
  Receipt
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

  const getSubtitle = () => {
    return item.categoria || item.tipo || 'Registro financiero'
  }

  // Colores y Estilos por Tipo
  const theme = {
    debt: { color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30', icon: CreditCard, label: 'Deuda', gradient: 'from-purple-900/30 to-gray-900' },
    fixed: { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', icon: Calendar, label: 'Gasto Fijo', gradient: 'from-yellow-900/20 to-gray-900' },
    subscription: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', icon: Repeat, label: 'Suscripción', gradient: 'from-blue-900/30 to-gray-900' },
    income: { color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30', icon: Wallet, label: 'Ingreso', gradient: 'from-green-900/20 to-gray-900' },
    variable: { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', icon: ShoppingCart, label: 'Gasto Variable', gradient: 'from-orange-900/20 to-gray-900' },
    default: { color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/30', icon: Info, label: 'Detalle', gradient: 'from-gray-800 to-gray-900' }
  }

  const currentTheme =
    type === ITEM_TYPES.DEUDA ? theme.debt :
    type === ITEM_TYPES.FIJO ? theme.fixed :
    type === ITEM_TYPES.SUSCRIPCION ? theme.subscription :
    type === ITEM_TYPES.VARIABLE ? theme.variable :
    theme.default

  const IconComponent = currentTheme.icon

  // =========================
  // Lógica de Estado
  // =========================
  const isGastoFijoPagado = (type === ITEM_TYPES.FIJO && item.estado === 'Pagado')

  let isSuscripcionPagada = false
  if (type === ITEM_TYPES.SUSCRIPCION) {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const proximoPagoStr = item.proximo_pago || hoy.toISOString().split('T')[0];
    const proximoPago = new Date(proximoPagoStr + 'T00:00:00');
    proximoPago.setHours(0, 0, 0, 0);
    const esMesSiguiente = (
      proximoPago.getFullYear() > hoy.getFullYear() ||
      (proximoPago.getFullYear() === hoy.getFullYear() && proximoPago.getMonth() > hoy.getMonth())
    );
    isSuscripcionPagada = esMesSiguiente;
  }

  const isPagado = isGastoFijoPagado || isSuscripcionPagada

  // =========================
  // Helpers de formato
  // =========================
  const formatFecha = (fechaStr) => {
    if (!fechaStr) return null
    const fecha = new Date(fechaStr + 'T00:00:00')
    return fecha.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  }

  const getDiaSemana = (fechaStr) => {
    if (!fechaStr) return null
    const fecha = new Date(fechaStr + 'T00:00:00')
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
    return dias[fecha.getDay()]
  }

  const getMetodoIcon = (metodo) => {
    if (!metodo) return Banknote
    if (metodo.toLowerCase().includes('débito') || metodo.toLowerCase().includes('debito')) return CreditCard
    if (metodo.toLowerCase().includes('tarjeta') || metodo.toLowerCase().includes('crédito')) return CreditCard
    if (metodo.toLowerCase().includes('transferencia')) return ArrowDownCircle
    if (metodo.toLowerCase().includes('efectivo')) return Banknote
    return Receipt
  }

  const getMetodoColor = (metodo) => {
    if (!metodo) return 'text-gray-400'
    if (metodo.toLowerCase().includes('débito') || metodo.toLowerCase().includes('debito')) return 'text-blue-400'
    if (metodo.toLowerCase().includes('crédito') || metodo.toLowerCase().includes('tarjeta')) return 'text-purple-400'
    if (metodo.toLowerCase().includes('efectivo')) return 'text-green-400'
    if (metodo.toLowerCase().includes('transferencia')) return 'text-cyan-400'
    return 'text-gray-300'
  }

  // =========================
  // RENDER: GASTO VARIABLE (diseño especial)
  // =========================
  if (type === ITEM_TYPES.VARIABLE) {
    const monto = getMonto()
    const MetodoIcon = getMetodoIcon(item.metodo)
    const metodoColor = getMetodoColor(item.metodo)

    return (
      <div className="bg-gray-900 rounded-2xl w-full overflow-hidden flex flex-col">

        {/* HEADER compacto */}
        <div className={`bg-gradient-to-r ${currentTheme.gradient} px-5 pt-5 pb-0 relative`}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${currentTheme.bg} border ${currentTheme.border}`}>
                <ShoppingCart className={`w-5 h-5 ${currentTheme.color}`} />
              </div>
              <div>
                <span className={`text-[10px] font-bold uppercase tracking-widest ${currentTheme.color} opacity-80`}>Gasto Variable · Registrado</span>
                <h2 className="text-white font-bold text-lg leading-tight">
                  {item.descripcion || item.nombre || 'Gasto'}
                </h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* MONTO HERO — compacto y con badge de estado */}
          <div className="bg-black/20 rounded-2xl px-5 py-4 mb-0 flex items-center justify-between border border-white/5">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Monto gastado</p>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-black text-white tracking-tight">
                  ${monto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-sm text-gray-500 mb-1">MXN</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-1.5 bg-green-500/15 border border-green-500/25 px-3 py-1.5 rounded-full">
                <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                <span className="text-xs font-semibold text-green-400">Pagado</span>
              </div>
              {item.fecha && (
                <span className="text-xs text-gray-500">{getDiaSemana(item.fecha)}</span>
              )}
            </div>
          </div>

          {/* Línea divisoria con fade */}
          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mt-4" />
        </div>

        {/* DETALLES — grid compacto */}
        <div className="px-5 py-4 space-y-3">

          {/* Fila 1: Fecha + Categoría */}
          <div className="grid grid-cols-2 gap-3">
            {item.fecha && (
              <div className="bg-gray-800/60 rounded-xl p-3 border border-white/5">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-3.5 h-3.5 text-gray-500" />
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Fecha</span>
                </div>
                <p className="text-white font-semibold text-sm">
                  {new Date(item.fecha + 'T00:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
            )}
            {item.categoria && (
              <div className="bg-gray-800/60 rounded-xl p-3 border border-white/5">
                <div className="flex items-center gap-2 mb-1">
                  <Tag className="w-3.5 h-3.5 text-gray-500" />
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Categoría</span>
                </div>
                <p className="text-white font-semibold text-sm truncate">{item.categoria}</p>
              </div>
            )}
          </div>

          {/* Fila 2: Método de pago + Cuenta */}
          <div className="grid grid-cols-2 gap-3">
            {item.metodo && (
              <div className="bg-gray-800/60 rounded-xl p-3 border border-white/5">
                <div className="flex items-center gap-2 mb-1">
                  <MetodoIcon className="w-3.5 h-3.5 text-gray-500" />
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Método</span>
                </div>
                <p className={`font-semibold text-sm ${metodoColor}`}>{item.metodo}</p>
              </div>
            )}
            {item.cuenta_nombre && (
              <div className="bg-gray-800/60 rounded-xl p-3 border border-white/5">
                <div className="flex items-center gap-2 mb-1">
                  <Wallet className="w-3.5 h-3.5 text-gray-500" />
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Cuenta</span>
                </div>
                <p className="text-white font-semibold text-sm truncate">{item.cuenta_nombre}</p>
              </div>
            )}
          </div>

          {/* Descripción / Notas (si existe y es diferente al título) */}
          {item.descripcion && item.descripcion !== getTitle() && (
            <div className="bg-gray-800/40 rounded-xl p-3 border border-white/5">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Notas</span>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">{item.descripcion}</p>
            </div>
          )}

          {/* Fila archivado (solo si aplica) */}
          {item.archivado && (
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-700/30 rounded-xl border border-gray-600/30">
              <Clock className="w-3.5 h-3.5 text-gray-500" />
              <span className="text-xs text-gray-500">Archivado — mes anterior</span>
            </div>
          )}
        </div>

        {/* FOOTER — solo botón Editar */}
        <div className="px-5 pb-5 pt-1">
          <div className="h-px bg-gradient-to-r from-transparent via-white/8 to-transparent mb-4" />
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
  // RENDER: RESTO DE TIPOS (original mejorado)
  // =========================
  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl w-full border border-gray-700 shadow-2xl overflow-hidden flex flex-col max-h-full">

      {/* --- HEADER --- */}
      <div className="bg-gray-800/50 border-b border-gray-700 p-5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl shadow-sm ${currentTheme.bg} ${currentTheme.border}`}>
            <IconComponent className={`w-6 h-6 ${currentTheme.color}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">{currentTheme.label}</span>

              {/* BADGE DE ESTADO PARA TARJETAS */}
              {type === ITEM_TYPES.DEUDA && (() => {
                const estadoTarjeta = getEstadoTarjeta(item.saldo, item.ultimo_pago)
                return (
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                    estadoTarjeta.color === 'green'
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : estadoTarjeta.color === 'red'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                  }`}>
                    {estadoTarjeta.badge}
                  </span>
                )
              })()}
            </div>

            <h2 className="text-xl font-bold text-white leading-tight mt-0.5">
              {getTitle()}
            </h2>
            <p className="text-sm text-gray-400">{getSubtitle()}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 bg-gray-700/50 hover:bg-gray-700 text-gray-400 hover:text-white rounded-lg transition-colors"
          title="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* --- HERO SECTION (MONTO) --- */}
      <div className="p-8 text-center bg-gradient-to-b from-gray-900 to-gray-800/50 shrink-0">
        <div className="mb-2">
          <span className="text-sm font-medium text-gray-400">Saldo / Monto</span>
        </div>
        <div className={`text-4xl md:text-5xl font-bold tracking-tight ${currentTheme.color} drop-shadow-lg`}>
          ${getMonto().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      </div>

      {/* --- DETALLES GRID --- */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-800/30 overflow-y-auto custom-scrollbar flex-1">

        {/* 1. Suscripciones */}
        {type === ITEM_TYPES.SUSCRIPCION && (
          <>
            <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-xl border border-gray-700">
              <Repeat className="w-5 h-5 text-blue-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-gray-500 font-semibold uppercase">Ciclo</p>
                <p className="text-white font-medium">{item.ciclo}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-xl border border-gray-700">
              <Calendar className="w-5 h-5 text-blue-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-gray-500 font-semibold uppercase">Próximo Cobro</p>
                <p className="text-white font-medium">
                  {item.proximo_pago ? new Date(item.proximo_pago).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : '-'}
                </p>
              </div>
            </div>
          </>
        )}

        {/* 2. Deudas */}
        {type === ITEM_TYPES.DEUDA && (
          <>
            <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-xl border border-gray-700">
              <Info className="w-5 h-5 text-purple-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-gray-500 font-semibold uppercase">Estado</p>
                <p className={`font-medium ${status ? 'text-green-400' : 'text-yellow-400'}`}>
                  {status ? status.label : 'Activa'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-xl border border-gray-700">
              <CreditCard className="w-5 h-5 text-purple-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-gray-500 font-semibold uppercase">Tarjeta</p>
                <p className="text-white font-medium">{item.cuenta}</p>
              </div>
            </div>
          </>
        )}

        {/* 3. Fijos */}
        {type === ITEM_TYPES.FIJO && (
          <>
            <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-xl border border-gray-700">
              <Calendar className="w-5 h-5 text-yellow-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-gray-500 font-semibold uppercase">Vencimiento</p>
                <p className="text-white font-medium">Día {item.dia_venc}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-xl border border-gray-700">
              <CheckCircle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-gray-500 font-semibold uppercase">Estado</p>
                <p className={`font-medium ${item.estado === 'Pagado' ? 'text-green-400' : 'text-yellow-400'}`}>
                  {item.estado}
                </p>
              </div>
            </div>
          </>
        )}

        {/* 4. Ingresos */}
        {type === ITEM_TYPES.INGRESO && item.fecha && (
          <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-xl border border-gray-700 md:col-span-2">
            <Calendar className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-gray-500 font-semibold uppercase">Fecha del Movimiento</p>
              <p className="text-white font-medium">
                {new Date(item.fecha + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
          </div>
        )}

        {/* --- DESCRIPCIÓN / CUENTA (Full Width) --- */}
        <div className="col-span-1 md:col-span-2 mt-2">
          <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700 space-y-3">

            {/* Cuenta */}
            {item.cuenta_nombre && (
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-gray-400" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 font-semibold uppercase">Cuenta Asociada</p>
                  <p className="text-white font-medium">{item.cuenta_nombre}</p>
                </div>
              </div>
            )}

            {/* Descripción */}
            {item.descripcion && (
              <div className="flex items-start gap-3 mt-2 pt-2 border-t border-gray-700">
                <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 font-semibold uppercase">Notas / Descripción</p>
                  <p className="text-gray-300 text-sm leading-relaxed">{item.descripcion}</p>
                </div>
              </div>
            )}

            {/* Metadata Suscripción */}
            {type === ITEM_TYPES.SUSCRIPCION && (
              <div className="flex items-center gap-4 mt-2 pt-2 border-t border-gray-700 text-sm">
                 <span className="text-gray-400">Autopago: {item.autopago ? 'Activado' : 'Inactivo'}</span>
                 {item.autopago && <span className="text-green-500 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Automático</span>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- BOTONES DE ACCIÓN --- */}
      <div className="p-6 bg-gray-900/80 border-t border-gray-700 grid grid-cols-1 gap-4 shrink-0">

        {/* Mensaje de Estado (Si está pagado) */}
        {type === ITEM_TYPES.SUSCRIPCION && isPagado && (
          <div className="w-full p-3 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center justify-between animate-in fade-in zoom-in duration-300">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <div>
                <p className="text-xs text-green-300 font-semibold uppercase">Pagado en</p>
                <p className="text-white text-sm font-medium">{item.cuenta_nombre || 'Cuenta Asociada'}</p>
              </div>
            </div>
            <button
              onClick={() => onEditar ? onEditar(item, type) : null}
              className="text-xs text-gray-400 hover:text-white underline transition-colors"
            >
              Ver cuenta
            </button>
          </div>
        )}

        {/* BOTÓN PRINCIPAL (Pagar / Registrar) */}
        {type === ITEM_TYPES.SUSCRIPCION ? (
          // --- BOTÓN ESPECIAL PARA SUSCRIPCIÓN ---
          isPagado ? (
            <>
              <button
                onClick={() => {
                  if (window.confirm('¿Deshacer el pago de esta suscripción?\n\nEsto devolverá el dinero a tu cuenta y ajustará la fecha de próximo pago.')) {
                    onClose();
                    if (window.deshacerPagoSuscripcion) {
                      window.deshacerPagoSuscripcion(item, type);
                    } else {
                      alert('⚠️ Función no disponible. Recarga la página.');
                    }
                  }
                }}
                disabled={isPagando}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-900/20 hover:bg-red-900/40 text-red-400 hover:text-red-300 rounded-xl font-medium transition-all border border-red-900/30 hover:border-red-900/50 active:scale-95"
              >
                <X className="w-4 h-4" />
                Deshacer Pago (Revertir)
              </button>

              <button
                onClick={() => onEditar ? onEditar(item, type) : null}
                disabled={isPagando}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-700/50 hover:bg-gray-700 text-gray-300 rounded-xl font-medium transition-all border border-gray-600 active:scale-95"
              >
                <Repeat className="w-4 h-4" />
                Gestionar Ciclo / Editar
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onPagar ? onPagar(item, type) : null}
                disabled={isPagando}
                className={`
                  w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all border active:scale-95
                  ${currentTheme.bg} ${currentTheme.border} ${currentTheme.color}
                  ${isPagando ? 'opacity-70 cursor-wait' : 'hover:opacity-90'}
                `}
              >
                {isPagando ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Procesando pago...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Pagar
                  </>
                )}
              </button>

              <button
                onClick={() => onEditar(item, type)}
                disabled={isPagando}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-semibold transition-all border border-gray-600 active:scale-95 disabled:opacity-50"
              >
                <Edit2 className="w-4 h-4" />
                Editar Datos
              </button>
            </>
          )
        ) : (
          // --- BOTÓN ESTÁNDAR PARA DEUDAS Y FIJOS ---
          <>
            <button
              onClick={() => onPagar ? onPagar(item, type) : onEditar(item, type)}
              disabled={isPagado || isPagando}
              className={`
                w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all border active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
                ${isPagado
                  ? 'bg-green-600/20 text-green-400 border-green-600/30 cursor-default'
                  : `${currentTheme.bg} ${currentTheme.border} hover:opacity-90 text-white cursor-pointer`
                }
              `}
            >
              {isPagando ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Procesando...
                </>
              ) : isPagado ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Pagado
                </>
              ) : (
                <>
                  {type === ITEM_TYPES.DEUDA ? <CreditCard className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                  {type === ITEM_TYPES.DEUDA ? 'Registrar Pago' : (type === ITEM_TYPES.FIJO ? 'Marcar Pagado' : 'Registrar Pago')}
                </>
              )}
            </button>

            {/* BOTÓN SECUNDARIO: Editar */}
            <button
              onClick={() => onEditar(item, type)}
              disabled={isPagando}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-semibold transition-all border border-gray-600 active:scale-95 disabled:opacity-50"
            >
              <Edit2 className="w-4 h-4" />
              Editar Datos
            </button>
          </>
        )}
      </div>

    </div>
  )
}
