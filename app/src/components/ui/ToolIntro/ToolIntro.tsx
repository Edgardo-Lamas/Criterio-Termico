import type { ReactNode } from 'react'
import styles from './ToolIntro.module.css'

interface ToolIntroProps {
    /** Qué pregunta concreta de la obra responde esta calculadora. */
    responde: ReactNode
    /** En qué momento del proyecto se usa. */
    cuando: ReactNode
    /** Qué se hace con el resultado (siguiente paso del flujo). */
    despues: ReactNode
}

/**
 * Encabezado común de las calculadoras: explica el propósito de la
 * herramienta en lenguaje de oficio antes de mostrar el formulario.
 */
export function ToolIntro({ responde, cuando, despues }: ToolIntroProps) {
    return (
        <dl className={styles.intro}>
            <div className={styles.row}>
                <dt className={styles.term}>Qué te responde</dt>
                <dd className={styles.def}>{responde}</dd>
            </div>
            <div className={styles.row}>
                <dt className={styles.term}>Cuándo se usa</dt>
                <dd className={styles.def}>{cuando}</dd>
            </div>
            <div className={styles.row}>
                <dt className={styles.term}>Después del cálculo</dt>
                <dd className={styles.def}>{despues}</dd>
            </div>
        </dl>
    )
}
