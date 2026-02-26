import styles from './Diagrams.module.css'

/**
 * Diagrama de cortocircuito de agua en radiador con circuito cruzado:
 * Izquierda — conexión correcta: impulsión arriba, flujo a través del radiador
 * Derecha — cruzado: impulsión llega abajo, sin diferencial → no circula
 * Diagnóstico: cuál conexión calienta primero durante la purga
 */
export function DiagramaCortocircuito() {
    return (
        <figure className={styles.figure}>
            <svg
                viewBox="0 0 520 280"
                xmlns="http://www.w3.org/2000/svg"
                className={styles.svg}
                role="img"
                aria-label="Diagnóstico de cortocircuito de agua: conexión correcta vs circuito cruzado, diagnóstico por tacto durante la purga"
            >
                <defs>
                    <marker id="arr-hot" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
                        <path d="M0,0 L0,7 L7,3.5 z" fill="#ef4444" />
                    </marker>
                    <marker id="arr-cold" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
                        <path d="M0,0 L0,7 L7,3.5 z" fill="#60a5fa" />
                    </marker>
                    <marker id="arr-warn" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
                        <path d="M0,0 L0,7 L7,3.5 z" fill="#fbbf24" />
                    </marker>
                </defs>

                {/* Fondo */}
                <rect width="520" height="280" fill="var(--ct-ext-bg, #1a2332)" rx="8" />

                {/* Separador */}
                <line x1="260" y1="16" x2="260" y2="264"
                    stroke="var(--ct-wall-stroke, #4b5563)" strokeWidth="1"
                    strokeDasharray="6,4" opacity="0.4" />

                {/* ═══════ LADO IZQUIERDO — Conexión correcta ═══════ */}
                <text x="130" y="22" fontSize="11" fill="#22c55e" fontFamily="sans-serif"
                    textAnchor="middle" fontWeight="700">Conexión correcta</text>

                {/* Tubería impulsión bajando — arriba */}
                <rect x="100" y="36" width="10" height="50" rx="2"
                    fill="#ef4444" fillOpacity="0.3" stroke="#ef4444" strokeWidth="1" />
                <line x1="105" y1="36" x2="105" y2="56" stroke="#ef4444" strokeWidth="2"
                    markerEnd="url(#arr-hot)" />
                <text x="82" y="46" fontSize="8" fill="#ef4444" fontFamily="sans-serif"
                    textAnchor="end" fontWeight="600">Impulsión</text>
                <text x="82" y="56" fontSize="8" fill="#ef4444" fontFamily="sans-serif"
                    textAnchor="end">(caliente)</text>

                {/* Radiador */}
                <rect x="60" y="86" width="140" height="100" rx="5"
                    fill="var(--ct-wall-ext, #374151)" stroke="#22c55e" strokeWidth="2" />
                {[0, 1, 2, 3, 4].map(i => (
                    <rect key={i} x={68 + i * 25} y="94" width="16" height="84" rx="3"
                        fill="var(--ct-int-bg, #0f172a)" opacity="0.5" />
                ))}

                {/* Flujo a través del radiador — flechas internas */}
                <path d="M 105,86 L 105,120 L 175,120 L 175,186"
                    fill="none" stroke="#ef4444" strokeWidth="1.5"
                    strokeDasharray="3,2" opacity="0.5" markerEnd="url(#arr-hot)" />
                <text x="155" y="140" fontSize="8" fill="#22c55e" fontFamily="sans-serif"
                    opacity="0.7">flujo</text>
                <text x="155" y="150" fontSize="8" fill="#22c55e" fontFamily="sans-serif"
                    opacity="0.7">completo</text>

                {/* Conexión retorno — abajo */}
                <rect x="170" y="186" width="10" height="50" rx="2"
                    fill="#60a5fa" fillOpacity="0.3" stroke="#60a5fa" strokeWidth="1" />
                <line x1="175" y1="206" x2="175" y2="236" stroke="#60a5fa" strokeWidth="2"
                    markerEnd="url(#arr-cold)" />
                <text x="192" y="216" fontSize="8" fill="#60a5fa" fontFamily="sans-serif"
                    fontWeight="600">Retorno</text>
                <text x="192" y="226" fontSize="8" fill="#60a5fa" fontFamily="sans-serif">(frío)</text>

                {/* Diagnóstico: conexión superior calienta PRIMERO */}
                <rect x="62" y="60" width="16" height="26" rx="3"
                    fill="#ef4444" fillOpacity="0.2" stroke="#ef4444" strokeWidth="1.5" />
                <text x="70" y="71" fontSize="7" fill="#ef4444" fontFamily="sans-serif"
                    textAnchor="middle">↑</text>
                <text x="70" y="81" fontSize="7" fill="#ef4444" fontFamily="sans-serif"
                    textAnchor="middle" fontWeight="700">1°</text>

                <rect x="182" y="180" width="16" height="26" rx="3"
                    fill="#60a5fa" fillOpacity="0.2" stroke="#60a5fa" strokeWidth="1.5" />
                <text x="190" y="191" fontSize="7" fill="#60a5fa" fontFamily="sans-serif"
                    textAnchor="middle">↓</text>
                <text x="190" y="201" fontSize="7" fill="#60a5fa" fontFamily="sans-serif"
                    textAnchor="middle" fontWeight="700">2°</text>

                {/* Leyenda diagnóstico izquierda */}
                <rect x="54" y="242" width="152" height="26" rx="4"
                    fill="#22c55e" fillOpacity="0.1" stroke="#22c55e" strokeWidth="1" />
                <text x="130" y="253" fontSize="9" fill="#22c55e" fontFamily="sans-serif"
                    textAnchor="middle" fontWeight="700">✓ Superior calienta primero</text>
                <text x="130" y="263" fontSize="8" fill="currentColor" fontFamily="sans-serif"
                    textAnchor="middle" opacity="0.6">circuito correcto — radiador funciona</text>

                {/* ═══════ LADO DERECHO — Circuito cruzado ═══════ */}
                <text x="390" y="22" fontSize="11" fill="#ef4444" fontFamily="sans-serif"
                    textAnchor="middle" fontWeight="700">Circuito cruzado</text>

                {/* Tubería impulsión llega ABAJO (cruzada) */}
                <rect x="430" y="186" width="10" height="50" rx="2"
                    fill="#ef4444" fillOpacity="0.3" stroke="#ef4444" strokeWidth="1.5"
                    strokeDasharray="3,2" />
                <line x1="435" y1="186" x2="435" y2="206" stroke="#ef4444" strokeWidth="2"
                    markerEnd="url(#arr-hot)" />
                <text x="452" y="196" fontSize="8" fill="#ef4444" fontFamily="sans-serif"
                    fontWeight="600">¡Impulsión!</text>
                <text x="452" y="206" fontSize="8" fill="#ef4444" fontFamily="sans-serif">
                    (caliente)
                </text>

                {/* Retorno llega ARRIBA (cruzado) */}
                <rect x="320" y="36" width="10" height="50" rx="2"
                    fill="#60a5fa" fillOpacity="0.3" stroke="#60a5fa" strokeWidth="1.5"
                    strokeDasharray="3,2" />
                <line x1="325" y1="56" x2="325" y2="86" stroke="#60a5fa" strokeWidth="2"
                    markerEnd="url(#arr-cold)" />
                <text x="308" y="46" fontSize="8" fill="#60a5fa" fontFamily="sans-serif"
                    textAnchor="end" fontWeight="600">¡Retorno!</text>
                <text x="308" y="56" fontSize="8" fill="#60a5fa" fontFamily="sans-serif"
                    textAnchor="end">(frío)</text>

                {/* Radiador cruzado */}
                <rect x="310" y="86" width="140" height="100" rx="5"
                    fill="var(--ct-wall-ext, #374151)" stroke="#ef4444" strokeWidth="2"
                    strokeDasharray="5,3" />
                {[0, 1, 2, 3, 4].map(i => (
                    <rect key={i} x={318 + i * 25} y="94" width="16" height="84" rx="3"
                        fill="var(--ct-int-bg, #0f172a)" opacity="0.25" />
                ))}

                {/* X sobre el radiador */}
                <text x="380" y="145" fontSize="32" fill="#ef4444" fontFamily="sans-serif"
                    textAnchor="middle" opacity="0.25" fontWeight="900">✗</text>
                <text x="380" y="148" fontSize="9" fill="currentColor" fontFamily="sans-serif"
                    textAnchor="middle" opacity="0.5">sin circulación</text>

                {/* Cortocircuito: agua vuelve sin pasar por el radiador */}
                <path d="M 435,186 Q 455,140 455,100 Q 455,66 435,50 Q 420,40 325,50 Q 310,52 325,70"
                    fill="none" stroke="#fbbf24" strokeWidth="1.5"
                    strokeDasharray="4,3" markerEnd="url(#arr-warn)" opacity="0.6" />
                <text x="462" y="122" fontSize="8" fill="#fbbf24" fontFamily="sans-serif"
                    opacity="0.8" fontWeight="600">cortocircuito</text>
                <text x="462" y="132" fontSize="8" fill="#fbbf24" fontFamily="sans-serif"
                    opacity="0.8">de agua</text>

                {/* Diagnóstico: conexión inferior calienta PRIMERO */}
                <rect x="432" y="154" width="16" height="32" rx="3"
                    fill="#ef4444" fillOpacity="0.25" stroke="#ef4444" strokeWidth="2" />
                <text x="440" y="166" fontSize="8" fill="#ef4444" fontFamily="sans-serif"
                    textAnchor="middle" fontWeight="900">1°</text>
                <text x="440" y="179" fontSize="7" fill="#ef4444" fontFamily="sans-serif"
                    textAnchor="middle">ABAJO</text>

                <rect x="308" y="60" width="16" height="26" rx="3"
                    fill="#60a5fa" fillOpacity="0.15" stroke="#60a5fa" strokeWidth="1" />
                <text x="316" y="71" fontSize="7" fill="#60a5fa" fontFamily="sans-serif"
                    textAnchor="middle" opacity="0.7">2°</text>
                <text x="316" y="81" fontSize="7" fill="#60a5fa" fontFamily="sans-serif"
                    textAnchor="middle" opacity="0.7">arriba</text>

                {/* Leyenda diagnóstico derecha */}
                <rect x="304" y="242" width="152" height="26" rx="4"
                    fill="#ef4444" fillOpacity="0.1" stroke="#ef4444" strokeWidth="1" />
                <text x="380" y="253" fontSize="9" fill="#ef4444" fontFamily="sans-serif"
                    textAnchor="middle" fontWeight="700">✗ Inferior calienta primero</text>
                <text x="380" y="263" fontSize="8" fill="currentColor" fontFamily="sans-serif"
                    textAnchor="middle" opacity="0.6">circuito cruzado → hay que invertir</text>
            </svg>
            <figcaption className={styles.caption}>
                Diagnóstico por tacto durante la purga: en una conexión correcta la tubería
                superior (impulsión) calienta primero. Si la inferior (que debería ser retorno)
                calienta primero, la impulsión llega invertida y el agua cortocircuita
                sin atravesar el cuerpo del radiador.
            </figcaption>
        </figure>
    )
}
