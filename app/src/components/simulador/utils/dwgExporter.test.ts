import { describe, it, expect } from 'vitest';
import { generarDWG } from './dwgExporter';
import { generarDXF, ATRIBUTOS_DE_BLOQUE } from './dxfExporter';
import type { DXFExportData } from './dxfExporter';
import { PIXELS_PER_METER } from './floorHeating';
import type { Boiler } from '../models/Boiler';
import type { Radiator } from '../models/Radiator';
import type { PipeSegment } from '../models/PipeSegment';
import type { Room } from '../models/Room';

const m = (n: number): number => n * PIXELS_PER_METER;

const living: Room = {
  id: 'r1', name: 'Living', area: 24, height: 2.6, thermalFactor: 50,
  hasExteriorWall: true, windowsLevel: 'normales', radiatorIds: ['rad1'],
  floor: 'ground', bounds: { x: m(1), y: m(1), width: m(6), height: m(4) },
};
const caldera: Boiler = {
  id: 'b1', type: 'boiler', x: m(10), y: m(5), width: m(0.6), height: m(0.4),
  power: 24000, floor: 'ground',
};
const radiador: Radiator = {
  id: 'rad1', type: 'radiator', x: m(2), y: m(4.6), width: m(1.2), height: m(0.2),
  power: 1600, elementos: 8, alturaElementoMm: 500, floor: 'ground',
};
const ida: PipeSegment = {
  id: 'p1', type: 'pipe', pipeType: 'supply',
  points: [{ x: m(10), y: m(5.2) }, { x: m(3), y: m(5.2) }],
  diameter: 20, material: 'PE-X', floor: 'ground',
};
const retorno: PipeSegment = { ...ida, id: 'p2', pipeType: 'return' };

const proyecto: DXFExportData = {
  projectName: 'Casa de prueba',
  boilers: [caldera], radiators: [radiador], pipes: [ida, retorno],
  rooms: [living], manifolds: [], floorHeatingZones: [],
};

describe('dwgExporter — el DWG sale del mismo dibujo que el DXF', () => {
  it('escribe un DWG de verdad, en AC1015', async () => {
    const bytes = await generarDWG(proyecto);
    // La versión va en los seis primeros bytes del archivo
    const cabecera = String.fromCharCode(...bytes.slice(0, 6));
    expect(cabecera).toBe('AC1015');
    expect(bytes.length).toBeGreaterThan(1000);
  });

  it('el dibujo llega entero: capas, polilíneas, bloques y textos', async () => {
    const bytes = await generarDWG(proyecto);
    const { DwgReader } = await import('@node-projects/acad-ts');
    const doc = DwgReader.readFromStream(bytes.buffer, () => {});

    const porTipo: Record<string, number> = {};
    for (const e of doc.modelSpace!.entities) {
      const t = e.constructor.name;
      porTipo[t] = (porTipo[t] ?? 0) + 1;
    }
    expect(porTipo.LwPolyline).toBeGreaterThan(0);
    expect(porTipo.Insert).toBe(2); // la caldera y el radiador
    expect(porTipo.TextEntity).toBeGreaterThan(0);

    const capas = [...doc.layers!].map(l => l.name);
    expect(capas).toContain('CT-PB-PEX20-IDA');
    expect(capas).toContain('CT-PB-RADIADORES');
  });

  it('🔴 los atributos conservan su TAG: sin eso ATTEXT no sirve', async () => {
    // La librería pierde el tag al leer el DXF y hay que reponerlo. Es lo
    // único que tiene AutoCAD LT para sacar la lista de aparatos.
    const bytes = await generarDWG(proyecto);
    const { DwgReader } = await import('@node-projects/acad-ts');
    const doc = DwgReader.readFromStream(bytes.buffer, () => {});

    const inserts = [...doc.modelSpace!.entities].filter(e => e.constructor.name === 'Insert');
    const radiadorDWG = inserts.find(i => (i as { block?: { name?: string } }).block?.name === 'CT_RADIADOR');
    expect(radiadorDWG).toBeDefined();

    const atributos = new Map<string, string>();
    for (const a of (radiadorDWG as unknown as { attributes: Iterable<{ constructor: { name: string }; tag?: string; value?: string }> }).attributes) {
      if (a?.constructor.name === 'AttributeEntity') atributos.set(String(a.tag), String(a.value));
    }
    expect(atributos.get('ID')).toBe('R1');
    expect(atributos.get('AMBIENTE')).toBe('Living');
    expect(atributos.get('ELEMENTOS')).toBe('8');
    expect(atributos.get('ALTURA_MM')).toBe('500');
    expect([...atributos.keys()]).not.toContain('');
  });

  it('🔴 cada INSERT con atributos cierra con su SEQEND', async () => {
    // El lector mete el SEQEND dentro de la lista de atributos, así que el
    // INSERT quedaba apuntándolo como si fuera su último atributo y la
    // referencia al terminador se escribía vacía: el DWG salía con los INSERT
    // sin cerrar. No se ve mirando el plano.
    const bytes = await generarDWG(proyecto);
    const { DwgReader } = await import('@node-projects/acad-ts');
    const doc = DwgReader.readFromStream(bytes.buffer, () => {});

    const inserts = [...doc.modelSpace!.entities].filter(e => e.constructor.name === 'Insert');
    expect(inserts.length).toBe(2);
    for (const i of inserts) {
      const col = (i as unknown as { attributes: { seqend: unknown; length: number } }).attributes;
      expect(col.seqend, 'el INSERT tiene que traer su SEQEND').toBeTruthy();
      // Y el SEQEND no puede seguir contado como un atributo más
      for (const a of col as unknown as Iterable<{ constructor: { name: string } }>) {
        expect(a.constructor.name).not.toBe('Seqend');
      }
    }
  });

  it('🔴 el ORDEN de los atributos del DXF es el de ATRIBUTOS_DE_BLOQUE', () => {
    // Los tags se reponen POR POSICIÓN. Si el exportador algún día emitiera
    // los ATTDEF en otro orden, el DWG saldría con los datos cruzados y no
    // habría forma de notarlo mirando el plano. Esto lo impide.
    const dxf = generarDXF(proyecto);
    // Sólo la sección BLOCKS: el nombre del bloque también aparece antes, en
    // la tabla BLOCK_RECORD, y ahí no están los ATTDEF.
    const inicio = dxf.indexOf('SECTION\n2\nBLOCKS\n');
    const seccion = dxf.slice(inicio, dxf.indexOf('ENDSEC', inicio));
    expect(inicio).toBeGreaterThan(0);

    for (const [bloque, tags] of Object.entries(ATRIBUTOS_DE_BLOQUE)) {
      const desde = seccion.indexOf(`\n${bloque}\n`);
      if (desde < 0) continue; // ese bloque no se usó en este proyecto
      const cuerpo = seccion.slice(desde, seccion.indexOf('ENDBLK', desde));
      // El tag de cada ATTDEF es su código 2, y el bloque no escribe otros
      const emitidos = [...cuerpo.matchAll(/\n2\n([A-Z_]+)\n/g)]
        .map(x => x[1])
        .filter(t => t !== bloque);
      expect(emitidos, `orden de atributos de ${bloque}`).toEqual([...tags]);
    }
  });
});
