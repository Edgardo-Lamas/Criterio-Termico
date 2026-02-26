import styles from './Diagrams.module.css'

/**
 * Diagrama de dimensionado de caldera:
 * Suma de potencias por ambiente → ÷0.80 → potencia de caldera correcta
 * Incluye comparativa corto-ciclado vs operación normal.
 */
export function DiagramaCaldera() {
    // Ambientes de ejemplo
    const ambientes = [
        { nombre: 'Living', kcal: 4219 },
        { nombre: 'Dormitorio 1', kcal: 1950 },
        { nombre: 'Dormitorio 2', kcal: 1820 },
        { nombre: 'Cocina', kcal: 1563 },
        { nombre: 'Baño', kcal: 500 },
    ]
    const total = ambientes.reduce((a, b) => a + b.kcal, 0) // 10052
    const caldera = Math.round(total / 0.8)

    // Dimensiones layout
    const boxW = 90, boxH = 26, gapY = 6
    const startX = 22, startY = 38

    return (
        <figure className={styles.figure}>
            <svg
                viewBox="0 0 520 270"
                xmlns="http://www.w3.org/2000/svg"
                className={styles.svg}
                role="img"
                aria-label="Diagrama de dimensionado de caldera: suma de potencias de ambientes dividida por 0.80"
            >
                <defs>
                    <marker id="arr-c" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
                        <path d="M0,0 L0,7 L7,3.5 z" fill="currentColor" opacity="0.4" />
                    </marker>
                    <marker id="arr-c-ok" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
                        <path d="M0,0 L0,7 L7,3.5 z" fill="#22c55e" />
                    </marker>
                    <marker id="arr-c-bad" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
                        <path d="M0,0 L0,7 L7,3.5 z" fill="#ef4444" />
                    </marker>
                </defs>

                {/* Fondo */}
                <rect width="520" height="270" fill="var(--ct-ext-bg, #1a2332)" rx="8" />

                {/* ═══ Columna 1: Ambientes ═══ */}
                <text x={startX + boxW / 2} y="28" fontSize="10" fill="currentColor"
                    fontFamily="sans-serif" textAnchor="middle" opacity="0.5">Ambientes</text>

                {ambientes.map((a, i) => (
                    <g key={i}>
                        <rect x={startX} y={startY + i * (boxH + gapY)} width={boxW} height={boxH} rx="4"
                            fill="var(--ct-wall-ext, #374151)" stroke="var(--ct-wall-stroke, #4b5563)" strokeWidth="1" />
                        <text x={startX + 6} y={startY + i * (boxH + gapY) + 11} fontSize="9"
                            fill="currentColor" fontFamily="sans-serif" opacity="0.8">{a.nombre}</text>
                        <text x={startX + boxW - 6} y={startY + i * (boxH + gapY) + 11} fontSize="9"
                            fill="var(--ct-sun, #fbbf24)" fontFamily="sans-serif"
                            textAnchor="end" fontWeight="700">{a.kcal.toLocaleString()}</text>
                        <text x={startX + boxW - 6} y={startY + i * (boxH + gapY) + 21} fontSize="8"
                            fill="currentColor" fontFamily="sans-serif"
                            textAnchor="end" opacity="0.4">Kcal/h</text>
                        {/* Líneas de suma convergiendo */}
                        <line
                            x1={startX + boxW} y1={startY + i * (boxH + gapY) + boxH / 2}
                            x2={startX + boxW + 18} y2={startY + i * (boxH + gapY) + boxH / 2}
                            stroke="currentColor" strokeWidth="1" opacity="0.3" />
                    </g>
                ))}

                {/* Llave de suma */}
                {(() => {
                    const ly1 = startY + boxH / 2
                    const ly2 = startY + (ambientes.length - 1) * (boxH + gapY) + boxH / 2
                    const lx = startX + boxW + 18
                    const mid = (ly1 + ly2) / 2
                    return (
                        <path d={`M ${lx},${ly1} L ${lx + 8},${ly1} L ${lx + 8},${mid - 4} Q ${lx + 14},${mid} ${lx + 8},${mid + 4} L ${lx + 8},${ly2} L ${lx},${ly2}`}
                            fill="none" stroke="currentColor" strokeWidth="1" opacity="0.3" />
                    )
                })()}

                {/* ═══ Bloque SUMA ═══ */}
                <rect x="170" y="80" width="84" height="40" rx="5"
                    fill="var(--ct-int-bg, #0f172a)" fillOpacity="0.8"
                    stroke="var(--ct-sun, #fbbf24)" strokeWidth="1.5" strokeOpacity="0.5" />
                <text x="212" y="95" fontSize="10" fill="currentColor" fontFamily="sans-serif"
                    textAnchor="middle" opacity="0.6">Suma total</text>
                <text x="212" y="110" fontSize="12" fill="var(--ct-sun, #fbbf24)" fontFamily="sans-serif"
                    textAnchor="middle" fontWeight="800">{total.toLocaleString()} Kcal/h</text>

                {/* Flecha a la división */}
                <line x1="254" y1="100" x2="280" y2="100" stroke="currentColor" strokeWidth="1.5"
                    markerEnd="url(#arr-c)" />

                {/* ═══ Bloque ÷ 0.80 ═══ */}
                <rect x="282" y="76" width="70" height="48" rx="5"
                    fill="var(--ct-int-bg, #0f172a)" fillOpacity="0.8"
                    stroke="var(--ct-window, #60a5fa)" strokeWidth="2" />
                <text x="317" y="94" fontSize="11" fill="var(--ct-window, #60a5fa)" fontFamily="sans-serif"
                    textAnchor="middle" opacity="0.7">÷ 0.80</text>
                <text x="317" y="108" fontSize="9" fill="currentColor" fontFamily="sans-serif"
                    textAnchor="middle" opacity="0.5">caldera al</text>
                <text x="317" y="118" fontSize="9" fill="currentColor" fontFamily="sans-serif"
                    textAnchor="middle" opacity="0.5">80% carga</text>

                {/* Flecha a la caldera */}
                <line x1="352" y1="100" x2="376" y2="100" stroke="#22c55e" strokeWidth="2"
                    markerEnd="url(#arr-c-ok)" />

                {/* ═══ Ícono CALDERA ═══ */}
                {/* Cuerpo */}
                <rect x="378" y="64" width="58" height="72" rx="6"
                    fill="var(--ct-wall-ext, #374151)" stroke="#22c55e" strokeWidth="2" />
                {/* Panel */}
                <rect x="386" y="72" width="42" height="28" rx="3"
                    fill="var(--ct-int-bg, #0f172a)" fillOpacity="0.6" />
                {/* Indicador */}
                <circle cx="407" cy="86" r="8" fill="#22c55e" fillOpacity="0.2" stroke="#22c55e" strokeWidth="1.5" />
                <text x="407" y="90" fontSize="9" fill="#22c55e" fontFamily="sans-serif" textAnchor="middle">OK</text>
                {/* Llama */}
                <path d="M 395,102 Q 393,96 397,93 Q 394,100 399,97 Q 397,103 402,100 Q 400,104 404,102 Q 402,108 397,107 Q 392,108 395,102 z"
                    fill="var(--ct-sun, #fbbf24)" opacity="0.8" />
                {/* Tuberías */}
                <rect x="399" y="136" width="8" height="12" rx="2"
                    fill="var(--ct-wall-stroke, #4b5563)" />
                <rect x="411" y="136" width="8" height="12" rx="2"
                    fill="var(--ct-wall-stroke, #4b5563)" />
                {/* Potencia caldera */}
                <text x="407" y="158" fontSize="10" fill="#22c55e" fontFamily="sans-serif"
                    textAnchor="middle" fontWeight="700">{caldera.toLocaleString()}</text>
                <text x="407" y="168" fontSize="8.5" fill="#22c55e" fontFamily="sans-serif"
                    textAnchor="middle">Kcal/h</text>

                {/* ═══ Zona inferior: corto-ciclado ═══ */}
                <line x1="20" y1="195" x2="500" y2="195" stroke="currentColor" strokeWidth="0.5" opacity="0.15" />

                <text x="260" y="210" fontSize="10" fill="currentColor" fontFamily="sans-serif"
                    textAnchor="middle" opacity="0.5">¿Qué pasa si la caldera está sobredimensionada?</text>

                {/* Ciclo rápido ON/OFF */}
                {(() => {
                    const baseY = 235
                    const pts: [number, number][] = [
                        [22, baseY], [30, baseY - 16], [48, baseY - 16], [56, baseY],
                        [64, baseY - 16], [82, baseY - 16], [90, baseY],
                        [98, baseY - 16], [116, baseY - 16], [124, baseY],
                        [132, baseY - 16], [150, baseY - 16], [158, baseY],
                    ]
                    const d = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x},${y}`).join(' ')
                    return (
                        <>
                            <path d={d} fill="none" stroke="#ef4444" strokeWidth="1.5" opacity="0.7" />
                            <text x="90" y="252" fontSize="9" fill="#ef4444" fontFamily="sans-serif"
                                textAnchor="middle" opacity="0.8">Corto-ciclado</text>
                            <text x="90" y="262" fontSize="8" fill="currentColor" fontFamily="sans-serif"
                                textAnchor="middle" opacity="0.5">caldera sobredimensionada</text>
                        </>
                    )
                })()}

                {/* Ciclo largo */}
                {(() => {
                    const baseY = 235
                    const pts: [number, number][] = [
                        [200, baseY], [210, baseY - 16],
                        [320, baseY - 16],
                        [330, baseY],
                        [400, baseY],
                        [410, baseY - 16],
                        [480, baseY - 16],
                        [490, baseY],
                    ]
                    const d = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x},${y}`).join(' ')
                    return (
                        <>
                            <path d={d} fill="none" stroke="#22c55e" strokeWidth="1.5" opacity="0.7" />
                            <text x="345" y="252" fontSize="9" fill="#22c55e" fontFamily="sans-serif"
                                textAnchor="middle" opacity="0.8">Ciclo largo (correcto)</text>
                            <text x="345" y="262" fontSize="8" fill="currentColor" fontFamily="sans-serif"
                                textAnchor="middle" opacity="0.5">caldera bien dimensionada al 80%</text>
                        </>
                    )
                })()}
            </svg>
            <figcaption className={styles.caption}>
                Flujo de cálculo: la suma de las potencias de todos los ambientes se divide
                por 0.80 para obtener la potencia de caldera — así la caldera trabaja al 80% de
                su capacidad en el día de diseño. Una caldera sobredimensionada genera corto-ciclado:
                ciclos muy cortos que acortan la vida útil del intercambiador.
            </figcaption>
        </figure>
    )
}
