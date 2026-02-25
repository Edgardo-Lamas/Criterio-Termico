import styles from './Diagrams.module.css'

/**
 * Diagrama de orientación solar en el hemisferio sur (Argentina).
 * Muestra por qué el norte recibe sol en invierno y el sur no.
 */
export function DiagramaOrientacion() {
    return (
        <figure className={styles.figure}>
            <svg
                viewBox="0 0 520 260"
                xmlns="http://www.w3.org/2000/svg"
                className={styles.svg}
                role="img"
                aria-label="Orientación solar en Argentina: el sol de invierno está al norte"
            >
                <defs>
                    <marker id="arrow-o" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                        <path d="M0,0 L0,6 L8,3 z" fill="var(--ct-sun, #fbbf24)" />
                    </marker>
                    <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="var(--ct-sun, #fbbf24)" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="var(--ct-sun, #fbbf24)" stopOpacity="0" />
                    </radialGradient>
                </defs>

                {/* Fondo */}
                <rect x="0" y="0" width="520" height="260" fill="var(--ct-ext-bg, #1a2332)" rx="8" />

                {/* ── Casa (centro) ── */}
                {/* Paredes */}
                <rect x="200" y="100" width="120" height="90" fill="var(--ct-wall-ext, #374151)" stroke="var(--ct-wall-stroke, #4b5563)" strokeWidth="1" />
                {/* Techo */}
                <polygon points="185,100 260,60 335,100" fill="var(--ct-wall-ext, #374151)" stroke="var(--ct-wall-stroke, #4b5563)" strokeWidth="1" />
                {/* Interior */}
                <rect x="208" y="108" width="104" height="74" fill="var(--ct-int-bg, #0f172a)" />
                {/* Ventana norte */}
                <rect x="228" y="100" width="64" height="10" fill="var(--ct-int-bg, #0f172a)" />
                <rect x="230" y="100" width="60" height="8" fill="none" stroke="var(--ct-window, #60a5fa)" strokeWidth="1.5" />
                {/* Ventana sur */}
                <rect x="228" y="182" width="64" height="8" fill="none" stroke="var(--ct-window-dim, #3b82f6)" strokeWidth="1.5" opacity="0.5" />

                {/* ── SOL (norte, izquierda de la pantalla = arriba del mapa) ── */}
                {/* Representamos: el sol sale por el NORTE en invierno */}
                {/* Lo dibujamos arriba */}
                <circle cx="260" cy="28" r="16" fill="var(--ct-sun, #fbbf24)" opacity="0.9" />
                {/* Rayos del sol */}
                {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
                    const rad = (angle * Math.PI) / 180
                    const x1 = 260 + Math.cos(rad) * 20
                    const y1 = 28 + Math.sin(rad) * 20
                    const x2 = 260 + Math.cos(rad) * 27
                    const y2 = 28 + Math.sin(rad) * 27
                    return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--ct-sun, #fbbf24)" strokeWidth="2" />
                })}
                <text x="260" y="18" fontSize="10" fill="var(--ct-sun, #fbbf24)" fontFamily="sans-serif" textAnchor="middle" fontWeight="700">SOL</text>
                <text x="260" y="8" fontSize="9" fill="var(--ct-sun-dim, #d97706)" fontFamily="sans-serif" textAnchor="middle">invierno</text>

                {/* Rayos solares llegando a la ventana norte */}
                <line x1="240" y1="46" x2="240" y2="100" stroke="var(--ct-sun, #fbbf24)" strokeWidth="1.5" strokeDasharray="5,3" markerEnd="url(#arrow-o)" opacity="0.7" />
                <line x1="260" y1="44" x2="260" y2="100" stroke="var(--ct-sun, #fbbf24)" strokeWidth="1.5" strokeDasharray="5,3" markerEnd="url(#arrow-o)" opacity="0.7" />
                <line x1="280" y1="46" x2="280" y2="100" stroke="var(--ct-sun, #fbbf24)" strokeWidth="1.5" strokeDasharray="5,3" markerEnd="url(#arrow-o)" opacity="0.7" />

                {/* ── Etiqueta NORTE ── */}
                <text x="260" y="230" fontSize="13" fill="var(--ct-north, #ef4444)" fontFamily="sans-serif" textAnchor="middle" fontWeight="900">↑ N</text>

                {/* ── Zona sur (fría, sin sol) ── */}
                {/* Copos / frío del sur */}
                <text x="260" y="250" fontSize="10" fill="var(--ct-cold, #93c5fd)" fontFamily="sans-serif" textAnchor="middle" opacity="0.7">↓ S — sin sol directo en invierno</text>
                {/* Flecha de frío viniendo del sur */}
                <line x1="260" y1="244" x2="260" y2="210" stroke="var(--ct-cold, #93c5fd)" strokeWidth="1" strokeDasharray="3,3" opacity="0.4" />

                {/* ── Leyenda derecha ── */}
                <rect x="375" y="80" width="130" height="90" fill="var(--ct-int-bg, #0f172a)" rx="6" opacity="0.7" />
                {/* Sol */}
                <circle cx="390" cy="100" r="5" fill="var(--ct-sun, #fbbf24)" />
                <text x="400" y="104" fontSize="10" fill="currentColor" fontFamily="sans-serif">Sol de invierno</text>
                <text x="400" y="116" fontSize="9" fill="var(--ct-int-text-dim, #475569)" fontFamily="sans-serif">→ ingresa al norte</text>
                {/* Ventana */}
                <rect x="385" y="127" width="10" height="7" fill="none" stroke="var(--ct-window, #60a5fa)" strokeWidth="1.5" />
                <text x="400" y="136" fontSize="10" fill="currentColor" fontFamily="sans-serif">Ventana orientada al norte</text>
                <text x="400" y="147" fontSize="9" fill="var(--ct-int-text-dim, #475569)" fontFamily="sans-serif">→ gana calor gratis</text>
                <rect x="385" y="155" width="10" height="7" fill="none" stroke="var(--ct-window-dim, #3b82f6)" strokeWidth="1.5" opacity="0.5" />
                <text x="400" y="165" fontSize="10" fill="currentColor" fontFamily="sans-serif" opacity="0.6">Ventana al sur</text>
                <text x="400" y="174" fontSize="9" fill="var(--ct-int-text-dim, #475569)" fontFamily="sans-serif">→ solo pierde calor</text>

                {/* ── Leyenda izquierda ── */}
                <rect x="15" y="80" width="160" height="70" fill="var(--ct-int-bg, #0f172a)" rx="6" opacity="0.7" />
                <text x="95" y="98" fontSize="10" fill="var(--ct-sun, #fbbf24)" fontFamily="sans-serif" textAnchor="middle" fontWeight="600">En el hemisferio sur:</text>
                <text x="95" y="112" fontSize="10" fill="currentColor" fontFamily="sans-serif" textAnchor="middle">El sol de invierno está al norte</text>
                <text x="95" y="124" fontSize="10" fill="currentColor" fontFamily="sans-serif" textAnchor="middle">a baja altura sobre el horizonte</text>
                <text x="95" y="138" fontSize="10" fill="var(--ct-cold, #93c5fd)" fontFamily="sans-serif" textAnchor="middle">El sur siempre está en sombra</text>
            </svg>
            <figcaption className={styles.caption}>
                En Argentina, el sol de invierno incide desde el norte. Una vivienda con
                frente al norte recibe radiación solar directa en invierno; una con frente
                al sur no tiene sol en toda la temporada.
            </figcaption>
        </figure>
    )
}
