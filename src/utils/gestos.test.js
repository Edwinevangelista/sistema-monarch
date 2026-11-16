// src/utils/gestos.test.js
import { debeCerrarSheet, debeCerrarDrawer, snapSwipeRow } from './gestos'

describe('debeCerrarSheet', () => {
  it('cierra si se arrastra más de 100px hacia abajo', () => {
    expect(debeCerrarSheet(120, 0)).toBe(true)
    expect(debeCerrarSheet(100, 0)).toBe(false)
    expect(debeCerrarSheet(50, 0)).toBe(false)
  })
  it('cierra con un tirón rápido aunque no llegue al umbral', () => {
    expect(debeCerrarSheet(40, 800)).toBe(true)
    expect(debeCerrarSheet(40, 500)).toBe(false)
  })
  it('nunca cierra arrastrando hacia arriba', () => {
    expect(debeCerrarSheet(-200, -800)).toBe(false)
  })
})

describe('debeCerrarDrawer', () => {
  it('cierra si se arrastra más de 80px hacia la izquierda', () => {
    expect(debeCerrarDrawer(-100, 0)).toBe(true)
    expect(debeCerrarDrawer(-80, 0)).toBe(false)
    expect(debeCerrarDrawer(-30, 0)).toBe(false)
  })
  it('cierra con un tirón rápido hacia la izquierda', () => {
    expect(debeCerrarDrawer(-20, -900)).toBe(true)
  })
  it('nunca cierra arrastrando hacia la derecha', () => {
    expect(debeCerrarDrawer(200, 800)).toBe(false)
  })
})

describe('snapSwipeRow', () => {
  it('abre las acciones si se desliza más de 60px a la izquierda', () => {
    expect(snapSwipeRow(-100, 160)).toBe(-160)
    expect(snapSwipeRow(-60, 160)).toBe(0)
    expect(snapSwipeRow(-30, 160)).toBe(0)
  })
  it('usa el ancho real de las acciones', () => {
    expect(snapSwipeRow(-100, 80)).toBe(-80)
  })
  it('sin acciones no se mueve', () => {
    expect(snapSwipeRow(-200, 0)).toBe(0)
  })
})
