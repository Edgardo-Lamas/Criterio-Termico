// Servicio de presupuesto de materiales — usa catálogo inline en USD
// Adaptado de: API Piso Radiante (Edgardo Lamas)

import type { UnderfloorCalculationOutput, ItemPresupuesto, ResumenPresupuesto } from './types'
import { CATALOGO } from './catalogo'

function crearItem(
    id: string, nombre: string, cantidad: number,
    unidad: string, precio: number
): ItemPresupuesto {
    return { productoId: id, nombre, cantidad, unidad, precioUnitario: precio, subtotal: cantidad * precio }
}

export function calcularPresupuesto(
    techData: UnderfloorCalculationOutput,
    area: number
): ResumenPresupuesto {
    const items: ItemPresupuesto[] = []
    const WASTE = 1.05

    const get = (id: string) => CATALOGO.productos.find(p => p.id === id)

    // 1. Tubo PEX
    const pex = get('TUB-PEX-20')
    if (pex) items.push(crearItem(pex.id, pex.nombre, Math.ceil(techData.longitudTotal * WASTE), pex.unidad, pex.precioUnitario))

    // 2. Placa aislante
    const placa = get('PLA-AIS-EPS')
    if (placa) items.push(crearItem(placa.id, placa.nombre, Math.ceil(area), placa.unidad, placa.precioUnitario))

    // 3. Banda perimetral (perímetro estimado de cuadrado + 20% margen)
    const banda = get('BAN-PER-PE')
    if (banda) {
        const perimetro = Math.ceil(Math.sqrt(area) * 4 * 1.2)
        items.push(crearItem(banda.id, banda.nombre, perimetro, banda.unidad, banda.precioUnitario))
    }

    // 4. Malla electrosoldada
    const malla = get('MAL-ELE-42')
    if (malla) items.push(crearItem(malla.id, malla.nombre, Math.ceil(area), malla.unidad, malla.precioUnitario))

    // 5. Precintos (1 bolsa cada 100 m)
    const precintos = get('PRE-SUJ-BOL')
    if (precintos) {
        const bolsas = Math.ceil(techData.longitudTotal / 100)
        items.push(crearItem(precintos.id, precintos.nombre, bolsas, precintos.unidad, precintos.precioUnitario))
    }

    // 6. Tubería de alimentación (diseño avanzado)
    const distAlim = techData.distanciaAlimentacion ?? 0
    if (distAlim > 0) {
        const tuboAlim = get('TUB-ALIM-1P')
        const aisAlim  = get('AIS-ALIM-1P')
        if (tuboAlim) items.push(crearItem(tuboAlim.id, tuboAlim.nombre, Math.ceil(distAlim), tuboAlim.unidad, tuboAlim.precioUnitario))
        if (aisAlim)  items.push(crearItem(aisAlim.id,  aisAlim.nombre,  Math.ceil(distAlim), aisAlim.unidad,  aisAlim.precioUnitario))
    }

    // 7. Colector + válvulas + gabinete
    const colector = CATALOGO.colectores
        .slice()
        .sort((a, b) => a.vias - b.vias)
        .find(c => c.vias >= techData.numeroCircuitos)

    if (colector) {
        items.push(crearItem(colector.id, colector.nombre, 1, 'un', colector.precioUnitario))

        const valvulas = get('VAL-ESF-PAR')
        if (valvulas) items.push(crearItem(valvulas.id, valvulas.nombre, 1, valvulas.unidad, valvulas.precioUnitario))

        const gabinete = get('GAB-MET-COL')
        if (gabinete) items.push(crearItem(gabinete.id, gabinete.nombre, 1, gabinete.unidad, gabinete.precioUnitario))
    }

    const totalMateriales = items.reduce((acc, item) => acc + item.subtotal, 0)

    return {
        items,
        totalMateriales: Math.round(totalMateriales * 100) / 100,
        desperdicioEstimado: Math.round(techData.longitudTotal * 0.05 * 100) / 100,
        totalFinal: Math.round(totalMateriales * 100) / 100
    }
}
