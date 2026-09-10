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

  it('la fila trae ambiente, elementos y altura', () => {
    const filas = planillaRadiadores(
      [
        radiador('a', 1000), // manual: sin elementos
        radiador('b', 2000, { elementos: 10, alturaElementoMm: 500 }),
      ],
      rooms
    );
    // El manual no queda vacío: se calcula por potencia y se marca
    expect(filas[0]).toMatchObject({ etiqueta: 'R1', elementos: 5, alturaMm: 500, calculado: true });
    expect(filas[1]).toMatchObject({
      etiqueta: 'R2', ambiente: 'Cocina', elementos: 10, alturaMm: 500,
      potenciaKcalh: 2000, calculado: false,
    });
  });

  it('la composición cargada por el usuario manda sobre el cálculo', () => {
    // 2.000 kcal/h daría 10 elementos de 500; si él cargó 14 de 600, van 14
    const filas = planillaRadiadores(
      [radiador('b', 2000, { elementos: 14, alturaElementoMm: 600 })],
      rooms
    );
    expect(filas[0]).toMatchObject({ elementos: 14, alturaMm: 600, calculado: false });
  });

  it('la cuenta redondea hacia arriba: 200 kcal/h por elemento de 500', () => {
    const filas = planillaRadiadores(
      [radiador('a', 1469), radiador('b', 450), radiador('c', 1875)],
      rooms
    );
    expect(filas.map(f => f.elementos)).toEqual([8, 3, 10]);
    expect(filas.every(f => f.calculado)).toBe(true);
  });

  it('sin potencia no se inventa una composición', () => {
    const filas = planillaRadiadores([radiador('a', 0)], rooms);
    expect(filas[0]).toMatchObject({ elementos: null, alturaMm: null, calculado: false });
  });

  it('el radiador colocado a mano toma el ambiente donde está dibujado', () => {
    // No está en radiatorIds, pero cae adentro del contorno del Living: la
    // columna AMBIENTE no puede quedar vacía teniendo el dato a mano.
    const living: Room = {
      ...rooms[0], id: 'room-2', name: 'Living', radiatorIds: [],
      bounds: { x: 100, y: 100, width: 300, height: 200 },
    };
    const filas = planillaRadiadores([radiador('a', 1000, { x: 200, y: 180 })], [living]);
    expect(filas[0].ambiente).toBe('Living');
  });

  it('sólo toma el ambiente de SU planta', () => {
    const abajo: Room = {
      ...rooms[0], id: 'room-3', name: 'Cocina', radiatorIds: [], floor: 'ground',
      bounds: { x: 100, y: 100, width: 300, height: 200 },
    };
    const arriba = radiador('a', 1000, { x: 200, y: 180, floor: 'first' });
    expect(planillaRadiadores([arriba], [abajo])[0].ambiente).toBe('sin asignar');
  });

  it('el que no cae en ningún ambiente lo dice, no queda en blanco', () => {
    const lejos = radiador('a', 1000, { x: 5000, y: 5000 });
    expect(planillaRadiadores([lejos], rooms)[0].ambiente).toBe('sin asignar');
  });
});
