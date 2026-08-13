import { Link } from 'react-router-dom'
import { useAuthStore } from '../../stores/useAuthStore'
import { usePageMeta } from '../../lib/usePageMeta'
import { Icon } from '../../components/ui/Icon/Icon'
import { SubscriptionBanner } from '../../components/ui/SubscriptionBanner/SubscriptionBanner'
import { erroresList, getIndiceTematico } from '../../content/errores'
import styles from './ErroresFrecuentes.module.css'

const errores = erroresList

// Se cuenta, no se escribe a mano: el número se mueve con cada caso nuevo.
const totalTemas = getIndiceTematico().reduce((suma, grupo) => suma + grupo.entradas.length, 0)

export function ErroresFrecuentes() {
    const { canAccess } = useAuthStore()

    usePageMeta({
        title: 'Errores Frecuentes en Instalaciones',
        description: 'Casos reales de problemas en instalaciones de calefacción por radiadores. Problema, causa y solución documentados en obra.'
    })

    // Obtener stats
    const casosGratis = errores.filter(e => e.tier === 'free').length
    const casosTotal = errores.length

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <h1><Icon name="alert" size={28} className={styles.titleIcon} /> Errores Frecuentes</h1>
                <p className={styles.description}>
                    Casos reales documentados de problemas en instalaciones de calefacción.
                    Cada caso incluye <strong>problema</strong>, <strong>causa</strong> y <strong>solución</strong>,
                    documentados en obra.
                </p>
                <div className={styles.stats}>
                    <span className={styles.statItem}>
                        {casosGratis} casos gratuitos / {casosTotal} total
                    </span>
                </div>
            </div>

            {/* Entrada por síntoma: el que viene de otro oficio no sabe en qué caso
                está lo que busca, pero reconoce el tema al verlo en una lista. */}
            <Link to="/errores/indice" className={styles.indiceCta}>
                <span className={styles.indiceCtaTexto}>
                    <strong>¿No sabés en qué caso está lo que buscás?</strong>
                    Entrá por el índice temático: {totalTemas} temas de obra ordenados por lo que ves.
                </span>
                <span className={styles.indiceCtaFlecha} aria-hidden="true">→</span>
            </Link>

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
                                    <Icon name="lock" size={14} /> Se desbloquea con {error.tier === 'pro' ? 'PRO' : 'Premium'}
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
