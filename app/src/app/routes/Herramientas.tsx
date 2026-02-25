import { useParams, Link } from 'react-router-dom'
import { useAuthStore } from '../../stores/useAuthStore'
import { usePageMeta } from '../../lib/usePageMeta'
import { SubscriptionBanner } from '../../components/ui/SubscriptionBanner/SubscriptionBanner'
import styles from './Herramientas.module.css'

// Placeholder para las herramientas disponibles
const herramientas = [
    {
        id: 'potencia',
        name: 'Calculadora de Potencia',
        description: 'Calcula la potencia térmica necesaria para un ambiente.',
        icon: '🔥',
        tier: 'free' as const,
        available: true
    },
    {
        id: 'diametro',
        name: 'Calculadora de Diámetros',
        description: 'Determina el diámetro óptimo de tuberías según caudal.',
        icon: '📏',
        tier: 'pro' as const,
        available: true
    },
    {
        id: 'caudal',
        name: 'Calculadora de Caudal',
        description: 'Calcula el caudal necesario para un circuito.',
        icon: '💧',
        tier: 'pro' as const,
        available: true
    },
    {
        id: 'simulador',
        name: 'Simulador 2D',
        description: 'Diseña instalaciones completas en canvas 2D. Solo desktop.',
        icon: '🖥️',
        tier: 'premium' as const,
        available: true,
        desktopOnly: true
    },
    {
        id: 'presupuesto',
        name: 'Generador de Presupuestos',
        description: 'Crea presupuestos automáticos con materiales y mano de obra.',
        icon: '💰',
        tier: 'premium' as const,
        available: false // Próximamente
    }
]

export function Herramientas() {
    const { toolId } = useParams()
    const { canAccess } = useAuthStore()

    usePageMeta({
        title: 'Herramientas del Instalador',
        description: 'Calculadoras de potencia térmica, diámetros de tuberías, caudales y simulador 2D para diseño de instalaciones de calefacción.'
    })

    // Si hay un toolId, mostrar la herramienta específica
    if (toolId) {
        const tool = herramientas.find(h => h.id === toolId)

        if (!tool) {
            return (
                <div className={styles.notFound}>
                    <h2>Herramienta no encontrada</h2>
                    <Link to="/herramientas">← Volver a herramientas</Link>
                </div>
            )
        }

        if (!canAccess(tool.tier)) {
            return (
                <div className={styles.page}>
                    <div className={styles.header}>
                        <Link to="/herramientas" className={styles.backLink}>← Herramientas</Link>
                        <h1>{tool.icon} {tool.name}</h1>
                    </div>
                    <SubscriptionBanner
                        requiredTier={tool.tier}
                        feature={tool.name}
                    />
                </div>
            )
        }

        // TODO: Renderizar la herramienta específica
        return (
            <div className={styles.page}>
                <div className={styles.header}>
                    <Link to="/herramientas" className={styles.backLink}>← Herramientas</Link>
                    <h1>{tool.icon} {tool.name}</h1>
                    <p className={styles.description}>{tool.description}</p>
                </div>

                <div className={styles.toolContainer}>
                    {/* Placeholder - aquí irá la calculadora real */}
                    <div className={styles.placeholder}>
                        <p>🚧 Herramienta en desarrollo</p>
                        <p className={styles.placeholderSub}>
                            Esta herramienta estará disponible próximamente.
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    // Lista de herramientas
    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <h1>🔧 Herramientas del Instalador</h1>
                <p className={styles.description}>
                    Calculadoras y simuladores para diseñar y dimensionar instalaciones de calefacción.
                </p>
            </div>

            <div className={styles.grid}>
                {herramientas.map(tool => {
                    const hasAccess = canAccess(tool.tier)
                    const isLocked = !hasAccess || !tool.available

                    return (
                        <Link
                            key={tool.id}
                            to={isLocked ? '#' : `/herramientas/${tool.id}`}
                            className={`${styles.card} ${isLocked ? styles.cardLocked : ''}`}
                            onClick={e => isLocked && e.preventDefault()}
                        >
                            <div className={styles.cardHeader}>
                                <span className={styles.cardIcon}>{tool.icon}</span>
                                {tool.tier !== 'free' && (
                                    <span className={`${styles.badge} ${styles[`badge${tool.tier.charAt(0).toUpperCase() + tool.tier.slice(1)}`]}`}>
                                        {tool.tier === 'pro' ? 'PRO' : 'PREMIUM'}
                                    </span>
                                )}
                                {tool.desktopOnly && (
                                    <span className={styles.badgeDesktop}>Desktop</span>
                                )}
                            </div>
                            <h3 className={styles.cardTitle}>{tool.name}</h3>
                            <p className={styles.cardDescription}>{tool.description}</p>

                            {!tool.available && (
                                <span className={styles.comingSoon}>Próximamente</span>
                            )}

                            {tool.available && !hasAccess && (
                                <span className={styles.unlockHint}>
                                    🔒 Requiere suscripción {tool.tier}
                                </span>
                            )}
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}
