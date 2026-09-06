// Martín — el ayudante técnico de la plataforma.
//
// La ilustración es de Edgardo (6/9/2026). Se procesó una sola vez para la web:
// el fondo negro pasó a transparencia usando el brillo de cada píxel como canal
// alfa, así el halo del holograma se funde con el fondo de la pantalla en vez de
// recortarse contra un rectángulo negro. Ver `src/assets/martin-*.png`.
//
// Son dos recortes de la MISMA imagen, para que siempre sea el mismo tipo:
//   · cuerpo entero → parado en la esquina, con el chat cerrado
//   · cara          → los círculos chicos (encabezado del panel y cada respuesta)
// En 26 px un busto no se lee: por eso el recorte cerrado y no una escala del
// cuerpo entero.

import { useState } from 'react'
import cuerpoUrl from '../../assets/martin-cuerpo.png'
import caraUrl from '../../assets/martin-cara.png'
import reposoUrl from '../../assets/martin-reposo.webm'
import hablandoUrl from '../../assets/martin-hablando.webm'
import estilos from './Martin.module.css'

interface CuerpoProps {
    /** Alto en píxeles; el ancho sale de la proporción. */
    alto?: number
    className?: string
}

export function MartinCuerpo({ alto = 200, className }: CuerpoProps) {
    return (
        <img
            src={cuerpoUrl}
            alt=""
            aria-hidden="true"
            className={className}
            style={{ height: alto, width: 'auto', display: 'block' }}
            draggable={false}
        />
    )
}

interface RetratoProps {
    /** Diámetro en píxeles. El recorte ya viene cuadrado. */
    size?: number
    className?: string
}

export function MartinRetrato({ size = 38, className }: RetratoProps) {
    return (
        <img
            src={caraUrl}
            alt=""
            aria-hidden="true"
            width={size}
            height={size}
            className={className}
            style={{ display: 'block' }}
            draggable={false}
        />
    )
}

// ── Martín en movimiento ──────────────────────────────────────────────────────

/** Proporción de los clips (268 × 600), para reservar el lugar exacto. */
const RELACION = 268 / 600

/**
 * Los clips vienen con transparencia real (VP9 con canal alfa). Hay navegadores
 * que los reproducen igual pero descartan el alfa, y ahí Martín aparecería
 * dentro de un rectángulo negro. En vez de adivinar por el nombre del
 * navegador, se mira un píxel del borde: si es opaco, no hay transparencia y
 * nos quedamos con la imagen.
 */
function tieneTransparencia(video: HTMLVideoElement): boolean {
    try {
        const lienzo = document.createElement('canvas')
        lienzo.width = 8
        lienzo.height = 8
        const ctx = lienzo.getContext('2d')
        if (!ctx) return false
        ctx.clearRect(0, 0, 8, 8)
        ctx.drawImage(video, 0, 0, 8, 8)
        return ctx.getImageData(0, 0, 1, 1).data[3] < 40
    } catch {
        return false
    }
}

interface AnimadoProps {
    alto: number
    /** Con true se muestra el clip en el que gesticula y explica. */
    hablando: boolean
    /**
     * Trae el clip de hablar aunque todavía no se use. Se enciende al abrir el
     * chat: pedirlo recién cuando llega la respuesta lo haría llegar tarde.
     */
    precargarHabla: boolean
}

/** La imagen abajo y los clips encima, fundiéndose entre ellos. */
export function MartinAnimado({ alto, hablando, precargarHabla }: AnimadoProps) {
    const [reposoListo, setReposoListo] = useState(false)
    const [hablaListo, setHablaListo] = useState(false)

    const mostrandoHabla = hablando && hablaListo
    // Con cualquiera de los dos clips andando, la imagen ya no tiene que verse.
    const hayVideo = reposoListo || hablaListo

    return (
        <span className={estilos.escena} style={{ height: alto, width: Math.round(alto * RELACION) }}>
            <img
                src={cuerpoUrl}
                alt=""
                aria-hidden="true"
                className={`${estilos.base} ${hayVideo ? estilos.baseOculta : ''}`}
                draggable={false}
            />
            <video
                className={`${estilos.clip} ${reposoListo && !mostrandoHabla ? estilos.visible : ''}`}
                data-activo={hayVideo ? 'si' : undefined}
                src={reposoUrl}
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                aria-hidden="true"
                onCanPlay={e => setReposoListo(tieneTransparencia(e.currentTarget))}
            />
            {(precargarHabla || hablando) && (
                <video
                    className={`${estilos.clip} ${mostrandoHabla ? estilos.visible : ''}`}
                    src={hablandoUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="auto"
                    aria-hidden="true"
                    onCanPlay={e => setHablaListo(tieneTransparencia(e.currentTarget))}
                />
            )}
        </span>
    )
}
