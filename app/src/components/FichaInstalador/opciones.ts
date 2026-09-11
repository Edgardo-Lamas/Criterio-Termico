/**
 * Las opciones de la ficha del instalador.
 *
 * Viven acá y no dentro del componente porque son la MISMA lista que valida la
 * base (`20260911_ficha_instalador.sql`) y que traduce el asistente
 * (`asistente-termico/index.ts`). Los tres lugares tienen que decir lo mismo:
 * si acá aparece una opción que el check de la base no acepta, el guardado
 * falla; si el asistente no la conoce, la ficha se guarda y Martín no la lee.
 *
 * 🔑 Casi todo es de opciones cerradas a propósito. La ficha también es la base
 * para segmentar, y un campo libre se lee pero no se cuenta: «zona norte»,
 * «Vicente López» y «GBA» son tres respuestas para el mismo instalador.
 */

export const PROVINCIAS = [
    ['buenos-aires', 'Buenos Aires'],
    ['caba', 'Ciudad de Buenos Aires'],
    ['catamarca', 'Catamarca'],
    ['chaco', 'Chaco'],
    ['chubut', 'Chubut'],
    ['cordoba', 'Córdoba'],
    ['corrientes', 'Corrientes'],
    ['entre-rios', 'Entre Ríos'],
    ['formosa', 'Formosa'],
    ['jujuy', 'Jujuy'],
    ['la-pampa', 'La Pampa'],
    ['la-rioja', 'La Rioja'],
    ['mendoza', 'Mendoza'],
    ['misiones', 'Misiones'],
    ['neuquen', 'Neuquén'],
    ['rio-negro', 'Río Negro'],
    ['salta', 'Salta'],
    ['san-juan', 'San Juan'],
    ['san-luis', 'San Luis'],
    ['santa-cruz', 'Santa Cruz'],
    ['santa-fe', 'Santa Fe'],
    ['santiago-del-estero', 'Santiago del Estero'],
    ['tierra-del-fuego', 'Tierra del Fuego'],
    ['tucuman', 'Tucumán'],
] as const

export const INSTALA = [
    ['radiadores', 'Radiadores'],
    ['piso-radiante', 'Piso radiante'],
    ['ambas', 'Las dos'],
] as const

export const TRABAJOS = [
    ['obra-nueva', 'Obra nueva'],
    ['reforma', 'Reforma'],
    ['service', 'Service y reparación'],
] as const

export const COMBUSTIBLES = [
    ['natural', 'Gas natural'],
    ['envasado', 'Gas envasado'],
    ['ambos', 'Las dos cosas'],
] as const

/**
 * Sólo las tres marcas que tienen tabla de fallas cargada en `conocimiento`.
 * El resto va en el campo «otras», que además dice qué manual conviene sumar.
 */
export const MARCAS = [
    ['peisa', 'PEISA'],
    ['baxi', 'BAXI'],
    ['caldaia', 'CALDAIA'],
] as const

/** Tope de la nota. Viaja en CADA consulta: un texto largo se paga muchas veces. */
export const NOTA_MAX = 400
/** Tope de «otras marcas», igual que el check de la base. */
export const OTRAS_MAX = 120

export interface Ficha {
    provincia: string | null
    instala: string | null
    trabajos: string[]
    combustible: string | null
    marcas: string[]
    marcas_otras: string | null
    nota: string | null
}

export const FICHA_VACIA: Ficha = {
    provincia: null,
    instala: null,
    trabajos: [],
    combustible: null,
    marcas: [],
    marcas_otras: null,
    nota: null,
}

/** ¿Hay algo cargado? Con la ficha vacía, Martín queda como estaba. */
export function fichaTieneAlgo(f: Ficha): boolean {
    return !!(
        f.provincia || f.instala || f.combustible ||
        f.trabajos.length || f.marcas.length ||
        f.marcas_otras?.trim() || f.nota?.trim()
    )
}
