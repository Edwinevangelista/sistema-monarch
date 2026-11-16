// src/components/ui/SwipeableRow.test.js
import { render, screen, fireEvent } from '@testing-library/react'
import SwipeableRow from './SwipeableRow'

describe('SwipeableRow', () => {
  it('muestra el contenido y las acciones', () => {
    render(
      <SwipeableRow actions={[{ label: 'Borrar', colorClass: 'bg-rose-600', onClick: jest.fn() }]}>
        <p>Gasto de prueba</p>
      </SwipeableRow>
    )
    expect(screen.getByText('Gasto de prueba')).toBeInTheDocument()
    expect(screen.getByText('Borrar')).toBeInTheDocument()
  })

  it('tocar el contenido llama onTap', () => {
    const onTap = jest.fn()
    render(
      <SwipeableRow actions={[{ label: 'Borrar', onClick: jest.fn() }]} onTap={onTap}>
        <p>Fila</p>
      </SwipeableRow>
    )
    fireEvent.click(screen.getByText('Fila'))
    expect(onTap).toHaveBeenCalledTimes(1)
  })

  it('el botón de acción llama su handler', () => {
    const onBorrar = jest.fn()
    render(
      <SwipeableRow actions={[{ label: 'Borrar', onClick: onBorrar }]}>
        <p>Fila</p>
      </SwipeableRow>
    )
    fireEvent.click(screen.getByText('Borrar'))
    expect(onBorrar).toHaveBeenCalledTimes(1)
  })

  it('sin acciones solo muestra el contenido', () => {
    render(
      <SwipeableRow>
        <p>Solo contenido</p>
      </SwipeableRow>
    )
    expect(screen.getByText('Solo contenido')).toBeInTheDocument()
  })
})
