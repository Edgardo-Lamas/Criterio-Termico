import styles from './Diagrams.module.css'

/**
 * Diagrama visual del método volumétrico:
 * Habitación con S y H etiquetados → Volumen → × Factor → Potencia
 * La escala de factores (40/50/60) muestra la calidad constructiva.
 */
export function DiagramaFormulaPotencia() {
    return (
        <figure className={styles.figure}>
            <svg
                viewBox="0 0 520 260"
                xmlns="http://www.w3.org/2000/svg"
                className={styles.svg}
                role="img"
                aria-label="Método volumétrico: fórmula Potencia = Superficie × Altura × Factor térmico"
            >
                <defs>
                    <marker id="arr-f" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
                        <path d="M0,0 L0,7 L7,3.5 z" fill="currentColor" opacity="0.5" />
                    </marker>
                </defs>

                {/* Fondo */}
                <rect width="520" height="260" fill="var(--ct-ext-bg, #1a2332)" rx="8" />

                {/* ═══════ HABITACIÓN (isométrica simple) ═══════ */}
                {/* Piso */}
                <polygon points="30,170 120,140 200,170 110,200"
                    fill="var(--ct-wall-ext, #374151)" stroke="var(--ct-wall-stroke, #4b5563)" strokeWidth="1" />
                {/* Pared izquierda */}
                <polygon points="30,170 30,80 120,50 120,140"
                    fill="var(--ct-int-bg, #0f172a)" stroke="var(--ct-wall-stroke, #4b5563)" strokeWidth="1"
                    fillOpacity="0.6" />
                {/* Pared derecha */}
                <polygon points="120,140 120,50 200,80 200,170"
                    fill="var(--ct-wall-ext, #374151)" stroke="var(--ct-wall-stroke, #4b5563)" strokeWidth="1"
                    fillOpacity="0.8" />
                {/* Techo */}
                <polygon points="30,80 120,50 200,80 110,110"
                    fill="var(--ct-wall-ext, #374151)" stroke="var(--ct-wall-stroke, #4b5563)" strokeWidth="1" />
                {/* Ventana en pared derecha */}
                <polygon points="145,100 165,108 165,140 145,132"
                    fill="var(--ct-window, #60a5fa)" fillOpacity="0.25"
                    stroke="var(--ct-window, #60a5fa)" strokeWidth="1.5" />

                {/* Etiqueta S (Superficie) */}
                <line x1="32" y1="200" x2="108" y2="200" stroke="var(--ct-sun, #fbbf24)" strokeWidth="1.5" strokeDasharray="4,2" />
                <line x1="108" y1="200" x2="198" y2="170" stroke="var(--ct-sun, #fbbf24)" strokeWidth="1.5" strokeDasharray="4,2" />
                <text x="115" y="212" fontSize="11" fill="var(--ct-sun, #fbbf24)" fontFamily="sans-serif" fontWeight="700">S = 25 m²</text>

                {/* Etiqueta H (Altura) */}
                <line x1="22" y1="80" x2="22" y2="170" stroke="var(--ct-window, #60a5fa)" strokeWidth="1.5" markerEnd="url(#arr-f)" />
                <line x1="22" y1="80" x2="22" y2="80" stroke="var(--ct-window, #60a5fa)" strokeWidth="1.5" />
                <text x="14" y="130" fontSize="11" fill="var(--ct-window, #60a5fa)" fontFamily="sans-serif"
                    fontWeight="700" textAnchor="middle"
                    transform="rotate(-90 14 130)">H = 2.7 m</text>

                {/* ═══════ FLECHA → VOLUMEN ═══════ */}
                <line x1="210" y1="125" x2="240" y2="125" stroke="currentColor" strokeWidth="1.5"
                    strokeDasharray="4,2" markerEnd="url(#arr-f)" opacity="0.5" />
                {/* Bloque VOLUMEN */}
                <rect x="244" y="108" width="76" height="34" rx="5"
                    fill="var(--ct-window, #60a5fa)" fillOpacity="0.15"
                    stroke="var(--ct-window, #60a5fa)" strokeWidth="1.5" strokeOpacity="0.5" />
                <text x="282" y="122" fontSize="10" fill="var(--ct-window, #60a5fa)" fontFamily="sans-serif"
                    textAnchor="middle" fontWeight="600">Volumen</text>
                <text x="282" y="135" fontSize="11" fill="var(--ct-window, #60a5fa)" fontFamily="sans-serif"
                    textAnchor="middle" fontWeight="700">67.5 m³</text>

                {/* ═══════ FLECHA → × FACTOR ═══════ */}
                <line x1="320" y1="125" x2="346" y2="125" stroke="currentColor" strokeWidth="1.5"
                    strokeDasharray="4,2" markerEnd="url(#arr-f)" opacity="0.5" />

                {/* ═══════ ESCALA DE FACTORES ═══════ */}
                {/* Fondo del bloque */}
                <rect x="349" y="68" width="80" height="120" rx="6"
                    fill="var(--ct-int-bg, #0f172a)" fillOpacity="0.7"
                    stroke="var(--ct-wall-stroke, #4b5563)" strokeWidth="1" />
                <text x="389" y="83" fontSize="9" fill="currentColor" fontFamily="sans-serif"
                    textAnchor="middle" opacity="0.5">Factor</text>

                {/* Factor 40 — verde */}
                <rect x="355" y="88" width="68" height="24" rx="4" fill="#22c55e" fillOpacity="0.8" />
                <text x="389" y="98" fontSize="11" fill="#052e16" fontFamily="sans-serif"
                    textAnchor="middle" fontWeight="800">40</text>
                <text x="389" y="108" fontSize="8" fill="#052e16" fontFamily="sans-serif"
                    textAnchor="middle" opacity="0.85">buena aislación</text>

                {/* Factor 50 — amarillo */}
                <rect x="355" y="118" width="68" height="24" rx="4" fill="var(--ct-sun, #fbbf24)" fillOpacity="0.85" />
                <text x="389" y="128" fontSize="11" fill="#451a03" fontFamily="sans-serif"
                    textAnchor="middle" fontWeight="800">50</text>
                <text x="389" y="138" fontSize="8" fill="#451a03" fontFamily="sans-serif"
                    textAnchor="middle" opacity="0.85">construcción estándar</text>

                {/* Factor 60 — rojo */}
                <rect x="355" y="148" width="68" height="24" rx="4" fill="#ef4444" fillOpacity="0.8" />
                <text x="389" y="158" fontSize="11" fill="#fef2f2" fontFamily="sans-serif"
                    textAnchor="middle" fontWeight="800">60</text>
                <text x="389" y="168" fontSize="8" fill="#fef2f2" fontFamily="sans-serif"
                    textAnchor="middle" opacity="0.85">poca aislación</text>

                {/* Línea activa apuntando al factor 50 */}
                <line x1="320" y1="125" x2="349" y2="130" stroke="var(--ct-sun, #fbbf24)" strokeWidth="1.5" opacity="0.6" />

                {/* ═══════ FLECHA → RESULTADO ═══════ */}
                <line x1="435" y1="125" x2="455" y2="125" stroke="currentColor" strokeWidth="1.5"
                    strokeDasharray="4,2" markerEnd="url(#arr-f)" opacity="0.5" />

                {/* Bloque RESULTADO */}
                <rect x="458" y="100" width="52" height="52" rx="6"
                    fill="var(--ct-sun, #fbbf24)" fillOpacity="0.2"
                    stroke="var(--ct-sun, #fbbf24)" strokeWidth="2" />
                <text x="484" y="118" fontSize="9" fill="var(--ct-sun, #fbbf24)" fontFamily="sans-serif"
                    textAnchor="middle" opacity="0.8">Potencia</text>
                <text x="484" y="132" fontSize="11" fill="var(--ct-sun, #fbbf24)" fontFamily="sans-serif"
                    textAnchor="middle" fontWeight="800">3.375</text>
                <text x="484" y="143" fontSize="8.5" fill="var(--ct-sun, #fbbf24)" fontFamily="sans-serif"
                    textAnchor="middle">Kcal/h</text>

                {/* ═══════ FÓRMULA ESCRITA ═══════ */}
                <rect x="20" y="220" width="480" height="28" rx="5"
                    fill="var(--ct-int-bg, #0f172a)" fillOpacity="0.6" />
                <text x="260" y="233" fontSize="10" fill="currentColor" fontFamily="sans-serif"
                    textAnchor="middle" opacity="0.5">Fórmula:</text>
                <text x="260" y="243" fontSize="11" fill="currentColor" fontFamily="monospace"
                    textAnchor="middle" fontWeight="600">
                    Potencia (Kcal/h)  =  Superficie (m²)  ×  Altura (m)  ×  Factor (Kcal/h·m³)
                </text>
            </svg>
            <figcaption className={styles.caption}>
                El método volumétrico en tres pasos: superficie × altura = volumen del local,
                multiplicado por el factor térmico según la calidad constructiva. El factor 50
                representa la construcción estándar argentina; edificaciones más eficientes usan 40
                y las más precarias o en zonas frías usan 60.
            </figcaption>
        </figure>
    )
}
