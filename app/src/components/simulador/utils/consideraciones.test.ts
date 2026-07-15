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
    expect(titulos.some(t => t.includes('Cronotermostato'))).toBe(true);
    // Protocolo de obra: presurizado con manómetro y by-pass + registro del tendido
    expect(titulos.some(t => t.includes('presurizada hasta el fin de obra'))).toBe(true);
    expect(titulos.some(t => t.includes('Registro del tendido'))).toBe(true);
    // Caldera: condensación ideal, tiro forzado segunda, tiro natural nunca
    const caldera = cons.find(c => c.titulo.includes('condensación'));
    expect(caldera?.detalle).toContain('tiro forzado');
    expect(caldera?.detalle).toContain('NUNCA');
  });

  it('caldera de tiro natural con piso radiante genera una crítica', () => {
    const budget = calcularPresupuestoPisoRadiante([zona('z1', 2, 2, 4, 3)], [colector('m1', 1, 1)]);
    const cons = generarConsideraciones({
      rooms: [], radiators: [], floorHeating: budget, boilerTipo: 'natural',
    });
    const critica = cons.find(c => c.titulo.includes('tiro natural'));
    expect(critica?.nivel).toBe('critica');
    // La recomendación genérica de calderas no se duplica
    expect(cons.some(c => c.titulo.includes('condensación primero'))).toBe(false);
  });

  it('con caldera de condensación elegida no repite la recomendación de calderas', () => {
    const budget = calcularPresupuestoPisoRadiante([zona('z1', 2, 2, 4, 3)], [colector('m1', 1, 1)]);
    const cons = generarConsideraciones({
      rooms: [], radiators: [], floorHeating: budget, boilerTipo: 'condensacion',
    });
    expect(cons.some(c => c.titulo.includes('tiro natural'))).toBe(false);
    expect(cons.some(c => c.titulo.includes('condensación primero'))).toBe(false);
    // Con tiro forzado sí sugiere que el ideal es condensación
    const consForzado = generarConsideraciones({
      rooms: [], radiators: [], floorHeating: budget, boilerTipo: 'forzado',
    });
    expect(consForzado.some(c => c.titulo.includes('condensación primero'))).toBe(true);
  });

  it('con varios circuitos recomienda equilibrar caudalímetros; con uno solo no', () => {
    // Zona 4×3 (12 m² → 1 circuito): sin equilibrado
    const chico = calcularPresupuestoPisoRadiante([zona('z1', 2, 2, 4, 3)], [colector('m1', 1, 1)]);
    const consChico = generarConsideraciones({ rooms: [], radiators: [], floorHeating: chico });
    expect(consChico.some(c => c.titulo.includes('Equilibrado'))).toBe(false);

    // Zona 5×4 (20 m² × 6,7 = 134 m > 120 → se divide): con equilibrado
    const grande = calcularPresupuestoPisoRadiante([zona('z1', 2, 2, 5, 4)], [colector('m1', 1, 1)]);
    const consGrande = generarConsideraciones({ rooms: [], radiators: [], floorHeating: grande });
    expect(consGrande.some(c => c.titulo.includes('Equilibrado'))).toBe(true);
  });

  it('techo de más de 3 m con radiadores es crítica: el emisor está mal elegido', () => {
    const r = room('r1', 20, { height: 3.5, radiatorIds: ['rad1'] });
    const cons = generarConsideraciones({
      rooms: [r], radiators: [radiador('rad1', 5000)], floorHeating: null,
    });
    const critica = cons.find(c => c.titulo.includes('Techo alto'));
    expect(critica?.nivel).toBe('critica');
    expect(critica?.titulo).toContain('3.5 m');
    // Tiene que mandar a piso radiante, no a agregar elementos
    expect(critica?.detalle).toContain('piso radiante');
    expect(critica?.detalle).toContain('estratifica');
  });

  it('el techo alto no molesta si el emisor es piso radiante', () => {
    const r = room('r1', 20, { height: 4 });
    const z = { ...zona('z1', 2, 2, 4, 3), roomId: 'r1' };
    const budget = calcularPresupuestoPisoRadiante([z], [colector('m1', 1, 1)], [], [r]);
    const cons = generarConsideraciones({ rooms: [r], radiators: [], floorHeating: budget });
    expect(cons.some(c => c.titulo.includes('Techo alto'))).toBe(false);
  });

  it('exactamente 3 m todavía admite radiadores (el límite no incluye el borde)', () => {
    const r = room('r1', 20, { height: 3, radiatorIds: ['rad1'] });
    const cons = generarConsideraciones({
      rooms: [r], radiators: [radiador('rad1', 5000)], floorHeating: null,
    });
    expect(cons.some(c => c.titulo.includes('Techo alto'))).toBe(false);
  });

  it('zona con cobertura insuficiente genera una crítica y va primera', () => {
    // Casa mal aislada (factor 60 → 100 W/m²): 15 × 100 × 0,86 = 1.290 y a
    // 40°C el piso entrega 15 × 68 = 1.020. No llega.
    const r = room('r1', 15, { thermalFactor: 60 });
    const z = { ...zona('z1', 2, 2, 4, 3), roomId: 'r1' };
    const budget = calcularPresupuestoPisoRadiante([z], [colector('m1', 1, 1)], [], [r], 40);
    const cons = generarConsideraciones({ rooms: [r], radiators: [], floorHeating: budget });

    expect(cons[0].nivel).toBe('critica');
    expect(cons[0].titulo).toContain('Cobertura térmica insuficiente');
    expect(cons[0].titulo).toContain('Zona z1');
  });

  it('la casa aislada con el piso bien puesto NO genera crítica', () => {
    // Regresión del bug de fondo: comparar el piso contra la vara del radiador
    // daba insuficiente en las 144 configuraciones posibles. Una recámara
    // normal con piso a 45°C tiene que dar verde.
    const r = room('r1', 15);
    const z = { ...zona('z1', 2, 2, 4, 3), roomId: 'r1' };
    const budget = calcularPresupuestoPisoRadiante([z], [colector('m1', 1, 1)], [], [r]);
    const cons = generarConsideraciones({ rooms: [r], radiators: [], floorHeating: budget });
    expect(cons.find(c => c.titulo.includes('Cobertura térmica insuficiente'))).toBeUndefined();
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
    // Debe justificar el costo del doble circuito, no solo lo técnico
    expect(mixto?.detalle).toContain('encarecen');
  });

  it('la cobertura insuficiente no empuja a un sistema mixto hidráulico', () => {
    const r = room('r1', 15, { thermalFactor: 60 });
    const z = { ...zona('z1', 2, 2, 4, 3), roomId: 'r1' };
    const budget = calcularPresupuestoPisoRadiante([z], [colector('m1', 1, 1)], [], [r], 40);
    const cons = generarConsideraciones({ rooms: [r], radiators: [], floorHeating: budget });
    const critica = cons.find(c => c.titulo.includes('Cobertura térmica insuficiente'));
    expect(critica?.detalle).toContain('eléctrico');
    expect(critica?.detalle).not.toContain('complementar con un radiador');
    // Tampoco puede prometer que sumando caño se arregla: la emisión sale de
    // la superficie del piso, no del tubo.
    expect(critica?.detalle).toContain('no del tubo');
  });

  it('radiadores que no cubren el requerido generan una crítica (sin margen extra)', () => {
    // 15 m² × 2,5 × 50 = 1.875 > 1.000 instalados → crítica
    const r = room('r1', 15, { radiatorIds: ['rad1'] });
    const cons = generarConsideraciones({
      rooms: [r],
      radiators: [radiador('rad1', 1000)],
      floorHeating: null,
    });
    const critica = cons.find(c => c.nivel === 'critica');
    expect(critica?.titulo).toContain('Radiadores insuficientes');
    expect(critica?.titulo).toContain('Hab r1');

    // 2.000 ≥ 1.875 alcanza: el factor volumétrico ya trae su propio margen,
    // no se exige un 15% adicional (criterio de Edgardo)
    const consOk = generarConsideraciones({
      rooms: [r],
      radiators: [radiador('rad1', 2000)],
      floorHeating: null,
    });
    expect(consOk.some(c => c.titulo.includes('Radiadores insuficientes'))).toBe(false);
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
    // Mal aislada + agua a 40°C → el piso no llega y hay crítica de cobertura
    const r = room('r1', 15, { thermalFactor: 60 });
    const z = { ...zona('z1', 2, 2, 4, 3), roomId: 'r1' };
    const budget = calcularPresupuestoPisoRadiante([z], [colector('m1', 1, 1)], [], [r], 40);
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
