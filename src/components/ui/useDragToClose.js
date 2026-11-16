// src/components/ui/useDragToClose.js
// Hook compartido por BottomSheet y ModalWrapper: el arrastre para cerrar
// solo empieza desde el tirador (dragControls), nunca desde el contenido,
// así el scroll interno del modal no se rompe. En escritorio el modal está
// centrado, así que el gesto solo aplica en móvil (< 768px).
import { useDragControls } from 'framer-motion'
import { debeCerrarSheet } from '../../utils/gestos'

export function useDragToClose({ onClose, enabled = true }) {
  const controls = useDragControls()

  const startDrag = (e) => {
    if (!enabled) return
    if (typeof window !== 'undefined' && window.innerWidth >= 768) return
    controls.start(e)
  }

  const handleDragEnd = (_e, info) => {
    if (debeCerrarSheet(info.offset.y, info.velocity.y)) onClose()
  }

  return { controls, startDrag, handleDragEnd }
}
