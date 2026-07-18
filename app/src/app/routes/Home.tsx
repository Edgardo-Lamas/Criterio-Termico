import { Link } from 'react-router-dom'
import { usePageMeta } from '../../lib/usePageMeta'
import { Icon } from '../../components/ui/Icon/Icon'
import { Novedades } from '../../components/Novedades/Novedades'
import styles from './Home.module.css'

export function Home() {
    usePageMeta({
        title: 'Plataforma Técnica para Instaladores de Calefacción',
        description: 'Plataforma técnica independiente para instaladores de calefacción por radiadores. Herramientas de cálculo, manual técnico y errores frecuentes de obra.'
    })

    return (
        <div className={styles.home}>
            {/* JSON-LD Schema Markup */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "WebSite",
                        "name": "Criterio Térmico",
                        "url": "https://criterio-termico.vercel.app/",
                        "description": "Plataforma técnica independiente para instaladores de calefacción por radiadores",
                        "inLanguage": "es",
                        "publisher": {
                            "@type": "Organization",
                            "name": "Criterio Térmico",
                            "url": "https://criterio-termico.vercel.app/"
                        }
                    })
                }}
            />
            {/* Hero Section */}
            <section className={styles.hero}>
                <div className={styles.heroContent}>
                    <h1 className={styles.heroTitle}>
                        <img
                            src="/logo-emblema.png"
                            alt=""
                            width={96}
                            height={96}
                            className={styles.heroLogo}
                        />
                        Criterio Térmico
                    </h1>
                    <p className={styles.heroSubtitle}>
                        Plataforma técnica independiente para instaladores de calefacción por radiadores
                    </p>
                    <p className={styles.heroDescription}>
                        Combina <strong>criterio técnico aplicado</strong>, <strong>herramientas de cálculo reales</strong>{' '}
                        y <strong>experiencia de obra documentada</strong>.
                    </p>
                    <div className={styles.heroCTA}>
                        <Link to="/herramientas" className={styles.primaryButton}>
                            Explorar herramientas
                        </Link>
                        <Link to="/manual" className={styles.secondaryButton}>
                            Ver el manual
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className={styles.features}>
                <h2 className="sr-only">Escuela del Instalador</h2>
                <div className={styles.featuresGrid}>
                    {/* Herramientas */}
                    <Link to="/herramientas" className={styles.featureCard}>
                        <div className={styles.featureIcon}><Icon name="wrench" size={36} /></div>
                        <h3 className={styles.featureTitle}>Herramientas del Instalador</h3>
                        <p className={styles.featureDescription}>
                            Calculadoras de potencia, diámetros, caudales. Simulador 2D para diseño de instalaciones.
                        </p>
                        <span className={styles.featureLink}>Acceder →</span>
                    </Link>

                    {/* Manual */}
                    <Link to="/manual" className={styles.featureCard}>
                        <div className={styles.featureIcon}><Icon name="book" size={36} /></div>
                        <h3 className={styles.featureTitle}>Manual Técnico</h3>
                        <p className={styles.featureDescription}>
                            Criterios técnicos claros y prácticos. No es un curso académico, es una guía de decisiones.
                        </p>
                        <span className={styles.featureLink}>Leer →</span>
                    </Link>

                    {/* Errores */}
                    <Link to="/errores" className={styles.featureCard}>
                        <div className={styles.featureIcon}><Icon name="alert" size={36} /></div>
                        <h3 className={styles.featureTitle}>Errores Frecuentes</h3>
                        <p className={styles.featureDescription}>
                            Casos reales documentados: problema, causa y solución. Experiencia de +200 obras.
                        </p>
                        <span className={styles.featureLink}>Explorar →</span>
                    </Link>
                </div>
            </section>

            {/* Novedades — contenido administrable desde Supabase */}
            <Novedades />

            {/* Differentiator Section */}
            <section className={styles.differentiator}>
                <h2 className={styles.sectionTitle}>¿Por qué Criterio Térmico?</h2>
                <div className={styles.differentiatorGrid}>
                    <div className={styles.diffItem}>
                        <span className={styles.diffIcon}><Icon name="hard-hat" size={30} /></span>
                        <h3>Desde el oficio</h3>
                        <p>Nace de la experiencia real de obra, no de la academia ni del marketing.</p>
                    </div>
                    <div className={styles.diffItem}>
                        <span className={styles.diffIcon}><Icon name="ban" size={30} /></span>
                        <h3>Sin marcas</h3>
                        <p>Independiente de fabricantes. Valoramos el criterio por sobre la marca.</p>
                    </div>
                    <div className={styles.diffItem}>
                        <span className={styles.diffIcon}><Icon name="zap" size={30} /></span>
                        <h3>Decisiones rápidas</h3>
                        <p>Herramientas que resuelven problemas reales, cuando los necesitás.</p>
                    </div>
                    <div className={styles.diffItem}>
                        <span className={styles.diffIcon}><Icon name="smartphone" size={30} /></span>
                        <h3>Donde estés</h3>
                        <p>Accesible desde cualquier dispositivo. Instalable como aplicación.</p>
                    </div>
                </div>
            </section>
        </div>
    )
}
