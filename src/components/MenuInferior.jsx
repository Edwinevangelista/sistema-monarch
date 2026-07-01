import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home, Bell, MoreHorizontal, Wallet, ScanLine, Sparkles,
  User, X, BarChart2, CreditCard, Repeat, Plus,
} from 'lucide-react'

export default function MenuInferior({ onOpenModal, onOpenExport, alertasCount = 0, coberturaBadge = 0, nombreUsuario = 'Usuario', onLogout }) {
  const [showMenu, setShowMenu] = useState(false)
  const [showAgregarMenu, setShowAgregarMenu] = useState(false)

  const handleOpenModal = (modalName) => {
    setShowMenu(false)
    setShowAgregarMenu(false)
    setTimeout(() => onOpenModal(modalName), 50)
  }

  const herramientas = [
    { id: 'cuentas',      icon: Wallet,     label: 'Cuentas',   color: 'text-blue-400',    badge: coberturaBadge > 0 },
    { id: 'suscripcion',  icon: Repeat,     label: 'Suscrip.',  color: 'text-indigo-400',  badge: false },
    { id: 'tarjetas',     icon: CreditCard, label: 'Tarjetas',  color: 'text-purple-400',  badge: false },
    { id: '_export',      icon: BarChart2,  label: 'Reportes',  color: 'text-emerald-400', badge: false },
    { id: 'lectorEstado', icon: ScanLine,   label: 'Escáner',   color: 'text-yellow-400',  badge: false, tag: 'PRO' },
    { id: 'usuario',      icon: User,       label: 'Perfil',    color: 'text-slate-400',   badge: false },
  ]

  return (
    <>
      {/* ── BARRA INFERIOR ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        {/* Fondo blur */}
        <div
          className="absolute inset-0"
          style={{
            background: 'rgba(8, 11, 17, 0.88)',
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            borderTop: '1px solid rgba(30, 37, 53, 0.8)',
          }}
        />

        <div className="relative flex h-16 items-center justify-around px-2">

          {/* Inicio */}
          <button
            onClick={() => { setShowMenu(false); setShowAgregarMenu(false); onOpenModal(null); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
            className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-white/30 transition-colors active:text-white/70 touch-manipulation"
          >
            <Home className="h-[22px] w-[22px]" />
            <span className="text-[10px] font-medium">Inicio</span>
          </button>

          {/* Alertas */}
          <button
            onClick={() => handleOpenModal('alertas')}
            className="relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-white/30 transition-colors active:text-yellow-400 touch-manipulation"
          >
            <div className="relative">
              <Bell className="h-[22px] w-[22px]" />
              {alertasCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-canvas bg-red-500 text-[8px] font-black text-white">
                  {alertasCount > 9 ? '9+' : alertasCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium">Alertas</span>
          </button>

          {/* FAB — Agregar */}
          <div className="flex flex-1 flex-col items-center justify-center -mt-5">
            <motion.button
              whileTap={{ scale: 0.90 }}
              transition={{ duration: 0.12 }}
              onClick={() => { setShowMenu(false); setShowAgregarMenu(v => !v) }}
              className="touch-manipulation"
            >
              <div
                className="flex h-[52px] w-[52px] items-center justify-center rounded-2xl shadow-lg transition-all"
                style={{
                  background: showAgregarMenu
                    ? 'rgba(255,255,255,0.18)'
                    : 'linear-gradient(145deg, rgba(59,130,246,0.35) 0%, rgba(139,92,246,0.35) 100%)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  boxShadow: showAgregarMenu ? 'none' : '0 0 20px rgba(59,130,246,0.2)',
                }}
              >
                <motion.div
                  animate={{ rotate: showAgregarMenu ? 45 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Plus className="h-6 w-6 text-white/90" />
                </motion.div>
              </div>
            </motion.button>
            <span className="mt-1 text-[10px] font-medium text-white/30">Agregar</span>
          </div>

          {/* Perfil */}
          <button
            onClick={() => handleOpenModal('usuario')}
            className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-white/30 transition-colors active:text-white/70 touch-manipulation"
          >
            <User className="h-[22px] w-[22px]" />
            <span className="text-[10px] font-medium">Perfil</span>
          </button>

          {/* Más */}
          <button
            onClick={() => { setShowAgregarMenu(false); setShowMenu(v => !v) }}
            className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-2 transition-colors touch-manipulation ${showMenu ? 'text-white/80' : 'text-white/30 active:text-white/70'}`}
          >
            <motion.div animate={{ rotate: showMenu ? 90 : 0 }} transition={{ duration: 0.2 }}>
              {showMenu ? <X className="h-[22px] w-[22px]" /> : <MoreHorizontal className="h-[22px] w-[22px]" />}
            </motion.div>
            <span className="text-[10px] font-medium">{showMenu ? 'Cerrar' : 'Más'}</span>
          </button>
        </div>
      </div>

      {/* ── PANEL "AGREGAR" ── */}
      <AnimatePresence>
        {showAgregarMenu && (
          <>
            <motion.div
              key="add-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden fixed inset-0 z-40"
              style={{ background: 'rgba(8,11,17,0.7)', backdropFilter: 'blur(8px)' }}
              onClick={() => setShowAgregarMenu(false)}
            />
            <motion.div
              key="add-panel"
              initial={{ y: 20, opacity: 0, scale: 0.96 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 20, opacity: 0, scale: 0.96 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="md:hidden fixed left-3 right-3 z-50 overflow-hidden rounded-3xl shadow-glass"
              style={{
                bottom: 'calc(4.5rem + env(safe-area-inset-bottom, 0px))',
                background: 'rgba(15, 18, 25, 0.95)',
                border: '1px solid rgba(30, 37, 53, 0.9)',
                backdropFilter: 'blur(20px)',
              }}
            >
              <div className="p-3 flex gap-2">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { setShowAgregarMenu(false); handleOpenModal('gastos') }}
                  className="flex flex-1 flex-col items-center gap-2.5 rounded-2xl border border-rose-500/15 bg-rose-500/8 p-5 transition-colors active:bg-rose-500/15 touch-manipulation"
                >
                  <span className="text-3xl">💸</span>
                  <span className="text-sm font-black text-rose-300">Gasto</span>
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { setShowAgregarMenu(false); handleOpenModal('ingreso') }}
                  className="flex flex-1 flex-col items-center gap-2.5 rounded-2xl border border-emerald-500/15 bg-emerald-500/8 p-5 transition-colors active:bg-emerald-500/15 touch-manipulation"
                >
                  <span className="text-3xl">💰</span>
                  <span className="text-sm font-black text-emerald-300">Ingreso</span>
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── MENÚ "MÁS" ── */}
      <AnimatePresence>
        {showMenu && (
          <>
            <motion.div
              key="menu-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden fixed inset-0 z-40"
              style={{ background: 'rgba(8,11,17,0.7)', backdropFilter: 'blur(8px)' }}
              onClick={() => setShowMenu(false)}
            />
            <motion.div
              key="menu-panel"
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="md:hidden fixed left-3 right-3 z-50 overflow-hidden rounded-3xl shadow-glass"
              style={{
                bottom: 'calc(4.5rem + env(safe-area-inset-bottom, 0px))',
                background: 'rgba(15, 18, 25, 0.97)',
                border: '1px solid rgba(30, 37, 53, 0.9)',
                backdropFilter: 'blur(20px)',
              }}
            >
              <div className="p-4">
                {/* Saludo */}
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-ink-faint">Conectado como</p>
                    <p className="text-sm font-black text-ink">{nombreUsuario}</p>
                  </div>
                  <button
                    onClick={() => handleOpenModal('asistente')}
                    className="flex items-center gap-1.5 rounded-full border border-purple-500/25 bg-gradient-to-r from-purple-600/20 to-pink-600/20 px-3 py-1.5 text-[11px] font-bold text-purple-300 transition-all active:opacity-80 touch-manipulation"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    IA Financiera
                  </button>
                </div>

                {/* Grid herramientas */}
                <div className="mb-3 grid grid-cols-3 gap-2">
                  {herramientas.map(({ id, icon: Icon, label, color, badge, tag }) => (
                    <motion.button
                      key={id}
                      whileTap={{ scale: 0.93 }}
                      onClick={() => id === '_export' ? (() => { setShowMenu(false); setTimeout(() => onOpenExport?.(), 50) })() : handleOpenModal(id)}
                      className="relative flex flex-col items-center gap-2 rounded-2xl border border-canvas-border bg-canvas-elevated p-3.5 transition-colors active:bg-canvas-border touch-manipulation"
                    >
                      {badge && (
                        <span className="absolute right-2 top-2 h-2 w-2 animate-pulse rounded-full border border-canvas-elevated bg-orange-500" />
                      )}
                      {tag && (
                        <span className="absolute right-1.5 top-1.5 rounded-full bg-white/15 px-1.5 py-0.5 text-[7px] font-bold text-white">
                          {tag}
                        </span>
                      )}
                      <Icon className={`h-6 w-6 ${color}`} />
                      <span className="text-[11px] font-medium text-ink-muted">{label}</span>
                    </motion.button>
                  ))}
                </div>

                {/* Logout */}
                <button
                  onClick={onLogout}
                  className="w-full border-t border-canvas-border pt-3 text-sm font-medium text-accent-negative/70 transition-colors active:text-accent-negative touch-manipulation"
                >
                  Cerrar sesión
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
