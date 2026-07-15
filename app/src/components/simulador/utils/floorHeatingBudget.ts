// Presupuesto de materiales de piso radiante a partir de las zonas y
// colectores dibujados en el Simulador 2D. Usa las longitudes REALES de los
// circuitos generados (serpentín + acometidas ruteadas) y de las montantes
// caldera→colector (Ø32), no estimaciones.

import { calcularCircuitosPlanta, calcularMontantes, PIXELS_PER_METER, emisionKcalhM2, TEMP_IMPULSION_DEFAULT, cargaDeDisenoKcalh } from './floorHeating';
import type { FloorHeatingCircuit, Montante, TempImpulsion } from './floorHeating';
import { calcularMaterialesPisoRadiante } from '../../../lib/pisoRadiante/PresupuestoService';
import type { ResumenPresupuesto } from '../../../lib/pisoRadiante/types';
import type { FloorHeatingZone } from '../models/FloorHeatingZone';
import type { Manifold } from '../models/Manifold';
import type { Boiler } from '../models/Boiler';
import type { Room } from '../models/Room';

// Potencia por zona: lo que el piso puede entregar (área × emisión según
// temperatura de impulsión) contra la pérdida de la habitación vinculada.
// El requerido NO lleva margen extra: es exactamente el que da la Calculadora
// de Potencia (el factor volumétrico ya es conservador de por sí), así que
// simulador y calculadora dicen siempre el mismo número.
export interface ZonaPotencia {
  zoneId: string;
  zoneName: string;
  roomId: string | null;      // habitación vinculada (null si no hay)
  areaM2: number;
  longitudM: number;          // m de tubo Ø20 de la zona
  potenciaKcalh: number;      // entrega máxima
  requeridoKcalh: number | null; // pérdida de la habitación vinculada (null si no hay)
  coberturaPct: number | null;   // entrega / requerido × 100
  suficiente: boolean | null;    // entrega ≥ requerido
}

export interface FloorHeatingBudget {
  circuits: FloorHeatingCircuit[];
  montantes: Montante[];
  zonas: ZonaPotencia[];
  tempImpulsionC: TempImpulsion;  // temperatura de diseño usada en el cálculo
  emisionKcalhM2: number;         // kcal/h·m² que entrega el piso a esa temperatura
  potenciaTotalKcalh: number; // entrega máxima de todo el piso radiante
  longitudTotalM: number;     // m de tubo Ø20 de todos los circuitos
  longitudMontantesM: number; // m de primaria Ø32 (ida + retorno)
  areaM2: number;             // m² de las zonas con circuitos viables
  resumen: ResumenPresupuesto;
}

const FLOORS = ['ground', 'first'] as const;

/**
 * Calcula circuitos y montantes de TODAS las plantas y arma el presupuesto.
 * Devuelve null si no hay zonas dibujadas o ninguna produce circuitos viables.
 */
export function calcularPresupuestoPisoRadiante(
  zones: FloorHeatingZone[],
  manifolds: Manifold[],
  boilers: Boiler[] = [],
  rooms: Room[] = [],
  tempImpulsionC: TempImpulsion = TEMP_IMPULSION_DEFAULT
): FloorHeatingBudget | null {
  if (zones.length === 0) return null;

  // Mismo filtrado por planta que usa el Canvas para dibujar
  const circuits: FloorHeatingCircuit[] = [];
  const montantes: Montante[] = [];
  for (const floor of FLOORS) {
    const zonesFloor = zones.filter(z => z.floor === floor);
    const manifoldsFloor = manifolds.filter(m => m.floor === floor);
    const boilersFloor = boilers.filter(b => !b.floor || b.floor === floor);
    circuits.push(...calcularCircuitosPlanta(zonesFloor, manifoldsFloor, tempImpulsionC, rooms));
    montantes.push(...calcularMontantes(manifoldsFloor, boilersFloor, zonesFloor));
  }
  if (circuits.length === 0) return null;

  const longitudTotalM = Math.round(circuits.reduce((acc, c) => acc + c.longitudTotal, 0) * 100) / 100;
  const longitudMontantesM = Math.round(montantes.reduce((acc, m) => acc + m.longitudTotal, 0) * 100) / 100;

  // Área y banda perimetral solo de las zonas que generaron circuitos.
  // El área sale de los circuitos (ya escalados al área REAL de la habitación
  // vinculada); el perímetro dibujado se corrige con √escala por zona, porque
  // la imagen del plano no está en la escala interna del canvas (50 px/m).
  const zoneIds = new Set(circuits.map(c => c.zoneId));
  const zonasActivas = zones.filter(z => zoneIds.has(z.id));
  const areaM2 = Math.round(
    circuits.reduce((acc, c) => acc + c.areaM2, 0) * 100
  ) / 100;
  const perimetroM = zonasActivas.reduce((acc, z) => {
    const perimetroDibujado = 2 * ((z.width + z.height) / PIXELS_PER_METER);
    const areaDibujada = (z.width / PIXELS_PER_METER) * (z.height / PIXELS_PER_METER);
    const room = z.roomId ? rooms.find(r => r.id === z.roomId) : undefined;
    const escala = room && areaDibujada > 0 ? Math.sqrt(room.area / areaDibujada) : 1;
    return acc + perimetroDibujado * escala;
  }, 0);

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
    longitudMontante: longitudMontantesM,
  });

  // Potencia por zona: entrega máxima vs. requerido de la habitación vinculada
  const zonasPotencia: ZonaPotencia[] = zonasActivas.map(zone => {
    const propios = circuits.filter(c => c.zoneId === zone.id);
    const potenciaKcalh = propios.reduce((acc, c) => acc + c.potenciaKcalh, 0);
    const room = zone.roomId ? rooms.find(r => r.id === zone.roomId) : undefined;
    // La zona es de piso; la vara la decide si además hay radiadores (ver
    // cargaDeDisenoKcalh). Si el piso no llega, el veredicto lo dice — no se
    // ajusta la vara para que pase.
    const requeridoKcalh = room
      ? cargaDeDisenoKcalh(room, room.radiatorIds.length > 0, true)
      : null;
    return {
      zoneId: zone.id,
      zoneName: zone.name,
      roomId: room?.id ?? null,
      areaM2: Math.round(propios.reduce((acc, c) => acc + c.areaM2, 0) * 100) / 100,
      longitudM: Math.round(propios.reduce((acc, c) => acc + c.longitudTotal, 0) * 100) / 100,
      potenciaKcalh,
      requeridoKcalh,
      coberturaPct: requeridoKcalh === null
        ? null
        : Math.round((potenciaKcalh / requeridoKcalh) * 100),
      suficiente: requeridoKcalh === null ? null : potenciaKcalh >= requeridoKcalh,
    };
  });
  const potenciaTotalKcalh = zonasPotencia.reduce((acc, z) => acc + z.potenciaKcalh, 0);

  return {
    circuits,
    montantes,
    zonas: zonasPotencia,
    tempImpulsionC,
    emisionKcalhM2: emisionKcalhM2(tempImpulsionC),
    potenciaTotalKcalh,
    longitudTotalM,
    longitudMontantesM,
    areaM2,
    resumen,
  };
}
