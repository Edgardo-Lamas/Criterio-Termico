import type { ElementBase } from './ElementBase';

// Zona de piso radiante dibujada sobre el plano. El serpentín se genera
// automáticamente dentro de este rectángulo con el paso configurado.
export interface FloorHeatingZone extends ElementBase {
  type: 'floor-heating-zone';
  name: string;
  roomId?: string; // habitación del plano a la que pertenece (etiqueta los circuitos)
  width: number;   // px del canvas
  height: number;  // px del canvas
  pasoCm: 15 | 20; // separación entre tubos (ver UnderfloorService)
  floor?: 'ground' | 'first';
}
