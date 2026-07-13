import { describe, it, expect } from 'vitest'
import { puertaDesdePunto } from './floorHeating'
import type { FloorHeatingZone } from '../models/FloorHeatingZone'

// Zona MUCHO más ancha que alta: el caso donde la proyección a la recta
// infinita fallaba (siempre elegía arriba/abajo y no dejaba acomodar la
// puerta en las paredes laterales).
const zona: FloorHeatingZone = {
  id: 'z1',
  type: 'floor-heating-zone',
  name: 'ancha',
  x: 100,
  y: 100,
  width: 400,
  height: 80,
  pasoCm: 20,
}

describe('puertaDesdePunto — la puerta se puede acomodar en los 4 lados', () => {
  it('arrastre cerca de la pared izquierda → lado izquierda', () => {
    const p = puertaDesdePunto(zona, { x: 96, y: 140 })
    expect(p.lado).toBe('izquierda')
    expect(p.t).toBeCloseTo(0.5, 2)
  })

  it('arrastre cerca de la pared derecha → lado derecha', () => {
    const p = puertaDesdePunto(zona, { x: 504, y: 130 })
    expect(p.lado).toBe('derecha')
  })

  it('arrastre cerca de la pared de arriba → lado arriba', () => {
    const p = puertaDesdePunto(zona, { x: 300, y: 98 })
    expect(p.lado).toBe('arriba')
    expect(p.t).toBeCloseTo(0.5, 2)
  })

  it('arrastre cerca de la pared de abajo → lado abajo', () => {
    const p = puertaDesdePunto(zona, { x: 200, y: 182 })
    expect(p.lado).toBe('abajo')
  })

  it('rodear la esquina inferior-izquierda pasa la puerta de abajo a izquierda', () => {
    // apenas fuera de la esquina, más cerca del segmento izquierdo que del de abajo
    const abajo = puertaDesdePunto(zona, { x: 130, y: 185 })
    expect(abajo.lado).toBe('abajo')
    const izquierda = puertaDesdePunto(zona, { x: 95, y: 150 })
    expect(izquierda.lado).toBe('izquierda')
  })
})
