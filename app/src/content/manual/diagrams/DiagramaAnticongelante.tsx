import styles from './Diagrams.module.css'

/**
 * Diagrama de protección anticongelante:
 * Izquierda — escala de temperatura con los puntos de activación de la caldera
 * Derecha — concentración de glicol vs temperatura de congelamiento
 */
export function DiagramaAnticongelante() {
    // Escala de temperatura: -25°C a +20°C
    const tMin = -25, tMax = 20, tRange = tMax - tMin

    // Layout lado izquierdo (termómetro de la caldera)
    const lx = 30, ly = 20, lh = 180
    const tY = (t: number) => ly + ((tMax - t) / tRange) * lh

    // Datos de concentración glicol
    const concentraciones = [
        { pct: 25, freeze: -10, label: '25%', color: '#fbbf24', note: 'Zona I–II (Bs As, Córdoba)' },
        { pct: 33, freeze: -16, label: '33%', color: '#f97316', note: 'Zona III (Cuyo, Sierras)' },
        { pct: 40, freeze: -25, label: '40%', color: '#ef4444', note: 'Zona IV–V (Patagonia)' },
        { pct: 50, freeze: -37, label: '50%', color: '#dc2626', note: 'Límite práctico — no superar' },
    ]

    return (
        <figure className={styles.figure}>
            <svg
                viewBox="0 0 520 235"
                xmlns="http://www.w3.org/2000/svg"
                className={styles.svg}
                role="img"
                aria-label="Protección anticongelante: activación caldera y concentraciones de glicol por zona climática"
            >
                {/* Fondo */}
                <rect width="520" height="235" fill="var(--ct-ext-bg, #1a2332)" rx="8" />

                {/* Separador */}
                <line x1="220" y1="12" x2="220" y2="215"
                    stroke="var(--ct-wall-stroke, #4b5563)" strokeWidth="1"
                    strokeDasharray="5,4" opacity="0.3" />

                {/* ═══════ LADO IZQUIERDO — Escala caldera ═══════ */}
                <text x="110" y="16" fontSize="10" fill="currentColor" fontFamily="sans-serif"
                    textAnchor="middle" opacity="0.6" fontWeight="600">Protección de la caldera</text>

                {/* Termómetro */}
                <rect x={lx} y={ly} width="14" height={lh} rx="7"
                    fill="var(--ct-int-bg, #0f172a)" stroke="var(--ct-wall-stroke, #4b5563)" strokeWidth="1" />

                {/* Zona riesgo (debajo de 3°C) — rojo */}
                <rect x={lx} y={tY(3)} width="14" height={tY(-25) - tY(3)} rx="0"
                    fill="#ef4444" fillOpacity="0.25" />
                {/* Zona precaución (3°C a 8°C) — naranja */}
                <rect x={lx} y={tY(8)} width="14" height={tY(3) - tY(8)} rx="0"
                    fill="#f97316" fillOpacity="0.25" />
                {/* Zona segura (sobre 8°C) — verde */}
                <rect x={lx} y={tY(20)} width="14" height={tY(8) - tY(20)} rx="7"
                    fill="#22c55e" fillOpacity="0.2" />

                {/* Marcas de temperatura */}
                {[-20, -10, 0, 10, 20].map(t => (
                    <g key={t}>
                        <line x1={lx - 4} y1={tY(t)} x2={lx} y2={tY(t)}
                            stroke="currentColor" strokeWidth="1" opacity="0.4" />
                        <text x={lx - 6} y={tY(t) + 3} fontSize="8" fill="currentColor"
                            fontFamily="sans-serif" textAnchor="end" opacity="0.5">{t}°</text>
                    </g>
                ))}

                {/* Línea 0°C */}
                <line x1={lx - 8} y1={tY(0)} x2={lx + 90} y2={tY(0)}
                    stroke="var(--ct-window, #60a5fa)" strokeWidth="1" strokeDasharray="4,2" opacity="0.5" />
                <text x={lx + 92} y={tY(0) + 3} fontSize="8" fill="var(--ct-window, #60a5fa)"
                    fontFamily="sans-serif" opacity="0.7">0°C agua pura</text>

                {/* Punto 8°C — bomba */}
                <line x1={lx} y1={tY(8)} x2={lx + 80} y2={tY(8)}
                    stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="3,2" opacity="0.7" />
                <circle cx={lx + 7} cy={tY(8)} r="4" fill="#fbbf24" opacity="0.8" />
                <rect x={lx + 82} y={tY(8) - 10} width="106" height="20" rx="3"
                    fill="#fbbf24" fillOpacity="0.12" />
                <text x={lx + 85} y={tY(8) - 1} fontSize="8.5" fill="#fbbf24"
                    fontFamily="sans-serif" fontWeight="600">8°C → arranca bomba</text>
                <text x={lx + 85} y={tY(8) + 9} fontSize="7.5" fill="currentColor"
                    fontFamily="sans-serif" opacity="0.6">circulación previene congelamiento</text>

                {/* Punto 3°C — quemador */}
                <line x1={lx} y1={tY(3)} x2={lx + 80} y2={tY(3)}
                    stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3,2" opacity="0.7" />
                <circle cx={lx + 7} cy={tY(3)} r="4" fill="#ef4444" opacity="0.8" />
                <rect x={lx + 82} y={tY(3) - 10} width="106" height="20" rx="3"
                    fill="#ef4444" fillOpacity="0.12" />
                <text x={lx + 85} y={tY(3) - 1} fontSize="8.5" fill="#ef4444"
                    fontFamily="sans-serif" fontWeight="600">3°C → enciende quemador</text>
                <text x={lx + 85} y={tY(3) + 9} fontSize="7.5" fill="currentColor"
                    fontFamily="sans-serif" opacity="0.6">lleva el agua a 20°C</text>

                {/* Nota: requiere electricidad y gas */}
                <rect x={lx} y={ly + lh + 8} width="188" height="24" rx="4"
                    fill="#ef4444" fillOpacity="0.1" stroke="#ef4444" strokeWidth="1" strokeOpacity="0.3" />
                <text x={lx + 94} y={ly + lh + 18} fontSize="8" fill="#ef4444"
                    fontFamily="sans-serif" textAnchor="middle">⚠ Solo funciona con luz y gas</text>
                <text x={lx + 94} y={ly + lh + 27} fontSize="7.5" fill="currentColor"
                    fontFamily="sans-serif" textAnchor="middle" opacity="0.5">corte de suministro = sin protección</text>

                {/* ═══════ LADO DERECHO — Glicol ═══════ */}
                <text x="370" y="16" fontSize="10" fill="currentColor" fontFamily="sans-serif"
                    textAnchor="middle" opacity="0.6" fontWeight="600">Concentración de glicol</text>

                {/* Barras de concentración */}
                {concentraciones.map((c, i) => {
                    const barY = 28 + i * 44
                    const barW = (c.pct / 50) * 170
                    return (
                        <g key={i}>
                            {/* Barra */}
                            <rect x="232" y={barY} width={barW} height="22" rx="4"
                                fill={c.color} fillOpacity="0.7" />
                            {/* % label */}
                            <text x="232" y={barY + 15} fontSize="11" fill="white"
                                fontFamily="sans-serif" fontWeight="800"
                                dx="8">{c.label}</text>
                            {/* Temperatura de congelamiento */}
                            <text x={232 + barW + 6} y={barY + 15} fontSize="11"
                                fill={c.color} fontFamily="sans-serif" fontWeight="700">
                                {c.freeze}°C
                            </text>
                            {/* Nota zona */}
                            <text x="232" y={barY + 35} fontSize="8" fill="currentColor"
                                fontFamily="sans-serif" opacity="0.6">{c.note}</text>
                        </g>
                    )
                })}

                {/* Nota límite 50% */}
                <rect x="232" y="208" width="278" height="18" rx="4"
                    fill="var(--ct-int-bg, #0f172a)" fillOpacity="0.6" />
                <text x="371" y="220" fontSize="8" fill="currentColor" fontFamily="sans-serif"
                    textAnchor="middle" opacity="0.5">
                    Superar el 50% reduce la eficiencia y puede volverse corrosivo
                </text>
            </svg>
            <figcaption className={styles.caption}>
                La protección anticongelante de la caldera (bomba a 8°C, quemador a 3°C)
                depende de que haya electricidad y gas disponibles. El glicol en el agua
                es la protección real e independiente: 25% alcanza para el área metropolitana,
                40% para zonas patagónicas con inviernos de -20°C.
            </figcaption>
        </figure>
    )
}
