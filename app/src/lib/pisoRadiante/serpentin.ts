// Generador de serpentín para piso radiante — geometría pura, corre 100% en browser.
//
// Dos patrones estándar de instalación (ver planos de obra de referencia):
// - Espiral doble en contraflujo ("caracol"): la ida entra en espiral hasta el
//   centro y el retorno sale entrelazado entre las vueltas de la ida. Cada
//   espiral tiene paso 2s, quedando tubos adyacentes a distancia s. Es el
//   patrón preferido porque alterna tubo caliente/frío y da temperatura de
//   piso uniforme.
// - Meandro ("serpentina"): corridas paralelas a distancia s. Se usa en
//   ambientes chicos o angostos donde la espiral no tiene lugar para girar.
//
// Coordenadas en metros, relativas al rectángulo del ambiente: origen en la
// esquina superior izquierda, x hacia la derecha, y hacia abajo.

export interface Punto {
    x: number
    y: number
}

export type PatronSerpentin = 'espiral' | 'meandro'

export interface Serpentin {
    patron: PatronSerpentin
    ida: Punto[]        // polilínea de impulsión (roja en plano)
    retorno: Punto[]    // polilínea de retorno (azul en plano)
    longitudTotal: number   // m — ida + retorno + conexión entre ambas
}

const MAX_ANILLOS = 500 // corte de seguridad ante parámetros degenerados

export function longitudPolilinea(pts: Punto[]): number {
    let total = 0
    for (let i = 1; i < pts.length; i++) {
        total += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y)
    }
    return total
}

// Espiral rectangular hacia adentro con paso `pitch`, dentro del rectángulo
// [l,t]–[r,b]. Devuelve la polilínea desde la esquina superior izquierda
// hasta el punto más interno alcanzable.
function espiralInterna(l0: number, t0: number, r0: number, b0: number, pitch: number): Punto[] {
    let l = l0, t = t0, r = r0, b = b0
    if (r - l <= 0 || b - t <= 0) return []

    const pts: Punto[] = [{ x: l, y: t }]
    for (let i = 0; i < MAX_ANILLOS; i++) {
        // borde superior →
        pts.push({ x: r, y: t })
        // borde derecho ↓
        if (b - t < pitch) break
        pts.push({ x: r, y: b })
        // borde inferior ← (deja `pitch` libre para la subida del anillo siguiente)
        if (r - (l + pitch) < pitch) break
        pts.push({ x: l + pitch, y: b })
        // borde izquierdo ↑ hasta el anillo siguiente
        if (b - (t + pitch) < pitch) break
        pts.push({ x: l + pitch, y: t + pitch })

        l += pitch
        t += pitch
        r -= pitch
        b -= pitch
        if (r - l < pitch || b - t < pitch) break
    }
    return pts
}

function generarEspiralDoble(ancho: number, alto: number, s: number, margen: number): Serpentin {
    // Ida: anillos en offsets margen, margen+2s, margen+4s…
    // Retorno: anillos en offsets margen+s, margen+3s… (entrelazado, a distancia s)
    const ida = espiralInterna(margen, margen, ancho - margen, alto - margen, 2 * s)
    const retorno = espiralInterna(margen + s, margen + s, ancho - margen - s, alto - margen - s, 2 * s)

    // El retorno sale desde el centro hacia afuera: se invierte la polilínea.
    retorno.reverse()

    // Conexión en el centro: último punto de la ida con el punto más interno del retorno.
    const conexion = retorno.length > 0 && ida.length > 0
        ? Math.hypot(retorno[0].x - ida[ida.length - 1].x, retorno[0].y - ida[ida.length - 1].y)
        : 0

    return {
        patron: 'espiral',
        ida,
        retorno,
        longitudTotal: redondear(longitudPolilinea(ida) + conexion + longitudPolilinea(retorno))
    }
}

function generarMeandro(ancho: number, alto: number, s: number, margen: number): Serpentin {
    // Las corridas van paralelas al lado más largo para minimizar curvas.
    const horizontal = ancho >= alto
    const w = horizontal ? ancho : alto
    const h = horizontal ? alto : ancho

    const x0 = margen, x1 = w - margen
    const y0 = margen, y1 = h - margen

    const pts: Punto[] = [{ x: x0, y: y0 }]
    let y = y0
    let haciaDerecha = true
    for (let i = 0; i < MAX_ANILLOS; i++) {
        pts.push({ x: haciaDerecha ? x1 : x0, y })
        const siguiente = y + s
        if (siguiente > y1 + 1e-9) break
        pts.push({ x: haciaDerecha ? x1 : x0, y: siguiente })
        y = siguiente
        haciaDerecha = !haciaDerecha
    }

    // Retorno pegado a la pared (a medio margen), desde el final del meandro
    // hasta la esquina de entrada.
    const fin = pts[pts.length - 1]
    const xPared = fin.x - x0 < x1 - fin.x ? margen / 2 : w - margen / 2
    const retorno: Punto[] = [
        fin,
        { x: xPared, y: fin.y },
        { x: xPared, y: margen / 2 },
        { x: x0, y: margen / 2 }
    ]

    // Si el ambiente era más alto que ancho, se generó rotado: intercambiar x↔y.
    const rotar = (p: Punto): Punto => horizontal ? p : { x: p.y, y: p.x }

    return {
        patron: 'meandro',
        ida: pts.map(rotar),
        retorno: retorno.map(rotar),
        longitudTotal: redondear(longitudPolilinea(pts) + longitudPolilinea(retorno))
    }
}

function redondear(n: number): number {
    return Math.round(n * 100) / 100
}

/**
 * Genera el trazado de un circuito de piso radiante para un ambiente rectangular.
 *
 * @param anchoM  ancho del ambiente en metros
 * @param altoM   alto del ambiente en metros
 * @param pasoCm  separación final entre tubos (15 o 20 según el motor de cálculo)
 * @param margenCm distancia mínima a las paredes (banda perimetral), default 10 cm
 */
export function generarSerpentin(
    anchoM: number,
    altoM: number,
    pasoCm: number,
    margenCm: number = 10
): Serpentin {
    if (!(anchoM > 0) || !(altoM > 0)) throw new Error('Dimensiones del ambiente inválidas.')
    if (!(pasoCm > 0)) throw new Error('Paso de tubería inválido.')

    const s = pasoCm / 100
    const margen = margenCm / 100

    const utilAncho = anchoM - 2 * margen
    const utilAlto = altoM - 2 * margen
    if (utilAncho <= 0 || utilAlto <= 0) {
        throw new Error('El ambiente es más chico que el margen perimetral.')
    }

    // La espiral solo vale la pena si entran al menos 2-3 anillos entrelazados
    // (cada par ida+retorno consume 2s de semi-ancho por lado). En baños y
    // pasillos angostos el meandro cubre mejor el área.
    const cabeEspiral = Math.min(utilAncho, utilAlto) >= 10 * s
    return cabeEspiral
        ? generarEspiralDoble(anchoM, altoM, s, margen)
        : generarMeandro(anchoM, altoM, s, margen)
}
