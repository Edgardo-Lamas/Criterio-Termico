import { describe, it, expect } from 'vitest';
import { autoColocarRadiadores, ELEMENTO_KCALH, ELEMENTOS_KCALH_POR_ALTURA, MAX_ELEMENTOS_POR_RADIADOR } from './autoLayout';
import { calculateRoomPower } from './thermalCalculator';
import type { Room } from '../models/Room';

function room(area: number, bounds: Room['bounds'], extra: Partial<Room> = {}): Room {
  return {
    id: 'r1',
    name: 'Hab',
    area,
    height: 2.5,
    thermalFactor: 50,
    hasExteriorWall: false,
    windowsLevel: 'sin-ventanas',
    radiatorIds: [],
    bounds,
    ...extra,
  };
}

describe('autoColocarRadiadores — borrador de radiadores por habitación', () => {
  it('sin contorno marcado no propone nada', () => {
    expect(autoColocarRadiadores(room(15, undefined))).toEqual([]);
  });

  it('habitación de 15 m²: un radiador que cubre el requerido (sin margen extra)', () => {
    // 15 × 2,5 × 50 = 1.875 → 10 elementos de 200 → 2.000 kcal/h.
    // Sin el 15%: el factor volumétrico ya viene sobredimensionado.
    const r = room(15, { x: 100, y: 100, width: 300, height: 200 });
    const propuestos = autoColocarRadiadores(r);
    expect(propuestos).toHaveLength(1);
    expect(propuestos[0].power).toBe(2000);
    expect(propuestos[0].elementos).toBe(10);
  });

  it('habitación grande: divide en varios radiadores de hasta 12 elementos', () => {
    // 40 × 2,5 × 50 = 5.000 → 25 elementos → 3 radiadores (9+8+8)
    const r = room(40, { x: 0, y: 0, width: 600, height: 300 });
    const propuestos = autoColocarRadiadores(r);
    expect(propuestos).toHaveLength(3);
    expect(propuestos.map(p => p.elementos)).toEqual([9, 8, 8]);
    propuestos.forEach(p => {
      expect(p.elementos).toBeLessThanOrEqual(MAX_ELEMENTOS_POR_RADIADOR);
      expect(p.power).toBe(p.elementos * ELEMENTO_KCALH);
    });
  });

  it('elementos de 600 y 700 mm: menos elementos por la mayor potencia unitaria', () => {
    // 15 m² → 1.875 kcal/h: a 240 (600 mm) → 8 elementos = 1.920;
    // a 280 (700 mm) → 7 elementos = 1.960
    const r = room(15, { x: 0, y: 0, width: 400, height: 200 });
    const de600 = autoColocarRadiadores(r, ELEMENTOS_KCALH_POR_ALTURA[600]);
    expect(de600[0].elementos).toBe(8);
    expect(de600[0].power).toBe(1920);
    const de700 = autoColocarRadiadores(r, ELEMENTOS_KCALH_POR_ALTURA[700]);
    expect(de700[0].elementos).toBe(7);
    expect(de700[0].power).toBe(1960);
  });

  it('la potencia total propuesta siempre cubre el requerido', () => {
    for (const area of [6, 12, 18, 25, 40, 60]) {
      const r = room(area, { x: 0, y: 0, width: 800, height: 400 });
      const total = autoColocarRadiadores(r).reduce((acc, p) => acc + p.power, 0);
      expect(total).toBeGreaterThanOrEqual(calculateRoomPower(r));
    }
  });

  it('los radiadores quedan dentro del contorno, contra la pared más larga', () => {
    const b = { x: 100, y: 50, width: 500, height: 250 };
    const propuestos = autoColocarRadiadores(room(30, b));
    propuestos.forEach(p => {
      expect(p.x).toBeGreaterThanOrEqual(b.x);
      expect(p.x + p.width).toBeLessThanOrEqual(b.x + b.width);
      // Apoyados contra la pared superior (horizontal: width ≥ height)
      expect(p.y).toBe(b.y + 4);
    });
  });

  it('habitación más alta que ancha: radiadores rotados contra la pared izquierda', () => {
    const b = { x: 0, y: 0, width: 200, height: 500 };
    const propuestos = autoColocarRadiadores(room(20, b));
    propuestos.forEach(p => {
      expect(p.x).toBe(b.x + 4);
      expect(p.width).toBe(12);          // fondo del radiador
      expect(p.height).toBeGreaterThan(12); // frente a lo largo del eje Y
    });
  });
});
