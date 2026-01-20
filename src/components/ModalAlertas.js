import React, { useEffect, useMemo } from 'react'
import { 
  X, AlertTriangle, Clock, Calendar, ChevronRight, 
  ChevronLeft, Bell, CheckCircle2, Flame, CreditCard, 
  Repeat
} from 'lucide-react'

export default function ModalAlertas({ alertas = [], onClose, onAlertClick }) {

  // 🔒 Bloqueo de scroll
  useEffect(() => {
    const scrollY = window.scrollY
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.left = '0'
    document.body.style.right = '0'
    document.body.style.width = '100%'
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.left = ''
      document.body.style.right = ''
      document.body.style.width = ''
      document.body.style.overflow = ''
      window.scrollTo(0, scrollY)
    }
  }, [])

  // ✅ SIMPLIFICADO: Las alertas ya vienen con 'dias' calculado desde el Dashboard
  const alertasOrganizadas = useMemo(() => {
    if (!alertas || alertas.length === 0) return []
    
    // Ya vienen ordenadas desde el Dashboard, pero por si acaso
    return [...alertas].sort((a, b) => a.dias - b.dias)
  }, [alertas])

  const getAlertStyle = (dias) => {
    if (dias < 0) {
      return {
        bg: 'bg-gradient-to-r from-red-900/40 to-red-800/20',
        border: 'border-red-500/40',
        text: 'text-red-400',
        icon: <Flame className="w-5 h-5 text-red-400" />,
        badge: 'bg-red-500 text-white',
        badgeText: 'VENCIDO'
      }
    }
    if (dias === 0) {
      return {
        bg: 'bg-gradient-to-r from-orange-900/40 to-orange-800/20',
        border: 'border-orange-500/40',
        text: 'text-orange-400',
        icon: <AlertTriangle className="w-5 h-5 text-orange-400" />,
        badge: 'bg-orange-500 text-white',
        badgeText: 'HOY'
      }
    }
    if (dias === 1) {
      return {
        bg: 'bg-gradient-to-r from-yellow-900/30 to-yellow-800/20',
        border: 'border-yellow-500/40',
        text: 'text-yellow-400',
        icon: <Clock className="w-5 h-5 text-yellow-400" />,
        badge: 'bg-yellow-500 text-black',
        badgeText: 'MAÑANA'
      }
    }
    return {
      bg: 'bg-gradient-to-r from-blue-900/30 to-blue-800/20',
      border: 'border-blue-500/30',
      text: 'text-blue-400',
      icon: <Calendar className="w-5 h-5 text-blue-400" />,
      badge: 'bg-blue-500 text-white',
      badgeText: `${dias} DÍAS`
    }
  }

  const getItemIcon = (alerta) => {
    if (alerta.tipoItem === 'deuda') return <CreditCard className="w-4 h-4" />
    if (alerta.tipoItem === 'suscripcion') return <Repeat className="w-4 h-4" />
    return <Calendar className="w-4 h-4" />
  }

  const totalVencidas = alertasOrganizadas.filter(a => a.dias < 0).length
  const totalPorVencer = alertasOrganizadas.filter(a => a.dias >= 0).length

  return (
    <>
      {/* OVERLAY - z-index muy alto para estar sobre todo */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        style={{ zIndex: 99998 }}
        onClick={onClose}
      />

      {/* MODAL CONTAINER */}
      <div 
        className="fixed inset-0 flex items-end md:items-center md:justify-center"
        style={{ zIndex: 99999 }}
      >
        <div
          className="w-full h-full md:w-[95%] md:max-w-lg md:h-auto md:max-h-[85vh]
                     bg-gray-900 md:rounded-2xl shadow-2xl
                     border-t md:border border-white/10
                     flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >

          {/* HEADER FIJO */}
          <div className="flex-shrink-0 bg-gray-900 border-b border-white/10 px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Botón atrás mobile */}
                <button 
                  onClick={onClose}
                  className="p-2 -ml-2 text-gray-400 hover:text-white active:bg-gray-800 rounded-xl transition-colors md:hidden"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                
                <div className="relative">
                  <div className="p-2.5 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl shadow-lg">
                    <Bell className="w-5 h-5 text-white" />
                  </div>
                  {alertas.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-gray-900">
                      {alertas.length}
                    </span>
                  )}
                </div>
                
                <div>
                  <h2 className="text-lg font-bold text-white">Alertas de Pagos</h2>
                  <p className="text-xs text-gray-400">
                    {totalVencidas > 0 && <span className="text-red-400">{totalVencidas} vencido{totalVencidas > 1 ? 's' : ''}</span>}
                    {totalVencidas > 0 && totalPorVencer > 0 && ' • '}
                    {totalPorVencer > 0 && <span className="text-yellow-400">{totalPorVencer} por vencer</span>}
                    {alertas.length === 0 && 'Sin alertas pendientes'}
                  </p>
                </div>
              </div>
              
              {/* Botón cerrar desktop */}
              <button
                onClick={onClose}
                className="hidden md:flex p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* CONTENIDO SCROLLEABLE */}
          <div 
            className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-3"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            
            {/* Estado vacío */}
            {alertas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="p-6 bg-emerald-500/10 rounded-full mb-6 border border-emerald-500/20">
                  <CheckCircle2 className="w-16 h-16 text-emerald-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">¡Todo al día!</h3>
                <p className="text-gray-400 max-w-xs">
                  No tienes pagos vencidos ni próximos a vencer.
                </p>
              </div>
            ) : (
              <>
                {/* Lista de alertas */}
                {alertasOrganizadas.map((alerta, idx) => {
                  const style = getAlertStyle(alerta.dias)
                  
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        if (onAlertClick) {
                          onAlertClick(alerta)
                        }
                      }}
                      className={`w-full p-4 rounded-2xl border text-left
                                  transition-all active:scale-[0.98] hover:brightness-110
                                  ${style.bg} ${style.border}`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Icono */}
                        <div className="p-2.5 bg-black/20 rounded-xl flex-shrink-0">
                          {style.icon}
                        </div>
                        
                        {/* Contenido */}
                        <div className="flex-1 min-w-0">
                          {/* Badge de tiempo */}
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${style.badge}`}>
                              {style.badgeText}
                            </span>
                            <span className="text-[10px] text-gray-500 flex items-center gap-1">
                              {getItemIcon(alerta)}
                              {alerta.tipoItem === 'deuda' ? 'Tarjeta' : 
                               alerta.tipoItem === 'suscripcion' ? 'Suscripción' : 'Gasto Fijo'}
                            </span>
                          </div>
                          
                          {/* Nombre del item */}
                          <h4 className="text-white font-semibold text-sm truncate">
                            {alerta.item?.nombre || alerta.item?.servicio || alerta.item?.cuenta || 'Pago pendiente'}
                          </h4>
                          
                          {/* ✅ Mensaje - ya viene correcto desde Dashboard */}
                          <p className="text-gray-400 text-xs mt-0.5 line-clamp-1">
                            {alerta.mensaje}
                          </p>
                        </div>
                        
                        {/* Monto y flecha */}
                        <div className="flex flex-col items-end flex-shrink-0">
                          <span className={`text-lg font-bold ${style.text}`}>
                            ${Number(alerta.monto || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </span>
                          <ChevronRight className="w-4 h-4 text-gray-500 mt-1" />
                        </div>
                      </div>
                      
                      {/* Barra de urgencia para vencidos */}
                      {alerta.dias < 0 && (
                        <div className="mt-3 h-1 bg-red-900/50 rounded-full overflow-hidden">
                          <div className="h-full bg-red-500 rounded-full animate-pulse w-full" />
                        </div>
                      )}
                    </button>
                  )
                })}

                {/* Resumen */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Total pendiente:</span>
                    <span className="text-xl font-bold text-white">
                      ${alertas.reduce((sum, a) => sum + Number(a.monto || 0), 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* FOOTER MOBILE */}
          <div className="md:hidden flex-shrink-0 p-4 border-t border-white/10 bg-gray-900">
            <button
              onClick={onClose}
              className="w-full py-3.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-semibold transition-colors"
            >
              Cerrar
            </button>
          </div>

        </div>
      </div>
    </>
  )
}