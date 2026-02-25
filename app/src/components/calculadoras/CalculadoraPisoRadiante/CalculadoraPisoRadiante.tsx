import { useState } from 'react'
import { TipoDeSuelo, AdvisoryLevel } from '../../../lib/pisoRadiante/types'
import type { UnderfloorCalculationOutput, ResumenPresupuesto } from '../../../lib/pisoRadiante/types'
import { calcularPisoRadiante } from '../../../lib/pisoRadiante/UnderfloorService'
import { calcularPresupuesto } from '../../../lib/pisoRadiante/PresupuestoService'
import styles from './CalculadoraPisoRadiante.module.css'

const TIPO_SUELO_LABELS: Record<TipoDeSuelo, string> = {
    [TipoDeSuelo.PETREO]:          'Pétreo (porcelanato, cerámica, piedra)',
    [TipoDeSuelo.MADERA_MACIZA]:   'Madera maciza',
    [TipoDeSuelo.MADERA_FLOTANTE]: 'Madera flotante / laminado',
    [TipoDeSuelo.MOQUETA]:         'Moqueta / alfombra'
}

interface FormState {
    area: string
    cargaTermica: string
    tipoDeSuelo: TipoDeSuelo
    distanciaColector: string
    distanciaAlimentacion: string
}

const FORM_INICIAL: FormState = {
    area: '',
    cargaTermica: '',
    tipoDeSuelo: TipoDeSuelo.PETREO,
    distanciaColector: '',
    distanciaAlimentacion: ''
}

export function CalculadoraPisoRadiante() {
    const [form, setForm] = useState<FormState>(FORM_INICIAL)
    const [resultado, setResultado] = useState<UnderfloorCalculationOutput | null>(null)
    const [presupuesto, setPresupuesto] = useState<ResumenPresupuesto | null>(null)
    const [mostrarPresupuesto, setMostrarPresupuesto] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setForm(prev => ({ ...prev, [name]: value }))
        setError(null)
    }

    const validar = (): string | null => {
        const area = parseFloat(form.area)
        const carga = parseFloat(form.cargaTermica)
        const distCol = parseFloat(form.distanciaColector)

        if (!form.area || isNaN(area) || area <= 0 || area > 1000)
            return 'El área debe estar entre 1 y 1000 m².'
        if (!form.cargaTermica || isNaN(carga) || carga < 10 || carga > 150)
            return 'La carga térmica debe estar entre 10 y 150 W/m².'
        if (!form.distanciaColector || isNaN(distCol) || distCol < 0 || distCol > 50)
            return 'La distancia al colector debe estar entre 0 y 50 m.'
        return null
    }

    const calcular = () => {
        const validationError = validar()
        if (validationError) {
            setError(validationError)
            return
        }

        const area = parseFloat(form.area)
        const distAlim = form.distanciaAlimentacion ? parseFloat(form.distanciaAlimentacion) : undefined

        const input = {
            area,
            cargaTermicaRequerida: parseFloat(form.cargaTermica),
            tipoDeSuelo: form.tipoDeSuelo,
            distanciaAlColector: parseFloat(form.distanciaColector),
            distanciaAlimentacion: distAlim
        }

        const res = calcularPisoRadiante(input)
        const pres = calcularPresupuesto(res, area)
        setResultado(res)
        setPresupuesto(pres)
        setMostrarPresupuesto(false)
    }

    const limpiar = () => {
        setForm(FORM_INICIAL)
        setResultado(null)
        setPresupuesto(null)
        setError(null)
        setMostrarPresupuesto(false)
    }

    return (
        <div className={styles.wrapper}>
            {/* Formulario */}
            <section className={styles.formSection}>
                <h2 className={styles.sectionTitle}>Datos del ambiente</h2>

                <div className={styles.formGrid}>
                    <div className={styles.field}>
                        <label className={styles.label}>
                            Área a calefaccionar
                            <span className={styles.unit}>m²</span>
                        </label>
                        <input
                            className={styles.input}
                            type="number"
                            name="area"
                            value={form.area}
                            onChange={handleChange}
                            placeholder="ej: 40"
                            min="1"
                            max="1000"
                        />
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>
                            Carga térmica requerida
                            <span className={styles.unit}>W/m²</span>
                        </label>
                        <input
                            className={styles.input}
                            type="number"
                            name="cargaTermica"
                            value={form.cargaTermica}
                            onChange={handleChange}
                            placeholder="ej: 60"
                            min="10"
                            max="150"
                        />
                        <p className={styles.hint}>
                            Bien aislado: 35–50 · Medio: 50–70 · Deficiente: 70–100
                        </p>
                    </div>

                    <div className={`${styles.field} ${styles.fieldFull}`}>
                        <label className={styles.label}>Tipo de suelo de acabado</label>
                        <select
                            className={styles.select}
                            name="tipoDeSuelo"
                            value={form.tipoDeSuelo}
                            onChange={handleChange}
                        >
                            {Object.entries(TIPO_SUELO_LABELS).map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>
                            Distancia al colector (ida)
                            <span className={styles.unit}>m</span>
                        </label>
                        <input
                            className={styles.input}
                            type="number"
                            name="distanciaColector"
                            value={form.distanciaColector}
                            onChange={handleChange}
                            placeholder="ej: 8"
                            min="0"
                            max="50"
                        />
                        <p className={styles.hint}>
                            Desde la caldera hasta el colector. Se multiplica ×2 (ida + vuelta).
                        </p>
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>
                            Distancia de alimentación
                            <span className={styles.unitOptional}>m — opcional</span>
                        </label>
                        <input
                            className={styles.input}
                            type="number"
                            name="distanciaAlimentacion"
                            value={form.distanciaAlimentacion}
                            onChange={handleChange}
                            placeholder="ej: 10"
                            min="0"
                        />
                        <p className={styles.hint}>
                            Tramo caldera → colector en tubería de alimentación 1".
                        </p>
                    </div>
                </div>

                {error && <p className={styles.errorMsg}>{error}</p>}

                <div className={styles.actions}>
                    <button className={styles.btnPrimary} onClick={calcular}>
                        Calcular
                    </button>
                    {resultado && (
                        <button className={styles.btnSecondary} onClick={limpiar}>
                            Limpiar
                        </button>
                    )}
                </div>
            </section>

            {/* Resultados */}
            {resultado && (
                <section className={styles.resultsSection}>
                    <h2 className={styles.sectionTitle}>Resultado del cálculo</h2>

                    {/* Advisory */}
                    {resultado.advisoryMessage && (
                        <div className={`${styles.advisory} ${styles[`advisory${resultado.advisoryMessage.level}`]}`}>
                            <span className={styles.advisoryIcon}>
                                {resultado.advisoryMessage.level === AdvisoryLevel.CRITICAL ? '🚨' :
                                 resultado.advisoryMessage.level === AdvisoryLevel.WARNING  ? '⚠️' : 'ℹ️'}
                            </span>
                            <p>{resultado.advisoryMessage.message}</p>
                        </div>
                    )}

                    <div className={styles.resultGrid}>
                        <div className={styles.resultCard}>
                            <span className={styles.resultLabel}>Paso de tubería</span>
                            <span className={styles.resultValue}>{resultado.pasoSeleccionado} cm</span>
                            <span className={styles.resultSub}>{resultado.densidadTuberia} m/m²</span>
                        </div>

                        <div className={styles.resultCard}>
                            <span className={styles.resultLabel}>Long. serpentina</span>
                            <span className={styles.resultValue}>{resultado.longitudSerpentina} m</span>
                            <span className={styles.resultSub}>tubería en el piso</span>
                        </div>

                        <div className={styles.resultCard}>
                            <span className={styles.resultLabel}>Long. acometida</span>
                            <span className={styles.resultValue}>{resultado.longitudAcometida} m</span>
                            <span className={styles.resultSub}>ida + vuelta al colector</span>
                        </div>

                        <div className={`${styles.resultCard} ${styles.resultCardHighlight}`}>
                            <span className={styles.resultLabel}>Longitud total</span>
                            <span className={styles.resultValue}>{resultado.longitudTotal} m</span>
                            <span className={styles.resultSub}>tubería PE-X total</span>
                        </div>

                        <div className={`${styles.resultCard} ${styles.resultCardHighlight}`}>
                            <span className={styles.resultLabel}>Circuitos</span>
                            <span className={styles.resultValue}>{resultado.numeroCircuitos}</span>
                            <span className={styles.resultSub}>máx. 120 m c/u</span>
                        </div>

                        <div className={styles.resultCard}>
                            <span className={styles.resultLabel}>Potencia máx. suelo</span>
                            <span className={styles.resultValue}>{resultado.potenciaMaximaSuelo} W/m²</span>
                            <span className={styles.resultSub}>límite del acabado elegido</span>
                        </div>
                    </div>

                    <p className={styles.designNote}>{resultado.notaDiseno}</p>

                    {/* Presupuesto */}
                    {presupuesto && (
                        <div className={styles.presupuestoSection}>
                            <button
                                className={styles.btnToggle}
                                onClick={() => setMostrarPresupuesto(v => !v)}
                            >
                                {mostrarPresupuesto ? '▲ Ocultar' : '▼ Ver'} lista de materiales
                                <span className={styles.totalBadge}>
                                    USD {presupuesto.totalFinal.toFixed(2)}
                                </span>
                            </button>

                            {mostrarPresupuesto && (
                                <div className={styles.presupuestoTable}>
                                    <div className={styles.tableHeader}>
                                        <span>Material</span>
                                        <span>Cant.</span>
                                        <span>Unidad</span>
                                        <span>P. Unit.</span>
                                        <span>Subtotal</span>
                                    </div>
                                    {presupuesto.items.map(item => (
                                        <div key={item.productoId} className={styles.tableRow}>
                                            <span>{item.nombre}</span>
                                            <span>{item.cantidad}</span>
                                            <span>{item.unidad}</span>
                                            <span>$ {item.precioUnitario.toFixed(2)}</span>
                                            <span>$ {item.subtotal.toFixed(2)}</span>
                                        </div>
                                    ))}
                                    <div className={styles.tableTotals}>
                                        <span className={styles.totalLabel}>Total materiales</span>
                                        <span className={styles.totalValue}>
                                            USD {presupuesto.totalFinal.toFixed(2)}
                                        </span>
                                    </div>
                                    <p className={styles.presupuestoNote}>
                                        * Precios de referencia en USD. No incluye mano de obra, impresión ni fletes.
                                        Actualizar precios en catálogo según mercado local.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </section>
            )}
        </div>
    )
}
