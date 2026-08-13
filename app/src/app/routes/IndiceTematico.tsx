import { Link } from 'react-router-dom'
import { useAuthStore } from '../../stores/useAuthStore'
import { usePageMeta } from '../../lib/usePageMeta'
import { Icon } from '../../components/ui/Icon/Icon'
import { getIndiceTematico, FAMILIAS } from '../../content/errores'
import styles from './IndiceTematico.module.css'

/**
 * Índice temático de los casos de errores.
 *
 * Es un LISTADO, no un buscador: el que viene de otro oficio no puede tipear
 * "cortocircuito hidráulico" porque no sabe que existe, pero lo reconoce al
 * verlo. Por eso todo está a la vista y agrupado por lo que el instalador
 * ESTÁ VIENDO en la obra, no por la causa técnica.
 */
export function IndiceTematico() {
    const { canAccess } = useAuthStore()
    const grupos = getIndiceTematico()

    // Nunca hardcodear estos números: se mueven con cada caso nuevo.
    const totalTemas = grupos.reduce((suma, grupo) => suma + grupo.entradas.length, 0)

    usePageMeta({
        title: 'Índice temático de errores frecuentes',
        description: `${totalTemas} temas de obra agrupados por síntoma: cada uno lleva al párrafo exacto que lo explica.`
    })

    const nombreDe = (id: string) => FAMILIAS.find(f => f.id === id)

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <Link to="/errores" className={styles.backLink}>← Errores Frecuentes</Link>
                <h1>Índice temático</h1>
                <p className={styles.description}>
                    Entrá por lo que estás viendo en la obra, no por el nombre técnico del problema.
                    Cada tema lleva al párrafo exacto que lo explica, dentro del caso que lo trata.
                </p>
                <span className={styles.statItem}>
                    {totalTemas} temas en {grupos.length} grupos
                </span>
            </div>

            {/* Barra de salto: en el celular es la única forma de no scrollear 110 entradas */}
            <nav className={styles.jumpBar} aria-label="Ir a un grupo">
                {grupos.map(({ familia, entradas }) => {
                    const info = nombreDe(familia)
                    return (
                        <a key={familia} href={`#g-${familia}`} className={styles.jumpChip}>
                            {info?.nombre ?? familia}
                            <span className={styles.jumpCount}>{entradas.length}</span>
                        </a>
                    )
                })}
            </nav>

            {grupos.map(({ familia, entradas }) => {
                const info = nombreDe(familia)
                return (
                    <section key={familia} id={`g-${familia}`} className={styles.familia}>
                        <h2 className={styles.familiaNombre}>{info?.nombre ?? familia}</h2>
                        {info?.descripcion && (
                            <p className={styles.familiaDescripcion}>{info.descripcion}</p>
                        )}

                        <ul className={styles.lista}>
                            {entradas.map(entrada => {
                                const hasAccess = canAccess(entrada.tier)
                                return (
                                    <li
                                        key={`${entrada.errorId}-${entrada.ancla}-${entrada.termino}`}
                                        className={styles.item}
                                    >
                                        <Link
                                            to={entrada.href}
                                            className={hasAccess ? styles.termino : styles.terminoLocked}
                                            title={entrada.errorTitulo}
                                        >
                                            {entrada.termino}
                                            {!hasAccess && (
                                                <Icon
                                                    name="lock"
                                                    size={13}
                                                    className={styles.lockIcon}
                                                />
                                            )}
                                        </Link>
                                        <span className={styles.caso}>{entrada.errorTitulo}</span>
                                    </li>
                                )
                            })}
                        </ul>
                    </section>
                )
            })}

            <p className={styles.footerNota}>
                ¿Preferís ver los casos completos?{' '}
                <Link to="/errores">Volver al listado de casos</Link>
            </p>
        </div>
    )
}
