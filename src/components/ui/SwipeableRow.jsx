// src/components/ui/SwipeableRow.jsx
// Fila deslizable reutilizable: deslizar a la izquierda revela acciones
// (Pagar / Borrar). El swipe NUNCA ejecuta nada por sí solo: solo revela
// los botones, y cada botón usa los handlers que ya existen en la app
// (borrar siempre pide confirmación con showConfirm).
// - Solo una fila abierta a la vez: al abrir una se cierra la anterior.
// - Tocar el contenido con la fila abierta la cierra (no dispara onTap).
// - Un arrastre no dispara el tap: el clic después de deslizar se ignora.
// - El scroll vertical de la lista sigue funcionando (arrastre horizontal).
import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, useAnimation } from 'framer-motion'
import { snapSwipeRow } from '../../utils/gestos'

const ANCHO_ACCION = 80 // px por botón de acción

let cerrarFilaAbierta = null

export default function SwipeableRow({ actions = [], onTap, children, className = '' }) {
  const controls = useAnimation()
  const [abierto, setAbierto] = useState(false)
  const fueArrastre = useRef(false)
  const ancho = actions.length * ANCHO_ACCION

  const cerrarFila = useCallback(() => {
    setAbierto(false)
    controls.start({ x: 0 })
  }, [controls])

  const abrirFila = useCallback(() => {
    if (cerrarFilaAbierta && cerrarFilaAbierta !== cerrarFila) cerrarFilaAbierta()
    cerrarFilaAbierta = cerrarFila
    setAbierto(true)
    controls.start({ x: -ancho })
  }, [ancho, cerrarFila, controls])

  // Si la fila se desmonta abierta, no dejar el registro colgando
  useEffect(() => () => {
    if (cerrarFilaAbierta === cerrarFila) cerrarFilaAbierta = null
  }, [cerrarFila])

  if (actions.length === 0) {
    return <div className={className}>{children}</div>
  }

  const handleDragEnd = (_e, info) => {
    const destino = snapSwipeRow(info.offset.x, ancho)
    if (destino === 0) {
      if (cerrarFilaAbierta === cerrarFila) cerrarFilaAbierta = null
      cerrarFila()
    } else {
      abrirFila()
    }
  }

  const handleClick = () => {
    // El clic que sigue a un arrastre no es un tap: se ignora
    if (fueArrastre.current) {
      fueArrastre.current = false
      return
    }
    // Tocar una fila abierta solo la cierra
    if (abierto) {
      if (cerrarFilaAbierta === cerrarFila) cerrarFilaAbierta = null
      cerrarFila()
      return
    }
    onTap?.()
  }

  const handleAccion = (accion) => {
    if (cerrarFilaAbierta === cerrarFila) cerrarFilaAbierta = null
    cerrarFila()
    accion.onClick?.()
  }

  return (
    <div className={`relative overflow-hidden rounded-2xl ${className}`}>
      {/* Acciones reveladas detrás del contenido */}
      <div className="absolute inset-y-0 right-0 z-0 flex">
        {actions.map((accion) => (
          <button
            key={accion.label}
            type="button"
            onClick={() => handleAccion(accion)}
            className={`flex w-20 flex-col items-center justify-center gap-1 text-[11px] font-bold text-white touch-manipulation ${accion.colorClass || 'bg-rose-600'}`}
          >
            {accion.icon}
            {accion.label}
          </button>
        ))}
      </div>

      {/* Contenido deslizable */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -ancho, right: 0 }}
        dragElastic={0.08}
        dragMomentum={false}
        animate={controls}
        onDragStart={() => { fueArrastre.current = false }}
        onDrag={(_e, info) => {
          if (Math.abs(info.offset.x) > 8) fueArrastre.current = true
        }}
        onDragEnd={handleDragEnd}
        onClick={handleClick}
        className="relative z-10 cursor-pointer"
      >
        {children}
      </motion.div>
    </div>
  )
}
