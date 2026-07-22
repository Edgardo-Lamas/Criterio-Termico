import { useEffect, useState } from 'react'
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { useAuthStore } from '../../stores/useAuthStore'
import { usePageMeta } from '../../lib/usePageMeta'
import { Icon } from '../../components/ui/Icon/Icon'
import styles from './Panel.module.css'

// Email con acceso al panel (solo UI — ver nota de seguridad en el plan).
const ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL ?? 'edgardolamas2000@gmail.com').toLowerCase()

// Colores de marca para los gráficos (equivalen a los tokens del design system).
const C_CLICKS = '#e94560'      // --color-primary
const C_IMPR = '#4488ff'        // --color-cold

// ── Tipos del payload de /api/search-console ─────────────────────────────────
interface SeoData {
    live: true
    period: string
    totals: { clicks: number; impressions: number; ctr: number; position: number }
    daily: { date: string; clicks: number; impressions: number }[]
    queries: { query: string; clicks: number; impressions: number; ctr: number; position: number }[]
    pages: { page: string; clicks: number; impressions: number; position: number }[]
    countries: { country: string; clicks: number; impressions: number }[]
    devices: { device: string; clicks: number; impressions: number }[]
}
interface SeoError { live: false; error?: string }
type SeoResponse = SeoData | SeoError

const num = (n: number) => n.toLocaleString('es-AR')

const DEVICE_LABEL: Record<string, string> = {
    DESKTOP: 'Escritorio', MOBILE: 'Celular', TABLET: 'Tablet',
}
const COUNTRY_LABEL: Record<string, string> = {
    arg: 'Argentina', esp: 'España', mex: 'México', usa: 'EE.UU.',
    chl: 'Chile', col: 'Colombia', per: 'Perú', ury: 'Uruguay', deu: 'Alemania',
}

// Badge de posición: verde top 3, ámbar top 10, gris el resto.
function posClass(pos: number): string {
    if (pos <= 3) return styles.posGood
    if (pos <= 10) return styles.posMid
    return styles.posLow
}

// ── Tooltip de los gráficos ──────────────────────────────────────────────────
interface TipProps {
    active?: boolean
    label?: string | number
    payload?: { name?: string; value?: number; color?: string }[]
}
function ChartTip({ active, payload, label }: TipProps) {
    if (!active || !payload?.length) return null
    return (
        <div style={{
            background: '#16213e', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8, padding: '8px 12px', fontSize: 13,
        }}>
            {label != null && <p style={{ margin: 0, color: '#fff', fontWeight: 600 }}>{String(label).slice(5)}</p>}
            {payload.map((p, i) => (
                <p key={i} style={{ margin: '2px 0 0', color: p.color ?? C_CLICKS }}>
                    {p.name}: <strong>{num(p.value ?? 0)}</strong>
                </p>
            ))}
        </div>
    )
}

// ── Página ───────────────────────────────────────────────────────────────────
export function Panel() {
    const { user, isAuthenticated } = useAuthStore()
    const [data, setData] = useState<SeoResponse | null>(null)

    usePageMeta({ title: 'Panel de métricas', description: 'Panel interno de métricas SEO de Criterio Térmico.' })

    const isAdmin = isAuthenticated && user?.email?.toLowerCase() === ADMIN_EMAIL

    useEffect(() => {
        if (!isAdmin) return
        fetch('/api/search-console')
            .then(r => r.json() as Promise<SeoResponse>)
            .then(setData)
            .catch(() => setData({ live: false, error: 'No se pudo conectar con el servidor.' }))
    }, [isAdmin])

    if (!isAdmin) {
        return (
            <div className={styles.page}>
                <div className={styles.gate}>
                    <h1>Acceso restringido</h1>
                    <p>Este panel es solo para la cuenta administradora de Criterio Térmico.</p>
                </div>
            </div>
        )
    }

    // Oportunidades: keywords en posición 5–20 con más impresiones (fruta al alcance).
    const oportunidades = data?.live
        ? [...data.queries]
            .filter(q => q.position > 4 && q.position <= 20)
            .sort((a, b) => b.impressions - a.impressions)
            .slice(0, 5)
        : []

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <h1 className={styles.headerTitle}>
                    <Icon name="monitor" size={28} /> Panel de métricas
                </h1>
                <p className={styles.headerSub}>
                    Rendimiento SEO · datos de Google Search Console
                </p>
                <div className={styles.tabs}>
                    <button className={styles.tabActive}>SEO</button>
                    <span className={styles.tabDisabled}>
                        Audiencia<span className={styles.tabSoon}>pronto</span>
                    </span>
                </div>
            </header>

            {data === null && <p className={styles.loading}>Cargando métricas…</p>}

            {data?.live === false && <SetupGuide error={data.error} />}

            {data?.live && (
                <>
                    <div className={styles.bannerOk}>
                        <Icon name="zap" size={18} />
                        <span>Conectado a Google Search Console · período {data.period}</span>
                    </div>

                    {/* KPIs */}
                    <div className={styles.kpiGrid}>
                        <Kpi label="Clics" value={num(data.totals.clicks)} sub="desde Google" />
                        <Kpi label="Impresiones" value={num(data.totals.impressions)} sub="veces que apareciste" />
                        <Kpi label="CTR" value={`${data.totals.ctr.toFixed(1)}%`} sub="clic por impresión" />
                        <Kpi label="Posición media" value={data.totals.position.toFixed(1)} sub="en resultados" />
                    </div>

                    {/* Tendencia diaria */}
                    {data.daily.length > 0 && (
                        <section className={styles.card}>
                            <h2 className={styles.cardTitle}>Tendencia diaria</h2>
                            <p className={styles.cardSub}>Clics e impresiones en Google — últimos 28 días</p>
                            <ResponsiveContainer width="100%" height={240}>
                                <AreaChart data={data.daily} margin={{ top: 5, right: 10, left: -12, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="gClicks" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={C_CLICKS} stopOpacity={0.35} />
                                            <stop offset="95%" stopColor={C_CLICKS} stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="gImpr" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={C_IMPR} stopOpacity={0.3} />
                                            <stop offset="95%" stopColor={C_IMPR} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#a0a0b8' }} tickFormatter={d => String(d).slice(5)} />
                                    <YAxis tick={{ fontSize: 11, fill: '#a0a0b8' }} />
                                    <Tooltip content={<ChartTip />} />
                                    <Legend wrapperStyle={{ fontSize: 12 }} />
                                    <Area type="monotone" dataKey="clicks" name="Clics" stroke={C_CLICKS} fill="url(#gClicks)" strokeWidth={2} />
                                    <Area type="monotone" dataKey="impressions" name="Impresiones" stroke={C_IMPR} fill="url(#gImpr)" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </section>
                    )}

                    {/* Oportunidades */}
                    <section className={styles.oppCard}>
                        <h2 className={styles.cardTitle}>⚡ Oportunidades</h2>
                        <p className={styles.cardSub}>
                            Búsquedas donde ya aparecés en la página 1–2 (posición 5–20). Un empujón de
                            contenido o de título las puede subir al top 3.
                        </p>
                        {oportunidades.length > 0 ? (
                            oportunidades.map((q, i) => (
                                <div key={i} className={styles.oppItem}>
                                    <div style={{ minWidth: 0 }}>
                                        <p className={styles.oppKeyword}>{q.query}</p>
                                        <p className={styles.oppHint}>
                                            {num(q.impressions)} impresiones · CTR {q.ctr.toFixed(1)}%
                                        </p>
                                    </div>
                                    <div className={styles.oppMeta}>
                                        <span>pos.</span>
                                        <span className={posClass(q.position)}>#{q.position}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className={styles.emptyHint}>
                                Todavía no hay búsquedas en ese rango. Aparecen cuando el sitio acumule
                                historia de indexación.
                            </p>
                        )}
                    </section>

                    <div className={styles.grid2}>
                        {/* Top consultas */}
                        <section className={styles.card}>
                            <h2 className={styles.cardTitle}>Top consultas</h2>
                            <p className={styles.cardSub}>Palabras clave que te encuentran</p>
                            <div className={styles.list}>
                                {data.queries.slice(0, 10).map((q, i) => (
                                    <div key={i} className={styles.listItem}>
                                        <div className={styles.itemMain}>
                                            <span className={styles.rank}>#{i + 1}</span>
                                            <span className={styles.itemText}>{q.query}</span>
                                        </div>
                                        <div className={styles.itemMeta}>
                                            <span>{num(q.clicks)} clics</span>
                                            <span className={posClass(q.position)}>#{q.position}</span>
                                        </div>
                                    </div>
                                ))}
                                {data.queries.length === 0 && <p className={styles.emptyHint}>Sin datos aún.</p>}
                            </div>
                        </section>

                        {/* Top páginas */}
                        <section className={styles.card}>
                            <h2 className={styles.cardTitle}>Top páginas</h2>
                            <p className={styles.cardSub}>Las más vistas desde Google</p>
                            <div className={styles.list}>
                                {data.pages.slice(0, 10).map((p, i) => (
                                    <div key={i} className={styles.listItem}>
                                        <div className={styles.itemMain}>
                                            <span className={styles.rank}>#{i + 1}</span>
                                            <span className={styles.itemText}>{p.page}</span>
                                        </div>
                                        <div className={styles.itemMeta}>
                                            <span>{num(p.clicks)} clics</span>
                                            <span className={styles.itemText}>{num(p.impressions)} imp.</span>
                                        </div>
                                    </div>
                                ))}
                                {data.pages.length === 0 && <p className={styles.emptyHint}>Sin datos aún.</p>}
                            </div>
                        </section>
                    </div>

                    {/* Dispositivo */}
                    {data.devices.length > 0 && (
                        <section className={styles.card}>
                            <h2 className={styles.cardTitle}>Dispositivo</h2>
                            <p className={styles.cardSub}>Clics por tipo de dispositivo — tu público busca desde la obra</p>
                            <div className={styles.miniGrid}>
                                {data.devices.map((d, i) => (
                                    <div key={i} className={styles.miniCard}>
                                        <p className={styles.miniValue}>{num(d.clicks)}</p>
                                        <p className={styles.miniLabel}>{DEVICE_LABEL[d.device] ?? d.device}</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Países */}
                    {data.countries.length > 0 && (
                        <section className={styles.card}>
                            <h2 className={styles.cardTitle}>Países</h2>
                            <p className={styles.cardSub}>Top países por clics desde Google</p>
                            <div className={styles.miniGrid}>
                                {data.countries.map((c, i) => (
                                    <div key={i} className={styles.miniCard}>
                                        <p className={styles.miniValue}>{num(c.clicks)}</p>
                                        <p className={styles.miniLabel}>{COUNTRY_LABEL[c.country] ?? c.country.toUpperCase()}</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </>
            )}
        </div>
    )
}

// ── Subcomponentes ───────────────────────────────────────────────────────────
function Kpi({ label, value, sub }: { label: string; value: string; sub: string }) {
    return (
        <div className={styles.kpiCard}>
            <p className={styles.kpiValue}>{value}</p>
            <p className={styles.kpiLabel}>{label}</p>
            <p className={styles.kpiSub}>{sub}</p>
        </div>
    )
}

function SetupGuide({ error }: { error?: string }) {
    const steps = [
        {
            title: 'Verificar el sitio en Search Console',
            desc: 'Entrá a Google Search Console y agregá tu sitio como propiedad. Confirmá que ya tengas datos de rendimiento.',
            link: 'https://search.google.com/search-console',
            linkLabel: 'Abrir Search Console →',
        },
        {
            title: 'Crear credenciales OAuth en Google Cloud',
            desc: 'En Google Cloud Console habilitá la "Search Console API" y creá un ID de cliente OAuth 2.0 (tipo App de escritorio). Guardá el Client ID y el Client Secret.',
            link: 'https://console.cloud.google.com/apis/library/searchconsole.googleapis.com',
            linkLabel: 'Abrir Google Cloud →',
        },
        {
            title: 'Obtener el refresh token',
            desc: 'En OAuth Playground, usá tu Client ID/Secret con el scope webmasters.readonly y autorizá con la cuenta que tiene acceso a Search Console. Copiá el refresh token.',
            link: 'https://developers.google.com/oauthplayground',
            linkLabel: 'Abrir OAuth Playground →',
        },
        {
            title: 'Cargar las variables en Vercel',
            desc: 'En Vercel → Project Settings → Environment Variables agregá GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET y GOOGLE_REFRESH_TOKEN (y GSC_SITE si tu propiedad no es el dominio vercel.app). Hacé redeploy.',
            link: 'https://vercel.com/dashboard',
            linkLabel: 'Abrir Vercel →',
        },
    ]
    return (
        <>
            <div className={styles.bannerWarn}>
                <Icon name="alert" size={18} />
                <span>
                    {error ? `Search Console no conectado — ${error}` : 'Search Console todavía no está conectado.'}
                    {' '}Seguí estos pasos para ver clics reales, palabras clave y posición en Google.
                </span>
            </div>
            <section className={styles.card}>
                <h2 className={styles.cardTitle}>Conectar en 4 pasos</h2>
                <p className={styles.cardSub}>Se configura una sola vez.</p>
                {steps.map((s, i) => (
                    <div key={i} className={styles.step}>
                        <div className={styles.stepNum}>{i + 1}</div>
                        <div>
                            <p className={styles.stepTitle}>{s.title}</p>
                            <p className={styles.stepDesc}>{s.desc}</p>
                            <a className={styles.stepLink} href={s.link} target="_blank" rel="noopener noreferrer">
                                {s.linkLabel}
                            </a>
                        </div>
                    </div>
                ))}
            </section>
        </>
    )
}
