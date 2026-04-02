import type { ElementBase } from './ElementBase';

export interface Radiator extends ElementBase {
  type: 'radiator';
  power: number;
  width: number;
  height: number;
  floor?: 'ground' | 'first'; // Planta donde está ubicado
}
