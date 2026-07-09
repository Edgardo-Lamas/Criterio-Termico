import { describe, it, expect } from 'vitest';
import { calcularPresupuestoPisoRadiante } from './floorHeatingBudget';
import { PIXELS_PER_METER, calcularCircuitosPlanta, calcularMontantes } from './floorHeating';
import type { CanvasPoint } from './floorHeating';
import { calcularPresupuesto } from '../../../lib/pisoRadiante/PresupuestoService';
import type { UnderfloorCalculationOutput } from '../../../lib/pisoRadiante/types';
import type { FloorHeatingZone } from '../models/FloorHeatingZone';
import type { Manifold } from '../models/Manifold';
import type { Boiler } from '../models/Boiler';

function zona(id: string, xM: number, yM: number, anchoM: number, altoM: number, floor: 'ground' | 'first' = 'ground'): FloorHeatingZone {
  return {
    id,
    type: 'floor-heating-zone',
    name: `Zona ${id}`,
    x: xM * PIXELS_PER_METER,
    y: yM * PIXELS_PER_METER,
    width: anchoM * PIXELS_PER_METER,
    height: altoM * PIXELS_PER_METER,
    pasoCm: 15,
    floor,
  };
}

function colector(id: string, xM: number, yM: number, floor: 'ground' | 'first' = 'ground'): Manifold {
  return { id, type: 'manifold', x: xM * PIXELS_PER_METER, y: yM * PIXELS_PER_METER, width: 60, height: 24, floor };
}

describe('calcularPresupuestoPisoRadiante — presupuesto desde circuitos reales', () => {
  it('devuelve null sin zonas dibujadas', () => {
    expect(calcularPresupuestoPisoRadiante([], [colector('m1', 0, 0)])).toBeNull();
  });

  it('zona 4×3 m con colector: materiales consistentes con los circuitos', () => {
    const budget = calcularPresupuestoPisoRadiante([zona('z1', 2, 2, 4, 3)], [colector('m1', 1, 1)]);
    expect(budget).not.toBeNull();
    if (!budget) return;

    expect(budget.circuits.length).toBeGreaterThan(0);
    expect(budget.areaM2).toBeCloseTo(12, 2);

    const sumaCircuitos = budget.circuits.reduce((acc, c) => acc + c.longitudTotal, 0);
    expect(budget.longitudTotalM).toBeCloseTo(sumaCircuitos, 1);

    // Tubo PEX = longitud real + 5% de desperdicio, redondeado hacia arriba
    const pex = budget.resumen.items.find(i => i.productoId === 'TUB-PEX-20');
    expect(pex).toBeDefined();
    expect(pex?.cantidad).toBe(Math.ceil(budget.longitudTotalM * 1.05));

    // Placa y malla por m² reales de la zona
    expect(budget.resumen.items.find(i => i.productoId === 'PLA-AIS-EPS')?.cantidad).toBe(12);
    expect(budget.resumen.items.find(i => i.productoId === 'MAL-ELE-42')?.cantidad).toBe(12);

    // Banda perimetral con el perímetro real del rectángulo: 2×(4+3) = 14 m
    expect(budget.resumen.items.find(i => i.productoId === 'BAN-PER-PE')?.cantidad).toBe(14);

    // Un colector con vías suficientes para todos los circuitos + válvulas + gabinete
    const colectorItem = budget.resumen.items.find(i => i.productoId.startsWith('COL-'));
    expect(colectorItem).toBeDefined();
    expect(colectorItem?.cantidad).toBe(1);
    expect(budget.resumen.items.find(i => i.productoId === 'VAL-ESF-PAR')?.cantidad).toBe(1);
    expect(budget.resumen.items.find(i => i.productoId === 'GAB-MET-COL')?.cantidad).toBe(1);

    expect(budget.resumen.totalFinal).toBeGreaterThan(0);
  });

  it('dos zonas lejanas con dos colectores: un colector físico por cada uno', () => {
    const budget = calcularPresupuestoPisoRadiante(
      [zona('z1', 2, 2, 4, 3), zona('z2', 40, 2, 4, 3)],
      [colector('m1', 1, 1), colector('m2', 39, 1)]
    );
    expect(budget).not.toBeNull();
    if (!budget) return;

    const manifoldIds = new Set(budget.circuits.map(c => c.manifoldId));
    expect(manifoldIds).toEqual(new Set(['m1', 'm2']));

    const totalColectores = budget.resumen.items
      .filter(i => i.productoId.startsWith('COL-'))
      .reduce((acc, i) => acc + i.cantidad, 0);
    expect(totalColectores).toBe(2);
    expect(budget.resumen.items.find(i => i.productoId === 'GAB-MET-COL')?.cantidad).toBe(2);
    expect(budget.resumen.items.find(i => i.productoId === 'VAL-ESF-PAR')?.cantidad).toBe(2);
  });

  it('suma circuitos de las dos plantas', () => {
    const budget = calcularPresupuestoPisoRadiante(
      [zona('z1', 2, 2, 4, 3, 'ground'), zona('z2', 2, 2, 4, 3, 'first')],
      [colector('m1', 1, 1, 'ground'), colector('m2', 1, 1, 'first')]
    );
    expect(budget).not.toBeNull();
    if (!budget) return;
    expect(new Set(budget.circuits.map(c => c.zoneId))).toEqual(new Set(['z1', 'z2']));
    expect(budget.areaM2).toBeCloseTo(24, 2);
  });

  it('zona sin colector en la planta: presupuesta un colector igual', () => {
    const budget = calcularPresupuestoPisoRadiante([zona('z1', 2, 2, 4, 3)], []);
    expect(budget).not.toBeNull();
    if (!budget) return;
    expect(budget.circuits.every(c => c.manifoldId === null)).toBe(true);
    const totalColectores = budget.resumen.items
      .filter(i => i.productoId.startsWith('COL-'))
      .reduce((acc, i) => acc + i.cantidad, 0);
    expect(totalColectores).toBe(1);
  });
});

function caldera(id: string, xM: number, yM: number, floor: 'ground' | 'first' = 'ground'): Boiler {
  return { id, type: 'boiler', power: 24000, x: xM * PIXELS_PER_METER, y: yM * PIXELS_PER_METER, width: 40, height: 40, floor };
}

// Muestrea una polilínea y verifica que no pase por dentro del rectángulo
function cruzaRect(pts: CanvasPoint[], r: { x: number; y: number; width: number; height: number }): boolean {
  for (let i = 0; i < pts.length - 1; i++) {
    for (let s = 0; s <= 40; s++) {
      const x = pts[i].x + ((pts[i + 1].x - pts[i].x) * s) / 40;
      const y = pts[i].y + ((pts[i + 1].y - pts[i].y) * s) / 40;
      if (x > r.x + 2 && x < r.x + r.width - 2 && y > r.y + 2 && y < r.y + r.height - 2) return true;
    }
  }
  return false;
}

describe('rutearAcometidas — criterio: no atravesar habitaciones ajenas', () => {
  it('la acometida rodea la zona vecina en vez de cruzarla (caso del plano de Edgardo)', () => {
    // Recámara 2 arriba, Recámara 1 abajo, colector debajo de todo:
    // el camino directo cruzaría Recámara 1.
    const recamara2 = zona('recamara2', 2, 2, 4, 3);
    const recamara1 = zona('recamara1', 2, 5.5, 4, 3);
    const col = colector('m1', 3.5, 10);

    const circuits = calcularCircuitosPlanta([recamara2, recamara1], [col]);
    const deRecamara2 = circuits.filter(c => c.zoneId === 'recamara2');
    expect(deRecamara2.length).toBeGreaterThan(0);

    for (const c of deRecamara2) {
      expect(cruzaRect(c.acometidaIda, recamara1)).toBe(false);
      expect(cruzaRect(c.acometidaRetorno, recamara1)).toBe(false);
    }
  });
});

describe('calcularMontantes — primaria caldera→colector Ø32', () => {
  it('genera una montante por colector hacia la caldera más cercana', () => {
    const montantes = calcularMontantes(
      [colector('m1', 3, 8), colector('m2', 20, 8)],
      [caldera('b1', 5, 12), caldera('b2', 22, 12)],
      []
    );
    expect(montantes).toHaveLength(2);
    expect(montantes[0].boilerId).toBe('b1');
    expect(montantes[1].boilerId).toBe('b2');
    expect(montantes[0].diametroMm).toBe(32);
    // ida + retorno: al menos el doble de la distancia recta
    expect(montantes[0].longitudTotal).toBeGreaterThan(0);
  });

  it('sin caldera no hay montante', () => {
    expect(calcularMontantes([colector('m1', 3, 8)], [], [])).toHaveLength(0);
  });

  it('el presupuesto incluye el tubo Ø32 cuando hay caldera y colector', () => {
    const budget = calcularPresupuestoPisoRadiante(
      [zona('z1', 2, 2, 4, 3)],
      [colector('m1', 1, 1)],
      [caldera('b1', 8, 8)]
    );
    expect(budget).not.toBeNull();
    if (!budget) return;
    expect(budget.montantes).toHaveLength(1);
    expect(budget.longitudMontantesM).toBeGreaterThan(0);
    const pex32 = budget.resumen.items.find(i => i.productoId === 'TUB-PEX-32');
    expect(pex32).toBeDefined();
    expect(pex32?.cantidad).toBe(Math.ceil(budget.longitudMontantesM * 1.05));
  });

  it('sin caldera el presupuesto no incluye tubo Ø32', () => {
    const budget = calcularPresupuestoPisoRadiante([zona('z1', 2, 2, 4, 3)], [colector('m1', 1, 1)]);
    expect(budget?.resumen.items.find(i => i.productoId === 'TUB-PEX-32')).toBeUndefined();
  });
});

describe('calcularPresupuesto — la Calculadora mantiene su comportamiento', () => {
  it('valores conocidos: 100 m, 1 circuito, 16 m²', () => {
    const techData: UnderfloorCalculationOutput = {
      pasoSeleccionado: 15,
      densidadTuberia: 6.7,
      longitudSerpentina: 90,
      longitudAcometida: 10,
      longitudTotal: 100,
      numeroCircuitos: 1,
      potenciaMaximaSuelo: 100,
      notaDiseno: '',
    };
    const resumen = calcularPresupuesto(techData, 16);

    // Tubo: ceil(100×1.05)=105 m ×1.80 — Placa: 16×10 — Banda: ceil(√16×4×1.2)=20×2
    // Malla: 16×4.5 — Precintos: 1×5 — Colector 2 vías: 120 — Válvulas: 32 — Gabinete: 55
    expect(resumen.items.find(i => i.productoId === 'TUB-PEX-20')?.cantidad).toBe(105);
    expect(resumen.items.find(i => i.productoId === 'BAN-PER-PE')?.cantidad).toBe(20);
    expect(resumen.items.find(i => i.productoId === 'COL-2V')?.cantidad).toBe(1);
    expect(resumen.totalFinal).toBeCloseTo(105 * 1.8 + 160 + 40 + 72 + 5 + 120 + 32 + 55, 2);
    expect(resumen.desperdicioEstimado).toBeCloseTo(5, 2);
  });
});
