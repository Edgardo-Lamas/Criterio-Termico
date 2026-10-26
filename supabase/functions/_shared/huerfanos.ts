// Fragmentos huérfanos del RAG: los que quedaron en public.conocimiento pero ya
// no salen del contenido actual.
//
// 🔴 Por qué existe: la indexación hace upsert por source_id (`manual:cap-x#N`,
// `caso:x#N`) y nunca borraba. Cuando un capítulo o un caso queda con MENOS
// secciones, la última vieja sobrevive y Martín sigue contestando con ella. Pasó
// el 2026-10-26: el cap. 5 se reescribió y `manual:cap-radiadores#6` siguió con
// los 150 kcal/h y las marcas que se habían sacado del manual.

/**
 * Los únicos prefijos que se pueden purgar: los que genera `reindexar-rag.mjs`.
 * Las fallas por marca (`falla:`) y las fichas sueltas del manual (`manual:` sin
 * `cap-`) se cargan por otro camino y NO salen de la extracción: purgarlas
 * con esta lista las borraría todas.
 */
export const PREFIJOS_PURGABLES = ['caso:', 'manual:cap-'] as const

/**
 * Si la purga se llevaría más que esta fracción de lo que hay, se frena: es más
 * probable una extracción rota que medio manual borrado a propósito.
 */
export const TOPE_PURGA = 0.2

export interface ResultadoPurga {
    huerfanos: string[]
    /** Motivo por el que NO se debe borrar nada; null si se puede. */
    frenada: string | null
}

export function calcularHuerfanos(
    existentes: readonly string[],
    vigentes: readonly string[],
    prefijos: readonly string[],
): ResultadoPurga {
    const ajenos = prefijos.filter((p) => !(PREFIJOS_PURGABLES as readonly string[]).includes(p))
    if (ajenos.length) {
        return { huerfanos: [], frenada: `prefijo no purgable: ${ajenos.join(', ')}` }
    }
    if (vigentes.length === 0) {
        return { huerfanos: [], frenada: 'la lista de vigentes está vacía' }
    }

    const enAlcance = existentes.filter((id) => prefijos.some((p) => id.startsWith(p)))
    const vivos = new Set(vigentes)
    const huerfanos = enAlcance.filter((id) => !vivos.has(id)).sort()

    if (enAlcance.length > 0 && huerfanos.length / enAlcance.length > TOPE_PURGA) {
        return {
            huerfanos,
            frenada: `se borrarían ${huerfanos.length} de ${enAlcance.length} fragmentos (más del ${TOPE_PURGA * 100} %)`,
        }
    }
    return { huerfanos, frenada: null }
}
