import { describe, it, expect } from 'vitest';
import { calcularPresupuestoPisoRadiante } from './floorHeatingBudget';
import { PIXELS_PER_METER, calcularCircuitosPlanta, calcularMontantes, circuitosPorColector, emisionKcalhM2, potenciaZonaKcalh, puertaEnLado, cargaDeDisenoKcalh, PASO_CM } from './floorHeating';
import { calculateRoomPower } from './thermalCalculator';
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

describe('puerta de la zona — la acometida entra por la puerta real', () => {
  it('con puerta marcada, ida y retorno pasan JUNTAS por el vano (paralelas, sin cruzarse)', () => {
    // Zona 4×3 m con puerta en el centro del lado de abajo; colector abajo a la izquierda
    const base = zona('z1', 4, 2, 4, 3);
    const z: FloorHeatingZone = { ...base, puerta: puertaEnLado(base, 'abajo') };
    const circuits = calcularCircuitosPlanta([z], [colector('m1', 1, 7)]);
    expect(circuits.length).toBeGreaterThan(0);

    // Punto de la puerta apenas afuera del borde: (x centro, y borde inferior + 12).
    // Ida y retorno corren paralelas separadas ACOM_OFFSET (4 px), así que ambas
    // pasan por el vano con una tolerancia chica (< 6 px).
    const puertaX = z.x + z.width * 0.5;
    const puertaY = z.y + z.height + 12;
    for (const c of circuits) {
      const pasaPorPuerta = (pts: { x: number; y: number }[]) =>
        pts.some(p => Math.abs(p.y - puertaY) < 6 && Math.abs(p.x - puertaX) <= 15);
      expect(pasaPorPuerta(c.acometidaIda)).toBe(true);
      expect(pasaPorPuerta(c.acometidaRetorno)).toBe(true);
    }
  });

  // ¿Se cruzan (propiamente) dos polilíneas? Cruce = un segmento de A corta el
  // interior de un segmento de B. Un toque en las puntas no cuenta.
  function seCruzan(a: CanvasPoint[], b: CanvasPoint[]): boolean {
    const cross = (ax: number, ay: number, bx: number, by: number) => ax * by - ay * bx;
    const cruceSeg = (p1: CanvasPoint, p2: CanvasPoint, p3: CanvasPoint, p4: CanvasPoint): boolean => {
      const r = { x: p2.x - p1.x, y: p2.y - p1.y };
      const s = { x: p4.x - p3.x, y: p4.y - p3.y };
      const denom = cross(r.x, r.y, s.x, s.y);
      if (Math.abs(denom) < 1e-9) return false; // paralelos o colineales
      const t = cross(p3.x - p1.x, p3.y - p1.y, s.x, s.y) / denom;
      const u = cross(p3.x - p1.x, p3.y - p1.y, r.x, r.y) / denom;
      return t > 0.02 && t < 0.98 && u > 0.02 && u < 0.98; // interior estricto
    };
    for (let i = 0; i < a.length - 1; i++)
      for (let j = 0; j < b.length - 1; j++)
        if (cruceSeg(a[i], a[i + 1], b[j], b[j + 1])) return true;
    return false;
  }

  it('ida y retorno NO se cruzan, con el colector en cualquier lado (bug del cruce rojo/azul)', () => {
    const base = zona('z1', 4, 2, 4, 3);
    const z: FloorHeatingZone = { ...base, puerta: puertaEnLado(base, 'abajo') };
    // El cruce del offset diagonal aparecía según de qué lado quedaba el
    // colector respecto de la puerta: se prueban ambos lados y en línea.
    for (const col of [colector('m1', 1, 7), colector('m1', 6.5, 7), colector('m1', 4, 7)]) {
      const circuits = calcularCircuitosPlanta([z], [col]);
      expect(circuits.length).toBeGreaterThan(0);
      for (const c of circuits) {
        expect(seCruzan(c.acometidaIda, c.acometidaRetorno)).toBe(false);
      }
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

describe('regla de obra: metros por m² y potencia térmica', () => {
  it('el mobiliario fijo descuenta caño y emisión, pero no la carga ni los materiales', () => {
    // Bajo la bañadera o el placard no se serpentea. Esa franja no lleva tubo
    // ni emite, pero la pieza pierde lo mismo y la placa aislante sigue
    // cubriendo todo el piso.
    const room = {
      id: 'r1', name: 'Recámara', area: 12, height: 2.5,
      thermalFactor: 50 as const, hasExteriorWall: false,
      windowsLevel: 'sin-ventanas' as const, radiatorIds: [],
    };
    const z = { ...zona('z1', 2, 2, 4, 3), roomId: 'r1' };
    const budget = calcularPresupuestoPisoRadiante([z], [colector('m1', 1, 1)], [], [room])!;

    // Caño y emisión: sobre el 90%
    expect(budget.zonas[0].longitudM).toBeCloseTo(75.6 + budget.circuits[0].longitudAcometida, 1);
    expect(budget.zonas[0].potenciaKcalh).toBe(929);   // 12 × 0,90 × 86
    // Carga del ambiente: sin descontar — la pieza pierde lo mismo
    expect(budget.zonas[0].requeridoKcalh).toBe(826);  // 12 × 80 × 0,86
    // Materiales que cubren todo el piso: sobre los 12 m² completos
    expect(budget.areaM2).toBeCloseTo(12, 1);
    expect(budget.resumen.items.find(i => i.productoId === 'PLA-AIS-EPS')?.cantidad).toBe(12);
  });

  it('el paso es fijo en 15: el instalador no lo elige', () => {
    // Un paso más fino no sube el techo del piso (lo pone la superficie a
    // 29°C), solo baja un par de grados el agua necesaria. No justificaba una
    // decisión más en la pantalla.
    const circuits = calcularCircuitosPlanta([zona('z1', 2, 2, 4, 3)], [colector('m1', 1, 1)]);
    expect(circuits.every(c => c.pasoCm === PASO_CM)).toBe(true);
    expect(PASO_CM).toBe(15);
  });

  it('paso 15: 7 m de tubo por m² sobre la superficie útil (12 m² → 75,6 m)', () => {
    // 1/0,15 = 6,7 es la retícula ideal; los 7 agregan curvas y retorno.
    // Bajo el mobiliario fijo no se serpentea: 12 × 0,90 × 7 = 75,6.
    const circuits = calcularCircuitosPlanta([zona('z1', 2, 2, 4, 3)], [colector('m1', 1, 1)]);
    const serpentin = circuits.reduce((acc, c) => acc + c.longitudSerpentin, 0);
    expect(serpentin).toBeCloseTo(75.6, 1);
  });

  it('potencia: 86 kcal/h por m² a 45°C sobre la superficie útil (12 m² → 929)', () => {
    // Emite la superficie serpenteada: 12 × 0,90 × 86 = 929.
    const circuits = calcularCircuitosPlanta([zona('z1', 2, 2, 4, 3)], [colector('m1', 1, 1)]);
    const potencia = circuits.reduce((acc, c) => acc + c.potenciaKcalh, 0);
    expect(potencia).toBe(929);
  });

  it('la emisión depende de la temperatura de impulsión (misma para todo el sistema)', () => {
    expect(emisionKcalhM2(45)).toBe(86); // tope: piso a 29°C (100 W/m²)
    expect(emisionKcalhM2(40)).toBe(68);
    expect(emisionKcalhM2(35)).toBe(48);

    // A 35°C la misma zona de 12 m² entrega 12 × 0,90 × 48 = 518 kcal/h
    const circuits = calcularCircuitosPlanta([zona('z1', 2, 2, 4, 3)], [colector('m1', 1, 1)], 35);
    expect(circuits.reduce((acc, c) => acc + c.potenciaKcalh, 0)).toBe(518);

    // Y el presupuesto arrastra la misma temperatura
    const budget = calcularPresupuestoPisoRadiante([zona('z1', 2, 2, 4, 3)], [colector('m1', 1, 1)], [], [], 35);
    expect(budget?.tempImpulsionC).toBe(35);
    expect(budget?.emisionKcalhM2).toBe(48);
    expect(budget?.potenciaTotalKcalh).toBe(518);
  });

  it('el requerido de la zona es la carga del piso: por m², sin la altura', () => {
    // 15 m² × 80 W/m² × 0,86 = 1.032 kcal/h (factor 50 → aislación media).
    // Entrega: 15 × 0,90 × 86 = 1.161 → cubre 113%, alcanza y sobra.
    const room = {
      id: 'r1', name: 'Recámara 2', area: 15, height: 2.5,
      thermalFactor: 50 as const, hasExteriorWall: false,
      windowsLevel: 'sin-ventanas' as const, radiatorIds: [],
    };
    const z = { ...zona('z1', 2, 2, 4, 3), roomId: 'r1', name: 'Recámara 2' };
    const budget = calcularPresupuestoPisoRadiante([z], [colector('m1', 1, 1)], [], [room]);
    expect(budget).not.toBeNull();
    if (!budget) return;
    expect(budget.zonas).toHaveLength(1);
    expect(budget.zonas[0].potenciaKcalh).toBe(1161); // 15 × 0,90 × 86
    expect(budget.zonas[0].requeridoKcalh).toBe(1032);
    expect(budget.zonas[0].coberturaPct).toBe(113);
    expect(budget.zonas[0].suficiente).toBe(true);
    expect(budget.potenciaTotalKcalh).toBe(1161);
  });

  it('la carga del piso NO escala con la altura del techo', () => {
    // El piso trabaja sobre la zona ocupada (~1,8 m) y no genera la convección
    // que llevaría calor arriba. Cobrarle la altura lo castigaba justo en techo
    // alto, que es donde el simulador lo recomienda.
    const base = {
      id: 'r1', name: 'Estar', area: 15,
      thermalFactor: 50 as const, hasExteriorWall: false,
      windowsLevel: 'sin-ventanas' as const, radiatorIds: [],
    };
    const zonaEstar = { ...zona('z1', 2, 2, 4, 3), roomId: 'r1', name: 'Estar' };
    const conTecho = (height: number) => calcularPresupuestoPisoRadiante(
      [zonaEstar], [colector('m1', 1, 1)], [], [{ ...base, height }]
    )?.zonas[0].requeridoKcalh;

    expect(conTecho(2.5)).toBe(1032);
    expect(conTecho(4.5)).toBe(1032); // el piso es el mismo piso
    // Con radiadores, en cambio, la altura sí manda
    expect(calculateRoomPower({ ...base, height: 4.5 }))
      .toBeGreaterThan(calculateRoomPower({ ...base, height: 2.5 }));
  });

  it('el piso mide por m² y el radiador por volumen: son varas distintas a propósito', () => {
    // El piso NO se mide contra calculateRoomPower(). Esa es la potencia de
    // RADIADOR del ambiente y trae margen de intermitencia; el piso trabaja
    // continuo y sobre la zona ocupada. Compararlos rompía el simulador: daba
    // insuficiente en las 144 configuraciones posibles.
    const room = {
      id: 'r1', name: 'Recámara 2', area: 8.5, height: 2.5,
      thermalFactor: 50 as const, hasExteriorWall: true,
      windowsLevel: 'normales' as const, radiatorIds: [],
    };
    const z = { ...zona('z1', 2, 2, 4, 3), roomId: 'r1', name: 'Recámara 2' };
    const budget = calcularPresupuestoPisoRadiante([z], [colector('m1', 1, 1)], [], [room]);

    // Vara del piso: 8,5 m² × 80 W/m² × 0,86 — sin altura y sin los ajustes
    // de pared/ventanas, que son del modelo volumétrico
    expect(budget?.zonas[0].requeridoKcalh).toBe(585);
    // Vara del radiador para la MISMA pieza: 8,5 × 2,5 × 50 × 1,25
    expect(calculateRoomPower(room)).toBe(1328);
    // Y con esta vara el piso alcanza, que es lo que dice la obra
    expect(budget?.zonas[0].suficiente).toBe(true);
  });

  it('una pieza sin emisores conserva la vara del radiador', () => {
    // Regresión: si la vara mirara solo `!tieneRadiadores`, una pieza vacía
    // caería en la del piso y mostraría un número que no le corresponde.
    const room = {
      id: 'r1', name: 'Recámara 2', area: 8.5, height: 2.5,
      thermalFactor: 50 as const, hasExteriorWall: true,
      windowsLevel: 'normales' as const, radiatorIds: [],
    };
    expect(cargaDeDisenoKcalh(room, false, false)).toBe(calculateRoomPower(room));
    expect(cargaDeDisenoKcalh(room, false, true)).toBe(585);   // solo piso
    expect(cargaDeDisenoKcalh(room, true, true)).toBe(1328);   // mixto → radiador
  });

  it('el piso puede quedar por debajo de la carga: eso sigue siendo un resultado válido', () => {
    // Casa mal aislada (factor 60 → 100 W/m²) con el agua a 40°C: el piso
    // entrega 68 kcal/h·m² y hacen falta 86. El veredicto tiene que decirlo,
    // no ajustar la vara para que pase.
    const room = {
      id: 'r1', name: 'Estar', area: 15, height: 2.5,
      thermalFactor: 60 as const, hasExteriorWall: false,
      windowsLevel: 'sin-ventanas' as const, radiatorIds: [],
    };
    const z = { ...zona('z1', 2, 2, 4, 3), roomId: 'r1', name: 'Estar' };
    const budget = calcularPresupuestoPisoRadiante([z], [colector('m1', 1, 1)], [], [room], 40);
    expect(budget?.zonas[0].requeridoKcalh).toBe(1290);       // 15 × 100 × 0,86
    expect(budget?.zonas[0].potenciaKcalh).toBe(918);         // 15 × 0,90 × 68
    expect(budget?.zonas[0].suficiente).toBe(false);
  });

  it('la casa mal aislada no llega ni a 45°C: emite el 90% de la superficie', () => {
    // 100 W/m² es a la vez la carga de "mal aislada" y el tope del piso a 45°C,
    // así que sin descuento daría exactamente 100%. Con el mobiliario fijo
    // descontado emite 0,90 de la superficie → 90%: en el peor ambiente el piso
    // solo ya no alcanza, y eso es lo que hay que decir.
    const room = {
      id: 'r1', name: 'Estar', area: 15, height: 2.5,
      thermalFactor: 60 as const, hasExteriorWall: false,
      windowsLevel: 'sin-ventanas' as const, radiatorIds: [],
    };
    const z = { ...zona('z1', 2, 2, 4, 3), roomId: 'r1', name: 'Estar' };
    const budget = calcularPresupuestoPisoRadiante([z], [colector('m1', 1, 1)], [], [room], 45);
    expect(budget?.zonas[0].coberturaPct).toBe(90);
    expect(budget?.zonas[0].suficiente).toBe(false);
  });

  it('la zona vinculada usa el área REAL de la habitación, no la dibujada', () => {
    // Baño de 5 m² con zona dibujada de 12 m² (imagen fuera de escala):
    // la matemática usa los 5 m² reales → entrega 5 × 86 = 430,
    // carga del piso 5 × 80 × 0,86 = 344.
    const room = {
      id: 'r1', name: 'Baño', area: 5, height: 2.5,
      thermalFactor: 50 as const, hasExteriorWall: false,
      windowsLevel: 'sin-ventanas' as const, radiatorIds: [],
    };
    const z = { ...zona('z1', 2, 2, 4, 3), roomId: 'r1', name: 'Baño' };
    const budget = calcularPresupuestoPisoRadiante([z], [colector('m1', 1, 1)], [], [room]);
    expect(budget).not.toBeNull();
    if (!budget) return;
    expect(budget.zonas[0].potenciaKcalh).toBe(387); // 5 × 0,90 × 86
    expect(budget.zonas[0].areaM2).toBeCloseTo(5, 1);
    expect(budget.zonas[0].requeridoKcalh).toBe(344);
    expect(budget.zonas[0].suficiente).toBe(true);
    // La carga del ambiente se reparte entre los circuitos de la zona
    const propios = budget.circuits.filter(c => c.zoneId === 'z1');
    const cargaTotal = propios.reduce((acc, c) => acc + (c.cargaKcalh ?? 0), 0);
    expect(cargaTotal).toBe(344);
    // Sin habitación vinculada no hay carga asignada
    const sinRoom = calcularCircuitosPlanta([zona('z2', 2, 2, 4, 3)], [colector('m1', 1, 1)]);
    expect(sinRoom.every(c => c.cargaKcalh === null)).toBe(true);
  });

  it('sin habitación vinculada no hay comparación (requerido null)', () => {
    const budget = calcularPresupuestoPisoRadiante([zona('z1', 2, 2, 4, 3)], [colector('m1', 1, 1)]);
    expect(budget?.zonas[0].requeridoKcalh).toBeNull();
    expect(budget?.zonas[0].suficiente).toBeNull();
  });

  it('la zona con colector asignado a mano lo respeta aunque haya otro más cerca', () => {
    // m1 pegado a la zona, m2 lejos: sin asignación iría a m1
    const z = { ...zona('z1', 2, 2, 4, 3), manifoldId: 'm2' };
    const circuits = calcularCircuitosPlanta([z], [colector('m1', 1, 1), colector('m2', 30, 1)]);
    expect(circuits.length).toBeGreaterThan(0);
    expect(circuits.every(c => c.manifoldId === 'm2')).toBe(true);

    const conteo = circuitosPorColector(circuits);
    expect(conteo.get('m2')).toBe(circuits.length);
    expect(conteo.get('m1')).toBeUndefined();
  });

  it('si el colector asignado ya no existe, vuelve al más cercano', () => {
    const z = { ...zona('z1', 2, 2, 4, 3), manifoldId: 'borrado' };
    const circuits = calcularCircuitosPlanta([z], [colector('m1', 1, 1)]);
    expect(circuits.every(c => c.manifoldId === 'm1')).toBe(true);
  });

  it('la etiqueta numera por colector: C1 y C2 con dos colectores', () => {
    // z1 cerca de m1, z2 cerca de m2 → sus circuitos etiquetan C1 y C2
    const circuits = calcularCircuitosPlanta(
      [zona('z1', 2, 2, 4, 3), zona('z2', 40, 2, 4, 3)],
      [colector('m1', 1, 1), colector('m2', 39, 1)]
    );
    const deZ1 = circuits.filter(c => c.zoneId === 'z1');
    const deZ2 = circuits.filter(c => c.zoneId === 'z2');
    expect(deZ1.every(c => c.colectorNumero === 1)).toBe(true);
    expect(deZ2.every(c => c.colectorNumero === 2)).toBe(true);
    if (deZ1.length === 1) expect(deZ1[0].etiqueta).toBe('C1');
    if (deZ2.length === 1) expect(deZ2[0].etiqueta).toBe('C2');
    // Si una zona se divide, la etiqueta lleva el subíndice del circuito
    if (deZ2.length > 1) expect(deZ2.map(c => c.etiqueta)).toEqual(deZ2.map((_, i) => `C2.${i + 1}`));
  });

  it('potenciaZonaKcalh: la misma cuenta que suman los circuitos, sin serpentines', () => {
    // Zona de 4×3 m = 12 m², de los que emite el 90% (mobiliario fijo):
    // a 45°C → 10,8 × 86 = 929, a 35°C → 10,8 × 48 = 518.
    const z = zona('z1', 2, 2, 4, 3);
    expect(potenciaZonaKcalh(z, 45)).toBe(929);
    expect(potenciaZonaKcalh(z, 35)).toBe(518);

    const circuits = calcularCircuitosPlanta([z], [colector('m1', 1, 1)]);
    expect(circuits.reduce((acc, c) => acc + c.potenciaKcalh, 0)).toBe(potenciaZonaKcalh(z, 45));
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
