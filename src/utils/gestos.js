// src/utils/gestos.js
// Decisiones puras de gestos (swipe / arrastrar para cerrar) — sin DOM ni
// dependencias, para poder probarlas con Jest. Las velocidades vienen de
// framer-motion en px/s.

export const UMBRAL_CERRAR_SHEET = 100 // px arrastrados hacia abajo
export const UMBRAL_CERRAR_DRAWER = 80 // px arrastrados hacia la izquierda
export const VELOCIDAD_MINIMA_CIERRE = 500 // px/s: un tirón rápido cierra aunque no llegue al umbral
export const UMBRAL_REVELAR_ACCIONES = 60 // px para que una fila se quede abierta

/** ¿El sheet debe cerrarse? Se arrastra solo hacia abajo (offset positivo). */
export function debeCerrarSheet(offsetY, velocidadY, umbral = UMBRAL_CERRAR_SHEET, velocidadMin = VELOCIDAD_MINIMA_CIERRE) {
  return offsetY > umbral || velocidadY > velocidadMin
}

/** ¿El drawer lateral debe cerrarse? Se arrastra hacia la izquierda (offset negativo). */
export function debeCerrarDrawer(offsetX, velocidadX, umbral = UMBRAL_CERRAR_DRAWER, velocidadMin = VELOCIDAD_MINIMA_CIERRE) {
  return offsetX < -umbral || velocidadX < -velocidadMin
}

/** Posición X final de una fila deslizable: 0 (cerrada) o -anchoAcciones (abierta). */
export function snapSwipeRow(offsetX, anchoAcciones, umbral = UMBRAL_REVELAR_ACCIONES) {
  if (!anchoAcciones || anchoAcciones <= 0) return 0
  return offsetX < -umbral ? -anchoAcciones : 0
}
