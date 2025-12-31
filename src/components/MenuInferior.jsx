import React, { useState } from 'react';
import { Home, ShoppingCart, CreditCard, Repeat, MoreHorizontal, X, Settings, Upload, Bell, LogOut, User } from 'lucide-react';

const MenuInferior = ({ onOpenModal, alertasCount, nombreUsuario, onLogout }) => {
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  return (
    <>
      {/* Menú Principal */}
      <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 pb-safe pt-2 px-2 z-50 md:hidden shadow-2xl">
        <div className="flex justify-between items-center px-2">
          {/* Home */}
          <button className="flex flex-col items-center p-2 text-blue-400">
            <Home className="w-6 h-6" />
            <span className="text-[10px] mt-1">Inicio</span>
          </button>

          {/* Gastos (Variable/Fijo) */}
          <button 
            onClick={() => onOpenModal('gastos')}
            className="flex flex-col items-center p-2 text-red-400"
          >
            <ShoppingCart className="w-6 h-6" />
            <span className="text-[10px] mt-1">Gastos</span>
          </button>

          {/* Botón Central - Tarjetas */}
          <button 
            onClick={() => onOpenModal('tarjetas')}
            className="flex flex-col items-center justify-center -mt-6 bg-purple-600 rounded-full w-14 h-14 shadow-lg border-4 border-gray-900"
          >
            <CreditCard className="w-7 h-7 text-white" />
          </button>

          {/* Suscripciones */}
          <button 
            onClick={() => onOpenModal('suscripcion')}
            className="flex flex-col items-center p-2 text-indigo-400"
          >
            <Repeat className="w-6 h-6" />
            <span className="text-[10px] mt-1">Suscripciones</span>
          </button>

          {/* Más Opciones */}
          <button 
            onClick={() => setShowMoreMenu(true)}
            className="flex flex-col items-center p-2 text-gray-400 relative"
          >
            <MoreHorizontal className="w-6 h-6" />
            {alertasCount > 0 && (
              <span className="absolute top-1 right-1 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                {alertasCount}
              </span>
            )}
            <span className="text-[10px] mt-1">Más</span>
          </button>
        </div>
      </nav>

      {/* Menú "Más" (Slide-up) */}
      {showMoreMenu && (
        <div className="fixed inset-0 bg-black/70 z-[60] md:hidden" onClick={() => setShowMoreMenu(false)}>
          <div 
            className="fixed bottom-0 left-0 right-0 bg-gray-800 rounded-t-3xl p-6 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white text-xl font-bold">Más Opciones</h3>
              <button 
                onClick={() => setShowMoreMenu(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Ingreso */}
              <button
                onClick={() => {
                  setShowMoreMenu(false);
                  onOpenModal('ingreso');
                }}
                className="w-full flex items-center gap-4 p-4 bg-green-600/20 border border-green-600/30 rounded-xl hover:bg-green-600/30 transition-colors"
              >
                <div className="bg-green-600 p-3 rounded-xl">
                  <Home className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-white font-semibold">Registrar Ingreso</p>
                  <p className="text-gray-400 text-sm">Añadir entrada de dinero</p>
                </div>
              </button>

              {/* Notificaciones */}
              <button
                onClick={() => {
                  setShowMoreMenu(false);
                  onOpenModal('notificaciones');
                }}
                className="w-full flex items-center gap-4 p-4 bg-yellow-600/20 border border-yellow-600/30 rounded-xl hover:bg-yellow-600/30 transition-colors relative"
              >
                <div className="bg-yellow-600 p-3 rounded-xl">
                  <Bell className="w-6 h-6 text-white" />
                </div>
                <div className="text-left flex-1">
                  <p className="text-white font-semibold">Notificaciones</p>
                  <p className="text-gray-400 text-sm">Ver alertas y recordatorios</p>
                </div>
                {alertasCount > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    {alertasCount}
                  </span>
                )}
              </button>

              {/* Configuración */}
              <button
                onClick={() => {
                  setShowMoreMenu(false);
                  onOpenModal('configuracion');
                }}
                className="w-full flex items-center gap-4 p-4 bg-gray-700/50 border border-gray-600 rounded-xl hover:bg-gray-700 transition-colors"
              >
                <div className="bg-gray-600 p-3 rounded-xl">
                  <Settings className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-white font-semibold">Configuración</p>
                  <p className="text-gray-400 text-sm">Notificaciones push y ajustes</p>
                </div>
              </button>

              {/* Premium: Escanear Estado */}
              <button
                onClick={() => {
                  setShowMoreMenu(false);
                  onOpenModal('lectorEstado');
                }}
                className="w-full flex items-center gap-4 p-4 bg-gradient-to-r from-cyan-600/20 to-blue-600/20 border border-cyan-500/30 rounded-xl hover:from-cyan-600/30 hover:to-blue-600/30 transition-colors relative overflow-hidden"
              >
                <div className="bg-gradient-to-r from-cyan-600 to-blue-600 p-3 rounded-xl">
                  <Upload className="w-6 h-6 text-white" />
                </div>
                <div className="text-left flex-1">
                  <p className="text-white font-semibold flex items-center gap-2">
                    Escanear Estado
                    <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      PREMIUM
                    </span>
                  </p>
                  <p className="text-gray-400 text-sm">OCR de estados de cuenta</p>
                </div>
              </button>

              {/* Perfil */}
              <button
                onClick={() => {
                  setShowMoreMenu(false);
                  // Aquí puedes agregar modal de perfil
                }}
                className="w-full flex items-center gap-4 p-4 bg-gray-700/50 border border-gray-600 rounded-xl hover:bg-gray-700 transition-colors"
              >
                <div className="bg-blue-600 p-3 rounded-xl">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div className="text-left flex-1">
                  <p className="text-white font-semibold">{nombreUsuario}</p>
                  <p className="text-gray-400 text-sm">Ver perfil y datos</p>
                </div>
              </button>

              {/* Cerrar Sesión */}
              <button
                onClick={() => {
                  setShowMoreMenu(false);
                  onLogout();
                }}
                className="w-full flex items-center gap-4 p-4 bg-red-600/20 border border-red-600/30 rounded-xl hover:bg-red-600/30 transition-colors"
              >
                <div className="bg-red-600 p-3 rounded-xl">
                  <LogOut className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-white font-semibold">Cerrar Sesión</p>
                  <p className="text-gray-400 text-sm">Salir de tu cuenta</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MenuInferior;