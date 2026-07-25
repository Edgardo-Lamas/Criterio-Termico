import type { ComponentType } from 'react'

import { errorRadiadoresFrios, ErrorRadiadoresFriosDetalle } from './radiadores-frios'
import { errorRuidosTuberia, ErrorRuidosTuberiaDetalle } from './ruidos-tuberia'
import { errorFacturaAlta, ErrorFacturaAltaDetalle } from './factura-alta'
import { errorCalderaCortaCiclado, ErrorCalderaCortaCicladoDetalle } from './caldera-corta-ciclado'
import { errorRadiadorFrioAbajo, ErrorRadiadorFrioAbajoDetalle } from './radiador-frio-abajo'
import { errorSelladoresRosca, ErrorSelladoresRoscaDetalle } from './selladores-rosca'
import { errorPruebaHidraulica, ErrorPruebaHidraulicaDetalle } from './prueba-hidraulica'
import { errorPresionPasivador, ErrorPresionPasivadorDetalle } from './presion-pasivador'
import { errorPresionVasoMembrana, ErrorPresionVasoMembranaDetalle } from './presion-vaso-membrana'
import { errorPresionSubeAguaRed, ErrorPresionSubeAguaRedDetalle } from './presion-sube-agua-red'
import { errorAnticongelante, ErrorAnticongelanteDetalle } from './anticongelante'
import { errorCalidadAgua, ErrorCalidadAguaDetalle } from './calidad-agua'
import { errorRamalRobado, ErrorRamalRobadoDetalle } from './ramal-robado'
import { errorPexMemoriaTermica, ErrorPexMemoriaTermicaDetalle } from './pex-memoria-termica'
import { errorEmpalmesPisoRadiante, ErrorEmpalmesPisoRadianteDetalle } from './empalmes-piso-radiante'
import { errorEmisorMalElegido, ErrorEmisorMalElegidoDetalle } from './emisor-mal-elegido'
import { errorCortinasRadiadores, ErrorCortinasRadiadoresDetalle } from './cortinas-radiadores'

// Los tipos viven en ./tipos para que los casos puedan anotarse sin importar
// desde este archivo, que a su vez los importa a ellos.
export type { ErrorTier, ErrorMeta, EntradaIndice, FamiliaIndice } from './tipos'
export { FAMILIAS } from './tipos'

import { FAMILIAS } from './tipos'
import type { ErrorMeta, EntradaIndice, FamiliaIndice } from './tipos'

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
    errorPresionVasoMembrana,
    errorPresionSubeAguaRed,
    errorAnticongelante,
    errorCalidadAgua,
    errorRamalRobado,
    errorPexMemoriaTermica,
    errorEmpalmesPisoRadiante,
    errorEmisorMalElegido,
    errorCortinasRadiadores,
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
    'presion-vaso-membrana': ErrorPresionVasoMembranaDetalle,
    'presion-sube-agua-red': ErrorPresionSubeAguaRedDetalle,
    'anticongelante': ErrorAnticongelanteDetalle,
    'calidad-agua': ErrorCalidadAguaDetalle,
    'ramal-robado': ErrorRamalRobadoDetalle,
    'pex-memoria-termica': ErrorPexMemoriaTermicaDetalle,
    'empalmes-piso-radiante': ErrorEmpalmesPisoRadianteDetalle,
    'emisor-mal-elegido': ErrorEmisorMalElegidoDetalle,
    'cortinas-radiadores': ErrorCortinasRadiadoresDetalle,
}

export function getErrorMeta(id: string): ErrorMeta | null {
    return erroresList.find(e => e.id === id) ?? null
}

export function getErrorContent(id: string): ComponentType | null {
    return erroresContent[id] ?? null
}

/** Una entrada del índice ya resuelta: sabe a qué caso pertenece y con qué tier. */
export interface EntradaResuelta extends EntradaIndice {
    errorId: string
    errorTitulo: string
    tier: ErrorMeta['tier']
    /** Destino final: la ruta del caso más el ancla del párrafo. */
    href: string
}

/**
 * Índice temático: se arma solo a partir del `cubre` de cada caso, así un caso
 * nuevo aparece sin tocar este archivo. Ordenado alfabéticamente dentro de cada
 * familia — el instalador escanea la lista, no la busca.
 */
export function getIndiceTematico(): { familia: FamiliaIndice; entradas: EntradaResuelta[] }[] {
    const todas: EntradaResuelta[] = erroresList.flatMap(error =>
        (error.cubre ?? []).map(entrada => ({
            ...entrada,
            errorId: error.id,
            errorTitulo: error.titulo,
            tier: error.tier,
            href: `/errores/${error.id}#${entrada.ancla}`,
        }))
    )

    return FAMILIAS.map(familia => ({
        familia: familia.id,
        entradas: todas
            .filter(e => e.familia === familia.id)
            .sort((a, b) => a.termino.localeCompare(b.termino, 'es')),
    })).filter(grupo => grupo.entradas.length > 0)
}
