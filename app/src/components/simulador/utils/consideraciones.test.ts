import { describe, it, expect } from 'vitest';
import { generarConsideraciones } from './consideraciones';
import { calcularPresupuestoPisoRadiante } from './floorHeatingBudget';
import { PIXELS_PER_METER } from './floorHeating';
import type { FloorHeatingZone } from '../models/FloorHeatingZone';
import type { Manifold } from '../models/Manifold';
import type { Room } from '../models/Room';
import type { Radiator } from '../models/Radiator';

function zona(id: string, xM: number, yM: number, anchoM: number, altoM: number): FloorHeatingZone {
  return {
    id,
    type: 'floor-heating-zone',
    name: `Zona ${id}`,
    x: xM * PIXELS_PER_METER,
    y: yM * PIXELS_PER_METER,
    width: anchoM * PIXELS_PER_METER,
    height: altoM * PIXELS_PER_METER,
    pasoCm: 15,
    floor: 'ground',
  };
}

function colector(id: string, xM: number, yM: number): Manifold {
  return { id, type: 'manifold', x: xM * PIXELS_PER_METER, y: yM * PIXELS_PER_METER, width: 60, height: 24, floor: 'ground' };
}

function room(id: string, area: number, extra: Partial<Room> = {}): Room {
  return {
    id,
    name: `Hab ${id}`,
    area,
    height: 2.5,
    thermalFactor: 50,
    hasExteriorWall: false,
    windowsLevel: 'sin-ventanas',
    radiatorIds: [],
    ...extra,
  };
}

function radiador(id: string, power: number): Radiator {
  return { id, type: 'radiator', power, x: 0, y: 0, width: 40, height: 20, floor: 'ground' };
}

describe('generarConsideraciones — alertas desde el diseño real', () => {
  it('sin diseño no hay consideraciones', () => {
    expect(generarConsideraciones({ rooms: [], radiators: [], floorHeating: null })).toEqual([]);
  });

  it('con piso radiante siempre incluye las buenas prácticas de obra', () => {
    const budget = calcularPresupuestoPisoRadiante([zona('z1', 2, 2, 4, 3)], [colector('m1', 1, 1)]);
    const cons = generarConsideraciones({ rooms: [], radiators: [], floorHeating: budget });

    const titulos = cons.map(c => c.titulo);
    expect(titulos.some(t => t.includes('Prueba de presión'))).toBe(true);
    expect(titulos.some(t => t.includes('Puesta en marcha gradual'))).toBe(true);
    expect(titulos.some(t => t.includes('Vaso de expansión'))).toBe(true);
    expect(titulos.some(t => t.includes('Llenado y presión'))).toBe(true);
  });

  it('zona con cobertura insuficiente genera una crítica y va primera', () => {
    // Aislación mala: requerido 1.290 × 1,15 > entrega 1.290 → insuficiente
    const r = room('r1', 15, { aislacion: 'mala' });
    const z = { ...zona('z1', 2, 2, 4, 3), roomId: 'r1' };
    const budget = calcularPresupuestoPisoRadiante([z], [colector('m1', 1, 1)], [], [r]);
    const cons = generarConsideraciones({ rooms: [r], radiators: [], floorHeating: budget });

    expect(cons[0].nivel).toBe('critica');
    expect(cons[0].titulo).toContain('Cobertura térmica insuficiente');
    expect(cons[0].titulo).toContain('Zona z1');
  });

  it('sistema mixto radiadores + piso pide válvula mezcladora', () => {
    const budget = calcularPresupuestoPisoRadiante([zona('z1', 2, 2, 4, 3)], [colector('m1', 1, 1)]);
    const cons = generarConsideraciones({
      rooms: [],
      radiators: [radiador('rad1', 1500)],
      floorHeating: budget,
    });
    const mixto = cons.find(c => c.titulo.includes('Sistema mixto'));
    expect(mixto?.nivel).toBe('atencion');
    expect(mixto?.detalle).toContain('mezcladora');
  });

  it('radiadores que no cubren el requerido +15% generan una crítica', () => {
    // 15 m² × 2,5 × 50 = 1.875 × 1,15 = 2.156 > 1.000 instalados
    const r = room('r1', 15, { radiatorIds: ['rad1'] });
    const cons = generarConsideraciones({
      rooms: [r],
      radiators: [radiador('rad1', 1000)],
      floorHeating: null,
    });
    const critica = cons.find(c => c.nivel === 'critica');
    expect(critica?.titulo).toContain('Radiadores insuficientes');
    expect(critica?.titulo).toContain('Hab r1');
  });

  it('la habitación con piso radiante no se chequea por la regla de radiadores', () => {
    // Media aislación: la zona cubre → no debe aparecer crítica de radiadores
    // aunque el factor volumétrico diera insuficiente
    const r = room('r1', 15, { radiatorIds: ['rad1'] });
    const z = { ...zona('z1', 2, 2, 4, 3), roomId: 'r1' };
    const budget = calcularPresupuestoPisoRadiante([z], [colector('m1', 1, 1)], [], [r]);
    const cons = generarConsideraciones({
      rooms: [r],
      radiators: [radiador('rad1', 500)],
      floorHeating: budget,
    });
    expect(cons.some(c => c.titulo.includes('Radiadores insuficientes'))).toBe(false);
  });

  it('zona de frío intenso (factor 60) sugiere anticongelante', () => {
    const cons = generarConsideraciones({
      rooms: [room('r1', 15, { thermalFactor: 60, radiatorIds: ['rad1'] })],
      radiators: [radiador('rad1', 3000)],
      floorHeating: null,
    });
    const frio = cons.find(c => c.titulo.includes('frío intenso'));
    expect(frio?.nivel).toBe('atencion');
    expect(frio?.detalle).toContain('anticongelante');
  });

  it('el orden es críticas → atención → recomendaciones', () => {
    const r = room('r1', 15, { aislacion: 'mala', thermalFactor: 60 });
    const z = { ...zona('z1', 2, 2, 4, 3), roomId: 'r1' };
    const budget = calcularPresupuestoPisoRadiante([z], [colector('m1', 1, 1)], [], [r]);
    const cons = generarConsideraciones({
      rooms: [r],
      radiators: [radiador('rad1', 1000)],
      floorHeating: budget,
    });
    const niveles = cons.map(c => c.nivel);
    const orden = { critica: 0, atencion: 1, recomendacion: 2 };
    const ordenado = [...niveles].sort((a, b) => orden[a] - orden[b]);
    expect(niveles).toEqual(ordenado);
    expect(niveles[0]).toBe('critica');
  });
});
