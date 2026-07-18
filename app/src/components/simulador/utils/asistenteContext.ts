// Resumen del proyecto abierto en el Simulador 2D para el asistente Criterio.
// Arma un texto compacto con los MISMOS números que muestra la plataforma:
// cargas por cargaDeDisenoKcalh (vara según emisor), caldera por
// calculateBoilerPower con el mismo filtro de ambientes calefaccionados que el
// PDF del presupuesto. El asistente no recalcula nada — repite lo que la UI y
// el PDF ya dicen, así nunca hay dos números distintos para la misma pieza.

import type { Room } from '../models/Room';
import type { Radiator } from '../models/Radiator';
import type { Boiler } from '../models/Boiler';
import type { PipeSegment } from '../models/PipeSegment';
import type { Manifold } from '../models/Manifold';
import type { FloorHeatingZone } from '../models/FloorHeatingZone';
import { calculateBoilerPower, kcalToKw } from './thermalCalculator';
import {
  cargaDeDisenoKcalh,
  metrosSerpentin,
  emisionKcalhM2,
  PIXELS_PER_METER,
  PASO_CM,
  type TempImpulsion,
} from './floorHeating';
import { etiquetasRadiadores } from './planilla';
import { useElementsStore } from '../store/useElementsStore';

// Subconjunto del store que necesita el resumen (separado para poder testearlo
// como función pura, sin montar el store).
export interface EstadoSimulador {
  projectName: string;
  rooms: Room[];
  radiators: Radiator[];
  boilers: Boiler[];
  pipes: PipeSegment[];
  manifolds: Manifold[];
  floorHeatingZones: FloorHeatingZone[];
  floorHeatingTempC: TempImpulsion;
}

// La Edge Function topea el contexto recibido; se corta acá antes de viajar
// para que el corte sea prolijo y no a mitad de una línea del lado del server.
export const MAX_RESUMEN_CHARS = 3500;

const kcal = (n: number): string => `${Math.round(n).toLocaleString('es-AR')} kcal/h`;

const PLANTA: Record<'ground' | 'first', string> = { ground: 'PB', first: 'PA' };
const planta = (floor?: 'ground' | 'first'): string => PLANTA[floor ?? 'ground'];

const AISLACION: Record<Room['thermalFactor'], string> = {
  40: 'buena aislación',
  50: 'aislación estándar',
  60: 'poca aislación',
};

const VENTANAS: Record<Room['windowsLevel'], string> = {
  'sin-ventanas': 'sin ventanas',
  pocas: 'pocas ventanas',
  normales: 'ventanas normales',
  muchas: 'muchas ventanas',
};

export function armarResumenSimulador(estado: EstadoSimulador): string | null {
  const { rooms, radiators, boilers, pipes, manifolds, floorHeatingZones } = estado;

  const hayContenido =
    rooms.length > 0 ||
    radiators.length > 0 ||
    boilers.length > 0 ||
    floorHeatingZones.length > 0 ||
    manifolds.length > 0;
  if (!hayContenido) return null;

  const etiquetas = etiquetasRadiadores(radiators);
  const lineas: string[] = [`PROYECTO: ${estado.projectName}`];

  // ── Ambientes con su carga y lo que tienen colgado ─────────────────────────
  if (rooms.length > 0) {
    lineas.push('', 'AMBIENTES:');
    for (const room of rooms) {
      const radsDelRoom = radiators.filter(r => room.radiatorIds.includes(r.id));
      const zonasDelRoom = floorHeatingZones.filter(z => z.roomId === room.id);
      const tieneRadiadores = radsDelRoom.length > 0;
      const tienePiso = zonasDelRoom.length > 0;

      const datos =
        `${room.area} m², techo ${room.height} m, ${AISLACION[room.thermalFactor]}` +
        `${room.hasExteriorWall ? ', pared exterior' : ''}, ${VENTANAS[room.windowsLevel]}`;

      if (!tieneRadiadores && !tienePiso) {
        lineas.push(`- ${room.name} (${planta(room.floor)}): ${datos}. Sin emisores asignados: no se calefacciona.`);
        continue;
      }

      const carga = cargaDeDisenoKcalh(room, tieneRadiadores, tienePiso);
      const partes: string[] = [`- ${room.name} (${planta(room.floor)}): ${datos} → carga ${kcal(carga)}.`];

      if (tieneRadiadores) {
        const instalada = radsDelRoom.reduce((sum, r) => sum + r.power, 0);
        const detalle = radsDelRoom
          .map(r => `${etiquetas.get(r.id)} (${kcal(r.power)}${r.elementos ? `, ${r.elementos} elementos` : ''})`)
          .join(', ');
        const pct = carga > 0 ? Math.round((instalada / carga) * 100) : 0;
        partes.push(`Radiadores: ${detalle}. Instalado ${kcal(instalada)} (${pct}% de la carga).`);
      }
      if (tienePiso) {
        partes.push(`Piso radiante: ${zonasDelRoom.map(z => `zona "${z.name}"`).join(', ')}.`);
      }
      lineas.push(partes.join(' '));
    }
  }

  // ── Radiadores sueltos: no suman carga ni caldera ──────────────────────────
  const idsAsignados = new Set(rooms.flatMap(r => r.radiatorIds));
  const sinAmbiente = radiators.filter(r => !idsAsignados.has(r.id));
  if (sinAmbiente.length > 0) {
    const detalle = sinAmbiente
      .map(r => `${etiquetas.get(r.id)} (${kcal(r.power)}, ${planta(r.floor)})`)
      .join(', ');
    lineas.push('', `RADIADORES SIN AMBIENTE ASIGNADO: ${detalle}. Sin ambiente no entran en las cargas ni en la caldera.`);
  }

  // ── Piso radiante ──────────────────────────────────────────────────────────
  if (floorHeatingZones.length > 0) {
    const temp = estado.floorHeatingTempC;
    lineas.push('', `PISO RADIANTE (impulsión ${temp} °C → emisión ${emisionKcalhM2(temp)} kcal/h·m²; paso fijo ${PASO_CM} cm):`);
    for (const zone of floorHeatingZones) {
      const areaM2 = (zone.width / PIXELS_PER_METER) * (zone.height / PIXELS_PER_METER);
      const room = zone.roomId ? rooms.find(r => r.id === zone.roomId) : undefined;
      const vinculo = room ? `ambiente ${room.name}` : 'sin ambiente vinculado';
      lineas.push(`- Zona "${zone.name}" (${planta(zone.floor)}, ${vinculo}): ${areaM2.toFixed(1)} m² → ~${Math.round(metrosSerpentin(areaM2))} m de serpentín.`);
    }
    if (manifolds.length > 0) {
      const pb = manifolds.filter(m => (m.floor ?? 'ground') === 'ground').length;
      const pa = manifolds.length - pb;
      const detalle = [pb > 0 ? `${pb} en PB` : '', pa > 0 ? `${pa} en PA` : ''].filter(Boolean).join(' y ');
      lineas.push(`Colectores: ${detalle}.`);
    } else {
      lineas.push('Colectores: ninguno colocado todavía (los circuitos lo necesitan).');
    }
  }

  // ── Caldera: colocada vs. la que recomienda la plataforma ─────────────────
  // Mismo filtro y misma cuenta que el PDF del presupuesto (pdfGenerator):
  // ambientes con radiadores o con zona de piso vinculada.
  const roomsCalefaccionados = rooms.filter(
    room => room.radiatorIds.length > 0 || floorHeatingZones.some(z => z.roomId === room.id)
  );
  if (roomsCalefaccionados.length > 0 || boilers.length > 0) {
    lineas.push('', 'CALDERA:');
    for (const boiler of boilers) {
      lineas.push(`- Colocada en el plano (${planta(boiler.floor)}): ${kcal(boiler.power)} (${kcalToKw(boiler.power)} kW).`);
    }
    if (boilers.length === 0) {
      lineas.push('- Todavía no hay caldera colocada en el plano.');
    }
    if (roomsCalefaccionados.length > 0) {
      const caldera = calculateBoilerPower(roomsCalefaccionados, radiators);
      const detalle = caldera.limitadoPorMinimoComercial
        ? ` El cálculo pide ${kcal(caldera.calculatedPower)}, pero manda la caldera más chica del mercado (24 kW).`
        : '';
      lineas.push(`- Recomendada por la plataforma: ${kcal(caldera.recommendedBoilerPower)} (${kcalToKw(caldera.recommendedBoilerPower)} kW, dimensionada para trabajar al 80%).${detalle}`);
    }
  }

  // ── Tuberías ───────────────────────────────────────────────────────────────
  if (pipes.length > 0) {
    const totalM = pipes.reduce((sum, p) => sum + (p.length ?? 0), 0);
    lineas.push('', `TUBERÍAS: ${pipes.length} tramos trazados (~${Math.round(totalM)} m).`);
  }

  const texto = lineas.join('\n');
  return texto.length > MAX_RESUMEN_CHARS
    ? `${texto.slice(0, MAX_RESUMEN_CHARS)}\n[Resumen cortado: el proyecto tiene más elementos de los que entran acá]`
    : texto;
}

// Lee el estado actual del store del Simulador. Devuelve null con el canvas
// vacío: el asistente responde sin contexto, igual que hasta ahora.
export function resumenProyectoSimulador(): string | null {
  return armarResumenSimulador(useElementsStore.getState());
}
