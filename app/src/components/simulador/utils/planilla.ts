// Planilla de radiadores — como en los planos de obra: sobre el plano solo se
// ve cada radiador con su identificación ("R1", "R2", ...) y todos los datos
// (ambiente, elementos, altura, potencia) van en la planilla, que se muestra
// en el simulador y en el PDF del plano técnico.

import type { Radiator } from '../models/Radiator';
import type { Room } from '../models/Room';
import { ELEMENTOS_KCALH_POR_ALTURA } from './autoLayout';

// 🔴 Altura que se asume cuando el radiador no trae composición cargada, para
// poder dar igual la cantidad de elementos. Es criterio de Edgardo y el mismo
// valor por defecto de la auto-colocación: 500 mm = 200 kcal/h. La cantidad
// calculada así se marca como tal —`calculado: true`— y NO se presenta como
// un dato que cargó el usuario.
export const ALTURA_ASUMIDA_MM = 500;
export const KCALH_ELEMENTO_ASUMIDO = ELEMENTOS_KCALH_POR_ALTURA[ALTURA_ASUMIDA_MM];

// Etiquetas "R1..Rn" por orden de creación, únicas en todo el proyecto
// (las dos plantas comparten la numeración para que no haya dos R1).
export function etiquetasRadiadores(radiators: Radiator[]): Map<string, string> {
  const etiquetas = new Map<string, string>();
  radiators.forEach((r, i) => etiquetas.set(r.id, `R${i + 1}`));
  return etiquetas;
}

export interface FilaPlanilla {
  radiatorId: string;
  etiqueta: string;
  ambiente: string; // 'sin asignar' si no cae dentro de ninguna habitación
  elementos: number | null;
  alturaMm: number | null;
  /** La composición se calculó por potencia, no la cargó el usuario. */
  calculado: boolean;
  potenciaKcalh: number;
  floor?: 'ground' | 'first';
}

/**
 * Composición del radiador. Si el usuario la cargó, es la suya. Si no, se
 * CALCULA por potencia —así es como se presupuesta— en vez de dejar la
 * columna vacía: una planilla que declara ELEMENTOS y no lo dice en ninguna
 * fila no sirve para comprar.
 */
function composicion(r: Radiator): Pick<FilaPlanilla, 'elementos' | 'alturaMm' | 'calculado'> {
  if (r.elementos && r.alturaElementoMm) {
    return { elementos: r.elementos, alturaMm: r.alturaElementoMm, calculado: false };
  }
  if (!(r.power > 0)) return { elementos: null, alturaMm: null, calculado: false };
  const altura = r.alturaElementoMm ?? ALTURA_ASUMIDA_MM;
  const porElemento = ELEMENTOS_KCALH_POR_ALTURA[altura as 500 | 600 | 700]
    ?? ELEMENTOS_KCALH_POR_ALTURA[ALTURA_ASUMIDA_MM];
  return {
    elementos: Math.max(1, Math.ceil(r.power / porElemento)),
    alturaMm: altura,
    calculado: true,
  };
}

/** Planta del elemento, con el mismo criterio que usa todo el simulador. */
function plantaDe(e: { floor?: 'ground' | 'first' }): 'ground' | 'first' {
  return e.floor === 'first' ? 'first' : 'ground';
}

/**
 * El ambiente del radiador. Primero por la asignación explícita, y si no la
 * tiene, POR DÓNDE ESTÁ DIBUJADO: el radiador que se colocó a mano no queda
 * en `radiatorIds`, y la planilla salía declarando la columna AMBIENTE y
 * dejándola vacía en todas las filas. El dato está —el radiador está adentro
 * del ambiente—, sólo había que ir a buscarlo.
 */
function ambienteDe(r: Radiator, rooms: Room[]): string {
  const asignado = rooms.find(rm => rm.radiatorIds.includes(r.id));
  if (asignado) return asignado.name;
  // Por contención: el centro del radiador dentro del contorno del ambiente
  const cx = r.x + r.width / 2;
  const cy = r.y + r.height / 2;
  const contiene = rooms.find(rm => {
    const b = rm.bounds;
    if (!b || plantaDe(rm) !== plantaDe(r)) return false;
    return cx >= b.x && cx <= b.x + b.width && cy >= b.y && cy <= b.y + b.height;
  });
  return contiene?.name ?? 'sin asignar';
}

export function planillaRadiadores(radiators: Radiator[], rooms: Room[]): FilaPlanilla[] {
  const etiquetas = etiquetasRadiadores(radiators);
  return radiators.map(r => ({
    radiatorId: r.id,
    etiqueta: etiquetas.get(r.id) ?? '',
    ambiente: ambienteDe(r, rooms),
    ...composicion(r),
    potenciaKcalh: r.power,
    floor: r.floor,
  }));
}
