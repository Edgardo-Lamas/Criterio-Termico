// Cálculo de circuitos de piso radiante para el Simulador 2D.
// Convierte zonas dibujadas en el canvas (px) a serpentines reales (metros)
// usando el generador puro de lib/pisoRadiante/serpentin.ts, divide en
// circuitos de máximo 120 m y rutea las acometidas al colector.

import { generarSerpentin } from '../../../lib/pisoRadiante/serpentin';
import type { Punto } from '../../../lib/pisoRadiante/serpentin';
import type { FloorHeatingZone } from '../models/FloorHeatingZone';
import type { Manifold } from '../models/Manifold';

// Misma escala que usa el resto del simulador para longitudes de tubería
// (ver useElementsStore.finishPipe / createManualPipe).
export const PIXELS_PER_METER = 50;

// Límite hidráulico por circuito con PE-X 20mm (ver UnderfloorService).
export const MAX_CIRCUIT_LENGTH_M = 120;

export interface CanvasPoint {
  x: number;
  y: number;
}

export interface FloorHeatingCircuit {
  zoneId: string;
  zoneName: string;
  manifoldId: string | null;   // colector asignado (null si no hay en la planta)
  numero: number;              // número de circuito dentro de la zona (1..n)
  patron: 'espiral' | 'meandro';
  ida: CanvasPoint[];          // px absolutos del canvas
  retorno: CanvasPoint[];      // px absolutos del canvas
  acometidaIda: CanvasPoint[];     // colector → inicio del serpentín
  acometidaRetorno: CanvasPoint[]; // fin del serpentín → colector
  pasoCm: number;
  longitudSerpentin: number;   // m
  longitudAcometida: number;   // m (ida + vuelta)
  longitudTotal: number;       // m
  excedeLimite: boolean;       // true si aún dividiendo supera el máximo
  labelPos: CanvasPoint;       // dónde dibujar la etiqueta
}

function aPixeles(pts: Punto[], origenX: number, origenY: number): CanvasPoint[] {
  return pts.map(p => ({
    x: origenX + p.x * PIXELS_PER_METER,
    y: origenY + p.y * PIXELS_PER_METER,
  }));
}

// Camino ortogonal simple (en L) entre dos puntos del canvas: primero
// horizontal, después vertical. offsetPx separa visualmente ida de retorno.
function caminoEnL(desde: CanvasPoint, hasta: CanvasPoint, offsetPx: number): CanvasPoint[] {
  return [
    { x: desde.x, y: desde.y + offsetPx },
    { x: hasta.x + offsetPx, y: desde.y + offsetPx },
    { x: hasta.x + offsetPx, y: hasta.y },
  ]
}

function longitudPx(pts: CanvasPoint[]): number {
  let total = 0
  for (let i = 1; i < pts.length; i++) {
    total += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y)
  }
  return total
}

function redondear(n: number): number {
  return Math.round(n * 100) / 100
}

// Divide el rectángulo de la zona a lo largo de su eje mayor en n franjas iguales.
function dividirZona(zone: FloorHeatingZone, n: number): { x: number; y: number; width: number; height: number }[] {
  const franjas: { x: number; y: number; width: number; height: number }[] = []
  const horizontal = zone.width >= zone.height
  for (let i = 0; i < n; i++) {
    if (horizontal) {
      const w = zone.width / n
      franjas.push({ x: zone.x + i * w, y: zone.y, width: w, height: zone.height })
    } else {
      const h = zone.height / n
      franjas.push({ x: zone.x, y: zone.y + i * h, width: zone.width, height: h })
    }
  }
  return franjas
}

/**
 * Calcula los circuitos de una zona: genera el serpentín de cada franja,
 * aumentando la cantidad de circuitos hasta que ninguno supere los 120 m
 * (incluyendo su acometida al colector).
 */
export function calcularCircuitosZona(
  zone: FloorHeatingZone,
  manifold: Manifold | null
): FloorHeatingCircuit[] {
  const salidaColector: CanvasPoint | null = manifold
    ? { x: manifold.x + manifold.width / 2, y: manifold.y + manifold.height }
    : null

  const MAX_INTENTOS = 8
  for (let n = 1; n <= MAX_INTENTOS; n++) {
    const franjas = dividirZona(zone, n)
    const circuitos: FloorHeatingCircuit[] = []
    let algunoExcede = false

    for (let i = 0; i < franjas.length; i++) {
      const f = franjas[i]
      const anchoM = f.width / PIXELS_PER_METER
      const altoM = f.height / PIXELS_PER_METER

      let serpentin
      try {
        serpentin = generarSerpentin(anchoM, altoM, zone.pasoCm)
      } catch {
        // Franja demasiado chica para trazar: la zona entera no es viable
        return []
      }

      const ida = aPixeles(serpentin.ida, f.x, f.y)
      const retorno = aPixeles(serpentin.retorno, f.x, f.y)

      let acometidaIda: CanvasPoint[] = []
      let acometidaRetorno: CanvasPoint[] = []
      let longitudAcometida = 0
      if (salidaColector && ida.length > 0 && retorno.length > 0) {
        acometidaIda = caminoEnL(salidaColector, ida[0], 0)
        acometidaRetorno = caminoEnL(salidaColector, retorno[retorno.length - 1], 4).reverse()
        longitudAcometida = redondear(
          (longitudPx(acometidaIda) + longitudPx(acometidaRetorno)) / PIXELS_PER_METER
        )
      }

      const longitudTotal = redondear(serpentin.longitudTotal + longitudAcometida)
      if (longitudTotal > MAX_CIRCUIT_LENGTH_M) algunoExcede = true

      circuitos.push({
        zoneId: zone.id,
        zoneName: zone.name,
        manifoldId: manifold?.id ?? null,
        numero: i + 1,
        patron: serpentin.patron,
        ida,
        retorno,
        acometidaIda,
        acometidaRetorno,
        pasoCm: zone.pasoCm,
        longitudSerpentin: serpentin.longitudTotal,
        longitudAcometida,
        longitudTotal,
        excedeLimite: longitudTotal > MAX_CIRCUIT_LENGTH_M,
        labelPos: { x: f.x + 6, y: f.y + 14 },
      })
    }

    if (!algunoExcede || n === MAX_INTENTOS) return circuitos
  }
  return []
}

// Colector más cercano a la zona en la misma planta (asignación automática MVP).
export function colectorMasCercano(zone: FloorHeatingZone, manifolds: Manifold[]): Manifold | null {
  const cx = zone.x + zone.width / 2
  const cy = zone.y + zone.height / 2
  let mejor: Manifold | null = null
  let mejorDist = Infinity
  for (const m of manifolds) {
    const d = Math.hypot(m.x + m.width / 2 - cx, m.y + m.height / 2 - cy)
    if (d < mejorDist) {
      mejorDist = d
      mejor = m
    }
  }
  return mejor
}

/**
 * Calcula todos los circuitos de todas las zonas de la planta actual.
 * Devuelve un array plano listo para dibujar y presupuestar.
 */
export function calcularCircuitosPlanta(
  zones: FloorHeatingZone[],
  manifolds: Manifold[]
): FloorHeatingCircuit[] {
  return zones.flatMap(zone =>
    calcularCircuitosZona(zone, colectorMasCercano(zone, manifolds))
  )
}
