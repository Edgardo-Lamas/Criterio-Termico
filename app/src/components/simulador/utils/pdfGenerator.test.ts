import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Radiator } from '../models/Radiator';
import type { Boiler } from '../models/Boiler';
import type { Room } from '../models/Room';
import type { CompanyInfo, ClientInfo } from '../store/companyStore';

// ---------- jsPDF de mentira: registra lo que el generador le pide ----------

interface Llamada { metodo: string; args: unknown[] }
const llamadas: Llamada[] = [];

vi.mock('jspdf', () => {
  const registrar = (metodo: string) => (...args: unknown[]) => {
    llamadas.push({ metodo, args });
    return undefined;
  };
  class jsPDFFalso {
    internal = { pageSize: { getWidth: () => 297, getHeight: () => 210 } };
    addPage = registrar('addPage');
    addImage = registrar('addImage');
    text = registrar('text');
    line = registrar('line');
    rect = registrar('rect');
    circle = registrar('circle');
    setFontSize = registrar('setFontSize');
    setFont = registrar('setFont');
    setTextColor = registrar('setTextColor');
    setDrawColor = registrar('setDrawColor');
    setFillColor = registrar('setFillColor');
    setLineWidth = registrar('setLineWidth');
    setLineDashPattern = registrar('setLineDashPattern');
    roundedRect = registrar('roundedRect');
    setPage = registrar('setPage');
    getNumberOfPages = () => 1;
    splitTextToSize = (t: string) => [t];
    getTextWidth = () => 10;
    output = () => ({ size: 1 });
    save = registrar('save');
  }
  return { default: jsPDFFalso };
});

// El navegador que el generador usa para bajar el archivo
const descargas: string[] = [];
beforeEach(() => {
  llamadas.length = 0;
  descargas.length = 0;
  const link = {
    set download(nombre: string) { descargas.push(nombre); },
    get download() { return descargas[descargas.length - 1] ?? ''; },
    href: '', click: () => {},
  };
  vi.stubGlobal('document', {
    createElement: () => link,
    body: { appendChild: () => {}, removeChild: () => {} },
  });
  vi.stubGlobal('URL', { createObjectURL: () => 'blob:x', revokeObjectURL: () => {} });
});

const { generateFloorPlanPDF, generateQuotePDF } = await import('./pdfGenerator');

// ---------- Datos ----------

const P = 50; // px por metro
const empresa = { companyName: 'Instalador', phone: '' } as CompanyInfo;
const cliente = { projectName: 'Casa dos plantas', name: 'Cliente' } as ClientInfo;

const plano = (floor: 'ground' | 'first') => ({
  floor,
  image: `data:image/png;base64,${floor}`,
  dimensions: { width: 800, height: 600 },
  offset: { x: 0, y: 0 },
});

const radiador = (id: string, floor: 'ground' | 'first'): Radiator => ({
  id, type: 'radiator', x: 2 * P, y: 2 * P, width: 1.2 * P, height: 0.2 * P,
  power: 1500, floor,
});
const caldera: Boiler = {
  id: 'b1', type: 'boiler', x: 5 * P, y: 5 * P, width: 0.6 * P, height: 0.4 * P,
  power: 24000, floor: 'ground',
};
const ambiente: Room = {
  id: 'r1', name: 'Living', area: 20, height: 2.6, thermalFactor: 50,
  hasExteriorWall: true, windowsLevel: 'normales', radiatorIds: ['rad1'], floor: 'ground',
};

describe('plano técnico — las dos plantas son una obra, no dos proyectos', () => {
  it('saca una hoja por planta, cada una con SU plano de fondo', () => {
    generateFloorPlanPDF(
      [plano('ground'), plano('first')],
      [radiador('rad1', 'ground'), radiador('rad2', 'first')],
      [], [caldera], [ambiente], empresa, cliente
    );
    // Una sola página nueva: la segunda planta (la primera ya existe)
    expect(llamadas.filter(l => l.metodo === 'addPage')).toHaveLength(1);
    // Y cada hoja con la imagen de SU planta
    const imagenes = llamadas
      .filter(l => l.metodo === 'addImage')
      .map(l => String(l.args[0]));
    expect(imagenes).toEqual([
      'data:image/png;base64,ground',
      'data:image/png;base64,first',
    ]);
    // Un solo archivo
    expect(descargas).toHaveLength(1);
  });

  it('numera las hojas cuando hay más de una, y no cuando hay una sola', () => {
    generateFloorPlanPDF(
      [plano('ground'), plano('first')],
      [radiador('rad1', 'ground')], [], [caldera], [ambiente], empresa, cliente
    );
    const titulos = llamadas
      .filter(l => l.metodo === 'text' && String(l.args[0]).startsWith('PLANO TÉCNICO'))
      .map(l => String(l.args[0]));
    expect(titulos).toEqual([
      'PLANO TÉCNICO — PLANTA BAJA  ·  hoja 1 de 2',
      'PLANO TÉCNICO — PRIMER PISO  ·  hoja 2 de 2',
    ]);

    llamadas.length = 0;
    generateFloorPlanPDF(
      [plano('ground')], [radiador('rad1', 'ground')], [], [caldera], [ambiente], empresa, cliente
    );
    const soloUna = llamadas
      .filter(l => l.metodo === 'text' && String(l.args[0]).startsWith('PLANO TÉCNICO'))
      .map(l => String(l.args[0]));
    expect(soloUna).toEqual(['PLANO TÉCNICO — PLANTA BAJA']);
  });

  it('cada hoja lleva sólo los radiadores de su planta', () => {
    generateFloorPlanPDF(
      [plano('ground'), plano('first')],
      [radiador('rad1', 'ground'), radiador('rad2', 'first'), radiador('rad3', 'first')],
      [], [caldera], [ambiente], empresa, cliente
    );
    // La planilla de cada hoja: PB con R1, PA con R2 y R3
    const filas = llamadas
      .filter(l => l.metodo === 'text' && /^R\d$/.test(String(l.args[0])))
      .map(l => String(l.args[0]));
    expect(filas.filter(f => f === 'R1').length).toBeGreaterThan(0);
    expect(filas.filter(f => f === 'R2').length).toBeGreaterThan(0);
  });

  it('sin plantas con plano cargado no genera nada', () => {
    generateFloorPlanPDF([], [radiador('rad1', 'ground')], [], [caldera], [ambiente], empresa, cliente);
    expect(llamadas).toHaveLength(0);
    expect(descargas).toHaveLength(0);
  });
});

describe('presupuesto — el plano que lleva adentro', () => {
  // El canvas del simulador: sólo puede mostrar la planta que se está viendo
  const canvasFalso = {
    width: 800, height: 600,
    toDataURL: () => 'data:image/png;base64,CAPTURA-DE-LA-PLANTA-VISIBLE',
  } as unknown as HTMLCanvasElement;

  it('con plano cargado dibuja una hoja por planta y NO usa la captura del canvas', () => {
    generateQuotePDF(
      canvasFalso, [ambiente], [radiador('rad1', 'ground'), radiador('rad2', 'first')],
      empresa, cliente, [], null, null, null, [], undefined,
      [plano('ground'), plano('first')], [caldera]
    );
    const imagenes = llamadas.filter(l => l.metodo === 'addImage').map(l => String(l.args[0]));
    // La captura del canvas no entra: mostraría una sola planta
    expect(imagenes).not.toContain('data:image/png;base64,CAPTURA-DE-LA-PLANTA-VISIBLE');
    // Y sí entran las dos plantas dibujadas
    expect(imagenes).toContain('data:image/png;base64,ground');
    expect(imagenes).toContain('data:image/png;base64,first');
    // Cada hoja de plano es una página apaisada agregada al final
    const apaisadas = llamadas.filter(
      l => l.metodo === 'addPage' && String(l.args[1]) === 'landscape'
    );
    expect(apaisadas).toHaveLength(2);
  });

  it('sin plano de fondo cargado sigue llevando la captura del canvas', () => {
    generateQuotePDF(
      canvasFalso, [ambiente], [radiador('rad1', 'ground')],
      empresa, cliente, [], null, null, null, [], undefined, [], []
    );
    const imagenes = llamadas.filter(l => l.metodo === 'addImage').map(l => String(l.args[0]));
    expect(imagenes).toContain('data:image/png;base64,CAPTURA-DE-LA-PLANTA-VISIBLE');
    expect(llamadas.filter(l => l.metodo === 'addPage' && String(l.args[1]) === 'landscape')).toHaveLength(0);
  });
});
