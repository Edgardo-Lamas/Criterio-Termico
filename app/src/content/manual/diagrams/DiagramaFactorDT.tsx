import styles from './Diagrams.module.css'

/**
 * Gráfico de barras horizontal: factor de corrección de potencia de radiadores
 * en función del ΔT (diferencia temperatura media agua - temperatura del cuarto).
 * Fórmula EN 442: factor = (ΔT / 50) ^ 1,3 (exponente para aluminio y panel de acero)
 */

const DATOS = [
    { dt: 'ΔT 60', factor: 1.27, color: '#34d399' },
    { dt: 'ΔT 55', factor: 1.13, color: '#6ee7b7' },
    { dt: 'ΔT 50', factor: 1.00, color: '#fbbf24', ref: true },
    { dt: 'ΔT 45', factor: 0.87, color: '#f59e0b', typical: true },
    { dt: 'ΔT 40', factor: 0.75, color: '#fb923c' },
    { dt: 'ΔT 35', factor: 0.63, color: '#ef4444' },
    { dt: 'ΔT 30', factor: 0.51, color: '#dc2626' },
]

const BAR_X = 95         // x inicial de las barras
const BAR_MAX_W = 260    // ancho de barra para factor 1.27 (factor máximo)
const MAX_FACTOR = 1.27
const ROW_H = 26
const ROW_GAP = 7
const START_Y = 55

export function DiagramaFactorDT() {
    const refLineX = BAR_X + BAR_MAX_W * (1.00 / MAX_FACTOR)

    return (
        <figure className={styles.figure}>
            <svg
                viewBox="0 0 520 295"
                xmlns="http://www.w3.org/2000/svg"
                className={styles.svg}
                role="img"
                aria-label="Factor de corrección de potencia de radiadores según ΔT"
            >
                {/* Fondo */}
                <rect width="520" height="295" fill="var(--ct-ext-bg,#1a2332)" rx="8" />

                {/* ── Título ── */}
                <text x="260" y="22" fontSize="12.5" fill="currentColor" fontFamily="sans-serif"
                    fontWeight="700" opacity="0.9" textAnchor="middle">
                    Factor de corrección de potencia según ΔT
                </text>
                <text x="260" y="37" fontSize="9.5" fill="currentColor" fontFamily="sans-serif"
                    opacity="0.5" textAnchor="middle">
                    Potencia real = Potencia catálogo × factor · norma EN 442, n = 1,3
                </text>

                {/* Línea de referencia ΔT50 */}
                <line
                    x1={refLineX} y1={48}
                    x2={refLineX} y2={START_Y + DATOS.length * (ROW_H + ROW_GAP) - ROW_GAP + 4}
                    stroke="var(--ct-wall-stroke,#4b5563)" strokeWidth="0.8"
                    strokeDasharray="3,2" opacity="0.45"
                />

                {/* ── Filas ── */}
                {DATOS.map((d, i) => {
                    const rowY = START_Y + i * (ROW_H + ROW_GAP)
                    const textY = rowY + Math.round(ROW_H * 0.68)
                    const barW = Math.round((d.factor / MAX_FACTOR) * BAR_MAX_W)
                    const isSpecial = d.ref || d.typical

                    return (
                        <g key={i}>
                            {/* Fondo de fila especial */}
                            {isSpecial && (
                                <rect x={0} y={rowY - 1} width={520} height={ROW_H + 2}
                                    fill={d.ref ? 'rgba(251,191,36,0.06)' : 'rgba(245,158,11,0.06)'} />
                            )}

                            {/* Etiqueta ΔT */}
                            <text
                                x={BAR_X - 7} y={textY}
                                fontSize="11" fill="currentColor" fontFamily="sans-serif"
                                textAnchor="end" opacity={isSpecial ? 1 : 0.7}
                                fontWeight={isSpecial ? '700' : '400'}
                            >
                                {d.dt}
                            </text>

                            {/* Barra */}
                            <rect
                                x={BAR_X} y={rowY + 1}
                                width={barW} height={ROW_H - 2} rx="3"
                                fill={d.color} opacity={isSpecial ? 0.9 : 0.6}
                            />

                            {/* Texto INSIDE barra para filas especiales */}
                            {d.ref && (
                                <text x={BAR_X + barW - 5} y={textY} fontSize="8"
                                    fill="rgba(0,0,0,0.75)" fontFamily="sans-serif"
                                    textAnchor="end" fontWeight="700">
                                    REFERENCIA EN 442
                                </text>
                            )}
                            {d.typical && (
                                <text x={BAR_X + barW - 5} y={textY} fontSize="8"
                                    fill="rgba(0,0,0,0.75)" fontFamily="sans-serif"
                                    textAnchor="end" fontWeight="700">
                                    TÍPICO ARGENTINA
                                </text>
                            )}

                            {/* Valor del factor */}
                            <text
                                x={BAR_X + barW + 7} y={textY}
                                fontSize="11" fill={d.color} fontFamily="sans-serif"
                                fontWeight="700" opacity={isSpecial ? 1 : 0.8}
                            >
                                {d.factor.toFixed(2)}
                            </text>
                        </g>
                    )
                })}

                {/* ── Ejemplo numérico ── */}
                {/* Cuadro de ejemplo en la esquina derecha */}
                <rect x="368" y="148" width="140" height="86" rx="6"
                    fill="var(--ct-int-bg,#0f172a)" opacity="0.6"
                    stroke="var(--ct-wall-stroke,#4b5563)" strokeWidth="1" />
                <text x="438" y="163" fontSize="9.5" fill="currentColor" fontFamily="sans-serif"
                    textAnchor="middle" fontWeight="700" opacity="0.85">Ejemplo ΔT45</text>
                <line x1="376" y1="167" x2="500" y2="167"
                    stroke="var(--ct-wall-stroke,#4b5563)" strokeWidth="0.7" opacity="0.4" />
                <text x="376" y="180" fontSize="9" fill="currentColor" fontFamily="sans-serif"
                    opacity="0.6">Catálogo: 1.000 Kcal/h</text>
                <text x="376" y="193" fontSize="9" fill="currentColor" fontFamily="sans-serif"
                    opacity="0.6">× factor 0,87 =</text>
                <text x="376" y="208" fontSize="10.5" fill="var(--ct-door,#f59e0b)"
                    fontFamily="sans-serif" fontWeight="700">870 Kcal/h reales</text>
                <text x="376" y="221" fontSize="8.5" fill="currentColor" fontFamily="sans-serif"
                    opacity="0.45">130 Kcal/h que no llegan al cuarto</text>

                {/* ── Nota inferior ── */}
                <text x="260" y="279" fontSize="9.5" fill="currentColor" fontFamily="sans-serif"
                    textAnchor="middle" opacity="0.4">
                    ΔT = temperatura media del agua − temperatura del cuarto · a mayor ΔT, mayor potencia real
                </text>
            </svg>
            <figcaption className={styles.caption}>
                El catálogo siempre declara la potencia a ΔT50 (norma EN 442). Si tu instalación trabaja a otra
                temperatura, aplicá el factor correspondiente. Una caldera a gas moderna a 70/60°C con cuarto
                a 20°C → ΔT45 → factor 0,87: un radiador de 1.000 Kcal/h de catálogo entrega sólo 870 Kcal/h reales.
            </figcaption>
        </figure>
    )
}
