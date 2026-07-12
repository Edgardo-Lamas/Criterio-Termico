import { describe, it, expect } from 'vitest';
import { generateMultiFloorPipes, generateAutoPipes } from './pipeRouter';
import { calculateFlowRate, calculatePipeDiameter } from './pipeDimensioning';
import type { Radiator } from '../models/Radiator';
import type { Boiler } from '../models/Boiler';

function radiador(id: string, x: number, y: number, power: number, floor: 'ground' | 'first'): Radiator {
  return { id, type: 'radiator', power, x, y, width: 60, height: 12, floor };
}

function caldera(id: string, x: number, y: number, floor: 'ground' | 'first' = 'ground'): Boiler {
  return { id, type: 'boiler', power: 24000, x, y, width: 40, height: 32, floor };
}

describe('generateMultiFloorPipes — dimensionado del montante', () => {
  it('el montante se dimensiona al crearse según la potencia de la planta que alimenta', () => {
    // Caso real de Edgardo: 4 radiadores en PA, 6.600 kcal/h → 660 L/h.
    // Antes quedaba hardcodeado en Ø16 si el re-dimensionado no corría.
    const radiatorsPA = [
      radiador('r1', 400, 100, 1650, 'first'),
      radiador('r2', 400, 300, 1650, 'first'),
      radiador('r3', 600, 100, 1650, 'first'),
      radiador('r4', 600, 300, 1650, 'first'),
    ];
    const result = generateMultiFloorPipes(
      [radiador('r0', 300, 200, 2000, 'ground'), ...radiatorsPA],
      [caldera('b1', 100, 200, 'ground')]
    );

    const esperado = calculatePipeDiameter(calculateFlowRate(6600));
    expect(esperado).toBeGreaterThanOrEqual(20); // nunca Ø16 para 6.600 kcal/h

    const montantes = result.pipes.filter(p => p.floor === 'vertical');
    expect(montantes.length).toBeGreaterThan(0);
    for (const m of montantes) {
      expect(m.diameter).toBe(esperado);
    }

    // El tramo caldera → montante lleva la misma potencia: mismo diámetro
    const conexiones = result.pipes.filter(p => p.id.includes('boiler-connection'));
    expect(conexiones.length).toBeGreaterThan(0);
    for (const c of conexiones) {
      expect(c.diameter).toBe(esperado);
    }
  });
});

describe('generateAutoPipes — troncal que reduce por potencia acumulada', () => {
  it('los largos usan la escala del simulador (50 px/m)', () => {
    // Radiador a 500 px de la caldera → el recorrido debe rondar los 10 m,
    // no los 5 m que daba la escala vieja de 100 px/m
    const result = generateAutoPipes(
      [radiador('r1', 600, 200, 1500, 'ground')],
      [caldera('b1', 100, 200, 'ground')]
    );
    const supply = result.pipes.filter(p => p.pipeType === 'supply');
    const total = supply.reduce((acc, p) => acc + (p.length ?? 0), 0);
    expect(total).toBeGreaterThan(8);
    expect(total).toBeLessThan(14);
  });

  it('el primer tramo del troncal es al menos tan grueso como los ramales', () => {
    const result = generateAutoPipes(
      [
        radiador('r1', 400, 100, 2000, 'ground'),
        radiador('r2', 600, 100, 2000, 'ground'),
        radiador('r3', 800, 100, 2000, 'ground'),
      ],
      [caldera('b1', 100, 100, 'ground')]
    );
    const troncales = result.pipes.filter(p => p.pipeType === 'supply' && p.id.includes('trunk'));
    const ramales = result.pipes.filter(p => p.pipeType === 'supply' && p.id.includes('branch'));
    expect(troncales.length).toBeGreaterThan(0);
    expect(ramales.length).toBe(3);
    const maxRamal = Math.max(...ramales.map(r => r.diameter));
    expect(troncales[0].diameter).toBeGreaterThanOrEqual(maxRamal);
    // 6.000 kcal/h acumulados → 600 L/h → Ø20 según la tabla común
    expect(troncales[0].diameter).toBe(calculatePipeDiameter(600));
  });
});
