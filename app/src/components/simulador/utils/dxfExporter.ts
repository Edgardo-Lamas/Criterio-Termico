/**
 * Exportador DXF del Simulador 2D — el plano que se entrega, para abrir en
 * AutoCAD.
 *
 * Es el ÚNICO formato de exportación del plano. Hubo un exportador IFC y se
 * eliminó el 2026-09-10: el IFC es un modelo BIM, necesita Revit o ArchiCAD
 * para abrirse y AutoCAD LT no lo importa.
 *
 * 🔑 **No es «el archivo para el arquitecto».** Lo abren también el ingeniero y
 * el maestro mayor de obras, y el dueño de la propiedad puede manejar AutoCAD:
 * una herramienta que sirve a muchos no se reduce a un nicho. Lo que necesita
 * cualquiera de ellos es la planta con las cañerías dibujadas encima de la
 * suya, medida y con el despiece. Eso es un DXF.
 *
 * Qué sale (todo lo que hoy se calcula y se dibuja en pantalla):
 * - Ambientes con su nombre y su pérdida
 * - Caldera y radiadores, con la identificación de la planilla (R1, R2…)
 * - Cañerías de ida y de retorno, con el diámetro de cada tramo
 * - COLECTORES de piso radiante
 * - CIRCUITOS de piso radiante: serpentín, acometidas y etiqueta (C2.1)
 * - Primaria caldera↔colector (Ø32)
 * - Planilla de radiadores y planilla de circuitos, al costado del dibujo
 *
 * 🔴 EL DIBUJO VA EN METROS, con `$INSUNITS = 6`. No se escala a mano en
 * ningún lado: AutoCAD sabe que la unidad es el metro y hace la conversión él
 * cuando el archivo se inserta en un plano en centímetros o en milímetros.
 * Todo lo que se agregue acá se mide en píxeles del canvas y se convierte con
 * `aMetros()` / `punto()`. Nunca escribir una escala a mano.
 *
 * 🔴 EL EJE Y SE DA VUELTA. En el canvas Y crece hacia ABAJO; en AutoCAD crece
 * hacia ARRIBA. Sin el espejo, el plano sale invertido de arriba a abajo y
 * nadie lo nota hasta que está en obra.
 *
 * Versión del formato: AC1015 (AutoCAD 2000). Es la más vieja que admite
 * `$INSUNITS` y `LWPOLYLINE`, y la abre cualquier AutoCAD de 2000 en adelante,
 * LT incluido, más BricsCAD, DraftSight, LibreCAD y QCAD.
 */

import type { Boiler } from '../models/Boiler';
import type { PipeSegment } from '../models/PipeSegment';
import type { Radiator } from '../models/Radiator';
import type { Manifold } from '../models/Manifold';
import type { FloorHeatingZone } from '../models/FloorHeatingZone';
import type { Room } from '../models/Room';
import {
  PIXELS_PER_METER,
  TEMP_IMPULSION_DEFAULT,
  calcularCircuitosPlanta,
  calcularMontantes,
  MONTANTE_DIAMETRO_MM,
} from './floorHeating';
import type { CanvasPoint, FloorHeatingCircuit, Montante, TempImpulsion } from './floorHeating';
import { etiquetasRadiadores, planillaRadiadores, ALTURA_ASUMIDA_MM, KCALH_ELEMENTO_ASUMIDO } from './planilla';
import type { FilaPlanilla } from './planilla';
import { calcularPresupuestoPisoRadiante } from './floorHeatingBudget';
import { calculateRoomPower } from './thermalCalculator';

// ============================================================
// UNIDADES Y GEOMETRÍA
// ============================================================

/** Píxeles del canvas → metros. Sale de la MISMA constante que el resto. */
function aMetros(px: number): number {
  return px / PIXELS_PER_METER;
}

type Planta = 'ground' | 'first';

/** Prefijo de capa por planta, como se nombra en obra. */
const SIGLA: Record<Planta, string> = { ground: 'PB', first: 'PA' };
const NOMBRE_PLANTA: Record<Planta, string> = { ground: 'PLANTA BAJA', first: 'PLANTA ALTA' };

/**
 * Traslada y espeja: del canvas (Y hacia abajo, origen arbitrario) al dibujo
 * (Y hacia arriba, origen en 0,0). `dx` corre la planta alta al costado.
 */
interface Marco {
  minX: number;   // px
  maxY: number;   // px
  dx: number;     // metros, desplazamiento horizontal de la planta
}

function punto(p: CanvasPoint, marco: Marco): [number, number] {
  return [aMetros(p.x - marco.minX) + marco.dx, aMetros(marco.maxY - p.y)];
}

// Separación entre las dos plantas cuando van una al lado de la otra
const SEPARACION_PLANTAS_M = 3;

// Alturas de texto, en metros del modelo. A 1:50 la etiqueta imprime 4,4 mm.
const H_ETIQUETA = 0.22;
const H_AMBIENTE = 0.28;
const H_TITULO = 0.6;
const H_PLANILLA = 0.25;

// ============================================================
// CAPAS
// ============================================================

// Colores ACI: 1 rojo · 2 amarillo · 3 verde · 4 cian · 5 azul · 6 magenta
// · 7 negro/blanco · 8 gris · 9 gris claro · 30 naranja
interface DefCapa {
  color: number;
  linetype?: 'CONTINUOUS' | 'DASHED';
  /** Espesor en centésimas de mm (grupo 370). -3 = por defecto. */
  lineweight?: number;
}

// Sufijos de capa por sistema. El nombre final es CT-<PB|PA>-<sufijo>.
const CAPAS: Record<string, DefCapa> = {
  'AMBIENTES': { color: 8, lineweight: 13 },
  'AMBIENTES-TXT': { color: 8 },
  'CALDERA': { color: 30, lineweight: 50 },
  'RADIADORES': { color: 6, lineweight: 35 },
  'COLECTORES': { color: 3, lineweight: 50 },
  'PISO-ZONAS': { color: 9, linetype: 'DASHED', lineweight: 13 },
  'ETIQUETAS': { color: 7 },
};

// 🔴 Las cañerías NO van en una capa fija: van en UNA CAPA POR MATERIAL Y
// DIÁMETRO —`CT-PB-PEX20-IDA`—, que es lo que permite sacar los metros de cada
// tubo seleccionando la capa. Con una sola capa de cañería habría que medir
// tramo por tramo, y en AutoCAD LT no existe DATAEXTRACTION para hacerlo de
// otro modo.
const COLOR_IDA = 1;      // rojo
const COLOR_RETORNO = 5;  // azul

/** Nombre corto del material para la capa. Hoy el simulador es sólo PE-X. */
function materialCorto(material: string): string {
  const m = (material || '').toLowerCase();
  if (m.includes('pex') || m.includes('pe-x')) return 'PEX';
  if (m.includes('cobre') || m.includes('copper')) return 'COBRE';
  if (m.includes('multicapa')) return 'MULTICAPA';
  return material.toUpperCase().replace(/[^A-Z0-9]/g, '') || 'TUBO';
}

// Capas que no dependen de la planta
const CAPAS_GENERALES: Record<string, DefCapa> = {
  'CT-VERTICALES': { color: 4, lineweight: 35 },
  'CT-ROTULO': { color: 7 },
  'CT-PLANILLA': { color: 7 },
};

function capa(planta: Planta, sufijo: keyof typeof CAPAS): string {
  return `CT-${SIGLA[planta]}-${sufijo}`;
}

// ============================================================
// ESCRITURA DEL ARCHIVO
// ============================================================

/** Un par código/valor del DXF. */
function par(codigo: number, valor: string | number): string {
  return `${codigo}\n${valor}\n`;
}

/** Coordenadas: siempre con punto decimal y sin notación exponencial. */
function coord(n: number): string {
  return Number.isFinite(n) ? n.toFixed(4) : '0.0000';
}

/**
 * El DXF de esta versión NO es UTF-8: es ANSI_1252, como declara el header.
 *
 * 🔴 El símbolo de diámetro y el de grado se escriben con los códigos de
 * control de AutoCAD —`%%C` y `%%D`—, no con el carácter. Es la forma que
 * entiende cualquier AutoCAD desde hace treinta años, y evita que el plano
 * llegue con "\U+00D820" escrito donde tiene que decir Ø20: el escape
 * `\U+XXXX` sólo lo interpretan algunos visores, y descubrirlo en la obra ya
 * es tarde.
 *
 * Lo que no entra en ANSI_1252 (comillas tipográficas, rayas largas, emojis)
 * se cambia por su equivalente ASCII. Los acentos y la ñ SÍ entran y van tal
 * cual: el archivo se escribe byte a byte en esa codificación.
 */
const REEMPLAZOS: Array<[RegExp, string]> = [
  [/[ØøΦϕ⌀]/g, '%%C'],
  [/°/g, '%%D'],
  [/±/g, '%%P'],
  [/[—–]/g, '-'],
  [/[“”„]/g, '"'],
  [/[‘’‚]/g, "'"],
  [/…/g, '...'],
  [/\u00a0/g, ' '],
];

function textoDXF(s: string): string {
  let salida = s;
  for (const [re, rep] of REEMPLAZOS) salida = salida.replace(re, rep);
  // Los saltos de línea van como entidades TEXT separadas, no dentro del texto
  salida = salida.replace(/\r?\n/g, ' ');
  // Lo que quede fuera de ANSI_1252 no se puede escribir en este archivo
  return [...salida].map(ch => ((ch.codePointAt(0) ?? 63) < 256 ? ch : '?')).join('');
}

// Handles fijos del andamiaje (tablas y bloques). Las entidades arrancan en
// 0x200 para no pisarlos.
const H = {
  BLOCK_RECORD_TABLE: '1',
  LAYER_TABLE: '2',
  STYLE_TABLE: '3',
  LTYPE_TABLE: '5',
  VIEW_TABLE: '6',
  UCS_TABLE: '7',
  VPORT_TABLE: '8',
  APPID_TABLE: '9',
  DIMSTYLE_TABLE: 'A',
  DICT_ROOT: 'C',
  DICT_GROUP: 'D',
  DICT_MLINESTYLE: 'E',
  DICT_LAYOUTS: 'F',
  MODEL_SPACE_RECORD: '1F',
  PAPER_SPACE_RECORD: '1E',
  MODEL_SPACE_BLOCK: '20',
  MODEL_SPACE_ENDBLK: '21',
  PAPER_SPACE_BLOCK: '22',
  PAPER_SPACE_ENDBLK: '23',
} as const;

/**
 * Bloques con atributos para caldera, radiadores y colectores.
 *
 * 🔴 Son bloques, y no rectángulos sueltos, para poder sacar la planilla con
 * `ATTEXT` —lo único que tiene AutoCAD LT, que no trae `DATAEXTRACTION`— y
 * para que cada aparato se seleccione como un objeto.
 * Los atributos van INVISIBLES: los datos ya están escritos en las planillas
 * dibujadas, y encima del plano sólo va la identificación.
 *
 * La geometría se define en un cuadrado de 1 × 1 sobre la capa 0 (así hereda
 * la capa del INSERT) y cada INSERT la escala a la medida real del aparato.
 */
interface DefBloque {
  record: string;
  block: string;
  endblk: string;
  atributos: string[];
  /** Geometría unitaria: líneas y polilíneas en coordenadas 0..1 */
  dibujo: (linea: (a: [number, number], b: [number, number]) => string, poli: (pts: [number, number][]) => string) => string;
}

const BLOQUES: Record<'CT_RADIADOR' | 'CT_CALDERA' | 'CT_COLECTOR', DefBloque> = {
  CT_RADIADOR: {
    record: '30', block: '31', endblk: '32',
    atributos: ['ID', 'AMBIENTE', 'ELEMENTOS', 'ALTURA_MM', 'COMPOSICION', 'POTENCIA_KCALH'],
    dibujo: (linea, poli) =>
      poli([[0, 0], [1, 0], [1, 1], [0, 1]])
      + linea([0.25, 0], [0.25, 1]) + linea([0.5, 0], [0.5, 1]) + linea([0.75, 0], [0.75, 1]),
  },
  CT_CALDERA: {
    record: '33', block: '34', endblk: '35',
    atributos: ['ID', 'POTENCIA_KCALH'],
    dibujo: (linea, poli) =>
      poli([[0, 0], [1, 0], [1, 1], [0, 1]])
      + linea([0, 0], [1, 1]) + linea([0, 1], [1, 0]),
  },
  CT_COLECTOR: {
    record: '36', block: '37', endblk: '38',
    atributos: ['ID', 'CIRCUITOS', 'VIAS'],
    dibujo: (linea, poli) =>
      poli([[0, 0], [1, 0], [1, 1], [0, 1]]) + linea([0, 0.5], [1, 0.5]),
  },
};

type NombreBloque = keyof typeof BLOQUES;

class DXFBuilder {
  private siguienteHandle = 0x200;
  private entidades: string[] = [];
  private capasUsadas = new Map<string, DefCapa>();
  private bloquesUsados = new Set<NombreBloque>();
  private min: { x: number; y: number } = { x: Infinity, y: Infinity };
  private max: { x: number; y: number } = { x: -Infinity, y: -Infinity };

  private handle(): string {
    return (this.siguienteHandle++).toString(16).toUpperCase();
  }

  /** Registra la capa la primera vez que se dibuja algo en ella. */
  usarCapa(nombre: string, def: DefCapa): void {
    if (!this.capasUsadas.has(nombre)) this.capasUsadas.set(nombre, def);
  }

  private extender(x: number, y: number): void {
    if (x < this.min.x) this.min.x = x;
    if (y < this.min.y) this.min.y = y;
    if (x > this.max.x) this.max.x = x;
    if (y > this.max.y) this.max.y = y;
  }

  private cabecera(tipo: string, capaNombre: string, subclase: string): string {
    return par(0, tipo)
      + par(5, this.handle())
      + par(330, H.MODEL_SPACE_RECORD)
      + par(100, 'AcDbEntity')
      + par(8, capaNombre)
      + par(100, subclase);
  }

  linea(capaNombre: string, a: [number, number], b: [number, number]): void {
    this.extender(a[0], a[1]);
    this.extender(b[0], b[1]);
    this.entidades.push(
      this.cabecera('LINE', capaNombre, 'AcDbLine')
      + par(10, coord(a[0])) + par(20, coord(a[1])) + par(30, '0.0')
      + par(11, coord(b[0])) + par(21, coord(b[1])) + par(31, '0.0')
    );
  }

  polilinea(capaNombre: string, pts: [number, number][], cerrada = false): void {
    if (pts.length < 2) return;
    let cuerpo = this.cabecera('LWPOLYLINE', capaNombre, 'AcDbPolyline')
      + par(90, pts.length)
      + par(70, cerrada ? 1 : 0);
    for (const [x, y] of pts) {
      this.extender(x, y);
      cuerpo += par(10, coord(x)) + par(20, coord(y));
    }
    this.entidades.push(cuerpo);
  }

  rectangulo(capaNombre: string, x: number, y: number, ancho: number, alto: number): void {
    this.polilinea(capaNombre, [
      [x, y],
      [x + ancho, y],
      [x + ancho, y + alto],
      [x, y + alto],
    ], true);
  }

  /**
   * Texto de una línea. `centrado` lo ancla al medio, para rótulos.
   * `rotacion` va en grados y gira alrededor del punto de anclaje: es lo que
   * permite escribir el diámetro siguiendo la dirección del caño.
   */
  texto(
    capaNombre: string,
    contenido: string,
    x: number,
    y: number,
    altura: number,
    centrado = false,
    rotacion = 0
  ): void {
    if (!contenido) return;
    this.extender(x, y);
    this.extender(x + contenido.length * altura * 0.6, y + altura);
    let cuerpo = this.cabecera('TEXT', capaNombre, 'AcDbText')
      + par(10, coord(x)) + par(20, coord(y)) + par(30, '0.0')
      + par(40, coord(altura))
      + par(1, textoDXF(contenido))
      + par(7, 'STANDARD');
    if (rotacion) cuerpo += par(50, coord(rotacion));
    if (centrado) {
      // 72 = 1 (centrado horizontal): el punto de anclaje pasa a ser el 11/21
      cuerpo += par(72, 1)
        + par(11, coord(x)) + par(21, coord(y)) + par(31, '0.0');
    }
    this.entidades.push(cuerpo + par(100, 'AcDbText') + par(73, 0));
  }

  /**
   * Coloca un bloque escalado a la medida real del aparato, con sus atributos.
   * `x`/`y` es la esquina de abajo a la izquierda.
   */
  insertar(
    capaNombre: string,
    bloque: NombreBloque,
    x: number,
    y: number,
    ancho: number,
    alto: number,
    valores: Record<string, string>
  ): void {
    this.bloquesUsados.add(bloque);
    this.extender(x, y);
    this.extender(x + ancho, y + alto);
    const handleInsert = this.handle();
    let cuerpo = par(0, 'INSERT')
      + par(5, handleInsert)
      + par(330, H.MODEL_SPACE_RECORD)
      + par(100, 'AcDbEntity')
      + par(8, capaNombre)
      + par(100, 'AcDbBlockReference')
      + par(66, 1) // sigue al menos un atributo
      + par(2, bloque)
      + par(10, coord(x)) + par(20, coord(y)) + par(30, '0.0')
      + par(41, coord(Math.max(ancho, 0.01)))
      + par(42, coord(Math.max(alto, 0.01)))
      + par(43, '1.0');
    for (const tag of BLOQUES[bloque].atributos) {
      cuerpo += par(0, 'ATTRIB')
        + par(5, this.handle())
        + par(330, handleInsert)
        + par(100, 'AcDbEntity')
        + par(8, capaNombre)
        + par(100, 'AcDbText')
        + par(10, coord(x)) + par(20, coord(y)) + par(30, '0.0')
        + par(40, coord(H_ETIQUETA))
        + par(1, textoDXF(valores[tag] ?? '-'))
        + par(100, 'AcDbAttribute')
        + par(2, tag)
        + par(70, 1); // 1 = invisible
    }
    this.entidades.push(
      cuerpo + par(0, 'SEQEND') + par(5, this.handle()) + par(330, handleInsert)
      + par(100, 'AcDbEntity') + par(8, capaNombre)
    );
  }

  circulo(capaNombre: string, x: number, y: number, radio: number): void {
    this.extender(x - radio, y - radio);
    this.extender(x + radio, y + radio);
    this.entidades.push(
      this.cabecera('CIRCLE', capaNombre, 'AcDbCircle')
      + par(10, coord(x)) + par(20, coord(y)) + par(30, '0.0')
      + par(40, coord(radio))
    );
  }

  /**
   * Caja que ocupa lo dibujado hasta ahora.
   *
   * 🔴 Devuelve COPIAS. Cuando devolvía los objetos internos, quien guardaba
   * `min` para colocar varios textos veía cómo se le movía debajo —el primer
   * texto agrandaba la caja— y los rótulos de las dos plantas terminaban a
   * distinta altura.
   */
  /** Capas que realmente se usaron, en el orden en que se fueron creando. */
  get capas(): string[] {
    return [...this.capasUsadas.keys()];
  }

  get limites(): { min: { x: number; y: number }; max: { x: number; y: number } } {
    if (!Number.isFinite(this.min.x)) return { min: { x: 0, y: 0 }, max: { x: 1, y: 1 } };
    return { min: { ...this.min }, max: { ...this.max } };
  }

  // ---------- Secciones del archivo ----------

  private seccionHeader(): string {
    const { min, max } = this.limites;
    return par(0, 'SECTION') + par(2, 'HEADER')
      + par(9, '$ACADVER') + par(1, 'AC1015')
      + par(9, '$DWGCODEPAGE') + par(3, 'ANSI_1252')
      // 6 = metros. Es lo que hace que AutoCAD escale solo al insertar.
      + par(9, '$INSUNITS') + par(70, 6)
      // 1 = sistema métrico (elige los patrones de línea métricos)
      + par(9, '$MEASUREMENT') + par(70, 1)
      + par(9, '$EXTMIN') + par(10, coord(min.x)) + par(20, coord(min.y)) + par(30, '0.0')
      + par(9, '$EXTMAX') + par(10, coord(max.x)) + par(20, coord(max.y)) + par(30, '0.0')
      + par(9, '$LIMMIN') + par(10, coord(min.x)) + par(20, coord(min.y))
      + par(9, '$LIMMAX') + par(10, coord(max.x)) + par(20, coord(max.y))
      // Patrón de línea a media unidad: en metros, un guión de 50 cm
      + par(9, '$LTSCALE') + par(40, '0.5')
      + par(9, '$PDMODE') + par(70, 0)
      + par(9, '$HANDSEED') + par(5, this.siguienteHandle.toString(16).toUpperCase())
      + par(0, 'ENDSEC');
  }

  private tablaLtype(): string {
    const entrada = (
      nombre: string, handle: string, descripcion: string, patron: number[]
    ): string => {
      let s = par(0, 'LTYPE') + par(5, handle) + par(330, H.LTYPE_TABLE)
        + par(100, 'AcDbSymbolTableRecord') + par(100, 'AcDbLinetypeTableRecord')
        + par(2, nombre) + par(70, 0) + par(3, descripcion) + par(72, 65)
        + par(73, patron.length)
        + par(40, coord(patron.reduce((acc, n) => acc + Math.abs(n), 0)));
      for (const t of patron) s += par(49, coord(t)) + par(74, 0);
      return s;
    };
    return par(0, 'TABLE') + par(2, 'LTYPE') + par(5, H.LTYPE_TABLE)
      + par(100, 'AcDbSymbolTable') + par(70, 3)
      + entrada('BYBLOCK', '14', '', [])
      + entrada('BYLAYER', '15', '', [])
      + entrada('CONTINUOUS', '16', 'Solid line', [])
      + entrada('DASHED', '17', 'Dashed __ __ __ __ __ __ __ __ __ __', [0.5, -0.25])
      + par(0, 'ENDTAB');
  }

  private tablaLayer(): string {
    let s = par(0, 'TABLE') + par(2, 'LAYER') + par(5, H.LAYER_TABLE)
      + par(100, 'AcDbSymbolTable') + par(70, this.capasUsadas.size + 1);
    const entrada = (nombre: string, def: DefCapa, handle: string): string =>
      par(0, 'LAYER') + par(5, handle) + par(330, H.LAYER_TABLE)
      + par(100, 'AcDbSymbolTableRecord') + par(100, 'AcDbLayerTableRecord')
      + par(2, nombre) + par(70, 0) + par(62, def.color)
      + par(6, def.linetype ?? 'CONTINUOUS')
      + par(370, def.lineweight ?? -3)
      + par(390, 'F');
    s += entrada('0', { color: 7 }, '18');
    for (const [nombre, def] of this.capasUsadas) {
      s += entrada(nombre, def, this.handle());
    }
    return s + par(0, 'ENDTAB');
  }

  private seccionTables(): string {
    const tablaVacia = (nombre: string, handle: string): string =>
      par(0, 'TABLE') + par(2, nombre) + par(5, handle)
      + par(100, 'AcDbSymbolTable') + par(70, 0) + par(0, 'ENDTAB');

    return par(0, 'SECTION') + par(2, 'TABLES')
      + tablaVacia('VPORT', H.VPORT_TABLE)
      + this.tablaLtype()
      + this.tablaLayer()
      // Estilo de texto STANDARD, sin altura fija (la pone cada TEXT)
      + par(0, 'TABLE') + par(2, 'STYLE') + par(5, H.STYLE_TABLE)
      + par(100, 'AcDbSymbolTable') + par(70, 1)
      + par(0, 'STYLE') + par(5, '19') + par(330, H.STYLE_TABLE)
      + par(100, 'AcDbSymbolTableRecord') + par(100, 'AcDbTextStyleTableRecord')
      + par(2, 'STANDARD') + par(70, 0) + par(40, '0.0') + par(41, '1.0')
      + par(50, '0.0') + par(71, 0) + par(42, '0.2')
      + par(3, 'txt') + par(4, '')
      + par(0, 'ENDTAB')
      + tablaVacia('VIEW', H.VIEW_TABLE)
      + tablaVacia('UCS', H.UCS_TABLE)
      + par(0, 'TABLE') + par(2, 'APPID') + par(5, H.APPID_TABLE)
      + par(100, 'AcDbSymbolTable') + par(70, 1)
      + par(0, 'APPID') + par(5, '1A') + par(330, H.APPID_TABLE)
      + par(100, 'AcDbSymbolTableRecord') + par(100, 'AcDbRegAppTableRecord')
      + par(2, 'ACAD') + par(70, 0)
      + par(0, 'ENDTAB')
      + tablaVacia('DIMSTYLE', H.DIMSTYLE_TABLE)
      + par(0, 'TABLE') + par(2, 'BLOCK_RECORD') + par(5, H.BLOCK_RECORD_TABLE)
      + par(100, 'AcDbSymbolTable') + par(70, 2 + this.bloquesUsados.size)
      + par(0, 'BLOCK_RECORD') + par(5, H.MODEL_SPACE_RECORD) + par(330, H.BLOCK_RECORD_TABLE)
      + par(100, 'AcDbSymbolTableRecord') + par(100, 'AcDbBlockTableRecord')
      + par(2, '*Model_Space') + par(70, 0)
      + par(0, 'BLOCK_RECORD') + par(5, H.PAPER_SPACE_RECORD) + par(330, H.BLOCK_RECORD_TABLE)
      + par(100, 'AcDbSymbolTableRecord') + par(100, 'AcDbBlockTableRecord')
      + par(2, '*Paper_Space') + par(70, 0)
      + [...this.bloquesUsados].map(nombre =>
          par(0, 'BLOCK_RECORD') + par(5, BLOQUES[nombre].record) + par(330, H.BLOCK_RECORD_TABLE)
          + par(100, 'AcDbSymbolTableRecord') + par(100, 'AcDbBlockTableRecord')
          + par(2, nombre) + par(70, 0)
        ).join('')
      + par(0, 'ENDTAB')
      + par(0, 'ENDSEC');
  }

  private seccionBlocks(): string {
    const bloque = (
      nombre: string, handleBloque: string, handleFin: string, record: string, papel: boolean
    ): string =>
      par(0, 'BLOCK') + par(5, handleBloque) + par(330, record)
      + par(100, 'AcDbEntity') + (papel ? par(67, 1) : '') + par(8, '0')
      + par(100, 'AcDbBlockBegin') + par(2, nombre) + par(70, 0)
      + par(10, '0.0') + par(20, '0.0') + par(30, '0.0')
      + par(3, nombre) + par(1, '')
      + par(0, 'ENDBLK') + par(5, handleFin) + par(330, record)
      + par(100, 'AcDbEntity') + (papel ? par(67, 1) : '') + par(8, '0')
      + par(100, 'AcDbBlockEnd');

    return par(0, 'SECTION') + par(2, 'BLOCKS')
      + bloque('*Model_Space', H.MODEL_SPACE_BLOCK, H.MODEL_SPACE_ENDBLK, H.MODEL_SPACE_RECORD, false)
      + bloque('*Paper_Space', H.PAPER_SPACE_BLOCK, H.PAPER_SPACE_ENDBLK, H.PAPER_SPACE_RECORD, true)
      + [...this.bloquesUsados].map(nombre => this.definicionBloque(nombre)).join('')
      + par(0, 'ENDSEC');
  }

  /** Definición de un bloque: geometría unitaria en la capa 0 + sus ATTDEF. */
  private definicionBloque(nombre: NombreBloque): string {
    const def = BLOQUES[nombre];
    const enBloque = (tipo: string, subclase: string): string =>
      par(0, tipo) + par(5, this.handle()) + par(330, def.record)
      + par(100, 'AcDbEntity') + par(8, '0') + par(100, subclase);

    const linea = (a: [number, number], b: [number, number]): string =>
      enBloque('LINE', 'AcDbLine')
      + par(10, coord(a[0])) + par(20, coord(a[1])) + par(30, '0.0')
      + par(11, coord(b[0])) + par(21, coord(b[1])) + par(31, '0.0');

    const poli = (pts: [number, number][]): string =>
      enBloque('LWPOLYLINE', 'AcDbPolyline') + par(90, pts.length) + par(70, 1)
      + pts.map(([x, y]) => par(10, coord(x)) + par(20, coord(y))).join('');

    // Los atributos van invisibles y en el origen del bloque: el dato viaja
    // con el aparato, pero lo que se lee en el plano son las planillas.
    const atributos = def.atributos.map(tag =>
      enBloque('ATTDEF', 'AcDbText')
      + par(10, '0.0') + par(20, '0.0') + par(30, '0.0')
      + par(40, coord(H_ETIQUETA))
      + par(1, '-')
      + par(100, 'AcDbAttributeDefinition')
      + par(3, tag)
      + par(2, tag)
      + par(70, 1)
    ).join('');

    return par(0, 'BLOCK') + par(5, def.block) + par(330, def.record)
      + par(100, 'AcDbEntity') + par(8, '0')
      + par(100, 'AcDbBlockBegin') + par(2, nombre) + par(70, 2) // 2 = tiene atributos
      + par(10, '0.0') + par(20, '0.0') + par(30, '0.0')
      + par(3, nombre) + par(1, '')
      + def.dibujo(linea, poli)
      + atributos
      + par(0, 'ENDBLK') + par(5, def.endblk) + par(330, def.record)
      + par(100, 'AcDbEntity') + par(8, '0') + par(100, 'AcDbBlockEnd');
  }

  private seccionObjects(): string {
    return par(0, 'SECTION') + par(2, 'OBJECTS')
      + par(0, 'DICTIONARY') + par(5, H.DICT_ROOT) + par(330, '0')
      + par(100, 'AcDbDictionary') + par(281, 1)
      + par(3, 'ACAD_GROUP') + par(350, H.DICT_GROUP)
      + par(3, 'ACAD_MLINESTYLE') + par(350, H.DICT_MLINESTYLE)
      + par(0, 'DICTIONARY') + par(5, H.DICT_GROUP) + par(330, H.DICT_ROOT)
      + par(100, 'AcDbDictionary') + par(281, 1)
      + par(0, 'DICTIONARY') + par(5, H.DICT_MLINESTYLE) + par(330, H.DICT_ROOT)
      + par(100, 'AcDbDictionary') + par(281, 1)
      + par(0, 'ENDSEC');
  }

  generar(): string {
    // El header lleva los límites y el $HANDSEED, así que se arma DESPUÉS de
    // que las tablas consumieron sus handles.
    const tables = this.seccionTables();
    const blocks = this.seccionBlocks();
    const entities = par(0, 'SECTION') + par(2, 'ENTITIES')
      + this.entidades.join('')
      + par(0, 'ENDSEC');
    return this.seccionHeader() + tables + blocks + entities + this.seccionObjects()
      + par(0, 'EOF');
  }
}

// ============================================================
// DIBUJO DEL PROYECTO
// ============================================================

export interface DXFExportData {
  projectName: string;
  boilers: Boiler[];
  radiators: Radiator[];
  pipes: PipeSegment[];
  rooms?: Room[];
  manifolds?: Manifold[];
  floorHeatingZones?: FloorHeatingZone[];
  tempImpulsionC?: TempImpulsion;
}

const PLANTAS: Planta[] = ['ground', 'first'];

/** Diámetro del tubo de los circuitos de piso radiante (PE-X 20). */
const DIAMETRO_PISO_MM = 20;

// Colector: las derivaciones van cada 5 cm (catálogo REHAU Argentina), así que
// el ancho real sale de la cantidad de vías. Alto: las dos barras, ida y
// retorno.
const DERIVACION_COLECTOR_M = 0.05;
const ALTO_COLECTOR_M = 0.10;

function plantaDe(e: { floor?: Planta | 'vertical' }): Planta {
  return e.floor === 'first' ? 'first' : 'ground';
}

// ============================================================
// ETIQUETAS DE DIÁMETRO SOBRE EL DIBUJO
// ============================================================

/**
 * 🔴 UNA etiqueta por par ida/retorno, girada como el caño. NO una por tramo.
 * Ida y retorno corren paralelos a 16-22 cm, y un «Ø16» de 0,22 de alto ocupa
 * 66 cm de ancho: con una etiqueta por caño se pisan entre sí. Probado en un
 * CAD sobre un proyecto real: 65 de 68 montadas y cuatro pares exactamente
 * encimados, o sea el plano ilegible. Es geometría, no cosa del visor: pasa
 * igual en AutoCAD.
 */

/** Hasta dónde se separan dos caños para tomarlos como el mismo par (m). */
const PAR_DISTANCIA_M = 0.9;
/** Cuánto se desalinean dos caños del mismo par (grados). */
const PAR_ANGULO_GRADOS = 12;

/** Un tramo de cañería esperando su rótulo. */
interface Rotulo {
  texto: string;
  medio: [number, number];
  /** Dirección del tramo en grados, ya normalizada a [-90, 90). */
  angulo: number;
}

/** Un texto colocado, con lo necesario para calcular el lugar que ocupa. */
interface TextoColocado {
  texto: string;
  x: number;
  y: number;
  angulo: number;
  altura: number;
  /** Anclado en el medio del texto (rótulos) o en su borde izquierdo. */
  centrado: boolean;
}

/**
 * Lugar del dibujo que ya está ocupado: `[x0, y0, x1, y1]`. Son los rótulos
 * que no se mueven Y TAMBIÉN los aparatos —radiador, caldera, colector—:
 * escribir un «Ø25» encima del símbolo de un radiador ensucia el plano igual
 * que escribirlo encima de otro texto.
 */
type Ocupado = [number, number, number, number];

/** Los textos no se leen cabeza abajo: el ángulo vive en [-90, 90). */
function anguloDeLectura(grados: number): number {
  let a = grados % 180;
  if (a >= 90) a -= 180;
  if (a < -90) a += 180;
  return a;
}

/**
 * Punto medio y dirección del segmento MÁS LARGO de la ruta. No del vértice
 * del medio: en un tramo con quiebres ese vértice cae justo en una esquina,
 * que es donde converge todo lo demás.
 */
function tramoPrincipal(ruta: [number, number][]): Omit<Rotulo, 'texto'> | null {
  let mayor = 0;
  let medio: [number, number] = [0, 0];
  let angulo = 0;
  for (let i = 1; i < ruta.length; i++) {
    const [x0, y0] = ruta[i - 1];
    const [x1, y1] = ruta[i];
    const largo = Math.hypot(x1 - x0, y1 - y0);
    if (largo <= mayor) continue;
    mayor = largo;
    medio = [(x0 + x1) / 2, (y0 + y1) / 2];
    angulo = anguloDeLectura((Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI);
  }
  return mayor > 0 ? { medio, angulo } : null;
}

/** Junta los tramos que dicen lo mismo, van paralelos y corren pegados. */
function agruparPares(rotulos: Rotulo[]): Rotulo[][] {
  const grupos: Rotulo[][] = [];
  for (const r of rotulos) {
    const grupo = grupos.find(g =>
      g[0].texto === r.texto
      && Math.abs(anguloDeLectura(g[0].angulo - r.angulo)) <= PAR_ANGULO_GRADOS
      && g.some(o => Math.hypot(o.medio[0] - r.medio[0], o.medio[1] - r.medio[1]) <= PAR_DISTANCIA_M)
    );
    if (grupo) grupo.push(r);
    else grupos.push([r]);
  }
  return grupos;
}

/** Caja que envuelve al texto girado, para saber si dos etiquetas se pisan. */
function cajaDeTexto(e: TextoColocado): Ocupado {
  const rad = (e.angulo * Math.PI) / 180;
  const ancho = e.texto.length * e.altura * 0.6;
  const alto = e.altura;
  // El anclaje está sobre la línea de base; a lo ancho, en el medio o a la
  // izquierda según cómo se escribió el texto.
  const avance = e.centrado ? 0 : ancho / 2;
  const cx = e.x + Math.cos(rad) * avance - Math.sin(rad) * (alto / 2);
  const cy = e.y + Math.sin(rad) * avance + Math.cos(rad) * (alto / 2);
  const mx = (ancho * Math.abs(Math.cos(rad)) + alto * Math.abs(Math.sin(rad))) / 2;
  const my = (ancho * Math.abs(Math.sin(rad)) + alto * Math.abs(Math.cos(rad))) / 2;
  return [cx - mx, cy - my, cx + mx, cy + my];
}

/**
 * Deja anotado un rótulo que ya está sobre el dibujo y no se mueve —el número
 * del radiador, la caldera, el colector, el circuito, el nombre del ambiente—
 * para que las etiquetas de diámetro, que sí se pueden correr, lo esquiven.
 */
function anotarEtiqueta(
  ocupados: Ocupado[],
  texto: string,
  x: number,
  y: number,
  altura: number,
  centrado: boolean
): void {
  if (texto) ocupados.push(cajaDeTexto({ texto, x, y, angulo: 0, altura, centrado }));
}

/** Deja anotado el rectángulo de un aparato, por su esquina de abajo. */
function anotarCaja(
  ocupados: Ocupado[],
  x: number,
  y: number,
  ancho: number,
  alto: number
): void {
  ocupados.push([x, y, x + ancho, y + alto]);
}

function sePisan(a: Ocupado, b: Ocupado, aire = 0): boolean {
  return a[0] - aire < b[2] && b[0] - aire < a[2]
    && a[1] - aire < b[3] && b[1] - aire < a[3];
}

/**
 * Dibuja una etiqueta por grupo, corrida al costado del haz de caños —no en el
 * medio, que ahí está el caño— y girada siguiendo su dirección. Si ninguna de
 * las cuatro posiciones queda libre, la etiqueta NO se dibuja: el diámetro se
 * lee igual por el nombre de la capa y en el despiece, y una etiqueta pisada
 * ensucia el plano sin agregar nada.
 */
function dibujarEtiquetasDeDiametro(
  b: DXFBuilder,
  capaNombre: string,
  rotulos: Rotulo[],
  ocupados: Ocupado[],
  altura = H_ETIQUETA
): void {
  for (const grupo of agruparPares(rotulos)) {
    const angulo = grupo[0].angulo;
    const rad = (angulo * Math.PI) / 180;
    const nor: [number, number] = [-Math.sin(rad), Math.cos(rad)];
    const cx = grupo.reduce((a, r) => a + r.medio[0], 0) / grupo.length;
    const cy = grupo.reduce((a, r) => a + r.medio[1], 0) / grupo.length;
    // Cuánto se abre el haz hacia el costado: el texto arranca más allá del
    // caño más lejano del grupo, no en el eje del par.
    const abertura = Math.max(
      ...grupo.map(r => Math.abs((r.medio[0] - cx) * nor[0] + (r.medio[1] - cy) * nor[1]))
    );
    const base = abertura + altura * 0.5;
    const intentos = [base, -(base + altura), base + altura * 1.6, -(base + altura * 2.6)];
    for (const off of intentos) {
      const candidata: TextoColocado = {
        texto: grupo[0].texto,
        x: cx + nor[0] * off,
        y: cy + nor[1] * off,
        angulo,
        altura,
        centrado: true,
      };
      const caja = cajaDeTexto(candidata);
      if (ocupados.some(o => sePisan(o, caja, altura * 0.15))) continue;
      ocupados.push(caja);
      b.texto(capaNombre, candidata.texto, candidata.x, candidata.y, altura, true, angulo);
      break;
    }
  }
}

/** Números como se leen en un plano argentino: 1.600 / 78,4 */
function numES(n: number, decimales = 0): string {
  return n.toLocaleString('es-AR', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  });
}

interface CircuitosPlanta {
  circuits: FloorHeatingCircuit[];
  montantes: Montante[];
}

/**
 * Circuitos y montantes de cada planta. Mismo filtrado que usa el Canvas para
 * dibujar y `floorHeatingBudget` para presupuestar: no se recalcula distinto
 * para el plano que para la lista de materiales.
 */
function circuitosPorPlanta(data: DXFExportData): Record<Planta, CircuitosPlanta> {
  const zones = data.floorHeatingZones ?? [];
  const manifolds = data.manifolds ?? [];
  const rooms = data.rooms ?? [];
  const temp = data.tempImpulsionC ?? TEMP_IMPULSION_DEFAULT;
  const salida = {} as Record<Planta, CircuitosPlanta>;
  for (const floor of PLANTAS) {
    const zonesFloor = zones.filter(z => plantaDe(z) === floor);
    const manifoldsFloor = manifolds.filter(m => plantaDe(m) === floor);
    const boilersFloor = data.boilers.filter(b => plantaDe(b) === floor);
    salida[floor] = {
      circuits: calcularCircuitosPlanta(zonesFloor, manifoldsFloor, temp, rooms),
      montantes: calcularMontantes(manifoldsFloor, boilersFloor, zonesFloor),
    };
  }
  return salida;
}

/** Caja que ocupa todo el proyecto en píxeles del canvas. */
function cajaEnPixeles(
  data: DXFExportData,
  circuitos: Record<Planta, CircuitosPlanta>
): { minX: number; minY: number; maxX: number; maxY: number } {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const meter = (x: number, y: number): void => {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  };
  const caja = (r: { x: number; y: number; width: number; height: number }): void => {
    meter(r.x, r.y);
    meter(r.x + r.width, r.y + r.height);
  };
  const ruta = (pts: CanvasPoint[]): void => pts.forEach(p => meter(p.x, p.y));

  data.boilers.forEach(caja);
  data.radiators.forEach(caja);
  (data.manifolds ?? []).forEach(caja);
  (data.floorHeatingZones ?? []).forEach(caja);
  (data.rooms ?? []).forEach(r => { if (r.bounds) caja(r.bounds); });
  data.pipes.forEach(p => ruta(p.points));
  for (const floor of PLANTAS) {
    for (const c of circuitos[floor].circuits) {
      ruta(c.ida); ruta(c.retorno); ruta(c.acometidaIda); ruta(c.acometidaRetorno);
      meter(c.labelPos.x, c.labelPos.y);
    }
    for (const m of circuitos[floor].montantes) {
      ruta(m.ida); ruta(m.retorno);
    }
  }
  if (!Number.isFinite(minX)) return { minX: 0, minY: 0, maxX: PIXELS_PER_METER, maxY: PIXELS_PER_METER };
  return { minX, minY, maxX, maxY };
}

function tieneContenido(data: DXFExportData, floor: Planta, circ: CircuitosPlanta): boolean {
  return data.boilers.some(b => plantaDe(b) === floor)
    || data.radiators.some(r => plantaDe(r) === floor)
    || data.pipes.some(p => p.floor !== 'vertical' && plantaDe(p as { floor?: Planta }) === floor)
    || (data.manifolds ?? []).some(m => plantaDe(m) === floor)
    || (data.floorHeatingZones ?? []).some(z => plantaDe(z) === floor)
    || (data.rooms ?? []).some(r => r.bounds && plantaDe(r) === floor)
    || circ.circuits.length > 0;
}

/** Dibuja una planta entera dentro de su marco. */
function dibujarPlanta(
  b: DXFBuilder,
  data: DXFExportData,
  floor: Planta,
  circ: CircuitosPlanta,
  marco: Marco,
  etiquetasRad: Map<string, string>,
  filas: Map<string, FilaPlanilla>,
  ocupados: Ocupado[]
): void {
  const cap = (sufijo: keyof typeof CAPAS): string => {
    const nombre = capa(floor, sufijo);
    b.usarCapa(nombre, CAPAS[sufijo]);
    return nombre;
  };
  const p = (pt: CanvasPoint): [number, number] => punto(pt, marco);
  const rutaM = (pts: CanvasPoint[]): [number, number][] => pts.map(p);
  /** Esquina de ABAJO a la izquierda en el dibujo (el canvas la da arriba). */
  const esquina = (
    r: { x: number; y: number; width: number; height: number }
  ): [number, number] => p({ x: r.x, y: r.y + r.height });
  /** Rectángulo del canvas (x,y = esquina superior izquierda) al dibujo. */
  const rect = (
    capaNombre: string,
    r: { x: number; y: number; width: number; height: number }
  ): void => {
    const [x, yTop] = p({ x: r.x, y: r.y });
    b.rectangulo(capaNombre, x, yTop - aMetros(r.height), aMetros(r.width), aMetros(r.height));
  };
  const centro = (
    r: { x: number; y: number; width: number; height: number }
  ): [number, number] => p({ x: r.x + r.width / 2, y: r.y + r.height / 2 });
  /** Capa de un tramo de cañería: CT-PB-PEX20-IDA, CT-PB-PEX32-PRIMARIA-RET… */
  const capTubo = (
    material: string,
    diametroMm: number,
    rama: 'IDA' | 'RET',
    sistema?: 'PISO' | 'PRIMARIA'
  ): string => {
    const partes = [`CT-${SIGLA[floor]}`, `${materialCorto(material)}${diametroMm}`];
    if (sistema) partes.push(sistema);
    partes.push(rama);
    const nombre = partes.join('-');
    b.usarCapa(nombre, {
      color: rama === 'IDA' ? COLOR_IDA : COLOR_RETORNO,
      lineweight: sistema === 'PRIMARIA' ? 50 : sistema === 'PISO' ? 25 : 35,
    });
    return nombre;
  };

  // --- Ambientes: contorno, nombre y pérdida ---
  const rooms = (data.rooms ?? []).filter(r => plantaDe(r) === floor && r.bounds);
  for (const room of rooms) {
    const bounds = room.bounds!;
    rect(cap('AMBIENTES'), bounds);
    const capTxt = cap('AMBIENTES-TXT');
    // Esquina de abajo a la izquierda, no en el medio: el medio y la franja de
    // arriba están ocupados por el serpentín y por las etiquetas de los
    // circuitos, y el nombre del ambiente queda ilegible debajo.
    const [x0, y0] = punto({ x: bounds.x, y: bounds.y + bounds.height }, marco);
    b.texto(capTxt, room.name.toUpperCase(), x0 + 0.15, y0 + 0.15 + H_ETIQUETA * 1.4, H_AMBIENTE);
    anotarEtiqueta(ocupados, room.name.toUpperCase(), x0 + 0.15, y0 + 0.15 + H_ETIQUETA * 1.4, H_AMBIENTE, false);
    const carga = `${numES(room.area, 1)} m² - ${numES(Math.round(calculateRoomPower(room)))} kcal/h`;
    b.texto(capTxt, carga, x0 + 0.15, y0 + 0.15, H_ETIQUETA);
    anotarEtiqueta(ocupados, carga, x0 + 0.15, y0 + 0.15, H_ETIQUETA, false);
  }

  // --- Zonas de piso radiante ---
  for (const zone of (data.floorHeatingZones ?? []).filter(z => plantaDe(z) === floor)) {
    rect(cap('PISO-ZONAS'), zone);
  }

  // --- Circuitos de piso radiante: serpentín, acometidas y etiqueta ---
  // Las capas se registran sólo si hay circuitos: si no, el archivo llega con
  // capas vacías que hay que ir apagando a mano.
  const capIda = circ.circuits.length > 0 ? capTubo('PE-X', DIAMETRO_PISO_MM, 'IDA', 'PISO') : '';
  const capRet = circ.circuits.length > 0 ? capTubo('PE-X', DIAMETRO_PISO_MM, 'RET', 'PISO') : '';
  for (const c of circ.circuits) {
    b.polilinea(capIda, rutaM(c.ida));
    b.polilinea(capRet, rutaM(c.retorno));
    b.polilinea(capIda, rutaM(c.acometidaIda));
    b.polilinea(capRet, rutaM(c.acometidaRetorno));
    // Igual que los radiadores: sobre el plano va sólo la identificación
    // ("C1.2"), y la longitud y el diámetro van en la planilla. Con los tres
    // datos encima, las etiquetas de dos circuitos vecinos se pisan.
    const [lx, ly] = p(c.labelPos);
    b.texto(cap('ETIQUETAS'), c.etiqueta, lx, ly, H_ETIQUETA);
    anotarEtiqueta(ocupados, c.etiqueta, lx, ly, H_ETIQUETA, false);
  }

  // --- Primaria caldera <-> colector (Ø32) ---
  // Sin etiqueta repetida sobre el dibujo: la primaria nace pegada a la
  // caldera y el texto se montaba con el de la caldera. Se identifica por su
  // capa (CT-xx-PRIMARIA) y el diámetro está en el rótulo.
  for (const m of circ.montantes) {
    b.polilinea(capTubo('PE-X', m.diametroMm, 'IDA', 'PRIMARIA'), rutaM(m.ida));
    b.polilinea(capTubo('PE-X', m.diametroMm, 'RET', 'PRIMARIA'), rutaM(m.retorno));
  }

  // --- Colectores ---
  // 🔴 Se dibuja a ESCALA REAL —ancho = vías × 5 cm, que es la derivación del
  // catálogo—, no al tamaño que se arrastró en pantalla: el plano tiene que
  // servir para ver si el colector entra en el nicho previsto en la obra.
  const manifolds = (data.manifolds ?? []).filter(m => plantaDe(m) === floor);
  manifolds.forEach((manifold, i) => {
    const vias = circ.circuits.filter(c => c.manifoldId === manifold.id).length;
    const salidas = Math.max(vias, 2);
    const ancho = salidas * DERIVACION_COLECTOR_M;
    const alto = ALTO_COLECTOR_M;
    const [cx, cy] = centro(manifold);
    const capCol = cap('COLECTORES');
    const x0 = cx - ancho / 2;
    const y0 = cy - alto / 2;
    b.insertar(capCol, 'CT_COLECTOR', x0, y0, ancho, alto, {
      ID: `COLECTOR ${i + 1}`,
      CIRCUITOS: String(vias),
      VIAS: String(salidas),
    });
    anotarCaja(ocupados, x0, y0, ancho, alto);
    // Una derivación por circuito (dependen de la cantidad: van sueltas)
    for (let v = 0; v < salidas; v++) {
      const xv = x0 + (v + 0.5) * DERIVACION_COLECTOR_M;
      b.linea(capCol, [xv, y0], [xv, y0 - DERIVACION_COLECTOR_M * 0.6]);
    }
    const rotuloCol = `COLECTOR ${i + 1}${vias > 0 ? ` (${vias} circuitos)` : ''}`;
    b.texto(cap('ETIQUETAS'), rotuloCol, cx, y0 + alto + H_ETIQUETA * 0.6, H_ETIQUETA, true);
    anotarEtiqueta(ocupados, rotuloCol, cx, y0 + alto + H_ETIQUETA * 0.6, H_ETIQUETA, true);
  });

  // --- Cañerías de radiadores ---
  // Los diámetros NO se rotulan acá: se juntan y se dibujan agrupados por par
  // ida/retorno más abajo. Con una etiqueta por caño se pisan entre sí.
  const rotulosDiametro: Rotulo[] = [];
  for (const pipe of data.pipes) {
    if (pipe.floor === 'vertical') continue;
    if (plantaDe(pipe as { floor?: Planta }) !== floor) continue;
    if (pipe.points.length < 2) continue;
    const capPipe = capTubo(
      pipe.material,
      pipe.diameter || 20,
      pipe.pipeType === 'return' ? 'RET' : 'IDA'
    );
    const ruta = rutaM(pipe.points);
    b.polilinea(capPipe, ruta);
    if (pipe.diameter > 0) {
      const tramo = tramoPrincipal(ruta);
      if (tramo) rotulosDiametro.push({ texto: `Ø${pipe.diameter}`, ...tramo });
    }
  }
  // --- Caldera ---
  const calderas = data.boilers.filter(x => plantaDe(x) === floor);
  calderas.forEach((boiler, i) => {
    const capCal = cap('CALDERA');
    const [cx, cy] = centro(boiler);
    const [x0, y0] = esquina(boiler);
    const ancho = aMetros(boiler.width);
    const alto = aMetros(boiler.height);
    // El bloque trae el rectángulo y las diagonales, que son la marca de
    // caldera que se lee de un vistazo en el plano.
    b.insertar(capCal, 'CT_CALDERA', x0, y0, ancho, alto, {
      ID: calderas.length > 1 ? `CALDERA ${i + 1}` : 'CALDERA',
      POTENCIA_KCALH: boiler.power > 0 ? String(Math.round(boiler.power)) : '-',
    });
    anotarCaja(ocupados, x0, y0, ancho, alto);
    // La potencia va en el rótulo, no acá: pegada a la caldera se monta con la
    // etiqueta de la primaria, que nace justo al lado.
    const rotuloCal = calderas.length > 1 ? `CALDERA ${i + 1}` : 'CALDERA';
    b.texto(cap('ETIQUETAS'), rotuloCal, cx, cy + alto / 2 + H_ETIQUETA * 0.6, H_ETIQUETA, true);
    anotarEtiqueta(ocupados, rotuloCal, cx, cy + alto / 2 + H_ETIQUETA * 0.6, H_ETIQUETA, true);
  });

  // --- Radiadores: sobre el plano va sólo la identificación (R1, R2...) ---
  // 🔴 El ambiente y la composición salen de `planillaRadiadores`, la MISMA
  // fuente que la planilla dibujada y el PDF: si el bloque se llenara por su
  // cuenta, `ATTEXT` daría una cosa y la planilla otra.
  for (const radiator of data.radiators.filter(x => plantaDe(x) === floor)) {
    const capRad = cap('RADIADORES');
    const [rx, ry] = esquina(radiator);
    const f = filas.get(radiator.id);
    anotarCaja(ocupados, rx, ry, aMetros(radiator.width), aMetros(radiator.height));
    b.insertar(capRad, 'CT_RADIADOR', rx, ry, aMetros(radiator.width), aMetros(radiator.height), {
      ID: etiquetasRad.get(radiator.id) ?? '',
      AMBIENTE: f?.ambiente ?? '-',
      ELEMENTOS: f?.elementos ? String(f.elementos) : '-',
      ALTURA_MM: f?.alturaMm ? String(f.alturaMm) : '-',
      COMPOSICION: f?.calculado ? 'CALCULADA' : 'CARGADA',
      POTENCIA_KCALH: radiator.power > 0 ? String(Math.round(radiator.power)) : '-',
    });
    const [cx, cy] = centro(radiator);
    const rotuloRad = etiquetasRad.get(radiator.id) ?? '';
    b.texto(cap('ETIQUETAS'), rotuloRad, cx, cy - H_ETIQUETA / 2, H_ETIQUETA, true);
    anotarEtiqueta(ocupados, rotuloRad, cx, cy - H_ETIQUETA / 2, H_ETIQUETA, true);
  }

  // --- Diámetros: AL FINAL, cuando ya está anotado todo lo que no se mueve ---
  // Las etiquetas de diámetro son las únicas que se pueden correr, así que se
  // dibujan últimas: así esquivan los números de radiador, la caldera, los
  // colectores y los nombres de ambiente en vez de escribirse encima.
  if (rotulosDiametro.length > 0) {
    dibujarEtiquetasDeDiametro(b, cap('ETIQUETAS'), rotulosDiametro, ocupados);
  }
}

/** Montantes entre plantas: se cuelgan del marco de la planta baja. */
function dibujarVerticales(
  b: DXFBuilder,
  data: DXFExportData,
  marco: Marco,
  ocupados: Ocupado[]
): void {
  const verticales = data.pipes.filter(p => p.floor === 'vertical' && p.points.length >= 2);
  if (verticales.length === 0) return;
  const rotulos: Rotulo[] = [];
  for (const pipe of verticales) {
    const nombre = `CT-${materialCorto(pipe.material)}${pipe.diameter || 20}-VERTICAL-${pipe.pipeType === 'return' ? 'RET' : 'IDA'}`;
    b.usarCapa(nombre, { color: CAPAS_GENERALES['CT-VERTICALES'].color, lineweight: 35 });
    const ruta = pipe.points.map(pt => punto(pt, marco));
    b.polilinea(nombre, ruta);
    // 🔴 «MONTANTE ENTRE PLANTAS Ø25» son casi 6 m de texto sobre un montante
    // de pocos centímetros: ida y retorno quedaban a 16 cm y se leía
    // «MO0NTANTEEENTREEPLANTASS». Acá va corto —«MONTANTE Ø25»— y una sola vez
    // por par; la leyenda del archivo traduce la capa entera.
    const tramo = tramoPrincipal(ruta);
    if (tramo) rotulos.push({ texto: `MONTANTE Ø${pipe.diameter || ''}`.trim(), ...tramo });
  }
  // En la capa de etiquetas de la planta baja, que es la hoja de la que
  // cuelgan: así se apagan todas juntas.
  const capaTxt = capa('ground', 'ETIQUETAS');
  b.usarCapa(capaTxt, CAPAS['ETIQUETAS']);
  dibujarEtiquetasDeDiametro(b, capaTxt, rotulos, ocupados);
}

/** Planilla de radiadores y planilla de circuitos, debajo del dibujo. */
function dibujarPlanillas(
  b: DXFBuilder,
  data: DXFExportData,
  circuitos: Record<Planta, CircuitosPlanta>
): void {
  const nombre = 'CT-PLANILLA';
  b.usarCapa(nombre, CAPAS_GENERALES[nombre]);
  const { min } = b.limites;
  const x0 = min.x;
  let y = min.y - 1.2;
  const salto = H_PLANILLA * 2;
  const fila = (celdas: [number, string][]): void => {
    for (const [dx, txt] of celdas) b.texto(nombre, txt, x0 + dx, y, H_PLANILLA);
    y -= salto;
  };

  if (data.radiators.length > 0) {
    b.texto(nombre, 'PLANILLA DE RADIADORES', x0, y, H_PLANILLA * 1.3);
    y -= salto * 1.3;
    fila([[0, 'ID'], [1.2, 'AMBIENTE'], [6, 'ELEMENTOS'], [10, 'POTENCIA'], [13.5, 'PLANTA']]);
    const planilla = planillaRadiadores(data.radiators, data.rooms ?? []);
    for (const f of planilla) {
      fila([
        [0, f.etiqueta],
        [1.2, f.ambiente],
        [6, f.elementos && f.alturaMm
          ? `${f.elementos} el. x ${f.alturaMm} mm${f.calculado ? ' (calc.)' : ''}`
          : '-'],
        [10, `${numES(Math.round(f.potenciaKcalh))} kcal/h`],
        [13.5, NOMBRE_PLANTA[plantaDe(f)]],
      ]);
    }
    // 🔴 De dónde sale un número marcado «(calc.)»: el que compra tiene que
    // poder distinguir lo que se cargó de lo que se dedujo de la potencia.
    if (planilla.some(f => f.calculado)) {
      y -= salto * 0.3;
      fila([[0, `(calc.) = cantidad calculada sobre la potencia del radiador, con elemento de ${ALTURA_ASUMIDA_MM} mm (${KCALH_ELEMENTO_ASUMIDO} kcal/h).`]]);
      fila([[0, 'Verificar la altura contra el radiador que se vaya a comprar.']]);
    }
    y -= salto;
  }

  const todos = PLANTAS.flatMap(f => circuitos[f].circuits.map(c => ({ c, floor: f })));
  if (todos.length === 0) return;
  const temp = data.tempImpulsionC ?? TEMP_IMPULSION_DEFAULT;
  b.texto(nombre, `PLANILLA DE CIRCUITOS DE PISO RADIANTE - IMPULSIÓN ${temp} °C`, x0, y, H_PLANILLA * 1.3);
  y -= salto * 1.3;
  fila([[0, 'CIRCUITO'], [2, 'AMBIENTE'], [6.5, 'LONGITUD'], [9.5, 'Ø'], [11, 'APORTE'], [14.5, 'PLANTA']]);
  for (const { c, floor } of todos) {
    fila([
      [0, c.etiqueta],
      [2, c.zoneName],
      [6.5, `${numES(c.longitudTotal, 1)} m`],
      [9.5, `Ø${DIAMETRO_PISO_MM}`],
      [11, c.aporteAmbienteKcalh === null ? '-' : `${numES(c.aporteAmbienteKcalh)} kcal/h`],
      [14.5, NOMBRE_PLANTA[floor]],
    ]);
  }
  const metros = todos.reduce((acc, t) => acc + t.c.longitudTotal, 0);
  y -= salto * 0.5;
  fila([[0, 'TOTAL'], [6.5, `${numES(metros, 1)} m`]]);
}

/** Metros de un tramo: el que calculó el ruteador, o la medida del dibujo. */
function longitudPipeM(pipe: PipeSegment): number {
  if (typeof pipe.length === 'number' && pipe.length > 0) return pipe.length;
  let px = 0;
  for (let i = 1; i < pipe.points.length; i++) {
    px += Math.hypot(
      pipe.points[i].x - pipe.points[i - 1].x,
      pipe.points[i].y - pipe.points[i - 1].y
    );
  }
  return aMetros(px);
}

/**
 * Despiece de materiales DIBUJADO dentro del archivo.
 *
 * 🔴 Va dibujado a propósito: `DATAEXTRACTION` no existe en AutoCAD LT —ahí
 * sólo hay `ATTEXT`, y sólo para atributos de bloque—, así que si el despiece
 * dependiera de que lo extraiga quien lo recibe, la mitad no podría.
 *
 * 🔴 SIN MARCAS: cada instalador adapta al material que usa. Y sin precios: es
 * una lista para comprar, no un presupuesto.
 */
function dibujarDespiece(b: DXFBuilder, data: DXFExportData): void {
  const filas: [string, string, string][] = [];

  // Caldera y radiadores
  for (const caldera of data.boilers) {
    filas.push([
      `Caldera${caldera.power > 0 ? ` ${numES(Math.round(caldera.power))} kcal/h` : ''}`,
      '1', 'u',
    ]);
  }
  // Los elementos salen de la planilla: los cargados y los calculados por
  // potencia. Antes, el radiador sin composición se listaba como «(sin
  // composición cargada)», que no se puede comprar.
  const porAltura = new Map<number, number>();
  let hayCalculados = false;
  for (const f of planillaRadiadores(data.radiators, data.rooms ?? [])) {
    if (!(f.elementos && f.alturaMm)) continue;
    porAltura.set(f.alturaMm, (porAltura.get(f.alturaMm) ?? 0) + f.elementos);
    if (f.calculado) hayCalculados = true;
  }
  for (const [altura, elementos] of [...porAltura].sort((a, c) => a[0] - c[0])) {
    filas.push([
      `Elementos de radiador ${altura} mm${hayCalculados ? ' (ver planilla)' : ''}`,
      numES(elementos), 'u',
    ]);
  }
  filas.push(['Radiadores (unidades a montar)', numES(data.radiators.length), 'u']);

  // Cañería de radiadores, por material y diámetro — el mismo corte que las capas
  const porTubo = new Map<string, number>();
  for (const pipe of data.pipes) {
    if (pipe.points.length < 2) continue;
    const clave = `Tubo ${materialCorto(pipe.material) === 'PEX' ? 'PE-X' : materialCorto(pipe.material).toLowerCase()} Ø${pipe.diameter || 20} (radiadores)`;
    porTubo.set(clave, (porTubo.get(clave) ?? 0) + longitudPipeM(pipe));
  }
  for (const [nombre, metros] of porTubo) filas.push([nombre, numES(Math.ceil(metros)), 'm']);

  // Piso radiante: el mismo despiece que calcula el presupuesto, sin precios
  const presupuesto = calcularPresupuestoPisoRadiante(
    data.floorHeatingZones ?? [], data.manifolds ?? [], data.boilers,
    data.rooms ?? [], data.tempImpulsionC ?? TEMP_IMPULSION_DEFAULT
  );
  for (const item of presupuesto?.resumen.items ?? []) {
    filas.push([item.nombre, numES(item.cantidad), item.unidad]);
  }

  if (filas.length === 0) return;

  const nombre = 'CT-PLANILLA';
  b.usarCapa(nombre, CAPAS_GENERALES[nombre]);
  let y = b.limites.min.y - 1.2;
  const x0 = b.limites.min.x;
  const salto = H_PLANILLA * 2;
  b.texto(nombre, 'DESPIECE DE MATERIALES', x0, y, H_PLANILLA * 1.3);
  y -= salto * 1.3;
  const fila = (material: string, cantidad: string, unidad: string): void => {
    b.texto(nombre, material, x0, y, H_PLANILLA);
    b.texto(nombre, cantidad, x0 + 9, y, H_PLANILLA);
    b.texto(nombre, unidad, x0 + 11, y, H_PLANILLA);
    y -= salto;
  };
  fila('MATERIAL', 'CANTIDAD', 'UNIDAD');
  for (const [material, cantidad, unidad] of filas) fila(material, cantidad, unidad);
  y -= salto * 0.5;
  b.texto(
    nombre,
    'Cantidades sobre lo dibujado en el plano, sin marcas: cada instalador adapta al material que usa.',
    x0, y, H_PLANILLA * 0.85
  );
}

/**
 * Traduce el nombre de una capa de cañería a lenguaje de obra.
 * `CT-PB-PEX20-PISO-IDA` → «planta baja · PE-X Ø20 · ida · piso radiante».
 */
function explicarCapa(nombre: string): string | null {
  const conPlanta = /^CT-(PB|PA)-([A-Z]+)(\d+)(?:-(PISO|PRIMARIA))?-(IDA|RET)$/.exec(nombre);
  const vertical = /^CT-([A-Z]+)(\d+)-VERTICAL-(IDA|RET)$/.exec(nombre);
  const material = (m: string): string => (m === 'PEX' ? 'PE-X' : m.toLowerCase());
  if (conPlanta) {
    const [, planta, mat, diam, sistema, rama] = conPlanta;
    const partes = [
      planta === 'PB' ? 'planta baja' : 'planta alta',
      `${material(mat)} Ø${diam}`,
      rama === 'IDA' ? 'ida' : 'retorno',
    ];
    // Sin sistema es la cañería de los radiadores. Se nombra igual que las
    // otras: si sólo el piso radiante queda nombrado, el que abre el archivo
    // no tiene cómo saber que las demás capas son la instalación de
    // radiadores.
    if (sistema === 'PISO') partes.push('piso radiante');
    else if (sistema === 'PRIMARIA') partes.push('primaria caldera-colector');
    else partes.push('radiadores');
    return partes.join(' · ');
  }
  if (vertical) {
    const [, mat, diam, rama] = vertical;
    return `montante entre plantas · ${material(mat)} Ø${diam} · ${rama === 'IDA' ? 'ida' : 'retorno'}`;
  }
  return null;
}

/**
 * Leyenda «cómo usar este archivo», al costado del dibujo.
 *
 * 🔴 Va DENTRO del archivo porque el que lo abre no tiene a nadie al lado que
 * se lo explique. Sin esto ve líneas de colores y no se entera de lo único que
 * hace distinto a este plano: que las cañerías están cortadas por diámetro
 * —seleccionás la capa y tenés el metraje— y que el despiece ya está adentro.
 */
function dibujarComoUsarlo(b: DXFBuilder, queLleva: string): void {
  const nombre = 'CT-ROTULO';
  b.usarCapa(nombre, CAPAS_GENERALES[nombre]);
  const { max } = b.limites;
  const x0 = max.x + 2;
  let y = max.y;
  const salto = H_PLANILLA * 1.8;
  const linea = (txt: string, altura = H_PLANILLA): void => {
    b.texto(nombre, txt, x0, y, altura);
    y -= salto;
  };

  linea('CÓMO USAR ESTE ARCHIVO', H_PLANILLA * 1.5);
  y -= salto * 0.4;
  linea('Medidas en METROS. AutoCAD escala solo al insertarlo en un dibujo en cm o mm.');
  y -= salto * 0.6;
  if (queLleva) {
    linea(`Este plano lleva la instalación de ${queLleva}.`);
    y -= salto * 0.6;
  }

  // Cañerías: la capa dice material y diámetro, y ese es el punto
  const capasTubo = b.capas
    .map(c => ({ nombre: c, que: explicarCapa(c) }))
    .filter((c): c is { nombre: string; que: string } => c.que !== null);
  if (capasTubo.length > 0) {
    linea('CAÑERÍAS - una capa por material y diámetro:', H_PLANILLA * 1.15);
    linea('seleccionando la capa sale el metraje de ese tubo.');
    for (const c of capasTubo.slice(0, 10)) {
      b.texto(nombre, c.nombre, x0 + 0.3, y, H_PLANILLA);
      b.texto(nombre, c.que, x0 + 5.6, y, H_PLANILLA);
      y -= salto;
    }
    if (capasTubo.length > 10) linea(`(y ${capasTubo.length - 10} capas más de cañería)`);
    y -= salto * 0.6;
  }

  linea('BLOQUES CON ATRIBUTOS:', H_PLANILLA * 1.15);
  linea('caldera, radiadores y colectores. Los datos salen con ATTEXT.');
  y -= salto * 0.6;
  linea('DESPIECE Y PLANILLAS:', H_PLANILLA * 1.15);
  linea('dibujados debajo del plano, en la capa CT-PLANILLA.');
  y -= salto * 0.6;
  linea('El resto de las capas empieza con CT- y se puede apagar entera.');
}

/** Rótulo arriba del dibujo: qué es, de cuándo y en qué unidad está. */
function dibujarRotulo(
  b: DXFBuilder,
  data: DXFExportData,
  circuitos: Record<Planta, CircuitosPlanta>
): void {
  const nombre = 'CT-ROTULO';
  b.usarCapa(nombre, CAPAS_GENERALES[nombre]);
  const { min, max } = b.limites;
  const fecha = new Date().toLocaleDateString('es-AR');

  const potenciaCaldera = data.boilers.reduce((acc, x) => acc + (x.power || 0), 0);
  const circuitosTotales = PLANTAS.reduce((acc, f) => acc + circuitos[f].circuits.length, 0);
  const resumen = [
    data.boilers.length > 0 && potenciaCaldera > 0
      ? `${data.boilers.length > 1 ? `${data.boilers.length} calderas` : 'Caldera'} ${numES(Math.round(potenciaCaldera))} kcal/h`
      : null,
    data.radiators.length > 0 ? `${data.radiators.length} radiadores` : null,
    circuitosTotales > 0 ? `${circuitosTotales} circuitos de piso radiante` : null,
    PLANTAS.some(f => circuitos[f].montantes.length > 0)
      ? `primaria caldera-colector Ø${MONTANTE_DIAMETRO_MM}`
      : null,
  ].filter(Boolean).join(' · ');

  b.texto(nombre, (data.projectName || 'Proyecto').toUpperCase(), min.x, max.y + 1.55, H_TITULO);
  b.texto(nombre, `Instalación de calefacción - Criterio Térmico - ${fecha}`, min.x, max.y + 1.05, H_ETIQUETA);
  if (resumen) b.texto(nombre, resumen, min.x, max.y + 0.7, H_ETIQUETA);
  b.texto(nombre, 'MEDIDAS EN METROS (1 unidad de dibujo = 1 m)', min.x, max.y + 0.35, H_ETIQUETA);
}

// ============================================================
// API PÚBLICA
// ============================================================

/** Genera el contenido del archivo DXF del proyecto. */
export function generarDXF(data: DXFExportData): string {
  const b = new DXFBuilder();
  const circuitos = circuitosPorPlanta(data);
  const caja = cajaEnPixeles(data, circuitos);
  const etiquetasRad = etiquetasRadiadores(data.radiators);
  // Una sola pasada de la planilla para todo el archivo: bloques, planilla
  // dibujada y despiece tienen que decir exactamente lo mismo.
  const filas = new Map(
    planillaRadiadores(data.radiators, data.rooms ?? []).map(f => [f.radiatorId, f])
  );

  const hayPB = tieneContenido(data, 'ground', circuitos.ground);
  // La planta alta va AL LADO de la baja, no encima: en el canvas las dos
  // ocupan el mismo lugar (cada una con su plano de fondo), así que
  // exportadas tal cual quedarían superpuestas y el plano sería ilegible.
  const anchoTotalM = aMetros(caja.maxX - caja.minX);
  const marcos: Record<Planta, Marco> = {
    ground: { minX: caja.minX, maxY: caja.maxY, dx: 0 },
    first: {
      minX: caja.minX,
      maxY: caja.maxY,
      dx: hayPB ? anchoTotalM + SEPARACION_PLANTAS_M : 0,
    },
  };

  const plantasDibujadas = PLANTAS.filter(f => tieneContenido(data, f, circuitos[f]));
  // Las etiquetas de diámetro de las dos plantas y de los montantes comparten
  // una sola lista: los montantes cuelgan de la hoja de planta baja y tienen
  // que esquivar lo que ya está escrito ahí.
  const ocupados: Ocupado[] = [];
  for (const floor of plantasDibujadas) {
    dibujarPlanta(b, data, floor, circuitos[floor], marcos[floor], etiquetasRad, filas, ocupados);
  }
  dibujarVerticales(b, data, marcos.ground, ocupados);

  // Título de cada planta, sólo si hay más de una (si no, sobra)
  if (plantasDibujadas.length > 1) {
    const nombre = 'CT-ROTULO';
    b.usarCapa(nombre, CAPAS_GENERALES[nombre]);
    const { min } = b.limites;
    for (const floor of plantasDibujadas) {
      b.texto(nombre, NOMBRE_PLANTA[floor], marcos[floor].dx, min.y - 0.6, H_TITULO * 0.6);
    }
  }

  dibujarPlanillas(b, data, circuitos);
  dibujarDespiece(b, data);
  // El rótulo antes que la leyenda: se ubica contra el borde de arriba y la
  // leyenda lo correría al agrandar la caja.
  dibujarRotulo(b, data, circuitos);
  const hayRadiadores = data.radiators.length > 0;
  const hayPiso = PLANTAS.some(f => circuitos[f].circuits.length > 0);
  dibujarComoUsarlo(
    b,
    hayRadiadores && hayPiso ? 'radiadores y piso radiante'
      : hayRadiadores ? 'radiadores'
      : hayPiso ? 'piso radiante'
      : ''
  );
  return b.generar();
}

/**
 * Pasa el contenido a bytes ANSI_1252, que es la codificación que declara el
 * header. `textoDXF` ya garantizó que no queda ningún carácter por encima de
 * 255; con un Blob de texto el navegador escribiría UTF-8 y los acentos
 * llegarían rotos al AutoCAD que lo abra.
 */
export function dxfABytes(contenido: string): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(new ArrayBuffer(contenido.length));
  for (let i = 0; i < contenido.length; i++) bytes[i] = contenido.charCodeAt(i) & 0xff;
  return bytes;
}

/** Genera el DXF y lo baja al disco del navegador. */
export function downloadDXFFile(data: DXFExportData, filename?: string): void {
  const blob = new Blob([dxfABytes(generarDXF(data))], { type: 'image/vnd.dxf' });
  const url = URL.createObjectURL(blob);
  const nombre = filename
    || `${(data.projectName || 'proyecto').replace(/[^a-zA-Z0-9-_]/g, '_')}.dxf`;

  const a = document.createElement('a');
  a.href = url;
  a.download = nombre.endsWith('.dxf') ? nombre : `${nombre}.dxf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
