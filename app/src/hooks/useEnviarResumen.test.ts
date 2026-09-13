import { describe, it, expect } from 'vitest'
import { claveDeRespuesta } from './useEnviarResumen'

/**
 * La clave decide qué botón se ve como «ya enviado».
 *
 * Si fuera la POSICIÓN del mensaje, limpiar el chat reciclaría los índices y la
 * primera respuesta de la charla nueva aparecería como si ya la hubieran
 * mandado por correo — sin forma de mandarla.
 */
describe('claveDeRespuesta', () => {
    it('la misma respuesta da la misma clave', () => {
        const texto = 'El caudal se calcula con la potencia y el salto térmico.'

        expect(claveDeRespuesta(texto)).toBe(claveDeRespuesta(texto))
    })

    it('dos respuestas distintas dan claves distintas', () => {
        expect(claveDeRespuesta('Primera respuesta')).not.toBe(claveDeRespuesta('Segunda respuesta'))
    })

    it('🔴 dos respuestas que empiezan igual pero siguen distinto NO se confunden', () => {
        const a = 'Revisá el caudal de la bomba antes que nada, porque ahí suele estar el problema.'
        const b = 'Revisá el caudal de la bomba antes que nada, y después mirá el vaso de expansión.'

        expect(claveDeRespuesta(a)).not.toBe(claveDeRespuesta(b))
    })

    it('la respuesta vacía tiene su propia clave y no rompe', () => {
        expect(claveDeRespuesta('')).toBe('0:')
    })
})
