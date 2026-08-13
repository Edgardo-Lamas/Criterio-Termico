import { describe, it, expect } from 'vitest'
import { parsearMarkdown, parsearInline } from './markdownAsistente'

describe('parsearInline', () => {
    it('deja el texto plano sin tocar', () => {
        expect(parsearInline('la presión sube sola')).toEqual([
            { tipo: 'texto', texto: 'la presión sube sola' },
        ])
    })

    it('reconoce la negrita en el medio de la oración', () => {
        expect(parsearInline('cerrá la **válvula de llenado** y esperá')).toEqual([
            { tipo: 'texto', texto: 'cerrá la ' },
            { tipo: 'fuerte', texto: 'válvula de llenado' },
            { tipo: 'texto', texto: ' y esperá' },
        ])
    })

    it('reconoce código corto', () => {
        expect(parsearInline('el `ΔT` típico')).toEqual([
            { tipo: 'texto', texto: 'el ' },
            { tipo: 'codigo', texto: 'ΔT' },
            { tipo: 'texto', texto: ' típico' },
        ])
    })

    it('NO toma un asterisco suelto como cursiva: en fórmulas es multiplicación', () => {
        // Con cursiva de un asterisco, "20 *m²* × 2,5" y "5 * 3" se rompen.
        expect(parsearInline('superficie 20 * altura 2,5')).toEqual([
            { tipo: 'texto', texto: 'superficie 20 * altura 2,5' },
        ])
    })

    it('no se cuelga con asteriscos sin cerrar', () => {
        expect(parsearInline('esto quedó **a medias')).toEqual([
            { tipo: 'texto', texto: 'esto quedó **a medias' },
        ])
    })
})

describe('parsearMarkdown', () => {
    it('separa párrafos por línea en blanco', () => {
        const bloques = parsearMarkdown('Primero esto.\n\nDespués esto otro.')
        expect(bloques).toHaveLength(2)
        expect(bloques[0]).toEqual({
            tipo: 'parrafo',
            contenido: [{ tipo: 'texto', texto: 'Primero esto.' }],
        })
    })

    it('arma una lista numerada con los pasos', () => {
        const bloques = parsearMarkdown('1. Calcular la potencia\n2. Sumar los ambientes\n3. Dividir por 0,80')
        expect(bloques).toHaveLength(1)
        expect(bloques[0]).toMatchObject({ tipo: 'lista', ordenada: true })
        expect((bloques[0] as { items: unknown[] }).items).toHaveLength(3)
    })

    it('arma una lista con viñetas', () => {
        const bloques = parsearMarkdown('- purgar\n- equilibrar')
        expect(bloques[0]).toMatchObject({ tipo: 'lista', ordenada: false })
    })

    it('separa la lista numerada de la de viñetas', () => {
        const bloques = parsearMarkdown('1. uno\n- otro')
        expect(bloques).toHaveLength(2)
        expect(bloques[0]).toMatchObject({ ordenada: true })
        expect(bloques[1]).toMatchObject({ ordenada: false })
    })

    it('reconoce títulos y separadores', () => {
        const bloques = parsearMarkdown('## La causa\n\n---\n\nTexto')
        expect(bloques[0]).toMatchObject({ tipo: 'titulo' })
        expect(bloques[1]).toEqual({ tipo: 'separador' })
        expect(bloques[2]).toMatchObject({ tipo: 'parrafo' })
    })

    it('aplica negrita adentro de un ítem de lista', () => {
        const bloques = parsearMarkdown('1. Cerrá la **llave de llenado**')
        const items = (bloques[0] as { items: unknown[][] }).items
        expect(items[0]).toEqual([
            { tipo: 'texto', texto: 'Cerrá la ' },
            { tipo: 'fuerte', texto: 'llave de llenado' },
        ])
    })

    it('una línea suelta después de una lista la cierra', () => {
        const bloques = parsearMarkdown('- uno\n- dos\nEsto ya no es ítem.')
        expect(bloques).toHaveLength(2)
        expect(bloques[0]).toMatchObject({ tipo: 'lista' })
        expect(bloques[1]).toMatchObject({ tipo: 'parrafo' })
    })

    it('devuelve vacío con texto vacío', () => {
        expect(parsearMarkdown('')).toEqual([])
    })

    it('respuesta real del asistente: no queda ningún asterisco a la vista', () => {
        const real = [
            'Hay dos causas y se distinguen con una prueba.',
            '',
            '**Cómo diferenciarlo:** cerrá la válvula de llenado.',
            '',
            '1. Si la presión sigue subiendo, el vaso está fallando',
            '2. Si se estabiliza, la válvula era el problema',
            '',
            '---',
            '',
            'Esto está documentado en **Errores Frecuentes**.',
        ].join('\n')

        const bloques = parsearMarkdown(real)
        const textoVisible = JSON.stringify(bloques)

        expect(textoVisible).not.toContain('**')
        expect(bloques.some(b => b.tipo === 'lista')).toBe(true)
        expect(bloques.some(b => b.tipo === 'separador')).toBe(true)
    })
})
