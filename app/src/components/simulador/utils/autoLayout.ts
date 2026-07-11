// Auto-colocación de radiadores (Etapa 1 del auto-diseño).
// A partir del contorno de la habitación marcado sobre el plano (Room.bounds)
// y de su carga térmica, decide cuántos radiadores hacen falta, de cuántos
// elementos cada uno, y los apoya contra la pared más larga del ambiente.
// Es un BORRADOR: el instalador después los arrastra a su posición real
// (debajo de las ventanas, etc.) — el sistema no sabe dónde están las ventanas.

import type { Room } from '../models/Room';
import { calculateRoomPower } from './thermalCalculator';

// Alturas estándar de elemento y su potencia (criterio de Edgardo: 500 mm =
// 200 kcal/h; 600 y 700 proporcionales — ajustar si el catálogo indica otra
// cosa). El valor de 200 ya es conservador de por sí.
export type AlturaElementoMm = 500 | 600 | 700;
export const ELEMENTOS_KCALH_POR_ALTURA: Record<AlturaElementoMm, number> = {
  500: 200,
  600: 240,
  700: 280,
};
export const ELEMENTO_KCALH = ELEMENTOS_KCALH_POR_ALTURA[500];
// Tope de elementos por batería — criterio HIDRÁULICO de Edgardo: las bombas
// circuladoras que traen las calderas no mueven bien baterías más grandes
// (mucha pérdida de carga). Se puede superar con equilibrado fino, bomba más
// grande o una segunda bomba en serie, pero es un gasto que no conviene
// generar si no es estrictamente necesario.
export const MAX_ELEMENTOS_POR_RADIADOR = 12;

// Vista superior del canvas: 1 px = 10 mm (misma convención que la caldera).
// Cada elemento tiene ~80 mm de frente → 8 px por elemento.
const PX_POR_ELEMENTO = 8;
const ALTO_RADIADOR_PX = 12;  // fondo del radiador en vista superior
const SEPARACION_PARED_PX = 4; // aire entre el radiador y la pared

export interface RadiadorPropuesto {
  x: number;
  y: number;
  width: number;
  height: number;
  power: number;
  elementos: number;
}

/**
 * Propone los radiadores de una habitación con contorno marcado.
 * Devuelve [] si la habitación no tiene bounds.
 */
export function autoColocarRadiadores(
  room: Room,
  elementoKcalh: number = ELEMENTO_KCALH
): RadiadorPropuesto[] {
  const bounds = room.bounds;
  if (!bounds || bounds.width <= 0 || bounds.height <= 0) return [];

  // SIN margen extra del 15% (criterio de Edgardo): el factor volumétrico ya
  // viene sobredimensionado, tiene sus propios incrementos por pared exterior
  // y ventanas, y los kcal/h por elemento también son conservadores. El
  // redondeo a elementos enteros hacia arriba ya aporta la holgura que falta.
  const requerido = calculateRoomPower(room);
  const elementosTotales = Math.max(1, Math.ceil(requerido / elementoKcalh));
  const cantidad = Math.max(1, Math.ceil(elementosTotales / MAX_ELEMENTOS_POR_RADIADOR));

  // Repartir los elementos lo más parejo posible (los primeros llevan la sobra)
  const base = Math.floor(elementosTotales / cantidad);
  const sobra = elementosTotales % cantidad;
  const elementosPorRadiador = Array.from(
    { length: cantidad },
    (_, i) => base + (i < sobra ? 1 : 0)
  );

  // Pared más larga del rectángulo: los radiadores se apoyan contra ella,
  // repartidos en tramos iguales y centrados en su tramo
  const horizontal = bounds.width >= bounds.height;
  const largoPared = horizontal ? bounds.width : bounds.height;
  const tramo = largoPared / cantidad;

  return elementosPorRadiador.map((elementos, i) => {
    const frentePx = Math.max(elementos * PX_POR_ELEMENTO, 24);
    const centroTramo = tramo * i + tramo / 2;

    if (horizontal) {
      // Apoyado contra la pared superior del contorno
      return {
        x: bounds.x + centroTramo - frentePx / 2,
        y: bounds.y + SEPARACION_PARED_PX,
        width: frentePx,
        height: ALTO_RADIADOR_PX,
        power: elementos * elementoKcalh,
        elementos,
      };
    }
    // Habitación más alta que ancha: apoyado contra la pared izquierda,
    // radiador "rotado" (frente a lo largo del eje Y)
    return {
      x: bounds.x + SEPARACION_PARED_PX,
      y: bounds.y + centroTramo - frentePx / 2,
      width: ALTO_RADIADOR_PX,
      height: frentePx,
      power: elementos * elementoKcalh,
      elementos,
    };
  });
}
