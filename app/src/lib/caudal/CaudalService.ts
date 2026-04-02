export interface CaudalInput {
    potencia: number // kW
    deltaT: number  // °C
}

export interface CaudalOutput {
    caudal: number     // l/h
    caudalM3h: number  // m³/h
    categoria: string
    advertencias: string[]
    notas: string[]
}

export function calcularCaudal(input: CaudalInput): CaudalOutput {
    const { potencia, deltaT } = input

    // Fórmula de campo: Q (l/h) = P(kW) × 860 / ΔT
    // 860 kcal/kWh ÷ 1 kcal/kg°C = 860 l/h por kW cada °C de diferencia
    const caudal = (potencia * 860) / deltaT
    const caudalM3h = caudal / 1000

    let categoria: string
    if (caudal <= 300) categoria = 'muy pequeño'
    else if (caudal <= 800) categoria = 'pequeño'
    else if (caudal <= 2000) categoria = 'mediano'
    else if (caudal <= 5000) categoria = 'grande'
    else categoria = 'muy grande'

    const advertencias: string[] = []
    const notas: string[] = []

    if (deltaT < 5) {
        advertencias.push('Un ΔT menor a 5°C genera caudales muy altos y dificulta el dimensionamiento de la bomba.')
    }
    if (deltaT > 15) {
        advertencias.push('Un ΔT mayor a 15°C puede generar gradientes de temperatura incómodos en los ambientes.')
    }
    if (caudal > 5000) {
        advertencias.push('Caudal muy alto. Verificá si conviene dividir la instalación en dos circuitos.')
    }

    notas.push('ΔT de 10°C: estándar para sistemas con radiadores de agua caliente.')
    notas.push('ΔT de 7°C: calderas a condensación con baja temperatura de retorno.')
    notas.push('ΔT de 5°C: circuitos de piso radiante (mayor caudal, menor temperatura).')

    return { caudal, caudalM3h, categoria, advertencias, notas }
}
