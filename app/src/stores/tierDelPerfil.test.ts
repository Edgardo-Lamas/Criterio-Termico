import { describe, it, expect, vi } from 'vitest'
import {
    leerTierDelPerfil, esFalloDeRed, esTierValido,
    type RespuestaPerfil, type ErrorDePerfil,
} from './tierDelPerfil'

/**
 * El caso que originó todo esto, copiado del evento de Sentry del 9/9 a las
 * 17:00 (issue 7722287584). Lo que importa es que `code` viene VACÍO: así se
 * ve un fetch que no llegó al servidor.
 */
const FALLO_DE_RED: ErrorDePerfil = {
    code: '',
    details: 'TypeError: Failed to fetch',
    hint: '',
    message: 'TypeError: Failed to fetch (ntxkjtirkgqkjlzphvtd.supabase.co)',
}

/** No hay fila en `profiles` para ese id: la base contestó, y contestó vacío. */
const SIN_FILA: ErrorDePerfil = {
    code: 'PGRST116',
    details: 'The result contains 0 rows',
    hint: '',
    message: 'JSON object requested, multiple (or no) rows returned',
}

/** Un permiso revocado. La base contestó, y hay que enterarse. */
const PERMISO_DENEGADO: ErrorDePerfil = {
    code: '42501',
    details: '',
    hint: '',
    message: 'permission denied for table profiles',
}

const ok = (tier: string | null): RespuestaPerfil => ({ data: { tier }, error: null })
const falla = (error: ErrorDePerfil): RespuestaPerfil => ({ data: null, error })

/** Devuelve las respuestas en orden, y cuenta cuántas veces la consultaron. */
function consultaQueDevuelve(...respuestas: RespuestaPerfil[]) {
    let i = 0
    return vi.fn(async () => respuestas[Math.min(i++, respuestas.length - 1)])
}

/** En los tests no se espera de verdad: el reintento tiene que ser inmediato. */
const sinEsperar = { esperar: async () => { } }

describe('esFalloDeRed', () => {
    it('un error sin code es un fetch que no llegó', () => {
        expect(esFalloDeRed(FALLO_DE_RED)).toBe(true)
    })

    it('un error sin la propiedad code también', () => {
        expect(esFalloDeRed({ message: 'Failed to fetch' })).toBe(true)
    })

    it('un error con code es la respuesta de la base, no un fallo de red', () => {
        expect(esFalloDeRed(SIN_FILA)).toBe(false)
        expect(esFalloDeRed(PERMISO_DENEGADO)).toBe(false)
    })
})

describe('esTierValido', () => {
    it('acepta los tres tiers que existen', () => {
        expect(esTierValido('free')).toBe(true)
        expect(esTierValido('pro')).toBe(true)
        expect(esTierValido('premium')).toBe(true)
    })

    it('rechaza cualquier otra cosa', () => {
        expect(esTierValido('vip')).toBe(false)
        expect(esTierValido('')).toBe(false)
        expect(esTierValido(null)).toBe(false)
        expect(esTierValido(undefined)).toBe(false)
        expect(esTierValido(2)).toBe(false)
    })
})

describe('leerTierDelPerfil — cuando la consulta sale bien', () => {
    it('devuelve el tier que dice la base, sin incidente', async () => {
        const { tier, incidente } = await leerTierDelPerfil(consultaQueDevuelve(ok('premium')), sinEsperar)

        expect(tier).toBe('premium')
        expect(incidente.tipo).toBe('ninguno')
    })

    it('no consulta dos veces', async () => {
        const consultar = consultaQueDevuelve(ok('pro'))
        await leerTierDelPerfil(consultar, sinEsperar)

        expect(consultar).toHaveBeenCalledTimes(1)
    })

    it('un tier que no existe queda en free', async () => {
        const { tier } = await leerTierDelPerfil(consultaQueDevuelve(ok('vip')), sinEsperar)

        expect(tier).toBe('free')
    })

    it('sin fila y sin error —no debería pasar— queda en free', async () => {
        const { tier } = await leerTierDelPerfil(consultaQueDevuelve({ data: null, error: null }), sinEsperar)

        expect(tier).toBe('free')
    })
})

describe('leerTierDelPerfil — cuando falla la red', () => {
    it('reintenta una vez, y si el reintento anda nadie se entera', async () => {
        const consultar = consultaQueDevuelve(falla(FALLO_DE_RED), ok('premium'))

        const { tier, incidente } = await leerTierDelPerfil(consultar, { tierPrevio: 'premium', ...sinEsperar })

        expect(consultar).toHaveBeenCalledTimes(2)
        expect(tier).toBe('premium')
        expect(incidente.tipo).toBe('ninguno')
    })

    it('🔴 el caso del 9/9: con el tier en memoria, la cuenta NO se degrada', async () => {
        const { tier, incidente } = await leerTierDelPerfil(
            consultaQueDevuelve(falla(FALLO_DE_RED)),
            { tierPrevio: 'premium', ...sinEsperar },
        )

        expect(tier).toBe('premium')
        expect(incidente.tipo).toBe('red-sin-consecuencia')
    })

    it('conserva también un pro, no sólo el premium', async () => {
        const { tier } = await leerTierDelPerfil(
            consultaQueDevuelve(falla(FALLO_DE_RED)),
            { tierPrevio: 'pro', ...sinEsperar },
        )

        expect(tier).toBe('pro')
    })

    it('sin tier previo no hay nada que conservar: free, y se avisa', async () => {
        const { tier, incidente } = await leerTierDelPerfil(consultaQueDevuelve(falla(FALLO_DE_RED)), sinEsperar)

        expect(tier).toBe('free')
        expect(incidente.tipo).toBe('red-degradado')
    })

    it('espera entre un intento y el otro', async () => {
        const esperar = vi.fn(async () => { })
        await leerTierDelPerfil(consultaQueDevuelve(falla(FALLO_DE_RED)), { esperar })

        expect(esperar).toHaveBeenCalledWith(600)
    })
})

describe('leerTierDelPerfil — cuando contesta la base', () => {
    it('no hay fila: free, y es la respuesta correcta', async () => {
        const { tier, incidente } = await leerTierDelPerfil(consultaQueDevuelve(falla(SIN_FILA)), sinEsperar)

        expect(tier).toBe('free')
        expect(incidente.tipo).toBe('base')
    })

    it('no reintenta: la base ya contestó', async () => {
        const consultar = consultaQueDevuelve(falla(SIN_FILA))
        await leerTierDelPerfil(consultar, sinEsperar)

        expect(consultar).toHaveBeenCalledTimes(1)
    })

    it('🔴 un permiso revocado NO se conserva como premium: hay que verlo caer', async () => {
        const { tier, incidente } = await leerTierDelPerfil(
            consultaQueDevuelve(falla(PERMISO_DENEGADO)),
            { tierPrevio: 'premium', ...sinEsperar },
        )

        expect(tier).toBe('free')
        expect(incidente.tipo).toBe('base')
    })

    it('el error viaja en el incidente, para poder titularlo con su code', async () => {
        const { incidente } = await leerTierDelPerfil(consultaQueDevuelve(falla(PERMISO_DENEGADO)), sinEsperar)

        expect(incidente.tipo === 'base' && incidente.error.code).toBe('42501')
    })
})
