import { useState } from 'react'
import { useAuthStore } from '../../stores/useAuthStore'
import { usePageMeta } from '../../lib/usePageMeta'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'
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

const FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL ?? ''

export function Cuenta() {
    const { user, isAuthenticated, login, register, logout, clearError, authError } = useAuthStore()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [upgradeLoading, setUpgradeLoading] = useState(false)
    const [mode, setMode] = useState<'login' | 'register'>('login')
    const [registerSuccess, setRegisterSuccess] = useState(false)

    usePageMeta({
        title: 'Mi Cuenta',
        description: 'Accede a tu cuenta de Criterio Térmico. Gestiona tu suscripción y accede a herramientas profesionales.'
    })

    const handleSubmit = async (e: { preventDefault(): void }) => {
        e.preventDefault()
        clearError()
        setIsLoading(true)
        if (mode === 'login') {
            await login(email, password)
        } else {
            await register(email, password)
            if (!useAuthStore.getState().authError) {
                setRegisterSuccess(true)
            }
        }
        setIsLoading(false)
    }

    const handleUpgrade = async (tier: SubscriptionTier) => {
        if (!isSupabaseConfigured || !FUNCTIONS_URL) return
        setUpgradeLoading(true)
        try {
            const { data: { session } } = await supabase.auth.getSession()
            const res = await fetch(`${FUNCTIONS_URL}/create-subscription`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session?.access_token ?? ''}`,
                },
                body: JSON.stringify({ tier }),
            })
            const data = await res.json()
            if (data.init_point) {
                window.location.href = data.init_point
            }
        } finally {
            setUpgradeLoading(false)
        }
    }

    const switchMode = (m: 'login' | 'register') => {
        setMode(m)
        clearError()
        setRegisterSuccess(false)
    }

    if (!isAuthenticated) {
        return (
            <div className={styles.page}>
                <div className={styles.authContainer}>
                    <h1>{mode === 'login' ? 'Ingresar' : 'Crear cuenta'}</h1>
                    <p className={styles.authSubtitle}>
                        {mode === 'login'
                            ? 'Accedé a tus herramientas y contenido guardado.'
                            : 'Creá tu cuenta gratuita en segundos.'}
                    </p>

                    {registerSuccess ? (
                        <div className={styles.successBox}>
                            <p>Revisá tu email para confirmar la cuenta.</p>
                            <p className={styles.successHint}>
                                Una vez confirmado, ingresá con tu email y contraseña.
                            </p>
                            <button
                                className={styles.linkButton}
                                onClick={() => { setRegisterSuccess(false); setMode('login') }}
                            >
                                Ir al login →
                            </button>
                        </div>
                    ) : (
                        <>
                            {authError && (
                                <div className={styles.errorBox}>{authError}</div>
                            )}

                            <form onSubmit={handleSubmit} className={styles.form}>
                                <div className={styles.formGroup}>
                                    <label htmlFor="email">Email</label>
                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        placeholder="tu@email.com"
                                        required
                                        autoComplete="email"
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
                                        minLength={6}
                                        autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                                    />
                                </div>
                                <button type="submit" className={styles.submitButton} disabled={isLoading}>
                                    {isLoading
                                        ? (mode === 'login' ? 'Ingresando...' : 'Creando cuenta...')
                                        : (mode === 'login' ? 'Ingresar' : 'Crear cuenta')}
                                </button>
                            </form>

                            <p className={styles.switchMode}>
                                {mode === 'login' ? (
                                    <>¿No tenés cuenta?{' '}
                                        <button className={styles.linkButton} onClick={() => switchMode('register')}>
                                            Registrate gratis
                                        </button>
                                    </>
                                ) : (
                                    <>¿Ya tenés cuenta?{' '}
                                        <button className={styles.linkButton} onClick={() => switchMode('login')}>
                                            Ingresá
                                        </button>
                                    </>
                                )}
                            </p>

                            {!isSupabaseConfigured && (
                                <p className={styles.demoNote}>
                                    Demo: ingresá cualquier email para explorar la plataforma.
                                </p>
                            )}
                        </>
                    )}
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
                        {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
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
                    {tiers.map(tier => {
                        const isCurrent = user?.tier === tier.id
                        const canUpgrade = tier.id !== 'free' && !isCurrent && isSupabaseConfigured && !!FUNCTIONS_URL

                        return (
                            <div
                                key={tier.id}
                                className={`${styles.tierCard} ${isCurrent ? styles.tierCurrent : ''} ${tier.id === 'pro' ? styles.tierPopular : ''}`}
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
                                {isCurrent ? (
                                    <span className={styles.currentPlan}>Plan actual</span>
                                ) : canUpgrade ? (
                                    <button
                                        onClick={() => handleUpgrade(tier.id)}
                                        disabled={upgradeLoading}
                                        className={`${styles.upgradeButton} ${tier.id === 'pro' ? styles.buttonPro : styles.buttonPremium}`}
                                    >
                                        Actualizar a {tier.name}
                                    </button>
                                ) : tier.id === 'free' ? (
                                    <span className={styles.currentPlan}>—</span>
                                ) : (
                                    <span className={styles.comingSoon}>Próximamente</span>
                                )}
                            </div>
                        )
                    })}
                </div>

                {!isSupabaseConfigured && (
                    <p className={styles.demoNote} style={{ marginTop: '1rem' }}>
                        Demo: los pagos se activarán cuando Supabase y MercadoPago estén configurados.
                    </p>
                )}
            </section>
        </div>
    )
}
