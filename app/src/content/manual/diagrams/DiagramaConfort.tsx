import styles from './Diagrams.module.css'

/**
 * Diagrama comparativo de confort:
 * Izquierda — paredes frías, aire a 24°C → incómodo / más consumo
 * Derecha — paredes calentadas por radiador, aire a 20°C → confort real
 */
export function DiagramaConfort() {
    return (
        <figure className={styles.figure}>
            <svg
                viewBox="0 0 520 270"
                xmlns="http://www.w3.org/2000/svg"
                className={styles.svg}
                role="img"
                aria-label="Comparativa de confort: paredes frías con aire caliente vs paredes templadas con aire moderado"
            >
                {/* Fondo */}
                <rect width="520" height="270" fill="var(--ct-ext-bg, #1a2332)" rx="8" />

                {/* ── Separador central ── */}
                <line x1="260" y1="20" x2="260" y2="250" stroke="var(--ct-wall-stroke, #4b5563)" strokeWidth="1" strokeDasharray="6,4" />

                {/* ─────────── LADO IZQUIERDO — Paredes frías ─────────── */}
                {/* Habitación */}
                <rect x="20" y="40" width="215" height="160" rx="4"
                    fill="none" stroke="var(--ct-cold, #93c5fd)" strokeWidth="2" />
                {/* Gradiente frío en paredes */}
                <rect x="20" y="40" width="215" height="160" rx="4"
                    fill="var(--ct-cold, #93c5fd)" fillOpacity="0.07" />

                {/* Título lado */}
                <text x="127" y="32" fontSize="11" fill="var(--ct-cold, #93c5fd)" fontFamily="sans-serif"
                    textAnchor="middle" fontWeight="700">Estufa / convección</text>

                {/* Flecha temperatura aire */}
                <text x="50" y="95" fontSize="22" fill="var(--ct-cold, #93c5fd)" fontFamily="sans-serif"
                    textAnchor="middle" opacity="0.3">❄</text>
                <text x="50" y="140" fontSize="22" fill="var(--ct-cold, #93c5fd)" fontFamily="sans-serif"
                    textAnchor="middle" opacity="0.3">❄</text>
                <text x="205" y="95" fontSize="22" fill="var(--ct-cold, #93c5fd)" fontFamily="sans-serif"
                    textAnchor="middle" opacity="0.3">❄</text>
                <text x="205" y="140" fontSize="22" fill="var(--ct-cold, #93c5fd)" fontFamily="sans-serif"
                    textAnchor="middle" opacity="0.3">❄</text>

                {/* Termómetro — aire caliente */}
                <rect x="115" y="55" width="24" height="60" rx="12"
                    fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
                <rect x="119" y="75" width="16" height="36" rx="8"
                    fill="#ef4444" opacity="0.8" />
                <text x="127" y="130" fontSize="13" fill="#ef4444" fontFamily="sans-serif"
                    textAnchor="middle" fontWeight="700">24°C</text>
                <text x="127" y="143" fontSize="9" fill="currentColor" fontFamily="sans-serif"
                    textAnchor="middle" opacity="0.6">temperatura del aire</text>

                {/* Persona — incómoda */}
                {/* Cabeza */}
                <circle cx="127" cy="168" r="12" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.7" />
                {/* Cuerpo */}
                <line x1="127" y1="180" x2="127" y2="200" stroke="currentColor" strokeWidth="1.5" opacity="0.7" />
                {/* Brazos — cruzados (frío) */}
                <line x1="127" y1="186" x2="113" y2="193" stroke="currentColor" strokeWidth="1.5" opacity="0.7" />
                <line x1="127" y1="186" x2="141" y2="193" stroke="currentColor" strokeWidth="1.5" opacity="0.7" />
                {/* Piernas */}
                <line x1="127" y1="200" x2="118" y2="215" stroke="currentColor" strokeWidth="1.5" opacity="0.7" />
                <line x1="127" y1="200" x2="136" y2="215" stroke="currentColor" strokeWidth="1.5" opacity="0.7" />
                {/* Expresión incómoda */}
                <path d="M 121,170 Q 127,167 133,170" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.6" />

                {/* Nota energía */}
                <rect x="25" y="205" width="210" height="28" rx="4" fill="#ef4444" fillOpacity="0.12" />
                <text x="130" y="218" fontSize="10" fill="#ef4444" fontFamily="sans-serif"
                    textAnchor="middle" fontWeight="600">+15–25% de energía consumida</text>
                <text x="130" y="229" fontSize="9" fill="currentColor" fontFamily="sans-serif"
                    textAnchor="middle" opacity="0.6">para compensar paredes frías</text>

                {/* ─────────── LADO DERECHO — Radiador ─────────── */}
                {/* Habitación */}
                <rect x="285" y="40" width="215" height="160" rx="4"
                    fill="none" stroke="var(--ct-sun, #fbbf24)" strokeWidth="2" />
                {/* Gradiente cálido en paredes */}
                <rect x="285" y="40" width="215" height="160" rx="4"
                    fill="var(--ct-sun, #fbbf24)" fillOpacity="0.07" />

                {/* Título lado */}
                <text x="392" y="32" fontSize="11" fill="var(--ct-sun, #fbbf24)" fontFamily="sans-serif"
                    textAnchor="middle" fontWeight="700">Radiadores de agua caliente</text>

                {/* Mini-radiador abajo derecha */}
                <rect x="440" y="155" width="50" height="35" rx="3"
                    fill="var(--ct-wall-ext, #374151)" stroke="var(--ct-sun-dim, #d97706)" strokeWidth="1" />
                {[0, 1, 2].map(i => (
                    <rect key={i} x={445 + i * 15} y="160" width="8" height="25" rx="2"
                        fill="var(--ct-int-bg, #0f172a)" opacity="0.6" />
                ))}

                {/* Ondas de calor del radiador a las paredes */}
                {[65, 90, 115, 140].map((y, i) => (
                    <line key={i}
                        x1="485" y1={y} x2="500" y2={y}
                        stroke="var(--ct-sun, #fbbf24)" strokeWidth="1" opacity="0.3" />
                ))}

                {/* Termómetro — temperatura moderada */}
                <rect x="380" y="55" width="24" height="60" rx="12"
                    fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
                <rect x="384" y="90" width="16" height="21" rx="8"
                    fill="#22c55e" opacity="0.8" />
                <text x="392" y="130" fontSize="13" fill="#22c55e" fontFamily="sans-serif"
                    textAnchor="middle" fontWeight="700">20°C</text>
                <text x="392" y="143" fontSize="9" fill="currentColor" fontFamily="sans-serif"
                    textAnchor="middle" opacity="0.6">temperatura del aire</text>

                {/* Persona — cómoda */}
                {/* Cabeza */}
                <circle cx="332" cy="168" r="12" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.7" />
                {/* Cuerpo */}
                <line x1="332" y1="180" x2="332" y2="200" stroke="currentColor" strokeWidth="1.5" opacity="0.7" />
                {/* Brazos — relajados */}
                <line x1="332" y1="186" x2="318" y2="196" stroke="currentColor" strokeWidth="1.5" opacity="0.7" />
                <line x1="332" y1="186" x2="346" y2="196" stroke="currentColor" strokeWidth="1.5" opacity="0.7" />
                {/* Piernas */}
                <line x1="332" y1="200" x2="323" y2="215" stroke="currentColor" strokeWidth="1.5" opacity="0.7" />
                <line x1="332" y1="200" x2="341" y2="215" stroke="currentColor" strokeWidth="1.5" opacity="0.7" />
                {/* Sonrisa */}
                <path d="M 326,172 Q 332,176 338,172" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.6" />

                {/* Nota energía */}
                <rect x="290" y="205" width="210" height="28" rx="4" fill="#22c55e" fillOpacity="0.12" />
                <text x="395" y="218" fontSize="10" fill="#22c55e" fontFamily="sans-serif"
                    textAnchor="middle" fontWeight="600">Mismo confort con menos calor</text>
                <text x="395" y="229" fontSize="9" fill="currentColor" fontFamily="sans-serif"
                    textAnchor="middle" opacity="0.6">paredes templadas = temperatura radiante media alta</text>

                {/* ── Leyenda inferior ── */}
                <text x="260" y="258" fontSize="10" fill="currentColor" fontFamily="sans-serif"
                    textAnchor="middle" opacity="0.5">
                    La temperatura percibida depende tanto del aire como de las superficies que rodean al cuerpo
                </text>
            </svg>
            <figcaption className={styles.caption}>
                Comparativa de confort: una habitación con estufa de convección necesita aire a 24°C
                para resultar cómoda porque las paredes siguen frías. Con radiadores, las paredes ganan
                temperatura y el mismo confort se logra con aire a 20°C — ahorrando entre 15 y 25% de energía.
            </figcaption>
        </figure>
    )
}
