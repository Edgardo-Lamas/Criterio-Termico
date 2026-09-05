/**
 * CORS compartido por las Edge Functions que llama el navegador.
 *
 * 🔴 Un solo dominio no alcanza. El SaaS se sirve desde DOS a la vez:
 * `app.crtermico.com` (el bueno, desde el 2026-09-05) y
 * `criterio-termico.vercel.app` (el de Vercel, que sigue respondiendo). Con un
 * único valor, el navegador descarta las respuestas del otro y el asistente
 * deja de contestar SIN que nada falle del lado del servidor: la función
 * devuelve 200 y el error se ve nada más que en la consola del visitante.
 *
 * `ALLOWED_ORIGIN` admite varios separados por coma. Se contesta con el origen
 * que pidió, si está en la lista; si no, con el primero, que es el canónico.
 * Devolver el origen recibido —y no `*`— es obligatorio acá: estas funciones
 * viajan con cabecera `Authorization`.
 */

const ORIGENES_POR_DEFECTO = 'https://app.crtermico.com,https://criterio-termico.vercel.app'

export const ORIGENES_PERMITIDOS: string[] = (Deno.env.get('ALLOWED_ORIGIN') ?? ORIGENES_POR_DEFECTO)
    .split(',')
    .map(origen => origen.trim())
    .filter(Boolean)

export function corsPara(req: Request): Record<string, string> {
    const pedido = req.headers.get('origin') ?? ''
    const permitido = ORIGENES_PERMITIDOS.includes(pedido) ? pedido : ORIGENES_PERMITIDOS[0]

    return {
        'Access-Control-Allow-Origin': permitido,
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        // La respuesta cambia según quién pregunte: sin esto, un proxy o el
        // propio navegador puede servirle a un dominio el permiso del otro.
        'Vary': 'Origin',
    }
}
