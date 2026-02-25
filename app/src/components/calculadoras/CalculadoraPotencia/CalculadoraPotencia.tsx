import { useState } from 'react'
import styles from './CalculadoraPotencia.module.css'

// ── Tipos ────────────────────────────────────────────────────────────────────

type ThermalFactor = 40 | 50 | 60
type WindowsLevel = 'sin-ventanas' | 'pocas' | 'normales' | 'muchas'

interface Ambiente {
    id: string
    nombre: string
    area: number
    height: number
    thermalFactor: ThermalFactor
    hasExteriorWall: boolean
    windowsLevel: WindowsLevel
}

// ── Cálculo (extraído de thermalCalculator.ts) ───────────────────────────────

function calcularPotencia(amb: Ambiente): number {
    const volume = amb.area * amb.height
    let adjustment = 0
    if (amb.hasExteriorWall) adjustment += 0.15
    const windowAdj: Record<WindowsLevel, number> = {
        'sin-ventanas': 0,
        pocas: 0.05,
        normales: 0.10,
        muchas: 0.20,
    }
    adjustment += windowAdj[amb.windowsLevel]
    return Math.round(volume * amb.thermalFactor * (1 + adjustment))
}

function kcalToKw(kcal: number): number {
    return Math.round((kcal / 860) * 10) / 10
}

// ── Constantes de UI ─────────────────────────────────────────────────────────

const THERMAL_FACTOR_OPTIONS: { value: ThermalFactor; label: string; desc: string }[] = [
    { value: 40, label: '40 Kcal/h·m³', desc: 'Buena aislación — construcción nueva, doble vidrio' },
    { value: 50, label: '50 Kcal/h·m³', desc: 'Aislación normal — estándar' },
    { value: 60, label: '60 Kcal/h·m³', desc: 'Poca aislación — construcción antigua, sin aislación' },
]

const WINDOWS_OPTIONS: { value: WindowsLevel; label: string }[] = [
    { value: 'sin-ventanas', label: 'Sin ventanas al exterior (+0%)' },
    { value: 'pocas', label: 'Pocas ventanas (+5%)' },
    { value: 'normales', label: 'Ventanas normales (+10%)' },
    { value: 'muchas', label: 'Muchas ventanas o grandes (+20%)' },
]

const DEFAULT_AMBIENTE: Omit<Ambiente, 'id' | 'nombre'> = {
    area: 0,
    height: 2.5,
    thermalFactor: 50,
    hasExteriorWall: true,
    windowsLevel: 'normales',
}

// ── Helpers ──────────────────────────────────────────────────────────────────

let nextId = 1
function newId() { return String(nextId++) }

// ── Componente ───────────────────────────────────────────────────────────────

export function CalculadoraPotencia() {
    const [ambientes, setAmbientes] = useState<Ambiente[]>([])
    const [form, setForm] = useState<Omit<Ambiente, 'id'>>({ nombre: '', ...DEFAULT_AMBIENTE })
    const [editingId, setEditingId] = useState<string | null>(null)

    // Totales
    const totalKcal = ambientes.reduce((sum, a) => sum + calcularPotencia(a), 0)
    const totalKw = kcalToKw(totalKcal)
    const calderaKcal = ambientes.length > 0 ? Math.round(totalKcal / 0.80) : 0
    const calderaKw = kcalToKw(calderaKcal)

    function handleAdd() {
        if (!form.area || form.area <= 0) return
        const nombre = form.nombre.trim() || `Ambiente ${ambientes.length + 1}`
        if (editingId) {
            setAmbientes(prev => prev.map(a => a.id === editingId ? { ...form, nombre, id: editingId } : a))
            setEditingId(null)
        } else {
            setAmbientes(prev => [...prev, { ...form, nombre, id: newId() }])
        }
        setForm({ nombre: '', ...DEFAULT_AMBIENTE })
    }

    function handleEdit(amb: Ambiente) {
        setForm({ nombre: amb.nombre, area: amb.area, height: amb.height, thermalFactor: amb.thermalFactor, hasExteriorWall: amb.hasExteriorWall, windowsLevel: amb.windowsLevel })
        setEditingId(amb.id)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    function handleRemove(id: string) {
        setAmbientes(prev => prev.filter(a => a.id !== id))
        if (editingId === id) {
            setEditingId(null)
            setForm({ nombre: '', ...DEFAULT_AMBIENTE })
        }
    }

    function handleCancel() {
        setEditingId(null)
        setForm({ nombre: '', ...DEFAULT_AMBIENTE })
    }

    return (
        <div className={styles.root}>
            {/* Formulario */}
            <section className={styles.formSection}>
                <h2 className={styles.sectionTitle}>
                    {editingId ? '✏️ Editar ambiente' : '➕ Agregar ambiente'}
                </h2>

                <div className={styles.formGrid}>
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>Nombre del ambiente</label>
                        <input
                            className={styles.input}
                            type="text"
                            placeholder="Ej: Living, Dormitorio 1…"
                            value={form.nombre}
                            onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                        />
                    </div>

                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>Superficie (m²)</label>
                        <input
                            className={styles.input}
                            type="number"
                            min="1"
                            step="0.5"
                            placeholder="20"
                            value={form.area || ''}
                            onChange={e => setForm(f => ({ ...f, area: parseFloat(e.target.value) || 0 }))}
                        />
                    </div>

                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>Altura de techo (m)</label>
                        <input
                            className={styles.input}
                            type="number"
                            min="1.8"
                            max="6"
                            step="0.1"
                            placeholder="2.5"
                            value={form.height}
                            onChange={e => setForm(f => ({ ...f, height: parseFloat(e.target.value) || 2.5 }))}
                        />
                    </div>

                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>Nivel de aislación</label>
                        <select
                            className={styles.select}
                            value={form.thermalFactor}
                            onChange={e => setForm(f => ({ ...f, thermalFactor: parseInt(e.target.value) as ThermalFactor }))}
                        >
                            {THERMAL_FACTOR_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label} — {opt.desc}</option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>Ventanas exteriores</label>
                        <select
                            className={styles.select}
                            value={form.windowsLevel}
                            onChange={e => setForm(f => ({ ...f, windowsLevel: e.target.value as WindowsLevel }))}
                        >
                            {WINDOWS_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>Pared exterior</label>
                        <label className={styles.checkboxLabel}>
                            <input
                                type="checkbox"
                                checked={form.hasExteriorWall}
                                onChange={e => setForm(f => ({ ...f, hasExteriorWall: e.target.checked }))}
                            />
                            <span>Tiene al menos una pared exterior (+15%)</span>
                        </label>
                    </div>
                </div>

                <div className={styles.formActions}>
                    <button
                        className={styles.btnPrimary}
                        onClick={handleAdd}
                        disabled={!form.area || form.area <= 0}
                    >
                        {editingId ? 'Guardar cambios' : 'Agregar ambiente'}
                    </button>
                    {editingId && (
                        <button className={styles.btnSecondary} onClick={handleCancel}>
                            Cancelar
                        </button>
                    )}
                </div>
            </section>

            {/* Lista de ambientes */}
            {ambientes.length > 0 && (
                <section className={styles.listSection}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>Ambientes cargados</h2>
                        <button className={styles.btnPrint} onClick={() => window.print()}>
                            Imprimir / Exportar PDF
                        </button>
                    </div>
                    <div className={styles.ambientesList}>
                        {ambientes.map(amb => {
                            const kcal = calcularPotencia(amb)
                            const kw = kcalToKw(kcal)
                            return (
                                <div key={amb.id} className={styles.ambienteRow}>
                                    <div className={styles.ambienteInfo}>
                                        <span className={styles.ambienteNombre}>{amb.nombre}</span>
                                        <span className={styles.ambienteDetail}>
                                            {amb.area} m² · {amb.height} m · Factor {amb.thermalFactor}
                                            {amb.hasExteriorWall ? ' · Pared ext.' : ''}
                                        </span>
                                    </div>
                                    <div className={styles.ambientePotencia}>
                                        <span className={styles.potenciaKcal}>{kcal.toLocaleString('es-AR')} Kcal/h</span>
                                        <span className={styles.potenciaKw}>{kw} kW</span>
                                    </div>
                                    <div className={styles.ambienteActions}>
                                        <button className={styles.btnEdit} onClick={() => handleEdit(amb)}>Editar</button>
                                        <button className={styles.btnDelete} onClick={() => handleRemove(amb.id)}>✕</button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* Resumen */}
                    <div className={styles.summary}>
                        <div className={styles.summaryRow}>
                            <span className={styles.summaryLabel}>Total ambientes</span>
                            <span className={styles.summaryValue}>
                                {totalKcal.toLocaleString('es-AR')} Kcal/h — {totalKw} kW
                            </span>
                        </div>
                        <div className={`${styles.summaryRow} ${styles.summaryCaldera}`}>
                            <span className={styles.summaryLabel}>
                                Potencia de caldera recomendada
                                <span className={styles.summaryHint}>(caldera al 80% de carga)</span>
                            </span>
                            <span className={`${styles.summaryValue} ${styles.summaryValueHighlight}`}>
                                {calderaKcal.toLocaleString('es-AR')} Kcal/h — {calderaKw} kW
                            </span>
                        </div>
                    </div>

                    <div className={styles.calloutInfo}>
                        <strong>Nota:</strong> Esta calculadora usa el método simplificado de factor volumétrico.
                        Para proyectos con losas en contacto con el suelo, techos altos o grandes paños de vidrio,
                        conviene aplicar el método de pérdidas térmicas detallado (próximamente en el manual).
                    </div>
                </section>
            )}

            {ambientes.length === 0 && (
                <div className={styles.emptyState}>
                    <p>Agregá los ambientes del proyecto para calcular la potencia total necesaria.</p>
                    <p className={styles.emptyHint}>Podés ingresar tantos ambientes como tenga la obra.</p>
                </div>
            )}
        </div>
    )
}
