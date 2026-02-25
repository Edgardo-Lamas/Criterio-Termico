import styles from './Diagrams.module.css'

/**
 * Diagrama comparativo de valores U (transmitancia térmica):
 * barras horizontales mostrando cuánto pierde cada cerramiento.
 * Mayor barra = más pérdida.
 */
export function DiagramaValoresU() {
    // Eje: 0 a 6.0 W/m²·K
    const maxU = 6.2
    const barAreaW = 300  // ancho máximo de barra
    const rowH = 32
    const startX = 190   // donde arranca la barra
    const startY = 28

    const items: {
        label: string
        sublabel: string
        u: number
        color: string
        note?: string
    }[] = [
        { label: 'Pared con aislación (EPS 5cm)', sublabel: 'U = 0.4', u: 0.4, color: '#22c55e' },
        { label: 'DVH + marco RPT', sublabel: 'U = 1.6', u: 1.6, color: '#86efac' },
        { label: 'Pared ladrillo hueco 18 cm', sublabel: 'U = 1.4', u: 1.4, color: '#fbbf24' },
        { label: 'Losa hormigón con aislación', sublabel: 'U = 0.55', u: 0.55, color: '#4ade80' },
        { label: 'Losa hormigón sin aislación', sublabel: 'U = 3.0', u: 3.0, color: '#f97316' },
        { label: 'DVH (4–6–4 mm)', sublabel: 'U = 3.0', u: 3.0, color: '#fb923c' },
        { label: 'Vidrio simple 4 mm', sublabel: 'U = 5.7', u: 5.7, color: '#ef4444', note: '× 4 vs pared' },
    ]

    const totalH = startY + items.length * rowH + 60

    return (
        <figure className={styles.figure}>
            <svg
                viewBox={`0 0 520 ${totalH}`}
                xmlns="http://www.w3.org/2000/svg"
                className={styles.svg}
                role="img"
                aria-label="Comparativa de transmitancia térmica U de distintos cerramientos: mayor barra indica mayor pérdida de calor"
            >
                {/* Fondo */}
                <rect width="520" height={totalH} fill="var(--ct-ext-bg, #1a2332)" rx="8" />

                {/* Título */}
                <text x="260" y="18" fontSize="11" fill="currentColor" fontFamily="sans-serif"
                    textAnchor="middle" opacity="0.7" fontWeight="600">
                    Transmitancia térmica U (W/m²·K) — mayor valor = más pérdida de calor
                </text>

                {/* Grilla de referencia */}
                {[1, 2, 3, 4, 5, 6].map(v => {
                    const x = startX + (v / maxU) * barAreaW
                    return (
                        <g key={v}>
                            <line x1={x} y1={startY} x2={x} y2={startY + items.length * rowH}
                                stroke="currentColor" strokeWidth="0.5" opacity="0.1" />
                            <text x={x} y={startY + items.length * rowH + 14}
                                fontSize="9" fill="currentColor" fontFamily="sans-serif"
                                textAnchor="middle" opacity="0.4">{v}</text>
                        </g>
                    )
                })}

                {/* Barras */}
                {items.map((item, i) => {
                    const y = startY + i * rowH
                    const barW = (item.u / maxU) * barAreaW
                    const midY = y + rowH / 2

                    return (
                        <g key={i}>
                            {/* Barra */}
                            <rect
                                x={startX}
                                y={y + 5}
                                width={barW}
                                height={rowH - 12}
                                rx="3"
                                fill={item.color}
                                opacity="0.8"
                            />

                            {/* Etiqueta izquierda */}
                            <text x={startX - 8} y={midY - 2} fontSize="10" fill="currentColor"
                                fontFamily="sans-serif" textAnchor="end" opacity="0.85">
                                {item.label}
                            </text>
                            <text x={startX - 8} y={midY + 10} fontSize="9" fill={item.color}
                                fontFamily="sans-serif" textAnchor="end" fontWeight="700" opacity="0.9">
                                {item.sublabel}
                            </text>

                            {/* Nota al final de la barra */}
                            {item.note && (
                                <text x={startX + barW + 6} y={midY + 4}
                                    fontSize="9" fill={item.color} fontFamily="sans-serif"
                                    fontWeight="700" opacity="0.9">
                                    {item.note}
                                </text>
                            )}
                        </g>
                    )
                })}

                {/* Zona de referencia "zona confort" */}
                <rect x={startX} y={startY} width={(1.5 / maxU) * barAreaW} height={items.length * rowH}
                    fill="#22c55e" fillOpacity="0.05" />
                <text x={startX + (0.75 / maxU) * barAreaW}
                    y={startY + items.length * rowH + 26}
                    fontSize="9" fill="#22c55e" fontFamily="sans-serif"
                    textAnchor="middle" opacity="0.6">
                    ← zona eficiente
                </text>

                {/* Zona de referencia "alto valor U" */}
                <rect x={startX + (3 / maxU) * barAreaW} y={startY}
                    width={(3.2 / maxU) * barAreaW} height={items.length * rowH}
                    fill="#ef4444" fillOpacity="0.04" />
                <text x={startX + (4.6 / maxU) * barAreaW}
                    y={startY + items.length * rowH + 26}
                    fontSize="9" fill="#ef4444" fontFamily="sans-serif"
                    textAnchor="middle" opacity="0.6">
                    alta pérdida →
                </text>

                {/* Nota unidades */}
                <text x="260" y={totalH - 8} fontSize="9" fill="currentColor" fontFamily="sans-serif"
                    textAnchor="middle" opacity="0.4">
                    W/m²·K: vatios por metro cuadrado por grado de diferencia de temperatura
                </text>
            </svg>
            <figcaption className={styles.caption}>
                Comparativa de transmitancia térmica (valor U) de los cerramientos más comunes en
                Argentina. Un vidrio simple pierde 5.7 veces más calor por metro cuadrado que una
                pared con aislación. Identificar los cerramientos con mayor U es el primer paso
                para elegir el factor térmico correcto en el cálculo.
            </figcaption>
        </figure>
    )
}
