import type { ElementBase } from './ElementBase';

// Lado del rectángulo de la zona donde está la puerta y fracción t (0..1)
// a lo largo de ese lado. En obra la acometida entra por la puerta.
export type LadoZona = 'arriba' | 'abajo' | 'izquierda' | 'derecha';
export interface PuertaZona {
  lado: LadoZona;
  t: number; // fracción 0..1 a lo largo del lado
}

// Zona de piso radiante dibujada sobre el plano. El serpentín se genera
// automáticamente dentro de este rectángulo con el paso configurado.
export interface FloorHeatingZone extends ElementBase {
  type: 'floor-heating-zone';
  name: string;
  roomId?: string; // habitación del plano a la que pertenece (etiqueta los circuitos)
  manifoldId?: string; // colector asignado a mano (sin esto: el más cercano de la planta)
  puerta?: PuertaZona;  // por dónde entran las acometidas (sin esto: borde más cercano)
  width: number;   // px del canvas
  height: number;  // px del canvas
  pasoCm: 15 | 20; // separación entre tubos (ver UnderfloorService)
  floor?: 'ground' | 'first';
}
