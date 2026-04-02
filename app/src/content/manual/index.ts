import type { ComponentType } from 'react'
import { Cap1Relevamiento } from './cap1-relevamiento'
import { Cap2Confort } from './cap2-confort'
import { Cap3Perdidas } from './cap3-perdidas'
import { Cap4Potencia } from './cap4-potencia'
import { Cap5Radiadores } from './cap5-radiadores'

// Registro de contenido disponible por ID de capítulo.
// Agregar aquí cada capítulo nuevo a medida que se escribe.
export const manualContent: Record<string, ComponentType> = {
    relevamiento: Cap1Relevamiento,
    confort: Cap2Confort,
    perdidas: Cap3Perdidas,
    potencia: Cap4Potencia,
    radiadores: Cap5Radiadores,
}

export function getCapituloContent(id: string): ComponentType | null {
    return manualContent[id] ?? null
}
