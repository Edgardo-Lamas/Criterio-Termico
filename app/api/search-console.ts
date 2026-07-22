// Serverless Function (Vercel) — Google Search Console API
//
// Fuente del panel de métricas SEO (/panel). Devuelve el rendimiento del sitio
// en la búsqueda de Google de los últimos 28 días: totales, tendencia diaria,
// palabras clave, páginas, países y dispositivo (móvil vs. desktop).
//
// Auth: OAuth2 con refresh token. Variables de entorno en Vercel:
//   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN
//   GSC_SITE  (opcional) — ej: 'sc-domain:criteriotermico.com' o
//             'https://criterio-termico.vercel.app/'. Default: el dominio Vercel.
//
// Caché en memoria 30 min para no gastar cuota de la API en cada visita.
// Nunca lanza: ante cualquier problema devuelve { live: false, error } y el
// panel muestra las instrucciones de configuración.

import type { VercelRequest, VercelResponse } from '@vercel/node'

const GSC_SITE = process.env.GSC_SITE ?? 'sc-domain:criterio-termico.vercel.app'
const TTL_MS = 30 * 60 * 1000

interface GscRow {
  keys?: string[]
  clicks: number
  impressions: number
  ctr: number
  position: number
}

interface SeoResult {
  live: true
  period: string
  totals: { clicks: number; impressions: number; ctr: number; position: number }
  daily: { date: string; clicks: number; impressions: number }[]
  queries: { query: string; clicks: number; impressions: number; ctr: number; position: number }[]
  pages: { page: string; clicks: number; impressions: number; position: number }[]
  countries: { country: string; clicks: number; impressions: number }[]
  devices: { device: string; clicks: number; impressions: number }[]
}

let cache: { data: SeoResult; fetchedAt: number } | null = null
let tokenCache: { token: string; exp: number } | null = null

async function getAccessToken(): Promise<string> {
  if (tokenCache && tokenCache.exp > Date.now()) return tokenCache.token

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID ?? '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN ?? '',
      grant_type: 'refresh_token',
    }).toString(),
  })

  const data = (await res.json()) as { access_token?: string; expires_in?: number }
  if (!data.access_token) throw new Error('OAuth error: ' + JSON.stringify(data))

  tokenCache = { token: data.access_token, exp: Date.now() + ((data.expires_in ?? 3600) - 60) * 1000 }
  return data.access_token
}

interface QueryBody {
  startDate: string
  endDate: string
  dimensions?: string[]
  rowLimit?: number
}

async function query(token: string, body: QueryBody): Promise<{ rows?: GscRow[] }> {
  const url = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(GSC_SITE)}/searchAnalytics/query`
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return (await res.json()) as { rows?: GscRow[] }
}

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'public, max-age=1800, stale-while-revalidate=3600')

  if (cache && Date.now() - cache.fetchedAt < TTL_MS) {
    return res.status(200).json(cache.data)
  }

  const missing = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_REFRESH_TOKEN'].filter(
    (k) => !process.env[k],
  )
  if (missing.length) {
    return res.status(200).json({ live: false, error: `Faltan variables: ${missing.join(', ')}` })
  }

  try {
    const token = await getAccessToken()

    const end = new Date().toISOString().split('T')[0]
    const start = new Date(Date.now() - 28 * 86400000).toISOString().split('T')[0]
    const range = { startDate: start, endDate: end }

    const [dailyData, queryData, pageData, countryData, deviceData] = await Promise.all([
      query(token, { ...range, dimensions: ['date'], rowLimit: 28 }),
      query(token, { ...range, dimensions: ['query'], rowLimit: 25 }),
      query(token, { ...range, dimensions: ['page'], rowLimit: 15 }),
      query(token, { ...range, dimensions: ['country'], rowLimit: 5 }),
      query(token, { ...range, dimensions: ['device'], rowLimit: 3 }),
    ])

    const daily = dailyData.rows ?? []
    const totalClicks = daily.reduce((a, r) => a + r.clicks, 0)
    const totalImpressions = daily.reduce((a, r) => a + r.impressions, 0)
    const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0
    const avgPosition = daily.length > 0 ? daily.reduce((a, r) => a + r.position, 0) / daily.length : 0

    const siteOrigin = GSC_SITE.replace(/^sc-domain:/, 'https://').replace(/\/$/, '')

    const result: SeoResult = {
      live: true,
      period: `${start} → ${end}`,
      totals: { clicks: totalClicks, impressions: totalImpressions, ctr: avgCTR, position: avgPosition },
      daily: daily.map((r) => ({ date: r.keys?.[0] ?? '', clicks: r.clicks, impressions: r.impressions })),
      queries: (queryData.rows ?? []).map((r) => ({
        query: r.keys?.[0] ?? '',
        clicks: r.clicks,
        impressions: r.impressions,
        ctr: Math.round(r.ctr * 1000) / 10,
        position: Math.round(r.position * 10) / 10,
      })),
      pages: (pageData.rows ?? []).map((r) => ({
        page: (r.keys?.[0] ?? '').replace(siteOrigin, '') || '/',
        clicks: r.clicks,
        impressions: r.impressions,
        position: Math.round(r.position * 10) / 10,
      })),
      countries: (countryData.rows ?? []).map((r) => ({
        country: r.keys?.[0] ?? '',
        clicks: r.clicks,
        impressions: r.impressions,
      })),
      devices: (deviceData.rows ?? []).map((r) => ({
        device: r.keys?.[0] ?? '',
        clicks: r.clicks,
        impressions: r.impressions,
      })),
    }

    cache = { data: result, fetchedAt: Date.now() }
    return res.status(200).json(result)
  } catch (err) {
    return res.status(200).json({ live: false, error: err instanceof Error ? err.message : 'Error desconocido' })
  }
}
