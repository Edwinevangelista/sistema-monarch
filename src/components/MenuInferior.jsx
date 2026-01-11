import React, { useState } from 'react'
import { 
  Home, 
  DollarSign, 
  CreditCard, 
  User, 
  Bell, 
  Repeat, 
  Upload, 
  Menu, 
  Wallet 
} from 'lucide-react'

export default function MenuInferior({ onOpenModal, alertasCount = 0, nombreUsuario = 'Usuario', onLogout }) {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <>
      {/* Menú Principal */}
      {/* ✅ z-[60] asegura que el botón se vea por encima de los modales */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-lg border-t border-gray-800 z-[60]">
        <div className="flex justify-around items-center h-16 px-2">
          
          {/* ✅ INICIO (Cierra modales y sube arriba) */}
          <button
            onClick={() => {
              setShowMenu(false)
              // Cierra cualquier modal abierto
              onOpenModal(null)
              // Scroll arriba
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-colors flex-1"
          >
            <Home className="w-5 h-5" />
            <span className="text-xs">Inicio</span>
          </button>

          {/* INGRESOS */}
          <button
            onClick={() => {
              setShowMenu(false)
              onOpenModal('ingreso')
            }}
            className="flex flex-col items-center gap-1 text-gray-400 hover:text-green-400 transition-colors flex-1"
          >
            <DollarSign className="w-5 h-5" />
            <span className="text-xs">Ingresos</span>
          </button>

          {/* GASTOS */}
          <button
            onClick={() => {
              setShowMenu(false)
              onOpenModal('gastos')
            }}
            className="flex flex-col items-center gap-1 text-gray-400 hover:text-red-400 transition-colors flex-1"
          >
            <CreditCard className="w-5 h-5" />
            <span className="text-xs">Gastos</span>
          </button>

          {/* ✅ ALERTAS (Lleva a la sección de Alertas en el Dashboard) */}
          <button
            onClick={() => {
              setShowMenu(false)
              const element = document.getElementById('dashboard-alertas');
              if (element) {
                // Hacemos un pequeño offset para que la barra no tape el título
                window.scrollTo({ top: element.offsetTop - 80, behavior: 'smooth' });
              }
            }}
            className="flex flex-col items-center gap-1 text-gray-400 hover:text-yellow-400 transition-colors flex-1 relative"
          >
            <Bell className="w-5 h-5" />
            {alertasCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                {alertasCount > 9 ? '9+' : alertasCount}
              </span>
            )}
            {/* ✅ Texto cambiado de "Perfil" a "Alertas" */}
            <span className="text-xs">Alertas</span>
          </button>

          {/* MENÚ MÁS */}
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex flex-col items-center gap-1 text-gray-400 hover:text-purple-400 transition-colors flex-1"
          >
            <Menu className="w-5 h-5" />
            <span className="text-xs">Más</span>
          </button>
        </div>
      </div>

      {/* ✅ MENÚ EXPANDIDO (Accesos directos) */}
      {showMenu && (
        <>
          {/* Overlay */}
          <div 
            className="md:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
            onClick={() => setShowMenu(false)}
          />
          
          {/* Panel de opciones */}
          <div className="md:hidden fixed bottom-16 left-0 right-0 bg-gray-800 border-t border-gray-700 z-50 animate-in slide-in-from-bottom duration-200 shadow-2xl">
            <div className="p-4">
              <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-3 px-2">
                Más Opciones
              </h3>
              
              <div className="grid grid-cols-1 gap-2">
                {/* Cuentas Bancarias */}
                <button
                  onClick={() => {
                    setShowMenu(false)
                    onOpenModal('cuentas')
                  }}
                  className="flex items-center gap-3 p-3 bg-gray-700 hover:bg-blue-600 rounded-xl transition-colors text-left w-full"
                >
                  <Wallet className="w-5 h-5 text-blue-400" />
                  <div>
                    <div className="text-white font-semibold text-sm">Cuentas</div>
                    <div className="text-gray-400 text-xs">Gestionar saldo y tarjetas</div>
                  </div>
                </button>

                {/* Suscripciones */}
                <button
                  onClick={() => {
                    setShowMenu(false)
                    onOpenModal('suscripcion')
                  }}
                  className="flex items-center gap-3 p-3 bg-gray-700 hover:bg-indigo-600 rounded-xl transition-colors text-left w-full"
                >
                  <Repeat className="w-5 h-5 text-indigo-400" />
                  <div>
                    <div className="text-white font-semibold text-sm">Suscripción</div>
                    <div className="text-gray-400 text-xs">Servicios recurrentes</div>
                  </div>
                </button>

                {/* Tarjetas */}
                <button
                  onClick={() => {
                    setShowMenu(false)
                    onOpenModal('tarjetas')
                  }}
                  className="flex items-center gap-3 p-3 bg-gray-700 hover:bg-purple-600 rounded-xl transition-colors text-left w-full"
                >
                  <CreditCard className="w-5 h-5 text-purple-400" />
                  <div>
                    <div className="text-white font-semibold text-sm">Tarjetas</div>
                    <div className="text-gray-400 text-xs">Gestionar deudas</div>
                  </div>
                </button>

                {/* Escáner Premium */}
                <button
                  onClick={() => {
                    setShowMenu(false)
                    onOpenModal('lectorEstado')
                  }}
                  className="flex items-center gap-3 p-3 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 rounded-xl transition-colors text-left w-full relative overflow-hidden"
                >
                  <Upload className="w-5 h-5 text-white" />
                  <div>
                    <div className="text-white font-semibold text-sm flex items-center gap-1">
                      Escáner
                      <span className="text-[8px] bg-yellow-400 text-yellow-900 px-1.5 py-0.5 rounded-full font-bold">PRO</span>
                    </div>
                    <div className="text-yellow-100 text-xs">Analizar estados de cuenta</div>
                  </div>
                </button>

                {/* ✅ Configuración / Perfil */}
                <button
                  onClick={() => {
                    setShowMenu(false)
                    onOpenModal('usuario')
                  }}
                  className="flex items-center gap-3 p-3 bg-gray-700 hover:bg-green-600 rounded-xl transition-colors text-left w-full"
                >
                  <User className="w-5 h-5 text-green-400" />
                  <div>
                    <div className="text-white font-semibold text-sm">Mi Perfil</div>
                    <div className="text-gray-400 text-xs">Hola, {nombreUsuario}</div>
                  </div>
                </button>
              </div>

              {/* Botón cerrar */}
              <button
                onClick={() => setShowMenu(false)}
                className="w-full mt-2 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-semibold transition-colors text-sm"
              >
                Cerrar
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}