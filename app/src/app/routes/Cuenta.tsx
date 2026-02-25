import { useState } from 'react'
import { useAuthStore } from '../../stores/useAuthStore'
import { usePageMeta } from '../../lib/usePageMeta'
import type { SubscriptionTier } from '../../stores/useAuthStore'
import styles from './Cuenta.module.css'

const tiers: { id: SubscriptionTier; name: string; price: string; priceAnual: string; badge?: string; features: string[] }[] = [
    {
        id: 'free',
        name: 'Gratuito',
        price: 'USD 0',
        priceAnual: '',
        features: [
            'Manual técnico básico',
            '1 calculadora',
            '2 casos de errores',
            'Contenido con publicidad'
        ]
    },
    {
        id: 'pro',
        name: 'PRO',
        price: 'USD 10/mes',
        priceAnual: 'USD 100/año (2 meses gratis)',
        badge: 'Más vendido',
        features: [
            'Manual técnico completo',
            'Todas las calculadoras',
            'Todos los errores frecuentes',
            'Sin publicidad',
            'Acceso profesional individual'
        ]
    },
    {
        id: 'premium',
        name: 'PREMIUM',
        price: 'USD 18/mes',
        priceAnual: 'USD 180/año (2 meses gratis)',
        badge: 'Cierre de obra',
        features: [
            'Todo lo incluido en PRO',
            'Simulador 2D completo (desktop)',
            'Proyectos guardados ilimitados',
            'Exportación PDF profesional',
            'Presupuestos detallados',
            'Herramientas de presentación'
        ]
    }
]

export function Cuenta() {
    const { user, isAuthenticated, login, logout, setUser } = useAuthStore()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    usePageMeta({
        title: 'Mi Cuenta',
        description: 'Accede a tu cuenta de Criterio Térmico. Gestiona tu suscripción y accede a herramientas profesionales.'
    })

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        await login(email, password)
        setIsLoading(false)
    }

    const handleUpgrade = (tier: SubscriptionTier) => {
        // TODO: Integrar pasarela de pago real
        if (user) {
            setUser({ ...user, tier })
        }
    }

    if (!isAuthenticated) {
        return (
            <div className={styles.page}>
                <div className={styles.authContainer}>
                    <h1>Ingresar a Criterio Térmico</h1>
                    <p className={styles.authSubtitle}>
                        Accede a herramientas, guarda proyectos y obtén más funcionalidades.
                    </p>

                    <form onSubmit={handleLogin} className={styles.form}>
                        <div className={styles.formGroup}>
                            <label htmlFor="email">Email</label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="tu@email.com"
                                required
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="password">Contraseña</label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                            />
                        </div>
                        <button type="submit" className={styles.submitButton} disabled={isLoading}>
                            {isLoading ? 'Ingresando...' : 'Ingresar'}
                        </button>
                    </form>

                    <p className={styles.demoNote}>
                        💡 Demo: Ingresa cualquier email para probar la plataforma.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <h1>Mi Cuenta</h1>
                <button onClick={logout} className={styles.logoutButton}>
                    Cerrar sesión
                </button>
            </div>

            {/* User Info */}
            <section className={styles.section}>
                <h2>Información</h2>
                <div className={styles.userCard}>
                    <div className={styles.userAvatar}>
                        {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                    </div>
                    <div className={styles.userInfo}>
                        <p className={styles.userName}>{user?.name || 'Usuario'}</p>
                        <p className={styles.userEmail}>{user?.email}</p>
                        <span className={`${styles.tierBadge} ${styles[`tier${user?.tier.charAt(0).toUpperCase()}${user?.tier.slice(1)}`]}`}>
                            {user?.tier === 'free' ? 'Gratuito' : user?.tier === 'pro' ? 'PRO' : 'PREMIUM'}
                        </span>
                    </div>
                </div>
            </section>

            {/* Subscription Plans */}
            <section className={styles.section}>
                <h2>Planes de Suscripción</h2>
                <div className={styles.tiersGrid}>
                    {tiers.map(tier => (
                        <div
                            key={tier.id}
                            className={`${styles.tierCard} ${user?.tier === tier.id ? styles.tierCurrent : ''} ${tier.id === 'pro' ? styles.tierPopular : ''}`}
                        >
                            {tier.badge && (
                                <span className={`${styles.tierBadgeLabel} ${tier.id === 'pro' ? styles.badgePro : styles.badgePremium}`}>
                                    {tier.badge}
                                </span>
                            )}
                            <h3 className={styles.tierName}>{tier.name}</h3>
                            <p className={styles.tierPrice}>{tier.price}</p>
                            {tier.priceAnual && (
                                <p className={styles.tierPriceAnual}>{tier.priceAnual}</p>
                            )}
                            <ul className={styles.tierFeatures}>
                                {tier.features.map((feature, i) => (
                                    <li key={i}>{feature}</li>
                                ))}
                            </ul>
                            {user?.tier === tier.id ? (
                                <span className={styles.currentPlan}>Plan actual</span>
                            ) : (
                                <button
                                    onClick={() => handleUpgrade(tier.id)}
                                    className={`${styles.upgradeButton} ${tier.id === 'pro' ? styles.buttonPro : tier.id === 'premium' ? styles.buttonPremium : ''}`}
                                >
                                    {tier.id === 'free' ? 'Cambiar a Gratuito' : `Actualizar a ${tier.name}`}
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </section>
        </div>
    )
}
