import { Link } from 'react-router-dom'
import { usePageMeta } from '../../lib/usePageMeta'
import { Icon } from '../../components/ui/Icon/Icon'
import { Novedades } from '../../components/Novedades/Novedades'
import { useAsistenteUI } from '../../stores/useAsistenteUI'
import styles from './Home.module.css'

/**
 * Preguntas de muestra del asistente.
 *
 * Las tres son consultas que un instalador hace de verdad y están cubiertas por
 * los casos indexados en el RAG, así que la respuesta sale con fundamento y no
 * con generalidades. La primera es a propósito la que discute el error más
 * repetido de la obra: elegir la caldera por metro cuadrado.
 */
const PREGUNTAS_DE_MUESTRA = [
    '¿Por qué no se elige la caldera por metros cuadrados?',
    'La presión sube sola cuando la caldera calienta. ¿Qué reviso primero?',
    '¿Radiadores o piso radiante en un ambiente con techo alto?',
]

/** Tiene que coincidir con ANON_CONFIG de la Edge Function asistente-termico. */
const CONSULTAS_SIN_CUENTA = 3

export function Home() {
    const abrirCon = useAsistenteUI(s => s.abrirCon)

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
                        La caldera no se elige por metros cuadrados. Se calcula.
                    </p>
                    <p className={styles.heroDescription}>
                        Acá están las cuentas que definen una instalación de calefacción por
                        radiadores —potencia, caudal, diámetros, bomba— y el criterio de obra que
                        explica por qué cada una da lo que da.
                    </p>
                    <div className={styles.heroCTA}>
                        <Link to="/herramientas/potencia" className={styles.primaryButton}>
                            Calculá la potencia
                        </Link>
                        <Link to="/manual" className={styles.secondaryButton}>
                            Ver el manual
                        </Link>
                    </div>
                    <p className={styles.heroNota}>
                        Plataforma independiente, sin marcas. La primera calculadora es gratis y no
                        pide cuenta.
                    </p>
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
                            Casos reales de obra documentados: problema, causa y solución.
                        </p>
                        <span className={styles.featureLink}>Explorar →</span>
                    </Link>
                </div>
            </section>

            {/* Asistente — se prueba sin cuenta, con una sesión anónima de cupo bajo */}
            <section className={styles.asistente}>
                <div className={styles.asistenteTexto}>
                    <span className={styles.asistenteEtiqueta}>Asistente técnico</span>
                    <h2 className={styles.asistenteTitulo}>
                        Preguntale lo que le preguntarías a un colega
                    </h2>
                    <p className={styles.asistenteBajada}>
                        Criterio responde con el criterio de obra de esta plataforma: los casos
                        documentados, las fórmulas de las calculadoras y el manual. No es un
                        buscador ni un chatbot general — contesta como se contesta parado en la
                        obra, y cuando algo es de otro oficio, lo dice.
                    </p>
                    <p className={styles.asistenteNota}>
                        Probalo sin cuenta. Tenés {CONSULTAS_SIN_CUENTA} consultas de prueba.
                    </p>
                </div>

                <div className={styles.asistentePreguntas}>
                    {PREGUNTAS_DE_MUESTRA.map(pregunta => (
                        <button
                            key={pregunta}
                            type="button"
                            className={styles.preguntaBoton}
                            onClick={() => abrirCon(pregunta)}
                        >
                            <span className={styles.preguntaTexto}>{pregunta}</span>
                            <span className={styles.preguntaFlecha} aria-hidden="true">→</span>
                        </button>
                    ))}
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
