import { describe, it, expect } from 'vitest';
import { generarDXF, dxfABytes } from './dxfExporter';
import type { DXFExportData } from './dxfExporter';
import { PIXELS_PER_METER } from './floorHeating';
import type { Room } from '../models/Room';
import type { Boiler } from '../models/Boiler';
import type { Radiator } from '../models/Radiator';
import type { PipeSegment } from '../models/PipeSegment';
import type { Manifold } from '../models/Manifold';
import type { FloorHeatingZone } from '../models/FloorHeatingZone';

const m = (n: number): number => n * PIXELS_PER_METER;

// ---------- Lectura del DXF generado ----------

interface EntidadLeida {
  tipo: string;
  capa: string;
  puntos: { x: number; y: number }[];
  texto: string | null;
}

/**
 * Lee las entidades de la sección ENTITIES. Alcanza con los pares
 * código/valor: no hace falta un parser de DXF para verificar lo que se dibuja.
 */
function entidades(dxf: string): EntidadLeida[] {
  const lineas = dxf.split('\n');
  const inicio = lineas.findIndex((l, i) => l.trim() === 'ENTITIES' && lineas[i - 1]?.trim() === '2');
  const salida: EntidadLeida[] = [];
  let actual: EntidadLeida | null = null;
  let x: number | null = null;
  // 🔴 De a DOS líneas: el DXF son pares código/valor y un valor puede parecer
  // un código —`72` `1` en un texto centrado se leía como «código 1», o sea
  // texto, y pisaba el contenido de la entidad.
  for (let i = inicio + 1; i < lineas.length; i += 2) {
    const codigo = lineas[i].trim();
    const valor = (lineas[i + 1] ?? '').trim();
    if (codigo === '0') {
      if (actual) salida.push(actual);
      actual = valor === 'ENDSEC' ? null : { tipo: valor, capa: '', puntos: [], texto: null };
      if (valor === 'ENDSEC') break;
    } else if (actual) {
      if (codigo === '8') actual.capa = valor;
      else if (codigo === '1') actual.texto = valor;
      else if (codigo === '10' || codigo === '11') x = parseFloat(valor);
      else if ((codigo === '20' || codigo === '21') && x !== null) {
        actual.puntos.push({ x, y: parseFloat(valor) });
        x = null;
      }
    }
  }
  return salida;
}

function capas(dxf: string): string[] {
  const tabla = dxf.split('LAYER\n')[0];
  void tabla;
  const nombres: string[] = [];
  const lineas = dxf.split('\n');
  for (let i = 0; i < lineas.length; i++) {
    if (lineas[i].trim() === 'AcDbLayerTableRecord') {
      // 100 AcDbLayerTableRecord → 2 → <nombre>
      if (lineas[i + 1]?.trim() === '2') nombres.push(lineas[i + 2].trim());
    }
  }
  return nombres;
}

function variableHeader(dxf: string, nombre: string): string {
  const lineas = dxf.split('\n');
  const i = lineas.findIndex(l => l.trim() === nombre);
  return lineas[i + 2]?.trim() ?? '';
}

// ---------- Proyecto de prueba ----------

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
const colector: Manifold = {
  id: 'col1', type: 'manifold', x: m(9), y: m(1.2), width: m(0.5), height: m(0.3),
  floor: 'ground',
};
const zona: FloorHeatingZone = {
  id: 'z1', type: 'floor-heating-zone', name: 'Living', roomId: 'r1',
  x: m(1.2), y: m(1.2), width: m(5.6), height: m(3.6), floor: 'ground',
};

const proyecto: DXFExportData = {
  projectName: 'Casa de prueba',
  boilers: [caldera], radiators: [radiador], pipes: [ida, retorno],
  rooms: [living], manifolds: [colector], floorHeatingZones: [zona],
};

// ---------- Tests ----------

describe('dxfExporter — estructura del archivo', () => {
  it('escribe un DXF AC1015 completo, con todas sus secciones', () => {
    const dxf = generarDXF(proyecto);
    expect(variableHeader(dxf, '$ACADVER')).toBe('AC1015');
    for (const seccion of ['HEADER', 'TABLES', 'BLOCKS', 'ENTITIES', 'OBJECTS']) {
      expect(dxf).toContain(`SECTION\n2\n${seccion}\n`);
    }
    expect(dxf.trimEnd().endsWith('EOF')).toBe(true);
    // Model space y su block record: sin ellos AutoCAD rechaza el archivo
    expect(dxf).toContain('*Model_Space');
    expect(dxf).toContain('AcDbBlockTableRecord');
  });

  it('declara metros: el que lo abre no tiene que escalar nada a mano', () => {
    const dxf = generarDXF(proyecto);
    expect(variableHeader(dxf, '$INSUNITS')).toBe('6'); // 6 = metros
    expect(variableHeader(dxf, '$MEASUREMENT')).toBe('1'); // sistema métrico
  });
});

describe('dxfExporter — medidas', () => {
  it('dibuja en metros: un ambiente de 6 × 4 m mide 6 × 4 unidades', () => {
    const rect = entidades(generarDXF(proyecto))
      .find(e => e.capa === 'CT-PB-AMBIENTES' && e.tipo === 'LWPOLYLINE');
    expect(rect).toBeDefined();
    const xs = rect!.puntos.map(p => p.x);
    const ys = rect!.puntos.map(p => p.y);
    expect(Math.max(...xs) - Math.min(...xs)).toBeCloseTo(6, 3);
    expect(Math.max(...ys) - Math.min(...ys)).toBeCloseTo(4, 3);
  });

  it('da vuelta el eje Y: lo que en pantalla está más abajo, en el plano está más abajo', () => {
    // El radiador está contra el borde INFERIOR del living (y mayor en el
    // canvas). Sin el espejo aparecería contra el borde de arriba.
    const ents = entidades(generarDXF(proyecto));
    const ambiente = ents.find(e => e.capa === 'CT-PB-AMBIENTES')!;
    const rad = ents.find(e => e.capa === 'CT-PB-RADIADORES')!;
    const yAmbiente = ambiente.puntos.map(p => p.y);
    const yRad = Math.min(...rad.puntos.map(p => p.y));
    const alturaAmbiente = Math.max(...yAmbiente) - Math.min(...yAmbiente);
    expect(yRad - Math.min(...yAmbiente)).toBeLessThan(alturaAmbiente / 2);
  });

  it('pone la planta alta al lado de la baja, no encima', () => {
    const dxf = generarDXF({
      ...proyecto,
      radiators: [radiador, { ...radiador, id: 'rad2', floor: 'first' }],
      rooms: [living, { ...living, id: 'r2', name: 'Dormitorio', floor: 'first' }],
    });
    const ents = entidades(dxf);
    const pb = ents.find(e => e.capa === 'CT-PB-AMBIENTES')!;
    const pa = ents.find(e => e.capa === 'CT-PA-AMBIENTES')!;
    const derechaPB = Math.max(...pb.puntos.map(p => p.x));
    const izquierdaPA = Math.min(...pa.puntos.map(p => p.x));
    expect(izquierdaPA).toBeGreaterThan(derechaPB);
  });
});

describe('dxfExporter — lo que tiene que salir sí o sí', () => {
  it('exporta los colectores y los circuitos de piso radiante', () => {
    const ents = entidades(generarDXF(proyecto));
    expect(ents.some(e => e.capa === 'CT-PB-COLECTORES')).toBe(true);
    // Serpentín: ida y retorno de cada circuito
    expect(ents.filter(e => e.capa === 'CT-PB-PEX20-PISO-IDA').length).toBeGreaterThan(0);
    expect(ents.filter(e => e.capa === 'CT-PB-PEX20-PISO-RET').length).toBeGreaterThan(0);
    // Primaria caldera → colector
    expect(ents.some(e => e.capa === 'CT-PB-PEX32-PRIMARIA-IDA')).toBe(true);
    // Y cada circuito rotulado como en obra: C1, C1.1, C1.2...
    expect(ents.some(e => e.tipo === 'TEXT' && /^C\d/.test(e.texto ?? ''))).toBe(true);
  });

  it('pone cada tubo en su capa de material y diámetro, ida y retorno aparte', () => {
    // Es lo que le permite al arquitecto sacar los metros por capa: en LT no
    // existe DATAEXTRACTION para hacerlo de otra manera.
    const ents = entidades(generarDXF(proyecto));
    expect(ents.some(e => e.capa === 'CT-PB-PEX20-IDA')).toBe(true);
    expect(ents.some(e => e.capa === 'CT-PB-PEX20-RET')).toBe(true);
  });

  it('el colector se dibuja a escala: ancho = vías × 5 cm', () => {
    const dxf = generarDXF(proyecto);
    const ins = entidades(dxf).find(e => e.tipo === 'INSERT' && e.capa === 'CT-PB-COLECTORES');
    expect(ins).toBeDefined();
    // La escala X del bloque es el ancho real en metros
    const vias = entidades(dxf)
      .filter(e => e.tipo === 'TEXT' && /^COLECTOR 1/.test(e.texto ?? ''))[0];
    expect(vias?.texto).toMatch(/COLECTOR 1 \(\d+ circuitos\)/);
    const circuitos = Number((vias!.texto!.match(/\((\d+)/) ?? [])[1]);
    expect(dxf).toContain(`\n41\n${(circuitos * 0.05).toFixed(4)}\n`);
  });

  it('caldera, radiadores y colectores van como bloques con atributos', () => {
    // Con atributos el arquitecto puede sacar la planilla con ATTEXT, que es
    // lo único que tiene AutoCAD LT.
    const dxf = generarDXF(proyecto);
    for (const bloque of ['CT_RADIADOR', 'CT_CALDERA', 'CT_COLECTOR']) {
      expect(dxf).toContain(`\n2\n${bloque}\n`);
    }
    expect(dxf).toContain('AcDbAttributeDefinition');
    expect(dxf).toContain('AcDbAttribute\n');
    expect(dxf).toContain('POTENCIA_KCALH');
    // Todo INSERT con atributos tiene que cerrar con SEQEND
    const inserts = (dxf.match(/\n0\nINSERT\n/g) ?? []).length;
    const seqends = (dxf.match(/\n0\nSEQEND\n/g) ?? []).length;
    expect(seqends).toBe(inserts);
  });

  it('lleva el despiece de materiales dibujado, sin precios', () => {
    const textos = entidades(generarDXF(proyecto))
      .filter(e => e.tipo === 'TEXT').map(e => e.texto ?? '');
    expect(textos).toContain('DESPIECE DE MATERIALES');
    expect(textos.some(t => t.startsWith('Caldera 24.000'))).toBe(true);
    expect(textos.some(t => /^Tubo PE-X .*radiadores/.test(t))).toBe(true);
    expect(textos.some(t => t.includes('Placa Aislante'))).toBe(true);
    // Sin precios: no hay ningún signo de moneda en todo el archivo
    expect(textos.some(t => t.includes('$') || /USD/.test(t))).toBe(false);
  });

  it('lleva la planilla de radiadores y la de circuitos', () => {
    const textos = entidades(generarDXF(proyecto))
      .filter(e => e.tipo === 'TEXT').map(e => e.texto ?? '');
    expect(textos).toContain('PLANILLA DE RADIADORES');
    expect(textos.some(t => t.startsWith('PLANILLA DE CIRCUITOS'))).toBe(true);
    expect(textos).toContain('R1'); // identificación del radiador en el plano
  });

  it('explica adentro del archivo cómo se usa y qué es cada capa', () => {
    // El que lo abre no tiene a nadie al lado que se lo explique: sin esto ve
    // líneas de colores y no se entera de que las cañerías están cortadas por
    // diámetro ni de que el despiece ya está adentro.
    const textos = entidades(generarDXF(proyecto))
      .filter(e => e.tipo === 'TEXT').map(e => e.texto ?? '');
    expect(textos).toContain('CÓMO USAR ESTE ARCHIVO');
    expect(textos.some(t => t.includes('METROS'))).toBe(true);
    expect(textos.some(t => t.includes('ATTEXT'))).toBe(true);
    // Cada capa de cañería, traducida a lenguaje de obra
    expect(textos).toContain('CT-PB-PEX20-IDA');
    // El Ø va como %%C, igual que en el resto del archivo
    expect(textos.some(t => t === 'planta baja · PE-X %%C20 · ida · radiadores')).toBe(true);
    // Los DOS sistemas nombrados: si sólo se nombra el piso radiante, el que
    // abre el archivo no sabe que las otras capas son la de radiadores
    expect(textos.some(t => t.includes('· piso radiante'))).toBe(true);
    expect(textos.some(t => t === 'Este plano lleva la instalación de radiadores y piso radiante.')).toBe(true);
  });

  it('no crea capas vacías', () => {
    const dxf = generarDXF(proyecto);
    const usadas = new Set(entidades(dxf).map(e => e.capa));
    const declaradas = capas(dxf).filter(n => n !== '0');
    expect(declaradas.filter(n => !usadas.has(n))).toEqual([]);
  });

  it('sin piso radiante igual exporta radiadores y cañerías', () => {
    const ents = entidades(generarDXF({
      ...proyecto, manifolds: [], floorHeatingZones: [],
    }));
    expect(ents.some(e => e.capa === 'CT-PB-RADIADORES')).toBe(true);
    expect(ents.some(e => e.capa === 'CT-PB-PEX20-IDA')).toBe(true);
  });

  it('un proyecto vacío no rompe', () => {
    expect(() => generarDXF({
      projectName: '', boilers: [], radiators: [], pipes: [],
    })).not.toThrow();
  });
});

describe('dxfExporter — texto que llega entero al AutoCAD del arquitecto', () => {
  it('escribe el diámetro con el código de control, no con el símbolo', () => {
    const dxf = generarDXF(proyecto);
    expect(dxf).toContain('%%C'); // %%C = Ø en cualquier AutoCAD
    const textos = entidades(dxf).filter(e => e.tipo === 'TEXT').map(e => e.texto ?? '');
    expect(textos.some(t => t.includes('Ø'))).toBe(false);
  });

  it('no deja ningún carácter que ANSI_1252 no pueda escribir', () => {
    const dxf = generarDXF({ ...proyecto, projectName: 'Casa Pérez — “La Ñata” 😀' });
    expect([...dxf].every(ch => (ch.codePointAt(0) ?? 0) < 256)).toBe(true);
    const titulo = entidades(dxf).find(e => e.texto?.startsWith('CASA'));
    expect(titulo?.texto).toContain('PÉREZ'); // el acento sí entra
    expect(titulo?.texto).not.toContain('—');  // la raya larga, no
  });

  it('dxfABytes escribe un byte por carácter', () => {
    const bytes = dxfABytes(generarDXF(proyecto));
    expect(bytes.length).toBe(generarDXF(proyecto).length);
    expect(bytes[0]).toBe('0'.charCodeAt(0));
  });
});

// ---------- Etiquetas de diámetro: que NO se pisen ----------

/**
 * Textos con su punto de anclaje real, altura y rotación. El lector de arriba
 * alcanza para el contenido; acá hace falta la geometría, que es justo lo que
 * falló: el plano abrió bien y las etiquetas se montaban unas sobre otras.
 */
interface TextoLeido {
  capa: string;
  texto: string;
  x: number;
  y: number;
  altura: number;
  rot: number;
}

function textos(dxf: string): TextoLeido[] {
  const lineas = dxf.split('\n');
  const inicio = lineas.findIndex((l, i) => l.trim() === 'ENTITIES' && lineas[i - 1]?.trim() === '2');
  const salida: TextoLeido[] = [];
  let actual: TextoLeido | null = null;
  let esTexto = false;
  for (let i = inicio + 1; i < lineas.length; i += 2) {
    const codigo = lineas[i].trim();
    const valor = (lineas[i + 1] ?? '').trim();
    if (codigo === '0') {
      if (actual && esTexto) salida.push(actual);
      if (valor === 'ENDSEC') break;
      esTexto = valor === 'TEXT';
      actual = { capa: '', texto: '', x: 0, y: 0, altura: 0, rot: 0 };
    } else if (actual && esTexto) {
      if (codigo === '8') actual.capa = valor;
      else if (codigo === '1') actual.texto = valor;
      else if (codigo === '10' || codigo === '11') actual.x = parseFloat(valor);
      else if (codigo === '20' || codigo === '21') actual.y = parseFloat(valor);
      else if (codigo === '40') actual.altura = parseFloat(valor);
      else if (codigo === '50') actual.rot = parseFloat(valor);
    }
  }
  return salida;
}

/** Caja que ocupa el texto girado, en metros del dibujo. */
function caja(t: TextoLeido): { x0: number; y0: number; x1: number; y1: number } {
  const rad = (t.rot * Math.PI) / 180;
  const ancho = t.texto.length * t.altura * 0.6;
  const alto = t.altura;
  const cx = t.x - Math.sin(rad) * (alto / 2);
  const cy = t.y + Math.cos(rad) * (alto / 2);
  const mx = (ancho * Math.abs(Math.cos(rad)) + alto * Math.abs(Math.sin(rad))) / 2;
  const my = (ancho * Math.abs(Math.sin(rad)) + alto * Math.abs(Math.cos(rad))) / 2;
  return { x0: cx - mx, y0: cy - my, x1: cx + mx, y1: cy + my };
}

/** Sólo lo escrito SOBRE el dibujo: el despiece también dice «%%C20». */
function rotulosDelPlano(dxf: string): TextoLeido[] {
  return textos(dxf).filter(t => t.capa.endsWith('-ETIQUETAS'));
}

function seSuperponen(a: TextoLeido, b: TextoLeido): boolean {
  const ca = caja(a);
  const cb = caja(b);
  return ca.x0 < cb.x1 && cb.x0 < ca.x1 && ca.y0 < cb.y1 && cb.y0 < ca.y1;
}

describe('dxfExporter — las etiquetas de diámetro no se pisan', () => {
  it('ida y retorno comparten UNA etiqueta, no una cada uno', () => {
    // El proyecto de prueba tiene el retorno calcado sobre la ida: es el caso
    // que se vio en el CAD, dos «Ø20» a 0,0 cm de distancia.
    const dxf = generarDXF(proyecto);
    const diametros = rotulosDelPlano(dxf).filter(t => t.texto === '%%C20');
    expect(diametros).toHaveLength(1);
  });

  it('ninguna etiqueta de diámetro se superpone con otra', () => {
    // Ocho tramos: cuatro pares ida/retorno paralelos y cercanos, como los
    // genera el ruteo real.
    const pares: PipeSegment[] = [];
    for (let i = 0; i < 4; i++) {
      const y = m(2 + i * 1.5);
      pares.push(
        {
          id: `s${i}`, type: 'pipe', pipeType: 'supply',
          points: [{ x: m(1), y }, { x: m(8), y }],
          diameter: 20, material: 'PE-X', floor: 'ground',
        },
        {
          id: `r${i}`, type: 'pipe', pipeType: 'return',
          points: [{ x: m(1), y: y + m(0.18) }, { x: m(8), y: y + m(0.18) }],
          diameter: 20, material: 'PE-X', floor: 'ground',
        }
      );
    }
    const dxf = generarDXF({ ...proyecto, pipes: pares });
    const diametros = rotulosDelPlano(dxf).filter(t => t.texto.startsWith('%%C'));
    expect(diametros.length).toBeGreaterThan(0);
    for (let i = 0; i < diametros.length; i++) {
      for (let j = i + 1; j < diametros.length; j++) {
        expect(
          seSuperponen(diametros[i], diametros[j]),
          `«${diametros[i].texto}» y «${diametros[j].texto}» se pisan`
        ).toBe(false);
      }
    }
  });

  it('la etiqueta se gira siguiendo la dirección del caño', () => {
    const vertical: PipeSegment = {
      id: 'v1', type: 'pipe', pipeType: 'supply',
      points: [{ x: m(4), y: m(2) }, { x: m(4), y: m(9) }],
      diameter: 16, material: 'PE-X', floor: 'ground',
    };
    const dxf = generarDXF({ ...proyecto, pipes: [vertical] });
    const etiqueta = rotulosDelPlano(dxf).find(t => t.texto === '%%C16');
    expect(etiqueta).toBeDefined();
    expect(Math.abs(etiqueta!.rot)).toBeCloseTo(90, 1);
  });

  it('el texto no queda cabeza abajo: la rotación vive entre -90 y 90', () => {
    // Caño dibujado de derecha a izquierda: sin normalizar saldría a 180°
    const alReves: PipeSegment = {
      id: 'v2', type: 'pipe', pipeType: 'supply',
      points: [{ x: m(9), y: m(3) }, { x: m(2), y: m(3) }],
      diameter: 25, material: 'PE-X', floor: 'ground',
    };
    const dxf = generarDXF({ ...proyecto, pipes: [alReves] });
    const etiqueta = rotulosDelPlano(dxf).find(t => t.texto === '%%C25');
    expect(etiqueta).toBeDefined();
    expect(etiqueta!.rot).toBeGreaterThanOrEqual(-90);
    expect(etiqueta!.rot).toBeLessThan(90);
  });

  it('la etiqueta no se escribe encima del símbolo de un radiador', () => {
    // Un radiador justo al costado del par de caños: la etiqueta tiene que
    // buscar el otro lado en vez de quedar sobre el dibujo del aparato.
    const pegado: Radiator = {
      ...radiador, id: 'rad9', x: m(6), y: m(4.9), width: m(1.2), height: m(0.6),
    };
    const dxf = generarDXF({ ...proyecto, radiators: [radiador, pegado] });
    const etiqueta = rotulosDelPlano(dxf).find(t => t.texto === '%%C20');
    if (!etiqueta) return; // suprimida por falta de lugar: tampoco lo pisa
    const bloque = entidades(dxf).find(e => e.tipo === 'INSERT' && e.capa === 'CT-PB-RADIADORES');
    expect(bloque).toBeDefined();
    const c = caja(etiqueta);
    const [bx, by] = [bloque!.puntos[0].x, bloque!.puntos[0].y];
    const dentro = c.x0 < bx + 1.2 && bx < c.x1 && c.y0 < by + 0.6 && by < c.y1;
    expect(dentro).toBe(false);
  });

  it('la etiqueta queda al costado del par, no encima del caño', () => {
    const dxf = generarDXF(proyecto);
    const etiqueta = rotulosDelPlano(dxf).find(t => t.texto === '%%C20')!;
    // Contra el caño de verdad: la polilínea de la ida, que corre horizontal.
    const canio = entidades(dxf).find(e => e.capa === 'CT-PB-PEX20-IDA')!;
    const yCanio = canio.puntos[0].y;
    expect(Math.abs(etiqueta.y - yCanio)).toBeGreaterThanOrEqual(etiqueta.altura * 0.4);
  });
});

describe('dxfExporter — montantes entre plantas', () => {
  const montanteIda: PipeSegment = {
    id: 'm1', type: 'pipe', pipeType: 'supply',
    points: [{ x: m(8.7), y: m(6) }, { x: m(8.7), y: m(6.8) }],
    diameter: 25, material: 'PE-X', floor: 'vertical',
  };
  const montanteRet: PipeSegment = {
    ...montanteIda, id: 'm2', pipeType: 'return',
    points: [{ x: m(8.86), y: m(6) }, { x: m(8.86), y: m(6.8) }],
  };

  it('los dos montantes llevan UNA etiqueta, no dos encimadas', () => {
    const dxf = generarDXF({ ...proyecto, pipes: [montanteIda, montanteRet] });
    const rotulos = rotulosDelPlano(dxf).filter(t => t.texto.includes('MONTANTE'));
    expect(rotulos).toHaveLength(1);
  });

  it('el rótulo del montante es corto: no cruza el plano de lado a lado', () => {
    const dxf = generarDXF({ ...proyecto, pipes: [montanteIda, montanteRet] });
    const rotulo = rotulosDelPlano(dxf).find(t => t.texto.includes('MONTANTE'))!;
    const ancho = rotulo.texto.length * rotulo.altura * 0.6;
    expect(ancho).toBeLessThan(2.5);
    // Sigue diciendo el diámetro: sin eso no se sabe qué montante es
    expect(rotulo.texto).toContain('%%C25');
  });

  it('cada montante conserva su capa por diámetro y rama', () => {
    const dxf = generarDXF({ ...proyecto, pipes: [montanteIda, montanteRet] });
    expect(capas(dxf)).toContain('CT-PEX25-VERTICAL-IDA');
    expect(capas(dxf)).toContain('CT-PEX25-VERTICAL-RET');
  });
});
