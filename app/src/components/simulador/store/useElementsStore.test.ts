import { describe, it, expect, beforeEach } from 'vitest';
import { useElementsStore } from './useElementsStore';
import type { Project } from '../utils/projectStorage';
import type { Radiator } from '../models/Radiator';
import type { Boiler } from '../models/Boiler';
import type { Manifold } from '../models/Manifold';
import type { Room } from '../models/Room';
import type { FloorHeatingZone } from '../models/FloorHeatingZone';

const radiator: Radiator = { id: 'rad1', type: 'radiator', x: 10, y: 10, power: 1000, width: 40, height: 20 };
const boiler: Boiler = { id: 'boi1', type: 'boiler', x: 20, y: 20, power: 20000, width: 40, height: 40 };
const manifold: Manifold = { id: 'man1', type: 'manifold', x: 30, y: 30, width: 20, height: 40 };
const zona: FloorHeatingZone = { id: 'z1', type: 'floor-heating-zone', x: 0, y: 0, name: 'Zona 1', width: 100, height: 100 };
const room: Room = {
  id: 'room1', name: 'Sala', area: 20, height: 2.5,
  thermalFactor: 50, hasExteriorWall: false, windowsLevel: 'normales', radiatorIds: [],
};

const EMPTY: Project = {
  projectName: '', version: '', createdAt: '', lastModified: '',
  radiators: [], boilers: [], pipes: [], scale: 50,
};

describe('useElementsStore.loadProject', () => {
  beforeEach(() => {
    useElementsStore.getState().loadProject(EMPTY);
  });

  it('restaura piso radiante y habitaciones, no solo radiadores y calderas', () => {
    useElementsStore.getState().loadProject({
      ...EMPTY,
      projectName: 'Obra Test',
      radiators: [radiator],
      boilers: [boiler],
      manifolds: [manifold],
      floorHeatingZones: [zona],
      rooms: [room],
    });

    const s = useElementsStore.getState();
    expect(s.radiators).toHaveLength(1);
    expect(s.boilers).toHaveLength(1);
    // El bug que se corrige: estos tres se perdían al restaurar el autoguardado.
    expect(s.manifolds).toHaveLength(1);
    expect(s.floorHeatingZones).toHaveLength(1);
    expect(s.rooms).toHaveLength(1);
    expect(s.manifolds[0].id).toBe('man1');
    expect(s.floorHeatingZones[0].id).toBe('z1');
    expect(s.rooms[0].id).toBe('room1');
    expect(s.projectName).toBe('Obra Test');
  });

  it('proyecto viejo sin piso radiante ni habitaciones → arrays vacíos (retrocompat)', () => {
    useElementsStore.getState().loadProject({ ...EMPTY, projectName: 'Viejo', radiators: [radiator] });

    const s = useElementsStore.getState();
    expect(s.manifolds).toEqual([]);
    expect(s.floorHeatingZones).toEqual([]);
    expect(s.rooms).toEqual([]);
  });
});
