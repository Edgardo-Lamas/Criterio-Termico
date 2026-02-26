import styles from './Diagrams.module.css'

/**
 * Diagrama del problema del pasivador incompatible con aluminio:
 * Izquierda — reacción química Al + H₂O → Al₂O₃ + H₂↑
 * Derecha — curva de presión del sistema: normal vs con acumulación de H₂
 */
export function DiagramaPasivador() {
    // Curva presión normal (térmica)
    const normal = [
        [0, 1.5], [1, 1.6], [2, 1.8], [3, 2.0], [4, 1.9],
        [5, 1.8], [6, 1.7], [7, 1.6], [8, 1.5],
    ]
    // Curva con acumulación de H₂ (sube progresivamente)
    const h2 = [
        [0, 1.5], [1, 1.8], [2, 2.2], [3, 2.7], [3.5, 3.0],
        [3.6, 2.2], // válvula de seguridad abre → baja
        [4, 2.5], [4.5, 3.0],
        [4.6, 2.2], // vuelve a abrir
        [5, 2.7], [5.5, 3.0],
        [5.6, 2.2],
        [6, 2.8], [6.5, 3.0],
    ]

    // Área del gráfico
    const gx = 290, gy = 22, gw = 210, gh = 150
    const gb = gy + gh
    const pMin = 0.5, pMax = 3.5, pRange = pMax - pMin
    const hMax = 8

    const px = (h: number) => gx + (h / hMax) * gw
    const py = (p: number) => gb - ((p - pMin) / pRange) * gh

    const toPath = (pts: number[][]) =>
        pts.map(([h, p], i) => `${i === 0 ? 'M' : 'L'} ${px(h).toFixed(1)},${py(p).toFixed(1)}`).join(' ')

    return (
        <figure className={styles.figure}>
            <svg
                viewBox="0 0 520 230"
                xmlns="http://www.w3.org/2000/svg"
                className={styles.svg}
                role="img"
                aria-label="Reacción del pasivador con aluminio: producción de H₂ y aumento de presión en el sistema"
            >
                {/* Fondo */}
                <rect width="520" height="230" fill="var(--ct-ext-bg, #1a2332)" rx="8" />

                {/* Separador */}
                <line x1="272" y1="12" x2="272" y2="210"
                    stroke="var(--ct-wall-stroke, #4b5563)" strokeWidth="1"
                    strokeDasharray="5,4" opacity="0.3" />

                {/* ═══════ LADO IZQUIERDO — Reacción química ═══════ */}
                <text x="136" y="20" fontSize="10" fill="currentColor" fontFamily="sans-serif"
                    textAnchor="middle" opacity="0.6" fontWeight="600">
                    Reacción en el interior del radiador
                </text>

                {/* Sección transversal del panel radiador */}
                {/* Pared aluminio izquierda */}
                <rect x="18" y="30" width="18" height="130" rx="3"
                    fill="var(--ct-wall-ext, #374151)" stroke="#9ca3af" strokeWidth="1.5" />
                <text x="27" y="172" fontSize="7" fill="#9ca3af" fontFamily="sans-serif"
                    textAnchor="middle" opacity="0.7" transform="rotate(-90 27 172)">Aluminio (Al)</text>

                {/* Pared aluminio derecha */}
                <rect x="224" y="30" width="18" height="130" rx="3"
                    fill="var(--ct-wall-ext, #374151)" stroke="#9ca3af" strokeWidth="1.5" />

                {/* Interior con agua */}
                <rect x="36" y="30" width="188" height="130" rx="0"
                    fill="var(--ct-window, #60a5fa)" fillOpacity="0.08" />

                {/* Capa de óxido (Al₂O₃) — protectora */}
                <rect x="36" y="30" width="10" height="130"
                    fill="#fbbf24" fillOpacity="0.35" />
                <rect x="214" y="30" width="10" height="130"
                    fill="#fbbf24" fillOpacity="0.35" />
                <text x="41" y="92" fontSize="6.5" fill="#fbbf24" fontFamily="sans-serif"
                    textAnchor="middle" opacity="0.9"
                    transform="rotate(-90 41 92)">Al₂O₃ ←protección</text>

                {/* Burbujas de H₂ */}
                {[
                    [80, 140, 5], [110, 120, 4], [140, 100, 6],
                    [90, 80, 3], [160, 75, 5], [75, 60, 4],
                    [130, 50, 3], [170, 45, 6], [100, 38, 4],
                ].map(([bx, by, r], i) => (
                    <g key={i}>
                        <circle cx={bx} cy={by} r={r}
                            fill="none" stroke="#22c55e" strokeWidth="1" opacity="0.6" />
                        <line x1={bx} y1={by - r} x2={bx} y2={by - r - 8}
                            stroke="#22c55e" strokeWidth="0.8" opacity="0.4"
                            markerEnd="none" />
                    </g>
                ))}

                {/* Flecha burbujas subiendo */}
                <text x="130" y="175" fontSize="9" fill="#22c55e" fontFamily="sans-serif"
                    textAnchor="middle" opacity="0.8">H₂ ↑ (gas hidrógeno)</text>

                {/* Ecuación química */}
                <rect x="18" y="185" width="245" height="34" rx="4"
                    fill="var(--ct-int-bg, #0f172a)" fillOpacity="0.7" />
                <text x="140" y="198" fontSize="9.5" fill="currentColor" fontFamily="monospace"
                    textAnchor="middle" opacity="0.5">Reacción (pH alcalino):</text>
                <text x="140" y="212" fontSize="10" fill="#fbbf24" fontFamily="monospace"
                    textAnchor="middle" fontWeight="700">
                    2Al + 2NaOH + 2H₂O → 2NaAlO₂ + 3H₂↑
                </text>

                {/* ═══════ LADO DERECHO — Curva de presión ═══════ */}
                <text x={gx + gw / 2} y="16" fontSize="10" fill="currentColor" fontFamily="sans-serif"
                    textAnchor="middle" opacity="0.6" fontWeight="600">
                    Presión del sistema en el tiempo
                </text>

                {/* Grilla */}
                {[1.5, 2.0, 2.5, 3.0].map(p => (
                    <g key={p}>
                        <line x1={gx} y1={py(p)} x2={gx + gw} y2={py(p)}
                            stroke="currentColor" strokeWidth="0.5" opacity="0.1" />
                        <text x={gx - 4} y={py(p) + 3} fontSize="8" fill="currentColor"
                            fontFamily="sans-serif" textAnchor="end" opacity="0.4">{p}</text>
                    </g>
                ))}

                {/* Línea 3 bar — seguridad */}
                <line x1={gx} y1={py(3.0)} x2={gx + gw} y2={py(3.0)}
                    stroke="#ef4444" strokeWidth="1.5" strokeDasharray="6,3" opacity="0.6" />
                <text x={gx + gw + 3} y={py(3.0) + 3} fontSize="8" fill="#ef4444"
                    fontFamily="sans-serif" opacity="0.8">3 bar</text>
                <text x={gx + gw + 3} y={py(3.0) + 12} fontSize="7" fill="#ef4444"
                    fontFamily="sans-serif" opacity="0.6">válvula</text>

                {/* Ejes */}
                <line x1={gx} y1={gy} x2={gx} y2={gb}
                    stroke="currentColor" strokeWidth="1" opacity="0.3" />
                <line x1={gx} y1={gb} x2={gx + gw} y2={gb}
                    stroke="currentColor" strokeWidth="1" opacity="0.3" />
                <text x={gx - 4} y={gb + 3} fontSize="8" fill="currentColor"
                    fontFamily="sans-serif" textAnchor="end" opacity="0.4">0h</text>
                <text x={gx + gw} y={gb + 12} fontSize="8" fill="currentColor"
                    fontFamily="sans-serif" textAnchor="middle" opacity="0.4">tiempo →</text>
                <text x={gx - 28} y={gy + gh / 2} fontSize="8" fill="currentColor"
                    fontFamily="sans-serif" textAnchor="middle" opacity="0.4"
                    transform={`rotate(-90 ${gx - 28} ${gy + gh / 2})`}>Presión (bar)</text>

                {/* Curva normal */}
                <path d={toPath(normal)} fill="none"
                    stroke="var(--ct-window, #60a5fa)" strokeWidth="2" opacity="0.7" />
                <text x={px(8.2)} y={py(1.5) + 3} fontSize="8" fill="var(--ct-window, #60a5fa)"
                    fontFamily="sans-serif" opacity="0.8">normal</text>

                {/* Curva H₂ */}
                <path d={toPath(h2)} fill="none"
                    stroke="#ef4444" strokeWidth="2" opacity="0.85" />

                {/* Anotaciones en la curva H₂ */}
                <text x={px(3.5) - 2} y={py(3.0) - 8} fontSize="8" fill="#ef4444"
                    fontFamily="sans-serif" textAnchor="middle" fontWeight="700">↓ abre</text>

                {/* Puntos de apertura de válvula */}
                {[[3.5, 3.0], [4.5, 3.0], [5.5, 3.0]].map(([h, p], i) => (
                    <circle key={i} cx={px(h)} cy={py(p)} r="3"
                        fill="#ef4444" opacity="0.7" />
                ))}

                {/* Etiqueta curva H₂ */}
                <rect x={px(1)} y={py(2.4)} width="72" height="20" rx="3"
                    fill="#ef4444" fillOpacity="0.15" />
                <text x={px(1) + 6} y={py(2.4) + 9} fontSize="8" fill="#ef4444"
                    fontFamily="sans-serif" fontWeight="600">Con H₂ acumulado</text>
                <text x={px(1) + 6} y={py(2.4) + 18} fontSize="7.5" fill="#ef4444"
                    fontFamily="sans-serif" opacity="0.8">válvula cicla y repite</text>

                {/* Nota vaso de expansión */}
                <rect x={gx} y={gb + 14} width={gw} height="28" rx="4"
                    fill="var(--ct-int-bg, #0f172a)" fillOpacity="0.7" />
                <text x={gx + gw / 2} y={gb + 25} fontSize="8.5" fill="#fbbf24"
                    fontFamily="sans-serif" textAnchor="middle" fontWeight="600">
                    El vaso de expansión no compensa gases
                </text>
                <text x={gx + gw / 2} y={gb + 36} fontSize="7.5" fill="currentColor"
                    fontFamily="sans-serif" textAnchor="middle" opacity="0.6">
                    Está dimensionado solo para dilatación de agua líquida
                </text>
            </svg>
            <figcaption className={styles.caption}>
                En presencia de un pasivador alcalino incompatible, el aluminio reacciona
                de forma continua liberando H₂. A diferencia de la expansión térmica normal
                (línea azul, oscila con temperatura), el H₂ acumulado eleva la presión
                progresivamente hasta accionar la válvula de seguridad repetidas veces.
                El vaso de expansión no puede compensarlo porque está diseñado para absorber
                líquido, no gas no condensable.
            </figcaption>
        </figure>
    )
}
