import { Link } from 'react-router-dom'
import { useAuthStore } from '../../stores/useAuthStore'
import { usePageMeta } from '../../lib/usePageMeta'
import { SubscriptionBanner } from '../../components/ui/SubscriptionBanner/SubscriptionBanner'
import { erroresList } from '../../content/errores'
import styles from './ErroresFrecuentes.module.css'

const errores = erroresList

export function ErroresFrecuentes() {
    const { canAccess } = useAuthStore()

    usePageMeta({
        title: 'Errores Frecuentes en Instalaciones',
        description: 'Casos reales de problemas en instalaciones de calefacción por radiadores. Problema, causa y solución basados en experiencia de +200 obras.'
    })

    // Obtener stats
    const casosGratis = errores.filter(e => e.tier === 'free').length
    const casosTotal = errores.length

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <h1>⚠️ Errores Frecuentes</h1>
                <p className={styles.description}>
                    Casos reales documentados de problemas en instalaciones de calefacción.
                    Cada caso incluye <strong>problema</strong>, <strong>causa</strong> y <strong>solución</strong>
                    — basados en experiencia de +200 obras.
                </p>
                <div className={styles.stats}>
                    <span className={styles.statItem}>
                        📊 {casosGratis} casos gratuitos / {casosTotal} total
                    </span>
                </div>
            </div>

            <div className={styles.grid}>
                {errores.map(error => {
                    const hasAccess = canAccess(error.tier)

                    return (
                        <div
                            key={error.id}
                            className={`${styles.card} ${!hasAccess ? styles.cardLocked : ''}`}
                        >
                            <div className={styles.cardHeader}>
                                <span className={styles.categoria}>{error.categoria}</span>
                                {error.tier !== 'free' && (
                                    <span className={`${styles.badge} ${styles[`badge${error.tier.charAt(0).toUpperCase() + error.tier.slice(1)}`]}`}>
                                        {error.tier === 'pro' ? 'PRO' : 'PREMIUM'}
                                    </span>
                                )}
                            </div>

                            <h3 className={styles.cardTitle}>{error.titulo}</h3>
                            <p className={styles.cardPreview}>{error.preview}</p>

                            {hasAccess ? (
                                <Link to={`/errores/${error.id}`} className={styles.cardLink}>
                                    Ver caso completo →
                                </Link>
                            ) : (
                                <span className={styles.lockHint}>
                                    🔒 Requiere suscripción {error.tier}
                                </span>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Banner de suscripción para usuarios gratuitos */}
            {!canAccess('pro') && (
                <div className={styles.bannerSection}>
                    <SubscriptionBanner
                        requiredTier="pro"
                        feature="todos los casos de errores frecuentes"
                    />
                </div>
            )}
        </div>
    )
}
