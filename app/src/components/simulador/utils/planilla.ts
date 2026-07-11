// Planilla de radiadores — como en los planos de obra: sobre el plano solo se
// ve cada radiador con su identificación ("R1", "R2", ...) y todos los datos
// (ambiente, elementos, altura, potencia) van en la planilla, que se muestra
// en el simulador y en el PDF del plano técnico.

import type { Radiator } from '../models/Radiator';
import type { Room } from '../models/Room';

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
  ambiente: string; // '—' si no está asignado a una habitación
  elementos: number | null;
  alturaMm: number | null;
  potenciaKcalh: number;
  floor?: 'ground' | 'first';
}

export function planillaRadiadores(radiators: Radiator[], rooms: Room[]): FilaPlanilla[] {
  const etiquetas = etiquetasRadiadores(radiators);
  return radiators.map(r => {
    const room = rooms.find(rm => rm.radiatorIds.includes(r.id));
    return {
      radiatorId: r.id,
      etiqueta: etiquetas.get(r.id) ?? '',
      ambiente: room?.name ?? '—',
      elementos: r.elementos ?? null,
      alturaMm: r.alturaElementoMm ?? null,
      potenciaKcalh: r.power,
      floor: r.floor,
    };
  });
}
