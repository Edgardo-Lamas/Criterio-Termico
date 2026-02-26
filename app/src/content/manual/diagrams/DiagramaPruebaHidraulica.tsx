import styles from './Diagrams.module.css'

/**
 * Diagrama del protocolo de prueba hidráulica en dos etapas:
 * Etapa 1 → verificación de circuitos
 * Etapa 2 → 6 bar / 24h → 3 bar continuo hasta fin de obra
 */
export function DiagramaPruebaHidraulica() {
    return (
        <figure className={styles.figure}>
            <svg
                viewBox="0 0 520 240"
                xmlns="http://www.w3.org/2000/svg"
                className={styles.svg}
                role="img"
                aria-label="Protocolo de prueba hidráulica en dos etapas: verificación de circuitos, 6 bar 24h y 3 bar hasta fin de obra"
            >
                <defs>
                    <marker id="arr-ph" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                        <path d="M0,0 L0,8 L8,4 z" fill="currentColor" opacity="0.4" />
                    </marker>
                </defs>

                {/* Fondo */}
                <rect width="520" height="240" fill="var(--ct-ext-bg, #1a2332)" rx="8" />

                {/* ═══ ETAPA 0: Inicio ═══ */}
                <rect x="14" y="24" width="76" height="52" rx="6"
                    fill="var(--ct-wall-ext, #374151)" stroke="var(--ct-wall-stroke, #4b5563)" strokeWidth="1.5" />
                <text x="52" y="42" fontSize="9" fill="currentColor" fontFamily="sans-serif"
                    textAnchor="middle" opacity="0.6">Tendido de</text>
                <text x="52" y="53" fontSize="9" fill="currentColor" fontFamily="sans-serif"
                    textAnchor="middle" opacity="0.6">tuberías</text>
                <text x="52" y="64" fontSize="9" fill="currentColor" fontFamily="sans-serif"
                    textAnchor="middle" opacity="0.6">completo</text>
                <text x="52" y="87" fontSize="8" fill="currentColor" fontFamily="sans-serif"
                    textAnchor="middle" opacity="0.4">sin artefactos</text>

                {/* Flecha → E1 */}
                <line x1="90" y1="50" x2="108" y2="50" stroke="currentColor" strokeWidth="1.5"
                    markerEnd="url(#arr-ph)" opacity="0.4" />

                {/* ═══ ETAPA 1: Verificación circuitos ═══ */}
                <rect x="110" y="14" width="116" height="100" rx="6"
                    fill="var(--ct-window, #60a5fa)" fillOpacity="0.08"
                    stroke="var(--ct-window, #60a5fa)" strokeWidth="1.5" />
                <text x="168" y="28" fontSize="9" fill="var(--ct-window, #60a5fa)" fontFamily="sans-serif"
                    textAnchor="middle" fontWeight="700" opacity="0.9">ETAPA 1</text>
                <text x="168" y="40" fontSize="10" fill="var(--ct-window, #60a5fa)" fontFamily="sans-serif"
                    textAnchor="middle" fontWeight="700">Verificación</text>
                <text x="168" y="51" fontSize="10" fill="var(--ct-window, #60a5fa)" fontFamily="sans-serif"
                    textAnchor="middle" fontWeight="700">de circuitos</text>

                <line x1="118" y1="58" x2="218" y2="58" stroke="var(--ct-window, #60a5fa)"
                    strokeWidth="0.5" opacity="0.2" />

                <text x="118" y="70" fontSize="8" fill="currentColor" fontFamily="sans-serif" opacity="0.75">· Solo impulsión conectada</text>
                <text x="118" y="81" fontSize="8" fill="currentColor" fontFamily="sans-serif" opacity="0.75">· Retorno taponeado</text>
                <text x="118" y="92" fontSize="8" fill="currentColor" fontFamily="sans-serif" opacity="0.75">· Verificar bocas en línea</text>
                <text x="118" y="103" fontSize="8" fill="#22c55e" fontFamily="sans-serif" opacity="0.85">· Detectar circuitos cruzados</text>

                {/* Flecha → E2 */}
                <line x1="226" y1="50" x2="244" y2="50" stroke="currentColor" strokeWidth="1.5"
                    markerEnd="url(#arr-ph)" opacity="0.4" />

                {/* ═══ ETAPA 2: 6 bar / 24h ═══ */}
                <rect x="246" y="14" width="116" height="100" rx="6"
                    fill="var(--ct-sun, #fbbf24)" fillOpacity="0.08"
                    stroke="var(--ct-sun, #fbbf24)" strokeWidth="1.5" />
                <text x="304" y="28" fontSize="9" fill="var(--ct-sun, #fbbf24)" fontFamily="sans-serif"
                    textAnchor="middle" fontWeight="700" opacity="0.9">ETAPA 2</text>
                <text x="304" y="40" fontSize="10" fill="var(--ct-sun, #fbbf24)" fontFamily="sans-serif"
                    textAnchor="middle" fontWeight="700">Prueba a</text>
                <text x="304" y="51" fontSize="10" fill="var(--ct-sun, #fbbf24)" fontFamily="sans-serif"
                    textAnchor="middle" fontWeight="700">6 bar / 24 h</text>

                <line x1="254" y1="58" x2="354" y2="58" stroke="var(--ct-sun, #fbbf24)"
                    strokeWidth="0.5" opacity="0.2" />

                <text x="254" y="70" fontSize="8" fill="currentColor" fontFamily="sans-serif" opacity="0.75">· Conectar bypass (ambos circuitos)</text>
                <text x="254" y="81" fontSize="8" fill="currentColor" fontFamily="sans-serif" opacity="0.75">· Purgar todo el aire primero</text>
                <text x="254" y="92" fontSize="8" fill="currentColor" fontFamily="sans-serif" opacity="0.75">· Llevar a 6 bar con bomba manual</text>
                <text x="254" y="103" fontSize="8" fill="#22c55e" fontFamily="sans-serif" opacity="0.85">· Sin variación = circuito estanco</text>

                {/* Flecha → E3 */}
                <line x1="362" y1="50" x2="380" y2="50" stroke="currentColor" strokeWidth="1.5"
                    markerEnd="url(#arr-ph)" opacity="0.4" />

                {/* ═══ ETAPA 3: 3 bar continuo ═══ */}
                <rect x="382" y="14" width="124" height="100" rx="6"
                    fill="#22c55e" fillOpacity="0.08"
                    stroke="#22c55e" strokeWidth="1.5" />
                <text x="444" y="28" fontSize="9" fill="#22c55e" fontFamily="sans-serif"
                    textAnchor="middle" fontWeight="700" opacity="0.9">ETAPA 3</text>
                <text x="444" y="40" fontSize="10" fill="#22c55e" fontFamily="sans-serif"
                    textAnchor="middle" fontWeight="700">3 bar hasta</text>
                <text x="444" y="51" fontSize="10" fill="#22c55e" fontFamily="sans-serif"
                    textAnchor="middle" fontWeight="700">fin de obra</text>

                <line x1="390" y1="58" x2="498" y2="58" stroke="#22c55e"
                    strokeWidth="0.5" opacity="0.2" />

                <text x="390" y="70" fontSize="8" fill="currentColor" fontFamily="sans-serif" opacity="0.75">· Reducir presión a 3 bar</text>
                <text x="390" y="81" fontSize="8" fill="currentColor" fontFamily="sans-serif" opacity="0.75">· Manómetro visible en cuadro</text>
                <text x="390" y="92" fontSize="8" fill="currentColor" fontFamily="sans-serif" opacity="0.75">· Verificar periódicamente</text>
                <text x="390" y="103" fontSize="8" fill="#22c55e" fontFamily="sans-serif" opacity="0.85">· Prueba legal ante daños de obra</text>

                {/* ═══ Manómetro ilustrado ═══ */}
                {/* Manómetro correcto — aguja en 3 bar */}
                <circle cx="150" cy="175" r="38" fill="var(--ct-int-bg, #0f172a)"
                    stroke="#22c55e" strokeWidth="2" fillOpacity="0.8" />
                <circle cx="150" cy="175" r="30" fill="none"
                    stroke="var(--ct-wall-stroke, #4b5563)" strokeWidth="0.5" />
                {/* Escala */}
                {[0, 1, 2, 3, 4, 6].map((val, i) => {
                    const totalMarks = 6
                    const angle = -220 + (val / totalMarks) * 260
                    const rad = (angle * Math.PI) / 180
                    const x1 = 150 + 24 * Math.cos(rad)
                    const y1 = 175 + 24 * Math.sin(rad)
                    const x2 = 150 + 30 * Math.cos(rad)
                    const y2 = 175 + 30 * Math.sin(rad)
                    const xt = 150 + 18 * Math.cos(rad)
                    const yt = 175 + 18 * Math.sin(rad)
                    return (
                        <g key={val}>
                            <line x1={x1} y1={y1} x2={x2} y2={y2}
                                stroke="currentColor" strokeWidth="1" opacity="0.4" />
                            <text x={xt} y={yt + 3} fontSize="6" fill="currentColor"
                                fontFamily="sans-serif" textAnchor="middle" opacity="0.5">{val}</text>
                        </g>
                    )
                })}
                {/* Zona 6 bar (roja) */}
                {(() => {
                    const a1 = ((-220 + (5 / 6) * 260) * Math.PI) / 180
                    const a2 = ((-220 + (6 / 6) * 260) * Math.PI) / 180
                    const x1 = 150 + 28 * Math.cos(a1), y1 = 175 + 28 * Math.sin(a1)
                    const x2 = 150 + 28 * Math.cos(a2), y2 = 175 + 28 * Math.sin(a2)
                    return <path d={`M ${x1} ${y1} A 28 28 0 0 1 ${x2} ${y2}`}
                        fill="none" stroke="#ef4444" strokeWidth="4" opacity="0.3" />
                })()}
                {/* Aguja — 3 bar */}
                {(() => {
                    const angle = -220 + (3 / 6) * 260
                    const rad = (angle * Math.PI) / 180
                    return <line x1={150} y1={175}
                        x2={150 + 22 * Math.cos(rad)} y2={175 + 22 * Math.sin(rad)}
                        stroke="#22c55e" strokeWidth="2" strokeLinecap="round" />
                })()}
                <circle cx="150" cy="175" r="3" fill="#22c55e" />
                <text x="150" y="196" fontSize="8" fill="#22c55e" fontFamily="sans-serif"
                    textAnchor="middle" fontWeight="700">3 bar OK</text>
                <text x="150" y="206" fontSize="7.5" fill="currentColor" fontFamily="sans-serif"
                    textAnchor="middle" opacity="0.5">presión estable</text>

                {/* Manómetro alerta — baja presión */}
                <circle cx="370" cy="175" r="38" fill="var(--ct-int-bg, #0f172a)"
                    stroke="#ef4444" strokeWidth="2" fillOpacity="0.8" />
                <circle cx="370" cy="175" r="30" fill="none"
                    stroke="var(--ct-wall-stroke, #4b5563)" strokeWidth="0.5" />
                {[0, 1, 2, 3, 4, 6].map((val, i) => {
                    const totalMarks = 6
                    const angle = -220 + (val / totalMarks) * 260
                    const rad = (angle * Math.PI) / 180
                    const x1 = 370 + 24 * Math.cos(rad)
                    const y1 = 175 + 24 * Math.sin(rad)
                    const x2 = 370 + 30 * Math.cos(rad)
                    const y2 = 175 + 30 * Math.sin(rad)
                    const xt = 370 + 18 * Math.cos(rad)
                    const yt = 175 + 18 * Math.sin(rad)
                    return (
                        <g key={val}>
                            <line x1={x1} y1={y1} x2={x2} y2={y2}
                                stroke="currentColor" strokeWidth="1" opacity="0.4" />
                            <text x={xt} y={yt + 3} fontSize="6" fill="currentColor"
                                fontFamily="sans-serif" textAnchor="middle" opacity="0.5">{val}</text>
                        </g>
                    )
                })}
                {/* Aguja — 1 bar (pérdida) */}
                {(() => {
                    const angle = -220 + (1 / 6) * 260
                    const rad = (angle * Math.PI) / 180
                    return <line x1={370} y1={175}
                        x2={370 + 22 * Math.cos(rad)} y2={175 + 22 * Math.sin(rad)}
                        stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
                })()}
                <circle cx="370" cy="175" r="3" fill="#ef4444" />
                <text x="370" y="196" fontSize="8" fill="#ef4444" fontFamily="sans-serif"
                    textAnchor="middle" fontWeight="700">¡Pérdida!</text>
                <text x="370" y="206" fontSize="7.5" fill="currentColor" fontFamily="sans-serif"
                    textAnchor="middle" opacity="0.5">investigar causa</text>

                {/* Etiquetas manómetros */}
                <text x="150" y="135" fontSize="9" fill="#22c55e" fontFamily="sans-serif"
                    textAnchor="middle" fontWeight="600">Instalación íntegra</text>
                <text x="370" y="135" fontSize="9" fill="#ef4444" fontFamily="sans-serif"
                    textAnchor="middle" fontWeight="600">Daño durante obra</text>

                {/* Texto inferior */}
                <text x="260" y="228" fontSize="9" fill="currentColor" fontFamily="sans-serif"
                    textAnchor="middle" opacity="0.45">
                    El manómetro visible en el cuadro permite constatar la integridad del circuito ante cualquier incidente durante la obra.
                </text>
            </svg>
            <figcaption className={styles.caption}>
                Protocolo de prueba hidráulica en tres etapas: primero se verifica la correcta
                alineación de los circuitos conectando solo la impulsión, luego se prueba a 6 bar
                durante 24 horas, y finalmente se mantiene a 3 bar con manómetro visible hasta
                la entrega. La caída de presión detectada en cualquier momento confirma un daño
                producido durante la obra y desresponsabiliza al instalador.
            </figcaption>
        </figure>
    )
}
