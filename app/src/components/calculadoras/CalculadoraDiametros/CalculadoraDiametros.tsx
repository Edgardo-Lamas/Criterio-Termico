import { useState } from 'react'
import { calcularDiametros } from '../../../lib/diametros/DiametroService'
import type { DiametroOutput } from '../../../lib/diametros/DiametroService'
import styles from './CalculadoraDiametros.module.css'

export function CalculadoraDiametros() {
    const [caudal, setCaudal] = useState('')
    const [resultado, setResultado] = useState<DiametroOutput | null>(null)

    const calcular = () => {
        const c = parseFloat(caudal)
        if (!c || c <= 0) return
        setResultado(calcularDiametros({ caudal: c }))
    }

    const estadoLabel = (estado: string) => {
        if (estado === 'ok') return '✓ OK'
        if (estado === 'lento') return '↓ Lento'
        return '↑ Rápido'
    }

    return (
        <div className={styles.calc}>
            <p className={styles.intro}>
                Ingresá el caudal del circuito para ver qué diámetro de cañería conviene usar.
                Si no conocés el caudal, calculalo primero con la <strong>Calculadora de Caudal</strong>.
            </p>

            <div className={styles.form}>
                <div className={styles.field}>
                    <label className={styles.label}>Caudal del circuito</label>
                    <div className={styles.inputRow}>
                        <input
                            type="number"
                            className={styles.input}
                            value={caudal}
                            onChange={e => setCaudal(e.target.value)}
                            placeholder="ej: 500"
                            min="1"
                        />
                        <span className={styles.unit}>l/h</span>
                    </div>
                </div>

                <button className={styles.btn} onClick={calcular}>
                    Calcular diámetro
                </button>
            </div>

            {resultado && (
                <div className={styles.results}>
                    <h3 className={styles.resultTitle}>
                        Diámetro recomendado: <span className={styles.highlight}>{resultado.recomendado}</span>
                    </h3>

                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Diámetro</th>
                                    <th>Ø interior</th>
                                    <th>Velocidad</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {resultado.resultados.map(r => (
                                    <tr
                                        key={r.nombre}
                                        className={`
                                            ${r.recomendado ? styles.rowRecomendado : ''}
                                            ${styles[`row${r.estado.charAt(0).toUpperCase() + r.estado.slice(1)}`]}
                                        `}
                                    >
                                        <td className={styles.tdDiametro}>
                                            {r.nombre}
                                            {r.recomendado && <span className={styles.badge}>Recomendado</span>}
                                        </td>
                                        <td>{r.diametroMm} mm</td>
                                        <td>{r.velocidad.toFixed(2)} m/s</td>
                                        <td className={styles[`estado${r.estado.charAt(0).toUpperCase() + r.estado.slice(1)}`]}>
                                            {estadoLabel(r.estado)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {resultado.advertencias.length > 0 && (
                        <div className={styles.advertencias}>
                            {resultado.advertencias.map((a, i) => (
                                <p key={i}><strong>⚠️</strong> {a}</p>
                            ))}
                        </div>
                    )}

                    <div className={styles.notas}>
                        {resultado.notas.map((n, i) => (
                            <p key={i}>{n}</p>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
