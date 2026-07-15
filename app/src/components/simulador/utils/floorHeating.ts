// Cálculo de circuitos de piso radiante para el Simulador 2D.
// Convierte zonas dibujadas en el canvas (px) a serpentines reales (metros)
// usando el generador puro de lib/pisoRadiante/serpentin.ts, divide en
// circuitos de máximo 120 m y rutea las acometidas al colector.

import { generarSerpentin } from '../../../lib/pisoRadiante/serpentin';
import type { Punto, EsquinaBoca } from '../../../lib/pisoRadiante/serpentin';
import type { FloorHeatingZone, PuertaZona, LadoZona } from '../models/FloorHeatingZone';
import type { Manifold } from '../models/Manifold';
import type { Boiler } from '../models/Boiler';
import type { Room } from '../models/Room';
import { calculateRoomPower } from './thermalCalculator';
import { rutearOrtogonal, marcarRuta, areaDeTrabajo } from './orthogonalRouter';

// Misma escala que usa el resto del simulador para longitudes de tubería
// (ver useElementsStore.finishPipe / createManualPipe).
export const PIXELS_PER_METER = 50;

// Límite hidráulico por circuito con PE-X 20mm (ver UnderfloorService).
export const MAX_CIRCUIT_LENGTH_M = 120;

// Criterio de diseño: máximo de circuitos por colector (caudal y equilibrado).
// Los colectores comerciales llegan a 12 vías, pero el criterio de obra es 7.
export const MAX_CIRCUITOS_POR_COLECTOR = 7;

// Paso único de diseño: 15 cm con PE-X Ø20. El instalador no lo elige — aplica
// la regla y si el resultado da, es suficiente. Un paso más fino no sube el
// techo del piso (lo pone la superficie a 29°C, ver emisionKcalhM2): solo baja
// la temperatura de agua necesaria, y entre 15 y 20 son un par de grados
// porque manda la resistencia del mortero y el solado. No justifica una
// decisión más en la pantalla.
export const PASO_CM = 15 as const;

// Regla de obra: a paso 15 entran 7 m de tubo por m². (1/0,15 = 6,7 es la
// retícula ideal; los 7 agregan las curvas y el retorno.) La longitud
// presupuestada usa área × densidad —como calculan los fabricantes—, NO la
// geometría del dibujo, que descuenta margen perimetral y queda corta.
//
// Los metros NO entran en el cálculo de potencia: la emisión sale de la
// superficie del piso, no del caño que hay adentro. El largo de circuito es un
// límite hidráulico, no térmico.
export const DENSIDAD_M_POR_M2 = 7.0;

// Mobiliario fijo: bajo la bañadera, el mueble bajo mesada o el placard no se
// serpentea, así que la superficie útil es menor que la del ambiente. Sin este
// descuento el metraje se sobrepresupuesta: una recámara de 9,8 m² daba 94 m
// contra los ~90 que se manejan en obra.
//
// Aplica a los METROS y a la EMISIÓN (esa franja no lleva caño, así que no
// emite), pero NO a la carga del ambiente: la pieza pierde lo mismo tenga o no
// un placard adentro.
export const DESCUENTO_MOBILIARIO_FIJO = 0.10;

/** Superficie que efectivamente se serpentea, descontando el mobiliario fijo. */
export function areaEmisoraM2(areaM2: number): number {
  return areaM2 * (1 - DESCUENTO_MOBILIARIO_FIJO);
}

// Emisión del piso según la temperatura de impulsión del agua. Suelo pétreo,
// ambiente de diseño 20°C, salto ida-retorno 5°C → temperatura media del agua
// = impulsión − 2,5°C. Característica lineal aproximada q ≈ 4,5 W/m²·K sobre
// el salto agua-ambiente, con tope 100 W/m²:
//   35°C → ~56 W/m² ≈ 48 kcal/h·m²
//   40°C → ~79 W/m² ≈ 68 kcal/h·m²
//   45°C → 100 W/m² (tope) ≈ 86 kcal/h·m²
//
// El tope no lo pone el agua ni el caño: lo pone que la superficie del piso no
// puede pasar de ~29°C sin dejar de ser pisable. Eso no es una convención
// importada — es la planta del pie, y es igual acá que en cualquier lado.
// Por eso ni achicar el paso ni sumar metros lo mueven: solo bajan la
// temperatura de agua necesaria para llegar al mismo techo.
export const TEMPERATURAS_IMPULSION = [35, 40, 45] as const;
export type TempImpulsion = (typeof TEMPERATURAS_IMPULSION)[number];
export const TEMP_IMPULSION_DEFAULT: TempImpulsion = 45;

export function emisionKcalhM2(impulsionC: TempImpulsion): number {
  const mediaAgua = impulsionC - 2.5;
  const wM2 = Math.min(4.5 * (mediaAgua - 20), 100);
  return Math.round(wM2 * 0.86); // 1 W = 0,86 kcal/h
}

// ── Carga de diseño del piso ────────────────────────────────────────────────
// El piso NO se mide contra calculateRoomPower(). Esa función da la potencia
// de RADIADOR del ambiente, que es otra cosa, y compararla con la emisión del
// piso rompía el simulador: de las 144 configuraciones posibles (factor ×
// altura × pared exterior × ventanas), el piso daba insuficiente en las 144.
// Con factor 50 la pieza necesitaba 1,72 m de techo para aprobar. Nunca daba
// verde en ningún caso.
//
// El PR #14 se apoyó en la premisa de que "la carga depende de la envolvente,
// NO del emisor que se le cuelgue". Suena obvio y es falsa: el emisor fija el
// perfil de temperaturas del aire y la envolvente pierde según ese perfil.
// Para el MISMO ambiente, el piso pide menos que un radiador, por tres motivos
// medibles:
//
//  1. Zona ocupada. El piso trabaja sobre los primeros ~1,8 m y no genera la
//     convección que llevaría calor al techo. Multiplicar por la altura le
//     cobra un aire que no tiene que calentar — y castiga al piso justo en
//     techos altos, que es donde el simulador lo recomienda (ver
//     consideraciones: techo >3 m no lleva radiadores). Por eso la carga del
//     piso es por m² y NO escala con la altura.
//  2. Temperatura operativa. El intercambio del piso es ~65% radiación. Con el
//     piso a 28°C la temperatura radiante media sube, y el confort se logra
//     con el aire ~6°C más bajo que con radiadores. La envolvente pierde según
//     el aire, no según el confort: ~27% menos.
//  3. Sin estratificación. Con radiadores el aire caliente apoya ~5°C de más
//     contra el techo, que en nivel único sin aislar se lleva 30-40% de la
//     pérdida (cap3-perdidas). Con piso el perfil queda plano: ~31% menos.
//
// Los tres explican 1,45x. El resto hasta 2,3x es margen de intermitencia que
// el factor volumétrico trae por ser regla de dimensionamiento de radiador
// (el radiador arranca la casa fría y tiene que recuperarla rápido; el piso
// trabaja continuo y solo iguala la pérdida en régimen).
//
// CALIBRACIÓN (Edgardo, 70+ obras): a 40°C de impulsión el piso entrega 79
// W/m² y en casa bien aislada sobraba, al punto de bajar la impulsión. Eso
// acota la pérdida real y valida este rango — que es el mismo que el PR #14
// borró por parecer un fudge. No era un fudge: era el dato de obra, sin la
// justificación que ahora está escrita arriba.
//
// El nivel de aislación ya lo elige el usuario con thermalFactor (40/50/60),
// así que se reusa esa entrada en vez de pedirle un dato más.
export const CARGA_PISO_WM2: Record<40 | 50 | 60, number> = {
  40: 60,  // bien aislada
  50: 80,  // media (default)
  60: 100, // mal aislada — la mayoría del parque argentino
};

// OJO con el tope: 100 W/m² es a la vez la carga de "mal aislada" y el máximo
// que el piso entrega a 45°C. En ese caso la cobertura da exactamente 100% —
// es correcto (el piso solo llega justo), pero por eso el rango NO puede ser
// 100 fijo para todas: compararía un número contra sí mismo y el cálculo
// dejaría de discriminar.
export function cargaPisoKcalh(room: Pick<Room, 'area' | 'thermalFactor'>): number {
  return Math.round(room.area * CARGA_PISO_WM2[room.thermalFactor] * 0.86);
}

// El límite físico del piso (~100 W/m²: la superficie no pasa de 29°C o deja
// de ser pisable) sigue vivo en emisionKcalhM2(). Que ese techo quede por
// debajo de la carga es un resultado legítimo — significa que el piso solo no
// alcanza — pero ahora se compara contra la vara correcta.

// Vara de diseño del ambiente según lo que se le cuelga. Existe porque la
// carga NO es independiente del emisor (ver arriba), y hay dos varas legítimas:
//
//   piso, sin radiadores → cargaPisoKcalh()      (por m², perfil de radiación)
//   todo lo demás        → calculateRoomPower()  (volumétrica, con estratificación)
//
// Solo el piso puro cambia de vara, y por eso hacen falta los DOS flags: una
// habitación sin ningún emisor tiene que seguir mostrando la carga de radiador,
// que es el default de la obra — si mirara `!tieneRadiadores` a secas, una
// pieza vacía caería en la vara del piso y mostraría un número que no le
// corresponde.
//
// El mixto usa la vara del radiador a propósito: apenas hay un radiador en la
// pieza aparece la convección y con ella la estratificación, así que el perfil
// deja de ser el del piso. Además es el lado conservador — no afloja nada de
// lo que hoy funciona con radiadores, que es el 90% de la obra. En obra el
// mixto casi no se usa (doble circuito = doble costo).
export function cargaDeDisenoKcalh(
  room: Pick<Room, 'area' | 'height' | 'thermalFactor' | 'hasExteriorWall' | 'windowsLevel'>,
  tieneRadiadores: boolean,
  tienePiso: boolean
): number {
  const soloPiso = tienePiso && !tieneRadiadores;
  return soloPiso ? cargaPisoKcalh(room) : calculateRoomPower(room);
}

// Impulsión mínima que cubre una carga dada. Sirve para el caso sano —cuando
// el piso sobra— porque ahí la pregunta del instalador no es "¿alcanza?" sino
// "¿hasta dónde puedo bajar el agua?". Devuelve null si ni 45°C alcanzan.
export function impulsionMinimaParaCarga(cargaKcalhM2: number): TempImpulsion | null {
  return TEMPERATURAS_IMPULSION.find(t => emisionKcalhM2(t) >= cargaKcalhM2) ?? null;
}

// Cobertura del piso sobre la carga del ambiente. Devuelve el veredicto en
// crudo para que la UI, el PDF y el presupuesto cuenten todos lo mismo.
export function coberturaPiso(
  entregaKcalh: number,
  requeridoKcalh: number
): { coberturaPct: number; suficiente: boolean; faltanteKcalh: number } {
  if (requeridoKcalh <= 0) {
    return { coberturaPct: 0, suficiente: false, faltanteKcalh: 0 };
  }
  return {
    coberturaPct: Math.round((entregaKcalh / requeridoKcalh) * 100),
    suficiente: entregaKcalh >= requeridoKcalh,
    faltanteKcalh: Math.max(0, Math.round(requeridoKcalh - entregaKcalh)),
  };
}

// ── Puerta de la zona ───────────────────────────────────────────────────────
// En obra la acometida entra a la habitación por la puerta, no atraviesa una
// pared (tipos LadoZona/PuertaZona en el modelo FloorHeatingZone).

// Punto de la puerta en px del canvas (posición libre del marcador).
export function puntoPuerta(puerta: PuertaZona): CanvasPoint {
  return { x: puerta.x, y: puerta.y }
}

// Pared de la zona que la acometida atraviesa. La orientación —que el usuario
// elige, como en un radiador— fija el EJE: horizontal → pared de arriba/abajo;
// vertical → pared izquierda/derecha. El lado concreto lo decide de qué lado
// del centro de la zona quedó la puerta.
export function ladoDesdePuerta(zone: FloorHeatingZone, puerta: PuertaZona): LadoZona {
  if (puerta.orientacion === 'horizontal') {
    return puerta.y < zone.y + zone.height / 2 ? 'arriba' : 'abajo'
  }
  return puerta.x < zone.x + zone.width / 2 ? 'izquierda' : 'derecha'
}

// Crea la puerta al marcarla: se ubica en el punto clickeado y toma la
// orientación de la pared más cercana (horizontal si cae en arriba/abajo).
export function crearPuerta(zone: FloorHeatingZone, p: CanvasPoint): PuertaZona {
  const dParedesH = Math.min(Math.abs(p.y - zone.y), Math.abs(p.y - (zone.y + zone.height)))
  const dParedesV = Math.min(Math.abs(p.x - zone.x), Math.abs(p.x - (zone.x + zone.width)))
  return { x: p.x, y: p.y, orientacion: dParedesH <= dParedesV ? 'horizontal' : 'vertical' }
}

// Puerta ubicada en el punto medio de un lado de la zona (lo usa el análisis
// con IA, que devuelve por qué lado abre la puerta de cada ambiente).
export function puertaEnLado(zone: FloorHeatingZone, lado: LadoZona, t = 0.5): PuertaZona {
  switch (lado) {
    case 'arriba':
      return { x: zone.x + zone.width * t, y: zone.y, orientacion: 'horizontal' }
    case 'abajo':
      return { x: zone.x + zone.width * t, y: zone.y + zone.height, orientacion: 'horizontal' }
    case 'izquierda':
      return { x: zone.x, y: zone.y + zone.height * t, orientacion: 'vertical' }
    case 'derecha':
      return { x: zone.x + zone.width, y: zone.y + zone.height * t, orientacion: 'vertical' }
  }
}

// Entrega máxima de una zona completa: área × emisión a la impulsión de
// diseño. Es la misma cuenta que suman los circuitos de la zona (cada franja
// aporta su área × emisión), sin necesidad de generar los serpentines.
export function potenciaZonaKcalh(
  zone: FloorHeatingZone,
  tempImpulsionC: TempImpulsion
): number {
  const areaM2 = (zone.width / PIXELS_PER_METER) * (zone.height / PIXELS_PER_METER);
  // Emite la superficie serpenteada, no la del ambiente: bajo el mobiliario
  // fijo no hay caño (ver DESCUENTO_MOBILIARIO_FIJO).
  return Math.round(areaEmisoraM2(areaM2) * emisionKcalhM2(tempImpulsionC));
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
  cargaKcalh: number | null // carga del ambiente para piso (cargaPisoKcalh)
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
  const puntoDoor: CanvasPoint | null = zone.puerta ? puntoPuerta(zone.puerta) : null

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
        serpentin = generarSerpentin(anchoM, altoM, PASO_CM, 10, boca)
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
      // El caño va sobre la superficie útil: bajo el mobiliario fijo no se
      // serpentea (ver DESCUENTO_MOBILIARIO_FIJO). El areaM2 sin descontar se
      // conserva para los materiales que sí cubren todo el piso —placa
      // aislante, malla, banda perimetral—.
      const areaM2 = redondear(anchoM * altoM * escala)
      const areaUtil = areaEmisoraM2(areaM2)
      const longitudSerpentin = redondear(areaUtil * DENSIDAD_M_POR_M2)
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
        pasoCm: PASO_CM,
        areaM2,
        potenciaKcalh: Math.round(areaUtil * emisionKcalhM2(tempImpulsionC)),
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

// Separación paralela entre ida y retorno de la acometida (px). El retorno es
// la traza de la ida desplazada PERPENDICULAR a un lado fijo; ambas viajan
// juntas del colector a la zona, como en la misma canaleta de obra.
const ACOM_OFFSET = 4

// Quita puntos consecutivos repetidos (evita segmentos de longitud 0, que
// romperían el cálculo de la normal en la paralela).
function dedupe(pts: CanvasPoint[]): CanvasPoint[] {
  const out: CanvasPoint[] = []
  for (const p of pts) {
    const q = out[out.length - 1]
    if (!q || Math.abs(q.x - p.x) > 0.01 || Math.abs(q.y - p.y) > 0.01) out.push({ ...p })
  }
  return out
}

// Desplaza una polilínea ORTOGONAL `d` px hacia UN LADO FIJO del sentido de
// avance (izquierda del avance si d>0). Así ida y retorno quedan PARALELAS y no
// se cruzan nunca. El offset diagonal constante anterior (+d,+d) cambiaba de
// lado al invertir el sentido de un tramo, y ahí las líneas se cruzaban (bug
// del cruce rojo/azul antes de la puerta).
function desplazarParalelaOrto(ruta: CanvasPoint[], d: number): CanvasPoint[] {
  const p = dedupe(ruta)
  if (p.length < 2) return p.map(q => ({ ...q }))
  // Normal izquierda de cada segmento (su dirección rotada +90°).
  const normal = (i: number): CanvasPoint => ({
    x: -Math.sign(p[i + 1].y - p[i].y),
    y: Math.sign(p[i + 1].x - p[i].x),
  })
  const out: CanvasPoint[] = []
  const n0 = normal(0)
  out.push({ x: p[0].x + n0.x * d, y: p[0].y + n0.y * d })
  for (let i = 1; i < p.length - 1; i++) {
    // Vértice interno = escuadra ortogonal: sumar las normales de los dos
    // segmentos que lo forman da el corrimiento correcto del codo en L.
    const a = normal(i - 1)
    const b = normal(i)
    out.push({ x: p[i].x + (a.x + b.x) * d, y: p[i].y + (a.y + b.y) * d })
  }
  const nL = normal(p.length - 2)
  out.push({ x: p[p.length - 1].x + nL.x * d, y: p[p.length - 1].y + nL.y * d })
  return out
}

// Punto de acometida por FUERA de la puerta (meta del A*): `fueraPx` lo aleja
// perpendicular a la pared hacia el pasillo y `alongPx` lo corre a lo largo de
// la pared, para separar ida de retorno.
function entradaPuerta(
  puerta: PuertaZona,
  lado: LadoZona,
  alongPx: number,
  fueraPx: number
): CanvasPoint {
  switch (lado) {
    case 'arriba':    return { x: puerta.x + alongPx, y: puerta.y - fueraPx }
    case 'abajo':     return { x: puerta.x + alongPx, y: puerta.y + fueraPx }
    case 'izquierda': return { x: puerta.x - fueraPx, y: puerta.y + alongPx }
    case 'derecha':   return { x: puerta.x + fueraPx, y: puerta.y + alongPx }
  }
}

/**
 * Tramo entre el punto de acometida (apenas afuera de la puerta) y la boca del
 * serpentín. La cañería CRUZA la puerta EN LÍNEA RECTA y llega a la boca con un
 * solo codo. En obra estos caños van por DEBAJO del piso: la puerta es solo un
 * marcador de por dónde entra/sale la tubería, así que el caño la ATRAVIESA
 * derecho — no la esquiva ni se escalona (pedido de Edgardo). `entrada` es el
 * punto apenas afuera de la puerta (meta del A*), alineado con ella.
 */
function tramoPuertaBoca(
  lado: LadoZona,
  entrada: CanvasPoint,
  boca: CanvasPoint
): CanvasPoint[] {
  if (lado === 'arriba' || lado === 'abajo') {
    // Pared horizontal → cruza VERTICAL y recto por la puerta, después el codo.
    return [entrada, { x: entrada.x, y: boca.y }, boca]
  }
  // Pared vertical → cruza HORIZONTAL y recto por la puerta, después el codo.
  return [entrada, { x: boca.x, y: entrada.y }, boca]
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

    // Se arma UNA sola traza completa (la IDA): A* del colector hasta apenas
    // afuera de la puerta + cruce RECTO por la puerta hasta la boca. El RETORNO
    // es esa MISMA traza desplazada ACOM_OFFSET px PERPENDICULAR a un lado fijo,
    // así ida y retorno viajan perfectamente paralelas del colector a la zona,
    // sin escalones ni cruces. Solo su extremo interno se ancla en la cola de
    // retorno real del serpentín para calzar con el circuito. En obra ambas van
    // juntas por la misma canaleta bajo el piso; la puerta es solo el marcador.
    const finRetorno = c.retorno[c.retorno.length - 1]
    const entradaIda = puerta
      ? entradaPuerta(puerta, ladoDesdePuerta(zone, puerta), 0, 12)
      : puntoEntradaZona(zone, c.ida[0])
    const rutaIda = rutearOrtogonal({ start: salida, goal: entradaIda, obstaculos, ocupadas, area })
    if (rutaIda) {
      marcarRuta(ocupadas, rutaIda)
      const acomIda = puerta
        ? [...rutaIda, ...tramoPuertaBoca(ladoDesdePuerta(zone, puerta), entradaIda, c.ida[0])]
        : [...rutaIda, c.ida[0]]
      c.acometidaIda = acomIda
      // Retorno = ida desplazada PERPENDICULAR a un lado fijo (paralela real,
      // nunca cruza), recorrida al revés (de la zona al colector). El lado se
      // elige según de qué lado del último tramo cae la cola del serpentín, para
      // que la paralela llegue a la cola sin volver a cruzar la ida; y el extremo
      // interno se reemplaza por esa cola real para calzar con el circuito.
      const dedup = dedupe(acomIda)
      const fin = dedup[dedup.length - 1]
      const pen = dedup[dedup.length - 2] ?? dedup[0]
      const dir = { x: Math.sign(fin.x - pen.x), y: Math.sign(fin.y - pen.y) }
      const normalIzq = { x: -dir.y, y: dir.x }
      const rel = { x: finRetorno.x - fin.x, y: finRetorno.y - fin.y }
      const ladoIzq = rel.x * normalIzq.x + rel.y * normalIzq.y >= 0
      const paralela = desplazarParalelaOrto(acomIda, ladoIzq ? ACOM_OFFSET : -ACOM_OFFSET)
      paralela[paralela.length - 1] = finRetorno
      c.acometidaRetorno = paralela.reverse()

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
    // Habitación vinculada → la matemática usa su área real y reparte la carga
    // del ambiente entre los circuitos
    const room = zone.roomId ? rooms.find(r => r.id === zone.roomId) : undefined
    const real: DatosReales | null = room
      ? { areaM2: room.area, cargaKcalh: cargaDeDisenoKcalh(room, room.radiatorIds.length > 0, true) }
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
