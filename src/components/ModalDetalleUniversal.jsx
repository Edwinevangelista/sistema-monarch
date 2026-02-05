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
  Repeat
} from 'lucide-react'

export default function ModalDetalleUniversal({
  item,
  type,
  status,
  onClose,
  onEditar,
  onPagar
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
  const isPagado = (type === ITEM_TYPES.FIJO && item.estado === 'Pagado')

  // =========================
  // Render
  // =========================
  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl w-full max-w-lg border border-gray-700 shadow-2xl overflow-hidden">
        
        {/* --- HEADER --- */}
        <div className="bg-gray-800/50 border-b border-gray-700 p-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl shadow-sm ${currentTheme.bg} ${currentTheme.border}`}>
              <IconComponent className={`w-6 h-6 ${currentTheme.color}`} />
            </div>
            <div>
              <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">{currentTheme.label}</span>
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
        <div className="p-8 text-center bg-gradient-to-b from-gray-900 to-gray-800/50">
          <div className="mb-2">
            <span className="text-sm font-medium text-gray-400">Saldo / Monto</span>
          </div>
          <div className={`text-4xl md:text-5xl font-bold tracking-tight ${currentTheme.color} drop-shadow-lg`}>
            ${getMonto().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        {/* --- DETALLES GRID --- */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-800/30">
          
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
        <div className="p-6 bg-gray-900/80 border-t border-gray-700 grid grid-cols-2 gap-4">
          
          {/* Botón Secundario (Editar) */}
          <button
            onClick={() => onEditar(item, type)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-semibold transition-all border border-gray-600 active:scale-95"
          >
            <Edit2 className="w-4 h-4" />
            Editar
          </button>

          {/* Botón Primario (Pagar / Gestionar) */}
          <button
            onClick={() => onPagar ? onPagar(item, type) : onEditar(item, type)}
            disabled={isPagado}
            className={`
              w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all border active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
              ${isPagado 
                ? 'bg-green-600/20 text-green-400 border-green-600/30 cursor-default' 
                : `${currentTheme.bg} ${currentTheme.border} hover:opacity-90 text-white cursor-pointer`
              }
            `}
          >
            {isPagado ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Pagado
              </>
            ) : (
              <>
                {type === ITEM_TYPES.DEUDA ? <CreditCard className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                {type === ITEM_TYPES.DEUDA ? 'Registrar Pago' : (type === ITEM_TYPES.FIJO ? 'Marcar Pagado' : 'Gestionar')}
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  )
}