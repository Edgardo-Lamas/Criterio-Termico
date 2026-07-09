// Presupuesto de materiales de piso radiante a partir de las zonas y
// colectores dibujados en el Simulador 2D. Usa las longitudes REALES de los
// circuitos generados (serpentín + acometidas), no estimaciones.

import { calcularCircuitosPlanta, PIXELS_PER_METER } from './floorHeating';
import type { FloorHeatingCircuit } from './floorHeating';
import { calcularMaterialesPisoRadiante } from '../../../lib/pisoRadiante/PresupuestoService';
import type { ResumenPresupuesto } from '../../../lib/pisoRadiante/types';
import type { FloorHeatingZone } from '../models/FloorHeatingZone';
import type { Manifold } from '../models/Manifold';

export interface FloorHeatingBudget {
  circuits: FloorHeatingCircuit[];
  longitudTotalM: number; // m de tubo de todos los circuitos
  areaM2: number;         // m² de las zonas con circuitos viables
  resumen: ResumenPresupuesto;
}

const FLOORS = ['ground', 'first'] as const;

/**
 * Calcula circuitos de TODAS las plantas y arma el presupuesto de materiales.
 * Devuelve null si no hay zonas dibujadas o ninguna produce circuitos viables.
 */
export function calcularPresupuestoPisoRadiante(
  zones: FloorHeatingZone[],
  manifolds: Manifold[]
): FloorHeatingBudget | null {
  if (zones.length === 0) return null;

  // Mismo filtrado por planta que usa el Canvas para dibujar
  const circuits = FLOORS.flatMap(floor =>
    calcularCircuitosPlanta(
      zones.filter(z => z.floor === floor),
      manifolds.filter(m => m.floor === floor)
    )
  );
  if (circuits.length === 0) return null;

  const longitudTotalM = Math.round(circuits.reduce((acc, c) => acc + c.longitudTotal, 0) * 100) / 100;

  // Área y banda perimetral solo de las zonas que generaron circuitos
  const zoneIds = new Set(circuits.map(c => c.zoneId));
  const zonasActivas = zones.filter(z => zoneIds.has(z.id));
  const areaM2 = Math.round(
    zonasActivas.reduce((acc, z) => acc + (z.width / PIXELS_PER_METER) * (z.height / PIXELS_PER_METER), 0) * 100
  ) / 100;
  const perimetroM = zonasActivas.reduce(
    (acc, z) => acc + 2 * ((z.width + z.height) / PIXELS_PER_METER), 0
  );

  // Un colector físico por cada colector dibujado; los circuitos sin colector
  // asignado (planta sin colector) igual necesitan uno: van en su propio grupo.
  const porColector = new Map<string, number>();
  for (const c of circuits) {
    const key = c.manifoldId ?? 'sin-colector';
    porColector.set(key, (porColector.get(key) ?? 0) + 1);
  }

  const resumen = calcularMaterialesPisoRadiante({
    longitudTotal: longitudTotalM,
    area: areaM2,
    perimetro: perimetroM,
    circuitosPorColector: [...porColector.values()],
  });

  return { circuits, longitudTotalM, areaM2, resumen };
}
