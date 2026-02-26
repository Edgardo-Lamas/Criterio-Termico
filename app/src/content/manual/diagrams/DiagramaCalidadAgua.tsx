import styles from './Diagrams.module.css'

/**
 * Diagrama de calidad del agua en circuitos de calefacción:
 * Izquierda — ciclo de precipitación en circuito cerrado (3 etapas)
 * Derecha   — sección del intercambiador: sin recargas vs con recargas frecuentes
 */
export function DiagramaCalidadAgua() {
    return (
        <figure className={styles.figure}>
            <svg
                viewBox="0 0 520 240"
                xmlns="http://www.w3.org/2000/svg"
                className={styles.svg}
                role="img"
                aria-label="Calidad del agua: ciclo en circuito cerrado vs daño por recargas"
            >
                {/* Fondo */}
                <rect width="520" height="240" fill="var(--ct-ext-bg, #1a2332)" rx="8" />

                {/* Separador */}
                <line x1="262" y1="12" x2="262" y2="225"
                    stroke="var(--ct-wall-stroke, #4b5563)" strokeWidth="1"
                    strokeDasharray="5,4" opacity="0.3" />

                {/* ══════════════════════════════════════════════
                    IZQUIERDA: Ciclo en circuito cerrado
                ══════════════════════════════════════════════ */}
                <text x="131" y="16" fontSize="10" fill="currentColor" fontFamily="sans-serif"
                    textAnchor="middle" opacity="0.6" fontWeight="600">
                    Ciclo en circuito cerrado
                </text>

                {/* Etapa 1: Carga inicial */}
                <rect x="15" y="22" width="236" height="52" rx="4"
                    fill="var(--ct-int-bg, #0f172a)"
                    stroke="var(--ct-wall-stroke, #4b5563)" strokeWidth="1" />
                <text x="24" y="37" fontSize="9" fill="currentColor" fontFamily="sans-serif"
                    opacity="0.7" fontWeight="600">Carga inicial — agua de red</text>

                {/* Burbujas de iones */}
                <circle cx="37" cy="56" r="8" fill="#fbbf24" fillOpacity="0.8" />
                <text x="37" y="59" fontSize="5.5" fill="#1a0f00" fontFamily="sans-serif"
                    textAnchor="middle" fontWeight="800">Ca²⁺</text>

                <circle cx="65" cy="56" r="8" fill="#f97316" fillOpacity="0.75" />
                <text x="65" y="59" fontSize="5.5" fill="#fff" fontFamily="sans-serif"
                    textAnchor="middle" fontWeight="700">HCO₃</text>

                <circle cx="93" cy="56" r="8" fill="#60a5fa" fillOpacity="0.75" />
                <text x="93" y="59" fontSize="7" fill="#fff" fontFamily="sans-serif"
                    textAnchor="middle" fontWeight="700">O₂</text>

                <circle cx="121" cy="56" r="8" fill="#a78bfa" fillOpacity="0.65" />
                <text x="121" y="59" fontSize="5.5" fill="#fff" fontFamily="sans-serif"
                    textAnchor="middle">Mg²⁺</text>

                <text x="145" y="59" fontSize="7.5" fill="currentColor" fontFamily="sans-serif"
                    opacity="0.35">+ Cl⁻, SO₄²⁻</text>

                {/* Flecha 1 */}
                <line x1="133" y1="74" x2="133" y2="91"
                    stroke="currentColor" strokeWidth="1" opacity="0.2" />
                <polygon points="129,90 137,90 133,96" fill="currentColor" fillOpacity="0.2" />
                <text x="148" y="85" fontSize="7.5" fill="currentColor" fontFamily="sans-serif"
                    opacity="0.35">calentamiento</text>

                {/* Etapa 2: Precipitación */}
                <rect x="15" y="96" width="236" height="56" rx="4"
                    fill="var(--ct-int-bg, #0f172a)"
                    stroke="#fbbf24" strokeWidth="1" strokeOpacity="0.4" />
                <text x="24" y="111" fontSize="9" fill="#fbbf24" fontFamily="sans-serif"
                    fontWeight="600" opacity="0.85">Precipitación — 1ª temporada</text>
                <text x="24" y="127" fontSize="8" fill="currentColor" fontFamily="monospace"
                    opacity="0.5">Ca²⁺ + HCO₃⁻ → CaCO₃↓ + CO₂↑</text>
                <text x="24" y="141" fontSize="8" fill="#fbbf24" fontFamily="sans-serif"
                    opacity="0.65">↓ sarro deposita en intercambiador</text>
                <text x="172" y="141" fontSize="8" fill="#60a5fa" fontFamily="sans-serif"
                    opacity="0.65">CO₂ → purga</text>

                {/* Flecha 2 */}
                <line x1="133" y1="152" x2="133" y2="169"
                    stroke="currentColor" strokeWidth="1" opacity="0.2" />
                <polygon points="129,168 137,168 133,174" fill="currentColor" fillOpacity="0.2" />
                <text x="148" y="163" fontSize="7.5" fill="currentColor" fontFamily="sans-serif"
                    opacity="0.35">sales agotadas</text>

                {/* Etapa 3: Agua estabilizada */}
                <rect x="15" y="174" width="236" height="50" rx="4"
                    fill="#22c55e" fillOpacity="0.07"
                    stroke="#22c55e" strokeWidth="1" strokeOpacity="0.45" />
                <text x="24" y="190" fontSize="9" fill="#22c55e" fontFamily="sans-serif"
                    fontWeight="700">✓ Agua estabilizada — pH 7 (neutro)</text>
                <text x="24" y="204" fontSize="8" fill="currentColor" fontFamily="sans-serif"
                    opacity="0.55">Sin sales disueltas → sin nuevo sarro</text>
                <text x="24" y="216" fontSize="8" fill="currentColor" fontFamily="sans-serif"
                    opacity="0.55">O₂ consumido → sin nueva corrosión</text>

                {/* ══════════════════════════════════════════════
                    DERECHA: Sección del intercambiador
                ══════════════════════════════════════════════ */}
                <text x="391" y="16" fontSize="10" fill="currentColor" fontFamily="sans-serif"
                    textAnchor="middle" opacity="0.6" fontWeight="600">
                    Sección del intercambiador
                </text>

                {/* ─── Caño A: Sin recargas (cx=312, cy=110, r=30) ─── */}
                {/* Pared del caño */}
                <circle cx="312" cy="110" r="30" fill="var(--ct-wall-ext, #374151)"
                    stroke="#6b7280" strokeWidth="1.5" />
                {/* Capa de sarro fina (4mm) */}
                <circle cx="312" cy="110" r="26" fill="#d4b44a" fillOpacity="0.55" />
                {/* Paso de agua limpia */}
                <circle cx="312" cy="110" r="21" fill="#3b82f6" fillOpacity="0.14" />

                <text x="312" y="73" fontSize="8.5" fill="#22c55e" fontFamily="sans-serif"
                    textAnchor="middle" fontWeight="600">Sin recargas</text>

                {/* Leyenda caño A */}
                <rect x="273" y="150" width="8" height="8" rx="1"
                    fill="#d4b44a" fillOpacity="0.55" />
                <text x="285" y="158" fontSize="7.5" fill="currentColor" fontFamily="sans-serif"
                    opacity="0.55">sarro fino · estable</text>

                <rect x="273" y="163" width="8" height="8" rx="1"
                    fill="#3b82f6" fillOpacity="0.35" />
                <text x="285" y="171" fontSize="7.5" fill="currentColor" fontFamily="sans-serif"
                    opacity="0.55">agua limpia · pH 7</text>

                <text x="285" y="184" fontSize="8" fill="#22c55e" fontFamily="sans-serif"
                    fontWeight="600">flujo completo ✓</text>

                {/* ─── Caño B: Con recargas (cx=448, cy=110, r=30) ─── */}
                {/* Pared del caño */}
                <circle cx="448" cy="110" r="30" fill="var(--ct-wall-ext, #374151)"
                    stroke="#6b7280" strokeWidth="1.5" />
                {/* Sarro acumulado grueso (16mm) */}
                <circle cx="448" cy="110" r="26" fill="#f97316" fillOpacity="0.7" />
                {/* Zona interior reducida (agua + lodo) */}
                <circle cx="448" cy="110" r="13" fill="var(--ct-int-bg, #0f172a)" />
                {/* Lodo de magnetita en la parte inferior */}
                <ellipse cx="448" cy="119" rx="11" ry="5"
                    fill="#5c3317" fillOpacity="0.95" />

                <text x="448" y="73" fontSize="8.5" fill="#ef4444" fontFamily="sans-serif"
                    textAnchor="middle" fontWeight="600">Con recargas</text>

                {/* Leyenda caño B */}
                <rect x="409" y="150" width="8" height="8" rx="1"
                    fill="#f97316" fillOpacity="0.7" />
                <text x="421" y="158" fontSize="7.5" fill="currentColor" fontFamily="sans-serif"
                    opacity="0.55">sarro acumulado</text>

                <rect x="409" y="163" width="8" height="8" rx="1"
                    fill="#5c3317" fillOpacity="0.95" />
                <text x="421" y="171" fontSize="7.5" fill="currentColor" fontFamily="sans-serif"
                    opacity="0.55">lodo (magnetita)</text>

                <text x="421" y="184" fontSize="8" fill="#ef4444" fontFamily="sans-serif"
                    fontWeight="600">flujo reducido ✗</text>

                {/* Caja de advertencia */}
                <rect x="268" y="193" width="243" height="32" rx="4"
                    fill="#ef4444" fillOpacity="0.09"
                    stroke="#ef4444" strokeWidth="1" strokeOpacity="0.35" />
                <text x="389" y="206" fontSize="8.5" fill="#ef4444" fontFamily="sans-serif"
                    textAnchor="middle" fontWeight="600">
                    ⚠ Cada recarga: + sarro + O₂ + corrosión
                </text>
                <text x="389" y="218" fontSize="8" fill="currentColor" fontFamily="sans-serif"
                    textAnchor="middle" opacity="0.5">
                    Buscar la pérdida — nunca recargar sin causa
                </text>

            </svg>
            <figcaption className={styles.caption}>
                En un circuito cerrado bien sellado, las sales de la primera carga precipitan como
                sarro en el intercambiador y el agua queda estabilizada con pH neutro (7). Las
                recargas reinician el ciclo indefinidamente: cada litro nuevo aporta calcio, oxígeno
                y sales que acumulan sarro y generan lodos de magnetita (Fe₃O₄) que obstruyen
                el circuito.
            </figcaption>
        </figure>
    )
}
