// node --test scripts/
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { partirSeccion, MAX_FRAGMENTO } from './fragmentos.mjs'

const ENC = 'Manual técnico — Capítulo 3 — Pérdidas — Los factores'

test('una sección corta queda en un solo fragmento, igual que antes', () => {
    const r = partirSeccion(ENC, 'renglón uno\nrenglón dos')
    assert.deepEqual(r, [`${ENC}\nrenglón uno\nrenglón dos`])
})

test('una sección larga se parte y no pierde ni un renglón', () => {
    const renglones = Array.from({ length: 80 }, (_, i) => `renglón ${i} `.padEnd(70, 'x'))
    const r = partirSeccion(ENC, renglones.join('\n'))
    assert.ok(r.length > 1)
    for (const f of r) assert.ok(f.length <= MAX_FRAGMENTO, `fragmento de ${f.length}`)
    const recuperado = r.map((f) => f.split('\n').slice(1)).flat()
    assert.deepEqual(recuperado, renglones)
})

test('del segundo tramo en adelante el encabezado avisa que sigue', () => {
    const r = partirSeccion(ENC, Array(60).fill('x'.repeat(100)).join('\n'))
    assert.ok(r[0].startsWith(`${ENC}\n`))
    assert.ok(r[1].startsWith(`${ENC} (continuación)\n`))
})

test('un renglón más largo que el fragmento se corta por palabra, sin perder palabras', () => {
    const palabras = Array.from({ length: 900 }, (_, i) => `p${i}`)
    const r = partirSeccion(ENC, palabras.join(' '))
    for (const f of r) assert.ok(f.length <= MAX_FRAGMENTO)
    const recuperado = r.map((f) => f.split('\n').slice(1).join(' ')).join(' ').split(' ')
    assert.deepEqual(recuperado, palabras)
})
