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

// Entrada del presupuesto de materiales. Sirve tanto para la Calculadora
// (valores estimados) como para el Simulador 2D (longitudes/áreas reales de
// los circuitos dibujados sobre el plano).
export interface MaterialesPisoRadianteInput {
    longitudTotal: number          // m de tubo PEX (serpentines + acometidas)
    area: number                   // m² de superficie cubierta
    perimetro: number              // m de banda perimetral
    circuitosPorColector: number[] // circuitos que atiende cada colector (vías necesarias)
}

export function calcularMaterialesPisoRadiante(input: MaterialesPisoRadianteInput): ResumenPresupuesto {
    const items: ItemPresupuesto[] = []
    const WASTE = 1.05

    const get = (id: string) => CATALOGO.productos.find(p => p.id === id)

    // 1. Tubo PEX
    const pex = get('TUB-PEX-20')
    if (pex) items.push(crearItem(pex.id, pex.nombre, Math.ceil(input.longitudTotal * WASTE), pex.unidad, pex.precioUnitario))

    // 2. Placa aislante
    const placa = get('PLA-AIS-EPS')
    if (placa) items.push(crearItem(placa.id, placa.nombre, Math.ceil(input.area), placa.unidad, placa.precioUnitario))

    // 3. Banda perimetral
    const banda = get('BAN-PER-PE')
    if (banda) items.push(crearItem(banda.id, banda.nombre, Math.ceil(input.perimetro), banda.unidad, banda.precioUnitario))

    // 4. Malla electrosoldada
    const malla = get('MAL-ELE-42')
    if (malla) items.push(crearItem(malla.id, malla.nombre, Math.ceil(input.area), malla.unidad, malla.precioUnitario))

    // 5. Precintos (1 bolsa cada 100 m)
    const precintos = get('PRE-SUJ-BOL')
    if (precintos) {
        const bolsas = Math.ceil(input.longitudTotal / 100)
        items.push(crearItem(precintos.id, precintos.nombre, bolsas, precintos.unidad, precintos.precioUnitario))
    }

    // 6. Colectores + válvulas + gabinete — el colector más chico que cubra
    // las vías de cada grupo de circuitos; colectores iguales se agrupan.
    const colectoresPorId = new Map<string, { nombre: string; precio: number; cantidad: number }>()
    for (const vias of input.circuitosPorColector) {
        if (vias <= 0) continue
        const colector = CATALOGO.colectores
            .slice()
            .sort((a, b) => a.vias - b.vias)
            .find(c => c.vias >= vias)
        if (!colector) continue
        const previo = colectoresPorId.get(colector.id)
        if (previo) previo.cantidad += 1
        else colectoresPorId.set(colector.id, { nombre: colector.nombre, precio: colector.precioUnitario, cantidad: 1 })
    }

    const totalColectores = [...colectoresPorId.values()].reduce((acc, c) => acc + c.cantidad, 0)
    for (const [id, c] of colectoresPorId) {
        items.push(crearItem(id, c.nombre, c.cantidad, 'un', c.precio))
    }
    if (totalColectores > 0) {
        const valvulas = get('VAL-ESF-PAR')
        if (valvulas) items.push(crearItem(valvulas.id, valvulas.nombre, totalColectores, valvulas.unidad, valvulas.precioUnitario))

        const gabinete = get('GAB-MET-COL')
        if (gabinete) items.push(crearItem(gabinete.id, gabinete.nombre, totalColectores, gabinete.unidad, gabinete.precioUnitario))
    }

    const totalMateriales = items.reduce((acc, item) => acc + item.subtotal, 0)

    return {
        items,
        totalMateriales: Math.round(totalMateriales * 100) / 100,
        desperdicioEstimado: Math.round(input.longitudTotal * 0.05 * 100) / 100,
        totalFinal: Math.round(totalMateriales * 100) / 100
    }
}

export function calcularPresupuesto(
    techData: UnderfloorCalculationOutput,
    area: number
): ResumenPresupuesto {
    return calcularMaterialesPisoRadiante({
        longitudTotal: techData.longitudTotal,
        area,
        // Perímetro estimado de un cuadrado equivalente + 20% de margen
        perimetro: Math.ceil(Math.sqrt(area) * 4 * 1.2),
        circuitosPorColector: [techData.numeroCircuitos],
    })
}
