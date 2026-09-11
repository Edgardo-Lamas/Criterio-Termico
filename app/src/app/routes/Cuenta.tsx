import { useState } from 'react'
import { useAuthStore } from '../../stores/useAuthStore'
import { usePageMeta } from '../../lib/usePageMeta'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'
import type { SubscriptionTier } from '../../stores/useAuthStore'
import styles from './Cuenta.module.css'
import { FichaInstalador } from '../../components/FichaInstalador/FichaInstalador'

// 🔴 LOS PRECIOS VAN EN PESOS Y SE COBRAN EN PESOS.
//
// Hasta el 2026-09-08 esta pantalla anunciaba USD 10 y USD 18 mientras
// MercadoPago cobraba $12.000 y $21.000: con el dólar a $1.530 se estaba
// cobrando un 22% menos de lo anunciado, y el desfasaje crecía solo cada vez
// que se movía el dólar. Se cobra por MercadoPago en Argentina, así que el
// cobro siempre es en pesos y el cartel tiene que decir lo mismo.
//
// ⚠ El importe que se COBRA no vive acá: vive en el plan de MercadoPago, y
// `create-subscription` lo lee antes de cada alta. Cambiar este texto NO cambia
// lo que se cobra. Los dos lados se mueven juntos o la pantalla vuelve a mentir.
//
// ⚠ El mismo precio está en `src/pages/plataforma.astro` del repo del SITIO
// (`~/Desktop/Trabajos/Criterio Termico`), que es la puerta de entrada al SaaS.
//
// El plan anual salió de acá el 2026-09-08: anunciaba «USD 100/año (2 meses
// gratis)» y no existía. El botón manda `{ tier }` a `create-subscription`, que
// mapea cada tier a UN plan de MP, el mensual: el que leía el precio anual y
// apretaba, terminaba suscripto al mensual. Para traerlo hay que crear los dos
// planes anuales en MP y un selector; hasta entonces no se anuncia.
const tiers: { id: SubscriptionTier; name: string; price: string; badge?: string; features: string[] }[] = [
    {
        id: 'free',
        name: 'Gratuito',
        price: '$0',
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
        price: '$30.000/mes',
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
        price: '$40.000/mes',
        badge: 'Cierre de obra',
        features: [
            'Todo lo incluido en PRO',
            'Simulador 2D completo (desktop)',
            'Exportación PDF profesional',
            'Exportación a DXF (AutoCAD)',
            'Presupuestos detallados'
        ]
    }
]

const FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL ?? ''

type AuthMode = 'login' | 'register' | 'recuperar'

const TITULOS: Record<AuthMode, string> = {
    login: 'Ingresar',
    register: 'Crear cuenta',
    recuperar: 'Recuperar contraseña',
}

const SUBTITULOS: Record<AuthMode, string> = {
    login: 'Accedé a tus herramientas y contenido guardado.',
    register: 'Creá tu cuenta gratuita en segundos.',
    recuperar: 'Poné tu email y te mandamos un enlace para elegir una nueva.',
}

const BOTONES: Record<AuthMode, string> = {
    login: 'Ingresar',
    register: 'Crear cuenta',
    recuperar: 'Enviarme el enlace',
}

const BOTONES_CARGANDO: Record<AuthMode, string> = {
    login: 'Ingresando...',
    register: 'Creando cuenta...',
    recuperar: 'Enviando...',
}

export function Cuenta() {
    const {
        user, isAuthenticated, login, register, logout, clearError, authError,
        recoveryMode, requestPasswordReset, updatePassword,
    } = useAuthStore()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [upgradeLoading, setUpgradeLoading] = useState(false)
    const [upgradeError, setUpgradeError] = useState('')
    // Arranca en 'login': el botón "Ingresar" de la barra de navegación trae
    // acá, y mostrar "Crear cuenta" a quien vino a loguearse confunde.
    const [mode, setMode] = useState<AuthMode>('login')
    const [registerSuccess, setRegisterSuccess] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    // Enlace de recuperación pedido: se muestra el mismo mensaje exista o no la
    // cuenta, para no confirmarle a nadie qué emails están registrados.
    const [resetSent, setResetSent] = useState(false)
    // Contraseña nueva — sirve para el que vuelve del mail y para el que la
    // cambia desde su cuenta ya estando adentro.
    const [nuevaPassword, setNuevaPassword] = useState('')
    const [passwordLoading, setPasswordLoading] = useState(false)
    const [passwordOk, setPasswordOk] = useState(false)
    // El store apaga recoveryMode apenas la contraseña se guarda, así que sin
    // esta marca la pantalla desaparecería antes de poder confirmar nada.
    const [recoveryOk, setRecoveryOk] = useState(false)

    usePageMeta({
        title: 'Mi Cuenta',
        description: 'Accede a tu cuenta de Criterio Térmico. Gestiona tu suscripción y accede a herramientas profesionales.'
    })

    const handleSubmit = async (e: { preventDefault(): void }) => {
        e.preventDefault()
        clearError()
        setIsLoading(true)
        try {
            if (mode === 'recuperar') {
                if (await requestPasswordReset(email)) {
                    setResetSent(true)
                }
            } else if (mode === 'login') {
                await login(email, password)
            } else {
                await register(email, password)
                if (!useAuthStore.getState().authError) {
                    setRegisterSuccess(true)
                }
            }
        } finally {
            // Garantiza que el botón se libere pase lo que pase — login()/register()
            // ya capturan sus propias excepciones, pero este finally es la última
            // red de seguridad para que el spinner nunca quede colgado.
            setIsLoading(false)
        }
    }

    // ⚠ Este botón supo fallar EN SILENCIO. Si MercadoPago rechazaba el pedido
    // —pasó: la suscripción se pedía de una forma que exige la tarjeta ya
    // tokenizada— no había init_point, no se redirigía y no se mostraba nada:
    // desde afuera, apretarlo no hacía absolutamente nada. Cualquier salida que
    // no sea el checkout tiene que decirle algo al instalador.
    const handleUpgrade = async (tier: SubscriptionTier) => {
        if (!isSupabaseConfigured || !FUNCTIONS_URL) return
        setUpgradeLoading(true)
        setUpgradeError('')
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
                return
            }

            setUpgradeError(data.error ?? 'No se pudo iniciar el pago. Probá de nuevo en un rato.')
        } catch {
            // Se cae la red o la función no responde: el usuario tiene que
            // enterarse igual.
            setUpgradeError('No se pudo contactar al servidor de pagos.')
        } finally {
            setUpgradeLoading(false)
        }
    }

    const switchMode = (m: AuthMode) => {
        setMode(m)
        clearError()
        setRegisterSuccess(false)
        setResetSent(false)
        setPassword('')
    }

    /** Guarda la contraseña nueva. Mismo handler para los dos casos. */
    const handleNuevaPassword = async (e: { preventDefault(): void }) => {
        e.preventDefault()
        clearError()
        setPasswordLoading(true)
        try {
            if (await updatePassword(nuevaPassword)) {
                setNuevaPassword('')
                setPasswordOk(true)
                if (recoveryMode) setRecoveryOk(true)
            }
        } finally {
            setPasswordLoading(false)
        }
    }

    // Va antes del chequeo de sesión a propósito: el enlace del mail ya deja al
    // usuario logueado, así que si esto fuera después caería en su cuenta y el
    // enlace no habría servido de nada.
    if (recoveryMode || recoveryOk) {
        return (
            <div className={styles.page}>
                <div className={styles.authContainer}>
                    <h1>Elegí una contraseña nueva</h1>

                    {recoveryOk ? (
                        <div className={styles.successBox}>
                            <p>Listo. Ya podés entrar con la contraseña nueva.</p>
                            <button
                                className={styles.linkButton}
                                onClick={() => { setRecoveryOk(false); setPasswordOk(false) }}
                            >
                                Ir a mi cuenta →
                            </button>
                        </div>
                    ) : (
                        <>
                            <p className={styles.authSubtitle}>
                                Es el último paso: escribila y quedás adentro.
                            </p>

                            {authError && <div className={styles.errorBox}>{authError}</div>}

                            <form onSubmit={handleNuevaPassword} className={styles.form}>
                                <div className={styles.formGroup}>
                                    <label htmlFor="nueva-password">Contraseña nueva</label>
                                    <div className={styles.passwordField}>
                                        <input
                                            id="nueva-password"
                                            type={showPassword ? 'text' : 'password'}
                                            value={nuevaPassword}
                                            onChange={e => setNuevaPassword(e.target.value)}
                                            placeholder="Al menos 6 caracteres"
                                            required
                                            minLength={6}
                                            autoComplete="new-password"
                                        />
                                        <button
                                            type="button"
                                            className={styles.togglePassword}
                                            onClick={() => setShowPassword(v => !v)}
                                            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                            aria-pressed={showPassword}
                                            tabIndex={-1}
                                        >
                                            {showPassword ? '🙈' : '👁️'}
                                        </button>
                                    </div>
                                </div>
                                <button type="submit" className={styles.submitButton} disabled={passwordLoading}>
                                    {passwordLoading ? 'Guardando...' : 'Guardar y entrar'}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        )
    }

    if (!isAuthenticated) {
        return (
            <div className={styles.page}>
                <div className={styles.authContainer}>
                    <h1>{TITULOS[mode]}</h1>
                    <p className={styles.authSubtitle}>{SUBTITULOS[mode]}</p>

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
                    ) : resetSent ? (
                        <div className={styles.successBox}>
                            <p>Si hay una cuenta con ese email, ya salió el enlace.</p>
                            <p className={styles.successHint}>
                                Abrilo en este mismo navegador. Vence en una hora, y si no
                                aparece, mirá en correo no deseado.
                            </p>
                            <button className={styles.linkButton} onClick={() => switchMode('login')}>
                                Volver al login →
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
                                {mode !== 'recuperar' && (
                                <div className={styles.formGroup}>
                                    <label htmlFor="password">Contraseña</label>
                                    <div className={styles.passwordField}>
                                        <input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            required
                                            minLength={6}
                                            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                                        />
                                        <button
                                            type="button"
                                            className={styles.togglePassword}
                                            onClick={() => setShowPassword(v => !v)}
                                            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                            aria-pressed={showPassword}
                                            tabIndex={-1}
                                        >
                                            {showPassword ? '🙈' : '👁️'}
                                        </button>
                                    </div>
                                </div>
                                )}

                                {mode === 'login' && (
                                    <button
                                        type="button"
                                        className={styles.linkButton}
                                        onClick={() => switchMode('recuperar')}
                                    >
                                        Olvidé mi contraseña
                                    </button>
                                )}

                                <button type="submit" className={styles.submitButton} disabled={isLoading}>
                                    {isLoading ? BOTONES_CARGANDO[mode] : BOTONES[mode]}
                                </button>
                            </form>

                            <p className={styles.switchMode}>
                                {mode === 'recuperar' ? (
                                    <>¿Te acordaste?{' '}
                                        <button className={styles.linkButton} onClick={() => switchMode('login')}>
                                            Volver al login
                                        </button>
                                    </>
                                ) : mode === 'login' ? (
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

            {/* Qué sabe Martín — primera etapa de la memoria del asistente.
                Va acá arriba a propósito: si queda al final, detrás de los
                planes, no la encuentra nadie. */}
            <section className={styles.section}>
                <h2>Qué sabe Martín de vos</h2>
                <FichaInstalador />
            </section>

            {/* Seguridad — cambiar la contraseña ya estando adentro */}
            <section className={styles.section}>
                <h2>Seguridad</h2>

                {passwordOk && (
                    <div className={styles.successBox}>
                        <p>Contraseña actualizada.</p>
                    </div>
                )}

                {authError && <div className={styles.errorBox}>{authError}</div>}

                <form onSubmit={handleNuevaPassword} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label htmlFor="cambiar-password">Contraseña nueva</label>
                        <div className={styles.passwordField}>
                            <input
                                id="cambiar-password"
                                type={showPassword ? 'text' : 'password'}
                                value={nuevaPassword}
                                onChange={e => { setNuevaPassword(e.target.value); setPasswordOk(false) }}
                                placeholder="Al menos 6 caracteres"
                                required
                                minLength={6}
                                autoComplete="new-password"
                            />
                            <button
                                type="button"
                                className={styles.togglePassword}
                                onClick={() => setShowPassword(v => !v)}
                                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                aria-pressed={showPassword}
                                tabIndex={-1}
                            >
                                {showPassword ? '🙈' : '👁️'}
                            </button>
                        </div>
                    </div>
                    <button type="submit" className={styles.submitButton} disabled={passwordLoading}>
                        {passwordLoading ? 'Guardando...' : 'Cambiar contraseña'}
                    </button>
                </form>
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
                                        {upgradeLoading ? 'Abriendo el pago…' : `Actualizar a ${tier.name}`}
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

                {upgradeError && (
                    <p className={styles.errorBox} style={{ marginTop: '1rem' }} role="alert">
                        {upgradeError}
                    </p>
                )}

                {!isSupabaseConfigured && (
                    <p className={styles.demoNote} style={{ marginTop: '1rem' }}>
                        Demo: los pagos se activarán cuando Supabase y MercadoPago estén configurados.
                    </p>
                )}
            </section>
        </div>
    )
}
