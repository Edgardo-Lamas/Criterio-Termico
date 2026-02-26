import styles from './Diagrams.module.css'

/**
 * Diagrama de transferencia de calor de un radiador:
 * muestra radiación (~40%) y convección (~60%) simultáneas.
 */
export function DiagramaRadiador() {
    return (
        <figure className={styles.figure}>
            <svg
                viewBox="0 0 520 310"
                xmlns="http://www.w3.org/2000/svg"
                className={styles.svg}
                role="img"
                aria-label="Diagrama de transferencia de calor: radiación y convección en un radiador"
            >
                <defs>
                    <marker id="arr-conv" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
                        <path d="M0,0 L0,7 L7,3.5 z" fill="var(--ct-window, #60a5fa)" />
                    </marker>
                    <marker id="arr-rad" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
                        <path d="M0,0 L0,7 L7,3.5 z" fill="var(--ct-sun, #fbbf24)" />
                    </marker>
                </defs>

                {/* Fondo */}
                <rect width="520" height="310" fill="var(--ct-ext-bg, #1a2332)" rx="8" />

                {/* ── Radiador (panel) ── */}
                {/* Cuerpo principal */}
                <rect x="160" y="110" width="200" height="110" rx="4"
                    fill="var(--ct-wall-ext, #374151)" stroke="var(--ct-wall-stroke, #4b5563)" strokeWidth="1.5" />
                {/* Aletas interiores (simulan los elementos) */}
                {[0, 1, 2, 3, 4, 5, 6].map(i => (
                    <rect key={i} x={170 + i * 26} y="120" width="12" height="90" rx="2"
                        fill="var(--ct-int-bg, #0f172a)" opacity="0.6" />
                ))}
                {/* Etiqueta del radiador */}
                <text x="260" y="238" fontSize="11" fill="currentColor" fontFamily="sans-serif"
                    textAnchor="middle" opacity="0.7">Radiador de agua caliente</text>
                {/* Temperatura del agua */}
                <text x="260" y="252" fontSize="10" fill="var(--ct-sun-dim, #d97706)" fontFamily="sans-serif"
                    textAnchor="middle">~70–80°C</text>

                {/* ── RADIACIÓN — ondas hacia los lados ── */}
                {/* Izquierda */}
                {[140, 165, 190].map(y => (
                    <g key={y}>
                        <path d={`M 155,${y} Q 145,${y - 5} 135,${y} Q 125,${y + 5} 115,${y} Q 105,${y - 5} 95,${y}`}
                            fill="none" stroke="var(--ct-sun, #fbbf24)" strokeWidth="1.5" opacity="0.8" />
                        <line x1="95" y1={y} x2="72" y2={y}
                            stroke="var(--ct-sun, #fbbf24)" strokeWidth="1.5" markerEnd="url(#arr-rad)" opacity="0.8" />
                    </g>
                ))}
                {/* Derecha */}
                {[140, 165, 190].map(y => (
                    <g key={y}>
                        <path d={`M 365,${y} Q 375,${y - 5} 385,${y} Q 395,${y + 5} 405,${y} Q 415,${y - 5} 425,${y}`}
                            fill="none" stroke="var(--ct-sun, #fbbf24)" strokeWidth="1.5" opacity="0.8" />
                        <line x1="425" y1={y} x2="448" y2={y}
                            stroke="var(--ct-sun, #fbbf24)" strokeWidth="1.5" markerEnd="url(#arr-rad)" opacity="0.8" />
                    </g>
                ))}

                {/* ── CONVECCIÓN — circulación de aire ── */}
                {/* Flecha sube (aire caliente) */}
                <path d="M 230,108 C 230,80 290,80 290,108"
                    fill="none" stroke="var(--ct-window, #60a5fa)" strokeWidth="2"
                    strokeDasharray="4,2" markerEnd="url(#arr-conv)" />
                {/* Flechas de circulación lateral */}
                <path d="M 220,108 C 180,70 130,65 115,90"
                    fill="none" stroke="var(--ct-window, #60a5fa)" strokeWidth="1.5"
                    strokeDasharray="3,2" markerEnd="url(#arr-conv)" opacity="0.7" />
                <path d="M 300,108 C 340,70 390,65 405,90"
                    fill="none" stroke="var(--ct-window, #60a5fa)" strokeWidth="1.5"
                    strokeDasharray="3,2" markerEnd="url(#arr-conv)" opacity="0.7" />
                {/* Etiqueta convección */}
                <text x="260" y="70" fontSize="11" fill="var(--ct-window, #60a5fa)" fontFamily="sans-serif"
                    textAnchor="middle" fontWeight="600">Convección</text>
                <text x="260" y="83" fontSize="10" fill="var(--ct-window, #60a5fa)" fontFamily="sans-serif"
                    textAnchor="middle" opacity="0.8">aire caliente sube · 55–65% del calor</text>

                {/* ── Etiquetas RADIACIÓN ── */}
                <text x="50" y="148" fontSize="11" fill="var(--ct-sun, #fbbf24)" fontFamily="sans-serif"
                    textAnchor="middle" fontWeight="600">Radiación</text>
                <text x="50" y="162" fontSize="9.5" fill="var(--ct-sun, #fbbf24)" fontFamily="sans-serif"
                    textAnchor="middle" opacity="0.8">infraroja</text>
                <text x="50" y="175" fontSize="9.5" fill="var(--ct-sun-dim, #d97706)" fontFamily="sans-serif"
                    textAnchor="middle" opacity="0.8">35–45% del calor</text>

                <text x="472" y="148" fontSize="11" fill="var(--ct-sun, #fbbf24)" fontFamily="sans-serif"
                    textAnchor="middle" fontWeight="600">Radiación</text>
                <text x="472" y="162" fontSize="9.5" fill="var(--ct-sun, #fbbf24)" fontFamily="sans-serif"
                    textAnchor="middle" opacity="0.8">infraroja</text>
                <text x="472" y="175" fontSize="9.5" fill="var(--ct-sun-dim, #d97706)" fontFamily="sans-serif"
                    textAnchor="middle" opacity="0.8">35–45% del calor</text>

                {/* ── Destino de la radiación ── */}
                {/* Pared izquierda */}
                <rect x="20" y="110" width="10" height="110" rx="2"
                    fill="var(--ct-sun, #fbbf24)" opacity="0.25" />
                <text x="25" y="275" fontSize="9" fill="currentColor" fontFamily="sans-serif"
                    textAnchor="middle" opacity="0.5">pared</text>
                {/* Pared derecha */}
                <rect x="490" y="110" width="10" height="110" rx="2"
                    fill="var(--ct-sun, #fbbf24)" opacity="0.25" />
                <text x="495" y="275" fontSize="9" fill="currentColor" fontFamily="sans-serif"
                    textAnchor="middle" opacity="0.5">pared</text>

                {/* ── Nota inferior ── */}
                <text x="260" y="290" fontSize="10" fill="currentColor" fontFamily="sans-serif"
                    textAnchor="middle" opacity="0.5">
                    La radiación calienta superficies y cuerpos directamente · La convección calienta el aire
                </text>
            </svg>
            <figcaption className={styles.caption}>
                Un radiador de agua caliente transfiere calor por dos vías simultáneas: radiación infrarroja
                (que calienta directamente paredes, piso y cuerpos) y convección natural (aire caliente que
                sube y circula). Esta combinación es lo que produce el "confort envolvente" del sistema.
            </figcaption>
        </figure>
    )
}
