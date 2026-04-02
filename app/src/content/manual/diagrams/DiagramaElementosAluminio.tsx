import styles from './Diagrams.module.css'

/**
 * Diagrama frontal de radiador de columna de aluminio:
 * muestra anatomía básica, dimensiones y tabla de potencia por elemento.
 */
export function DiagramaElementosAluminio() {
    const numElem = 5
    const eW = 36, eH = 150, gap = 5
    const startX = 90, startY = 70

    const elementos = Array.from({ length: numElem }, (_, i) => i)
    const niples = Array.from({ length: numElem - 1 }, (_, i) => i)

    return (
        <figure className={styles.figure}>
            <svg
                viewBox="0 0 520 295"
                xmlns="http://www.w3.org/2000/svg"
                className={styles.svg}
                role="img"
                aria-label="Radiador de columna de aluminio: vista frontal y datos de potencia por elemento"
            >
                {/* Fondo */}
                <rect width="520" height="295" fill="var(--ct-ext-bg,#1a2332)" rx="8" />

                {/* ── Título ── */}
                <text x="178" y="26" fontSize="12" fill="currentColor" fontFamily="sans-serif"
                    fontWeight="700" opacity="0.85" textAnchor="middle">
                    Radiador de columna de aluminio
                </text>
                <text x="178" y="41" fontSize="9.5" fill="currentColor" fontFamily="sans-serif"
                    opacity="0.5" textAnchor="middle">
                    vista frontal · 5 elementos · altura nominal 600 mm
                </text>

                {/* ── Elementos de aluminio ── */}
                {elementos.map(i => {
                    const ex = startX + i * (eW + gap)
                    return (
                        <g key={i}>
                            <rect x={ex} y={startY} width={eW} height={eH} rx="3"
                                fill="var(--ct-wall-ext,#374151)"
                                stroke="var(--ct-wall-stroke,#4b5563)" strokeWidth="1.5" />
                            {/* Columnas internas simuladas */}
                            <line x1={ex + 11} y1={startY + 7} x2={ex + 11} y2={startY + eH - 7}
                                stroke="var(--ct-wall-stroke,#4b5563)" strokeWidth="0.8" opacity="0.5" />
                            <line x1={ex + 25} y1={startY + 7} x2={ex + 25} y2={startY + eH - 7}
                                stroke="var(--ct-wall-stroke,#4b5563)" strokeWidth="0.8" opacity="0.5" />
                        </g>
                    )
                })}

                {/* ── Niples de unión ── */}
                {niples.map(i => {
                    const nx = startX + (i + 1) * (eW + gap) - gap
                    return (
                        <g key={i}>
                            <rect x={nx} y={startY + 15} width={gap} height={9} rx="1"
                                fill="var(--ct-sun-dim,#d97706)" opacity="0.75" />
                            <rect x={nx} y={startY + eH - 24} width={gap} height={9} rx="1"
                                fill="var(--ct-sun-dim,#d97706)" opacity="0.75" />
                        </g>
                    )
                })}

                {/* ── Tapón final derecho ── */}
                <rect
                    x={startX + numElem * (eW + gap) - gap}
                    y={startY} width={9} height={eH} rx="2"
                    fill="var(--ct-wall-ext,#374151)"
                    stroke="var(--ct-wall-stroke,#4b5563)" strokeWidth="1.5"
                />

                {/* ── Conexiones izquierda (entrada / retorno) ── */}
                <rect x={55} y={startY + 15} width={startX - 55} height={9} rx="2"
                    fill="var(--ct-window,#60a5fa)" opacity="0.75" />
                <rect x={55} y={startY + eH - 24} width={startX - 55} height={9} rx="2"
                    fill="var(--ct-cold,#93c5fd)" opacity="0.65" />

                {/* Etiquetas de temperatura */}
                <text x={53} y={startY + 23} fontSize="9" fill="var(--ct-window,#60a5fa)"
                    fontFamily="sans-serif" textAnchor="end" fontWeight="600">75°C ▶</text>
                <text x={53} y={startY + eH - 16} fontSize="9" fill="var(--ct-cold,#93c5fd)"
                    fontFamily="sans-serif" textAnchor="end">◀ 65°C</text>

                {/* ── Dimensión altura ── */}
                <line x1={22} y1={startY} x2={22} y2={startY + eH}
                    stroke="currentColor" strokeWidth="0.8" opacity="0.4" />
                <line x1={16} y1={startY} x2={28} y2={startY}
                    stroke="currentColor" strokeWidth="0.8" opacity="0.4" />
                <line x1={16} y1={startY + eH} x2={28} y2={startY + eH}
                    stroke="currentColor" strokeWidth="0.8" opacity="0.4" />
                <text x={12} y={startY + eH / 2} fontSize="10" fill="currentColor"
                    fontFamily="sans-serif" textAnchor="middle" opacity="0.6" fontWeight="600"
                    transform={`rotate(-90 12 ${startY + eH / 2})`}>
                    600 mm
                </text>

                {/* ── Dimensión por elemento ── */}
                <line x1={startX} y1={startY + eH + 20} x2={startX + eW} y2={startY + eH + 20}
                    stroke="currentColor" strokeWidth="0.8" opacity="0.35" />
                <line x1={startX} y1={startY + eH + 14} x2={startX} y2={startY + eH + 26}
                    stroke="currentColor" strokeWidth="0.8" opacity="0.35" />
                <line x1={startX + eW} y1={startY + eH + 14} x2={startX + eW} y2={startY + eH + 26}
                    stroke="currentColor" strokeWidth="0.8" opacity="0.35" />
                <text x={startX + eW / 2} y={startY + eH + 37} fontSize="9" fill="currentColor"
                    fontFamily="sans-serif" textAnchor="middle" opacity="0.5">~45 mm</text>

                {/* ── Anotación: Niple de unión ── */}
                {/* Apunta al niple entre elementos 2 y 3 (x≈208-213, y≈85) */}
                <line x1={211} y1={startY + 15} x2={232} y2={52}
                    stroke="var(--ct-sun,#fbbf24)" strokeWidth="0.8"
                    strokeDasharray="3,2" opacity="0.65" />
                <text x={235} y={50} fontSize="9.5" fill="var(--ct-sun,#fbbf24)"
                    fontFamily="sans-serif" opacity="0.8">Niple de unión</text>

                {/* ── Panel de datos ── */}
                <rect x="308" y="52" width="198" height="193" rx="8"
                    fill="var(--ct-int-bg,#0f172a)" opacity="0.55"
                    stroke="var(--ct-wall-stroke,#4b5563)" strokeWidth="1" />

                <text x="407" y="73" fontSize="11" fill="currentColor" fontFamily="sans-serif"
                    textAnchor="middle" fontWeight="700" opacity="0.9">
                    Potencia por elemento
                </text>
                <text x="407" y="86" fontSize="9" fill="currentColor" fontFamily="sans-serif"
                    textAnchor="middle" opacity="0.45">
                    catálogo a ΔT50 (norma EN 442)
                </text>

                <line x1="316" y1="92" x2="498" y2="92"
                    stroke="var(--ct-wall-stroke,#4b5563)" strokeWidth="0.8" opacity="0.5" />

                {[
                    { h: '500 mm', k: '120' },
                    { h: '600 mm', k: '150', highlight: true },
                    { h: '700 mm', k: '173' },
                    { h: '800 mm', k: '193' },
                ].map((row, i) => {
                    const ry = 109 + i * 25
                    return (
                        <g key={i}>
                            {row.highlight && (
                                <rect x="314" y={ry - 15} width="184" height="22" rx="4"
                                    fill="var(--ct-window,#60a5fa)" opacity="0.12" />
                            )}
                            <text x="326" y={ry} fontSize="11"
                                fill={row.highlight ? 'var(--ct-window,#60a5fa)' : 'currentColor'}
                                fontFamily="sans-serif"
                                fontWeight={row.highlight ? '700' : '400'}>
                                {row.h}{row.highlight ? ' ★' : ''}
                            </text>
                            <text x="470" y={ry} fontSize="11"
                                fill={row.highlight ? 'var(--ct-window,#60a5fa)' : 'currentColor'}
                                fontFamily="sans-serif" textAnchor="middle"
                                fontWeight={row.highlight ? '700' : '600'}>
                                {row.k} Kcal/h
                            </text>
                        </g>
                    )
                })}

                <line x1="316" y1="205" x2="498" y2="205"
                    stroke="var(--ct-wall-stroke,#4b5563)" strokeWidth="0.8" opacity="0.4" />

                <text x="407" y="218" fontSize="9" fill="currentColor" fontFamily="sans-serif"
                    textAnchor="middle" opacity="0.45">★ La más usada en Argentina</text>
                <text x="407" y="231" fontSize="9" fill="currentColor" fontFamily="sans-serif"
                    textAnchor="middle" opacity="0.45">Varía ±5% según fabricante</text>

                {/* ── Nota inferior ── */}
                <text x="178" y="279" fontSize="9.5" fill="currentColor" fontFamily="sans-serif"
                    textAnchor="middle" opacity="0.4">
                    Potencia total del radiador = nº de elementos × potencia por elemento
                </text>
            </svg>
            <figcaption className={styles.caption}>
                Vista frontal de un radiador de columna de aluminio de 600 mm de altura. Se compone de
                elementos individuales conectados por niples de bronce (que unen las cámaras superiores
                e inferiores de cada par de elementos). La potencia declarada en catálogo es por elemento
                a ΔT50 según norma EN 442.
            </figcaption>
        </figure>
    )
}
