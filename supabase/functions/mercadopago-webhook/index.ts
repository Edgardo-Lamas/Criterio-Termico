/**
 * Edge Function: mercadopago-webhook
 *
 * Recibe notificaciones de MercadoPago y actualiza el tier del usuario
 * en la tabla `profiles` según el estado del pago.
 *
 * Configurar en MP: https://www.mercadopago.com.ar/developers/panel/webhooks
 * URL: https://<proyecto>.supabase.co/functions/v1/mercadopago-webhook
 * Eventos: subscription_preapproval
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const MP_ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req) => {
    if (req.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 })
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
            console.error('No se pudo consultar la suscripción:', data.id)
            return new Response('MP error', { status: 500 })
        }

        const subscription = await mpRes.json()

        // external_reference = "userId|tier" (seteado al crear la suscripción)
        const externalRef: string = subscription.external_reference ?? ''
        const [userId, tier] = externalRef.split('|')

        if (!userId || !tier) {
            console.error('external_reference inválido:', externalRef)
            return new Response('Bad reference', { status: 400 })
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

        // Mapear estado de MP a tier interno
        // authorized = pago exitoso, paused/cancelled = bajar a free
        const newTier = subscription.status === 'authorized' ? tier : 'free'

        const { error } = await supabase
            .from('profiles')
            .update({ tier: newTier })
            .eq('id', userId)

        if (error) {
            console.error('Error actualizando perfil:', error)
            return new Response('DB error', { status: 500 })
        }

        console.log(`Usuario ${userId} → tier: ${newTier} (estado MP: ${subscription.status})`)
        return new Response('OK', { status: 200 })

    } catch (e) {
        console.error('Webhook error:', e)
        return new Response('Internal error', { status: 500 })
    }
})
