import styles from './Diagrams.module.css'

/**
 * Diagrama comparativo: circuito bitubo correcto vs circuito cruzado.
 * Muestra cómo la inversión de ida/retorno en un ramal impide la circulación.
 */
export function DiagramaCircuitoCruzado() {
    return (
        <figure className={styles.figure}>
            <svg
                viewBox="0 0 520 270"
                xmlns="http://www.w3.org/2000/svg"
                className={styles.svg}
                role="img"
                aria-label="Comparativa circuito bitubo correcto vs circuito cruzado: inversión de ida y retorno en un ramal"
            >
                <defs>
                    <marker id="arr-imp" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
                        <path d="M0,0 L0,7 L7,3.5 z" fill="#ef4444" />
                    </marker>
                    <marker id="arr-ret" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
                        <path d="M0,0 L0,7 L7,3.5 z" fill="#60a5fa" />
                    </marker>
                    <marker id="arr-block" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
                        <path d="M0,0 L0,7 L7,3.5 z" fill="#9ca3af" />
                    </marker>
                </defs>

                {/* Fondo */}
                <rect width="520" height="270" fill="var(--ct-ext-bg, #1a2332)" rx="8" />

                {/* Separador central */}
                <line x1="260" y1="16" x2="260" y2="254" stroke="var(--ct-wall-stroke, #4b5563)"
                    strokeWidth="1" strokeDasharray="6,4" opacity="0.4" />

                {/* ═══ LADO IZQUIERDO — Circuito correcto ═══ */}
                <text x="130" y="22" fontSize="11" fill="#22c55e" fontFamily="sans-serif"
                    textAnchor="middle" fontWeight="700">Circuito correcto</text>

                {/* Colector ida (rojo) */}
                <rect x="18" y="35" width="110" height="14" rx="3"
                    fill="#ef4444" fillOpacity="0.2" stroke="#ef4444" strokeWidth="1.5" />
                <text x="73" y="45" fontSize="9" fill="#ef4444" fontFamily="sans-serif"
                    textAnchor="middle" fontWeight="600">Impulsión (ida)</text>

                {/* Colector retorno (azul) */}
                <rect x="18" y="55" width="110" height="14" rx="3"
                    fill="#60a5fa" fillOpacity="0.2" stroke="#60a5fa" strokeWidth="1.5" />
                <text x="73" y="65" fontSize="9" fill="#60a5fa" fontFamily="sans-serif"
                    textAnchor="middle" fontWeight="600">Retorno</text>

                {/* Radiador 1 — correcto */}
                {/* Bajada impulsión */}
                <line x1="42" y1="49" x2="42" y2="118" stroke="#ef4444" strokeWidth="2"
                    markerEnd="url(#arr-imp)" />
                {/* Radiador */}
                <rect x="28" y="120" width="90" height="40" rx="4"
                    fill="var(--ct-wall-ext, #374151)" stroke="var(--ct-wall-stroke, #4b5563)" strokeWidth="1.5" />
                {[0, 1, 2, 3].map(i => (
                    <rect key={i} x={34 + i * 20} y="126" width="12" height="28" rx="2"
                        fill="var(--ct-int-bg, #0f172a)" opacity="0.5" />
                ))}
                <text x="73" y="146" fontSize="8" fill="currentColor" fontFamily="sans-serif"
                    textAnchor="middle" opacity="0.6">Radiador 1</text>
                {/* Subida retorno */}
                <line x1="104" y1="118" x2="104" y2="66" stroke="#60a5fa" strokeWidth="2"
                    markerEnd="url(#arr-ret)" />
                {/* Etiquetas entrada/salida */}
                <text x="32" y="118" fontSize="8" fill="#ef4444" fontFamily="sans-serif">IDA</text>
                <text x="90" y="118" fontSize="8" fill="#60a5fa" fontFamily="sans-serif">RET</text>

                {/* Radiador 2 — correcto */}
                <line x1="42" y1="49" x2="42" y2="210" stroke="#ef4444" strokeWidth="2"
                    markerEnd="url(#arr-imp)" />
                <rect x="28" y="212" width="90" height="40" rx="4"
                    fill="var(--ct-wall-ext, #374151)" stroke="var(--ct-wall-stroke, #4b5563)" strokeWidth="1.5" />
                {[0, 1, 2, 3].map(i => (
                    <rect key={i} x={34 + i * 20} y="218" width="12" height="28" rx="2"
                        fill="var(--ct-int-bg, #0f172a)" opacity="0.5" />
                ))}
                <text x="73" y="238" fontSize="8" fill="currentColor" fontFamily="sans-serif"
                    textAnchor="middle" opacity="0.6">Radiador 2</text>
                <line x1="104" y1="210" x2="104" y2="70" stroke="#60a5fa" strokeWidth="2"
                    markerEnd="url(#arr-ret)" />
                <text x="32" y="210" fontSize="8" fill="#ef4444" fontFamily="sans-serif">IDA</text>
                <text x="90" y="210" fontSize="8" fill="#60a5fa" fontFamily="sans-serif">RET</text>

                {/* Check */}
                <text x="155" y="190" fontSize="22" fill="#22c55e" fontFamily="sans-serif"
                    textAnchor="middle" opacity="0.8">✓</text>
                <text x="155" y="208" fontSize="9" fill="#22c55e" fontFamily="sans-serif"
                    textAnchor="middle">Circula</text>
                <text x="155" y="219" fontSize="9" fill="#22c55e" fontFamily="sans-serif"
                    textAnchor="middle">correctamente</text>

                {/* ═══ LADO DERECHO — Circuito cruzado ═══ */}
                <text x="390" y="22" fontSize="11" fill="#ef4444" fontFamily="sans-serif"
                    textAnchor="middle" fontWeight="700">Circuito cruzado</text>

                {/* Colector ida */}
                <rect x="278" y="35" width="110" height="14" rx="3"
                    fill="#ef4444" fillOpacity="0.2" stroke="#ef4444" strokeWidth="1.5" />
                <text x="333" y="45" fontSize="9" fill="#ef4444" fontFamily="sans-serif"
                    textAnchor="middle" fontWeight="600">Impulsión (ida)</text>

                {/* Colector retorno */}
                <rect x="278" y="55" width="110" height="14" rx="3"
                    fill="#60a5fa" fillOpacity="0.2" stroke="#60a5fa" strokeWidth="1.5" />
                <text x="333" y="65" fontSize="9" fill="#60a5fa" fontFamily="sans-serif"
                    textAnchor="middle" fontWeight="600">Retorno</text>

                {/* Radiador 3 — correcto */}
                <line x1="302" y1="49" x2="302" y2="118" stroke="#ef4444" strokeWidth="2"
                    markerEnd="url(#arr-imp)" />
                <rect x="288" y="120" width="90" height="40" rx="4"
                    fill="var(--ct-wall-ext, #374151)" stroke="var(--ct-wall-stroke, #4b5563)" strokeWidth="1.5" />
                {[0, 1, 2, 3].map(i => (
                    <rect key={i} x={294 + i * 20} y="126" width="12" height="28" rx="2"
                        fill="var(--ct-int-bg, #0f172a)" opacity="0.5" />
                ))}
                <text x="333" y="146" fontSize="8" fill="currentColor" fontFamily="sans-serif"
                    textAnchor="middle" opacity="0.6">Radiador 3 ✓</text>
                <line x1="364" y1="118" x2="364" y2="66" stroke="#60a5fa" strokeWidth="2"
                    markerEnd="url(#arr-ret)" />
                <text x="292" y="118" fontSize="8" fill="#ef4444" fontFamily="sans-serif">IDA</text>
                <text x="350" y="118" fontSize="8" fill="#60a5fa" fontFamily="sans-serif">RET</text>

                {/* Radiador 4 — CRUZADO */}
                {/* Línea que viene de impulsión pero llega al lado de retorno del radiador */}
                <line x1="302" y1="49" x2="302" y2="170" stroke="#ef4444" strokeWidth="2" />
                {/* Cruce — la IDA llega al lado de retorno */}
                <line x1="302" y1="170" x2="364" y2="208" stroke="#ef4444" strokeWidth="2"
                    strokeDasharray="4,3" markerEnd="url(#arr-imp)" />
                {/* La RETORNO llega al lado de impulsión */}
                <line x1="364" y1="66" x2="364" y2="170" stroke="#60a5fa" strokeWidth="2" />
                <line x1="364" y1="170" x2="302" y2="208" stroke="#60a5fa" strokeWidth="2"
                    strokeDasharray="4,3" markerEnd="url(#arr-ret)" />

                <rect x="288" y="212" width="90" height="40" rx="4"
                    fill="var(--ct-wall-ext, #374151)"
                    stroke="#ef4444" strokeWidth="2" strokeDasharray="4,2" />
                {[0, 1, 2, 3].map(i => (
                    <rect key={i} x={294 + i * 20} y="218" width="12" height="28" rx="2"
                        fill="var(--ct-int-bg, #0f172a)" opacity="0.3" />
                ))}
                <text x="333" y="238" fontSize="8" fill="#ef4444" fontFamily="sans-serif"
                    textAnchor="middle" fontWeight="600">Radiador 4 ✗</text>

                {/* Etiquetas invertidas */}
                <text x="292" y="210" fontSize="8" fill="#60a5fa" fontFamily="sans-serif">RET</text>
                <text x="350" y="210" fontSize="8" fill="#ef4444" fontFamily="sans-serif">IDA</text>

                {/* Símbolo de bloqueo */}
                <circle cx="333" cy="190" r="11" fill="#ef4444" fillOpacity="0.15"
                    stroke="#ef4444" strokeWidth="1.5" />
                <text x="333" y="195" fontSize="12" fill="#ef4444" fontFamily="sans-serif"
                    textAnchor="middle">✗</text>

                {/* Leyenda */}
                <text x="260" y="263" fontSize="9" fill="currentColor" fontFamily="sans-serif"
                    textAnchor="middle" opacity="0.5">
                    En el circuito cruzado, el agua entra y sale por el mismo lado: sin diferencia de presión, no hay circulación.
                </text>
            </svg>
            <figcaption className={styles.caption}>
                En un circuito correcto, la impulsión (roja) entra por un lado del radiador y el
                retorno (azul) sale por el otro. En un circuito cruzado, las líneas se invierten
                en ese ramal: el agua no circula porque no hay diferencia de presión entre entrada y salida.
                El radiador queda frío aunque el sistema funcione perfectamente en el resto de la instalación.
            </figcaption>
        </figure>
    )
}
