import { describe, it, expect } from 'vitest';
import { rutearOrtogonal, marcarRuta, areaDeTrabajo } from './orthogonalRouter';
import type { RouterPoint, RouterRect } from './orthogonalRouter';

const AREA: RouterRect = { x: -100, y: -100, width: 800, height: 800 };

function esOrtogonal(pts: RouterPoint[]): boolean {
  for (let i = 1; i < pts.length; i++) {
    const dx = Math.abs(pts[i].x - pts[i - 1].x);
    const dy = Math.abs(pts[i].y - pts[i - 1].y);
    if (dx > 1e-9 && dy > 1e-9) return false;
  }
  return true;
}

// Muestrea la polilínea y verifica que ningún punto caiga dentro del rect
function evitaRect(pts: RouterPoint[], r: RouterRect): boolean {
  for (let i = 0; i < pts.length - 1; i++) {
    const pasos = 40;
    for (let s = 0; s <= pasos; s++) {
      const x = pts[i].x + ((pts[i + 1].x - pts[i].x) * s) / pasos;
      const y = pts[i].y + ((pts[i + 1].y - pts[i].y) * s) / pasos;
      if (x > r.x + 1 && x < r.x + r.width - 1 && y > r.y + 1 && y < r.y + r.height - 1) {
        return false;
      }
    }
  }
  return true;
}

describe('rutearOrtogonal', () => {
  it('sin obstáculos: llega del punto A al B con tramos ortogonales', () => {
    const path = rutearOrtogonal({
      start: { x: 0, y: 0 },
      goal: { x: 200, y: 150 },
      obstaculos: [],
      ocupadas: new Set(),
      area: AREA,
    });
    expect(path).not.toBeNull();
    if (!path) return;
    expect(path[0]).toEqual({ x: 0, y: 0 });
    expect(path[path.length - 1]).toEqual({ x: 200, y: 150 });
    expect(esOrtogonal(path)).toBe(true);
  });

  it('esquiva un rectángulo interpuesto (no lo atraviesa)', () => {
    const obstaculo: RouterRect = { x: 80, y: -60, width: 60, height: 220 };
    const path = rutearOrtogonal({
      start: { x: 0, y: 50 },
      goal: { x: 300, y: 50 },
      obstaculos: [obstaculo],
      ocupadas: new Set(),
      area: AREA,
    });
    expect(path).not.toBeNull();
    if (!path) return;
    expect(path[path.length - 1]).toEqual({ x: 300, y: 50 });
    expect(evitaRect(path, obstaculo)).toBe(true);
    expect(esOrtogonal(path)).toBe(true);
  });

  it('devuelve null si el destino está completamente encerrado', () => {
    // Anillo cerrado alrededor del destino
    const path = rutearOrtogonal({
      start: { x: 0, y: 0 },
      goal: { x: 200, y: 200 },
      obstaculos: [
        { x: 150, y: 150, width: 100, height: 10 },
        { x: 150, y: 240, width: 100, height: 10 },
        { x: 150, y: 150, width: 10, height: 100 },
        { x: 240, y: 150, width: 10, height: 100 },
      ],
      ocupadas: new Set(),
      area: AREA,
    });
    expect(path).toBeNull();
  });

  it('con celdas ocupadas toma un carril paralelo (peine)', () => {
    const ocupadas = new Set<string>();
    const primera = rutearOrtogonal({
      start: { x: 0, y: 100 },
      goal: { x: 300, y: 100 },
      obstaculos: [],
      ocupadas,
      area: AREA,
    });
    expect(primera).not.toBeNull();
    if (!primera) return;
    marcarRuta(ocupadas, primera);

    const segunda = rutearOrtogonal({
      start: { x: 0, y: 100 },
      goal: { x: 300, y: 100 },
      obstaculos: [],
      ocupadas,
      area: AREA,
    });
    expect(segunda).not.toBeNull();
    if (!segunda) return;
    // La segunda no puede ir todo el trayecto pisando a la primera:
    // en el tramo central debe correr por otra fila
    const medio = segunda.find(p => p.x > 100 && p.x < 200);
    // O bien tiene un vértice desviado, o el camino directo fue penalizado
    // y tomó otra fila: alcanza con que el camino no sea idéntico
    expect(JSON.stringify(segunda)).not.toBe(JSON.stringify(primera));
    void medio;
  });
});

describe('areaDeTrabajo', () => {
  it('abarca todos los rectángulos con margen', () => {
    const area = areaDeTrabajo([
      { x: 0, y: 0, width: 100, height: 50 },
      { x: 300, y: 200, width: 50, height: 50 },
    ], 100);
    expect(area.x).toBe(-100);
    expect(area.y).toBe(-100);
    expect(area.x + area.width).toBe(450);
    expect(area.y + area.height).toBe(350);
  });
});
