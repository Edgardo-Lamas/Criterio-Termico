import type { Point } from '../models/PipeSegment';
import type { Radiator } from '../models/Radiator';
import type { Boiler } from '../models/Boiler';

/**
 * Verifica si un punto está dentro de un rectángulo
 */
export const isPointInsideRect = (
  point: Point,
  rectX: number,
  rectY: number,
  rectWidth: number,
  rectHeight: number
): boolean => {
  return (
    point.x >= rectX &&
    point.x <= rectX + rectWidth &&
    point.y >= rectY &&
    point.y <= rectY + rectHeight
  );
};

/**
 * Calcula la distancia entre dos puntos
 */
export const distanceBetween = (p1: Point, p2: Point): number => {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Calcula la distancia simple (alias de distanceBetween)
 */
export const distance = (p1: Point, p2: Point): number => {
  return distanceBetween(p1, p2);
};

/**
 * Verifica si un punto está cerca de un elemento (radiador o caldera)
 */
export const isPointNearElement = (
  point: Point,
  element: Radiator | Boiler,
  threshold: number = 20
): boolean => {
  // Verificar si está dentro del elemento
  const isInside = isPointInsideRect(
    point,
    element.x,
    element.y,
    element.width,
    element.height
  );

  if (isInside) return true;

  // Verificar si está cerca (dentro del rectángulo expandido)
  const isNear = isPointInsideRect(
    point,
    element.x - threshold,
    element.y - threshold,
    element.width + threshold * 2,
    element.height + threshold * 2
  );

  return isNear;
};

/**
 * Verifica si un punto está cerca de una línea
 */
export const isPointNearLine = (
  point: Point,
  lineStart: Point,
  lineEnd: Point,
  threshold: number = 8
): boolean => {
  // Calcular la distancia del punto a la línea usando fórmula de distancia punto-segmento
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) {
    // El segmento es un punto
    return distance(point, lineStart) <= threshold;
  }

  // Proyección del punto sobre la línea
  let t = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / lengthSquared;
  t = Math.max(0, Math.min(1, t)); // Clamped entre 0 y 1

  // Punto más cercano en el segmento
  const closestPoint = {
    x: lineStart.x + t * dx,
    y: lineStart.y + t * dy
  };

  return distance(point, closestPoint) <= threshold;
};

/**
 * Verifica si un punto está cerca de una tubería (polilínea)
 */
export const isPointNearPipe = (
  point: Point,
  pipePoints: Point[],
  threshold: number = 8
): boolean => {
  if (pipePoints.length < 2) return false;

  // Verificar cada segmento de la tubería
  for (let i = 0; i < pipePoints.length - 1; i++) {
    if (isPointNearLine(point, pipePoints[i], pipePoints[i + 1], threshold)) {
      return true;
    }
  }

  return false;
};

/**
 * Calcula el punto más cercano en una línea
 */
export const closestPointOnLine = (
  _point: Point,
  _lineStart: Point,
  _lineEnd: Point
): Point => {
  // TODO: Implement
  return { x: 0, y: 0 };
};
