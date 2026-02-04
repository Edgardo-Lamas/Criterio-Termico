import { useParams, Link } from 'react-router-dom'
import styles from './ManualTecnico.module.css'

// Placeholder de capítulos del manual
const capitulos = [
    {
        id: 'introduccion',
        numero: 1,
        titulo: 'Introducción a la Calefacción por Radiadores',
        descripcion: 'Principios básicos, tipos de sistemas y criterios de selección.',
        disponible: true
    },
    {
        id: 'radiadores',
        numero: 2,
        titulo: 'Radiadores',
        descripcion: 'Tipos, dimensionamiento, ubicación y selección de radiadores.',
        disponible: true
    },
    {
        id: 'tuberias',
        numero: 3,
        titulo: 'Tuberías y Accesorios',
        descripcion: 'Materiales, diámetros, tendidos y pérdidas de carga.',
        disponible: true
    },
    {
        id: 'calderas',
        numero: 4,
        titulo: 'Calderas',
        descripcion: 'Tipos, dimensionamiento, instalación y mantenimiento.',
        disponible: false
    },
    {
        id: 'bombas',
        numero: 5,
        titulo: 'Bombas Circuladoras',
        descripcion: 'Selección, instalación y ajuste de bombas.',
        disponible: false
    },
    {
        id: 'balanceo',
        numero: 6,
        titulo: 'Balanceo Hidráulico',
        descripcion: 'Diagnóstico y corrección de desbalances.',
        disponible: false
    }
]

export function ManualTecnico() {
    const { capitulo } = useParams()

    // Si hay un capítulo específico
    if (capitulo) {
        const cap = capitulos.find(c => c.id === capitulo)

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
                </div>

                <article className={styles.content}>
                    {/* Placeholder de contenido */}
                    <div className={styles.placeholder}>
                        <p>📝 Contenido en desarrollo</p>
                        <p className={styles.placeholderSub}>
                            El contenido de este capítulo se cargará aquí utilizando MDX
                            para una integración perfecta entre texto y herramientas interactivas.
                        </p>
                    </div>
                </article>

                {/* Navegación entre capítulos */}
                <nav className={styles.chapterNav}>
                    {cap.numero > 1 && (
                        <Link
                            to={`/manual/${capitulos[cap.numero - 2].id}`}
                            className={styles.navPrev}
                        >
                            ← Capítulo {cap.numero - 1}
                        </Link>
                    )}
                    {cap.numero < capitulos.length && (
                        <Link
                            to={`/manual/${capitulos[cap.numero].id}`}
                            className={styles.navNext}
                        >
                            Capítulo {cap.numero + 1} →
                        </Link>
                    )}
                </nav>
            </div>
        )
    }

    // Índice del manual
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
                    <span className={styles.versionNote}>Se enriquece con aportes validados</span>
                </div>
            </div>

            <div className={styles.chapterList}>
                {capitulos.map(cap => (
                    <Link
                        key={cap.id}
                        to={cap.disponible ? `/manual/${cap.id}` : '#'}
                        className={`${styles.chapterCard} ${!cap.disponible ? styles.chapterLocked : ''}`}
                        onClick={e => !cap.disponible && e.preventDefault()}
                    >
                        <span className={styles.chapterNumber}>{cap.numero}</span>
                        <div className={styles.chapterInfo}>
                            <h3 className={styles.chapterTitle}>{cap.titulo}</h3>
                            <p className={styles.chapterDescription}>{cap.descripcion}</p>
                        </div>
                        {!cap.disponible && (
                            <span className={styles.comingSoon}>Próximamente</span>
                        )}
                    </Link>
                ))}
            </div>

            {/* Sección de Contribuciones */}
            <section className={styles.contributeSection}>
                <h2>🤝 Contribuye al Manual</h2>
                <p>
                    Este manual crece con la comunidad. Si tenés experiencia en obra,
                    podés proponer mejoras, correcciones o casos de uso.
                </p>
                <div className={styles.contributeOptions}>
                    <div className={styles.contributeCard}>
                        <span className={styles.contributeIcon}>💡</span>
                        <h4>Sugerir Mejora</h4>
                        <p>Proponé una corrección o ampliación de contenido existente.</p>
                    </div>
                    <div className={styles.contributeCard}>
                        <span className={styles.contributeIcon}>🔧</span>
                        <h4>Caso de Obra</h4>
                        <p>Compartí una situación real que enfrentaste y cómo la resolviste.</p>
                    </div>
                    <div className={styles.contributeCard}>
                        <span className={styles.contributeIcon}>⚠️</span>
                        <h4>Reportar Error</h4>
                        <p>Señalá errores técnicos o información desactualizada.</p>
                    </div>
                </div>
                <p className={styles.contributeNote}>
                    Los aportes son revisados por el equipo técnico antes de publicarse.
                    Los contribuidores validados reciben reconocimiento en la plataforma.
                </p>
            </section>
        </div>
    )
}

