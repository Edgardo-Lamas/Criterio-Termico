import type { ElementBase } from './ElementBase';

// Pared del rectángulo de la zona que la acometida atraviesa. Ya no se guarda
// en el modelo: se INFIERE de la puerta (ver ladoDesdePuerta), pero el tipo se
// sigue usando en el ruteo de las acometidas.
export type LadoZona = 'arriba' | 'abajo' | 'izquierda' | 'derecha';

// Puerta de la zona = por dónde entran/salen las acometidas. Se ubica LIBRE
// sobre el plano (posición absoluta en px del canvas) y se rota horizontal o
// vertical, igual que un radiador, para calzar con la puerta real del plano.
export type OrientacionPuerta = 'horizontal' | 'vertical';
export interface PuertaZona {
  x: number;              // px absolutos del canvas
  y: number;
  orientacion: OrientacionPuerta;
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
