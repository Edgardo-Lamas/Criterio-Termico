// Criterio Térmico — Análisis de plano con visión (Etapa 3 del auto-diseño)
// Edge Function (Deno) que manda la imagen del plano a Claude y devuelve, por
// ambiente, los datos térmicos que hoy el instalador carga a mano: pared
// exterior, nivel de ventanas y lado de la puerta. Claude lee las etiquetas
// impresas del plano ("Cocina", "Dormitorio 1") y los símbolos de ventana y
// puerta. Solo Premium; se cuenta contra el uso diario de IA como el asistente.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.39.0'

// ── Tipos ─────────────────────────────────────────────────────────────────────

type Tier = 'free' | 'pro' | 'premium'

// Estructura que devuelve el análisis (alineada con el modelo Room del frontend)
interface AmbienteAnalizado {
    nombre: string
    paredExterior: boolean
    ventanas: 'sin-ventanas' | 'pocas' | 'normales' | 'muchas'
    puertaLado: 'arriba' | 'abajo' | 'izquierda' | 'derecha' | null
    confianza: 'alta' | 'media' | 'baja'
}

// ── CORS ──────────────────────────────────────────────────────────────────────

const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') ?? 'https://criterio-termico.vercel.app'

const corsHeaders = {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
}

// Límite de análisis de plano por día — es una operación con imagen (más
// costosa que una consulta de texto), así que tiene su propio cupo, más chico.
const MAX_ANALISIS_POR_DIA = 20

// ── Prompt de análisis ─────────────────────────────────────────────────────────

function buildSystemPrompt(nombresConocidos: string[]): string {
    const listaAmbientes = nombresConocidos.length > 0
        ? `\n\nEl instalador ya cargó estos ambientes en el sistema: ${nombresConocidos.join(', ')}. Devolvé un objeto por cada uno de ellos, usando EXACTAMENTE ese nombre en el campo "nombre". Si ves ambientes en el plano que no están en esa lista, agregalos también.`
        : '\n\nDetectá todos los ambientes que veas rotulados en el plano.'

    return `Sos un asistente técnico que interpreta planos arquitectónicos para instaladores de calefacción. Analizás la imagen de un plano de planta y extraés, por cada ambiente, los datos que afectan el cálculo de la carga térmica.

Para CADA ambiente identificá:

1. **paredExterior** (boolean): ¿el ambiente linda con al menos una pared del perímetro exterior de la vivienda? Las paredes exteriores se dibujan más gruesas y están en el borde del plano. Un ambiente interno (baño, pasillo, vestidor sin ventana al exterior) suele NO tener pared exterior.

2. **ventanas**: nivel de superficie vidriada según los símbolos de ventana (líneas dobles/triples interrumpiendo el muro, a veces con el rótulo de la abertura):
   - "sin-ventanas": no se ve ninguna ventana
   - "pocas": una ventana chica
   - "normales": una ventana estándar o dos chicas
   - "muchas": ventanal grande, varias ventanas, o paño vidriado importante

3. **puertaLado**: el lado del ambiente donde está la puerta de acceso principal (el símbolo de arco de puerta). Valores: "arriba", "abajo", "izquierda", "derecha", o null si no se distingue. Es el lado por donde entrarían las cañerías al ambiente.

4. **confianza**: "alta" si el ambiente y sus símbolos se ven claros; "media" si algo es dudoso; "baja" si tuviste que inferir mucho.
${listaAmbientes}

IMPORTANTE:
- Basate SOLO en lo que se ve en el plano. No inventes ventanas ni puertas que no distingas.
- Si un dato no se ve, usá el valor más conservador ("sin-ventanas", paredExterior según la posición, puertaLado null) y bajá la confianza.
- Los rótulos de ambientes suelen estar en español (Cocina, Comedor, Baño, Dormitorio, Sala, Lavandería, Pasillo, etc.).

Respondé ÚNICAMENTE con un objeto JSON válido, sin texto adicional ni markdown, con esta forma exacta:
{"ambientes": [{"nombre": "...", "paredExterior": true, "ventanas": "normales", "puertaLado": "abajo", "confianza": "alta"}]}`
}

// Extrae el JSON de la respuesta del modelo de forma robusta (por si viniera
// envuelto en ```json ... ``` o con texto alrededor).
function parsearRespuesta(texto: string): { ambientes: AmbienteAnalizado[] } {
    const limpio = texto.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()
    const inicio = limpio.indexOf('{')
    const fin = limpio.lastIndexOf('}')
    if (inicio === -1 || fin === -1) throw new Error('Respuesta sin JSON')
    const parsed = JSON.parse(limpio.slice(inicio, fin + 1))
    if (!parsed.ambientes || !Array.isArray(parsed.ambientes)) {
        throw new Error('JSON sin array de ambientes')
    }
    return parsed
}

// ── Handler principal ─────────────────────────────────────────────────────────

Deno.serve(async (req: Request): Promise<Response> => {
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

        // ── 2. Perfil y control de tier (solo Premium) ───────────────────────
        const { data: profile } = await supabase
            .from('profiles')
            .select('tier')
            .eq('id', user.id)
            .single()

        const tier = (profile?.tier ?? 'free') as Tier
        if (tier !== 'premium') {
            return new Response(
                JSON.stringify({
                    error: 'Función Premium',
                    message: 'El análisis de plano con IA está disponible en el plan Premium, junto con el Simulador 2D.',
                }),
                { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // ── 3. Rate limiting atómico (mismo contador que el asistente) ───────
        const { data: newCount, error: usageError } = await supabase
            .rpc('increment_ai_usage', { p_user_id: user.id })

        if (usageError) {
            console.error('[analizar-plano] Error en rate limiting:', usageError.message)
            return new Response(
                JSON.stringify({ error: 'Error interno al verificar límite de uso' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        if ((newCount as number) > MAX_ANALISIS_POR_DIA) {
            return new Response(
                JSON.stringify({
                    error: 'Límite diario alcanzado',
                    message: `Llegaste al límite de ${MAX_ANALISIS_POR_DIA} análisis de plano por día.`,
                }),
                { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // ── 4. Parsear y validar el body ─────────────────────────────────────
        const body = await req.json() as {
            imageBase64?: string
            mediaType?: string
            nombresConocidos?: string[]
        }

        const { imageBase64, mediaType, nombresConocidos } = body

        if (!imageBase64 || typeof imageBase64 !== 'string') {
            return new Response(
                JSON.stringify({ error: 'Se requiere la imagen del plano (imageBase64)' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Aceptar tanto una data URL completa como el base64 pelado
        const base64Limpio = imageBase64.includes(',')
            ? imageBase64.split(',')[1]
            : imageBase64
        const tipoImagen = (mediaType && ['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(mediaType))
            ? mediaType
            : (imageBase64.startsWith('data:image/jpeg') || imageBase64.startsWith('data:image/jpg'))
                ? 'image/jpeg'
                : 'image/png'

        // Límite de tamaño: base64 pesa ~1,37× el binario; ~7 MB de base64 ≈ 5 MB
        const MAX_BASE64_CHARS = 7_000_000
        if (base64Limpio.length > MAX_BASE64_CHARS) {
            return new Response(
                JSON.stringify({ error: 'La imagen del plano es demasiado grande (máx. ~5 MB)' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const nombres = Array.isArray(nombresConocidos)
            ? nombresConocidos.filter(n => typeof n === 'string').slice(0, 40)
            : []

        // ── 5. Llamar a Anthropic con visión ─────────────────────────────────
        const anthropic = new Anthropic({
            apiKey: Deno.env.get('ANTHROPIC_API_KEY')!,
        })

        // Sonnet tiene buena visión y mantiene el costo del análisis acotado;
        // si aparecen planos difíciles se puede subir a un modelo mayor.
        const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-6',
            max_tokens: 2048,
            system: buildSystemPrompt(nombres),
            messages: [{
                role: 'user',
                content: [
                    {
                        type: 'image',
                        source: {
                            type: 'base64',
                            media_type: tipoImagen as 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif',
                            data: base64Limpio,
                        },
                    },
                    {
                        type: 'text',
                        text: 'Analizá este plano y devolvé el JSON con los ambientes y sus datos térmicos.',
                    },
                ],
            }],
        })

        const textoRespuesta = response.content
            .filter(b => b.type === 'text')
            .map(b => (b as { text: string }).text)
            .join('')

        let resultado: { ambientes: AmbienteAnalizado[] }
        try {
            resultado = parsearRespuesta(textoRespuesta)
        } catch (parseError) {
            const detail = parseError instanceof Error ? parseError.message : String(parseError)
            console.error('[analizar-plano] No se pudo parsear la respuesta:', detail)
            return new Response(
                JSON.stringify({ error: 'El análisis no devolvió un resultado válido. Probá de nuevo o cargá los datos a mano.' }),
                { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Sanitizar y normalizar cada ambiente antes de devolverlo
        const nivelesValidos = ['sin-ventanas', 'pocas', 'normales', 'muchas']
        const ladosValidos = ['arriba', 'abajo', 'izquierda', 'derecha']
        const ambientes: AmbienteAnalizado[] = resultado.ambientes
            .filter(a => a && typeof a.nombre === 'string' && a.nombre.trim().length > 0)
            .map(a => ({
                nombre: String(a.nombre).trim().slice(0, 60),
                paredExterior: a.paredExterior === true,
                ventanas: nivelesValidos.includes(a.ventanas) ? a.ventanas : 'sin-ventanas',
                puertaLado: ladosValidos.includes(a.puertaLado as string) ? a.puertaLado : null,
                confianza: ['alta', 'media', 'baja'].includes(a.confianza) ? a.confianza : 'media',
            }))

        return new Response(
            JSON.stringify({ ambientes }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        const message = error instanceof Error ? error.message : 'Error interno'
        console.error('[analizar-plano] Error:', message)
        return new Response(
            JSON.stringify({ error: 'Error interno del servidor', detail: message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
