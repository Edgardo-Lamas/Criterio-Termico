import { describe, it, expect } from 'vitest'
import { precioMensual, PRECIO_MENSUAL } from './precios'

describe('precios', () => {
    it('muestra los precios vigentes con el formato de la pantalla de planes', () => {
        expect(precioMensual('pro')).toBe('$30.000/mes')
        expect(precioMensual('premium')).toBe('$40.000/mes')
    })

    it('el plan gratuito va sin «/mes»', () => {
        expect(precioMensual('free')).toBe('$0')
        expect(PRECIO_MENSUAL.free).toBe(0)
    })

    it('el premium sale más caro que el pro (si esto se da vuelta, es un typo)', () => {
        expect(PRECIO_MENSUAL.premium).toBeGreaterThan(PRECIO_MENSUAL.pro)
    })
})

/**
 * 🔴 EL TEST QUE IMPORTA. El muro de pago estuvo dos cambios de precio atrás
 * —«ARS 9.999/mes» mientras la pantalla de planes pedía $40.000— porque el
 * número estaba escrito a mano en un componente y nadie lo tocó al cambiarlo.
 *
 * Esto recorre el código y falla si aparece un precio mensual suelto fuera de
 * `precios.ts`. No se arregla borrando el test: se arregla pidiéndole el número
 * a `precioMensual()`.
 *
 * Lee los archivos con `import.meta.glob` de Vite y no con `node:fs` a
 * propósito: estos tests corren con los tipos del navegador, sin `@types/node`.
 */
describe('ningún precio escrito a mano fuera de precios.ts', () => {
    const FUENTES = import.meta.glob('../**/*.{ts,tsx}', {
        query: '?raw',
        import: 'default',
        eager: true,
    }) as Record<string, string>

    // «$30.000/mes», «ARS 9.999/mes», «ARS 2999 / mes»…
    const PATRON = /(?:\$|ARS\s*)\s?\d{1,3}(?:[.,]\d{3})*\s*\/\s*mes|ARS\s?\d{3,}/i

    const archivos = Object.entries(FUENTES).filter(
        ([ruta]) => !ruta.endsWith('/precios.ts') && !ruta.endsWith('/precios.test.ts'),
    )

    interface Culpable { linea: string; n: number }

    it.each(archivos)('%s', (_ruta: string, contenido: string) => {
        const culpables: Culpable[] = contenido
            .split('\n')
            .map((linea: string, i: number): Culpable => ({ linea: linea.trim(), n: i + 1 }))
            // Los comentarios pueden citar precios viejos: ahí está la historia.
            .filter((c: Culpable) => !c.linea.startsWith('//') && !c.linea.startsWith('*'))
            .filter((c: Culpable) => PATRON.test(c.linea))

        expect(
            culpables,
            'precio escrito a mano — pedíselo a precioMensual() de lib/precios.ts:\n' +
            culpables.map((c: Culpable) => `  línea ${c.n}: ${c.linea}`).join('\n'),
        ).toHaveLength(0)
    })
})
