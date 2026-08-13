// Extrae los capítulos del manual técnico (src/content/manual/) a JSON plano,
// dividido en fragmentos por sección <h2>, listo para indexar en la base RAG.
//
// POR QUÉ EXISTE: hasta el 2026-08-13 el asistente NO tenía una sola línea del
// manual. Su base de conocimiento eran los 17 casos de errores, los códigos de
// falla y unos fragmentos de ACS y piletas sacados de PDFs. Mientras tanto el
// prompt le anunciaba "Manual Técnico: 14 capítulos", así que lo nombraba sin
// haberlo leído nunca: cuando decía "esto está en el manual", lo deducía.
//
// El tier de cada capítulo sale del temario (la fuente que ve el usuario), no
// del comentario de cabecera del archivo: sólo 3 de los 5 capítulos lo tienen.

import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const DIR = process.argv[2]        // app/src/content/manual
const TEMARIO = process.argv[3]    // app/src/app/routes/ManualTecnico.tsx
const OUT = process.argv[4]

function stripJsx(src) {
    return src
        .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, ' ')
        .replace(/<(li|p|h3|ol|ul|div)\b[^>]*>/g, '\n')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\{['"`]\s*['"`]\}/g, ' ')
        .replace(/\{[^}]*\}/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/[ \t]+/g, ' ')
        .replace(/\n{2,}/g, '\n')
        .split('\n').map(l => l.trim()).filter(Boolean).join('\n')
}

/**
 * Lee el temario del manual y devuelve id → { numero, titulo, descripcion, tier }.
 * Es el mismo listado que se muestra en pantalla, así que el tier que use el
 * asistente y el que ve el usuario no pueden separarse.
 */
function leerTemario(ruta) {
    const src = readFileSync(ruta, 'utf8')
    const capitulos = new Map()

    // Cada entrada del temario: id, numero, titulo, descripcion, acceso.
    const re = /id:\s*'([^']+)'[\s\S]{0,400}?numero:\s*(\d+)[\s\S]{0,400}?titulo:\s*'([^']+)'[\s\S]{0,600}?descripcion:\s*'([^']*)'[\s\S]{0,300}?acceso:\s*'([^']+)'/g

    let m
    while ((m = re.exec(src)) !== null) {
        capitulos.set(m[1], {
            numero: Number(m[2]),
            titulo: m[3],
            descripcion: m[4],
            tier: m[5],
        })
    }

    return capitulos
}

const temario = leerTemario(TEMARIO)
if (temario.size === 0) {
    console.error(`ERROR: no se pudo leer ningún capítulo del temario en ${TEMARIO}.`)
    console.error('Probablemente cambió la forma de las entradas y este parseo dejó de reconocerlas.')
    process.exit(1)
}

const chunks = []
const sinSecciones = []
const sinTemario = []

for (const file of readdirSync(DIR)) {
    if (!file.startsWith('cap') || !file.endsWith('.tsx')) continue

    // cap4-potencia.tsx → potencia (la misma clave que usa manualContent)
    const id = file.replace(/^cap\d+-/, '').replace(/\.tsx$/, '')
    const meta = temario.get(id)
    if (!meta) { sinTemario.push(file); continue }

    const src = readFileSync(join(DIR, file), 'utf8')
    const bodyStart = src.indexOf('export function')
    const body = bodyStart >= 0 ? src.slice(bodyStart) : ''

    // `<h2[^>]*>` aunque hoy los títulos del manual no lleven `id`: los casos ya
    // pasaron por eso y el parseo sin atributos los dejó de encontrar en silencio.
    const parts = body.split(/<h2[^>]*>([^<]*)<\/h2>/)

    const sections = []
    for (let i = 1; i < parts.length; i += 2) {
        const seccion = parts[i].trim()
        const texto = stripJsx(parts[i + 1] ?? '')
        if (texto.length > 40) sections.push({ seccion, texto })
    }

    const titulo = `Capítulo ${meta.numero} — ${meta.titulo}`

    // Fragmento 0: la ficha del capítulo, que es lo que mejor matchea cuando la
    // consulta es sobre el tema general y no sobre un párrafo puntual.
    chunks.push({
        source_id: `manual:cap-${id}#0`,
        tipo: 'manual',
        tier: meta.tier,
        titulo,
        seccion: 'De qué trata el capítulo',
        categoria: 'Manual técnico',
        contenido: `Manual técnico de Criterio Térmico — ${titulo}\n${meta.descripcion}`,
    })

    sections.forEach((s, i) => {
        chunks.push({
            source_id: `manual:cap-${id}#${i + 1}`,
            tipo: 'manual',
            tier: meta.tier,
            titulo,
            seccion: s.seccion,
            categoria: 'Manual técnico',
            contenido: `Manual técnico — ${titulo} — ${s.seccion}\n${s.texto}`.slice(0, 2800),
        })
    })

    console.log(`${id} (${meta.tier}): ${sections.length + 1} fragmentos`)
    if (sections.length === 0) sinSecciones.push(id)
}

writeFileSync(OUT, JSON.stringify({ documents: chunks }, null, 1))
console.log(`\nTotal manual: ${chunks.length} fragmentos → ${OUT}`)

// Mismas guardas que el extractor de casos: un capítulo que no aporta secciones
// o que no figura en el temario significa que el parseo se rompió. Terminar bien
// dejaría el índice viejo intacto y nadie se enteraría.
if (sinTemario.length > 0) {
    console.error(`\nERROR: capítulo(s) sin entrada en el temario: ${sinTemario.join(', ')}`)
    process.exit(1)
}
if (sinSecciones.length > 0) {
    console.error(`\nERROR: capítulo(s) sin ninguna sección <h2>: ${sinSecciones.join(', ')}`)
    process.exit(1)
}
