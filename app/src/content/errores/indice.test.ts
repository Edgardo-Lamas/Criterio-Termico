import { describe, it, expect } from 'vitest'

/**
 * El índice temático enlaza cada entrada contra anclas escritas A MANO en los
 * TSX de los casos. Si al corregir un caso se renombra, se parte o se borra un
 * <h2 id="..."> el enlace NO da error: deja al instalador al principio de la
 * página y nadie se entera. Con este volumen no se audita a ojo.
 *
 * Por eso el chequeo se hace sobre el TEXTO de cada archivo y no importando el
 * módulo: lo que hay que verificar es justamente lo que está escrito en el TSX.
 * Las fuentes se cargan con `?raw`, que es del toolchain de Vite — así el test
 * no necesita las APIs de Node, que el tsconfig de la app excluye a propósito.
 */

const fuentes = import.meta.glob('./*.tsx', {
    query: '?raw',
    import: 'default',
    eager: true,
}) as Record<string, string>

const archivosDeCasos = Object.keys(fuentes).sort()

/** Los `ancla:` declarados en el `cubre[]` de un caso. */
function anclasDeclaradas(fuente: string): string[] {
    return [...fuente.matchAll(/ancla:\s*'([^']+)'/g)].map(m => m[1])
}

/** Los `id` realmente presentes en el TSX (destinos de enlace). */
function idsPresentes(fuente: string): Set<string> {
    return new Set([...fuente.matchAll(/id="([^"]+)"/g)].map(m => m[1]))
}

describe('índice temático — integridad de las anclas', () => {
    it('encuentra los archivos de casos', () => {
        expect(archivosDeCasos.length).toBeGreaterThan(0)
    })

    for (const archivo of archivosDeCasos) {
        it(`${archivo}: ninguna entrada apunta a un ancla inexistente`, () => {
            const fuente = fuentes[archivo]
            const ids = idsPresentes(fuente)

            const huerfanas = anclasDeclaradas(fuente).filter(ancla => !ids.has(ancla))

            expect(huerfanas, `anclas sin <h2 id="..."> en ${archivo}`).toEqual([])
        })
    }

    it('cada entrada del índice declara término, ancla y familia', () => {
        const incompletas: string[] = []

        for (const archivo of archivosDeCasos) {
            const fuente = fuentes[archivo]
            const terminos = [...fuente.matchAll(/termino:\s*'([^']+)'/g)].length
            const anclas = anclasDeclaradas(fuente).length
            const familias = [...fuente.matchAll(/familia:\s*'([^']+)'/g)].length

            if (terminos !== anclas || anclas !== familias) {
                incompletas.push(
                    `${archivo}: ${terminos} términos, ${anclas} anclas, ${familias} familias`
                )
            }
        }

        expect(incompletas).toEqual([])
    })
})
