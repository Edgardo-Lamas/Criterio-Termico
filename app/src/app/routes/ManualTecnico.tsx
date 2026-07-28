import { useParams, Link } from 'react-router-dom'
import { usePageMeta } from '../../lib/usePageMeta'
import { Icon } from '../../components/ui/Icon/Icon'
import { getCapituloContent } from '../../content/manual'
import styles from './ManualTecnico.module.css'

// Tipos de acceso por capítulo
type AccesoTipo = 'free' | 'pro' | 'premium'

interface Capitulo {
    id: string
    numero: number
    titulo: string
    descripcion: string
    acceso: AccesoTipo
    disponible: boolean
    // Capítulos cuyo contenido vive en una página propia fuera del manual
    // (ej: los casos de errores, que tienen su propia vista con índice temático).
    ruta?: string
}

interface Parte {
    titulo: string
    capitulos: Capitulo[]
}

// Índice v1.0 del Manual de Calefacción por Radiadores
const partes: Parte[] = [
    {
        titulo: 'Parte I – El Proyecto y el Criterio Profesional',
        capitulos: [
            {
                id: 'relevamiento',
                numero: 1,
                titulo: 'El relevamiento técnico de la vivienda',
                descripcion: 'Qué medir, qué observar y qué errores detectar antes de presupuestar.',
                acceso: 'free',
                disponible: true
            },
            {
                id: 'confort',
                numero: 2,
                titulo: 'Estrategia de confort térmico',
                descripcion: 'Por qué calefacción central por radiadores. Confort, inercia térmica y distribución homogénea.',
                acceso: 'free',
                disponible: true
            },
            {
                id: 'perdidas',
                numero: 3,
                titulo: 'Análisis de pérdidas térmicas reales',
                descripcion: 'Aislamiento, orientación, aberturas, infiltraciones y errores de lectura habituales.',
                acceso: 'pro',
                disponible: true
            }
        ]
    },
    {
        titulo: 'Parte II – Cálculo y Dimensionamiento',
        capitulos: [
            {
                id: 'potencia',
                numero: 4,
                titulo: 'Cálculo de potencia térmica por ambiente',
                descripcion: 'Criterio práctico en kcal/h – factores reales vs fórmulas de folleto.',
                acceso: 'pro',
                disponible: true
            },
            {
                id: 'radiadores',
                numero: 5,
                titulo: 'Selección y dimensionamiento de radiadores',
                descripcion: 'Potencia útil, alturas, cantidad de elementos y errores frecuentes en obra.',
                acceso: 'premium',
                disponible: true
            },
            {
                id: 'hidraulico',
                numero: 6,
                titulo: 'Diseño del sistema hidráulico',
                descripcion: 'Predominio del sistema bitubo. Criterios comparativos con otros esquemas.',
                acceso: 'premium',
                disponible: false
            }
        ]
    },
    {
        titulo: 'Parte III – Materiales y Sistemas de Tuberías',
        capitulos: [
            {
                id: 'tuberias-seleccion',
                numero: 7,
                titulo: 'Selección del sistema de tuberías',
                descripcion: 'Termofusión con barrera antioxígeno vs PEX. Ventajas, limitaciones y criterios.',
                acceso: 'pro',
                disponible: false
            },
            {
                id: 'tuberias-dimension',
                numero: 8,
                titulo: 'Dimensionamiento de tuberías',
                descripcion: 'Diámetros, caudales, velocidades y lectura correcta del circuito.',
                acceso: 'premium',
                disponible: false
            },
            {
                id: 'dilatacion',
                numero: 9,
                titulo: 'Dilatación térmica y fijaciones',
                descripcion: 'Puntos fijos, liras, compensaciones y prevención de ruidos y fallas.',
                acceso: 'premium',
                disponible: false
            }
        ]
    },
    {
        titulo: 'Parte IV – Montaje, Regulación y Puesta en Marcha',
        capitulos: [
            {
                id: 'posicionamiento',
                numero: 10,
                titulo: 'Posicionamiento correcto de emisores',
                descripcion: 'Criterio técnico del "bajo ventana" y consecuencias de una mala ubicación.',
                acceso: 'free',
                disponible: false
            },
            {
                id: 'valvulas',
                numero: 11,
                titulo: 'Válvulas, detentores y accesorios',
                descripcion: 'Selección correcta y rol crítico en el equilibrado del sistema.',
                acceso: 'premium',
                disponible: false
            },
            {
                id: 'puesta-marcha',
                numero: 12,
                titulo: 'Pruebas hidráulicas y puesta en marcha',
                descripcion: 'Protocolos reales de obra antes del cierre y entrega al cliente.',
                acceso: 'premium',
                disponible: false
            }
        ]
    },
    {
        titulo: 'Parte V – Diagnóstico y Mejora Continua',
        capitulos: [
            {
                id: 'errores',
                numero: 13,
                titulo: 'Errores frecuentes en instalaciones reales',
                descripcion: 'Problema → causa → solución. Casos típicos de obra y cómo corregirlos.',
                acceso: 'pro',
                disponible: true,
                ruta: '/errores'
            },
            {
                id: 'comunidad',
                numero: 14,
                titulo: 'Experiencias reales y aportes de la comunidad',
                descripcion: 'Casos reales de usuarios, soluciones prácticas y aprendizajes de obra.',
                acceso: 'free',
                disponible: false
            }
        ]
    }
]

// Helper para obtener todos los capítulos planos
const todosLosCapitulos = partes.flatMap(p => p.capitulos)

// A dónde lleva un capítulo: su página propia si la tiene, o la vista del manual.
function hrefCapitulo(cap: Capitulo): string {
    return cap.ruta ?? `/manual/${cap.id}`
}

// Componente de badge de acceso
function AccesoBadge({ acceso }: { acceso: AccesoTipo }) {
    if (acceso === 'free') return null

    return (
        <span className={`${styles.accesoBadge} ${styles[`acceso${acceso.charAt(0).toUpperCase() + acceso.slice(1)}`]}`}>
            {acceso === 'pro' ? 'PRO' : 'Premium'}
        </span>
    )
}

export function ManualTecnico() {
    const { capitulo } = useParams()

    usePageMeta({
        title: 'Manual Técnico de Calefacción por Radiadores',
        description: 'Base técnica viva para diseñar, calcular e instalar sistemas de calefacción por radiadores. 14 capítulos con criterio profesional.'
    })

    // Si hay un capítulo específico
    if (capitulo) {
        const cap = todosLosCapitulos.find(c => c.id === capitulo)

        if (!cap) {
            return (
                <div className={styles.notFound}>
                    <h2>Capítulo no encontrado</h2>
                    <Link to="/manual">← Volver al Manual</Link>
                </div>
            )
        }

        return (
            <div className={styles.page}>
                <div className={styles.header}>
                    <Link to="/manual" className={styles.backLink}>← Manual Técnico</Link>
                    <span className={styles.chapterNum}>Capítulo {cap.numero}</span>
                    <h1>{cap.titulo}</h1>
                    <AccesoBadge acceso={cap.acceso} />
                </div>

                <article className={styles.content}>
                    {(() => {
                        // getCapituloContent devuelve una referencia estática del registro
                        // en content/manual/index.ts (mismo componente para el mismo id),
                        // no un componente nuevo en cada render — falso positivo de la regla.
                        const Contenido = getCapituloContent(cap.id)
                        return Contenido
                            // eslint-disable-next-line react-hooks/static-components
                            ? <Contenido />
                            : (
                                <div className={styles.placeholder}>
                                    <p>📝 Contenido en desarrollo</p>
                                    <p className={styles.placeholderSub}>
                                        Este capítulo estará disponible próximamente.
                                    </p>
                                </div>
                            )
                    })()}
                </article>

                {/* Navegación entre capítulos */}
                <nav className={styles.chapterNav}>
                    {cap.numero > 1 && (
                        <Link
                            to={hrefCapitulo(todosLosCapitulos[cap.numero - 2])}
                            className={styles.navPrev}
                        >
                            ← Capítulo {cap.numero - 1}
                        </Link>
                    )}
                    {cap.numero < todosLosCapitulos.length && (
                        <Link
                            to={hrefCapitulo(todosLosCapitulos[cap.numero])}
                            className={styles.navNext}
                        >
                            Capítulo {cap.numero + 1} →
                        </Link>
                    )}
                </nav>
            </div>
        )
    }

    // Índice del manual organizado por partes
    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <h1><Icon name="book" size={28} className={styles.titleIcon} /> Manual Técnico</h1>
                <div className={styles.prologo}>
                    <p className={styles.lead}>
                        Acá está reunido el criterio con el que se diseña, se calcula y se instala
                        una calefacción por radiadores que después funciona. No es teoría de folleto:
                        es lo que se decide en la obra, con las razones detrás de cada decisión.
                    </p>
                    <p>
                        El manual está ordenado como se ordena un trabajo, de punta a punta. Primero
                        se releva la vivienda y se define la estrategia de confort <em>(Parte I)</em>.
                        Después se calcula la potencia y se dimensionan los emisores <em>(Parte II)</em>.
                        Sigue la elección del sistema de tuberías y los materiales <em>(Parte III)</em>,
                        el montaje, la regulación y la puesta en marcha <em>(Parte IV)</em>, y al final
                        el diagnóstico de lo que no anda y cómo corregirlo <em>(Parte V)</em>. Leídos
                        en orden, los 14 capítulos son un proyecto completo.
                    </p>
                    <p>
                        Tampoco hace falta leerlo de corrido. Cada capítulo se sostiene solo, así que
                        podés entrar directo por el tema que tenés arriba de la mesa —el radiador que
                        no calienta, el diámetro que no cierra, la presión que se va— y volver después
                        por el resto.
                    </p>
                    <p>
                        Este no es un curso cerrado. El manual crece con lo que aparece en obra: la
                        experiencia que un instalador documenta se estudia y, cuando suma, entra con
                        el reconocimiento de quien la trajo. El objetivo de fondo es ese: que el
                        oficio se ayude, y que lo que a uno le costó resolver no haya que volver a
                        pagarlo cada vez.
                    </p>
                    <p className={styles.arranque}>
                        Algunos capítulos todavía están en desarrollo y aparecen marcados como
                        <strong> Próximamente</strong>. El resto ya se puede leer, y un buen punto
                        de partida es el <Link to="/manual/relevamiento">Capítulo 1 — El
                        relevamiento técnico de la vivienda</Link>.
                    </p>
                </div>
                <div className={styles.versionBadge}>
                    <span>Índice v1.0</span>
                    <span className={styles.versionNote}>14 capítulos · 5 partes</span>
                </div>
            </div>

            {/* Leyenda de acceso */}
            <div className={styles.leyenda}>
                <span className={styles.leyendaItem}>
                    <span className={styles.dotFree}></span> Gratuito
                </span>
                <span className={styles.leyendaItem}>
                    <span className={styles.dotPro}></span> PRO
                </span>
                <span className={styles.leyendaItem}>
                    <span className={styles.dotPremium}></span> Premium
                </span>
            </div>

            {/* Índice por partes */}
            {partes.map((parte, parteIndex) => (
                <section key={parteIndex} className={styles.parteSection}>
                    <h2 className={styles.parteTitulo}>{parte.titulo}</h2>
                    <div className={styles.chapterList}>
                        {parte.capitulos.map(cap => (
                            <Link
                                key={cap.id}
                                to={cap.disponible ? hrefCapitulo(cap) : '#'}
                                className={`${styles.chapterCard} ${!cap.disponible ? styles.chapterLocked : ''}`}
                                onClick={e => !cap.disponible && e.preventDefault()}
                            >
                                <span className={`${styles.chapterNumber} ${styles[`num${cap.acceso.charAt(0).toUpperCase() + cap.acceso.slice(1)}`]}`}>
                                    {cap.numero}
                                </span>
                                <div className={styles.chapterInfo}>
                                    <h3 className={styles.chapterTitle}>{cap.titulo}</h3>
                                    <p className={styles.chapterDescription}>{cap.descripcion}</p>
                                </div>
                                <div className={styles.chapterMeta}>
                                    <AccesoBadge acceso={cap.acceso} />
                                    {!cap.disponible && (
                                        <span className={styles.comingSoon}>Próximamente</span>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            ))}
        </div>
    )
}
