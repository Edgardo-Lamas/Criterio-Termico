import { useState } from 'react'
import { DIAMETROS_CAÑERIA } from '../../../lib/bombas/types'
import type { BombaOutput, PresurizadoraOutput } from '../../../lib/bombas/types'
import { calcularBomba } from '../../../lib/bombas/BombaService'
import { calcularPresurizadora } from '../../../lib/bombas/PresurizadoraService'
import styles from './CalculadoraBombas.module.css'

// ── Tipos de tab ─────────────────────────────────────────────────────────────
type TabId = 'circuladora' | 'presurizadora'

// ── Estado del formulario: Circuladora ───────────────────────────────────────
interface FormCirculadora {
    potencia: string
    deltaT: string
    longitud: string
    diametro: string
}

const FORM_CIRC_INICIAL: FormCirculadora = {
    potencia:  '',
    deltaT:    '10',
    longitud:  '',
    diametro:  '3/4"',
}

// ── Estado del formulario: Presurizadora ─────────────────────────────────────
interface FormPresurizadora {
    presionRed: string
    alturaFill: string
    alturaCircuito: string
    presionObjetivo: string
}

const FORM_PRES_INICIAL: FormPresurizadora = {
    presionRed:       '2',
    alturaFill:       '0',
    alturaCircuito:   '4',
    presionObjetivo:  '1.5',
}

// ── Labels ───────────────────────────────────────────────────────────────────
const DELTA_T_OPTIONS = [
    { value: '10', label: '10 °C — Radiadores (ida 70 / retorno 60 °C)' },
    { value: '7',  label: '7 °C  — Sistema mixto o caldera condensación' },
    { value: '5',  label: '5 °C  — Piso radiante (ida 40 / retorno 35 °C)' },
]

const CATEGORIA_BOMBA_LABELS: Record<BombaOutput['categoria'], string> = {
    pequeña:  'Bomba pequeña',
    mediana:  'Bomba mediana',
    grande:   'Bomba grande',
}

const CATEGORIA_PRES_LABELS: Record<PresurizadoraOutput['categoria'], string> = {
    'sin-bomba':   'Sin presurizadora',
    'doméstica':   'Presurizadora doméstica',
    'mediana':     'Presurizadora mediana',
    'industrial':  'Grupo de presión multietapa',
}

// ── Componente principal ─────────────────────────────────────────────────────
export function CalculadoraBombas() {
    const [tab, setTab] = useState<TabId>('circuladora')

    // Circuladora
    const [formCirc, setFormCirc] = useState<FormCirculadora>(FORM_CIRC_INICIAL)
    const [resultCirc, setResultCirc] = useState<BombaOutput | null>(null)
    const [errorCirc, setErrorCirc] = useState<string | null>(null)

    // Presurizadora
    const [formPres, setFormPres] = useState<FormPresurizadora>(FORM_PRES_INICIAL)
    const [resultPres, setResultPres] = useState<PresurizadoraOutput | null>(null)
    const [errorPres, setErrorPres] = useState<string | null>(null)

    // ── Handlers: Circuladora ─────────────────────────────────────────────────
    const handleCircChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormCirc(prev => ({ ...prev, [e.target.name]: e.target.value }))
        setErrorCirc(null)
    }

    const validarCirc = (): string | null => {
        const p = parseFloat(formCirc.potencia)
        const l = parseFloat(formCirc.longitud)
        if (!formCirc.potencia || isNaN(p) || p <= 0 || p > 500)
            return 'La potencia debe estar entre 1 y 500 kW.'
        if (!formCirc.longitud || isNaN(l) || l <= 0 || l > 300)
            return 'La longitud del circuito debe estar entre 1 y 300 m.'
        return null
    }

    const calcularCirculadora = () => {
        const err = validarCirc()
        if (err) { setErrorCirc(err); return }
        setResultCirc(calcularBomba({
            potenciaTotal:    parseFloat(formCirc.potencia),
            deltaT:           parseFloat(formCirc.deltaT),
            longitudCircuito: parseFloat(formCirc.longitud),
            diametroCañeria:  formCirc.diametro,
        }))
    }

    const limpiarCirculadora = () => {
        setFormCirc(FORM_CIRC_INICIAL)
        setResultCirc(null)
        setErrorCirc(null)
    }

    // ── Handlers: Presurizadora ───────────────────────────────────────────────
    const handlePresChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormPres(prev => ({ ...prev, [e.target.name]: e.target.value }))
        setErrorPres(null)
    }

    const validarPres = (): string | null => {
        const red  = parseFloat(formPres.presionRed)
        const hf   = parseFloat(formPres.alturaFill)
        const hc   = parseFloat(formPres.alturaCircuito)
        const pobj = parseFloat(formPres.presionObjetivo)
        if (isNaN(red)  || red  < 0   || red  > 8)   return 'Presión de red: entre 0 y 8 bar.'
        if (isNaN(hf)   || hf   < 0   || hf   > 200) return 'Altura del punto de llenado: entre 0 y 200 m.'
        if (isNaN(hc)   || hc   < 0   || hc   > 100) return 'Altura del circuito: entre 0 y 100 m.'
        if (isNaN(pobj) || pobj < 0.5 || pobj > 4)   return 'Presión objetivo: entre 0.5 y 4 bar.'
        return null
    }

    const calcularPres = () => {
        const err = validarPres()
        if (err) { setErrorPres(err); return }
        setResultPres(calcularPresurizadora({
            presionRed:       parseFloat(formPres.presionRed),
            alturaFillPoint:  parseFloat(formPres.alturaFill),
            alturaCircuito:   parseFloat(formPres.alturaCircuito),
            presionObjetivo:  parseFloat(formPres.presionObjetivo),
        }))
    }

    const limpiarPres = () => {
        setFormPres(FORM_PRES_INICIAL)
        setResultPres(null)
        setErrorPres(null)
    }

    // ── Helpers de estilo ─────────────────────────────────────────────────────
    const categoriaBombaClass = (c: BombaOutput['categoria']) =>
        c === 'pequeña' ? styles.categoriaSmall
        : c === 'mediana' ? styles.categoriaMediana
        : styles.categoriaGrande

    const categoriaPresClass = (c: PresurizadoraOutput['categoria']) =>
        c === 'sin-bomba'  ? styles.categoriaSinBomba
        : c === 'doméstica' ? styles.categoriaDomestica
        : c === 'mediana'   ? styles.categoriaMediana
        : styles.categoriaIndustrial

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className={styles.wrapper}>

            {/* Selector de tab */}
            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${tab === 'circuladora' ? styles.tabActive : ''}`}
                    onClick={() => setTab('circuladora')}
                >
                    Bomba circuladora
                </button>
                <button
                    className={`${styles.tab} ${tab === 'presurizadora' ? styles.tabActive : ''}`}
                    onClick={() => setTab('presurizadora')}
                >
                    Presurizadora de llenado
                </button>
            </div>

            {/* ══════ TAB: CIRCULADORA ══════ */}
            {tab === 'circuladora' && (
                <>
                    <section className={styles.formSection}>
                        <h2 className={styles.sectionTitle}>Dimensionado de bomba circuladora</h2>
                        <p className={styles.sectionSubtitle}>
                            Calcula el caudal, la pérdida de carga y la categoría de bomba para el
                            circuito de calefacción.
                        </p>

                        <div className={styles.formGrid}>
                            <div className={styles.field}>
                                <label className={styles.label}>
                                    Potencia total instalada
                                    <span className={styles.unit}>kW</span>
                                </label>
                                <input
                                    className={styles.input}
                                    type="number"
                                    name="potencia"
                                    value={formCirc.potencia}
                                    onChange={handleCircChange}
                                    placeholder="ej: 24"
                                    min="1"
                                    max="500"
                                />
                                <p className={styles.hint}>
                                    Suma de todos los radiadores. Si tenés la caldera: usar la potencia nominal.
                                </p>
                            </div>

                            <div className={styles.field}>
                                <label className={styles.label}>
                                    Longitud del circuito (solo ida)
                                    <span className={styles.unit}>m</span>
                                </label>
                                <input
                                    className={styles.input}
                                    type="number"
                                    name="longitud"
                                    value={formCirc.longitud}
                                    onChange={handleCircChange}
                                    placeholder="ej: 20"
                                    min="1"
                                    max="300"
                                />
                                <p className={styles.hint}>
                                    Del circuito más lejano — solo el tramo de ida (se duplica internamente).
                                </p>
                            </div>

                            <div className={`${styles.field} ${styles.fieldFull}`}>
                                <label className={styles.label}>
                                    Diferencia de temperatura de diseño
                                </label>
                                <select
                                    className={styles.select}
                                    name="deltaT"
                                    value={formCirc.deltaT}
                                    onChange={handleCircChange}
                                >
                                    {DELTA_T_OPTIONS.map(o => (
                                        <option key={o.value} value={o.value}>{o.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className={`${styles.field} ${styles.fieldFull}`}>
                                <label className={styles.label}>
                                    Diámetro de la cañería principal
                                </label>
                                <select
                                    className={styles.select}
                                    name="diametro"
                                    value={formCirc.diametro}
                                    onChange={handleCircChange}
                                >
                                    {Object.keys(DIAMETROS_CAÑERIA).map(d => (
                                        <option key={d} value={d}>{d} (int. {Math.round(DIAMETROS_CAÑERIA[d] * 1000)} mm)</option>
                                    ))}
                                </select>
                                <p className={styles.hint}>
                                    Hierro negro roscado estándar. El tramo principal entre caldera y colector.
                                </p>
                            </div>
                        </div>

                        {errorCirc && <p className={styles.errorMsg}>{errorCirc}</p>}

                        <div className={styles.actions}>
                            <button className={styles.btnPrimary} onClick={calcularCirculadora}>
                                Calcular bomba
                            </button>
                            <button className={styles.btnSecondary} onClick={limpiarCirculadora}>
                                Limpiar
                            </button>
                        </div>
                    </section>

                    {resultCirc && (
                        <section className={styles.resultsSection}>
                            <h2 className={styles.sectionTitle}>Resultado</h2>

                            <div className={styles.metricsGrid}>
                                <div className={styles.metric}>
                                    <span className={styles.metricValue}>{resultCirc.caudal}</span>
                                    <span className={styles.metricUnit}>l/h</span>
                                    <span className={styles.metricLabel}>Caudal</span>
                                </div>
                                <div className={styles.metric}>
                                    <span className={styles.metricValue}>{resultCirc.perdidaCargaTotal}</span>
                                    <span className={styles.metricUnit}>mca</span>
                                    <span className={styles.metricLabel}>Altura manométrica</span>
                                </div>
                                <div className={styles.metric}>
                                    <span className={styles.metricValue}>{resultCirc.velocidad}</span>
                                    <span className={styles.metricUnit}>m/s</span>
                                    <span className={styles.metricLabel}>Velocidad</span>
                                </div>
                            </div>

                            <div
                                className={`${styles.categoriaBadge} ${categoriaBombaClass(resultCirc.categoria)}`}
                            >
                                Punto de operación: {resultCirc.caudalM3h} m³/h × {resultCirc.perdidaCargaTotal} mca
                                — {CATEGORIA_BOMBA_LABELS[resultCirc.categoria]}
                            </div>

                            {resultCirc.notas.length > 0 && (
                                <div className={styles.notas}>
                                    {resultCirc.notas.map((n, i) => (
                                        <p key={i} className={styles.nota}>{n}</p>
                                    ))}
                                </div>
                            )}

                            {resultCirc.advertencias.length > 0 && (
                                <div className={styles.advertencias}>
                                    {resultCirc.advertencias.map((a, i) => (
                                        <p key={i} className={styles.advertencia}>⚠ {a}</p>
                                    ))}
                                </div>
                            )}
                        </section>
                    )}
                </>
            )}

            {/* ══════ TAB: PRESURIZADORA ══════ */}
            {tab === 'presurizadora' && (
                <>
                    <section className={styles.formSection}>
                        <h2 className={styles.sectionTitle}>¿Necesito bomba presurizadora?</h2>
                        <p className={styles.sectionSubtitle}>
                            Verifica si la presión de red disponible alcanza para llenar el circuito
                            a 1.5 bar. Problema frecuente en edificios y zonas con baja presión de red.
                        </p>

                        <div className={styles.formGrid}>
                            <div className={styles.field}>
                                <label className={styles.label}>
                                    Presión de red en boca de calle
                                    <span className={styles.unit}>bar</span>
                                </label>
                                <input
                                    className={styles.input}
                                    type="number"
                                    name="presionRed"
                                    value={formPres.presionRed}
                                    onChange={handlePresChange}
                                    placeholder="ej: 2"
                                    min="0"
                                    max="8"
                                    step="0.1"
                                />
                                <p className={styles.hint}>
                                    En AMBA: 1.5–3 bar típico. Medir con manómetro para mayor precisión.
                                </p>
                            </div>

                            <div className={styles.field}>
                                <label className={styles.label}>
                                    Altura del punto de llenado sobre calle
                                    <span className={styles.unit}>m</span>
                                </label>
                                <input
                                    className={styles.input}
                                    type="number"
                                    name="alturaFill"
                                    value={formPres.alturaFill}
                                    onChange={handlePresChange}
                                    placeholder="ej: 0"
                                    min="0"
                                    max="200"
                                />
                                <p className={styles.hint}>
                                    Casa en planta baja = 0. Planta alta ≈ 3 m por piso.
                                </p>
                            </div>

                            <div className={styles.field}>
                                <label className={styles.label}>
                                    Altura del circuito sobre el punto de llenado
                                    <span className={styles.unit}>m</span>
                                </label>
                                <input
                                    className={styles.input}
                                    type="number"
                                    name="alturaCircuito"
                                    value={formPres.alturaCircuito}
                                    onChange={handlePresChange}
                                    placeholder="ej: 4"
                                    min="0"
                                    max="100"
                                />
                                <p className={styles.hint}>
                                    Diferencia de altura entre el llenador y el radiador más alto.
                                </p>
                            </div>

                            <div className={styles.field}>
                                <label className={styles.label}>
                                    Presión objetivo en frío
                                    <span className={styles.unit}>bar</span>
                                </label>
                                <input
                                    className={styles.input}
                                    type="number"
                                    name="presionObjetivo"
                                    value={formPres.presionObjetivo}
                                    onChange={handlePresChange}
                                    placeholder="1.5"
                                    min="0.5"
                                    max="4"
                                    step="0.1"
                                />
                                <p className={styles.hint}>
                                    Estándar residencial: 1.5 bar. Mínimo aceptable: 1 bar.
                                </p>
                            </div>
                        </div>

                        {errorPres && <p className={styles.errorMsg}>{errorPres}</p>}

                        <div className={styles.actions}>
                            <button className={styles.btnPrimary} onClick={calcularPres}>
                                Verificar presión
                            </button>
                            <button className={styles.btnSecondary} onClick={limpiarPres}>
                                Limpiar
                            </button>
                        </div>
                    </section>

                    {resultPres && (
                        <section className={styles.resultsSection}>
                            <h2 className={styles.sectionTitle}>Resultado</h2>

                            <div className={styles.metricsGrid}>
                                <div className={styles.metric}>
                                    <span className={styles.metricValue}>{resultPres.presionDisponible}</span>
                                    <span className={styles.metricUnit}>bar</span>
                                    <span className={styles.metricLabel}>Presión disponible</span>
                                </div>
                                <div className={styles.metric}>
                                    <span className={styles.metricValue}>{resultPres.presionNecesaria}</span>
                                    <span className={styles.metricUnit}>bar</span>
                                    <span className={styles.metricLabel}>Presión necesaria</span>
                                </div>
                                <div className={styles.metric}>
                                    <span className={styles.metricValue}>{resultPres.boostNecesario}</span>
                                    <span className={styles.metricUnit}>bar</span>
                                    <span className={styles.metricLabel}>Boost requerido</span>
                                </div>
                            </div>

                            <div
                                className={`${styles.categoriaBadge} ${categoriaPresClass(resultPres.categoria)}`}
                            >
                                {resultPres.necesitaPresurizadora
                                    ? `Necesita presurizadora — ${resultPres.alturaManometrica} mca`
                                    : 'Sin presurizadora — presión de red suficiente'}
                                {' '}— {CATEGORIA_PRES_LABELS[resultPres.categoria]}
                            </div>

                            {resultPres.notas.length > 0 && (
                                <div className={styles.notas}>
                                    {resultPres.notas.map((n, i) => (
                                        <p key={i} className={styles.nota}>{n}</p>
                                    ))}
                                </div>
                            )}

                            {resultPres.advertencias.length > 0 && (
                                <div className={styles.advertencias}>
                                    {resultPres.advertencias.map((a, i) => (
                                        <p key={i} className={styles.advertencia}>⚠ {a}</p>
                                    ))}
                                </div>
                            )}
                        </section>
                    )}
                </>
            )}
        </div>
    )
}
