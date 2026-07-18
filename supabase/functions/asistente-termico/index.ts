// Criterio Térmico — Asistente Técnico Flotante
// Edge Function (Deno) que actúa como proxy seguro hacia la API de Anthropic.
// Gestiona autenticación, rate limiting por tier y streaming SSE.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.39.0'

// Global del Edge Runtime de Supabase (no viene tipado en el SDK)
declare const Supabase: {
    ai: {
        Session: new (model: string) => {
            run(input: string, options: { mean_pool: boolean; normalize: boolean }): Promise<number[]>
        }
    }
}

// Sesión de embeddings para la búsqueda semántica (gte-small, 384 dims).
// Misma configuración (mean_pool + normalize) que usa indexar-conocimiento.
const embedder = new Supabase.ai.Session('gte-small')

// ── Tipos ─────────────────────────────────────────────────────────────────────

type Tier = 'free' | 'pro' | 'premium'

interface TierConfig {
    maxRequestsPerDay: number
    maxTokens: number
}

interface Message {
    role: 'user' | 'assistant'
    content: string
}

// ── Configuración por tier ────────────────────────────────────────────────────

const TIER_CONFIG: Record<Tier, TierConfig> = {
    free:    { maxRequestsPerDay: 10,  maxTokens: 512  },
    pro:     { maxRequestsPerDay: 50,  maxTokens: 1024 },
    premium: { maxRequestsPerDay: 200, maxTokens: 2048 },
}

// ── CORS ──────────────────────────────────────────────────────────────────────
// ALLOWED_ORIGIN se configura en Supabase Dashboard > Edge Functions.
// Centraliza el dominio permitido para no hardcodear el host del frontend
// (facilita migrar de GitHub Pages a otro hosting sin tocar código).

const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') ?? 'https://edgardo-lamas.github.io'

const corsHeaders = {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
}

// ── Búsqueda semántica (RAG) sobre la base de conocimiento ───────────────────
// Busca los fragmentos de casos documentados más parecidos a la consulta y los
// devuelve formateados para inyectar en el system prompt. Si algo falla, el
// asistente responde sin contexto extra (degradación silenciosa, nunca rompe).

interface FragmentoConocimiento {
    source_id: string
    tipo: string
    titulo: string
    seccion: string | null
    categoria: string | null
    contenido: string
    similarity: number
}

async function buscarConocimiento(consulta: string): Promise<string> {
    try {
        const embedding = await embedder.run(consulta.slice(0, 1500), {
            mean_pool: true,
            normalize: true,
        })

        // Cliente service_role: match_conocimiento no es ejecutable por anon/authenticated
        const admin = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
        )

        const { data, error } = await admin.rpc('match_conocimiento', {
            query_embedding: JSON.stringify(embedding),
            match_count: 4,
            min_similarity: 0.35,
        })

        if (error || !data || data.length === 0) return ''

        const ETIQUETA_TIPO: Record<string, string> = {
            caso: 'Caso documentado en la sección Errores Frecuentes',
            falla: 'Tabla de fallas del manual oficial del fabricante',
            manual: 'Documentación técnica de la plataforma',
            criterio: 'Criterio de oficio documentado',
        }

        const fragmentos = (data as FragmentoConocimiento[])
            .map(f => `[${ETIQUETA_TIPO[f.tipo] ?? 'Documento'}: ${f.titulo}${f.seccion ? ` — ${f.seccion}` : ''}]\n${f.contenido}`)
            .join('\n\n')

        return `

CONOCIMIENTO DOCUMENTADO EN LA PLATAFORMA, RELEVANTE A ESTA CONSULTA:
${fragmentos}

Cuando la consulta coincida con este material, basá tu respuesta en él y citá la
fuente tal como está etiquetada (caso de Errores Frecuentes, manual del fabricante,
documentación técnica o criterio de oficio), nombrándola por su título. Si algún
fragmento no aplica realmente a la consulta, ignoralo.`
    } catch (error) {
        const detail = error instanceof Error ? error.message : String(error)
        console.error('[asistente-termico] RAG no disponible:', detail)
        return ''
    }
}

// ── Contexto del Simulador 2D ─────────────────────────────────────────────────
// El frontend manda un resumen del proyecto abierto (lo arma asistenteContext.ts
// con los mismos números que muestra la plataforma). Acá solo se formatea con
// las reglas de uso; la validación de tier y tamaño se hace en el handler.

function formatearContextoSimulador(contexto: string): string {
    if (!contexto) return ''
    return `

PROYECTO ABIERTO EN EL SIMULADOR 2D (estado actual del diseño del instalador, generado por la plataforma al momento de esta consulta):
${contexto}

CÓMO USAR ESTE CONTEXTO:
- Las cargas y potencias ya vienen calculadas por la plataforma: usá esos números tal cual, no los recalcules ni los corrijas
- Nombrá los elementos como figuran en el resumen (R1, R2, nombres de ambientes y zonas)
- Si un ambiente tiene menos potencia instalada que su carga, o hay radiadores sin ambiente asignado, avisalo aunque no te lo pregunten
- Si preguntan por la caldera: se dimensiona con la suma de cargas de los ambientes calefaccionados ÷ 0,80 — nunca desde los emisores
- No inventes elementos que no estén en el resumen; si falta un dato, pedíselo al instalador
- Si la consulta no tiene relación con el proyecto, respondé normal sin forzar el contexto`
}

// ── System prompt de Criterio ─────────────────────────────────────────────────

function buildSystemPrompt(tier: Tier, userName: string, ragContext: string, contextoSimulador: string): string {
    const herramientasDisponibles = [
        '- Calculadora de Potencia (gratis): calcula la potencia térmica por ambiente',
        ...(tier !== 'free' ? [
            '- Calculadora de Diámetros (Pro): diámetros óptimos de tuberías según caudal',
            '- Calculadora de Caudal (Pro): caudal necesario por circuito',
            '- Calculadora de Piso Radiante (Pro): tuberías, circuitos y materiales',
            '- Calculadora de Bombas (Pro): dimensionado de bomba circuladora y presurizadora',
        ] : []),
        ...(tier === 'premium' ? [
            '- Simulador 2D (Premium): diseño completo sobre plano con presupuesto y exportación BIM',
        ] : []),
        '- Manual Técnico: 14 capítulos sobre diseño, cálculo e instalación',
        '- Errores Frecuentes: +200 casos documentados con problema, causa y solución',
    ].join('\n')

    return `Sos Criterio, el asistente técnico de Criterio Térmico — una plataforma para instaladores profesionales de calefacción por radiadores en Argentina y Latinoamérica.

Estás hablando con ${userName}, un instalador con tier ${tier}.

TU ROL:
Ayudar a instaladores a resolver dudas técnicas, interpretar resultados de calculadoras y diagnosticar problemas en instalaciones de calefacción hidrónica. Hablás como un colega experimentado con años en obra, no como un chatbot genérico ni como un académico.

ESTILO DE COMUNICACIÓN:
- Español latinoamericano: "vos", "tenés", "hacés", "usás"
- Directo y sin vueltas. Si algo está mal, lo decís claro
- Vocabulario del oficio: caldera, radiador, circuito, purgar, equilibrar, ΔT, caudal, retorno, manifold, colector, presurizadora
- Sin frases corporativas: nada de "¡Claro que sí!", "¡Excelente pregunta!" ni emojis en exceso
- Cuando no sabés algo con certeza, lo decís. No inventás datos técnicos
- Respuestas cortas y directas. Si necesitás dar pasos, usá lista numerada
- Máximo 150 palabras salvo casos que requieren desarrollo técnico

DOMINIO DE CONOCIMIENTO:
- Calefacción central por radiadores (agua caliente, baja temperatura)
- Sistemas bitubo punto a punto con colectores (estándar actual en Argentina)
- Dimensionado: potencia térmica, caudales, diámetros de tuberías
- Piso radiante: serpentines, circuitos, manifolds (distintos instaladores que radiadores)
- Bombas circuladoras y presurizadoras
- Equilibrado hidráulico de instalaciones
- Diagnóstico: ruidos, zonas frías, ciclos cortos, goteos, presión
- Normativa IRAM (Argentina) y criterios de buena práctica
- El sistema monotubo ya NO se usa — estándar actual: bitubo punto a punto con colectores
- Piso radiante + radiadores combinados: poco común en Argentina, requiere válvulas de zona, mezcladoras y termostatos

FÓRMULAS Y CRITERIOS DE CÁLCULO DE LA PLATAFORMA (usá exactamente estos valores,
son los mismos que dan las calculadoras):
- Potencia por ambiente: Volumen (m² × altura) × factor térmico según aislación:
  40 kcal/h·m³ (buena aislación: construcción nueva, doble vidrio),
  50 kcal/h·m³ (aislación normal, estándar),
  60 kcal/h·m³ (poca aislación: construcción antigua)
- Ajustes sobre la potencia base (se SUMAN entre sí, no se multiplican):
  pared exterior +15%; ventanas: pocas +5%, normales +10%, muchas +20%
- Potencia de caldera: suma de radiadores ÷ 0.80 (la caldera debe trabajar al
  80% de su capacidad máxima, nunca al límite)
- Caudal por radiador: potencia (kcal/h) ÷ ΔT (°C entre ida y retorno, típico 20°C) = litros/hora
- Todo valor que des lleva margen de seguridad conservador (+10-15%)

HERRAMIENTAS DISPONIBLES EN LA PLATAFORMA:
${herramientasDisponibles}

REGLAS:
1. Si la consulta encaja en una herramienta de la plataforma, sugerila por nombre
2. Si el instalador describe síntomas, identificá la causa más probable antes de pedir más datos
3. Los valores de cálculo que des siempre son conservadores (+10-15% de margen de seguridad)
4. Si no tenés certeza técnica, decilo claramente en lugar de improvisar
5. Cuando el problema requiere inspección física obligatoria, avisalo explícitamente

LIMITACIONES QUE MENCIONÁS CUANDO APLICAN:
- No reemplazás el relevamiento en obra
- No recomendás marcas comerciales específicas
- No generás presupuestos de obra (para eso está el Simulador 2D)
- Sobre trabajos de gas: el diagnóstico y los criterios técnicos (presiones, tiraje,
  ventilación, regulación de llama, poder calorífico) son conocimiento de oficio y podés
  explicarlos con detalle al instalador. PERO toda intervención sobre la instalación de
  gas en sí (conexión de artefactos, modificación o extensión de cañerías de gas,
  habilitaciones y certificaciones) debe ser ejecutada o certificada por un gasista
  matriculado según normativa ENARGAS — aclaralo cuando la consulta implique ese tipo
  de intervención, sin negarte a explicar la parte técnica${formatearContextoSimulador(contextoSimulador)}${ragContext}`
}

// ── Handler principal ─────────────────────────────────────────────────────────

Deno.serve(async (req: Request): Promise<Response> => {
    // Preflight CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    if (req.method !== 'POST') {
        return new Response(
            JSON.stringify({ error: 'Método no permitido' }),
            { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    try {
        // ── 1. Autenticación ─────────────────────────────────────────────────
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            return new Response(
                JSON.stringify({ error: 'Token de autenticación requerido' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const supabase = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_ANON_KEY')!,
            { global: { headers: { Authorization: authHeader } } }
        )

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return new Response(
                JSON.stringify({ error: 'No autorizado' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // ── 2. Perfil del usuario ────────────────────────────────────────────
        const { data: profile } = await supabase
            .from('profiles')
            .select('tier, email')
            .eq('id', user.id)
            .single()

        const tier = (profile?.tier ?? 'free') as Tier
        const userName = (profile?.email ?? user.email ?? 'instalador').split('@')[0]
        const tierConfig = TIER_CONFIG[tier]

        // ── 3. Rate limiting atómico ─────────────────────────────────────────
        // increment_ai_usage hace INSERT ... ON CONFLICT DO UPDATE en una sola
        // operación, eliminando la race condition del patrón read-then-write.
        const { data: newCount, error: usageError } = await supabase
            .rpc('increment_ai_usage', { p_user_id: user.id })

        if (usageError) {
            console.error('[asistente-termico] Error en rate limiting:', usageError.message)
            return new Response(
                JSON.stringify({ error: 'Error interno al verificar límite de uso' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        if ((newCount as number) > tierConfig.maxRequestsPerDay) {
            return new Response(
                JSON.stringify({
                    error: 'Límite diario alcanzado',
                    limit: tierConfig.maxRequestsPerDay,
                    tier,
                    message: tier === 'free'
                        ? `Llegaste al límite de ${tierConfig.maxRequestsPerDay} consultas diarias del plan gratuito. Actualizá a Pro para tener ${TIER_CONFIG.pro.maxRequestsPerDay} consultas/día.`
                        : `Llegaste al límite de ${tierConfig.maxRequestsPerDay} consultas diarias de tu plan ${tier}.`
                }),
                { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // ── 5. Parsear y validar el body ─────────────────────────────────────
        const MAX_MESSAGES = 50
        const MAX_CONTENT_LENGTH = 4000
        const MAX_CONTEXTO_SIMULADOR_LENGTH = 4000

        const body = await req.json() as { messages: Message[]; contextoSimulador?: unknown }
        const { messages } = body

        // Contexto del Simulador 2D: solo premium (el Simulador es Premium) y
        // con tope de tamaño — es texto que entra al system prompt y cuesta tokens.
        const contextoSimulador = tier === 'premium' && typeof body.contextoSimulador === 'string'
            ? body.contextoSimulador.slice(0, MAX_CONTEXTO_SIMULADOR_LENGTH)
            : ''

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return new Response(
                JSON.stringify({ error: 'Se requiere al menos un mensaje' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        if (messages.length > MAX_MESSAGES) {
            return new Response(
                JSON.stringify({ error: 'Demasiados mensajes en el contexto' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Sanitizar: truncar contenido largo y asegurar roles válidos
        const sanitizedMessages = messages
            .filter(m => m.role === 'user' || m.role === 'assistant')
            .map(m => ({
                role: m.role,
                content: String(m.content).slice(0, MAX_CONTENT_LENGTH),
            }))

        if (sanitizedMessages.length === 0) {
            return new Response(
                JSON.stringify({ error: 'No hay mensajes válidos' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // ── 6. Búsqueda semántica sobre los casos documentados ───────────────
        // Se busca con el último mensaje del usuario; si falla devuelve ''.
        const ultimoMensajeUsuario = [...sanitizedMessages]
            .reverse()
            .find(m => m.role === 'user')?.content ?? ''
        const ragContext = await buscarConocimiento(ultimoMensajeUsuario)

        // ── 7. Llamar a Anthropic con streaming ──────────────────────────────
        const anthropic = new Anthropic({
            apiKey: Deno.env.get('ANTHROPIC_API_KEY')!,
        })

        const stream = await anthropic.messages.stream({
            model: 'claude-sonnet-4-6',
            max_tokens: tierConfig.maxTokens,
            system: buildSystemPrompt(tier, userName, ragContext, contextoSimulador),
            messages: sanitizedMessages,
        })

        // ── 7. Stream SSE al frontend ────────────────────────────────────────
        const encoder = new TextEncoder()

        const readable = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of stream) {
                        if (
                            chunk.type === 'content_block_delta' &&
                            chunk.delta.type === 'text_delta'
                        ) {
                            const data = JSON.stringify({ text: chunk.delta.text })
                            controller.enqueue(encoder.encode(`data: ${data}\n\n`))
                        }
                    }
                    controller.enqueue(encoder.encode('data: [DONE]\n\n'))
                } catch (streamError) {
                    const errData = JSON.stringify({ error: 'Error en el stream' })
                    controller.enqueue(encoder.encode(`data: ${errData}\n\n`))
                } finally {
                    controller.close()
                }
            }
        })

        return new Response(readable, {
            headers: {
                ...corsHeaders,
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            }
        })

    } catch (error) {
        const message = error instanceof Error ? error.message : 'Error interno'
        console.error('[asistente-termico] Error:', message)
        return new Response(
            JSON.stringify({ error: 'Error interno del servidor', detail: message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
