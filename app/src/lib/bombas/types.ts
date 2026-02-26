// Motor de cálculo de bombas — tipos compartidos
// Portable: no depende de React ni de ninguna librería de UI

// ── Diámetros de cañería (diámetro interno real en mm) ──────────────────────
// Basado en cañería de hierro negro roscada, estándar Argentina
export const DIAMETROS_CAÑERIA: Record<string, number> = {
    '1/2"':    0.0135,   // 13.5 mm int.
    '3/4"':    0.0187,   // 18.7 mm int.
    '1"':      0.0254,   // 25.4 mm int.
    '1 1/4"':  0.0323,   // 32.3 mm int.
    '1 1/2"':  0.0381,   // 38.1 mm int.
    '2"':      0.0508,   // 50.8 mm int.
}

export type DiametroCañeria = keyof typeof DIAMETROS_CAÑERIA

// ── Entrada: bomba circuladora ───────────────────────────────────────────────
export interface BombaInput {
    potenciaTotal: number        // kW — potencia total de la instalación
    deltaT: number               // °C — diferencia de temperatura (10 radiad. / 5 piso / 7 mixto)
    longitudCircuito: number     // m  — longitud del circuito más desfavorable (solo ida)
    diametroCañeria: DiametroCañeria
}

// ── Salida: bomba circuladora ────────────────────────────────────────────────
export interface BombaOutput {
    caudal: number               // l/h
    caudalM3h: number            // m³/h
    velocidad: number            // m/s
    perdidaCargaLineal: number   // mca/m
    perdidaCargaTotal: number    // mca — incluye fittings + resistencia caldera
    categoria: 'pequeña' | 'mediana' | 'grande'
    advertencias: string[]
    notas: string[]
}

// ── Entrada: presurizadora ───────────────────────────────────────────────────
export interface PresurizadoraInput {
    presionRed: number           // bar — presión de red en boca de calle
    alturaFillPoint: number      // m   — altura del punto de llenado sobre nivel de calle
    alturaCircuito: number       // m   — altura del radiador más alto sobre el punto de llenado
    presionObjetivo: number      // bar — presión objetivo en frío (default: 1.5)
}

// ── Salida: presurizadora ────────────────────────────────────────────────────
export interface PresurizadoraOutput {
    presionDisponible: number    // bar — en el punto de llenado (restada la altura)
    presionNecesaria: number     // bar — requerida en el punto de llenado
    boostNecesario: number       // bar — presión adicional que debe aportar la bomba
    necesitaPresurizadora: boolean
    alturaManometrica: number    // mca — para especificar la bomba
    caudalLlenado: number        // l/min — caudal típico de llenado
    categoria: 'sin-bomba' | 'doméstica' | 'mediana' | 'industrial'
    advertencias: string[]
    notas: string[]
}
