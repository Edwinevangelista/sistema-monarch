// src/components/ui/Drawer.jsx
// Menú lateral (slide-out) desde la izquierda. Solo para lo secundario:
// cuentas, reportes, notificaciones, privacidad, borrar cuenta.
// No duplica la barra inferior (Inicio/Calendario/Deudas/Metas van abajo).
// - Se cierra arrastrando el panel hacia la izquierda (>80px o tirón rápido),
//   con el botón X, tocando fuera, o con Esc.
// - El scroll vertical dentro del menú sigue funcionando (el arrastre es
//   horizontal; el gesto vertical es del scroll).
import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { debeCerrarDrawer } from '../../utils/gestos'

export default function Drawer({ open, onClose, title = 'Menú', children }) {
  // Cerrar con Esc
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // Bloquear scroll del body
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Fondo — tocar cierra */}
          <motion.div
            key="drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Panel lateral */}
          <motion.div
            key="drawer-panel"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={{ left: 0.7, right: 0 }}
            dragMomentum={false}
            onDragEnd={(_e, info) => {
              if (debeCerrarDrawer(info.offset.x, info.velocity.x)) onClose()
            }}
            className="fixed left-0 top-0 bottom-0 z-50 flex w-[85%] max-w-[320px] flex-col border-r border-canvas-border bg-canvas-surface shadow-glass"
            role="dialog"
            aria-modal="true"
            aria-label={title}
          >
            {/* Encabezado */}
            <div className="flex shrink-0 items-center justify-between border-b border-canvas-border px-5 py-4">
              <p className="text-base font-black text-ink">{title}</p>
              <button
                onClick={onClose}
                aria-label="Cerrar menú"
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-canvas-elevated text-ink-muted hover:text-ink transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Contenido — scroll vertical normal */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-3">
              {children}
            </div>

            {/* Pista del gesto */}
            <p className="shrink-0 border-t border-canvas-border px-5 py-3 text-center text-[11px] text-ink-faint">
              Desliza hacia la izquierda para cerrar
            </p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
