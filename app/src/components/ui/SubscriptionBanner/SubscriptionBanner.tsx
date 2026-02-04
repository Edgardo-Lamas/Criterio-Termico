import { Link } from 'react-router-dom'
import type { SubscriptionTier } from '../../../stores/useAuthStore'
import styles from './SubscriptionBanner.module.css'

interface SubscriptionBannerProps {
    requiredTier: SubscriptionTier
    feature: string
}

export function SubscriptionBanner({ requiredTier, feature }: SubscriptionBannerProps) {
    const tierName = requiredTier === 'pro' ? 'Pro' : 'Premium'
    const tierPrice = requiredTier === 'pro' ? 'ARS 2.999/mes' : 'ARS 9.999/mes'

    return (
        <div className={styles.banner}>
            <div className={styles.content}>
                <div className={styles.icon}>💎</div>
                <div className={styles.text}>
                    <h3 className={styles.title}>
                        Accede a {feature}
                    </h3>
                    <p className={styles.description}>
                        Obtén la suscripción <strong>{tierName}</strong> para desbloquear esta
                        funcionalidad y muchas más herramientas profesionales.
                    </p>
                </div>
            </div>

            <div className={styles.action}>
                <span className={styles.price}>{tierPrice}</span>
                <Link to="/cuenta" className={styles.button}>
                    Ver planes →
                </Link>
            </div>
        </div>
    )
}
