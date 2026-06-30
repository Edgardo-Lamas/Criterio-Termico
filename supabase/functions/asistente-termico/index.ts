// Criterio Térmico — Asistente Técnico Flotante
// Edge Function (Deno) que actúa como proxy seguro hacia la API de Anthropic.
// Gestiona autenticación, rate limiting por tier y streaming SSE.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.39.0'

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

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// ── System prompt de Criterio ─────────────────────────────────────────────────

function buildSystemPrompt(tier: Tier, userName: string): string {
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
- Para instalaciones de gas: siempre derivar a gasista matriculado`
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

        const body = await req.json() as { messages: Message[] }
        const { messages } = body

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

        // ── 6. Llamar a Anthropic con streaming ──────────────────────────────
        const anthropic = new Anthropic({
            apiKey: Deno.env.get('ANTHROPIC_API_KEY')!,
        })

        const stream = await anthropic.messages.stream({
            model: 'claude-sonnet-4-6',
            max_tokens: tierConfig.maxTokens,
            system: buildSystemPrompt(tier, userName),
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
