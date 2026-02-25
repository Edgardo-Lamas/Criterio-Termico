import styles from './Diagrams.module.css'

/**
 * Diagrama de inercia térmica:
 * Gráfico lineal comparando cómo tres sistemas mantienen la temperatura
 * cuando se activan y luego se apagan (ciclo de 8 horas).
 */
export function DiagramaInercia() {
    // Dimensiones del área del gráfico
    const gx = 70   // x inicio eje
    const gy = 20   // y inicio eje (arriba)
    const gw = 390  // ancho del gráfico
    const gh = 170  // alto del gráfico
    const gb = gy + gh  // y base (eje x)

    // Temperatura: 14°C (mín) a 24°C (máx) — 10 grados de rango
    const tMin = 14
    const tMax = 24
    const tRange = tMax - tMin

    // Convertir temp + tiempo a coordenadas SVG
    const tx = (hora: number) => gx + (hora / 8) * gw
    const ty = (temp: number) => gb - ((temp - tMin) / tRange) * gh

    // ── Curva A: Radiadores de agua (inercia alta)
    // Sube despacio, llega a 22°C ~1.5h, se mantiene estable, baja lento al apagar
    const radiadores = `
        M ${tx(0)},${ty(15)}
        C ${tx(0.5)},${ty(16)} ${tx(1)},${ty(19)} ${tx(1.5)},${ty(21.5)}
        C ${tx(2)},${ty(22)} ${tx(3)},${ty(22)} ${tx(4)},${ty(22)}
        C ${tx(4.2)},${ty(22)} ${tx(4.5)},${ty(21.8)}
        L ${tx(5)},${ty(21.5)}
        C ${tx(5.5)},${ty(21)} ${tx(6)},${ty(20.5)} ${tx(6.5)},${ty(20)}
        C ${tx(7)},${ty(19.2)} ${tx(7.5)},${ty(18.5)} ${tx(8)},${ty(17.5)}
    `.replace(/\s+/g, ' ')

    // ── Curva B: Split calefacción (inercia baja)
    // Sube rápido a 21°C, cicla ON/OFF (pequeñas oscilaciones), baja MUY rápido al apagar
    const split = `
        M ${tx(0)},${ty(15)}
        C ${tx(0.3)},${ty(18)} ${tx(0.6)},${ty(20.5)} ${tx(0.8)},${ty(21)}
        L ${tx(1.2)},${ty(21.5)}
        C ${tx(1.4)},${ty(22)} ${tx(1.6)},${ty(21)} ${tx(1.8)},${ty(21.8)}
        C ${tx(2)},${ty(22)} ${tx(2.2)},${ty(21)} ${tx(2.4)},${ty(21.8)}
        C ${tx(2.6)},${ty(22)} ${tx(2.8)},${ty(21)} ${tx(3)},${ty(21.8)}
        C ${tx(3.2)},${ty(22)} ${tx(3.4)},${ty(21)} ${tx(3.6)},${ty(21.8)}
        C ${tx(3.8)},${ty(22)} ${tx(4)},${ty(21.5)}
        L ${tx(4.1)},${ty(21)}
        C ${tx(4.3)},${ty(19)} ${tx(4.5)},${ty(17.5)} ${tx(5)},${ty(16)}
        C ${tx(5.5)},${ty(15.2)} ${tx(6)},${ty(15)} ${tx(8)},${ty(15)}
    `.replace(/\s+/g, ' ')

    // ── Curva C: Estufa eléctrica por convección (sin inercia)
    // Cicla agresivamente ON/OFF, picos y caídas, baja inmediatamente al apagar
    const estufa = [
        [0, 15], [0.15, 19], [0.3, 15], [0.45, 19], [0.6, 15],
        [0.75, 19], [0.9, 15], [1.05, 19], [1.2, 15],
        [1.35, 19], [1.5, 15], [1.65, 19], [1.8, 15],
        [1.95, 19], [2.1, 15], [2.25, 19], [2.4, 15],
        [2.55, 19], [2.7, 15], [2.85, 19], [3.0, 15],
        [3.15, 19], [3.3, 15], [3.45, 19], [3.6, 15],
        [3.75, 19], [3.9, 15], [4.0, 15],
        [4.05, 15], [8, 15]
    ]
    const estufaPath = estufa.map(([h, t], i) =>
        `${i === 0 ? 'M' : 'L'} ${tx(h).toFixed(1)},${ty(t).toFixed(1)}`
    ).join(' ')

    // Líneas de grilla horizontales (cada 2°C)
    const gridTemps = [16, 18, 20, 22]
    // Líneas de grilla verticales (cada 2h)
    const gridHours = [0, 2, 4, 6, 8]

    return (
        <figure className={styles.figure}>
            <svg
                viewBox="0 0 520 240"
                xmlns="http://www.w3.org/2000/svg"
                className={styles.svg}
                role="img"
                aria-label="Gráfico de inercia térmica: comparativa de cómo mantienen la temperatura los radiadores, el split y la estufa eléctrica"
            >
                {/* Fondo */}
                <rect width="520" height="240" fill="var(--ct-ext-bg, #1a2332)" rx="8" />

                {/* ── Grilla ── */}
                {gridTemps.map(t => (
                    <g key={t}>
                        <line x1={gx} y1={ty(t)} x2={gx + gw} y2={ty(t)}
                            stroke="currentColor" strokeWidth="0.5" opacity="0.15" />
                        <text x={gx - 6} y={ty(t) + 4} fontSize="9" fill="currentColor"
                            fontFamily="sans-serif" textAnchor="end" opacity="0.5">{t}°</text>
                    </g>
                ))}
                {gridHours.map(h => (
                    <g key={h}>
                        <line x1={tx(h)} y1={gy} x2={tx(h)} y2={gb}
                            stroke="currentColor" strokeWidth="0.5" opacity="0.15" />
                        <text x={tx(h)} y={gb + 14} fontSize="9" fill="currentColor"
                            fontFamily="sans-serif" textAnchor="middle" opacity="0.5">{h}h</text>
                    </g>
                ))}

                {/* ── Ejes ── */}
                <line x1={gx} y1={gy} x2={gx} y2={gb} stroke="currentColor" strokeWidth="1" opacity="0.3" />
                <line x1={gx} y1={gb} x2={gx + gw} y2={gb} stroke="currentColor" strokeWidth="1" opacity="0.3" />

                {/* Etiqueta confort */}
                <line x1={gx} y1={ty(20)} x2={gx + gw} y2={ty(20)}
                    stroke="#22c55e" strokeWidth="1" strokeDasharray="8,4" opacity="0.4" />
                <text x={gx + gw + 4} y={ty(20) + 4} fontSize="9" fill="#22c55e"
                    fontFamily="sans-serif" opacity="0.7">confort</text>

                {/* Zona de ENCENDIDO / APAGADO */}
                <rect x={tx(0)} y={gy} width={tx(4) - tx(0)} height={gh}
                    fill="#22c55e" fillOpacity="0.04" />
                <rect x={tx(4)} y={gy} width={tx(8) - tx(4)} height={gh}
                    fill="#ef4444" fillOpacity="0.04" />
                <text x={(tx(0) + tx(4)) / 2} y={gy + 12} fontSize="9" fill="#22c55e"
                    fontFamily="sans-serif" textAnchor="middle" opacity="0.5">● Sistema encendido</text>
                <text x={(tx(4) + tx(8)) / 2} y={gy + 12} fontSize="9" fill="#ef4444"
                    fontFamily="sans-serif" textAnchor="middle" opacity="0.5">○ Sistema apagado</text>

                {/* ── Curva Estufa eléctrica (primero, queda abajo) ── */}
                <path d={estufaPath}
                    fill="none" stroke="var(--ct-window-dim, #3b82f6)" strokeWidth="1.5" opacity="0.6" />

                {/* ── Curva Split ── */}
                <path d={split}
                    fill="none" stroke="var(--ct-window, #60a5fa)" strokeWidth="2" opacity="0.8" />

                {/* ── Curva Radiadores ── */}
                <path d={radiadores}
                    fill="none" stroke="var(--ct-sun, #fbbf24)" strokeWidth="2.5" opacity="0.9" />

                {/* ── Leyenda ── */}
                <rect x={gx + 10} y={gb + 22} width="170" height="34" rx="4"
                    fill="var(--ct-int-bg, #0f172a)" opacity="0.7" />

                {/* Radiadores */}
                <line x1={gx + 18} y1={gb + 32} x2={gx + 38} y2={gb + 32}
                    stroke="var(--ct-sun, #fbbf24)" strokeWidth="2.5" />
                <text x={gx + 42} y={gb + 36} fontSize="10" fill="var(--ct-sun, #fbbf24)"
                    fontFamily="sans-serif" fontWeight="600">Radiadores (agua)</text>

                {/* Split */}
                <line x1={gx + 18} y1={gb + 47} x2={gx + 38} y2={gb + 47}
                    stroke="var(--ct-window, #60a5fa)" strokeWidth="2" />
                <text x={gx + 42} y={gb + 51} fontSize="10" fill="var(--ct-window, #60a5fa)"
                    fontFamily="sans-serif">Split calefacción</text>

                {/* Estufa */}
                <rect x={gx + 185} y={gb + 22} width="200" height="34" rx="4"
                    fill="var(--ct-int-bg, #0f172a)" opacity="0.7" />
                <line x1={gx + 193} y1={gb + 32} x2={gx + 213} y2={gb + 32}
                    stroke="var(--ct-window-dim, #3b82f6)" strokeWidth="1.5" />
                <text x={gx + 217} y={gb + 36} fontSize="10" fill="var(--ct-window-dim, #3b82f6)"
                    fontFamily="sans-serif" opacity="0.8">Estufa eléctrica</text>
                <text x={gx + 193} y={gb + 51} fontSize="9" fill="currentColor"
                    fontFamily="sans-serif" opacity="0.5">oscilación por ciclos ON/OFF</text>

                {/* Título eje Y */}
                <text
                    x={gx - 40}
                    y={gy + gh / 2}
                    fontSize="9"
                    fill="currentColor"
                    fontFamily="sans-serif"
                    opacity="0.5"
                    textAnchor="middle"
                    transform={`rotate(-90, ${gx - 40}, ${gy + gh / 2})`}
                >
                    Temperatura ambiente (°C)
                </text>

                {/* Título eje X */}
                <text x={gx + gw / 2} y={gb + 15} fontSize="9" fill="currentColor"
                    fontFamily="sans-serif" textAnchor="middle" opacity="0.5">
                    Tiempo (horas)
                </text>
            </svg>
            <figcaption className={styles.caption}>
                Comparativa de inercia térmica: los radiadores de agua suben despacio pero mantienen
                la temperatura con suavidad y, al apagarse, ceden calor gradualmente durante horas.
                El split sube rápido pero enfría casi de inmediato. La estufa eléctrica cicla
                constantemente sin estabilizar el ambiente.
            </figcaption>
        </figure>
    )
}
