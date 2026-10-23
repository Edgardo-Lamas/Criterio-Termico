// Serverless Function (Vercel) — mantiene despierta la base de Supabase
//
// 🔴 El plan gratuito de Supabase PAUSA el proyecto después de 7 días sin
// actividad. Pasó el 2026-10-23: con la base pausada, Martín quedaba «pensando»
// para siempre y nada daba error. Mientras la plataforma tenga poco uso, esta
// función la toca dos veces por semana desde el cron de `vercel.json`.
//
// 🔑 Por qué en Vercel y no en GitHub Actions: el repo es PÚBLICO, y GitHub
// apaga los workflows programados de un repo público que pasa 60 días sin
// commits — justo cuando la plataforma está quieta, que es cuando hace falta.
//
// La consulta es la misma que puede hacer cualquier visitante: la clave
// pública y una lectura de una fila. El RLS la deja en cero filas, pero el
// pedido llega a Postgres, que es lo que cuenta como actividad. Por eso no hace
// falta proteger el endpoint con un secreto: llamarlo no da acceso a nada.

import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const url = process.env.VITE_SUPABASE_URL
  const clave = process.env.VITE_SUPABASE_ANON_KEY

  if (!url || !clave) {
    console.error('[mantener-base] faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY')
    return res.status(500).json({ ok: false, error: 'sin configuración' })
  }

  try {
    const respuesta = await fetch(`${url}/rest/v1/profiles?select=id&limit=1`, {
      headers: { apikey: clave, Authorization: `Bearer ${clave}` },
      signal: AbortSignal.timeout(20_000),
    })

    // Un error acá es la señal de que la base se pausó igual (o algo peor):
    // tiene que quedar en los logs del cron, no perderse.
    if (!respuesta.ok) {
      console.error(`[mantener-base] Supabase contestó ${respuesta.status}`)
      return res.status(502).json({ ok: false, status: respuesta.status })
    }

    return res.status(200).json({ ok: true })
  } catch (error) {
    const motivo = error instanceof Error ? error.message : String(error)
    console.error('[mantener-base] no se pudo llegar a Supabase:', motivo)
    return res.status(502).json({ ok: false, error: motivo })
  }
}
