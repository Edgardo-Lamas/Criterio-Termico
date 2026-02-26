// Tipos para el motor de cálculo de piso radiante

export const TipoDeSuelo = {
    PETREO: 'PETREO',
    MADERA_MACIZA: 'MADERA_MACIZA',
    MADERA_FLOTANTE: 'MADERA_FLOTANTE',
    MOQUETA: 'MOQUETA',
} as const
export type TipoDeSuelo = typeof TipoDeSuelo[keyof typeof TipoDeSuelo]

export const AdvisoryLevel = {
    INFO: 'INFO',
    WARNING: 'WARNING',
    CRITICAL: 'CRITICAL',
} as const
export type AdvisoryLevel = typeof AdvisoryLevel[keyof typeof AdvisoryLevel]

export interface UnderfloorCalculationInput {
    area: number                    // m² (1–1000)
    cargaTermicaRequerida: number   // W/m² (10–150)
    tipoDeSuelo: TipoDeSuelo
    distanciaAlColector: number     // metros (0–50) — ida, se multiplica ×2
    distanciaAlimentacion?: number  // opcional
}

export interface FloorConfig {
    maxPower: number
    requiresStep15: boolean
}

export interface PipeStepConfig {
    stepCm: number
    density: number
}

export interface AdvisoryMessage {
    level: AdvisoryLevel
    message: string
}

export interface UnderfloorCalculationOutput {
    pasoSeleccionado: number
    densidadTuberia: number
    longitudSerpentina: number
    longitudAcometida: number
    longitudTotal: number
    numeroCircuitos: number
    potenciaMaximaSuelo: number
    advisoryMessage?: AdvisoryMessage
    notaDiseno: string
    distanciaAlimentacion?: number
}

// Presupuesto
export interface ItemPresupuesto {
    productoId: string
    nombre: string
    cantidad: number
    unidad: string
    precioUnitario: number
    subtotal: number
}

export interface ResumenPresupuesto {
    items: ItemPresupuesto[]
    totalMateriales: number
    desperdicioEstimado: number
    totalFinal: number
}

export interface ProductoCatalogo {
    id: string
    nombre: string
    descripcion: string
    precioUnitario: number
    unidad: string
    categoria: string
}

export interface ColectorCatalogo {
    vias: number
    id: string
    nombre: string
    precioUnitario: number
}

export interface Catalogo {
    productos: ProductoCatalogo[]
    colectores: ColectorCatalogo[]
}
