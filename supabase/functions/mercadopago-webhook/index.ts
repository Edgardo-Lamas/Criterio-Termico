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
 *   Eventos: subscription_preapproval
 *   https://www.mercadopago.com.ar/developers/panel/webhooks
 *
 * TIERS VÁLIDOS en external_reference: "userId|pro" o "userId|premium"
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const MP_ACCESS_TOKEN       = Deno.env.get('MP_ACCESS_TOKEN') ?? ''
const MP_WEBHOOK_SECRET     = Deno.env.get('MP_WEBHOOK_SECRET') ?? ''
const SUPABASE_URL          = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const VALID_TIERS = new Set(['pro', 'premium'])

// ── Verificación de firma HMAC-SHA256 ─────────────────────────────────────────
// MercadoPago envía: x-signature: ts=<timestamp>,v1=<hmac>
// El manifest que firman es: "id:<x-request-id>;request-date:<ts>;"
async function verifySignature(req: Request, requestId: string): Promise<boolean> {
    if (!MP_WEBHOOK_SECRET) return false

    const signature = req.headers.get('x-signature') ?? ''
    const parts = Object.fromEntries(signature.split(',').map(p => p.split('=')))
    const ts = parts['ts']
    const v1 = parts['v1']

    if (!ts || !v1) return false

    const manifest = `id:${requestId};request-date:${ts};`
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

    return expected === v1
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

    // Verificar firma HMAC antes de procesar nada
    const requestId = req.headers.get('x-request-id') ?? ''
    const isValid = await verifySignature(req, requestId)
    if (!isValid) {
        console.error('[webhook] Firma inválida — posible request no autorizado')
        return new Response('Unauthorized', { status: 401 })
    }

    try {
        const body = await req.json()
        const { type, data } = body

        // Solo procesamos suscripciones
        if (type !== 'subscription_preapproval') {
            return new Response('OK', { status: 200 })
        }

        // Consultar detalles de la suscripción en MP
        const mpRes = await fetch(`https://api.mercadopago.com/preapproval/${data.id}`, {
            headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
        })

        if (!mpRes.ok) {
            console.error('[webhook] No se pudo consultar la suscripción:', data.id)
            return new Response('MP error', { status: 500 })
        }

        const subscription = await mpRes.json()

        // external_reference = "userId|tier"
        const externalRef: string = subscription.external_reference ?? ''
        const [userId, tier] = externalRef.split('|')

        if (!userId || !tier || !VALID_TIERS.has(tier)) {
            console.error('[webhook] external_reference inválido:', externalRef)
            return new Response('Bad reference', { status: 400 })
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

        // authorized = pago activo → subir tier | cualquier otro estado → bajar a free
        const newTier = subscription.status === 'authorized' ? tier : 'free'

        const { error } = await supabase
            .from('profiles')
            .update({ tier: newTier })
            .eq('id', userId)

        if (error) {
            console.error('[webhook] Error actualizando perfil:', error)
            return new Response('DB error', { status: 500 })
        }

        console.log(`[webhook] Usuario ${userId} → tier: ${newTier} (estado MP: ${subscription.status})`)
        return new Response('OK', { status: 200 })

    } catch (e) {
        console.error('[webhook] Error inesperado:', e)
        return new Response('Internal error', { status: 500 })
    }
})
