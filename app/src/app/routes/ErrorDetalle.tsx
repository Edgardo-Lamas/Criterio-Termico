import { useParams, Link } from 'react-router-dom'
import { useAuthStore } from '../../stores/useAuthStore'
import { usePageMeta } from '../../lib/usePageMeta'
import { SubscriptionBanner } from '../../components/ui/SubscriptionBanner/SubscriptionBanner'
import { getErrorMeta, getErrorContent, erroresList } from '../../content/errores'
import styles from './ErrorDetalle.module.css'

export function ErrorDetalle() {
    const { errorId } = useParams()
    const { canAccess } = useAuthStore()

    const meta = errorId ? getErrorMeta(errorId) : null
    const Contenido = errorId ? getErrorContent(errorId) : null

    usePageMeta({
        title: meta ? `${meta.titulo} — Errores Frecuentes` : 'Error no encontrado',
        description: meta?.resumen ?? ''
    })

    if (!meta) {
        return (
            <div className={styles.notFound}>
                <h2>Caso no encontrado</h2>
                <Link to="/errores">← Volver a Errores Frecuentes</Link>
            </div>
        )
    }

    const hasAccess = canAccess(meta.tier)
    const currentIndex = erroresList.findIndex(e => e.id === meta.id)
    const prev = currentIndex > 0 ? erroresList[currentIndex - 1] : null
    const next = currentIndex < erroresList.length - 1 ? erroresList[currentIndex + 1] : null

    return (
        <div className={styles.page}>
            {/* Header */}
            <div className={styles.header}>
                <Link to="/errores" className={styles.backLink}>← Errores Frecuentes</Link>
                <div className={styles.meta}>
                    <span className={styles.categoria}>{meta.categoria}</span>
                    {meta.tier !== 'free' && (
                        <span className={`${styles.badge} ${styles[`badge${meta.tier.charAt(0).toUpperCase() + meta.tier.slice(1)}`]}`}>
                            {meta.tier === 'pro' ? 'PRO' : 'PREMIUM'}
                        </span>
                    )}
                </div>
                <h1>{meta.titulo}</h1>
                <p className={styles.resumen}>{meta.resumen}</p>
            </div>

            {/* Contenido o paywall */}
            {hasAccess ? (
                <article className={styles.content}>
                    {Contenido
                        ? <Contenido />
                        : <p className={styles.noContent}>Contenido en preparación.</p>
                    }
                </article>
            ) : (
                <div className={styles.paywallSection}>
                    <SubscriptionBanner
                        requiredTier={meta.tier}
                        feature={`el caso completo: "${meta.titulo}"`}
                    />
                </div>
            )}

            {/* Navegación entre casos */}
            <nav className={styles.caseNav}>
                {prev && (
                    <Link to={`/errores/${prev.id}`} className={styles.navPrev}>
                        ← {prev.titulo}
                    </Link>
                )}
                {next && (
                    <Link to={`/errores/${next.id}`} className={styles.navNext}>
                        {next.titulo} →
                    </Link>
                )}
            </nav>
        </div>
    )
}
