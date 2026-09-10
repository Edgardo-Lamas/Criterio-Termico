// Exportador DWG del Simulador.
//
// 🔑 ACÁ NO SE DIBUJA NADA. El plano lo arma `dxfExporter.ts` y este archivo
// sólo lo convierte: el mismo texto que baja como `.dxf` entra por el lector de
// `@node-projects/acad-ts` y sale por su escritor de DWG. Un solo generador,
// dos formatos. Si hay que cambiar algo del dibujo —capas, bloques, etiquetas,
// despiece— se cambia allá y los dos archivos lo heredan.
//
// Por qué existe: DWG es el formato nativo de AutoCAD y es lo que el
// arquitecto, el ingeniero o el MMO esperan recibir. El DXF lo abre igual,
// pero un archivo que llega con la extensión que ellos usan todos los días se
// abre sin preguntas.
//
// Por qué esta librería y no otra:
// - **ODA** (lo que usa la industria) cuesta hasta USD 25.000 al año y, si se
//   deja de pagar, se pierde el derecho a distribuir lo ya desarrollado.
// - **LibreDWG** es GPL: obligaría a abrir el código de Criterio Térmico. Y
//   escribe hasta R2000 nomás.
// - **acad-ts** es MIT, sin dependencias, corre en el navegador y escribe
//   AC1015, que es justo la versión en la que ya sale nuestro DXF.
//
// El archivo se arma en la máquina del usuario, igual que el DXF: no se sube a
// ningún servidor.

import { generarDXF, dxfABytes, ATRIBUTOS_DE_BLOQUE } from './dxfExporter';
import type { DXFExportData } from './dxfExporter';

/** La misma versión en la que sale el DXF. La abre cualquier AutoCAD 2000+. */
export const DWG_VERSION = 'AC1015';

/**
 * 🔴 acad-ts NO lee el código 2 —el TAG— de los ATTDEF y los ATTRIB: los
 * valores llegan bien pero los tags llegan vacíos. Sin tag, `ATTEXT` no
 * extrae nada, y `ATTEXT` es lo ÚNICO que tiene AutoCAD LT para sacar la
 * lista de aparatos (no trae `DATAEXTRACTION`). O sea que sin este arreglo el
 * DWG se ve bien y no sirve para lo que lo entregamos.
 *
 * Se reponen POR POSICIÓN, que es fiable porque el DXF lo escribimos nosotros
 * y el orden es el de `ATRIBUTOS_DE_BLOQUE` —la misma constante que usa el
 * exportador para emitirlos—. Lo fija un test.
 *
 * Es un defecto de la librería, no del formato: cuando lo corrijan, esta
 * función deja de reponer nada sola (sólo toca los tags vacíos).
 */
function reponerTagsDeAtributos(doc: DocumentoCad): number {
  let repuestos = 0;
  const tagsDe = (nombre: string | undefined): readonly string[] | undefined =>
    nombre ? ATRIBUTOS_DE_BLOQUE[nombre as keyof typeof ATRIBUTOS_DE_BLOQUE] : undefined;

  // En la definición de cada bloque (los ATTDEF)
  for (const registro of doc.blockRecords) {
    const tags = tagsDe(registro.name);
    if (!tags) continue;
    let i = 0;
    for (const entidad of registro.entities) {
      if (entidad.constructor.name !== 'AttributeDefinition') continue;
      if (tags[i] && !entidad.tag) { entidad.tag = tags[i]; repuestos++; }
      i++;
    }
  }

  // Y en cada INSERT del dibujo (los ATTRIB)
  for (const entidad of doc.modelSpace.entities) {
    if (entidad.constructor.name !== 'Insert') continue;
    const tags = tagsDe(entidad.block?.name);
    if (!tags || !entidad.attributes) continue;
    let i = 0;
    for (const atributo of entidad.attributes) {
      if (atributo?.constructor.name !== 'AttributeEntity') continue;
      if (tags[i] && !atributo.tag) { atributo.tag = tags[i]; repuestos++; }
      i++;
    }
  }
  return repuestos;
}

/**
 * 🔴 El mismo lector mete el `SEQEND` DENTRO de la lista de atributos, en vez
 * de en el campo `seqend` de la colección. Dos consecuencias, las dos mudas:
 * el INSERT queda apuntando al SEQEND como si fuera su último atributo, y la
 * referencia al terminador se escribe vacía — o sea que **el DWG sale con los
 * INSERT sin cerrar**. Se detectó volviendo a convertir el DWG a DXF con
 * LibreDWG: salían 17 INSERT con 98 atributos y CERO SEQEND, y un DXF así lo
 * rechaza cualquier lector estricto.
 *
 * Un `INSERT` con atributos que no cierra con `SEQEND` es un archivo inválido
 * —la regla ya está en el CLAUDE.md para el DXF— y no se puede saber de
 * antemano si AutoCAD lo repara o pierde los atributos.
 */
function ordenarSeqends(doc: DocumentoCad): number {
  let movidos = 0;
  for (const entidad of doc.modelSpace.entities) {
    if (entidad.constructor.name !== 'Insert') continue;
    const atributos = entidad.attributes as ColeccionConSeqend | undefined;
    if (!atributos || typeof atributos.splice !== 'function') continue;
    for (let i = atributos.length - 1; i >= 0; i--) {
      if (atributos[i]?.constructor.name !== 'Seqend') continue;
      if (!atributos.seqend) atributos.seqend = atributos[i];
      atributos.splice(i, 1);
      movidos++;
    }
  }
  return movidos;
}

// Lo que se usa del documento de acad-ts. La librería trae sus tipos, pero se
// carga dinámicamente y no se puede importar el tipo sin arrastrar el módulo.
interface EntidadCad {
  constructor: { name: string };
  tag?: string;
  block?: { name?: string };
  attributes?: Iterable<EntidadCad | null>;
}
/** La lista de atributos de un INSERT, que además lleva su terminador. */
interface ColeccionConSeqend extends Array<EntidadCad | null> {
  seqend: EntidadCad | null;
}
interface DocumentoCad {
  blockRecords: Iterable<{ name: string; entities: Iterable<EntidadCad> }>;
  modelSpace: { entities: Iterable<EntidadCad> };
  header: { version: unknown };
}

/**
 * Convierte el proyecto a DWG. La librería se carga recién acá —son más de
 * 1 MB— para que no pese en el arranque del simulador: el que no exporta a DWG
 * no la descarga nunca.
 */
export async function generarDWG(data: DXFExportData): Promise<Uint8Array<ArrayBuffer>> {
  const { DxfReader, DwgWriter, ACadVersion } = await import('@node-projects/acad-ts');
  const doc = DxfReader.readFromStream(dxfABytes(generarDXF(data)), () => {}) as unknown as DocumentoCad;
  ordenarSeqends(doc);
  reponerTagsDeAtributos(doc);
  doc.header.version = (ACadVersion as unknown as Record<string, unknown>)[DWG_VERSION];
  const escrito = new Uint8Array(DwgWriter.writeToBuffer(doc as never));
  const bytes = new Uint8Array(new ArrayBuffer(escrito.length));
  bytes.set(escrito);
  return bytes;
}

/** Genera el DWG y lo baja al disco del navegador. */
export async function downloadDWGFile(data: DXFExportData, filename?: string): Promise<void> {
  const bytes = await generarDWG(data);
  const blob = new Blob([bytes], { type: 'image/vnd.dwg' });
  const url = URL.createObjectURL(blob);
  const nombre = filename
    || `${(data.projectName || 'proyecto').replace(/[^a-zA-Z0-9-_]/g, '_')}.dwg`;

  const a = document.createElement('a');
  a.href = url;
  a.download = nombre.endsWith('.dwg') ? nombre : `${nombre}.dwg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export { reponerTagsDeAtributos, ordenarSeqends };
