import { describe, it, expect } from 'vitest';
import { rutearTuberiasRadiadores, diametroRamalMm } from './pipeAutoRouter';
import type { Radiator } from '../models/Radiator';
import type { Boiler } from '../models/Boiler';
import type { PipeSegment } from '../models/PipeSegment';

function radiador(id: string, x: number, y: number, power = 1500): Radiator {
  return { id, type: 'radiator', power, x, y, width: 60, height: 12, floor: 'ground' };
}

function caldera(id: string, x: number, y: number): Boiler {
  return { id, type: 'boiler', power: 24000, x, y, width: 40, height: 32, floor: 'ground' };
}

// Cada tramo de la polilínea debe ser horizontal o vertical
function esOrtogonal(pts: { x: number; y: number }[]): boolean {
  for (let i = 1; i < pts.length; i++) {
    const dx = Math.abs(pts[i].x - pts[i - 1].x);
    const dy = Math.abs(pts[i].y - pts[i - 1].y);
    if (dx > 0.5 && dy > 0.5) return false;
  }
  return true;
}

describe('rutearTuberiasRadiadores — Etapa 2 del auto-diseño', () => {
  it('sin caldera en la planta no rutea nada', () => {
    expect(rutearTuberiasRadiadores([radiador('r1', 300, 300)], [], [], 'ground')).toEqual([]);
  });

  it('genera par ida/retorno ortogonal por radiador, conectado caldera→radiador', () => {
    const pipes = rutearTuberiasRadiadores(
      [radiador('r1', 400, 100), radiador('r2', 400, 400)],
      [caldera('b1', 100, 250)],
      [], 'ground'
    );
    expect(pipes).toHaveLength(4);
    expect(pipes.filter(p => p.pipeType === 'supply')).toHaveLength(2);
    expect(pipes.filter(p => p.pipeType === 'return')).toHaveLength(2);
    for (const p of pipes) {
      expect(p.fromElementId).toBe('b1');
      expect(esOrtogonal(p.points)).toBe(true);
      expect(p.length ?? 0).toBeGreaterThan(0);
      expect(p.floor).toBe('ground');
    }
    // La ida termina en la conexión del radiador (lado izquierdo, tercio superior)
    const idaR1 = pipes.find(p => p.toElementId === 'r1' && p.pipeType === 'supply')!;
    const fin = idaR1.points[idaR1.points.length - 1];
    expect(fin.x).toBeCloseTo(405, 0); // x + OFFSET 5
    expect(fin.y).toBeCloseTo(104, 0); // y + height/3
  });

  it('diámetro sugerido por potencia: Ø16 hasta 2.000, Ø20 arriba', () => {
    expect(diametroRamalMm(1800)).toBe(16);
    expect(diametroRamalMm(2400)).toBe(20);
    const pipes = rutearTuberiasRadiadores(
      [radiador('r1', 400, 100, 2400)],
      [caldera('b1', 100, 250)],
      [], 'ground'
    );
    expect(pipes.every(p => p.diameter === 20)).toBe(true);
  });

  it('los radiadores que ya tienen tubería conectada se saltean', () => {
    const existente: PipeSegment = {
      id: 'pipe-x', type: 'pipe', pipeType: 'supply', points: [{ x: 0, y: 0 }, { x: 10, y: 0 }],
      diameter: 16, material: 'pex', fromElementId: 'b1', toElementId: 'r1', floor: 'ground',
    };
    const pipes = rutearTuberiasRadiadores(
      [radiador('r1', 400, 100), radiador('r2', 400, 400)],
      [caldera('b1', 100, 250)],
      [], 'ground',
      [existente]
    );
    expect(pipes).toHaveLength(2); // solo r2
    expect(pipes.every(p => p.toElementId === 'r2')).toBe(true);
  });

  it('los ramales no atraviesan zonas de piso radiante (obstáculo del router)', () => {
    // Zona entre la caldera y el radiador: el camino directo la cruzaría
    const zona = {
      id: 'z1', type: 'floor-heating-zone' as const, name: 'Zona',
      x: 200, y: 80, width: 150, height: 350, pasoCm: 15 as const, floor: 'ground' as const,
    };
    const pipes = rutearTuberiasRadiadores(
      [radiador('r1', 450, 200)],
      [caldera('b1', 60, 200)],
      [zona], 'ground'
    );
    const cruza = (pts: { x: number; y: number }[]) => {
      for (let i = 0; i < pts.length - 1; i++) {
        for (let s = 0; s <= 30; s++) {
          const x = pts[i].x + ((pts[i + 1].x - pts[i].x) * s) / 30;
          const y = pts[i].y + ((pts[i + 1].y - pts[i].y) * s) / 30;
          if (x > zona.x + 2 && x < zona.x + zona.width - 2 &&
              y > zona.y + 2 && y < zona.y + zona.height - 2) return true;
        }
      }
      return false;
    };
    for (const p of pipes) {
      expect(cruza(p.points)).toBe(false);
    }
  });
});
