/**
 * Edge Function: mercadopago-webhook
 *
 * Recibe notificaciones de MercadoPago y actualiza el tier del usuario
 * en la tabla `profiles` según el estado del pago.
 *
 * CONFIGURACIÓN NECESARIA (Supabase Dashboard > Edge Functions > Secrets):
 *   MP_ACCESS_TOKEN        → Panel MP > Credenciales > Access Token de producción
 *   MP_WEBHOOK_SECRET      → Panel MP > Webhooks > clave secreta del webhook
 *   SUPABASE_SERVICE_ROLE_KEY → Supabase Dashboard > Settings > API > service_role key
 *
 * CONFIGURAR EN MP:
 *   URL: https://ntxkjtirkgqkjlzphvtd.supabase.co/functions/v1/mercadopago-webhook
 *   Eventos: subscription_preapproval  Y  subscription_authorized_payment
 *   https://www.mercadopago.com.ar/developers/panel/webhooks
 *
 *   ⚠ Los DOS eventos, no uno. El primero avisa del alta y de cada cambio de
 *   estado; el segundo, de cada cobro mensual. Con sólo el primero, a un
 *   instalador al que le rebota la tarjeta el segundo mes no se le entera
 *   nadie hasta que MP dé la suscripción por vencida.
 *
 *   ⚠ Este webhook va en una APLICACIÓN PROPIA de MP, no en la del sitio: al
 *   guardar la configuración de webhooks MP emite una clave secreta nueva y
 *   descarta la anterior, así que tocar la del sitio le rompe el cobro de
 *   repuestos, que ya factura.
 *
 * 🔴 DESPLEGAR SIN VERIFICACIÓN DE JWT:
 *     supabase functions deploy mercadopago-webhook --no-verify-jwt
 *   (o dejar que lo tome de supabase/config.toml, donde ya está declarado)
 *   MercadoPago no manda JWT. Con la verificación puesta, el gateway de Supabase
 *   rechaza cada aviso con 401 antes de ejecutar este archivo y el tier nunca sube.
 *
 * TIERS VÁLIDOS en external_reference: "userId|pro" o "userId|premium"
 */

import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

const MP_ACCESS_TOKEN       = Deno.env.get('MP_ACCESS_TOKEN') ?? ''
const MP_WEBHOOK_SECRET     = Deno.env.get('MP_WEBHOOK_SECRET') ?? ''
const SUPABASE_URL          = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const VALID_TIERS = new Set(['pro', 'premium'])

// ── Verificación de firma HMAC-SHA256 ─────────────────────────────────────────
// MercadoPago envía: x-signature: ts=<timestamp>,v1=<hmac>
//
// El texto que MP firma es, textual:
//     id:<data.id>;request-id:<x-request-id>;ts:<ts>;
// donde `data.id` sale del QUERY de la URL (?data.id=...), NO del cuerpo. Si
// alguna de las tres partes no viene, se omite junto con su clave.
//
// ⚠ CORREGIDO 2026-08-28. Antes se armaba `id:<x-request-id>;request-date:<ts>;`,
// que no es ningún formato de MP: ponía el request-id donde va el data.id y usaba
// una clave inexistente. El efecto no era un agujero de seguridad sino lo
// contrario, y peor de encontrar: RECHAZABA todos los pagos legítimos con 401 sin
// que nada diera error. Verificado con HMAC reales antes de cambiarlo.
function armarManifest(dataId: string | null, requestId: string | null, ts: string): string {
    let manifest = ''
    if (dataId) manifest += `id:${dataId};`
    if (requestId) manifest += `request-id:${requestId};`
    if (ts) manifest += `ts:${ts};`
    return manifest
}

// Comparar con === le dice a quien mida los tiempos cuántos caracteres acertó.
// Esta versión recorre siempre los dos strings enteros.
function comparacionSegura(a: string, b: string): boolean {
    if (a.length !== b.length) return false
    let diferencia = 0
    for (let i = 0; i < a.length; i++) {
        diferencia |= a.charCodeAt(i) ^ b.charCodeAt(i)
    }
    return diferencia === 0
}

async function verifySignature(req: Request, dataId: string | null): Promise<boolean> {
    if (!MP_WEBHOOK_SECRET) return false

    const signature = req.headers.get('x-signature') ?? ''
    const parts: Record<string, string> = {}
    for (const trozo of signature.split(',')) {
        const [clave, valor] = trozo.split('=')
        if (clave && valor) parts[clave.trim()] = valor.trim()
    }
    const ts = parts['ts']
    const v1 = parts['v1']

    if (!ts || !v1) return false

    const requestId = req.headers.get('x-request-id')
    const manifest = armarManifest(dataId, requestId, ts)

    const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(MP_WEBHOOK_SECRET),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    )
    const signatureBytes = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(manifest))
    const expected = Array.from(new Uint8Array(signatureBytes))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')

    return comparacionSegura(expected, v1)
}

// ── Consultas a MercadoPago ───────────────────────────────────────────────────

async function mpGet(ruta: string): Promise<Record<string, unknown> | null> {
    const res = await fetch(`https://api.mercadopago.com${ruta}`, {
        headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
    })
    if (!res.ok) {
        console.error(`[webhook] MP ${ruta} devolvió ${res.status}`)
        return null
    }
    return await res.json()
}

// ── El tier sale de la tabla, no del aviso ────────────────────────────────────
//
// Un usuario puede tener más de una suscripción: la vieja que canceló y la
// nueva que acaba de pagar. Si el tier se escribiera con el estado del último
// aviso, el aviso de la cancelada dejaría en `free` a alguien que está al día
// —y los avisos de MP además pueden llegar fuera de orden—. Así que se
// recalcula: vale el tier más alto entre las suscripciones autorizadas, y si
// no queda ninguna, `free`.

async function recalcularTier(supabase: SupabaseClient, userId: string): Promise<string> {
    const { data, error } = await supabase
        .from('suscripciones')
        .select('tier')
        .eq('user_id', userId)
        .eq('estado', 'authorized')

    if (error) throw new Error(`leyendo suscripciones: ${error.message}`)

    const tiers = new Set((data ?? []).map((fila: { tier: string }) => fila.tier))
    const tier = tiers.has('premium') ? 'premium' : tiers.has('pro') ? 'pro' : 'free'

    const { error: errorPerfil } = await supabase
        .from('profiles')
        .update({ tier })
        .eq('id', userId)

    if (errorPerfil) throw new Error(`actualizando perfil: ${errorPerfil.message}`)

    return tier
}

/**
 * Vuelve a preguntarle a MP en qué estado está la suscripción y deja la base
 * igual a esa respuesta.
 *
 * No se deduce nada del cuerpo del aviso: puede llegar duplicado, tarde o
 * desordenado. El aviso sólo dice QUÉ mirar; el estado lo dice MP.
 */
async function sincronizar(
    preapprovalId: string,
    pago: { fecha: string | null; estado: string | null } | null,
): Promise<Response> {
    const suscripcion = await mpGet(`/preapproval/${preapprovalId}`)
    if (!suscripcion) {
        // 500 a propósito: MP reintenta, y un fallo de red no puede quedar
        // como si la suscripción no existiera.
        return new Response('MP error', { status: 500 })
    }

    // external_reference = "userId|tier"
    const externalRef = String(suscripcion.external_reference ?? '')
    const [userId, tier] = externalRef.split('|')

    if (!userId || !tier || !VALID_TIERS.has(tier)) {
        console.error('[webhook] external_reference inválido:', externalRef)
        return new Response('Bad reference', { status: 400 })
    }

    const estado = String(suscripcion.status ?? 'unknown')
    const recurrente = (suscripcion.auto_recurring ?? {}) as Record<string, unknown>

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const fila: Record<string, unknown> = {
        user_id: userId,
        preapproval_id: preapprovalId,
        tier,
        estado,
        monto: recurrente.transaction_amount ?? null,
        moneda: recurrente.currency_id ?? null,
        proximo_cobro_at: suscripcion.next_payment_date ?? null,
        actualizada_at: new Date().toISOString(),
    }

    // Los datos del cobro sólo se pisan cuando el aviso ES de un cobro: un
    // cambio de estado no puede borrar la fecha del último pago.
    if (pago) {
        fila.ultimo_pago_at = pago.fecha
        fila.ultimo_pago_estado = pago.estado
    }

    const { error } = await supabase
        .from('suscripciones')
        .upsert(fila, { onConflict: 'preapproval_id' })

    if (error) {
        console.error('[webhook] Error guardando la suscripción:', error)
        return new Response('DB error', { status: 500 })
    }

    const tierFinal = await recalcularTier(supabase, userId)

    console.log(
        `[webhook] ${preapprovalId} → estado MP: ${estado}` +
        (pago ? ` · cobro ${pago.estado}` : '') +
        ` · usuario ${userId} queda en tier: ${tierFinal}`,
    )
    return new Response('OK', { status: 200 })
}

// ── Handler ───────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
    if (req.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 })
    }

    // Verificar que los secrets estén configurados
    if (!MP_ACCESS_TOKEN || !MP_WEBHOOK_SECRET || !SUPABASE_SERVICE_ROLE_KEY) {
        console.error('[webhook] Secrets no configurados — revisar MP_ACCESS_TOKEN, MP_WEBHOOK_SECRET y SUPABASE_SERVICE_ROLE_KEY')
        return new Response('Configuration error', { status: 500 })
    }

    // Verificar firma HMAC antes de procesar nada. El id que entra en la firma es
    // el del query de la URL (?data.id=...), que es lo que MP firmó.
    const dataIdDelQuery = new URL(req.url).searchParams.get('data.id')
    const isValid = await verifySignature(req, dataIdDelQuery)
    if (!isValid) {
        console.error('[webhook] Firma inválida — posible request no autorizado')
        return new Response('Unauthorized', { status: 401 })
    }

    try {
        const body = await req.json()
        const { type, data } = body
        const id = String(data?.id ?? dataIdDelQuery ?? '')

        if (!id) {
            console.error('[webhook] Aviso sin id:', JSON.stringify(body))
            return new Response('Bad request', { status: 400 })
        }

        // Alta de la suscripción y cada cambio de estado.
        if (type === 'subscription_preapproval') {
            return await sincronizar(id, null)
        }

        // Cada cobro mensual. El aviso trae el id de la FACTURA, no el de la
        // suscripción: hay que pedirla para saber a qué suscripción pertenece.
        if (type === 'subscription_authorized_payment') {
            const factura = await mpGet(`/authorized_payments/${id}`)
            if (!factura) return new Response('MP error', { status: 500 })

            const preapprovalId = String(factura.preapproval_id ?? '')
            if (!preapprovalId) {
                console.error('[webhook] Factura sin preapproval_id:', id)
                return new Response('Bad reference', { status: 400 })
            }

            const detallePago = (factura.payment ?? {}) as Record<string, unknown>
            return await sincronizar(preapprovalId, {
                fecha: (factura.date_created as string) ?? null,
                // El estado del PAGO, que no es el de la suscripción: un cobro
                // rechazado no la cancela, MP reintenta.
                estado: (detallePago.status as string) ?? (factura.status as string) ?? null,
            })
        }

        // Cualquier otro tópico se contesta OK para que MP no reintente.
        return new Response('OK', { status: 200 })

    } catch (e) {
        console.error('[webhook] Error inesperado:', e)
        return new Response('Internal error', { status: 500 })
    }
})
