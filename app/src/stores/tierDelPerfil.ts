import type { SubscriptionTier } from './useAuthStore'

/**
 * Qué tier queda cuando la consulta del perfil no sale bien.
 *
 * El 9/9 dos consultas a `profiles` murieron con `TypeError: Failed to fetch`
 * (Sentry, issue 7722287584) y la cuenta —premium— quedó tratada como gratuita
 * hasta la siguiente recarga. El código devolvía 'free' ante cualquier error, y
 * eso mezcla dos cosas que no son lo mismo:
 *
 *   - la base contestó y no hay plan → 'free' es la respuesta correcta
 *   - no se pudo preguntar          → 'free' es una invención, y le saca el
 *                                     Simulador a alguien que lo pagó
 *
 * Acá se separan. Un fallo de red se reintenta una vez y, si vuelve a fallar,
 * se conserva el tier que ya estaba en memoria en vez de degradar la cuenta.
 *
 * ⚠ Conservar el tier NO lo persiste ni lo cachea entre sesiones: sigue en pie
 * la decisión de `partialize` en useAuthStore de no guardarlo, para que un
 * cambio de plan del webhook de MercadoPago se vea en la próxima consulta. Y no
 * es una decisión de permisos: el acceso real lo dan las RLS de Postgres y las
 * Edge Functions. Esto es sólo lo que la pantalla muestra mientras no hay red.
 */

/** La forma de un PostgrestError, sin arrastrar el tipo de supabase-js. */
export interface ErrorDePerfil {
    code?: string | null
    message?: string | null
    details?: string | null
    hint?: string | null
}

export interface RespuestaPerfil {
    data: { tier?: string | null } | null
    error: ErrorDePerfil | null
}

/** Qué conviene dejar registrado, si algo falló. */
export type Incidente =
    /** Salió bien, o el reintento lo salvó. */
    | { tipo: 'ninguno' }
    /** La red falló pero el usuario no perdió nada: se conservó su tier. */
    | { tipo: 'red-sin-consecuencia'; error: ErrorDePerfil }
    /** La red falló y no había tier que conservar: la cuenta quedó en 'free'. */
    | { tipo: 'red-degradado'; error: ErrorDePerfil }
    /** La base contestó con un error propio (PGRST116, 42501, …). */
    | { tipo: 'base'; error: ErrorDePerfil }

export interface LecturaDePerfil {
    tier: SubscriptionTier
    incidente: Incidente
}

export interface OpcionesDeLectura {
    /** El tier que el store ya tiene para este usuario, si lo tiene. */
    tierPrevio?: SubscriptionTier
    /** Inyectable para los tests; en producción es un setTimeout. */
    esperar?: (ms: number) => Promise<void>
}

export const ESPERA_REINTENTO_MS = 600

const TIERS: readonly string[] = ['free', 'pro', 'premium']

export function esTierValido(valor: unknown): valor is SubscriptionTier {
    return typeof valor === 'string' && TIERS.includes(valor)
}

/**
 * El fetch nunca llegó al servidor.
 *
 * PostgREST siempre contesta con un `code` (PGRST116 si no hay fila, 42501 si
 * es un permiso, …). supabase-js arma el error a mano cuando el fetch tira una
 * excepción, y ahí `code` viene vacío: es la única marca que distingue «no hay
 * plan» de «no pude preguntar».
 */
export function esFalloDeRed(error: ErrorDePerfil): boolean {
    return !error.code
}

function demora(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

export async function leerTierDelPerfil(
    consultar: () => Promise<RespuestaPerfil>,
    { tierPrevio, esperar = demora }: OpcionesDeLectura = {},
): Promise<LecturaDePerfil> {
    let respuesta = await consultar()

    // Un solo reintento, y sólo si no llegamos a preguntar. Un error con `code`
    // ya es la respuesta de la base: preguntar de nuevo da lo mismo dos veces.
    if (respuesta.error && esFalloDeRed(respuesta.error)) {
        await esperar(ESPERA_REINTENTO_MS)
        respuesta = await consultar()
    }

    const { data, error } = respuesta

    if (!error) {
        const leido = data?.tier
        return { tier: esTierValido(leido) ? leido : 'free', incidente: { tipo: 'ninguno' } }
    }

    if (esFalloDeRed(error)) {
        return tierPrevio
            ? { tier: tierPrevio, incidente: { tipo: 'red-sin-consecuencia', error } }
            : { tier: 'free', incidente: { tipo: 'red-degradado', error } }
    }

    return { tier: 'free', incidente: { tipo: 'base', error } }
}
