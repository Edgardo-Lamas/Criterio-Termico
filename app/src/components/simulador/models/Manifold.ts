import type { ElementBase } from './ElementBase';

// Colector distribuidor de piso radiante. Cada circuito de las zonas
// asignadas conecta su ida y retorno acá.
export interface Manifold extends ElementBase {
  type: 'manifold';
  width: number;   // px del canvas
  height: number;  // px del canvas
  floor?: 'ground' | 'first';
}
