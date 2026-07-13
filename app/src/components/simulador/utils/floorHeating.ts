// Cálculo de circuitos de piso radiante para el Simulador 2D.
// Convierte zonas dibujadas en el canvas (px) a serpentines reales (metros)
// usando el generador puro de lib/pisoRadiante/serpentin.ts, divide en
// circuitos de máximo 120 m y rutea las acometidas al colector.

import { generarSerpentin } from '../../../lib/pisoRadiante/serpentin';
import type { Punto, EsquinaBoca } from '../../../lib/pisoRadiante/serpentin';
import type { FloorHeatingZone, PuertaZona } from '../models/FloorHeatingZone';
import type { Manifold } from '../models/Manifold';
import type { Boiler } from '../models/Boiler';
import type { Room } from '../models/Room';
import { rutearOrtogonal, marcarRuta, areaDeTrabajo } from './orthogonalRouter';

// Misma escala que usa el resto del simulador para longitudes de tubería
// (ver useElementsStore.finishPipe / createManualPipe).
export const PIXELS_PER_METER = 50;

// Límite hidráulico por circuito con PE-X 20mm (ver UnderfloorService).
export const MAX_CIRCUIT_LENGTH_M = 120;

// Criterio de diseño: máximo de circuitos por colector (caudal y equilibrado).
// Los colectores comerciales llegan a 12 vías, pero el criterio de obra es 7.
export const MAX_CIRCUITOS_POR_COLECTOR = 7;

// Densidad de tubería según paso (misma tabla que UnderfloorService):
// la regla de obra — a paso 20 cm entran 5 m de tubo por m², a paso 15 son 6,7.
// La longitud presupuestada usa área × densidad (como calculan los fabricantes),
// NO la geometría del dibujo, que descuenta margen perimetral y queda corta.
export const DENSIDAD_POR_PASO: Record<15 | 20, number> = { 15: 6.7, 20: 5.0 };

// Emisión del piso según la temperatura de impulsión del agua. Suelo pétreo,
// ambiente de diseño 20°C, salto ida-retorno 5°C → temperatura media del agua
// = impulsión − 2,5°C. Característica lineal aproximada q ≈ 4,5 W/m²·K sobre
// el salto agua-ambiente, con tope 100 W/m² (piso a 29°C máx, EN 1264):
//   35°C → ~56 W/m² ≈ 48 kcal/h·m²
//   40°C → ~79 W/m² ≈ 68 kcal/h·m²
//   45°C → 100 W/m² (tope) ≈ 86 kcal/h·m²
export const TEMPERATURAS_IMPULSION = [35, 40, 45] as const;
export type TempImpulsion = (typeof TEMPERATURAS_IMPULSION)[number];
export const TEMP_IMPULSION_DEFAULT: TempImpulsion = 45;

export function emisionKcalhM2(impulsionC: TempImpulsion): number {
  const mediaAgua = impulsionC - 2.5;
  const wM2 = Math.min(4.5 * (mediaAgua - 20), 100);
  return Math.round(wM2 * 0.86); // 1 W = 0,86 kcal/h
}

// ── Carga de diseño para piso radiante ──────────────────────────────────────
// El factor volumétrico (40/50/60 kcal/h·m³) es una regla para dimensionar
// RADIADORES: viene sobredimensionada a propósito (sistema intermitente, alta
// temperatura, "sobrar" es gratis) y con 2,5 m de techo pide 100-150 kcal/h·m²,
// más de lo que un piso puede entregar físicamente (tope 100 W/m² ≈ 86
// kcal/h·m², superficie a 29°C máx, EN 1264). El piso radiante se diseña con
// la carga REAL del ambiente: 60/80/100 W/m² según calidad constructiva,
// el rango de cargas de vivienda que asume EN 1264.
export type CalidadAislacion = 'buena' | 'media' | 'mala';
export const AISLACION_DEFAULT: CalidadAislacion = 'media';
export const CARGA_PISO_WM2: Record<CalidadAislacion, number> = {
  buena: 60,  // construcción aislada (DVH, muros con aislación)
  media: 80,  // construcción tradicional razonable
  mala: 100,  // construcción precaria o zona muy fría: el piso queda al límite
};

// Carga de diseño de una habitación calefaccionada por piso radiante (kcal/h).
export function cargaPisoKcalh(room: Pick<Room, 'area' | 'aislacion'>): number {
  const wM2 = CARGA_PISO_WM2[room.aislacion ?? AISLACION_DEFAULT];
  return Math.round(room.area * wM2 * 0.86); // 1 W = 0,86 kcal/h
}

// ── Puerta de la zona ───────────────────────────────────────────────────────
// En obra la acometida entra a la habitación por la puerta, no atraviesa una
// pared (tipos LadoZona/PuertaZona en el modelo FloorHeatingZone).

// Punto de la puerta en px del canvas. `alongPx` desplaza a lo largo del borde
// (separa ida de retorno) y `fueraPx` lo aleja perpendicular hacia afuera.
export function puntoPuerta(
  zone: FloorHeatingZone,
  puerta: PuertaZona,
  alongPx = 0,
  fueraPx = 0
): CanvasPoint {
  const t = Math.min(1, Math.max(0, puerta.t))
  switch (puerta.lado) {
    case 'arriba':
      return { x: zone.x + zone.width * t + alongPx, y: zone.y - fueraPx }
    case 'abajo':
      return { x: zone.x + zone.width * t + alongPx, y: zone.y + zone.height + fueraPx }
    case 'izquierda':
      return { x: zone.x - fueraPx, y: zone.y + zone.height * t + alongPx }
    case 'derecha':
      return { x: zone.x + zone.width + fueraPx, y: zone.y + zone.height * t + alongPx }
  }
}

// Lado y fracción de la puerta a partir de un punto del canvas (el click del
// usuario): se proyecta al borde más cercano del rectángulo de la zona.
export function puertaDesdePunto(zone: FloorHeatingZone, p: CanvasPoint): PuertaZona {
  const clampX = Math.min(zone.x + zone.width, Math.max(zone.x, p.x))
  const clampY = Math.min(zone.y + zone.height, Math.max(zone.y, p.y))
  const dArr = Math.abs(p.y - zone.y)
  const dAba = Math.abs(p.y - (zone.y + zone.height))
  const dIzq = Math.abs(p.x - zone.x)
  const dDer = Math.abs(p.x - (zone.x + zone.width))
  const min = Math.min(dArr, dAba, dIzq, dDer)
  if (min === dArr) return { lado: 'arriba', t: (clampX - zone.x) / zone.width }
  if (min === dAba) return { lado: 'abajo', t: (clampX - zone.x) / zone.width }
  if (min === dIzq) return { lado: 'izquierda', t: (clampY - zone.y) / zone.height }
  return { lado: 'derecha', t: (clampY - zone.y) / zone.height }
}

// Entrega máxima de una zona completa: área × emisión a la impulsión de
// diseño. Es la misma cuenta que suman los circuitos de la zona (cada franja
// aporta su área × emisión), sin necesidad de generar los serpentines.
export function potenciaZonaKcalh(
  zone: FloorHeatingZone,
  tempImpulsionC: TempImpulsion
): number {
  const areaM2 = (zone.width / PIXELS_PER_METER) * (zone.height / PIXELS_PER_METER);
  return Math.round(areaM2 * emisionKcalhM2(tempImpulsionC));
}

export interface CanvasPoint {
  x: number;
  y: number;
}

export interface FloorHeatingCircuit {
  zoneId: string;
  zoneName: string;
  manifoldId: string | null;   // colector asignado (null si no hay en la planta)
  numero: number;              // número de circuito dentro de la zona (1..n)
  colectorNumero: number | null; // índice 1..n del colector en la planta (null sin colector)
  etiqueta: string;            // "C2" = va al colector 2; "C2.1" si la zona tiene varios circuitos
  cargaKcalh: number | null;   // carga térmica de diseño (requerido de la habitación repartido)
  patron: 'espiral' | 'meandro';
  ida: CanvasPoint[];          // px absolutos del canvas
  retorno: CanvasPoint[];      // px absolutos del canvas
  acometidaIda: CanvasPoint[];     // colector → inicio del serpentín
  acometidaRetorno: CanvasPoint[]; // fin del serpentín → colector
  pasoCm: number;
  areaM2: number;              // m² de la franja que cubre este circuito
  potenciaKcalh: number;       // kcal/h que entrega como máximo (suelo pétreo)
  longitudSerpentin: number;   // m (área × densidad del paso, como en obra)
  longitudAcometida: number;   // m (ida + vuelta)
  longitudTotal: number;       // m
  excedeLimite: boolean;       // true si aún dividiendo supera el máximo
  labelPos: CanvasPoint;       // dónde dibujar la etiqueta
}

function aPixeles(pts: Punto[], origenX: number, origenY: number): CanvasPoint[] {
  return pts.map(p => ({
    x: origenX + p.x * PIXELS_PER_METER,
    y: origenY + p.y * PIXELS_PER_METER,
  }));
}

// Camino ortogonal simple (en L) entre dos puntos del canvas: primero
// horizontal, después vertical. offsetPx separa visualmente ida de retorno.
function caminoEnL(desde: CanvasPoint, hasta: CanvasPoint, offsetPx: number): CanvasPoint[] {
  return [
    { x: desde.x, y: desde.y + offsetPx },
    { x: hasta.x + offsetPx, y: desde.y + offsetPx },
    { x: hasta.x + offsetPx, y: hasta.y },
  ]
}

function longitudPx(pts: CanvasPoint[]): number {
  let total = 0
  for (let i = 1; i < pts.length; i++) {
    total += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y)
  }
  return total
}

function redondear(n: number): number {
  return Math.round(n * 100) / 100
}

// Esquina del rectángulo más cercana a un punto (la puerta): la boca del
// serpentín nace ahí para que la acometida entre pegada a la pared sin cruzar
// las vueltas del circuito.
type RectPx = { x: number; y: number; width: number; height: number }
function esquinaMasCercana(rect: RectPx, p: CanvasPoint): EsquinaBoca {
  const izq = Math.abs(p.x - rect.x) <= Math.abs(p.x - (rect.x + rect.width))
  const sup = Math.abs(p.y - rect.y) <= Math.abs(p.y - (rect.y + rect.height))
  return `${sup ? 'sup' : 'inf'}-${izq ? 'izq' : 'der'}` as EsquinaBoca
}

// Divide el rectángulo de la zona a lo largo de su eje mayor en n franjas iguales.
function dividirZona(zone: FloorHeatingZone, n: number): { x: number; y: number; width: number; height: number }[] {
  const franjas: { x: number; y: number; width: number; height: number }[] = []
  const horizontal = zone.width >= zone.height
  for (let i = 0; i < n; i++) {
    if (horizontal) {
      const w = zone.width / n
      franjas.push({ x: zone.x + i * w, y: zone.y, width: w, height: zone.height })
    } else {
      const h = zone.height / n
      franjas.push({ x: zone.x, y: zone.y + i * h, width: zone.width, height: h })
    }
  }
  return franjas
}

/**
 * Calcula los circuitos de una zona: genera el serpentín de cada franja,
 * aumentando la cantidad de circuitos hasta que ninguno supere los 120 m
 * (incluyendo su acometida al colector).
 */
// Punto por donde salen las acometidas: el lado del colector que mira hacia
// la zona. Un colector horizontal descarga por arriba o abajo; uno vertical
// (rotado contra una pared lateral) descarga por izquierda o derecha.
// `t` es la fracción a lo largo del cuerpo del colector (la "vía" que usa
// este circuito), para que varios circuitos salgan en peine y no encimados.
function puntoSalidaColector(manifold: Manifold, zone: FloorHeatingZone, t = 0.5): CanvasPoint {
  const horizontal = manifold.width >= manifold.height
  const centroColectorX = manifold.x + manifold.width / 2
  const centroColectorY = manifold.y + manifold.height / 2
  const centroZonaX = zone.x + zone.width / 2
  const centroZonaY = zone.y + zone.height / 2

  if (horizontal) {
    return {
      x: manifold.x + manifold.width * t,
      y: centroZonaY >= centroColectorY ? manifold.y + manifold.height : manifold.y,
    }
  }
  return {
    x: centroZonaX >= centroColectorX ? manifold.x + manifold.width : manifold.x,
    y: manifold.y + manifold.height * t,
  }
}

// Punto del perímetro de la zona más cercano a un punto interior (el arranque
// o remate del serpentín), apenas por fuera: es la "puerta" por donde la
// acometida entra a la habitación.
function puntoEntradaZona(zone: FloorHeatingZone, interior: CanvasPoint): CanvasPoint {
  // 12 px afuera del borde (una celda del router): deja la celda de entrada
  // fuera del área inflada del obstáculo, si no el destino queda encerrado
  const FUERA = 12
  const dIzq = interior.x - zone.x
  const dDer = zone.x + zone.width - interior.x
  const dArr = interior.y - zone.y
  const dAba = zone.y + zone.height - interior.y
  const min = Math.min(dIzq, dDer, dArr, dAba)
  if (min === dIzq) return { x: zone.x - FUERA, y: interior.y }
  if (min === dDer) return { x: zone.x + zone.width + FUERA, y: interior.y }
  if (min === dArr) return { x: interior.x, y: zone.y - FUERA }
  return { x: interior.x, y: zone.y + zone.height + FUERA }
}

// Datos reales de la habitación vinculada a la zona: el plano de fondo es una
// imagen cuya escala NO coincide con los 50 px/m del canvas, así que los m²
// del dibujo distorsionan la matemática. Cuando la zona tiene habitación,
// toda la cuenta (longitud, potencia, materiales) usa el área REAL cargada en
// el panel, y la carga térmica calculada se reparte entre los circuitos.
export interface DatosReales {
  areaM2: number          // área real de la habitación (del panel)
  cargaKcalh: number | null // requerido calculado (cargaPisoKcalh)
}

export function calcularCircuitosZona(
  zone: FloorHeatingZone,
  manifold: Manifold | null,
  tempImpulsionC: TempImpulsion = TEMP_IMPULSION_DEFAULT,
  real: DatosReales | null = null
): FloorHeatingCircuit[] {
  const salidaColector: CanvasPoint | null = manifold
    ? puntoSalidaColector(manifold, zone)
    : null

  // Factor entre el área real de la habitación y la dibujada en px
  const areaDibujadaM2 = (zone.width / PIXELS_PER_METER) * (zone.height / PIXELS_PER_METER)
  const escala = real && areaDibujadaM2 > 0 ? real.areaM2 / areaDibujadaM2 : 1

  // Punto de la puerta (si está marcada): la boca de cada franja nace en su
  // esquina más cercana a la puerta para que la acometida no cruce el serpentín.
  const puntoDoor: CanvasPoint | null = zone.puerta ? puntoPuerta(zone, zone.puerta) : null

  const MAX_INTENTOS = 8
  for (let n = 1; n <= MAX_INTENTOS; n++) {
    const franjas = dividirZona(zone, n)
    const circuitos: FloorHeatingCircuit[] = []
    let algunoExcede = false

    for (let i = 0; i < franjas.length; i++) {
      const f = franjas[i]
      const anchoM = f.width / PIXELS_PER_METER
      const altoM = f.height / PIXELS_PER_METER
      const boca: EsquinaBoca = puntoDoor ? esquinaMasCercana(f, puntoDoor) : 'sup-izq'

      let serpentin
      try {
        serpentin = generarSerpentin(anchoM, altoM, zone.pasoCm, 10, boca)
      } catch {
        // Franja demasiado chica para trazar: la zona entera no es viable
        return []
      }

      const ida = aPixeles(serpentin.ida, f.x, f.y)
      const retorno = aPixeles(serpentin.retorno, f.x, f.y)

      let acometidaIda: CanvasPoint[] = []
      let acometidaRetorno: CanvasPoint[] = []
      let longitudAcometida = 0
      if (salidaColector && ida.length > 0 && retorno.length > 0) {
        acometidaIda = caminoEnL(salidaColector, ida[0], 0)
        acometidaRetorno = caminoEnL(salidaColector, retorno[retorno.length - 1], 4).reverse()
        longitudAcometida = redondear(
          (longitudPx(acometidaIda) + longitudPx(acometidaRetorno)) / PIXELS_PER_METER
        )
      }

      // Longitud presupuestada por densidad (regla de obra), no por el dibujo.
      // Con habitación vinculada, el área de la franja se escala al área REAL.
      const areaM2 = redondear(anchoM * altoM * escala)
      const longitudSerpentin = redondear(areaM2 * DENSIDAD_POR_PASO[zone.pasoCm])
      const longitudTotal = redondear(longitudSerpentin + longitudAcometida)
      if (longitudTotal > MAX_CIRCUIT_LENGTH_M) algunoExcede = true

      circuitos.push({
        zoneId: zone.id,
        zoneName: zone.name,
        manifoldId: manifold?.id ?? null,
        numero: i + 1,
        colectorNumero: null,        // se completa en calcularCircuitosPlanta
        etiqueta: `C${i + 1}`,       // fallback sin numeración de colector
        patron: serpentin.patron,
        ida,
        retorno,
        acometidaIda,
        acometidaRetorno,
        pasoCm: zone.pasoCm,
        areaM2,
        potenciaKcalh: Math.round(areaM2 * emisionKcalhM2(tempImpulsionC)),
        // Carga de diseño de la habitación repartida en partes iguales
        // (las franjas son iguales entre sí)
        cargaKcalh: real?.cargaKcalh != null
          ? Math.round(real.cargaKcalh / franjas.length)
          : null,
        longitudSerpentin,
        longitudAcometida,
        longitudTotal,
        excedeLimite: longitudTotal > MAX_CIRCUIT_LENGTH_M,
        labelPos: { x: f.x + 6, y: f.y + 14 },
      })
    }

    if (!algunoExcede || n === MAX_INTENTOS) return circuitos
  }
  return []
}

// Colector más cercano a la zona en la misma planta (asignación automática MVP).
export function colectorMasCercano(zone: FloorHeatingZone, manifolds: Manifold[]): Manifold | null {
  const cx = zone.x + zone.width / 2
  const cy = zone.y + zone.height / 2
  let mejor: Manifold | null = null
  let mejorDist = Infinity
  for (const m of manifolds) {
    const d = Math.hypot(m.x + m.width / 2 - cx, m.y + m.height / 2 - cy)
    if (d < mejorDist) {
      mejorDist = d
      mejor = m
    }
  }
  return mejor
}

/**
 * Rutea las acometidas reales de los circuitos esquivando las demás zonas
 * (criterio de diseño: la acometida no atraviesa una habitación ajena, va
 * por los pasillos). Los circuitos de un mismo colector salen en peine por
 * vías repartidas a lo largo del cuerpo. Muta los circuitos recibidos;
 * si el router no encuentra camino, queda el camino en L original.
 */
function rutearAcometidas(
  circuits: FloorHeatingCircuit[],
  zones: FloorHeatingZone[],
  manifolds: Manifold[]
): void {
  if (circuits.length === 0) return
  const area = areaDeTrabajo([...zones, ...manifolds])
  const ocupadas = new Set<string>()
  const viasUsadas = new Map<string, number>()

  for (const c of circuits) {
    const manifold = manifolds.find(m => m.id === c.manifoldId)
    const zone = zones.find(z => z.id === c.zoneId)
    if (!manifold || !zone || c.ida.length === 0 || c.retorno.length === 0) continue

    const slot = viasUsadas.get(manifold.id) ?? 0
    viasUsadas.set(manifold.id, slot + 1)
    // Hasta 7 vías repartidas: slot 0 → 1/8, slot 1 → 2/8, ...
    const t = Math.min((slot + 1) / 8, 0.95)
    const salida = puntoSalidaColector(manifold, zone, t)

    // Todas las zonas son obstáculo (la propia también: se entra solo por
    // el punto de entrada, que queda apenas fuera del rectángulo).
    const obstaculos = zones

    // Con puerta marcada, la acometida entra por la puerta real (ida y
    // retorno apenas separados sobre el borde); sin puerta, por el punto
    // del perímetro más cercano al serpentín.
    const puerta = zone.puerta
    // Tramo interno puerta → boca del serpentín: la boca nace en la esquina más
    // cercana a la puerta (ver esquinaMasCercana), así que la L va primero
    // pegada a la pared de la puerta hasta la esquina y recién ahí entra a la
    // boca. Al revés correría por encima de la vuelta exterior del circuito.
    const codoInterno = (entrada: CanvasPoint, objetivo: CanvasPoint): CanvasPoint =>
      (puerta!.lado === 'arriba' || puerta!.lado === 'abajo')
        ? { x: objetivo.x, y: entrada.y }
        : { x: entrada.x, y: objetivo.y }

    const entradaIda = puerta
      ? puntoPuerta(zone, puerta, -4, 12)
      : puntoEntradaZona(zone, c.ida[0])
    const rutaIda = rutearOrtogonal({ start: salida, goal: entradaIda, obstaculos, ocupadas, area })
    if (rutaIda) {
      marcarRuta(ocupadas, rutaIda)
      c.acometidaIda = puerta
        ? [...rutaIda, codoInterno(entradaIda, c.ida[0]), c.ida[0]]
        : [...rutaIda, c.ida[0]]
    }

    const finRetorno = c.retorno[c.retorno.length - 1]
    const entradaRetorno = puerta
      ? puntoPuerta(zone, puerta, 4, 12)
      : puntoEntradaZona(zone, finRetorno)
    const rutaRetorno = rutearOrtogonal({ start: salida, goal: entradaRetorno, obstaculos, ocupadas, area })
    if (rutaRetorno) {
      marcarRuta(ocupadas, rutaRetorno)
      c.acometidaRetorno = puerta
        ? [finRetorno, codoInterno(entradaRetorno, finRetorno), ...[...rutaRetorno].reverse()]
        : [finRetorno, ...[...rutaRetorno].reverse()]
    }

    if (rutaIda || rutaRetorno) {
      c.longitudAcometida = redondear(
        (longitudPx(c.acometidaIda) + longitudPx(c.acometidaRetorno)) / PIXELS_PER_METER
      )
      c.longitudTotal = redondear(c.longitudSerpentin + c.longitudAcometida)
      c.excedeLimite = c.longitudTotal > MAX_CIRCUIT_LENGTH_M
    }
  }
}

/**
 * Calcula todos los circuitos de todas las zonas de la planta actual.
 * Devuelve un array plano listo para dibujar y presupuestar, con las
 * acometidas ruteadas esquivando las habitaciones ajenas.
 */
export function calcularCircuitosPlanta(
  zones: FloorHeatingZone[],
  manifolds: Manifold[],
  tempImpulsionC: TempImpulsion = TEMP_IMPULSION_DEFAULT,
  rooms: Room[] = []
): FloorHeatingCircuit[] {
  const circuits = zones.flatMap(zone => {
    // Colector asignado a mano en la zona; si no hay (o ya no existe), el más cercano
    const manual = zone.manifoldId ? manifolds.find(m => m.id === zone.manifoldId) : undefined
    const manifold = manual ?? colectorMasCercano(zone, manifolds)
    // Habitación vinculada → la matemática usa su área real y reparte su carga
    // de diseño de PISO RADIANTE (W/m² según aislación, no el factor
    // volumétrico de radiadores — ver CARGA_PISO_WM2)
    const room = zone.roomId ? rooms.find(r => r.id === zone.roomId) : undefined
    const real: DatosReales | null = room
      ? { areaM2: room.area, cargaKcalh: cargaPisoKcalh(room) }
      : null
    const propios = calcularCircuitosZona(zone, manifold, tempImpulsionC, real)

    // Etiqueta con la numeración del colector (como leen los planos de obra):
    // "C2" = circuito del colector 2; "C2.1"/"C2.2" si la zona se divide.
    const nColector = manifold ? manifolds.indexOf(manifold) + 1 : null
    for (const c of propios) {
      c.colectorNumero = nColector
      if (nColector !== null) {
        c.etiqueta = propios.length > 1 ? `C${nColector}.${c.numero}` : `C${nColector}`
      }
    }
    return propios
  })
  rutearAcometidas(circuits, zones, manifolds)
  return circuits
}

// Circuitos que caen en cada colector (para el tope de 7 vías y el dibujo).
export function circuitosPorColector(circuits: FloorHeatingCircuit[]): Map<string, number> {
  const conteo = new Map<string, number>()
  for (const c of circuits) {
    if (!c.manifoldId) continue
    conteo.set(c.manifoldId, (conteo.get(c.manifoldId) ?? 0) + 1)
  }
  return conteo
}

// ============================================================
// MONTANTE CALDERA → COLECTOR (primaria Ø32, capa inferior)
// ============================================================

// Criterio de diseño: la primaria caldera↔colector es tubería de 32 mm (1"),
// va aislada (coquilla) por el contrapiso y se tiende ANTES que las placas,
// por eso PUEDE cruzar zonas de circuitos: es una capa inferior del sistema.
export const MONTANTE_DIAMETRO_MM = 32

export interface Montante {
  manifoldId: string
  boilerId: string
  ida: CanvasPoint[]      // caldera → colector
  retorno: CanvasPoint[]  // paralela desplazada
  longitudTotal: number   // m (ida + retorno)
  diametroMm: number
  labelPos: CanvasPoint
}

// Punto del borde de un rectángulo mirando hacia otro punto
function puntoBorde(
  rect: { x: number; y: number; width: number; height: number },
  hacia: CanvasPoint
): CanvasPoint {
  const cx = rect.x + rect.width / 2
  const cy = rect.y + rect.height / 2
  const dx = hacia.x - cx
  const dy = hacia.y - cy
  if (Math.abs(dx) >= Math.abs(dy)) {
    return { x: dx >= 0 ? rect.x + rect.width : rect.x, y: cy }
  }
  return { x: cx, y: dy >= 0 ? rect.y + rect.height : rect.y }
}

/**
 * Genera la montante de cada colector hasta la caldera más cercana de la
 * planta. Sin obstáculos (va por contrapiso), pero con peine entre montantes
 * para que no se encimen entre sí.
 */
export function calcularMontantes(
  manifolds: Manifold[],
  boilers: Boiler[],
  zones: FloorHeatingZone[]
): Montante[] {
  if (manifolds.length === 0 || boilers.length === 0) return []
  const area = areaDeTrabajo([...manifolds, ...boilers, ...zones])
  const ocupadas = new Set<string>()
  const montantes: Montante[] = []

  for (const manifold of manifolds) {
    let boiler: Boiler | null = null
    let mejorDist = Infinity
    const mcx = manifold.x + manifold.width / 2
    const mcy = manifold.y + manifold.height / 2
    for (const b of boilers) {
      const d = Math.hypot(b.x + b.width / 2 - mcx, b.y + b.height / 2 - mcy)
      if (d < mejorDist) {
        mejorDist = d
        boiler = b
      }
    }
    if (!boiler) continue

    const desde = puntoBorde(boiler, { x: mcx, y: mcy })
    const hasta = puntoBorde(manifold, {
      x: boiler.x + boiler.width / 2,
      y: boiler.y + boiler.height / 2,
    })

    const ida = rutearOrtogonal({ start: desde, goal: hasta, obstaculos: [], ocupadas, area })
      ?? [desde, { x: hasta.x, y: desde.y }, hasta]
    marcarRuta(ocupadas, ida)
    // Retorno: paralela desplazada 4 px (mismo truco visual que los circuitos)
    const retorno = ida.map(p => ({ x: p.x + 4, y: p.y + 4 }))

    const medio = ida[Math.floor(ida.length / 2)]
    montantes.push({
      manifoldId: manifold.id,
      boilerId: boiler.id,
      ida,
      retorno,
      longitudTotal: redondear((longitudPx(ida) * 2) / PIXELS_PER_METER),
      diametroMm: MONTANTE_DIAMETRO_MM,
      labelPos: { x: medio.x + 6, y: medio.y - 8 },
    })
  }
  return montantes
}
