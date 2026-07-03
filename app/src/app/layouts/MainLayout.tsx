import { Outlet, NavLink } from 'react-router-dom'
import { useAuthStore } from '../../stores/useAuthStore'
import styles from './MainLayout.module.css'

export function MainLayout() {
    const { isAuthenticated, user } = useAuthStore()

    return (
        <div className={styles.layout}>
            {/* Header */}
            <header className={styles.header}>
                <div className={styles.headerContent}>
                    <NavLink to="/" className={styles.logo}>
                        <span className={styles.logoIcon}>🔥</span>
                        <span className={styles.logoText}>Criterio Térmico</span>
                    </NavLink>

                    <nav className={styles.nav}>
                        <NavLink
                            to="/herramientas"
                            className={({ isActive }) => isActive ? styles.navLinkActive : styles.navLink}
                        >
                            🔧 Herramientas
                        </NavLink>
                        <NavLink
                            to="/manual"
                            className={({ isActive }) => isActive ? styles.navLinkActive : styles.navLink}
                        >
                            📖 Manual
                        </NavLink>
                        <NavLink
                            to="/errores"
                            className={({ isActive }) => isActive ? styles.navLinkActive : styles.navLink}
                        >
                            ⚠️ Errores
                        </NavLink>
                    </nav>

                    <div className={styles.userArea}>
                        {isAuthenticated ? (
                            <NavLink to="/cuenta" className={styles.userButton}>
                                <span className={styles.userAvatar}>
                                    {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                                </span>
                            </NavLink>
                        ) : (
                            <NavLink to="/cuenta" className={styles.loginButton}>
                                Ingresar
                            </NavLink>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className={styles.main}>
                <Outlet />
            </main>

            {/* Footer */}
            <footer className={styles.footer}>
                <div className={styles.footerContent}>
                    <p>© {new Date().getFullYear()} Criterio Térmico — Plataforma técnica independiente</p>
                    <p className={styles.footerMuted}>
                        No afiliada a ningún fabricante. Contenido basado en experiencia real de obra.
                    </p>
                    <div className={styles.footerLinks}>
                        <NavLink to="/terminos" className={styles.footerLink}>
                            Términos de Uso
                        </NavLink>
                        <NavLink to="/privacidad" className={styles.footerLink}>
                            Política de Privacidad
                        </NavLink>
                    </div>
                </div>
            </footer>
        </div>
    )
}
