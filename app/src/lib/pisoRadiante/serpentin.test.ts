import { describe, it, expect } from 'vitest'
import { generarSerpentin, longitudPolilinea } from './serpentin'
import type { Punto, Serpentin } from './serpentin'

// La densidad teórica del motor de cálculo (UnderfloorService) es 1/paso:
// paso 15 cm → 6.7 m/m², paso 20 cm → 5.0 m/m². El trazado real pierde algo
// por el margen perimetral y el remate en el centro, así que se compara
// contra el área útil (descontando margen) con tolerancia.

function areaUtil(ancho: number, alto: number, margenCm = 10): number {
    const m = margenCm / 100
    return (ancho - 2 * m) * (alto - 2 * m)
}

function todosLosPuntos(s: Serpentin): Punto[] {
    return [...s.ida, ...s.retorno]
}

function segmentosOrtogonales(pts: Punto[]): boolean {
    for (let i = 1; i < pts.length; i++) {
        const dx = Math.abs(pts[i].x - pts[i - 1].x)
        const dy = Math.abs(pts[i].y - pts[i - 1].y)
        if (dx > 1e-9 && dy > 1e-9) return false
    }
    return true
}

describe('generarSerpentin — espiral doble (ambientes grandes)', () => {
    it('ambiente 5×4 m con paso 20 cubre el área útil con densidad ~5 m/m²', () => {
        const s = generarSerpentin(5, 4, 20)
        expect(s.patron).toBe('espiral')
        const esperado = areaUtil(5, 4) / 0.20
        expect(s.longitudTotal).toBeGreaterThan(esperado * 0.85)
        expect(s.longitudTotal).toBeLessThan(esperado * 1.10)
    })

    it('ambiente 6×5 m con paso 15 cubre el área útil con densidad ~6.7 m/m²', () => {
        const s = generarSerpentin(6, 5, 15)
        expect(s.patron).toBe('espiral')
        const esperado = areaUtil(6, 5) / 0.15
        expect(s.longitudTotal).toBeGreaterThan(esperado * 0.85)
        expect(s.longitudTotal).toBeLessThan(esperado * 1.10)
    })

    it('todos los puntos quedan dentro del ambiente y sin NaN', () => {
        const s = generarSerpentin(5, 4, 20)
        for (const p of todosLosPuntos(s)) {
            expect(Number.isFinite(p.x)).toBe(true)
            expect(Number.isFinite(p.y)).toBe(true)
            expect(p.x).toBeGreaterThanOrEqual(0)
            expect(p.x).toBeLessThanOrEqual(5)
            expect(p.y).toBeGreaterThanOrEqual(0)
            expect(p.y).toBeLessThanOrEqual(4)
        }
    })

    it('ida y retorno son polilíneas ortogonales (curvas a 90°)', () => {
        const s = generarSerpentin(5, 4, 20)
        expect(segmentosOrtogonales(s.ida)).toBe(true)
        expect(segmentosOrtogonales(s.retorno)).toBe(true)
    })

    it('ida y retorno arrancan en la misma zona (conexión al colector)', () => {
        const s = generarSerpentin(5, 4, 20)
        const inicioIda = s.ida[0]
        const finRetorno = s.retorno[s.retorno.length - 1]
        // Deben terminar a menos de un paso de distancia entre sí
        const d = Math.hypot(inicioIda.x - finRetorno.x, inicioIda.y - finRetorno.y)
        expect(d).toBeLessThanOrEqual(0.4)
    })

    it('la separación mínima entre ida y retorno respeta el paso', () => {
        // Los anillos de ida van en offsets m+2ks y los de retorno en m+(2k+1)s:
        // el primer anillo de ida está en 0.10 y el primero de retorno en 0.30
        const s = generarSerpentin(5, 4, 20)
        const yIda = s.ida[0].y
        const yRetorno = s.retorno[s.retorno.length - 1].y
        expect(Math.abs(yRetorno - yIda)).toBeCloseTo(0.20, 2)
    })

    it('longitudTotal coincide con la geometría de las polilíneas', () => {
        const s = generarSerpentin(5, 4, 20)
        const suma = longitudPolilinea(s.ida) + longitudPolilinea(s.retorno)
        // longitudTotal incluye además la conexión central (≥ suma)
        expect(s.longitudTotal).toBeGreaterThanOrEqual(Math.round(suma * 100) / 100)
        expect(s.longitudTotal).toBeLessThan(suma + 2)
    })
})

describe('generarSerpentin — meandro (ambientes chicos o angostos)', () => {
    it('un baño 2×1.5 m con paso 15 usa meandro', () => {
        const s = generarSerpentin(2, 1.5, 15)
        expect(s.patron).toBe('meandro')
        const esperado = areaUtil(2, 1.5) / 0.15
        expect(s.longitudTotal).toBeGreaterThan(esperado * 0.75)
        expect(s.longitudTotal).toBeLessThan(esperado * 1.35)
    })

    it('un pasillo angosto 6×0.9 m usa meandro con corridas a lo largo', () => {
        const s = generarSerpentin(6, 0.9, 15)
        expect(s.patron).toBe('meandro')
        for (const p of todosLosPuntos(s)) {
            expect(p.x).toBeGreaterThanOrEqual(0)
            expect(p.x).toBeLessThanOrEqual(6)
            expect(p.y).toBeGreaterThanOrEqual(0)
            expect(p.y).toBeLessThanOrEqual(0.9)
        }
    })

    it('ambiente rotado (más alto que ancho) genera puntos dentro del rectángulo', () => {
        const s = generarSerpentin(1.2, 4, 15)
        expect(s.patron).toBe('meandro')
        for (const p of todosLosPuntos(s)) {
            expect(p.x).toBeGreaterThanOrEqual(0)
            expect(p.x).toBeLessThanOrEqual(1.2)
            expect(p.y).toBeGreaterThanOrEqual(0)
            expect(p.y).toBeLessThanOrEqual(4)
        }
    })
})

describe('generarSerpentin — validación de entrada', () => {
    it('rechaza dimensiones inválidas', () => {
        expect(() => generarSerpentin(0, 4, 20)).toThrow()
        expect(() => generarSerpentin(5, -1, 20)).toThrow()
        expect(() => generarSerpentin(NaN, 4, 20)).toThrow()
    })

    it('rechaza paso inválido', () => {
        expect(() => generarSerpentin(5, 4, 0)).toThrow()
    })

    it('rechaza ambientes más chicos que el margen', () => {
        expect(() => generarSerpentin(0.15, 0.15, 15)).toThrow()
    })
})
