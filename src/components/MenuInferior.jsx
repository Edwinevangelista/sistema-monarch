// src/components/MenuInferior.jsx
// CORRECCIÓN: Removido 'Upload' del import (línea 13)

import React from 'react'
import { Home, DollarSign, CreditCard, User, Bell } from 'lucide-react'

export default function MenuInferior({ onOpenModal, alertasCount = 0, nombreUsuario = 'Usuario', onLogout }) {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-lg border-t border-gray-800 z-50">
      <div className="flex justify-around items-center h-16 px-2">
        {/* INICIO */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-colors flex-1"
        >
          <Home className="w-5 h-5" />
          <span className="text-xs">Inicio</span>
        </button>

        {/* INGRESOS */}
        <button
          onClick={() => onOpenModal('ingreso')}
          className="flex flex-col items-center gap-1 text-gray-400 hover:text-green-400 transition-colors flex-1"
        >
          <DollarSign className="w-5 h-5" />
          <span className="text-xs">Ingresos</span>
        </button>

        {/* GASTOS */}
        <button
          onClick={() => onOpenModal('gastos')}
          className="flex flex-col items-center gap-1 text-gray-400 hover:text-red-400 transition-colors flex-1"
        >
          <CreditCard className="w-5 h-5" />
          <span className="text-xs">Gastos</span>
        </button>

        {/* ALERTAS */}
        <button
          onClick={() => onOpenModal('notificaciones')}
          className="flex flex-col items-center gap-1 text-gray-400 hover:text-yellow-400 transition-colors flex-1 relative"
        >
          <Bell className="w-5 h-5" />
          {alertasCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
              {alertasCount}
            </span>
          )}
          <span className="text-xs">Alertas</span>
        </button>

        {/* USUARIO */}
        <button
          onClick={() => onOpenModal('usuario')}
          className="flex flex-col items-center gap-1 text-gray-400 hover:text-blue-400 transition-colors flex-1"
        >
          <User className="w-5 h-5" />
          <span className="text-xs">{nombreUsuario}</span>
        </button>
      </div>
    </div>
  )
}