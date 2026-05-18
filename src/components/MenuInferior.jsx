import React, { useState } from 'react';
import {
  Home,
  Bell,
  MoreHorizontal,
  Wallet,
  ScanLine,
  Sparkles,
  User,
  X,
  BarChart2,
  CreditCard,
  Repeat,
  Plus,
} from 'lucide-react';

export default function MenuInferior({ onOpenModal, onOpenExport, alertasCount = 0, coberturaBadge = 0, nombreUsuario = 'Usuario', onLogout }) {
  const [showMenu, setShowMenu] = useState(false);

  const handleOpenModal = (modalName) => {
    setShowMenu(false);
    setTimeout(() => onOpenModal(modalName), 50);
  };

  const handleExportAction = () => {
    setShowMenu(false);
    setTimeout(() => onOpenExport?.(), 50);
  };

  const herramientas = [
    { id: 'cuentas',      icon: Wallet,     label: 'Cuentas',     color: 'text-blue-400',   badge: coberturaBadge > 0 },
    { id: 'suscripcion',  icon: Repeat,     label: 'Suscrip.',    color: 'text-indigo-400', badge: false },
    { id: 'tarjetas',     icon: CreditCard, label: 'Tarjetas',    color: 'text-purple-400', badge: false },
    { id: '_export',      icon: BarChart2,  label: 'Reportes',    color: 'text-emerald-400',badge: false },
    { id: 'lectorEstado', icon: ScanLine,   label: 'Escáner',     color: 'text-yellow-400', badge: false, tag: 'PRO' },
    { id: 'usuario',      icon: User,       label: 'Perfil',      color: 'text-gray-300',   badge: false },
  ];

  return (
    <>
      {/* ── BARRA INFERIOR ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 safe-area-bottom">
        {/* Fondo con blur */}
        <div className="absolute inset-0 bg-gray-950/90 backdrop-blur-xl border-t border-white/8" />

        <div className="relative flex justify-around items-center h-16 px-2">

          {/* Inicio */}
          <button
            onClick={() => { setShowMenu(false); onOpenModal(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="flex flex-col items-center justify-center gap-0.5 text-white/30 hover:text-white/70 transition-colors flex-1 py-2 touch-manipulation"
          >
            <Home className="w-[22px] h-[22px]" />
            <span className="text-[10px] font-medium">Inicio</span>
          </button>

          {/* Alertas */}
          <button
            onClick={() => handleOpenModal('alertas')}
            className="flex flex-col items-center justify-center gap-0.5 text-white/30 hover:text-yellow-400 active:text-yellow-400 transition-colors flex-1 py-2 relative touch-manipulation"
          >
            <div className="relative">
              <Bell className="w-[22px] h-[22px]" />
              {alertasCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[8px] font-bold flex items-center justify-center rounded-full border-2 border-gray-950">
                  {alertasCount > 9 ? '9+' : alertasCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium">Alertas</span>
          </button>

          {/* FAB central — Agregar */}
          <button
            onClick={() => handleOpenModal('gastos')}
            className="flex flex-col items-center justify-center touch-manipulation -mt-5"
          >
            <div className="w-13 h-13 w-[52px] h-[52px] bg-white/10 hover:bg-white/15 border border-white/20 rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-all">
              <Plus className="w-6 h-6 text-white/80" />
            </div>
            <span className="text-[10px] font-medium text-white/30 mt-1">Agregar</span>
          </button>

          {/* Perfil */}
          <button
            onClick={() => handleOpenModal('usuario')}
            className="flex flex-col items-center justify-center gap-0.5 text-white/30 hover:text-white/70 transition-colors flex-1 py-2 touch-manipulation"
          >
            <User className="w-[22px] h-[22px]" />
            <span className="text-[10px] font-medium">Perfil</span>
          </button>

          {/* Más */}
          <button
            onClick={() => setShowMenu(!showMenu)}
            className={`flex flex-col items-center justify-center gap-0.5 transition-colors flex-1 py-2 touch-manipulation ${
              showMenu ? 'text-white/80' : 'text-white/30 hover:text-white/70'
            }`}
          >
            {showMenu
              ? <X className="w-[22px] h-[22px]" />
              : <MoreHorizontal className="w-[22px] h-[22px]" />
            }
            <span className="text-[10px] font-medium">{showMenu ? 'Cerrar' : 'Más'}</span>
          </button>

        </div>
      </div>

      {/* ── MENÚ EXPANDIDO ── */}
      {showMenu && (
        <>
          {/* Overlay */}
          <div
            className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-in fade-in duration-150"
            onClick={() => setShowMenu(false)}
          />

          {/* Panel */}
          <div
            className="md:hidden fixed left-3 right-3 z-50 bg-gray-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-200"
          style={{ bottom: 'calc(4rem + env(safe-area-inset-bottom, 0px))' }}
          >
            <div className="p-4">

              {/* Saludo rápido */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-gray-500">Conectado como</p>
                  <p className="text-sm font-bold text-white">{nombreUsuario}</p>
                </div>
                <button
                  onClick={() => handleOpenModal('asistente')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600/30 to-pink-600/30 border border-purple-500/30 rounded-full text-xs font-semibold text-purple-300 hover:from-purple-600/40 hover:to-pink-600/40 transition-all active:scale-95 touch-manipulation"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  IA Financiera
                </button>
              </div>

              {/* Grid de herramientas */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                {herramientas.map(({ id, icon: Icon, label, color, badge, tag }) => (
                  <button
                    key={id}
                    onClick={() => id === '_export' ? handleExportAction() : handleOpenModal(id)}
                    className="relative flex flex-col items-center gap-2 p-3.5 bg-white/5 hover:bg-white/10 active:scale-95 rounded-2xl border border-white/8 transition-all touch-manipulation group"
                  >
                    {badge && (
                      <span className="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full border border-gray-900 animate-pulse" />
                    )}
                    {tag && (
                      <span className="absolute top-1.5 right-1.5 text-[7px] font-bold bg-white/20 text-white px-1.5 py-0.5 rounded-full">
                        {tag}
                      </span>
                    )}
                    <Icon className={`w-6 h-6 ${color} group-hover:scale-110 transition-transform`} />
                    <span className="text-[11px] font-medium text-gray-300">{label}</span>
                  </button>
                ))}
              </div>

              {/* Cerrar sesión */}
              <button
                onClick={onLogout}
                className="w-full py-2.5 text-red-400 hover:text-red-300 text-sm font-medium transition-colors touch-manipulation border-t border-white/8 mt-1 pt-3"
              >
                Cerrar sesión
              </button>

            </div>
          </div>
        </>
      )}
    </>
  );
}
