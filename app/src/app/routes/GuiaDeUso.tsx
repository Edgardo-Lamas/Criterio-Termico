import { Link } from 'react-router-dom'
import { usePageMeta } from '../../lib/usePageMeta'
import { Icon } from '../../components/ui/Icon/Icon'
import styles from './GuiaDeUso.module.css'

// Paso del flujo de la obra: mismo orden 1-4 que encadenan los ToolIntro
// de las calculadoras, con el Simulador como cierre.
const PASOS = [
    {
        n: 1,
        id: 'potencia',
        nombre: 'Calculadora de Potencia',
        pregunta: '¿Cuánto calor necesita cada ambiente?',
        detalle: 'Cargás medidas, aislación y ventanas. Te da la carga térmica por ambiente y la caldera recomendada.',
    },
    {
        n: 2,
        id: 'caudal',
        nombre: 'Calculadora de Caudal',
        pregunta: '¿Cuánta agua por hora mueve esa potencia?',
        detalle: 'Con la potencia definida, sale el caudal que tiene que circular por cada tramo.',
    },
    {
        n: 3,
        id: 'diametro',
        nombre: 'Calculadora de Diámetros',
        pregunta: '¿Qué medida de caño lleva ese caudal?',
        detalle: 'El diámetro justo para que el agua corra sin ruido y sin perder carga de más.',
    },
    {
        n: 4,
        id: 'bombas',
        nombre: 'Calculadora de Bombas',
        pregunta: '¿Qué bomba mueve todo el sistema?',
        detalle: 'Caudal total y altura manométrica: la bomba y la presurizadora que van, verificadas.',
    },
]

const CAPACIDADES = [
    {
        icon: 'wrench' as const,
        titulo: 'Calculadoras de ingeniería',
        texto: 'Cinco herramientas de cálculo real: potencia, caudal, diámetros, bombas y piso radiante. Resultados con margen de seguridad, pensados para decidir en obra.',
    },
    {
        icon: 'monitor' as const,
        titulo: 'Simulador 2D',
        texto: 'Subís el plano, dibujás ambientes, radiadores o piso radiante y caldera. Sale la planilla de radiadores, el metraje de tuberías y el presupuesto en PDF listo para el cliente. Exporta a BIM.',
    },
    {
        icon: 'flame' as const,
        titulo: 'Criterio, el asistente técnico',
        texto: 'Un especialista en calefacción disponible en toda la plataforma. Consultale cálculos, diagnóstico de fallas —ruidos, zonas frías, presión que cae—, criterios de instalación y puesta en marcha. Responde con el manual y los casos de obra documentados como respaldo, y si estás en el Simulador también revisa tu proyecto con vos.',
    },
    {
        icon: 'book' as const,
        titulo: 'Manual técnico',
        texto: 'Catorce capítulos que van del cálculo a la puesta en marcha, escritos en lenguaje de obra.',
    },
    {
        icon: 'alert' as const,
        titulo: 'Errores frecuentes',
        texto: 'Más de 200 casos reales documentados con problema, causa y solución. Lo que salió mal en otras obras, para que no salga mal en la tuya.',
    },
]

export function GuiaDeUso() {
    usePageMeta({
        title: 'Guía de uso',
        description: 'Cómo se trabaja con Criterio Térmico: el flujo de cálculo de una instalación paso a paso, y todo lo que tenés disponible en la plataforma.',
    })

    return (
        <div className={styles.guia}>
            {/* Encabezado */}
            <header className={styles.hero}>
                <h1 className={styles.titulo}>Guía de uso</h1>
                <p className={styles.subtitulo}>
                    Criterio Térmico sigue el mismo orden que una obra: primero cuánto calor,
                    después cómo moverlo. Cada herramienta responde una pregunta concreta y
                    te deja en la puerta de la siguiente.
                </p>
            </header>

            {/* El flujo de la obra */}
            <section className={styles.seccion} aria-labelledby="flujo">
                <h2 id="flujo" className={styles.seccionTitulo}>El flujo de cálculo, paso a paso</h2>
                <ol className={styles.pasos}>
                    {PASOS.map(paso => (
                        <li key={paso.id} className={styles.paso}>
                            <span className={styles.pasoNumero} aria-hidden="true">{paso.n}</span>
                            <div className={styles.pasoCuerpo}>
                                <Link to={`/herramientas/${paso.id}`} className={styles.pasoNombre}>
                                    {paso.nombre}
                                </Link>
                                <p className={styles.pasoPregunta}>{paso.pregunta}</p>
                                <p className={styles.pasoDetalle}>{paso.detalle}</p>
                            </div>
                        </li>
                    ))}
                </ol>
                <div className={styles.cierre}>
                    <div className={styles.cierreIcono} aria-hidden="true">
                        <Icon name="monitor" size={28} />
                    </div>
                    <div>
                        <Link to="/herramientas/simulador" className={styles.pasoNombre}>
                            El cierre: Simulador 2D
                        </Link>
                        <p className={styles.pasoDetalle}>
                            Todo el flujo junto, sobre el plano real: dibujás la instalación y salen
                            los cálculos, la planilla y el presupuesto en PDF. Es la herramienta
                            Premium de la plataforma, en desktop.
                        </p>
                    </div>
                </div>
                <p className={styles.nota}>
                    ¿Piso radiante en vez de radiadores? La{' '}
                    <Link to="/herramientas/piso-radiante" className={styles.linkInline}>
                        Calculadora de Piso Radiante
                    </Link>{' '}
                    hace el paso del emisor, y el Simulador también lo dibuja y presupuesta.
                </p>
            </section>

            {/* Capacidades */}
            <section className={styles.seccion} aria-labelledby="capacidades">
                <h2 id="capacidades" className={styles.seccionTitulo}>Qué tenés en la plataforma</h2>
                <div className={styles.cards}>
                    {CAPACIDADES.map(cap => (
                        <article key={cap.titulo} className={styles.card}>
                            <div className={styles.cardIcono} aria-hidden="true">
                                <Icon name={cap.icon} size={24} />
                            </div>
                            <h3 className={styles.cardTitulo}>{cap.titulo}</h3>
                            <p className={styles.cardTexto}>{cap.texto}</p>
                        </article>
                    ))}
                </div>
            </section>

            {/* Por dónde empezar */}
            <section className={styles.seccion} aria-labelledby="empezar">
                <h2 id="empezar" className={styles.seccionTitulo}>¿Por dónde empiezo?</h2>
                <ul className={styles.empezar}>
                    <li className={styles.empezarItem}>
                        <strong>¿Tenés una obra para cotizar?</strong> Arrancá por la{' '}
                        <Link to="/herramientas/potencia" className={styles.linkInline}>Calculadora de Potencia</Link>{' '}
                        y seguí el flujo en orden.
                    </li>
                    <li className={styles.empezarItem}>
                        <strong>¿Tenés el plano a mano?</strong> Abrí el{' '}
                        <Link to="/herramientas/simulador" className={styles.linkInline}>Simulador 2D</Link>{' '}
                        y dibujá la instalación directo.
                    </li>
                    <li className={styles.empezarItem}>
                        <strong>¿Un problema en una instalación que ya funciona?</strong> Contale los
                        síntomas a Criterio —el botón flotante con la llama— o buscá el caso en{' '}
                        <Link to="/errores" className={styles.linkInline}>Errores Frecuentes</Link>.
                    </li>
                </ul>
            </section>
        </div>
    )
}
