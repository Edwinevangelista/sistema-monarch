// src/components/ui/BottomSheet.jsx
// Hoja inferior con arrastrar para cerrar.
// - El arrastre solo empieza desde el tirador o el encabezado: el contenido
//   se puede desplazar con el dedo sin cerrar la hoja.
// - Se cierra si se arrastra más de ~100px hacia abajo o con un tirón rápido;
//   si no, vuelve a su sitio con un resorte.
// - También cierra con Esc y tocando el fondo. El scroll del body se bloquea
//   mientras está abierta.
import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useDragToClose } from './useDragToClose'

export default function BottomSheet({ open, onClose, title, children, maxHeight = '90vh' }) {
  const { controls, startDrag, handleDragEnd } = useDragToClose({ onClose, enabled: open })

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
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Hoja */}
          <motion.div
            key="sheet"
            drag="y"
            dragListener={false}
            dragControls={controls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.7 }}
            dragMomentum={false}
            onDragEnd={handleDragEnd}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-[28px] border-t border-canvas-border bg-canvas-surface shadow-glass"
            style={{ maxHeight }}
            role="dialog"
            aria-modal="true"
            aria-label={title || 'Panel'}
          >
            {/* Tirador — desde aquí se arrastra para cerrar */}
            <div
              onPointerDown={startDrag}
              style={{ touchAction: 'none' }}
              className="flex cursor-grab justify-center pt-3 pb-1 shrink-0 active:cursor-grabbing"
            >
              <div className="h-1.5 w-12 rounded-full bg-canvas-border" />
            </div>

            {/* Encabezado — también arrastra para cerrar */}
            {title && (
              <div
                onPointerDown={startDrag}
                style={{ touchAction: 'none' }}
                className="flex cursor-grab items-center justify-between px-5 pb-4 pt-2 shrink-0 border-b border-canvas-border active:cursor-grabbing"
              >
                <p className="text-base font-black text-ink">{title}</p>
                <button
                  onClick={onClose}
                  aria-label="Cerrar"
                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-canvas-elevated text-ink-muted hover:text-ink transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Contenido — con scroll propio, no cierra al arrastrar */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
