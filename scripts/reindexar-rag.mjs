// Reindexa la base de conocimiento RAG del asistente térmico.
// Extrae los casos de src/content/errores/, y postea los fragmentos a la
// Edge Function indexar-conocimiento en lotes chicos (el runtime free se queda
// sin CPU con lotes grandes). La service_role key se obtiene del Supabase CLI
// en tiempo de ejecución — nunca se escribe en disco ni se pasa por argumentos.
//
// Uso:
//   node scripts/reindexar-rag.mjs
//
// Requisitos: Supabase CLI logueado y proyecto linkeado (supabase link).

import { execFileSync } from 'node:child_process'
import { readFileSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

const PROJECT_REF = 'ntxkjtirkgqkjlzphvtd'
const FUNCTIONS_URL = `https://${PROJECT_REF}.supabase.co/functions/v1`
const ENDPOINT = `${FUNCTIONS_URL}/indexar-conocimiento`
const BATCH_SIZE = 3          // gte-small es CPU-intensivo; lotes chicos evitan el límite (HTTP 546)
// Y además un tope de caracteres por lote: contar fragmentos no alcanza. El
// 2026-10-28 el lote 19 (los tres primeros fragmentos de `presion-pasivador`,
// 6.181 caracteres juntos) dio 546 en todos los reintentos, dos corridas
// seguidas, mientras los demás lotes de 3 pasaban.
const MAX_CARACTERES_LOTE = 4500
const MAX_RETRIES = 4         // 546/5xx son transitorios (cold start / CPU); el upsert es idempotente
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const scriptDir = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(scriptDir, '..')
const erroresDir = join(repoRoot, 'app', 'src', 'content', 'errores')
const manualDir = join(repoRoot, 'app', 'src', 'content', 'manual')
// El tier y el título de cada capítulo salen del temario, que es lo que ve el
// usuario: si el asistente y la pantalla no leen el mismo listado, se separan.
const temarioFile = join(repoRoot, 'app', 'src', 'app', 'routes', 'ManualTecnico.tsx')

// 1) Obtener la service_role key.
//    - En CI: llega por env (secret de GitHub SUPABASE_SERVICE_ROLE_KEY), donde
//      el Supabase CLI no está logueado.
//    - Local: se saca del CLI y queda solo en memoria de este proceso.
function getServiceKey() {
    const fromEnv = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
    if (fromEnv) return fromEnv

    const out = execFileSync(
        'supabase',
        ['projects', 'api-keys', '--project-ref', PROJECT_REF, '-o', 'json'],
        { encoding: 'utf8' },
    )
    const keys = JSON.parse(out)
    const svc = keys.find((k) => k.id === 'service_role')
    if (!svc?.api_key) {
        throw new Error(
            'No se encontró la service_role key: definí SUPABASE_SERVICE_ROLE_KEY ' +
            'o logueá el Supabase CLI (supabase login + supabase link)',
        )
    }
    return svc.api_key
}

// 2) Generar los fragmentos (a archivos temporales)
//
// Son DOS fuentes: los casos de errores y los capítulos del manual. El manual
// no se indexaba: el asistente respondía sin haber leído una sola línea de él,
// mientras el prompt se lo anunciaba como material disponible.
function extraerTodo() {
    const tmp = mkdtempSync(join(tmpdir(), 'ct-rag-'))
    const documents = []

    const casosFile = join(tmp, 'casos.json')
    execFileSync(
        'node',
        [join(scriptDir, 'extraer-casos.mjs'), erroresDir, casosFile],
        { encoding: 'utf8', stdio: 'inherit' },
    )
    documents.push(...JSON.parse(readFileSync(casosFile, 'utf8')).documents)

    const manualFile = join(tmp, 'manual.json')
    execFileSync(
        'node',
        [join(scriptDir, 'extraer-manual.mjs'), manualDir, temarioFile, manualFile],
        { encoding: 'utf8', stdio: 'inherit' },
    )
    documents.push(...JSON.parse(readFileSync(manualFile, 'utf8')).documents)

    rmSync(tmp, { recursive: true, force: true })
    return documents
}

// 3) Postear en lotes
// Hasta BATCH_SIZE fragmentos y MAX_CARACTERES_LOTE de contenido; un fragmento
// que solo ya pasa el tope va en un lote propio.
function armarLotes(documents) {
    const lotes = []
    let actual = []
    let caracteres = 0
    for (const d of documents) {
        const largo = d.contenido.length
        if (actual.length && (actual.length === BATCH_SIZE || caracteres + largo > MAX_CARACTERES_LOTE)) {
            lotes.push(actual)
            actual = []
            caracteres = 0
        }
        actual.push(d)
        caracteres += largo
    }
    if (actual.length) lotes.push(actual)
    return lotes
}

async function indexar(documents, serviceKey) {
    let indexadosTotal = 0
    const erroresTotal = []
    const lotes = armarLotes(documents)
    for (const [i, lote] of lotes.entries()) {
        const n = i + 1
        const total = lotes.length

        let json = {}
        let ok = false
        for (let intento = 1; intento <= MAX_RETRIES; intento++) {
            const res = await fetch(ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${serviceKey}`,
                },
                body: JSON.stringify({ documents: lote }),
            })
            json = await res.json().catch(() => ({}))
            if (res.ok) { ok = true; break }
            // 5xx (incluye 546 resource limit) → reintentar con backoff; 4xx → abortar el lote
            if (res.status < 500 || intento === MAX_RETRIES) {
                console.error(`Lote ${n}/${total}: HTTP ${res.status} — ${json.error ?? ''} ${json.detail ?? ''}`)
                erroresTotal.push(`lote ${n}: HTTP ${res.status}`)
                break
            }
            await sleep(1500 * intento)
        }
        if (!ok) continue
        indexadosTotal += json.indexados ?? 0
        if (json.errores?.length) erroresTotal.push(...json.errores)
        console.log(`Lote ${n}/${total}: ${json.indexados} indexados${json.errores?.length ? ` (${json.errores.length} errores)` : ''}`)
    }
    return { indexadosTotal, erroresTotal }
}

const serviceKey = getServiceKey()
const documents = extraerTodo()
console.log(`\nPosteando ${documents.length} fragmentos en lotes de hasta ${BATCH_SIZE} y ${MAX_CARACTERES_LOTE} caracteres...\n`)
const { indexadosTotal, erroresTotal } = await indexar(documents, serviceKey)
console.log(`\n✅ Indexados: ${indexadosTotal}/${documents.length}`)

// 4) Purgar huérfanos: el upsert pisa lo que sigue existiendo pero nunca borra.
// Si un capítulo o un caso queda con menos secciones, la vieja sobrevive y el
// asistente la sigue leyendo (pasó con el cap. 5 el 2026-10-26). Sólo si la
// indexación salió entera: con lotes fallidos la lista de vigentes es la misma,
// pero no hay apuro en borrar mientras algo está roto.
if (!erroresTotal.length) {
    const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${serviceKey}` },
        body: JSON.stringify({
            purgar: {
                prefijos: ['caso:', 'manual:cap-'],
                vigentes: documents.map((d) => d.source_id),
            },
        }),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) {
        erroresTotal.push(`purga: HTTP ${res.status} — ${json.error ?? ''} ${json.detail ?? ''}`)
    } else if (json.borrados?.length) {
        console.log(`🧹 Huérfanos borrados (${json.borrados.length}): ${json.borrados.join(', ')}`)
    } else {
        console.log('🧹 Sin huérfanos.')
    }
}

if (erroresTotal.length) {
    console.log(`⚠ Errores (${erroresTotal.length}):`)
    erroresTotal.forEach((e) => console.log(`  - ${e}`))
    process.exit(1)
}
