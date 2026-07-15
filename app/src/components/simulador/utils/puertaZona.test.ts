import { describe, it, expect } from 'vitest'
import { crearPuerta, ladoDesdePuerta, puertaEnLado } from './floorHeating'
import type { FloorHeatingZone } from '../models/FloorHeatingZone'

// Zona MUCHO más ancha que alta: sirve para verificar que la orientación de la
// puerta la fija el usuario (no el ancho de la zona), y que el lado se infiere
// bien respecto del centro.
const zona: FloorHeatingZone = {
  id: 'z1',
  type: 'floor-heating-zone',
  name: 'ancha',
  x: 100,
  y: 100,
  width: 400,
  height: 80,
}

describe('crearPuerta — orientación según la pared más cercana', () => {
  it('click cerca de la pared de arriba → horizontal', () => {
    const p = crearPuerta(zona, { x: 300, y: 104 })
    expect(p.orientacion).toBe('horizontal')
    expect(p.x).toBe(300)
    expect(p.y).toBe(104)
  })

  it('click cerca de la pared izquierda → vertical', () => {
    const p = crearPuerta(zona, { x: 104, y: 140 })
    expect(p.orientacion).toBe('vertical')
  })
})

describe('ladoDesdePuerta — la orientación fija el eje, el centro fija el lado', () => {
  it('horizontal arriba del centro → lado arriba', () => {
    expect(ladoDesdePuerta(zona, { x: 300, y: 110, orientacion: 'horizontal' })).toBe('arriba')
  })

  it('horizontal abajo del centro → lado abajo', () => {
    expect(ladoDesdePuerta(zona, { x: 300, y: 170, orientacion: 'horizontal' })).toBe('abajo')
  })

  it('vertical a la izquierda del centro → lado izquierda', () => {
    expect(ladoDesdePuerta(zona, { x: 120, y: 140, orientacion: 'vertical' })).toBe('izquierda')
  })

  it('vertical a la derecha del centro → lado derecha', () => {
    expect(ladoDesdePuerta(zona, { x: 480, y: 140, orientacion: 'vertical' })).toBe('derecha')
  })
})

describe('puertaEnLado — la usa el análisis con IA (lado → punto medio + orientación)', () => {
  it('lado abajo → punto medio de la pared inferior, horizontal', () => {
    const p = puertaEnLado(zona, 'abajo')
    expect(p).toEqual({ x: 300, y: 180, orientacion: 'horizontal' })
  })

  it('lado derecha → punto medio de la pared derecha, vertical', () => {
    const p = puertaEnLado(zona, 'derecha')
    expect(p).toEqual({ x: 500, y: 140, orientacion: 'vertical' })
  })
})
