import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { crearVigia, interpretarLineaSSE } from './esperaDelAsistente'

/**
 * El 2026-10-23 la base estaba pausada y Martín quedó «pensando» para siempre:
 * el chat no tenía tiempo límite. El vigía es lo que lo corta y avisa.
 */
describe('crearVigia', () => {
    beforeEach(() => vi.useFakeTimers())
    afterEach(() => vi.useRealTimers())

    it('🔴 si nadie contesta, corta y guarda el aviso', () => {
        const controller = new AbortController()
        const vigia = crearVigia(controller)

        vigia.vigilar(1000, 'no contesta')
        vi.advanceTimersByTime(999)
        expect(controller.signal.aborted).toBe(false)

        vi.advanceTimersByTime(1)
        expect(controller.signal.aborted).toBe(true)
        expect(vigia.aviso).toBe('no contesta')
    })

    it('volver a vigilar rearma el reloj: mide silencio, no el total', () => {
        const controller = new AbortController()
        const vigia = crearVigia(controller)

        vigia.vigilar(1000, 'silencio')
        vi.advanceTimersByTime(800)
        vigia.vigilar(1000, 'silencio')   // llegó un pedazo de respuesta
        vi.advanceTimersByTime(800)

        expect(controller.signal.aborted).toBe(false)
    })

    it('apagado, no corta nunca', () => {
        const controller = new AbortController()
        const vigia = crearVigia(controller)

        vigia.vigilar(1000, 'x')
        vigia.apagar()
        vi.advanceTimersByTime(5000)

        expect(controller.signal.aborted).toBe(false)
    })

    it('si corta el instalador, no hay aviso: es una cancelación, no una falla', () => {
        const controller = new AbortController()
        const vigia = crearVigia(controller)

        vigia.vigilar(1000, 'x')
        controller.abort()

        expect(vigia.aviso).toBeNull()
    })

    it('🔴 corta también lo que no acepta signal (la sesión de Supabase colgada)', async () => {
        const controller = new AbortController()
        const vigia = crearVigia(controller)
        const colgada = new Promise<boolean>(() => {})

        vigia.vigilar(1000, 'no contesta')
        const espera = vigia.esperar(colgada)
        vi.advanceTimersByTime(1000)

        await expect(espera).rejects.toMatchObject({ name: 'AbortError' })
    })

    it('lo que contesta a tiempo pasa igual', async () => {
        const vigia = crearVigia(new AbortController())

        vigia.vigilar(1000, 'x')

        await expect(vigia.esperar(Promise.resolve(true))).resolves.toBe(true)
    })
})

describe('interpretarLineaSSE', () => {
    it('un pedazo de texto', () => {
        expect(interpretarLineaSSE('data: {"text":"Purgá el radiador"}'))
            .toEqual({ tipo: 'texto', texto: 'Purgá el radiador' })
    })

    it('el cierre', () => {
        expect(interpretarLineaSSE('data: [DONE]')).toEqual({ tipo: 'fin' })
    })

    it('🔴 el error del servidor NO se pierde (antes lo tragaba el catch del parseo)', () => {
        expect(interpretarLineaSSE('data: {"error":"Error en el stream"}')).toEqual({ tipo: 'error' })
    })

    it('líneas que no son datos o vienen rotas se saltean', () => {
        expect(interpretarLineaSSE('')).toBeNull()
        expect(interpretarLineaSSE(': comentario')).toBeNull()
        expect(interpretarLineaSSE('data: {roto')).toBeNull()
    })
})
