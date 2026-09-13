// Tests del correo de resumen. Se corren con:
//   deno test supabase/functions/_shared/correoResumen.test.ts
//
// Lo que más importa acá NO es el formato: es que nada de lo que escribe el
// modelo pueda salir como HTML vivo. El texto viaja del navegador al servidor y
// vuelve dentro de un correo firmado por el dominio.

import { assert, assertEquals, assertStringIncludes } from 'jsr:@std/assert@1'
import {
    escaparHtml, inlineAHtml, markdownAHtml, markdownATexto, asuntoDe, armarCorreo,
} from './correoResumen.ts'

Deno.test('escaparHtml tapa los cuatro caracteres que rompen el correo', () => {
    assertEquals(escaparHtml('<b>"a" & b</b>'), '&lt;b&gt;&quot;a&quot; &amp; b&lt;/b&gt;')
})

Deno.test('🔴 el HTML que venga en el texto NO sale vivo', () => {
    const html = markdownAHtml('Mirá esto <script>alert(1)</script> y <img src=x onerror=1>')

    assert(!html.includes('<script>'), 'se coló una etiqueta script')
    assert(!html.includes('<img'), 'se coló una etiqueta img')
    assertStringIncludes(html, '&lt;script&gt;')
})

Deno.test('🔴 tampoco adentro de una negrita', () => {
    const html = inlineAHtml('**<script>alert(1)</script>**')

    assertStringIncludes(html, '<strong>&lt;script&gt;')
    assert(!html.includes('<script>'))
})

Deno.test('la negrita y el código corto se convierten', () => {
    const html = inlineAHtml('El **caudal** se mide en `l/h`')

    assertStringIncludes(html, '<strong>caudal</strong>')
    assertStringIncludes(html, '<code')
    assertStringIncludes(html, 'l/h')
})

Deno.test('los títulos salen como línea destacada, no como h1 suelto', () => {
    const html = markdownAHtml('## Cómo diferenciarlo')

    assertStringIncludes(html, 'Cómo diferenciarlo')
    assertStringIncludes(html, 'font-weight:700')
})

Deno.test('la lista con viñetas es una ul de verdad', () => {
    const html = markdownAHtml('- Primero\n- Segundo\n- Tercero')

    assertStringIncludes(html, '<ul')
    assertEquals(html.split('<li').length - 1, 3)
})

Deno.test('la lista numerada es una ol, y no se mezcla con la de viñetas', () => {
    const html = markdownAHtml('1. Uno\n2. Dos\n\n- Otra cosa')

    assertStringIncludes(html, '<ol')
    assertStringIncludes(html, '<ul')
})

Deno.test('el separador sale como línea, no como tres guiones', () => {
    const html = markdownAHtml('Antes\n\n---\n\nDespués')

    assertStringIncludes(html, '<hr')
    assert(!html.includes('---'))
})

Deno.test('las líneas seguidas son UN párrafo, no tres', () => {
    const html = markdownAHtml('Una línea\ny otra\ny otra más')

    assertEquals(html.split('<p ').length - 1, 1)
})

Deno.test('la versión en texto plano no lleva asteriscos', () => {
    const texto = markdownATexto('## Título\n\nEl **caudal** con `l/h`\n- Un ítem')

    assert(!texto.includes('**'), 'quedaron asteriscos de markdown')
    assert(!texto.includes('`'), 'quedaron comillas de código')
    assertStringIncludes(texto, 'TÍTULO')
    assertStringIncludes(texto, '- Un ítem')
})

Deno.test('el asunto es la pregunta, sin marcas de markdown', () => {
    assertEquals(asuntoDe('¿Por qué **cicla** la caldera?'), '¿Por qué cicla la caldera?')
})

Deno.test('una pregunta larga se corta antes de que la corte el cliente de correo', () => {
    const asunto = asuntoDe('a'.repeat(200))

    assert(asunto.length <= 78, `el asunto quedó en ${asunto.length}`)
    assert(asunto.endsWith('…'))
})

Deno.test('sin pregunta, el asunto igual dice algo', () => {
    assertEquals(asuntoDe('   '), 'Tu consulta con Martín')
})

Deno.test('el correo lleva la pregunta y la respuesta', () => {
    const { html, texto, asunto } = armarCorreo({
        pregunta: '¿Cuánto da un elemento de 500?',
        respuesta: 'Unas **200 kcal/h** por elemento.',
    })

    assertStringIncludes(asunto, '¿Cuánto da un elemento de 500?')
    assertStringIncludes(html, '¿Cuánto da un elemento de 500?')
    assertStringIncludes(html, '<strong>200 kcal/h</strong>')
    assertStringIncludes(texto, '200 kcal/h')
    assertStringIncludes(texto, 'LO QUE PREGUNTASTE')
})

Deno.test('🔴 la fecha va en hora de Buenos Aires, no en UTC', () => {
    // 23:30 UTC del 13 son las 20:30 del 13 acá. Sin zona fija, el correo
    // mandado a la noche llevaría la fecha del día siguiente.
    const { html } = armarCorreo({
        pregunta: 'x',
        respuesta: 'y',
        fecha: new Date('2026-09-13T23:30:00Z'),
    })

    assertStringIncludes(html, '13 de septiembre')
    assert(!html.includes('14 de septiembre'))
})

Deno.test('el correo dice que salió porque lo pidieron', () => {
    const { html, texto } = armarCorreo({ pregunta: 'x', respuesta: 'y' })

    assertStringIncludes(html, 'lo pediste con el botón')
    assertStringIncludes(texto, 'lo pediste con el botón')
})
