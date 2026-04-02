import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { usePageMeta } from '../../lib/usePageMeta'
import { ContribucionForm } from '../../components/contributions/ContribucionForm/ContribucionForm'
import { getCapituloContent } from '../../content/manual'
import type { TipoContribucion } from '../../stores/useContribucionesStore'
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
                disponible: true
            },
            {
                id: 'comunidad',
                numero: 14,
                titulo: 'Experiencias reales y aportes de la comunidad',
                descripcion: 'Casos reales de usuarios, soluciones prácticas y aprendizajes de obra.',
                acceso: 'free',
                disponible: true
            }
        ]
    }
]

// Helper para obtener todos los capítulos planos
const todosLosCapitulos = partes.flatMap(p => p.capitulos)

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
                        const Contenido = getCapituloContent(cap.id)
                        return Contenido
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
                            to={`/manual/${todosLosCapitulos[cap.numero - 2].id}`}
                            className={styles.navPrev}
                        >
                            ← Capítulo {cap.numero - 1}
                        </Link>
                    )}
                    {cap.numero < todosLosCapitulos.length && (
                        <Link
                            to={`/manual/${todosLosCapitulos[cap.numero].id}`}
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
                <h1>📖 Manual Técnico</h1>
                <p className={styles.description}>
                    <strong>Base técnica viva</strong> para diseñar, calcular e instalar sistemas de calefacción por radiadores.
                    No es un curso cerrado — es criterio profesional que crece con experiencia real de obra.
                </p>
                <div className={styles.versionBadge}>
                    <span>📋 Índice v1.0</span>
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
                                to={cap.disponible ? `/manual/${cap.id}` : '#'}
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

            {/* Sección de Contribuciones */}
            <ContributeSection />
        </div>
    )
}

// Componente separado para la sección de contribuciones (maneja su propio estado del modal)
function ContributeSection() {
    const [modalOpen, setModalOpen] = useState(false)
    const [tipoInicial, setTipoInicial] = useState<TipoContribucion | undefined>(undefined)

    const abrirModal = (tipo: TipoContribucion) => {
        setTipoInicial(tipo)
        setModalOpen(true)
    }

    return (
        <>
            <section className={styles.contributeSection}>
                <h2>🤝 Contribuye al Manual</h2>
                <p>
                    Este manual crece con la comunidad. Si tenés experiencia en obra,
                    podés proponer mejoras, correcciones o casos de uso.
                </p>
                <div className={styles.contributeOptions}>
                    <button
                        className={styles.contributeCard}
                        onClick={() => abrirModal('mejora')}
                    >
                        <span className={styles.contributeIcon}>💡</span>
                        <h4>Sugerir Mejora</h4>
                        <p>Proponé una corrección o ampliación de contenido existente.</p>
                        <span className={styles.contributeCredits}>+50 créditos</span>
                    </button>
                    <button
                        className={styles.contributeCard}
                        onClick={() => abrirModal('caso-obra')}
                    >
                        <span className={styles.contributeIcon}>🔧</span>
                        <h4>Caso de Obra</h4>
                        <p>Compartí una situación real que enfrentaste y cómo la resolviste.</p>
                        <span className={styles.contributeCredits}>+100 créditos</span>
                    </button>
                    <button
                        className={styles.contributeCard}
                        onClick={() => abrirModal('error')}
                    >
                        <span className={styles.contributeIcon}>⚠️</span>
                        <h4>Reportar Error</h4>
                        <p>Señalá errores técnicos o información desactualizada.</p>
                        <span className={styles.contributeCredits}>+25 créditos</span>
                    </button>
                </div>
                <p className={styles.contributeNote}>
                    Los aportes son revisados por el equipo técnico antes de publicarse.
                    Los contribuidores validados reciben <strong>descuentos en su suscripción</strong>.
                </p>
            </section>

            <ContribucionForm
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                tipoInicial={tipoInicial}
            />
        </>
    )
}
