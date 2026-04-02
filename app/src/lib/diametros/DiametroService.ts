import { DIAMETROS_CAÑERIA } from '../bombas/types'

export interface DiametroInput {
    caudal: number // l/h
}

export interface ResultadoDiametro {
    nombre: string
    diametroMm: number
    velocidad: number // m/s
    estado: 'lento' | 'ok' | 'rapido'
    recomendado: boolean
}

export interface DiametroOutput {
    resultados: ResultadoDiametro[]
    recomendado: string
    advertencias: string[]
    notas: string[]
}

const VELOCIDAD_MIN = 0.25  // m/s — mínimo para evitar sedimentación
const VELOCIDAD_MAX = 1.2   // m/s — máximo para evitar ruidos y erosión
const VELOCIDAD_OPTIMA = 0.6 // m/s — punto medio ideal

export function calcularDiametros(input: DiametroInput): DiametroOutput {
    const { caudal } = input
    const caudalM3s = caudal / 3_600_000 // l/h → m³/s

    const resultados: ResultadoDiametro[] = Object.entries(DIAMETROS_CAÑERIA).map(([nombre, d]) => {
        const area = Math.PI * (d / 2) ** 2
        const velocidad = caudalM3s / area

        let estado: 'lento' | 'ok' | 'rapido'
        if (velocidad < VELOCIDAD_MIN) estado = 'lento'
        else if (velocidad > VELOCIDAD_MAX) estado = 'rapido'
        else estado = 'ok'

        return {
            nombre,
            diametroMm: Math.round(d * 1000),
            velocidad,
            estado,
            recomendado: false,
        }
    })

    // Recomendado: el que tiene velocidad más cercana al óptimo dentro del rango OK
    const okResults = resultados.filter(r => r.estado === 'ok')

    let recomendadoNombre = ''
    if (okResults.length > 0) {
        const mejor = okResults.reduce((prev, curr) =>
            Math.abs(curr.velocidad - VELOCIDAD_OPTIMA) < Math.abs(prev.velocidad - VELOCIDAD_OPTIMA)
                ? curr : prev
        )
        mejor.recomendado = true
        recomendadoNombre = mejor.nombre
    } else {
        // Todos demasiado rápidos → recomendar el más grande
        const masGrande = resultados[resultados.length - 1]
        masGrande.recomendado = true
        recomendadoNombre = masGrande.nombre
    }

    const advertencias: string[] = []
    const notas: string[] = []

    if (okResults.length === 0) {
        advertencias.push('El caudal es muy alto para cañerías individuales. Considerá dividir en varios circuitos o usar colector.')
    }
    if (caudal > 3000) {
        advertencias.push('Para caudales mayores a 3.000 l/h es habitual usar cañería de 2" o circuitos en paralelo.')
    }

    notas.push('Velocidad recomendada: entre 0.4 y 0.8 m/s para evitar ruidos y sedimentación.')
    notas.push('Por debajo de 0.25 m/s hay riesgo de acumulación de lodo y aire en el circuito.')
    notas.push('Por encima de 1.2 m/s aparecen ruidos, erosión y mayor consumo de bomba.')

    return { resultados, recomendado: recomendadoNombre, advertencias, notas }
}
