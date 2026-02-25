import styles from './Diagrams.module.css'

/**
 * Diagrama de pérdidas térmicas de una vivienda:
 * sección de casa mostrando las vías de pérdida de calor
 * con porcentajes aproximados por elemento.
 */
export function DiagramaPerdidasCasa() {
    return (
        <figure className={styles.figure}>
            <svg
                viewBox="0 0 520 300"
                xmlns="http://www.w3.org/2000/svg"
                className={styles.svg}
                role="img"
                aria-label="Diagrama de pérdidas térmicas: sección de vivienda mostrando pérdida por techo, paredes, ventanas, piso e infiltraciones"
            >
                <defs>
                    {/* Flecha calor — naranja */}
                    <marker id="arr-heat" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
                        <path d="M0,0 L0,7 L7,3.5 z" fill="var(--ct-sun, #fbbf24)" />
                    </marker>
                    {/* Flecha infiltración — azul */}
                    <marker id="arr-inf" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
                        <path d="M0,0 L0,7 L7,3.5 z" fill="var(--ct-cold, #93c5fd)" />
                    </marker>
                    {/* Degradado interior cálido */}
                    <radialGradient id="warmRoom" cx="50%" cy="60%" r="50%">
                        <stop offset="0%" stopColor="var(--ct-sun, #fbbf24)" stopOpacity="0.12" />
                        <stop offset="100%" stopColor="var(--ct-sun, #fbbf24)" stopOpacity="0" />
                    </radialGradient>
                </defs>

                {/* Fondo exterior */}
                <rect width="520" height="300" fill="var(--ct-ext-bg, #1a2332)" rx="8" />

                {/* ── Estructura de la casa ── */}
                {/* Pared izquierda */}
                <rect x="110" y="130" width="18" height="120" rx="2"
                    fill="var(--ct-wall-ext, #374151)" stroke="var(--ct-wall-stroke, #4b5563)" strokeWidth="1" />
                {/* Pared derecha */}
                <rect x="392" y="130" width="18" height="120" rx="2"
                    fill="var(--ct-wall-ext, #374151)" stroke="var(--ct-wall-stroke, #4b5563)" strokeWidth="1" />
                {/* Piso / losa */}
                <rect x="110" y="248" width="300" height="16" rx="2"
                    fill="var(--ct-wall-ext, #374151)" stroke="var(--ct-wall-stroke, #4b5563)" strokeWidth="1" />
                {/* Techo (losa plana) */}
                <rect x="100" y="112" width="320" height="20" rx="2"
                    fill="var(--ct-wall-ext, #374151)" stroke="var(--ct-wall-stroke, #4b5563)" strokeWidth="1" />
                {/* Techo inclinado (triángulo) */}
                <polygon points="90,112 260,60 430,112"
                    fill="var(--ct-wall-ext, #374151)" stroke="var(--ct-wall-stroke, #4b5563)" strokeWidth="1" />

                {/* Interior cálido */}
                <rect x="128" y="132" width="264" height="116"
                    fill="url(#warmRoom)" />

                {/* Ventana izquierda */}
                <rect x="143" y="158" width="55" height="50" rx="2"
                    fill="var(--ct-int-bg, #0f172a)" stroke="var(--ct-window, #60a5fa)" strokeWidth="2" />
                <line x1="170" y1="158" x2="170" y2="208" stroke="var(--ct-window, #60a5fa)" strokeWidth="1" opacity="0.5" />
                <line x1="143" y1="183" x2="198" y2="183" stroke="var(--ct-window, #60a5fa)" strokeWidth="1" opacity="0.5" />

                {/* Ventana derecha */}
                <rect x="322" y="158" width="55" height="50" rx="2"
                    fill="var(--ct-int-bg, #0f172a)" stroke="var(--ct-window, #60a5fa)" strokeWidth="2" />
                <line x1="349" y1="158" x2="349" y2="208" stroke="var(--ct-window, #60a5fa)" strokeWidth="1" opacity="0.5" />
                <line x1="322" y1="183" x2="377" y2="183" stroke="var(--ct-window, #60a5fa)" strokeWidth="1" opacity="0.5" />

                {/* Puerta */}
                <rect x="228" y="198" width="44" height="50" rx="2"
                    fill="var(--ct-wall-ext, #374151)" stroke="var(--ct-wall-stroke, #4b5563)" strokeWidth="1.5" />
                <circle cx="265" cy="224" r="2.5" fill="currentColor" opacity="0.5" />

                {/* Etiqueta interior */}
                <text x="260" y="152" fontSize="10" fill="var(--ct-sun, #fbbf24)"
                    fontFamily="sans-serif" textAnchor="middle" opacity="0.6">20°C interior</text>

                {/* ═══════════════ FLECHAS DE PÉRDIDA ═══════════════ */}

                {/* TECHO — pérdida grande hacia arriba */}
                <line x1="220" y1="108" x2="220" y2="72"
                    stroke="var(--ct-sun, #fbbf24)" strokeWidth="3" markerEnd="url(#arr-heat)" opacity="0.9" />
                <line x1="260" y1="108" x2="260" y2="66"
                    stroke="var(--ct-sun, #fbbf24)" strokeWidth="3.5" markerEnd="url(#arr-heat)" opacity="0.9" />
                <line x1="300" y1="108" x2="300" y2="72"
                    stroke="var(--ct-sun, #fbbf24)" strokeWidth="3" markerEnd="url(#arr-heat)" opacity="0.9" />
                {/* Etiqueta techo */}
                <rect x="196" y="40" width="128" height="22" rx="4"
                    fill="var(--ct-sun, #fbbf24)" fillOpacity="0.15" />
                <text x="260" y="53" fontSize="11" fill="var(--ct-sun, #fbbf24)"
                    fontFamily="sans-serif" textAnchor="middle" fontWeight="700">Techo  25–35%</text>

                {/* PAREDES — flechas izquierda y derecha */}
                <line x1="108" y1="185" x2="78" y2="185"
                    stroke="var(--ct-sun, #fbbf24)" strokeWidth="2" markerEnd="url(#arr-heat)" opacity="0.8" />
                <line x1="108" y1="200" x2="78" y2="200"
                    stroke="var(--ct-sun, #fbbf24)" strokeWidth="2" markerEnd="url(#arr-heat)" opacity="0.8" />
                {/* Etiqueta pared izquierda */}
                <text x="38" y="188" fontSize="10" fill="var(--ct-sun, #fbbf24)"
                    fontFamily="sans-serif" textAnchor="middle" fontWeight="600">Paredes</text>
                <text x="38" y="200" fontSize="10" fill="var(--ct-sun-dim, #d97706)"
                    fontFamily="sans-serif" textAnchor="middle">20–30%</text>

                <line x1="412" y1="185" x2="442" y2="185"
                    stroke="var(--ct-sun, #fbbf24)" strokeWidth="2" markerEnd="url(#arr-heat)" opacity="0.8" />
                <line x1="412" y1="200" x2="442" y2="200"
                    stroke="var(--ct-sun, #fbbf24)" strokeWidth="2" markerEnd="url(#arr-heat)" opacity="0.8" />
                <text x="482" y="188" fontSize="10" fill="var(--ct-sun, #fbbf24)"
                    fontFamily="sans-serif" textAnchor="middle" fontWeight="600">Paredes</text>
                <text x="482" y="200" fontSize="10" fill="var(--ct-sun-dim, #d97706)"
                    fontFamily="sans-serif" textAnchor="middle">20–30%</text>

                {/* VENTANAS — flechas más gruesas (más pérdida) */}
                <line x1="170" y1="156" x2="155" y2="132"
                    stroke="var(--ct-sun, #fbbf24)" strokeWidth="2.5" markerEnd="url(#arr-heat)" opacity="0.85" />
                <text x="130" y="126" fontSize="10" fill="var(--ct-sun, #fbbf24)"
                    fontFamily="sans-serif" textAnchor="middle" fontWeight="600">Ventanas</text>
                <text x="130" y="138" fontSize="9" fill="#ef4444"
                    fontFamily="sans-serif" textAnchor="middle">U×4 vs pared</text>

                <line x1="349" y1="156" x2="364" y2="132"
                    stroke="var(--ct-sun, #fbbf24)" strokeWidth="2.5" markerEnd="url(#arr-heat)" opacity="0.85" />
                <text x="390" y="126" fontSize="10" fill="var(--ct-sun, #fbbf24)"
                    fontFamily="sans-serif" textAnchor="middle" fontWeight="600">Ventanas</text>
                <text x="390" y="138" fontSize="9" fill="#ef4444"
                    fontFamily="sans-serif" textAnchor="middle">U×4 vs pared</text>

                {/* PISO — flecha hacia abajo */}
                <line x1="260" y1="266" x2="260" y2="286"
                    stroke="var(--ct-sun, #fbbf24)" strokeWidth="2" markerEnd="url(#arr-heat)" opacity="0.6" />
                <text x="260" y="295" fontSize="10" fill="var(--ct-sun-dim, #d97706)"
                    fontFamily="sans-serif" textAnchor="middle">Piso  5–15%</text>

                {/* INFILTRACIONES — flechas de aire frío entrando */}
                {/* Por la ventana izquierda */}
                <path d="M 60,175 Q 90,170 128,178"
                    fill="none" stroke="var(--ct-cold, #93c5fd)" strokeWidth="1.5"
                    strokeDasharray="3,2" markerEnd="url(#arr-inf)" opacity="0.6" />
                {/* Por la puerta */}
                <path d="M 200,280 Q 230,268 235,250"
                    fill="none" stroke="var(--ct-cold, #93c5fd)" strokeWidth="1.5"
                    strokeDasharray="3,2" markerEnd="url(#arr-inf)" opacity="0.6" />
                {/* Etiqueta infiltraciones */}
                <text x="50" y="165" fontSize="9" fill="var(--ct-cold, #93c5fd)"
                    fontFamily="sans-serif" textAnchor="middle" opacity="0.8">Infiltraciones</text>
                <text x="50" y="175" fontSize="9" fill="var(--ct-cold, #93c5fd)"
                    fontFamily="sans-serif" textAnchor="middle" opacity="0.8">hasta 30%</text>

                {/* Temperatura exterior */}
                <text x="260" y="20" fontSize="10" fill="var(--ct-cold, #93c5fd)"
                    fontFamily="sans-serif" textAnchor="middle" opacity="0.6">2°C exterior (diseño zona IIIA — Buenos Aires)</text>
            </svg>
            <figcaption className={styles.caption}>
                Sección esquemática de una vivienda mostrando las principales vías de pérdida
                térmica. El techo y las ventanas son los puntos críticos: el techo representa
                hasta el 35% de la pérdida total en plantas altas con losa sin aislación, y cada
                metro cuadrado de vidrio simple pierde cuatro veces más calor que un metro cuadrado de pared.
            </figcaption>
        </figure>
    )
}
