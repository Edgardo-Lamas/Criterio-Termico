// Tests de la purga de fragmentos huérfanos del RAG. Se corren con:
//   deno test supabase/functions/_shared/huerfanos.test.ts

import { assertEquals, assertStringIncludes } from 'jsr:@std/assert@1'
import { calcularHuerfanos, PREFIJOS_PURGABLES } from './huerfanos.ts'

const prefijos = [...PREFIJOS_PURGABLES]

Deno.test('🔴 el caso real del 26/10: el cap. 5 quedó con 6 secciones y la #6 sobrevivía', () => {
    const existentes = [0, 1, 2, 3, 4, 5, 6].map((n) => `manual:cap-radiadores#${n}`)
    const vigentes = [0, 1, 2, 3, 4, 5].map((n) => `manual:cap-radiadores#${n}`)
    // Con la sección vieja sola sobre 7 se pasaría del tope: se agrega contexto
    // como en la base real (los demás capítulos y casos).
    const resto = Array.from({ length: 40 }, (_, i) => `caso:x#${i}`)

    const r = calcularHuerfanos([...existentes, ...resto], [...vigentes, ...resto], prefijos)

    assertEquals(r.frenada, null)
    assertEquals(r.huerfanos, ['manual:cap-radiadores#6'])
})

Deno.test('🔴 las fallas por marca y las fichas sueltas del manual NO se tocan', () => {
    const existentes = ['falla:baxi-eco4s#0', 'manual:acs-acumulacion#0', 'caso:a#0']
    const r = calcularHuerfanos(existentes, ['caso:a#0'], prefijos)

    assertEquals(r.huerfanos, [])
    assertEquals(r.frenada, null)
})

Deno.test('🔴 un prefijo fuera de la lista se rechaza entero', () => {
    const r = calcularHuerfanos(['falla:x#0'], ['caso:a#0'], ['falla:'])

    assertEquals(r.huerfanos, [])
    assertStringIncludes(r.frenada ?? '', 'falla:')
})

Deno.test('🔴 sin vigentes no se borra nada (extracción vacía)', () => {
    const r = calcularHuerfanos(['caso:a#0'], [], prefijos)

    assertEquals(r.huerfanos, [])
    assertStringIncludes(r.frenada ?? '', 'vacía')
})

Deno.test('🔴 si se iría más del 20 % se frena: es más probable una extracción rota', () => {
    const existentes = Array.from({ length: 10 }, (_, i) => `caso:a#${i}`)
    const vigentes = existentes.slice(0, 5)

    const r = calcularHuerfanos(existentes, vigentes, prefijos)

    assertEquals(r.huerfanos.length, 5)
    assertStringIncludes(r.frenada ?? '', '5 de 10')
})

Deno.test('sin huérfanos no hay nada que hacer', () => {
    const ids = ['caso:a#0', 'manual:cap-b#0']
    assertEquals(calcularHuerfanos(ids, ids, prefijos), { huerfanos: [], frenada: null })
})
