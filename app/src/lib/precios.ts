/**
 * LA ÚNICA FUENTE DEL PRECIO QUE SE MUESTRA.
 *
 * 🔴 Existe porque el precio ya se desincronizó dos veces, y las dos se vieron
 * desde afuera:
 *
 * 1. Hasta el 2026-09-08 la pantalla de planes anunciaba USD 10 y USD 18
 *    mientras MercadoPago cobraba en pesos: con el dólar a $1.530 se cobraba un
 *    22% menos de lo anunciado.
 * 2. Hasta el 2026-09-16 el muro de pago (`SubscriptionBanner`) siguió diciendo
 *    «ARS 2.999/mes» y «ARS 9.999/mes» —precios de una época anterior— mientras
 *    la pantalla de planes ya pedía $30.000 y $40.000. Estaba en tres pantallas:
 *    errores frecuentes, el detalle de un error y herramientas. Un instalador
 *    veía el simulador a 9.999 y en el paso siguiente 40.000.
 *
 * Por eso el número vive en UN lugar y las pantallas lo piden acá.
 *
 * ⚠ Esto es la VIDRIERA, no la caja. El importe que se cobra vive en el plan de
 * MercadoPago y `create-subscription` lo lee antes de cada alta: cambiar este
 * archivo NO cambia lo que se cobra. Los dos lados se mueven juntos o la
 * pantalla vuelve a mentir.
 *
 * ⚠ El mismo precio aparece en `src/pages/plataforma.astro` del repo del SITIO
 * (`~/Desktop/Trabajos/Criterio Termico`), que es la puerta de entrada al SaaS.
 * Ese es otro repositorio: hay que tocarlo a mano.
 */
import type { SubscriptionTier } from '../stores/useAuthStore'

/** Pesos por mes. El plan gratuito no se cobra. */
export const PRECIO_MENSUAL: Record<SubscriptionTier, number> = {
    free: 0,
    pro: 30000,
    premium: 40000,
}

/**
 * El precio como se muestra: `$30.000/mes`. El gratuito es sólo `$0`, sin
 * «/mes», que es como lo viene mostrando la pantalla de planes.
 */
export function precioMensual(tier: SubscriptionTier): string {
    const monto = PRECIO_MENSUAL[tier]
    if (monto === 0) return '$0'
    return `$${monto.toLocaleString('es-AR')}/mes`
}
