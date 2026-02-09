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
  Loader2 
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
    debt: { color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30', icon: CreditCard, label: 'Deuda' },
    fixed: { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', icon: Calendar, label: 'Gasto Fijo' },
    subscription: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', icon: Repeat, label: 'Suscripción' },
    income: { color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30', icon: Wallet, label: 'Ingreso' },
    variable: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', icon: FileText, label: 'Gasto' },
    default: { color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/30', icon: Info, label: 'Detalle' }
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

  // 1. Estado estándar (Gastos Fijos)
  const isGastoFijoPagado = (type === ITEM_TYPES.FIJO && item.estado === 'Pagado')

  // 2. Estado Dinámico (Suscripciones) - LÓGICA PROFESIONAL
  let isSuscripcionPagada = false

  if (type === ITEM_TYPES.SUSCRIPCION) {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    const proximoPagoStr = item.proximo_pago || hoy.toISOString().split('T')[0];
    const proximoPago = new Date(proximoPagoStr + 'T00:00:00');
    proximoPago.setHours(0, 0, 0, 0);
    
    // ✅ LÓGICA CORRECTA: Está pagada si proximo_pago está en mes/año siguiente
    const esMesSiguiente = (
      proximoPago.getFullYear() > hoy.getFullYear() ||
      (proximoPago.getFullYear() === hoy.getFullYear() && proximoPago.getMonth() > hoy.getMonth())
    );
    
    isSuscripcionPagada = esMesSiguiente;
  }

  // Estado global
  const isPagado = isGastoFijoPagado || isSuscripcionPagada

  // =========================
  // Render
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
      
      {/* 👉 BADGE DE ESTADO PARA TARJETAS */}
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
        
        {/* Detalles Específicos según Tipo */}
        
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

        {/* 4. Variables / Ingresos */}
        {(type === ITEM_TYPES.VARIABLE || type === ITEM_TYPES.INGRESO) && item.fecha && (
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
            // ✅ SUSCRIPCIÓN PAGADA - Mostrar botón DESHACER
            <>
              {/* BOTÓN DESHACER PAGO */}
              <button
                onClick={() => {
                  if (window.confirm('¿Deshacer el pago de esta suscripción?\n\nEsto devolverá el dinero a tu cuenta y ajustará la fecha de próximo pago.')) {
                    onClose(); // Cerrar modal primero
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

              {/* BOTÓN SECUNDARIO: Editar Datos */}
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
            // Si está pendiente, mostramos botón PAGAR
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

              {/* BOTÓN SECUNDARIO: Editar Datos */}
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
          // --- BOTÓN ESTÁNDAR PARA DEMÁS (DEUDAS, FIJOS, VARIABLES) ---
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