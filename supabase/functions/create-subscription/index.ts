/**
 * Edge Function: create-subscription
 *
 * Crea una suscripción recurrente en MercadoPago y devuelve el init_point
 * para redirigir al usuario al checkout de MP.
 *
 * El importe sale del plan (MP_PRO_PLAN_ID / MP_PREMIUM_PLAN_ID), pero la
 * suscripción se crea SIN plan asociado: ver el comentario largo más abajo.
 *
 * POST /functions/v1/create-subscription
 * Body: { userId: string, tier: 'pro' | 'premium' }
 * Headers: Authorization: Bearer <supabase_anon_token>
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsPara } from '../_shared/cors.ts'

const MP_ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// IDs de los planes creados en MercadoPago (se configuran una sola vez)
const MP_PLAN_IDS: Record<string, string> = {
    pro: Deno.env.get('MP_PRO_PLAN_ID') ?? '',
    premium: Deno.env.get('MP_PREMIUM_PLAN_ID') ?? '',
}

// URL de retorno después del pago — a dónde vuelve el comprador desde el
// checkout de MercadoPago.
// ⚠ Los valores por defecto apuntaban a GitHub Pages, que dejó de ser el hosting
// del SaaS: si la variable no está cargada, el comprador terminaba volviendo a un
// sitio que ya no es la app. Corregido 2026-08-28, y el 2026-09-05 al dominio
// propio: la plataforma vive en app.crtermico.com.
const APP_URL = Deno.env.get('APP_URL') ?? 'https://app.crtermico.com'

Deno.serve(async (req) => {
    const corsHeaders = corsPara(req)

    // CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders })
    }

    try {
        // Verificar autenticación del usuario
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            return json({ error: 'No autorizado' }, 401, corsHeaders)
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: authError } = await supabase.auth.getUser(token)

        if (authError || !user) {
            return json({ error: 'Token inválido' }, 401, corsHeaders)
        }

        // Parsear body
        const { tier } = await req.json() as { tier: 'pro' | 'premium' }
        const planId = MP_PLAN_IDS[tier]

        if (!planId) {
            return json({ error: `Plan '${tier}' no configurado` }, 400, corsHeaders)
        }

        // El precio vive en el plan de MP, no acá: así cambiarlo no obliga a
        // tocar código ni a redesplegar. Se lee antes de crear la suscripción.
        const planRes = await fetch(`https://api.mercadopago.com/preapproval_plan/${planId}`, {
            headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
        })

        if (!planRes.ok) {
            console.error(`[create-subscription] No se pudo leer el plan ${planId}:`, planRes.status)
            return json({ error: 'El plan no está disponible en MercadoPago' }, 502, corsHeaders)
        }

        const plan = await planRes.json()
        const recurrente = plan.auto_recurring ?? {}

        if (!recurrente.transaction_amount || !recurrente.currency_id) {
            console.error('[create-subscription] El plan no tiene importe:', planId)
            return json({ error: 'El plan no tiene importe configurado' }, 502, corsHeaders)
        }

        // ── Suscripción SIN plan asociado, a propósito ────────────────────────
        //
        // Mandar `preapproval_plan_id` acá parece lo natural y NO funciona: ese
        // camino exige `card_token_id`, o sea la tarjeta ya tokenizada en un
        // formulario propio. MP contesta 400 «card_token_id is required» y, como
        // el front no mostraba el error, el botón no hacía absolutamente nada.
        //
        // El link público del plan tampoco sirve: no admite `external_reference`,
        // así que se cobraría sin saber a QUÉ usuario subirle el tier.
        //
        // Sin plan asociado y sin tarjeta, MP crea la suscripción en `pending`,
        // devuelve el checkout y conserva la referencia. Verificado contra la API
        // el 2026-09-05.
        const mpResponse = await fetch('https://api.mercadopago.com/preapproval', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
            },
            body: JSON.stringify({
                reason: plan.reason ?? `Criterio Térmico ${tier.toUpperCase()}`,
                payer_email: user.email,
                back_url: `${APP_URL}/cuenta`,
                // Con esto el webhook sabe a quién corresponde el pago.
                external_reference: `${user.id}|${tier}`,
                auto_recurring: {
                    frequency: recurrente.frequency ?? 1,
                    frequency_type: recurrente.frequency_type ?? 'months',
                    transaction_amount: recurrente.transaction_amount,
                    currency_id: recurrente.currency_id,
                },
            }),
        })

        const mpData = await mpResponse.json()

        if (!mpResponse.ok || !mpData.init_point) {
            // El mensaje de MP viaja al front: un fallo mudo cuesta más caro que
            // mostrar de más, y acá el que mira es el propio instalador.
            console.error('[create-subscription] MP rechazó la suscripción:', JSON.stringify(mpData))
            return json(
                { error: mpData.message ?? 'MercadoPago rechazó la suscripción' },
                502,
                corsHeaders,
            )
        }

        return json({ init_point: mpData.init_point }, 200, corsHeaders)

    } catch (e) {
        console.error(e)
        return json({ error: 'Error interno' }, 500, corsHeaders)
    }
})

// Las cabeceras CORS entran por parámetro y no salen de una constante: el
// origen permitido depende del pedido, y una variable de módulo se pisaría
// entre dos pedidos concurrentes.
function json(data: unknown, status: number, corsHeaders: Record<string, string>) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
        },
    })
}
