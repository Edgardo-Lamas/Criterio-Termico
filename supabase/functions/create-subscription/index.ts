/**
 * Edge Function: create-subscription
 *
 * Crea una suscripción recurrente en MercadoPago y devuelve el init_point
 * para redirigir al usuario al checkout de MP.
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

        // Crear suscripción en MP (preapproval)
        const mpResponse = await fetch('https://api.mercadopago.com/preapproval', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
            },
            body: JSON.stringify({
                preapproval_plan_id: planId,
                payer_email: user.email,
                back_url: `${APP_URL}/cuenta`,
                // Metadata para identificar al usuario en el webhook
                external_reference: `${user.id}|${tier}`,
            }),
        })

        if (!mpResponse.ok) {
            const err = await mpResponse.json()
            console.error('MP error:', err)
            return json({ error: 'Error al crear suscripción en MercadoPago' }, 500, corsHeaders)
        }

        const mpData = await mpResponse.json()

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
