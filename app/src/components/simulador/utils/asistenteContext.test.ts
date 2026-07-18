import { describe, it, expect } from 'vitest';
import { armarResumenSimulador, MAX_RESUMEN_CHARS, type EstadoSimulador } from './asistenteContext';
import { calculateRoomPower } from './thermalCalculator';
import { cargaPisoKcalh } from './floorHeating';
import type { Radiator } from '../models/Radiator';
import type { Room } from '../models/Room';
import type { FloorHeatingZone } from '../models/FloorHeatingZone';

function radiador(id: string, power: number, extra: Partial<Radiator> = {}): Radiator {
  return { id, type: 'radiator', power, x: 0, y: 0, width: 60, height: 12, floor: 'ground', ...extra };
}

function ambiente(id: string, extra: Partial<Room> = {}): Room {
  return {
    id, name: 'Cocina', area: 12, height: 2.5, thermalFactor: 50,
    hasExteriorWall: false, windowsLevel: 'sin-ventanas', radiatorIds: [], floor: 'ground',
    ...extra,
  };
}

function zona(id: string, extra: Partial<FloorHeatingZone> = {}): FloorHeatingZone {
  // 500 × 300 px a 50 px/m = 10 m × 6 m = 60 m²
  return { id, type: 'floor-heating-zone', name: 'Zona', x: 0, y: 0, width: 500, height: 300, floor: 'ground', ...extra };
}

function estado(extra: Partial<EstadoSimulador> = {}): EstadoSimulador {
  return {
    projectName: 'Obra de prueba',
    rooms: [], radiators: [], boilers: [], pipes: [], manifolds: [], floorHeatingZones: [],
    floorHeatingTempC: 45,
    ...extra,
  };
}

describe('resumen del Simulador para el asistente', () => {
  it('con el canvas vacío devuelve null (el asistente responde sin contexto)', () => {
    expect(armarResumenSimulador(estado())).toBeNull();
  });

  it('ambiente con radiador: carga volumétrica, etiqueta R1 y porcentaje instalado', () => {
    const room = ambiente('room-1', { name: 'Living', radiatorIds: ['a'], hasExteriorWall: true, windowsLevel: 'normales' });
    const texto = armarResumenSimulador(estado({
      rooms: [room],
      radiators: [radiador('a', 1500)],
    }));

    const carga = calculateRoomPower(room);
    expect(texto).toContain('PROYECTO: Obra de prueba');
    expect(texto).toContain(`carga ${carga.toLocaleString('es-AR')} kcal/h`);
    expect(texto).toContain('R1 (1.500 kcal/h)');
    expect(texto).toContain(`(${Math.round((1500 / carga) * 100)}% de la carga)`);
    expect(texto).toContain('pared exterior');
  });

  it('ambiente solo con piso usa la vara del piso, no la volumétrica', () => {
    const room = ambiente('room-1', { name: 'Dormitorio', area: 10 });
    const texto = armarResumenSimulador(estado({
      rooms: [room],
      floorHeatingZones: [zona('z1', { name: 'Dormitorio', roomId: 'room-1' })],
    }));

    expect(texto).toContain(`carga ${cargaPisoKcalh(room).toLocaleString('es-AR')} kcal/h`);
    expect(texto).not.toContain(`carga ${calculateRoomPower(room).toLocaleString('es-AR')} kcal/h`);
    expect(texto).toContain('zona "Dormitorio"');
    // 60 m² × 7 m/m² − 10% mobiliario = 378 m de serpentín
    expect(texto).toContain('~378 m de serpentín');
  });

  it('radiador sin ambiente va aparte y avisa que no entra en las cargas', () => {
    const texto = armarResumenSimulador(estado({ radiators: [radiador('a', 2000)] }));
    expect(texto).toContain('RADIADORES SIN AMBIENTE ASIGNADO: R1 (2.000 kcal/h, PB)');
    expect(texto).toContain('no entran en las cargas ni en la caldera');
  });

  it('ambiente sin emisores figura como no calefaccionado y no genera caldera', () => {
    const texto = armarResumenSimulador(estado({ rooms: [ambiente('room-1')] }));
    expect(texto).toContain('Sin emisores asignados: no se calefacciona');
    expect(texto).not.toContain('CALDERA:');
  });

  it('caldera recomendada avisa cuando manda el mínimo comercial de 24 kW', () => {
    // Cocina chica: carga ÷ 0,80 queda muy abajo de 20.640 kcal/h
    const texto = armarResumenSimulador(estado({
      rooms: [ambiente('room-1', { radiatorIds: ['a'] })],
      radiators: [radiador('a', 1500)],
    }));
    expect(texto).toContain('Recomendada por la plataforma: 20.640 kcal/h (24 kW');
    expect(texto).toContain('la caldera más chica del mercado (24 kW)');
    expect(texto).toContain('Todavía no hay caldera colocada en el plano');
  });

  it('un proyecto gigante se corta en el tope y lo dice', () => {
    const rooms = Array.from({ length: 80 }, (_, i) =>
      ambiente(`room-${i}`, { name: `Ambiente con nombre largo número ${i}`, radiatorIds: [`r-${i}`] })
    );
    const radiators = rooms.map((_, i) => radiador(`r-${i}`, 1500));
    const texto = armarResumenSimulador(estado({ rooms, radiators }));

    expect(texto).not.toBeNull();
    expect(texto!.length).toBeLessThanOrEqual(MAX_RESUMEN_CHARS + 100);
    expect(texto).toContain('[Resumen cortado');
  });
});
