// Cuánto se espera a Martín antes de avisar que algo falló, y cómo se lee cada
// línea del stream. Vive aparte del hook para poder probarlo sin navegador.
//
// 🔴 Hasta el 2026-10-23 el chat esperaba SIN tiempo límite. Ese día la base de
// Supabase estaba pausada (plan gratuito, 7 días sin uso) y la consulta quedó
// «pensando» para siempre, sin un solo error en ningún lado.

/**
 * Hasta que el servidor contesta: abrir la sesión y recibir las cabeceras. La
 * función contesta antes de que el modelo empiece a pensar, así que esto tarda
 * segundos aun con la función fría.
 */
export const ESPERA_CONEXION_MS = 30_000

/**
 * Silencio máximo una vez abierto el stream. El modelo PIENSA antes de escribir
 * y mientras piensa no viaja nada, así que tiene que ser holgado. Igual el
 * servidor corta solo a los 150 s (tope de las Edge Functions en el plan free).
 */
export const ESPERA_SILENCIO_MS = 90_000

export const AVISO_SIN_CONEXION = 'No hay respuesta del servidor. Probá de nuevo en unos minutos.'
export const AVISO_SILENCIO = 'La respuesta se cortó por un problema del servidor. Probá de nuevo.'

export interface Vigia {
    /** (Re)arma el reloj: si pasan `ms` sin otra llamada, corta con `aviso`. */
    vigilar: (ms: number, aviso: string) => void
    apagar: () => void
    /** El aviso con el que cortó el reloj; `null` si nadie cortó o cortó el instalador. */
    readonly aviso: string | null
    /**
     * Para lo que no acepta `signal` (la sesión de Supabase): rechaza con
     * `AbortError` si el reloj corta antes, igual que un `fetch` abortado.
     */
    esperar: <T>(promesa: Promise<T>) => Promise<T>
}

export function crearVigia(controller: AbortController): Vigia {
    let reloj: ReturnType<typeof setTimeout> | undefined
    let aviso: string | null = null

    const cortado = new Promise<never>((_, reject) => {
        controller.signal.addEventListener(
            'abort',
            () => reject(new DOMException('Aborted', 'AbortError')),
            { once: true },
        )
    })
    // Sin esto, un corte sin nadie esperando queda como rechazo no atendido.
    cortado.catch(() => {})

    return {
        vigilar(ms, nuevoAviso) {
            clearTimeout(reloj)
            reloj = setTimeout(() => {
                aviso = nuevoAviso
                controller.abort()
            }, ms)
        },
        apagar() {
            clearTimeout(reloj)
        },
        get aviso() {
            return aviso
        },
        esperar(promesa) {
            return Promise.race([promesa, cortado])
        },
    }
}

export type LineaSSE =
    | { tipo: 'texto'; texto: string }
    | { tipo: 'error' }
    | { tipo: 'fin' }

/**
 * Interpreta una línea del stream. `null` = no es un dato o vino malformada, y
 * se saltea.
 *
 * 🔴 El error del servidor se DEVUELVE, no se tira adentro del `try` del
 * `JSON.parse`: así estaba antes, y el mismo `catch` que ignora las líneas
 * malformadas se tragaba el aviso de que la respuesta se había cortado.
 */
export function interpretarLineaSSE(linea: string): LineaSSE | null {
    if (!linea.startsWith('data: ')) return null

    const payload = linea.slice(6).trim()
    if (payload === '[DONE]') return { tipo: 'fin' }

    let parsed: { text?: string; error?: string }
    try {
        parsed = JSON.parse(payload) as { text?: string; error?: string }
    } catch {
        return null
    }

    if (parsed.error) return { tipo: 'error' }
    if (parsed.text) return { tipo: 'texto', texto: parsed.text }
    return null
}
