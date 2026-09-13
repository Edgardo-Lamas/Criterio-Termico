// Criterio Térmico — «Mandámelo por correo»
//
// Le manda al instalador la consulta que acaba de hacer y la respuesta de
// Martín, para que le quede de repaso cuando esté en la obra. Idea suya del
// 11/9. Sale con un BOTÓN al pie de la respuesta, nunca sola.
//
// 🔴 EL DESTINATARIO NO SE RECIBE: SALE DE LA SESIÓN. Si el correo de destino
// viniera en el cuerpo, esta función sería un relay para mandar correo firmado
// por el dominio a cualquiera. Del navegador entra sólo el texto de la
// consulta, y el correo va siempre a la dirección de la cuenta que pidió.
//
// 🔑 NO SE GUARDA LA CONSULTA. En `envios_resumen` queda que hubo un envío y de
// qué tamaño, nada más: guardar lo que se dice en el chat es la etapa 2 de la
// memoria de Martín y arrastra la decisión de privacidad que todavía no está
// tomada. Ver la migración `20260913_envios_resumen.sql`.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsPara } from '../_shared/cors.ts'
import { armarCorreo } from '../_shared/correoResumen.ts'

const RESEND_API = 'https://api.resend.com/emails'

const REMITENTE_POR_DEFECTO = 'Martín de Criterio Térmico <martin@send.crtermico.com>'
// El subdominio de Resend manda pero no recibe: sin esto, contestarle al correo
// escribe al vacío. Las respuestas van a la casilla real del dominio (Zoho).
const RESPUESTAS_POR_DEFECTO = 'lamasedgardo@crtermico.com'

const TOPE_DIARIO_POR_DEFECTO = 20

// Topes del texto que entra. La respuesta de Martín más larga posible está
// acotada por `maxTokens` del asistente; esto es el cinturón por si el cuerpo
// llega inflado desde otro lado.
const PREGUNTA_MAX = 4_000
const RESPUESTA_MAX = 30_000

interface Cuerpo {
    pregunta?: unknown
    respuesta?: unknown
}

function json(datos: unknown, status: number, cors: Record<string, string>): Response {
    return new Response(JSON.stringify(datos), {
        status,
        headers: { ...cors, 'Content-Type': 'application/json' },
    })
}

/**
 * Huella del envío, para la `Idempotency-Key` de Resend: el doble clic —o el
 * reintento del navegador— no tiene que mandar dos correos iguales. Resend la
 * recuerda 24 h.
 */
async function huella(texto: string): Promise<string> {
    const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto))
    return Array.from(new Uint8Array(buffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
        .slice(0, 32)
}

Deno.serve(async (req: Request): Promise<Response> => {
    const cors = corsPara(req)

    if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
    if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405, cors)

    try {
        // ── 1. Quién pide ────────────────────────────────────────────────────
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) return json({ error: 'Token de autenticación requerido' }, 401, cors)

        const supabase = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_ANON_KEY')!,
            { global: { headers: { Authorization: authHeader } } },
        )

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return json({ error: 'No autorizado' }, 401, cors)

        // El visitante sin cuenta tiene sesión anónima: es real para el chat,
        // pero no tiene dirección a la cual mandar. No es un error a esconder,
        // es el motivo por el que el botón no le aparece.
        if (user.is_anonymous === true || !user.email) {
            return json({
                error: 'sin_correo',
                message: 'Para que te llegue el resumen hace falta una cuenta con correo.',
            }, 403, cors)
        }

        // ── 2. Qué mandar ────────────────────────────────────────────────────
        const cuerpo = await req.json().catch(() => ({})) as Cuerpo
        const pregunta = typeof cuerpo.pregunta === 'string' ? cuerpo.pregunta.trim() : ''
        const respuesta = typeof cuerpo.respuesta === 'string' ? cuerpo.respuesta.trim() : ''

        if (!pregunta || !respuesta) {
            return json({ error: 'Falta la consulta o la respuesta' }, 400, cors)
        }
        if (pregunta.length > PREGUNTA_MAX || respuesta.length > RESPUESTA_MAX) {
            return json({ error: 'La consulta es demasiado larga para mandarla por correo' }, 413, cors)
        }

        // ── 3. El tope del día ───────────────────────────────────────────────
        // Con service_role: el cliente no escribe ni lee esta tabla para
        // contar, porque entonces podría falsear la cuenta.
        const admin = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
        )

        const tope = Number(Deno.env.get('RESUMEN_TOPE_DIARIO') ?? TOPE_DIARIO_POR_DEFECTO)
        const desde = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

        const { count, error: errorConteo } = await admin
            .from('envios_resumen')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .gte('enviado_at', desde)

        // Si la cuenta falla, se manda igual: el tope existe para cuidar la
        // cuota de Resend, no para frenar a alguien que está trabajando.
        if (errorConteo) {
            console.error('[enviar-resumen] No se pudo contar los envíos del día:', errorConteo.message)
        } else if ((count ?? 0) >= tope) {
            return json({
                error: 'tope_diario',
                message: `Ya te mandamos ${tope} resúmenes hoy. Probá de nuevo mañana.`,
            }, 429, cors)
        }

        // ── 4. Mandar ────────────────────────────────────────────────────────
        const clave = Deno.env.get('RESEND_API_KEY')
        if (!clave) {
            console.error('[enviar-resumen] Falta RESEND_API_KEY — no se mandó nada')
            return json({
                error: 'sin_configurar',
                message: 'El envío por correo todavía no está habilitado.',
            }, 503, cors)
        }

        const { asunto, html, texto } = armarCorreo({ pregunta, respuesta })
        const clave_idempotencia = await huella(`${user.id}|${pregunta}|${respuesta}`)

        const respuestaResend = await fetch(RESEND_API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${clave}`,
                'Idempotency-Key': `resumen-${clave_idempotencia}`,
            },
            body: JSON.stringify({
                from: Deno.env.get('RESUMEN_DE') ?? REMITENTE_POR_DEFECTO,
                to: [user.email],
                reply_to: Deno.env.get('RESUMEN_REPLY_TO') ?? RESPUESTAS_POR_DEFECTO,
                subject: asunto,
                html,
                text: texto,
            }),
        })

        if (!respuestaResend.ok) {
            const detalle = await respuestaResend.text().catch(() => '')
            console.error('[enviar-resumen] Resend rechazó el envío:', respuestaResend.status, detalle)
            return json({
                error: 'envio_rechazado',
                message: 'No se pudo mandar el correo. Probá de nuevo en un rato.',
            }, 502, cors)
        }

        // ── 5. Dejar constancia ──────────────────────────────────────────────
        // Después de mandar, y sin cortar la respuesta si falla: el correo ya
        // salió, y perder el renglón sólo afloja el tope por una vez.
        const { error: errorRegistro } = await admin.from('envios_resumen').insert({
            user_id: user.id,
            pregunta_chars: pregunta.length,
            respuesta_chars: respuesta.length,
        })
        if (errorRegistro) {
            console.error('[enviar-resumen] El correo salió pero no se registró:', errorRegistro.message)
        }

        console.log(JSON.stringify({ evento: 'resumen_enviado', user_id: user.id, chars: respuesta.length }))
        return json({ ok: true, destino: user.email }, 200, cors)

    } catch (e) {
        console.error('[enviar-resumen] Error inesperado:', e)
        return json({ error: 'Error interno' }, 500, cors)
    }
})
