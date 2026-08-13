// Extrae los casos de error de los TSX de src/content/errores/ a JSON plano
// dividido en fragmentos por sección <h2>, listo para indexar en la base RAG.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const DIR = process.argv[2]
const OUT = process.argv[3]

function stripJsx(src) {
    return src
        .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, ' ')      // comentarios JSX
        .replace(/<(li|p|h3|ol|ul|div)\b[^>]*>/g, '\n')     // bloques → salto de línea
        .replace(/<[^>]+>/g, ' ')                            // resto de tags
        .replace(/\{['"`]\s*['"`]\}/g, ' ')                  // {' '}
        .replace(/\{[^}]*\}/g, ' ')                          // expresiones JSX
        .replace(/&nbsp;/g, ' ')
        .replace(/[ \t]+/g, ' ')
        .replace(/\n{2,}/g, '\n')
        .split('\n').map(l => l.trim()).filter(Boolean).join('\n')
}

function getMeta(src, key) {
    const m = src.match(new RegExp(`${key}:\\s*'([^']*)'`))
    return m ? m[1] : null
}

const chunks = []
const sinSecciones = []
for (const file of readdirSync(DIR)) {
    if (!file.endsWith('.tsx')) continue
    const src = readFileSync(join(DIR, file), 'utf8')
    const id = getMeta(src, 'id')
    const titulo = getMeta(src, 'titulo')
    const categoria = getMeta(src, 'categoria')
    const resumen = getMeta(src, 'resumen')
    const tier = getMeta(src, 'tier') ?? 'free'
    if (!id || !titulo) { console.error(`SKIP ${file}: sin metadata`); continue }

    const bodyStart = src.indexOf('export function')
    const body = bodyStart >= 0 ? src.slice(bodyStart) : ''
    // `<h2[^>]*>` y no `<h2>`: desde que los títulos llevan `id` para el índice
    // temático, la versión sin atributos no encontraba UNA sola sección. El
    // extractor devolvía sólo el resumen, el reindexado hacía upsert y los
    // fragmentos viejos quedaban en la base — así que no había error a la vista
    // y el asistente contestó tres semanas con el cuerpo de los casos vencido.
    const parts = body.split(/<h2[^>]*>([^<]*)<\/h2>/)

    // parts[0] = preámbulo, luego pares [tituloSeccion, contenido]
    const sections = []
    for (let i = 1; i < parts.length; i += 2) {
        const seccion = parts[i].trim()
        const texto = stripJsx(parts[i + 1] ?? '')
        if (texto.length > 40) sections.push({ seccion, texto })
    }

    // Fragmento 0: ficha del caso (lo que mejor matchea síntomas descritos)
    chunks.push({
        source_id: `caso:${id}#0`,
        tipo: 'caso',
        tier,
        titulo,
        seccion: 'Resumen del caso',
        categoria,
        contenido: `Caso: ${titulo}\nCategoría: ${categoria}\n${resumen ?? ''}`,
    })

    sections.forEach((s, i) => {
        chunks.push({
            source_id: `caso:${id}#${i + 1}`,
            tipo: 'caso',
            tier,
            titulo,
            seccion: s.seccion,
            categoria,
            contenido: `Caso: ${titulo} — ${s.seccion}\n${s.texto}`.slice(0, 2800),
        })
    })
    console.log(`${id}: ${sections.length + 1} fragmentos`)
    if (sections.length === 0) sinSecciones.push(id)
}

writeFileSync(OUT, JSON.stringify({ documents: chunks }, null, 1))
console.log(`\nTotal: ${chunks.length} fragmentos → ${OUT}`)

// Guarda: un caso sin secciones significa que el parseo dejó de encontrarlas
// (pasó de verdad al agregarle `id` a los <h2>). Sin esto el script termina
// bien, el reindexado hace upsert de un solo fragmento por caso, los viejos
// quedan intactos y el asistente sigue contestando con contenido vencido sin
// que nada falle. Cortar acá es la única forma de enterarse.
if (sinSecciones.length > 0) {
    console.error(
        `\nERROR: ${sinSecciones.length} caso(s) sin ninguna sección <h2>: ${sinSecciones.join(', ')}` +
        `\nO el caso está vacío, o cambió el marcado y este extractor dejó de reconocerlo.`
    )
    process.exit(1)
}
