import styles from './Diagrams.module.css'

/**
 * Planta esquemática de una habitación con cotas.
 * Muestra cómo medir largo, ancho y la posición de ventanas y puertas.
 */
export function DiagramaMedicionPlanta() {
    return (
        <figure className={styles.figure}>
            <svg
                viewBox="0 0 520 340"
                xmlns="http://www.w3.org/2000/svg"
                className={styles.svg}
                role="img"
                aria-label="Planta esquemática de habitación con cotas de medición"
            >
                <defs>
                    {/* Punta de flecha */}
                    <marker id="arrow-m" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                        <path d="M0,0 L0,6 L8,3 z" fill="currentColor" />
                    </marker>
                    <marker id="arrow-m-rev" markerWidth="8" markerHeight="8" refX="2" refY="3" orient="auto">
                        <path d="M8,0 L8,6 L0,3 z" fill="currentColor" />
                    </marker>
                </defs>

                {/* ── Área exterior (fondo) ── */}
                <rect x="0" y="0" width="520" height="340" fill="var(--ct-ext-bg, #1a2332)" rx="8" />

                {/* Etiqueta EXTERIOR */}
                <text x="30" y="30" fontSize="11" fill="var(--ct-ext-text, #64748b)" fontFamily="sans-serif" fontWeight="600" letterSpacing="1">EXTERIOR</text>

                {/* ── Paredes ── */}
                {/* Pared norte (arriba) — pared exterior */}
                <rect x="80" y="55" width="320" height="14" fill="var(--ct-wall-ext, #374151)" />
                {/* Pared sur (abajo) */}
                <rect x="80" y="241" width="320" height="14" fill="var(--ct-wall-ext, #374151)" />
                {/* Pared oeste (izq) */}
                <rect x="80" y="55" width="14" height="200" fill="var(--ct-wall-ext, #374151)" />
                {/* Pared este (der) */}
                <rect x="386" y="55" width="14" height="200" fill="var(--ct-wall-ext, #374151)" />

                {/* ── Interior ── */}
                <rect x="94" y="69" width="292" height="172" fill="var(--ct-int-bg, #0f172a)" />

                {/* Etiqueta INTERIOR */}
                <text x="240" y="160" fontSize="13" fill="var(--ct-int-text, #94a3b8)" fontFamily="sans-serif" textAnchor="middle" fontWeight="600">INTERIOR</text>
                <text x="240" y="178" fontSize="11" fill="var(--ct-int-text-dim, #475569)" fontFamily="sans-serif" textAnchor="middle">20°C de diseño</text>

                {/* ── Ventana norte (pared superior) ── */}
                {/* Hueco en pared norte */}
                <rect x="190" y="55" width="90" height="14" fill="var(--ct-int-bg, #0f172a)" />
                {/* Marco de ventana */}
                <rect x="192" y="56" width="86" height="12" fill="none" stroke="var(--ct-window, #60a5fa)" strokeWidth="2" />
                {/* Línea central de vidrio */}
                <line x1="235" y1="56" x2="235" y2="68" stroke="var(--ct-window, #60a5fa)" strokeWidth="1" strokeDasharray="2,2" />
                {/* Etiqueta ventana */}
                <text x="235" y="48" fontSize="10" fill="var(--ct-window, #60a5fa)" fontFamily="sans-serif" textAnchor="middle">Ventana</text>
                <text x="235" y="38" fontSize="9" fill="var(--ct-window-dim, #3b82f6)" fontFamily="sans-serif" textAnchor="middle">1.20 m</text>

                {/* ── Puerta sur ── */}
                {/* Hueco en pared sur */}
                <rect x="130" y="241" width="60" height="14" fill="var(--ct-int-bg, #0f172a)" />
                {/* Arco de apertura */}
                <path d="M130,241 Q130,210 160,241" fill="none" stroke="var(--ct-door, #f59e0b)" strokeWidth="1.5" strokeDasharray="3,2" />
                <line x1="130" y1="241" x2="130" y2="255" stroke="var(--ct-door, #f59e0b)" strokeWidth="2" />
                {/* Etiqueta puerta */}
                <text x="160" y="275" fontSize="10" fill="var(--ct-door, #f59e0b)" fontFamily="sans-serif" textAnchor="middle">Puerta</text>

                {/* ── Cota LARGO (horizontal, abajo) ── */}
                <line x1="80" y1="295" x2="400" y2="295" stroke="currentColor" strokeWidth="1" opacity="0.5" markerStart="url(#arrow-m-rev)" markerEnd="url(#arrow-m)" />
                <line x1="80" y1="260" x2="80" y2="305" stroke="currentColor" strokeWidth="1" opacity="0.4" strokeDasharray="3,2" />
                <line x1="400" y1="260" x2="400" y2="305" stroke="currentColor" strokeWidth="1" opacity="0.4" strokeDasharray="3,2" />
                <rect x="195" y="283" width="90" height="16" fill="var(--ct-ext-bg, #1a2332)" />
                <text x="240" y="295" fontSize="12" fill="currentColor" fontFamily="sans-serif" textAnchor="middle" fontWeight="700">Largo (m)</text>

                {/* ── Cota ANCHO (vertical, derecha) ── */}
                <line x1="440" y1="55" x2="440" y2="255" stroke="currentColor" strokeWidth="1" opacity="0.5" markerStart="url(#arrow-m-rev)" markerEnd="url(#arrow-m)" />
                <line x1="395" y1="55" x2="450" y2="55" stroke="currentColor" strokeWidth="1" opacity="0.4" strokeDasharray="3,2" />
                <line x1="395" y1="255" x2="450" y2="255" stroke="currentColor" strokeWidth="1" opacity="0.4" strokeDasharray="3,2" />
                <rect x="445" y="140" width="70" height="16" fill="var(--ct-ext-bg, #1a2332)" />
                <text x="482" y="152" fontSize="12" fill="currentColor" fontFamily="sans-serif" textAnchor="middle" fontWeight="700" transform="rotate(90, 482, 152)">Ancho (m)</text>

                {/* ── Brújula norte ── */}
                <circle cx="460" cy="295" r="20" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.3" />
                <text x="460" y="285" fontSize="11" fill="var(--ct-north, #ef4444)" fontFamily="sans-serif" textAnchor="middle" fontWeight="900">N</text>
                <line x1="460" y1="288" x2="460" y2="279" stroke="var(--ct-north, #ef4444)" strokeWidth="2" markerEnd="url(#arrow-m)" />
                <text x="460" y="312" fontSize="9" fill="currentColor" fontFamily="sans-serif" textAnchor="middle" opacity="0.6">S</text>
                <text x="443" y="300" fontSize="9" fill="currentColor" fontFamily="sans-serif" textAnchor="middle" opacity="0.6">O</text>
                <text x="477" y="300" fontSize="9" fill="currentColor" fontFamily="sans-serif" textAnchor="middle" opacity="0.6">E</text>

                {/* ── Indicador pared exterior ── */}
                <text x="30" y="155" fontSize="10" fill="var(--ct-ext-text, #64748b)" fontFamily="sans-serif" textAnchor="middle">←</text>
                <text x="30" y="143" fontSize="9" fill="var(--ct-ext-text, #64748b)" fontFamily="sans-serif" textAnchor="middle">Pared</text>
                <text x="30" y="153" fontSize="9" fill="var(--ct-ext-text, #64748b)" fontFamily="sans-serif" textAnchor="middle">ext.</text>
            </svg>
            <figcaption className={styles.caption}>
                Planta esquemática: medí largo y ancho de cada ambiente. Marcá la posición
                de ventanas y puertas, e indicá cuál es la pared que da al exterior.
            </figcaption>
        </figure>
    )
}
