import type { Radiator } from '../models/Radiator';
import type { Boiler } from '../models/Boiler';
import type { PipeSegment, Point } from '../models/PipeSegment';
import { distance } from './geometry';

/**
 * Calcula la potencia total de todos los radiadores
 */
export const calculateTotalPower = (radiators: Radiator[]): number => {
  return radiators.reduce((total, radiator) => total + radiator.power, 0);
};

/**
 * Calcula la longitud de un segmento de tubería
 */
export const calculatePipeLength = (pipe: PipeSegment): number => {
  if (pipe.points.length < 2) return 0;

  let length = 0;
  for (let i = 0; i < pipe.points.length - 1; i++) {
    length += distance(pipe.points[i], pipe.points[i + 1]);
  }

  return length;
};

/**
 * Calcula la longitud de una serie de puntos
 */
export const calculatePointsLength = (points: Point[]): number => {
  if (points.length < 2) return 0;

  let length = 0;
  for (let i = 0; i < points.length - 1; i++) {
    length += distance(points[i], points[i + 1]);
  }

  return length;
};

/**
 * Calcula la pérdida de carga en una tubería
 */
export const calculatePressureLoss = (
  _pipe: PipeSegment,
  _flowRate: number
): number => {
  // TODO: Implement
  return 0;
};

/**
 * Verifica si la potencia de la caldera es suficiente
 */
export const isBoilerPowerSufficient = (
  _boiler: Boiler,
  _radiators: Radiator[]
): boolean => {
  // TODO: Implement
  return false;
};
