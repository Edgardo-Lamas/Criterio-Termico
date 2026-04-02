
import catalogoData from '../data/catalogo.json';

// Definición de tipos para los items del catálogo
export interface ItemCatalogo {
    id: string;
    modelo: string;
    marca: string;
    precio_usd: number;
    descripcion?: string;
}

export interface RadiadorCatalogo extends ItemCatalogo {
    potencia_watts_elemento: number;
}

export interface CalderaCatalogo extends ItemCatalogo {
    potencia_min_watts: number;
    potencia_max_watts: number;
    eficiencia: string;
    tipo: string;
}

export interface TuberiaCatalogo extends ItemCatalogo {
    diametro_mm: number;
    metros_por_unidad: number;
}

export interface AccesorioCatalogo extends ItemCatalogo { }

export interface DetallePresupuesto {
    caldera: {
        producto: CalderaCatalogo;
        cantidad: number;
        subtotal: number;
    } | null;
    radiadores: {
        producto: RadiadorCatalogo;
        cantidad_elementos_total: number; // Suma total de elementos necesarios
        cantidad_unidades_estimada: number; // Cantidad de radiadores físicos
        subtotal: number;
    } | null;
    tuberias: {
        producto: TuberiaCatalogo;
        cantidad_rollos: number;
        subtotal: number;
    }[];
    accesorios: {
        producto: AccesorioCatalogo;
        cantidad: number;
        subtotal: number;
    }[];
    costo_total_final: number;
    nota?: string;
    error?: string;
}

/**
 * Servicio para generar presupuestos de calefacción
 */
export const generarPresupuesto = (
    potenciaTotalRequeridaWatts: number,
    cantidadRadiadores: number
): DetallePresupuesto => {
    // 1. Validar entrada (Validación Estricta Profesional)
    if (potenciaTotalRequeridaWatts <= 0) {
        return {
            caldera: null, radiadores: null, tuberias: [], accesorios: [],
            costo_total_final: 0,
            error: "La potencia requerida debe ser mayor a 0."
        };
    }

    if (cantidadRadiadores <= 0) {
        return {
            caldera: null, radiadores: null, tuberias: [], accesorios: [],
            costo_total_final: 0,
            error: "Diseño incompleto: Se requiere la cantidad de radiadores para el cálculo de componentes."
        };
    }

    // Margen de seguridad (ej. 15%)
    const potenciaConMargen = potenciaTotalRequeridaWatts * 1.15;
    let costoTotal = 0;

    // 2. Seleccionar Caldera
    const calderas = catalogoData.calderas as CalderaCatalogo[];
    const calderasAptas = calderas.filter(c => c.potencia_max_watts >= potenciaConMargen);
    calderasAptas.sort((a, b) => a.precio_usd - b.precio_usd);
    const calderaSeleccionada = calderasAptas.length > 0 ? calderasAptas[0] : null;

    let detalleCaldera = null;
    if (calderaSeleccionada) {
        detalleCaldera = {
            producto: calderaSeleccionada,
            cantidad: 1,
            subtotal: calderaSeleccionada.precio_usd
        };
        costoTotal += detalleCaldera.subtotal;
    }

    // 3. Seleccionar Radiadores (Elementos)
    const radiadores = catalogoData.radiadores as RadiadorCatalogo[];
    radiadores.sort((a, b) => (a.precio_usd / a.potencia_watts_elemento) - (b.precio_usd / b.potencia_watts_elemento));
    const radiadorSeleccionado = radiadores[0];

    let detalleRadiadores = null;
    if (radiadorSeleccionado) {
        const elementosNecesarios = Math.ceil(potenciaTotalRequeridaWatts / radiadorSeleccionado.potencia_watts_elemento);
        const subtotalRadiadores = elementosNecesarios * radiadorSeleccionado.precio_usd;

        detalleRadiadores = {
            producto: radiadorSeleccionado,
            cantidad_elementos_total: elementosNecesarios,
            cantidad_unidades_estimada: cantidadRadiadores, // Usamos el dato real del plano
            subtotal: subtotalRadiadores
        };

        costoTotal += subtotalRadiadores;
    }

    // 4. Estimación de Tuberías
    const metrosEstimados = Math.ceil((potenciaTotalRequeridaWatts / 1000) * 15);
    const tuberias = catalogoData.tuberias as TuberiaCatalogo[];
    const tuberiaEstandar = tuberias.find(t => t.diametro_mm === 16) || tuberias[0];

    let detalleTuberias = [];
    if (tuberiaEstandar) {
        const rollosNecesarios = Math.ceil(metrosEstimados / tuberiaEstandar.metros_por_unidad);
        const cantidadRollos = rollosNecesarios > 0 ? rollosNecesarios : 1;

        const subtotalTuberias = cantidadRollos * tuberiaEstandar.precio_usd;
        detalleTuberias.push({
            producto: tuberiaEstandar,
            cantidad_rollos: cantidadRollos,
            subtotal: subtotalTuberias
        });
        costoTotal += subtotalTuberias;
    }

    // 5. Calcular Accesorios Obligatorios
    const accesoriosCatalogo = (catalogoData.accesorios || []) as AccesorioCatalogo[];
    const detalleAccesorios = [];

    // A. Kit Instalación Radiadores (1 por cada radiador del plano)
    const kitRadiador = accesoriosCatalogo.find(a => a.id === 'kit_inst_radiador');
    if (kitRadiador) {
        const subtotalKit = cantidadRadiadores * kitRadiador.precio_usd;
        detalleAccesorios.push({
            producto: kitRadiador,
            cantidad: cantidadRadiadores,
            subtotal: subtotalKit
        });
        costoTotal += subtotalKit;
    }

    // B. Termostato Ambiente (1 unidad fija)
    const termostato = accesoriosCatalogo.find(a => a.id === 'termostato_ambiente');
    if (termostato) {
        detalleAccesorios.push({
            producto: termostato,
            cantidad: 1,
            subtotal: termostato.precio_usd
        });
        costoTotal += termostato.precio_usd;
    }

    // C. Kit Conexiones Caldera (1 unidad fija si hay caldera)
    if (calderaSeleccionada) {
        const kitCaldera = accesoriosCatalogo.find(a => a.id === 'kit_conexiones_caldera');
        if (kitCaldera) {
            detalleAccesorios.push({
                producto: kitCaldera,
                cantidad: 1,
                subtotal: kitCaldera.precio_usd
            });
            costoTotal += kitCaldera.precio_usd;
        }
    }

    let nota = undefined;
    if (!calderaSeleccionada) {
        nota = "ADVERTENCIA: No se encontró una caldera adecuada en el catálogo.";
    }

    return {
        caldera: detalleCaldera,
        radiadores: detalleRadiadores,
        tuberias: detalleTuberias,
        accesorios: detalleAccesorios,
        costo_total_final: Number(costoTotal.toFixed(2)),
        nota,
        error: undefined
    };
};
