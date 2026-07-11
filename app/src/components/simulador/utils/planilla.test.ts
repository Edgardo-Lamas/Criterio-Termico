import { describe, it, expect } from 'vitest';
import { etiquetasRadiadores, planillaRadiadores } from './planilla';
import type { Radiator } from '../models/Radiator';
import type { Room } from '../models/Room';

function radiador(id: string, power: number, extra: Partial<Radiator> = {}): Radiator {
  return { id, type: 'radiator', power, x: 0, y: 0, width: 60, height: 12, floor: 'ground', ...extra };
}

const rooms: Room[] = [{
  id: 'room-1', name: 'Cocina', area: 12, height: 2.5, thermalFactor: 50,
  hasExteriorWall: false, windowsLevel: 'sin-ventanas', radiatorIds: ['b'],
}];

describe('planilla de radiadores', () => {
  it('etiqueta R1..Rn por orden de creación, única entre plantas', () => {
    const et = etiquetasRadiadores([
      radiador('a', 1000),
      radiador('b', 2000, { floor: 'first' }),
      radiador('c', 1500),
    ]);
    expect(et.get('a')).toBe('R1');
    expect(et.get('b')).toBe('R2');
    expect(et.get('c')).toBe('R3');
  });

  it('la fila trae ambiente, elementos y altura; los manuales quedan con —', () => {
    const filas = planillaRadiadores(
      [
        radiador('a', 1000), // manual: sin elementos
        radiador('b', 2000, { elementos: 10, alturaElementoMm: 500 }),
      ],
      rooms
    );
    expect(filas[0]).toMatchObject({ etiqueta: 'R1', ambiente: '—', elementos: null, alturaMm: null });
    expect(filas[1]).toMatchObject({
      etiqueta: 'R2', ambiente: 'Cocina', elementos: 10, alturaMm: 500, potenciaKcalh: 2000,
    });
  });
});
