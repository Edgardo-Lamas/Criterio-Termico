import { describe, it, expect } from 'vitest';
import {
  validarHidraulica,
  validarCircuitosPiso,
  validarRamalesRadiadores,
  perdidaFriccionMca,
  ALTURA_BOMBA_DEFAULT_MCA,
} from './hydraulicValidation';
import { calcularPresupuestoPisoRadiante } from './floorHeatingBudget';
import type { FloorHeatingBudget } from './floorHeatingBudget';
import { PIXELS_PER_METER } from './floorHeating';
import type { FloorHeatingCircuit } from './floorHeating';
import type { PipeSegment } from '../models/PipeSegment';
import type { Radiator } from '../models/Radiator';
import type { FloorHeatingZone } from '../models/FloorHeatingZone';
import type { Manifold } from '../models/Manifold';
import type { Room } from '../models/Room';
import type { Boiler } from '../models/Boiler';

// FloorHeatingBudget mínimo con UN circuito de longitud y carga controladas,
// para probar la validación sin depender del cálculo geométrico completo.
function pisoBudget(longitudTotal: number, cargaKcalh: number, montanteM = 4): FloorHeatingBudget {
  const circuit: FloorHeatingCircuit = {
    zoneId: 'z1',
    zoneName: 'Living',
    manifoldId: null,
    numero: 1,
    colectorNumero: null,
    etiqueta: 'C1',
    cargaKcalh,
    patron: 'espiral',
    ida: [],
    retorno: [],
    acometidaIda: [],
    acometidaRetorno: [],
    pasoCm: 20,
    areaM2: 20,
    potenciaKcalh: cargaKcalh,
    longitudSerpentin: longitudTotal,
    longitudAcometida: 0,
    longitudTotal,
    excedeLimite: false,
    labelPos: { x: 0, y: 0 },
  };
  return {
    circuits: [circuit],
    montantes: [],
    zonas: [],
    tempImpulsionC: 45,
    emisionKcalhM2: 86,
    potenciaTotalKcalh: cargaKcalh,
    longitudTotalM: longitudTotal,
    longitudMontantesM: montanteM,
    areaM2: 20,
    resumen: { items: [], subtotal: 0, totalFinal: 0 } as unknown as FloorHeatingBudget['resumen'],
  };
}

function radiador(id: string, power: number): Radiator {
  return { id, type: 'radiator', power, x: 0, y: 0, width: 40, height: 20, floor: 'ground' };
}

// Red mínima caldera → troncal Ø25 → ramal Ø16 → radiador
function redRadiador(trunkLen: number): PipeSegment[] {
  return [
    { id: 'trunk1', type: 'pipe', pipeType: 'supply', points: [], diameter: 25, material: 'Multicapa', floor: 'ground', fromElementId: 'boiler', toElementId: undefined, length: trunkLen },
    { id: 'b1', type: 'pipe', pipeType: 'supply', points: [], diameter: 16, material: 'Multicapa', floor: 'ground', fromElementId: 'trunk1', toElementId: 'R1', length: 3 },
  ];
}

describe('perdidaFriccionMca — Hazen-Williams', () => {
  it('un circuito de piso de 100 m Ø16 a 300 L/h pierde ~1,5 mca', () => {
    const dp = perdidaFriccionMca(100, 300, 16);
    expect(dp).toBeGreaterThan(1.2);
    expect(dp).toBeLessThan(1.9);
  });

  it('devuelve 0 con datos no válidos', () => {
    expect(perdidaFriccionMca(0, 300, 16)).toBe(0);
    expect(perdidaFriccionMca(100, 0, 16)).toBe(0);
    expect(perdidaFriccionMca(100, 300, 0)).toBe(0);
  });

  it('crece con la longitud y con el caudal (no lineal)', () => {
    const base = perdidaFriccionMca(100, 300, 16);
    expect(perdidaFriccionMca(200, 300, 16)).toBeCloseTo(base * 2, 5); // lineal en L
    expect(perdidaFriccionMca(100, 600, 16)).toBeGreaterThan(base * 3); // ~Q^1,85
  });
});

describe('validarHidraulica', () => {
  it('devuelve null cuando no hay nada que validar', () => {
    expect(validarHidraulica([], [], null)).toBeNull();
  });

  it('piso corto y de baja carga: la bomba lo mueve holgada (ok)', () => {
    const v = validarHidraulica([], [], pisoBudget(80, 1200));
    expect(v).not.toBeNull();
    expect(v!.veredicto).toBe('ok');
    expect(v!.disponibleMca).toBe(ALTURA_BOMBA_DEFAULT_MCA);
    expect(v!.mensaje).toMatch(/holgura/i);
  });

  it('serpentín largo y de alta carga: la bomba no llega (insuficiente)', () => {
    const v = validarHidraulica([], [], pisoBudget(120, 3200));
    expect(v).not.toBeNull();
    expect(v!.veredicto).toBe('insuficiente');
    expect(v!.indiceMca).toBeGreaterThan(v!.disponibleMca);
    // Mensaje de oficio, sin jerga como circuito índice
    expect(v!.detalle).toMatch(/dividí|colector|bomba/i);
  });

  it('el circuito índice es el de mayor ΔP entre piso y radiadores', () => {
    const v = validarHidraulica(redRadiador(10), [radiador('R1', 6000)], pisoBudget(120, 3200));
    expect(v!.circuitoIndice).toBe('Living C1'); // el piso largo domina
    expect(v!.circuitos[0].tipo).toBe('piso');
  });

  it('solo radiadores razonables: la bomba los mueve (ok)', () => {
    const v = validarHidraulica(redRadiador(8), [radiador('R1', 5000)], null);
    expect(v).not.toBeNull();
    expect(v!.veredicto).toBe('ok');
    expect(v!.circuitoIndice).toMatch(/radiadores/i);
  });

  it('respeta la altura de bomba pasada (una bomba floja reprueba lo que una fuerte aprueba)', () => {
    const piso = pisoBudget(100, 2000);
    expect(validarHidraulica([], [], piso, 6.0)!.veredicto).not.toBe('insuficiente');
    const floja = validarHidraulica([], [], piso, 2.0);
    expect(floja!.veredicto).toBe('insuficiente');
  });
});

// Verificación de integración: ejercita el pipeline REAL de geometría
// (zona dibujada → circuitos con longitudes reales → ΔP) para confirmar que los
// números salen sanos sobre un diseño realista, no solo sobre fixtures a mano.
describe('integración: validación sobre el pipeline real de piso radiante', () => {
  function zona(id: string, xM: number, yM: number, anchoM: number, altoM: number, roomId: string): FloorHeatingZone {
    return {
      id, type: 'floor-heating-zone', name: `Zona ${id}`,
      x: xM * PIXELS_PER_METER, y: yM * PIXELS_PER_METER,
      width: anchoM * PIXELS_PER_METER, height: altoM * PIXELS_PER_METER,
      pasoCm: 20, floor: 'ground', roomId,
    };
  }
  const manifold: Manifold = { id: 'col1', type: 'manifold', x: 0, y: 0, width: 60, height: 24, floor: 'ground' };
  const boiler: Boiler = { id: 'b1', type: 'boiler', x: 100, y: 0, power: 20640, width: 40, height: 30, floor: 'ground' };
  const room: Room = {
    id: 'living', name: 'Living', area: 25, height: 2.5, thermalFactor: 50,
    hasExteriorWall: true, windowsLevel: 'normales', radiatorIds: [],
  };

  it('un Living de 25 m² dibujado: ΔP sano y la bomba de una mural lo mueve', () => {
    const budget = calcularPresupuestoPisoRadiante(
      [zona('z', 1, 1, 5, 5, 'living')], [manifold], [boiler], [room], 45,
    );
    expect(budget).not.toBeNull();
    expect(budget!.circuits.length).toBeGreaterThanOrEqual(1);

    const porCircuito = validarCircuitosPiso(budget);
    expect(porCircuito.size).toBe(budget!.circuits.length);
    for (const { deltaPMca, estado } of porCircuito.values()) {
      expect(deltaPMca).toBeGreaterThan(0);
      expect(deltaPMca).toBeLessThan(20); // rango físico plausible, no un número absurdo
      expect(['ok', 'limite', 'insuficiente']).toContain(estado);
    }

    const v = validarHidraulica([], [], budget);
    expect(v).not.toBeNull();
    // Un ambiente normal con la mural típica no debería reprobar
    expect(v!.veredicto).not.toBe('insuficiente');
    expect(v!.indiceMca).toBeGreaterThan(0);
  });
});

describe('validarCircuitosPiso — dato por circuito para la tabla', () => {
  it('devuelve ΔP y estado por circuito, clave zoneId#etiqueta', () => {
    const m = validarCircuitosPiso(pisoBudget(80, 1200));
    const h = m.get('z1#C1');
    expect(h).toBeDefined();
    expect(h!.deltaPMca).toBeGreaterThan(0);
    expect(h!.estado).toBe('ok');
  });

  it('un serpentín exigente da estado insuficiente', () => {
    const m = validarCircuitosPiso(pisoBudget(120, 3200));
    expect(m.get('z1#C1')!.estado).toBe('insuficiente');
  });

  it('mapa vacío si no hay piso', () => {
    expect(validarCircuitosPiso(null).size).toBe(0);
  });
});

describe('validarRamalesRadiadores — dato por radiador para la planilla', () => {
  it('devuelve ΔP y estado por radiador, clave radiatorId', () => {
    const m = validarRamalesRadiadores(redRadiador(8), [radiador('R1', 5000)]);
    const h = m.get('R1');
    expect(h).toBeDefined();
    expect(h!.deltaPMca).toBeGreaterThan(0);
    expect(h!.estado).toBe('ok');
  });

  it('mapa vacío si no hay tuberías (sin Conectar Auto)', () => {
    expect(validarRamalesRadiadores([], [radiador('R1', 5000)]).size).toBe(0);
  });
});
