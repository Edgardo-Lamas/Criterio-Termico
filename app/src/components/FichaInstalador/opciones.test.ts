import { describe, it, expect } from 'vitest'
// Los dos archivos entran como texto con `?raw`, no con `node:fs`: el tsconfig
// de la app apunta al navegador y meterle los tipos de Node para un test
// dejaría pasar `process` y `Buffer` en código que corre en el celular del
// instalador. `?raw` ya está declarado por los tipos de Vite.
import migracion from '../../../../supabase/migrations/20260911_ficha_instalador.sql?raw'
import asistente from '../../../../supabase/functions/asistente-termico/index.ts?raw'
import {
    PROVINCIAS, INSTALA, TRABAJOS, COMBUSTIBLES, MARCAS,
    NOTA_MAX, OTRAS_MAX, FICHA_VACIA, fichaTieneAlgo, type Ficha,
} from './opciones'

/**
 * La ficha del instalador vive en TRES lugares que tienen que decir lo mismo:
 * el check de la migración, esta pantalla y las tablas de traducción del
 * asistente. Si se separan, el fallo es MUDO de las dos maneras posibles:
 *
 * - opción acá que la base no acepta → el guardado explota en la cara del
 *   instalador con un error de Postgres que no dice nada;
 * - opción acá que el asistente no conoce → se guarda bien, y Martín
 *   sencillamente no la lee. Nadie se entera nunca.
 *
 * Por eso el test lee los archivos de verdad en vez de repetir las listas.
 */
const TODAS = [
    ['provincia', PROVINCIAS],
    ['instala', INSTALA],
    ['trabajos', TRABAJOS],
    ['combustible', COMBUSTIBLES],
    ['marcas', MARCAS],
] as const

describe('las opciones de la ficha, contra la base y contra el asistente', () => {
    for (const [campo, opciones] of TODAS) {
        for (const [codigo] of opciones) {
            it(`«${codigo}» (${campo}) lo acepta la migración`, () => {
                expect(migracion).toContain(`'${codigo}'`)
            })

            it(`«${codigo}» (${campo}) lo sabe traducir el asistente`, () => {
                // Las claves con guion van entrecomilladas y las demás no.
                const estaEscrito =
                    asistente.includes(`'${codigo}':`) || asistente.includes(`${codigo}:`)
                expect(estaEscrito).toBe(true)
            })
        }
    }

    it('los topes de texto son los mismos que los de la base', () => {
        expect(migracion).toContain(`char_length(nota) <= ${NOTA_MAX}`)
        expect(migracion).toContain(`char_length(marcas_otras) <= ${OTRAS_MAX}`)
    })

    it('no hay códigos repetidos entre campos', () => {
        const todos = TODAS.flatMap(([, o]) => o.map(([c]) => c))
        expect(new Set(todos).size).toBe(todos.length)
    })
})

describe('fichaTieneAlgo', () => {
    it('la ficha vacía no tiene nada: Martín queda como estaba', () => {
        expect(fichaTieneAlgo(FICHA_VACIA)).toBe(false)
    })

    it('un solo campo ya cuenta', () => {
        expect(fichaTieneAlgo({ ...FICHA_VACIA, provincia: 'santa-fe' })).toBe(true)
        expect(fichaTieneAlgo({ ...FICHA_VACIA, trabajos: ['service'] })).toBe(true)
        expect(fichaTieneAlgo({ ...FICHA_VACIA, marcas: ['peisa'] })).toBe(true)
    })

    it('texto en blanco NO cuenta: si no, el botón de borrar aparece por unos espacios', () => {
        const soloEspacios: Ficha = { ...FICHA_VACIA, nota: '   ', marcas_otras: '  ' }
        expect(fichaTieneAlgo(soloEspacios)).toBe(false)
    })
})
