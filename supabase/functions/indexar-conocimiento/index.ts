// Criterio Térmico — Indexación de la base de conocimiento (RAG)
// Recibe fragmentos de contenido, genera su embedding con gte-small (modelo
// nativo del runtime de Supabase, sin costo de API) y los upserta en la tabla
// public.conocimiento. Solo invocable con la service_role key (uso administrativo).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Global del Edge Runtime de Supabase (no viene tipado en el SDK)
declare const Supabase: {
    ai: {
        Session: new (model: string) => {
            run(input: string, options: { mean_pool: boolean; normalize: boolean }): Promise<number[]>
        }
    }
}

interface Documento {
    source_id: string
    tipo: 'caso' | 'manual'
    titulo: string
    seccion?: string
    categoria?: string
    contenido: string
}

// Sesión de embeddings del runtime de Supabase (gte-small, 384 dims)
const embedder = new Supabase.ai.Session('gte-small')

Deno.serve(async (req: Request): Promise<Response> => {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Método no permitido' }), {
            status: 405, headers: { 'Content-Type': 'application/json' },
        })
    }

    // Autorización: exclusivamente el rol service_role. No es un endpoint público.
    // El gateway de Supabase ya valida la firma del JWT antes de invocar la función;
    // acá verificamos el claim `role` del payload en vez de comparar contra un valor
    // fijo. Este patrón es robusto a la rotación/migración de API keys (comparar
    // contra SUPABASE_SERVICE_ROLE_KEY se rompe cuando el proyecto pasa al sistema
    // nuevo de keys, porque el valor inyectado deja de ser la JWT legacy).
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const auth = req.headers.get('Authorization') ?? ''
    const token = auth.replace(/^Bearer\s+/i, '')
    let role: string | null = null
    try {
        role = JSON.parse(atob(token.split('.')[1] ?? '')).role ?? null
    } catch { /* token que no es un JWT decodificable */ }
    if (role !== 'service_role') {
        return new Response(JSON.stringify({ error: 'No autorizado' }), {
            status: 401, headers: { 'Content-Type': 'application/json' },
        })
    }

    try {
        const { documents } = await req.json() as { documents: Documento[] }
        if (!Array.isArray(documents) || documents.length === 0) {
            return new Response(JSON.stringify({ error: 'Se requiere documents[]' }), {
                status: 400, headers: { 'Content-Type': 'application/json' },
            })
        }

        const supabase = createClient(Deno.env.get('SUPABASE_URL')!, serviceKey)
        let indexados = 0
        const errores: string[] = []

        for (const doc of documents) {
            if (!doc.source_id || !doc.titulo || !doc.contenido) {
                errores.push(`${doc.source_id ?? '(sin id)'}: incompleto`)
                continue
            }

            // mean_pool + normalize: misma configuración que usará la búsqueda,
            // los vectores deben generarse de forma idéntica en ambos lados
            const embedding = await embedder.run(doc.contenido, {
                mean_pool: true,
                normalize: true,
            })

            const { error } = await supabase.from('conocimiento').upsert({
                source_id: doc.source_id,
                tipo: doc.tipo,
                titulo: doc.titulo,
                seccion: doc.seccion ?? null,
                categoria: doc.categoria ?? null,
                contenido: doc.contenido,
                embedding: JSON.stringify(embedding),
                updated_at: new Date().toISOString(),
            }, { onConflict: 'source_id' })

            if (error) errores.push(`${doc.source_id}: ${error.message}`)
            else indexados++
        }

        return new Response(JSON.stringify({ indexados, errores }), {
            headers: { 'Content-Type': 'application/json' },
        })
    } catch (error) {
        const detail = error instanceof Error ? error.message : 'Error interno'
        return new Response(JSON.stringify({ error: 'Error al indexar', detail }), {
            status: 500, headers: { 'Content-Type': 'application/json' },
        })
    }
})
