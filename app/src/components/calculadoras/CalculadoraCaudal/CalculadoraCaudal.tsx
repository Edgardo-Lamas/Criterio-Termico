import { useState } from 'react'
import { calcularCaudal } from '../../../lib/caudal/CaudalService'
import type { CaudalOutput } from '../../../lib/caudal/CaudalService'
import styles from './CalculadoraCaudal.module.css'

const DELTA_T_OPTIONS = [
    { value: 5,  label: '5°C — Piso radiante' },
    { value: 7,  label: '7°C — Caldera a condensación' },
    { value: 10, label: '10°C — Radiadores estándar' },
    { value: 15, label: '15°C — Alta temperatura' },
]

const CATEGORIA_CLASS: Record<string, string> = {
    'muy pequeño': styles.catMuyPeq,
    'pequeño':     styles.catPeq,
    'mediano':     styles.catMed,
    'grande':      styles.catGrande,
    'muy grande':  styles.catMuyGrande,
}

export function CalculadoraCaudal() {
    const [potencia, setPotencia] = useState('')
    const [deltaT, setDeltaT] = useState(10)
    const [resultado, setResultado] = useState<CaudalOutput | null>(null)

    const calcular = () => {
        const p = parseFloat(potencia)
        if (!p || p <= 0) return
        setResultado(calcularCaudal({ potencia: p, deltaT }))
    }

    return (
        <div className={styles.calc}>
            <p className={styles.intro}>
                Calculá el caudal que necesita tu circuito a partir de la potencia térmica y el salto de temperatura.
                El resultado te sirve como entrada para la <strong>Calculadora de Diámetros</strong>.
            </p>

            <div className={styles.form}>
                <div className={styles.field}>
                    <label className={styles.label}>Potencia térmica del circuito</label>
                    <div className={styles.inputRow}>
                        <input
                            type="number"
                            className={styles.input}
                            value={potencia}
                            onChange={e => setPotencia(e.target.value)}
                            placeholder="ej: 10"
                            min="0.1"
                            step="0.1"
                        />
                        <span className={styles.unit}>kW</span>
                    </div>
                </div>

                <div className={styles.field}>
                    <label className={styles.label}>Salto térmico (ΔT)</label>
                    <select
                        className={styles.select}
                        value={deltaT}
                        onChange={e => setDeltaT(Number(e.target.value))}
                    >
                        {DELTA_T_OPTIONS.map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                    </select>
                </div>

                <button className={styles.btn} onClick={calcular}>
                    Calcular caudal
                </button>
            </div>

            {resultado && (
                <div className={styles.results}>
                    <div className={styles.metricsGrid}>
                        <div className={styles.metric}>
                            <span className={styles.metricValue}>
                                {Math.round(resultado.caudal).toLocaleString('es-AR')}
                            </span>
                            <span className={styles.metricLabel}>l/h</span>
                        </div>
                        <div className={styles.metric}>
                            <span className={styles.metricValue}>
                                {resultado.caudalM3h.toFixed(2)}
                            </span>
                            <span className={styles.metricLabel}>m³/h</span>
                        </div>
                        <div className={styles.metric}>
                            <span className={`${styles.metricValue} ${styles.metricSmall}`}>
                                {deltaT}°C
                            </span>
                            <span className={styles.metricLabel}>ΔT configurado</span>
                        </div>
                    </div>

                    <div className={`${styles.categoriaBadge} ${CATEGORIA_CLASS[resultado.categoria] ?? ''}`}>
                        Circuito {resultado.categoria}
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

                    <div className={styles.hint}>
                        Con este resultado podés ir a la <strong>Calculadora de Diámetros</strong> e ingresar{' '}
                        <strong>{Math.round(resultado.caudal).toLocaleString('es-AR')} l/h</strong> para elegir la cañería correcta.
                    </div>
                </div>
            )}
        </div>
    )
}
