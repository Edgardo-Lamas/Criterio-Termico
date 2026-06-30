import { describe, expect, it } from 'vitest'
import {
    calculateBoilerPower,
    calculateInstalledPower,
    calculateRoomPower,
    isPowerSufficient,
    kcalToKw,
    kwToKcal,
} from './thermalCalculator'
import type { Room } from '../models/Room'
import type { Radiator } from '../models/Radiator'

function makeRoom(overrides: Partial<Room> = {}): Room {
    return {
        id: 'room-1',
        name: 'Living',
        area: 20,
        height: 2.5,
        thermalFactor: 50,
        hasExteriorWall: false,
        windowsLevel: 'sin-ventanas',
        radiatorIds: [],
        ...overrides,
    }
}

function makeRadiator(overrides: Partial<Radiator> = {}): Radiator {
    return {
        id: 'rad-1',
        type: 'radiator',
        x: 0,
        y: 0,
        power: 1000,
        width: 60,
        height: 60,
        ...overrides,
    }
}

describe('calculateRoomPower', () => {
    it('calcula la potencia base sin ajustes (sin pared exterior, sin ventanas)', () => {
        // volumen = 20 * 2.5 = 50 m³; 50 * 50 Kcal/h·m³ = 2500
        expect(calculateRoomPower(makeRoom({ area: 20, height: 2.5, thermalFactor: 50 }))).toBe(2500)
    })

    it.each([40, 50, 60] as const)('aplica el factor térmico %i Kcal/h·m³ directo', (thermalFactor) => {
        const room = makeRoom({ area: 10, height: 2, thermalFactor, hasExteriorWall: false, windowsLevel: 'sin-ventanas' })
        expect(calculateRoomPower(room)).toBe(10 * 2 * thermalFactor)
    })

    it('suma +15% por pared exterior', () => {
        // volumen = 10; base = 10*50 = 500; +15% = 575
        const room = makeRoom({ area: 5, height: 2, thermalFactor: 50, hasExteriorWall: true, windowsLevel: 'sin-ventanas' })
        expect(calculateRoomPower(room)).toBe(575)
    })

    it.each([
        ['sin-ventanas', 0] as const,
        ['pocas', 0.05] as const,
        ['normales', 0.10] as const,
        ['muchas', 0.20] as const,
    ])('aplica el ajuste por ventanas "%s" (+%s)', (windowsLevel, adjustment) => {
        // volumen = 10; base = 10*50 = 500
        const room = makeRoom({ area: 5, height: 2, thermalFactor: 50, hasExteriorWall: false, windowsLevel })
        expect(calculateRoomPower(room)).toBe(Math.round(500 * (1 + adjustment)))
    })

    it('suma los ajustes de pared y ventanas en vez de multiplicarlos', () => {
        // volumen = 10; base = 500; ajuste total = 15% + 20% = 35% (NO 1.15*1.20)
        const room = makeRoom({ area: 5, height: 2, thermalFactor: 50, hasExteriorWall: true, windowsLevel: 'muchas' })
        const sumado = Math.round(500 * 1.35)
        const multiplicado = Math.round(500 * 1.15 * 1.20)
        expect(sumado).not.toBe(multiplicado) // confirma que el caso es relevante
        expect(calculateRoomPower(room)).toBe(sumado)
    })

    it('retorna 0 cuando el área es 0', () => {
        expect(calculateRoomPower(makeRoom({ area: 0 }))).toBe(0)
    })

    it('redondea al entero más cercano', () => {
        // volumen = 7 * 2.3 = 16.1; *50 = 805; +10% ventanas = 885.5 → redondea a 886
        const room = makeRoom({ area: 7, height: 2.3, thermalFactor: 50, hasExteriorWall: false, windowsLevel: 'normales' })
        expect(calculateRoomPower(room)).toBe(886)
    })

    it('acepta un objeto parcial que solo tenga los campos usados (sin radiatorIds/id/name)', () => {
        // calculateRoomPower no debería exigir más que area/height/thermalFactor/hasExteriorWall/windowsLevel
        const minimal = { area: 10, height: 2, thermalFactor: 40 as const, hasExteriorWall: false, windowsLevel: 'sin-ventanas' as const }
        expect(calculateRoomPower(minimal)).toBe(800)
    })
})

describe('calculateInstalledPower', () => {
    it('suma la potencia de los radiadores asignados a la habitación', () => {
        const room = makeRoom({ radiatorIds: ['rad-1', 'rad-2'] })
        const radiators = [
            makeRadiator({ id: 'rad-1', power: 1000 }),
            makeRadiator({ id: 'rad-2', power: 1500 }),
            makeRadiator({ id: 'rad-3', power: 9999 }), // no pertenece a la habitación
        ]
        expect(calculateInstalledPower(room, radiators)).toBe(2500)
    })

    it('retorna 0 si la habitación no tiene radiadores asignados', () => {
        const room = makeRoom({ radiatorIds: [] })
        expect(calculateInstalledPower(room, [makeRadiator({ id: 'rad-1', power: 1000 })])).toBe(0)
    })

    it('retorna 0 si no hay radiadores en absoluto', () => {
        const room = makeRoom({ radiatorIds: ['rad-1'] })
        expect(calculateInstalledPower(room, [])).toBe(0)
    })
})

describe('isPowerSufficient', () => {
    it('marca insuficiente cuando lo instalado es menor a lo requerido', () => {
        const room = makeRoom({ area: 20, height: 2.5, thermalFactor: 50, hasExteriorWall: false, windowsLevel: 'sin-ventanas', radiatorIds: ['rad-1'] })
        const radiators = [makeRadiator({ id: 'rad-1', power: 1000 })] // requerido = 2500
        const result = isPowerSufficient(room, radiators)
        expect(result.required).toBe(2500)
        expect(result.installed).toBe(1000)
        expect(result.sufficient).toBe(false)
        expect(result.percentage).toBe(40)
    })

    it('marca suficiente cuando lo instalado iguala exactamente lo requerido', () => {
        const room = makeRoom({ area: 20, height: 2.5, thermalFactor: 50, hasExteriorWall: false, windowsLevel: 'sin-ventanas', radiatorIds: ['rad-1'] })
        const radiators = [makeRadiator({ id: 'rad-1', power: 2500 })]
        const result = isPowerSufficient(room, radiators)
        expect(result.sufficient).toBe(true)
        expect(result.percentage).toBe(100)
    })

    it('marca suficiente cuando lo instalado supera lo requerido', () => {
        const room = makeRoom({ area: 20, height: 2.5, thermalFactor: 50, hasExteriorWall: false, windowsLevel: 'sin-ventanas', radiatorIds: ['rad-1'] })
        const radiators = [makeRadiator({ id: 'rad-1', power: 3000 })]
        const result = isPowerSufficient(room, radiators)
        expect(result.sufficient).toBe(true)
        expect(result.percentage).toBe(120)
    })

    it('no divide por cero cuando la potencia requerida es 0 (área 0)', () => {
        const room = makeRoom({ area: 0, radiatorIds: [] })
        const result = isPowerSufficient(room, [])
        expect(result.required).toBe(0)
        expect(result.percentage).toBe(0)
        expect(result.sufficient).toBe(true) // 0 >= 0
    })
})

describe('calculateBoilerPower', () => {
    it('dimensiona la caldera para que trabaje al 80% de su capacidad', () => {
        const radiators = [makeRadiator({ power: 1000 }), makeRadiator({ power: 1000 })]
        const result = calculateBoilerPower(radiators)
        expect(result.totalRadiatorPower).toBe(2000)
        expect(result.recommendedBoilerPower).toBe(2500) // 2000 / 0.80
        expect(result.workingPercentage).toBe(80)
    })

    it('retorna 0 cuando no hay radiadores', () => {
        const result = calculateBoilerPower([])
        expect(result.totalRadiatorPower).toBe(0)
        expect(result.recommendedBoilerPower).toBe(0)
    })

    it('redondea la potencia recomendada de caldera', () => {
        const radiators = [makeRadiator({ power: 1000 })]
        const result = calculateBoilerPower(radiators)
        expect(result.recommendedBoilerPower).toBe(Math.round(1000 / 0.80))
    })
})

describe('kcalToKw / kwToKcal', () => {
    it('convierte Kcal/h a kW usando 860 Kcal/h = 1 kW', () => {
        expect(kcalToKw(860)).toBe(1)
        expect(kcalToKw(1720)).toBe(2)
    })

    it('redondea kW a un decimal', () => {
        expect(kcalToKw(1000)).toBe(1.2) // 1000/860 = 1.1627... → 1.2
    })

    it('convierte kW a Kcal/h', () => {
        expect(kwToKcal(1)).toBe(860)
        expect(kwToKcal(2.5)).toBe(2150)
    })

    it('kcalToKw y kwToKcal son inversas dentro del margen de redondeo', () => {
        const original = 5000
        const roundTripped = kwToKcal(kcalToKw(original))
        expect(roundTripped).toBeCloseTo(original, -2) // tolerancia por el redondeo a 1 decimal de kW
    })

    it('maneja 0 sin errores', () => {
        expect(kcalToKw(0)).toBe(0)
        expect(kwToKcal(0)).toBe(0)
    })
})
