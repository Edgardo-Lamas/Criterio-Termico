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

import cuerpoUrl from '../../assets/martin-cuerpo.png'
import caraUrl from '../../assets/martin-cara.png'

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
