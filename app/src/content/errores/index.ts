import type { ComponentType } from 'react'

import { errorRadiadoresFrios, ErrorRadiadoresFriosDetalle } from './radiadores-frios'
import { errorRuidosTuberia, ErrorRuidosTuberiaDetalle } from './ruidos-tuberia'
import { errorFacturaAlta, ErrorFacturaAltaDetalle } from './factura-alta'
import { errorCalderaCortaCiclado, ErrorCalderaCortaCicladoDetalle } from './caldera-corta-ciclado'
import { errorRadiadorFrioAbajo, ErrorRadiadorFrioAbajoDetalle } from './radiador-frio-abajo'
import { errorSelladoresRosca, ErrorSelladoresRoscaDetalle } from './selladores-rosca'
import { errorPruebaHidraulica, ErrorPruebaHidraulicaDetalle } from './prueba-hidraulica'
import { errorPresionPasivador, ErrorPresionPasivadorDetalle } from './presion-pasivador'
import { errorAnticongelante, ErrorAnticongelanteDetalle } from './anticongelante'
import { errorCalidadAgua, ErrorCalidadAguaDetalle } from './calidad-agua'

export type ErrorTier = 'free' | 'pro' | 'premium'

export interface ErrorMeta {
    id: string
    titulo: string
    categoria: string
    tier: ErrorTier
    preview: string
    resumen: string
}

// Lista completa de errores (usada en la página de índice)
export const erroresList: ErrorMeta[] = [
    errorRadiadoresFrios,
    errorRuidosTuberia,
    errorFacturaAlta,
    errorCalderaCortaCiclado,
    errorRadiadorFrioAbajo,
    errorSelladoresRosca,
    errorPruebaHidraulica,
    errorPresionPasivador,
    errorAnticongelante,
    errorCalidadAgua,
]

// Componentes de detalle mapeados por ID
const erroresContent: Record<string, ComponentType> = {
    'radiadores-frios': ErrorRadiadoresFriosDetalle,
    'ruidos-tuberia': ErrorRuidosTuberiaDetalle,
    'factura-alta': ErrorFacturaAltaDetalle,
    'caldera-corta-ciclado': ErrorCalderaCortaCicladoDetalle,
    'radiador-frio-abajo': ErrorRadiadorFrioAbajoDetalle,
    'selladores-rosca': ErrorSelladoresRoscaDetalle,
    'prueba-hidraulica': ErrorPruebaHidraulicaDetalle,
    'presion-pasivador': ErrorPresionPasivadorDetalle,
    'anticongelante': ErrorAnticongelanteDetalle,
    'calidad-agua': ErrorCalidadAguaDetalle,
}

export function getErrorMeta(id: string): ErrorMeta | null {
    return erroresList.find(e => e.id === id) ?? null
}

export function getErrorContent(id: string): ComponentType | null {
    return erroresContent[id] ?? null
}
