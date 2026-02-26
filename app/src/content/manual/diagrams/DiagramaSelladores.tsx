import styles from './Diagrams.module.css'

/**
 * Diagrama comparativo de selladores para instalaciones de calefacción:
 * cuatro tarjetas mostrando aptitud, temperatura máxima y uso recomendado.
 */
export function DiagramaSelladores() {
    const items = [
        {
            nombre: 'Teflón (PTFE)',
            subtitulo: 'Cinta standard',
            tempMax: 60,
            tempBar: 0.25, // proporción sobre 240°C
            colorBorder: '#ef4444',
            colorBg: 'rgba(239,68,68,0.08)',
            colorTemp: '#ef4444',
            si: ['Agua fría', 'ACS hasta 60°C'],
            no: ['Calefacción', 'Vapor', 'Ciclos de dilatación'],
            nota: 'Se vuelve quebradizo y pierde sellado bajo trabajo mecánico',
        },
        {
            nombre: 'Cáñamo + Pasta',
            subtitulo: 'Fibra + sellante',
            tempMax: 130,
            tempBar: 0.54,
            colorBorder: '#fbbf24',
            colorBg: 'rgba(251,191,36,0.08)',
            colorTemp: '#fbbf24',
            si: ['Calefacción', 'ACS', 'Gas (con pasta apta)'],
            no: ['Sin pasta nunca', 'Agua estancada prolongada'],
            nota: 'Combinación clásica y confiable. El cáñamo solo no sella.',
        },
        {
            nombre: 'Pasta sellante',
            subtitulo: 'Junta flexible',
            tempMax: 150,
            tempBar: 0.63,
            colorBorder: '#22c55e',
            colorBg: 'rgba(34,197,94,0.08)',
            colorTemp: '#22c55e',
            si: ['Calefacción', 'ACS', 'Combinado con cáñamo'],
            no: ['Verificar compatibilidad', 'No todos son iguales'],
            nota: 'Absorbe dilatación y contracción. Verificar temperatura máxima del producto.',
        },
        {
            nombre: 'Anaeróbico',
            subtitulo: 'Sella por vacío',
            tempMax: 180,
            tempBar: 0.75,
            colorBorder: '#60a5fa',
            colorBg: 'rgba(96,165,250,0.08)',
            colorTemp: '#60a5fa',
            si: ['Calefacción', 'Zonas de vibración', 'Uniones definitivas'],
            no: ['Desmontaje sin calentamiento', 'Superficies sucias'],
            nota: 'Sellado rígido y permanente. Requiere desengrasado. Desmontaje requiere calor.',
        },
    ]

    const cardW = 112
    const cardH = 195
    const gapX = 10
    const startX = 10
    const startY = 20

    return (
        <figure className={styles.figure}>
            <svg
                viewBox="0 0 480 255"
                xmlns="http://www.w3.org/2000/svg"
                className={styles.svg}
                role="img"
                aria-label="Comparativa de selladores para instalaciones de calefacción: teflón, cáñamo con pasta, pasta sellante y anaeróbico"
            >
                {/* Fondo */}
                <rect width="480" height="255" fill="var(--ct-ext-bg, #1a2332)" rx="8" />

                {/* Título */}
                <text x="240" y="14" fontSize="10" fill="currentColor" fontFamily="sans-serif"
                    textAnchor="middle" opacity="0.5">
                    Aptitud por tipo de sellador — instalaciones de calefacción (70–90°C)
                </text>

                {items.map((item, i) => {
                    const cx = startX + i * (cardW + gapX)
                    const cy = startY

                    return (
                        <g key={i}>
                            {/* Tarjeta fondo */}
                            <rect x={cx} y={cy} width={cardW} height={cardH} rx="6"
                                fill={item.colorBg}
                                stroke={item.colorBorder} strokeWidth="1.5" />

                            {/* Header */}
                            <rect x={cx} y={cy} width={cardW} height={30} rx="6"
                                fill={item.colorBorder} fillOpacity="0.2" />
                            <rect x={cx} y={cy + 24} width={cardW} height={6}
                                fill={item.colorBorder} fillOpacity="0.2" />
                            <text x={cx + cardW / 2} y={cy + 12} fontSize="10.5"
                                fill={item.colorBorder} fontFamily="sans-serif"
                                textAnchor="middle" fontWeight="700">{item.nombre}</text>
                            <text x={cx + cardW / 2} y={cy + 23} fontSize="8"
                                fill="currentColor" fontFamily="sans-serif"
                                textAnchor="middle" opacity="0.6">{item.subtitulo}</text>

                            {/* Barra de temperatura */}
                            <text x={cx + 8} y={cy + 42} fontSize="8" fill="currentColor"
                                fontFamily="sans-serif" opacity="0.5">Temp. máx.</text>
                            <rect x={cx + 8} y={cy + 45} width={cardW - 16} height={7} rx="3.5"
                                fill="var(--ct-int-bg, #0f172a)" fillOpacity="0.5" />
                            <rect x={cx + 8} y={cy + 45} width={(cardW - 16) * item.tempBar} height={7} rx="3.5"
                                fill={item.colorTemp} opacity="0.7" />
                            <text x={cx + cardW - 8} y={cy + 52} fontSize="8"
                                fill={item.colorTemp} fontFamily="sans-serif"
                                textAnchor="end" fontWeight="700">{item.tempMax}°C</text>

                            {/* Separador */}
                            <line x1={cx + 8} y1={cy + 59} x2={cx + cardW - 8} y2={cy + 59}
                                stroke="currentColor" strokeWidth="0.5" opacity="0.15" />

                            {/* Checkmarks — apto para */}
                            <text x={cx + 8} y={cy + 69} fontSize="8" fill="#22c55e"
                                fontFamily="sans-serif" opacity="0.8" fontWeight="600">✓ Apto</text>
                            {item.si.map((s, j) => (
                                <text key={j} x={cx + 8} y={cy + 79 + j * 11} fontSize="8"
                                    fill="currentColor" fontFamily="sans-serif" opacity="0.75">
                                    · {s}
                                </text>
                            ))}

                            {/* Separador */}
                            <line x1={cx + 8} y1={cy + 79 + item.si.length * 11 + 2}
                                x2={cx + cardW - 8} y2={cy + 79 + item.si.length * 11 + 2}
                                stroke="currentColor" strokeWidth="0.5" opacity="0.15" />

                            {/* X — no apto */}
                            <text x={cx + 8} y={cy + 79 + item.si.length * 11 + 13}
                                fontSize="8" fill="#ef4444" fontFamily="sans-serif"
                                opacity="0.8" fontWeight="600">✗ Evitar</text>
                            {item.no.map((n, j) => (
                                <text key={j}
                                    x={cx + 8}
                                    y={cy + 79 + item.si.length * 11 + 23 + j * 11}
                                    fontSize="7.5" fill="currentColor" fontFamily="sans-serif" opacity="0.6">
                                    · {n}
                                </text>
                            ))}

                            {/* Nota al pie */}
                            <foreignObject x={cx + 6} y={cy + cardH - 42} width={cardW - 12} height={40}>
                                <div
                                    style={{
                                        fontSize: '7px',
                                        color: 'rgba(255,255,255,0.45)',
                                        lineHeight: '1.4',
                                        fontFamily: 'sans-serif',
                                    }}>
                                    {item.nota}
                                </div>
                            </foreignObject>
                        </g>
                    )
                })}

                {/* Leyenda temperatura */}
                <text x="10" y="228" fontSize="8.5" fill="currentColor"
                    fontFamily="sans-serif" opacity="0.4">
                    Barra de temperatura: referencia relativa sobre 240°C máx.
                    Agua de calefacción estándar: 70–90°C. Temperatura de diseño según normativa IRAM.
                </text>
            </svg>
            <figcaption className={styles.caption}>
                Comparativa de los cuatro selladores más usados en plomería y calefacción.
                El teflón en cinta es el más común pero el menos apto para calefacción:
                no tolera los ciclos de dilatación y contracción. La combinación cáñamo + pasta
                sellante sigue siendo la opción más confiable y versátil para instalaciones hidrónicas.
            </figcaption>
        </figure>
    )
}
