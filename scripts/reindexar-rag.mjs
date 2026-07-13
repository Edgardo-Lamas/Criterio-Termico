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
const MAX_RETRIES = 4         // 546/5xx son transitorios (cold start / CPU); el upsert es idempotente
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const scriptDir = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(scriptDir, '..')
const erroresDir = join(repoRoot, 'app', 'src', 'content', 'errores')

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

// 2) Generar los fragmentos con el extractor existente (a un archivo temporal)
function extraerCasos() {
    const tmp = mkdtempSync(join(tmpdir(), 'ct-rag-'))
    const outFile = join(tmp, 'casos.json')
    execFileSync(
        'node',
        [join(scriptDir, 'extraer-casos.mjs'), erroresDir, outFile],
        { encoding: 'utf8', stdio: 'inherit' },
    )
    const { documents } = JSON.parse(readFileSync(outFile, 'utf8'))
    rmSync(tmp, { recursive: true, force: true })
    return documents
}

// 3) Postear en lotes
async function indexar(documents, serviceKey) {
    let indexadosTotal = 0
    const erroresTotal = []
    for (let i = 0; i < documents.length; i += BATCH_SIZE) {
        const lote = documents.slice(i, i + BATCH_SIZE)
        const n = Math.floor(i / BATCH_SIZE) + 1
        const total = Math.ceil(documents.length / BATCH_SIZE)

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
const documents = extraerCasos()
console.log(`\nPosteando ${documents.length} fragmentos en lotes de ${BATCH_SIZE}...\n`)
const { indexadosTotal, erroresTotal } = await indexar(documents, serviceKey)
console.log(`\n✅ Indexados: ${indexadosTotal}/${documents.length}`)
if (erroresTotal.length) {
    console.log(`⚠ Errores (${erroresTotal.length}):`)
    erroresTotal.forEach((e) => console.log(`  - ${e}`))
    process.exit(1)
}
