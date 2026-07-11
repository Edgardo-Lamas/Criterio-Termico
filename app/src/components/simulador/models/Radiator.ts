import type { ElementBase } from './ElementBase';

export interface Radiator extends ElementBase {
  type: 'radiator';
  power: number;
  width: number;
  height: number;
  floor?: 'ground' | 'first'; // Planta donde está ubicado
  // Composición de la batería (los setea la auto-colocación; los radiadores
  // manuales pueden no tenerlos). Se muestran en la planilla de radiadores.
  elementos?: number;
  alturaElementoMm?: number; // 500 / 600 / 700
}
