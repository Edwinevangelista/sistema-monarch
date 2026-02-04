import React, { useState } from 'react';
import { 
  Home, 
  DollarSign, 
  CreditCard, 
  Bell, 
  Repeat, 
  MoreHorizontal,
  Wallet,
  ScanFace,
  Sparkles,
  User,
  X,
  Download
} from 'lucide-react';

export default function MenuInferior({ onOpenModal, onOpenExport, alertasCount = 0, nombreUsuario = 'Usuario', onLogout }) {
  const [showMenu, setShowMenu] = useState(false);

  const handleOpenModal = (modalName) => {
    setShowMenu(false);
    // Pequeño delay para asegurar que el menú se cierre primero
    setTimeout(() => {
      onOpenModal(modalName);
    }, 50);
  };

  const handleExportAction = () => {
    setShowMenu(false);
    // Pequeño delay para asegurar que el menú se cierre primero
    setTimeout(() => {
      if (onOpenExport) {
        onOpenExport();
      }
    }, 50);
  };

  return (
    <>
      {/* Menú Principal (Bottom Bar) - 5 botones en línea */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-xl border-t border-white/10 z-50 safe-area-bottom">
        <div className="flex justify-around items-center h-16 px-1">
          
          {/* INICIO */}
          <button
            onClick={() => {
              setShowMenu(false);
              onOpenModal(null);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex flex-col items-center justify-center gap-0.5 text-gray-400 hover:text-white active:text-white transition-colors flex-1 py-2"
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-medium">Inicio</span>
          </button>

          {/* INGRESOS */}
          <button
            onClick={() => handleOpenModal('ingreso')}
            className="flex flex-col items-center justify-center gap-0.5 text-gray-400 hover:text-emerald-400 active:text-emerald-400 transition-colors flex-1 py-2"
          >
            <DollarSign className="w-5 h-5" />
            <span className="text-[10px] font-medium">Ingresos</span>
          </button>

          {/* GASTOS */}
          <button
            onClick={() => handleOpenModal('gastos')}
            className="flex flex-col items-center justify-center gap-0.5 text-gray-400 hover:text-rose-400 active:text-rose-400 transition-colors flex-1 py-2"
          >
            <CreditCard className="w-5 h-5" />
            <span className="text-[10px] font-medium">Gastos</span>
          </button>

          {/* ALERTAS */}
          <button
            onClick={() => handleOpenModal('alertas')}
            className="flex flex-col items-center justify-center gap-0.5 text-gray-400 hover:text-yellow-400 active:text-yellow-400 transition-colors flex-1 py-2 relative"
          >
            <div className="relative">
              <Bell className="w-5 h-5" />
              {alertasCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[8px] font-bold flex items-center justify-center rounded-full border border-gray-900 animate-pulse">
                  {alertasCount > 9 ? '9+' : alertasCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium">Alertas</span>
          </button>

          {/* MÁS - Integrado en la barra */}
          <button
            onClick={() => setShowMenu(!showMenu)}
            className={`flex flex-col items-center justify-center gap-0.5 transition-colors flex-1 py-2 ${
              showMenu ? 'text-purple-400' : 'text-gray-400 hover:text-purple-400 active:text-purple-400'
            }`}
          >
            <MoreHorizontal className={`w-5 h-5 transition-transform duration-200 ${showMenu ? 'rotate-90' : ''}`} />
            <span className="text-[10px] font-medium">Más</span>
          </button>

        </div>
      </div>

      {/* MENÚ EXPANDIDO (Overlay Slide-Up) */}
      {showMenu && (
        <>
          {/* Overlay Oscuro */}
          <div 
            className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            style={{ zIndex: 40 }}
            onClick={() => setShowMenu(false)}
          />
          
          {/* Panel Deslizante */}
          <div 
            className="md:hidden fixed bottom-16 left-3 right-3 bg-gray-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 duration-200"
            style={{ zIndex: 45 }}
          >
            <div className="p-4">
              {/* Header del panel */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-purple-400" />
                  Herramientas
                </h3>
                <button 
                  onClick={() => setShowMenu(false)}
                  className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Grid de opciones - NUEVA DISPOSICIÓN CON EXPORTACIÓN */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                
                {/* Cuentas */}
                <button
                  onClick={() => handleOpenModal('cuentas')}
                  className="p-3 bg-white/5 hover:bg-blue-600/20 rounded-xl transition-all border border-white/5 hover:border-blue-500/30 flex flex-col items-center gap-2 group active:scale-95"
                >
                  <Wallet className="w-6 h-6 text-blue-400 group-hover:scale-110 transition-transform" />
                  <span className="text-[11px] font-medium text-white">Cuentas</span>
                </button>

                {/* Suscripciones */}
                <button
                  onClick={() => handleOpenModal('suscripcion')}
                  className="p-3 bg-white/5 hover:bg-indigo-600/20 rounded-xl transition-all border border-white/5 hover:border-indigo-500/30 flex flex-col items-center gap-2 group active:scale-95"
                >
                  <Repeat className="w-6 h-6 text-indigo-400 group-hover:scale-110 transition-transform" />
                  <span className="text-[11px] font-medium text-white">Suscrip.</span>
                </button>

                {/* Deudas/Tarjetas */}
                <button
                  onClick={() => handleOpenModal('tarjetas')}
                  className="p-3 bg-white/5 hover:bg-purple-600/20 rounded-xl transition-all border border-white/5 hover:border-purple-500/30 flex flex-col items-center gap-2 group active:scale-95"
                >
                  <CreditCard className="w-6 h-6 text-purple-400 group-hover:scale-110 transition-transform" />
                  <span className="text-[11px] font-medium text-white">Tarjetas</span>
                </button>

                {/* NUEVO: Exportar Datos */}
                <button
                  onClick={handleExportAction}
                  className="p-3 bg-gradient-to-br from-green-500/10 to-emerald-600/10 hover:from-green-500/20 hover:to-emerald-600/20 rounded-xl transition-all border border-green-500/20 hover:border-green-500/40 flex flex-col items-center gap-2 group relative active:scale-95"
                >
                  <div className="absolute top-1 right-1">
                    <span className="text-[7px] font-bold bg-green-400 text-green-900 px-1 py-0.5 rounded">NUEVO</span>
                  </div>
                  <Download className="w-6 h-6 text-green-400 group-hover:scale-110 transition-transform" />
                  <span className="text-[11px] font-medium text-white">Exportar</span>
                </button>

                {/* Escáner */}
                <button
                  onClick={() => handleOpenModal('lectorEstado')}
                  className="p-3 bg-gradient-to-br from-yellow-500/10 to-orange-600/10 hover:from-yellow-500/20 hover:to-orange-600/20 rounded-xl transition-all border border-yellow-500/20 hover:border-yellow-500/40 flex flex-col items-center gap-2 group relative active:scale-95"
                >
                  <div className="absolute top-1 right-1">
                    <span className="text-[7px] font-bold bg-yellow-400 text-yellow-900 px-1 py-0.5 rounded">PRO</span>
                  </div>
                  <ScanFace className="w-6 h-6 text-yellow-400 group-hover:scale-110 transition-transform" />
                  <span className="text-[11px] font-medium text-white">Escáner</span>
                </button>

                {/* Perfil */}
                <button
                  onClick={() => handleOpenModal('usuario')}
                  className="p-3 bg-white/5 hover:bg-emerald-600/20 rounded-xl transition-all border border-white/5 hover:border-emerald-500/30 flex flex-col items-center gap-2 group active:scale-95"
                >
                  <User className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition-transform" />
                  <span className="text-[11px] font-medium text-white">Perfil</span>
                </button>

              </div>

              {/* Segunda fila para asistente IA */}
              <div className="grid grid-cols-3 gap-2">
                {/* Asistente IA - Centrado */}
                <div className="col-start-2">
                  <button
                    onClick={() => handleOpenModal('asistente')}
                    className="w-full p-3 bg-white/5 hover:bg-pink-600/20 rounded-xl transition-all border border-white/5 hover:border-pink-500/30 flex flex-col items-center gap-2 group active:scale-95"
                  >
                    <Sparkles className="w-6 h-6 text-pink-400 group-hover:scale-110 transition-transform" />
                    <span className="text-[11px] font-medium text-white">IA</span>
                  </button>
                </div>
              </div>

              {/* Botón cerrar sesión */}
              <button
                onClick={onLogout}
                className="w-full mt-3 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 border border-red-500/20 active:scale-[0.98]"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}