import React, { useState } from 'react';
import {
  Home,
  ShoppingCart,
  CreditCard,
  Repeat,
  MoreHorizontal,
  X,
  Settings,
  Bell,
  LogOut,
  User,
  Upload
} from 'lucide-react';

// eslint-disable-next-line no-unused-vars
import { Upload } from "lucide-react";


const MenuInferior = ({ onOpenModal, alertasCount, nombreUsuario, onLogout }) => {
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  return (
    <>
      {/* Menú Principal */}
      <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 pb-safe pt-2 px-2 z-50 md:hidden shadow-2xl">
        <div className="flex justify-between items-center px-2">
          <button className="flex flex-col items-center p-2 text-blue-400">
            <Home className="w-6 h-6" />
            <span className="text-[10px] mt-1">Inicio</span>
          </button>

          <button
            onClick={() => onOpenModal('gastos')}
            className="flex flex-col items-center p-2 text-red-400"
          >
            <ShoppingCart className="w-6 h-6" />
            <span className="text-[10px] mt-1">Gastos</span>
          </button>

          <button
            onClick={() => onOpenModal('tarjetas')}
            className="flex flex-col items-center justify-center -mt-6 bg-purple-600 rounded-full w-14 h-14 shadow-lg border-4 border-gray-900"
          >
            <CreditCard className="w-7 h-7 text-white" />
          </button>

          <button
            onClick={() => onOpenModal('suscripcion')}
            className="flex flex-col items-center p-2 text-indigo-400"
          >
            <Repeat className="w-6 h-6" />
            <span className="text-[10px] mt-1">Suscripciones</span>
          </button>

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

      {/* Menú Más */}
      {showMoreMenu && (
        <div
          className="fixed inset-0 bg-black/70 z-[60] md:hidden"
          onClick={() => setShowMoreMenu(false)}
        >
          <div
            className="fixed bottom-0 left-0 right-0 bg-gray-800 rounded-t-3xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white text-xl font-bold">Más Opciones</h3>
              <button onClick={() => setShowMoreMenu(false)}>
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowMoreMenu(false);
                  onOpenModal('ingreso');
                }}
                className="w-full flex items-center gap-4 p-4 bg-green-600/20 border border-green-600/30 rounded-xl"
              >
                <Home className="w-6 h-6 text-white" />
                <div>
                  <p className="text-white font-semibold">Registrar Ingreso</p>
                  <p className="text-gray-400 text-sm">Añadir entrada de dinero</p>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowMoreMenu(false);
                  onOpenModal('notificaciones');
                }}
                className="w-full flex items-center gap-4 p-4 bg-yellow-600/20 border border-yellow-600/30 rounded-xl"
              >
                <Bell className="w-6 h-6 text-white" />
                <div className="flex-1">
                  <p className="text-white font-semibold">Notificaciones</p>
                  <p className="text-gray-400 text-sm">Ver alertas</p>
                </div>
                {alertasCount > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 rounded-full">
                    {alertasCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  setShowMoreMenu(false);
                  onOpenModal('configuracion');
                }}
                className="w-full flex items-center gap-4 p-4 bg-gray-700 border border-gray-600 rounded-xl"
              >
                <Settings className="w-6 h-6 text-white" />
                <div>
                  <p className="text-white font-semibold">Configuración</p>
                  <p className="text-gray-400 text-sm">Ajustes del sistema</p>
                </div>
              </button>

              {/* 👤 PERFIL — AHORA FUNCIONA */}
              <button
                onClick={() => {
                  setShowMoreMenu(false);
                  onOpenModal('usuario');
                }}
                className="w-full flex items-center gap-4 p-4 bg-blue-600/20 border border-blue-600/30 rounded-xl"
              >
                <User className="w-6 h-6 text-white" />
                <div className="flex-1">
                  <p className="text-white font-semibold">{nombreUsuario}</p>
                  <p className="text-gray-400 text-sm">Ver perfil y datos</p>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowMoreMenu(false);
                  onLogout();
                }}
                className="w-full flex items-center gap-4 p-4 bg-red-600/20 border border-red-600/30 rounded-xl"
              >
                <LogOut className="w-6 h-6 text-white" />
                <div>
                  <p className="text-white font-semibold">Cerrar sesión</p>
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
