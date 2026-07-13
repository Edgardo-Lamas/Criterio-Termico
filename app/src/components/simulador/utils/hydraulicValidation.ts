// Validación hidráulica de la instalación (cierre del tema Venturi/diámetros).
//
// El dimensionado por velocidad (pipeDimensioning) dice si el CAÑO tiene el
// grosor correcto. Esto es una pregunta distinta: ¿la bomba que trae la caldera
// tiene fuerza para EMPUJAR el agua por el circuito más desfavorable?
//
// Se calcula la pérdida de carga (ΔP) del "circuito índice" — el de mayor
// resistencia, casi siempre el serpentín de piso más largo o el ramal de
// radiadores más lejano — y se compara con la altura útil de la bomba. El
// resultado es una DECISIÓN de obra en lenguaje llano (la bomba lo mueve /
// subí un diámetro / poné una bomba), no un renglón de precio.
//
// Criterio validado con Edgardo (2026-07-12) sobre el manual de la circuladora
// Grundfos UPS 15-60 (la más usada en calderas murales, similar entre marcas).

import type { PipeSegment } from '../models/PipeSegment';
import type { Radiator } from '../models/Radiator';
import type { FloorHeatingBudget } from './floorHeatingBudget';
import { calculatePipePowers } from './pipeDimensioning';

// ── Constantes de criterio (ajustables) ────────────────────────────────────

// Altura máxima de la bomba de la mural típica (mca): Grundfos UPS 15-60 en
// Velocidad III entrega 6,0 m (el "60" de la designación = 6,0 m). Calibrado con
// obras reales de Edgardo (2026-07-13): ramales de ~5 m calientan bien y con
// equilibrado hidráulico se resuelven plantas más extensas, así que 5,5 marcaba
// falsos "al límite". Por eso el veredicto de obra arranca por poner la bomba en
// Velocidad III (donde estos 6,0 m son reales) y equilibrar con los detentores.
// Cada caldera del catálogo puede definir la suya (BoilerModel.alturaBombaMca).
export const ALTURA_BOMBA_DEFAULT_MCA = 6.0;

// Exigimos que el circuito índice consuma como máximo el 90% de lo que da la
// bomba: 10% de margen para envejecimiento, suciedad y equilibrado real.
export const MARGEN_BOMBA = 0.9;

// Coeficiente de Hazen-Williams para PE-X / multicapa (tubo liso).
const C_HAZEN_WILLIAMS = 150;

// Salto térmico de diseño. Radiadores ΔT=10 °C (igual que todo el simulador).
// El piso trabaja con salto chico (más caudal → más pérdida): criterio
// conservador para no aprobar de más.
const DELTA_T_RADIADORES = 10;
const DELTA_T_PISO = 5;

// Pérdidas locales (codos, tees, válvulas): longitud equivalente de oficio,
// +30% sobre la fricción del tramo recto.
const FACTOR_PERDIDAS_LOCALES = 1.3;

// Pérdida fija del emisor y sus accesorios.
const DP_EMISOR_RADIADOR_MCA = 0.1; // cuerpo del radiador + llaves
const DP_COLECTOR_PISO_MCA = 0.3;   // colector + caudalímetros + detentores

// Ø interior aproximado (mm) según Ø exterior de PE-X/multicapa.
const DIAM_INTERIOR_MM: Record<number, number> = {
  16: 12.5,
  20: 16,
  25: 20.5,
  32: 26.5,
  40: 32.5,
};

function diamInterior(diamExtMm: number | undefined): number {
  if (!diamExtMm) return DIAM_INTERIOR_MM[20];
  return DIAM_INTERIOR_MM[diamExtMm] ?? diamExtMm * 0.82;
}

const r1 = (n: number) => Math.round(n * 10) / 10;

/**
 * Pérdida de carga por fricción de un tramo recto, en metros de columna de
 * agua (mca), por Hazen-Williams (unidades SI).
 *   h_f = 10,67 · L · Q^1,852 / (C^1,852 · d^4,87)
 * L en m, caudal en L/h, Ø interior en mm. Devuelve 0 con datos no válidos.
 */
export function perdidaFriccionMca(
  largoM: number,
  caudalLh: number,
  diamIntMm: number,
): number {
  if (largoM <= 0 || caudalLh <= 0 || diamIntMm <= 0) return 0;
  const Q = caudalLh / 1000 / 3600; // L/h → m³/s
  const d = diamIntMm / 1000;       // mm → m
  return (
    (10.67 * largoM * Math.pow(Q, 1.852)) /
    (Math.pow(C_HAZEN_WILLIAMS, 1.852) * Math.pow(d, 4.87))
  );
}

export type VeredictoHidraulico = 'ok' | 'limite' | 'insuficiente';

export interface CircuitoHidraulico {
  etiqueta: string;
  tipo: 'radiadores' | 'piso';
  deltaPMca: number; // pérdida de carga total del circuito (ida + retorno + emisor)
}

export interface ValidacionHidraulica {
  veredicto: VeredictoHidraulico;
  disponibleMca: number;    // altura útil de la bomba
  indiceMca: number;        // ΔP del circuito índice (el más exigente)
  circuitoIndice: string;   // etiqueta del circuito índice
  circuitos: CircuitoHidraulico[]; // todos, ordenados de mayor a menor ΔP
  mensaje: string;          // veredicto en lenguaje llano de oficio
  detalle: string;          // qué hacer, con el número técnico en segundo plano
}

// ΔP del ramal de un radiador identificado (para mostrar dato por dato en la
// planilla de radiadores).
export interface RamalRadiadorHidraulico {
  radiatorId: string;
  deltaPMca: number;
}

/**
 * ΔP del ramal de CADA radiador. Recorre el grafo de tuberías de ida desde el
 * radiador hasta la caldera sumando la fricción de cada tramo (cada uno con su
 * propio caudal según la potencia acumulada que transporta). La ida y el
 * retorno son simétricos → se duplica; se suma la pérdida del propio radiador.
 */
function analizarRadiadoresDetalle(
  pipes: PipeSegment[],
  radiators: Radiator[],
): RamalRadiadorHidraulico[] {
  const supply = pipes.filter((p) => p.pipeType === 'supply');
  if (supply.length === 0 || radiators.length === 0) return [];

  const powers = calculatePipePowers(pipes, radiators); // pipeId → kcal/h
  const byId = new Map(supply.map((p) => [p.id, p]));
  const res: RamalRadiadorHidraulico[] = [];

  for (const rad of radiators) {
    // El ramal que entra a este radiador
    const branch = supply.find((p) => p.toElementId === rad.id);
    if (!branch) continue;

    let friccion = 0;
    let ultimoCaudal = rad.power / DELTA_T_RADIADORES; // fallback inicial
    let cur: PipeSegment | undefined = branch;
    const visto = new Set<string>();

    while (cur && !visto.has(cur.id)) {
      visto.add(cur.id);
      const power = powers.get(cur.id) ?? 0;
      // Si el tramo no tiene potencia calculada (p. ej. montante vertical con
      // toElementId a un id lógico), reusamos el caudal del tramo anterior.
      const caudal = power > 0 ? power / DELTA_T_RADIADORES : ultimoCaudal;
      ultimoCaudal = caudal;
      friccion += perdidaFriccionMca(cur.length ?? 0, caudal, diamInterior(cur.diameter));
      cur = cur.fromElementId ? byId.get(cur.fromElementId) : undefined;
    }

    const deltaP = friccion * 2 * FACTOR_PERDIDAS_LOCALES + DP_EMISOR_RADIADOR_MCA;
    res.push({ radiatorId: rad.id, deltaPMca: deltaP });
  }

  return res;
}

function analizarRadiadores(
  pipes: PipeSegment[],
  radiators: Radiator[],
): CircuitoHidraulico[] {
  const detalle = analizarRadiadoresDetalle(pipes, radiators);
  if (detalle.length === 0) return [];
  const peor = detalle.reduce((a, b) => (b.deltaPMca > a.deltaPMca ? b : a));
  return [
    { etiqueta: 'el ramal de radiadores más largo', tipo: 'radiadores', deltaPMca: peor.deltaPMca },
  ];
}

/**
 * ΔP y veredicto por radiador, para incluir como dato en la planilla de
 * radiadores. Clave: radiatorId. Devuelve mapa vacío si aún no hay tuberías.
 */
export function validarRamalesRadiadores(
  pipes: PipeSegment[],
  radiators: Radiator[],
  alturaBombaMca: number = ALTURA_BOMBA_DEFAULT_MCA,
): Map<string, { deltaPMca: number; estado: VeredictoHidraulico }> {
  const map = new Map<string, { deltaPMca: number; estado: VeredictoHidraulico }>();
  for (const r of analizarRadiadoresDetalle(pipes, radiators)) {
    map.set(r.radiatorId, {
      deltaPMca: r1(r.deltaPMca),
      estado: estadoCircuito(r.deltaPMca, alturaBombaMca),
    });
  }
  return map;
}

// ΔP de un circuito de piso identificado (para mostrar dato por dato en la
// tabla de circuitos). Incluye zoneId + etiqueta para poder cruzarlo con la fila.
export interface CircuitoPisoHidraulico {
  zoneId: string;
  etiqueta: string;
  deltaPMca: number;
}

/**
 * ΔP de cada circuito de piso radiante. El serpentín es el tramo más largo y de
 * menor diámetro → suele ser el circuito índice de toda la instalación. A la
 * pérdida del propio circuito se le suma la de la primaria caldera→colector
 * (montante Ø32, compartida) prorrateada al caudal total del piso.
 */
function analizarPisoDetalle(fh: FloorHeatingBudget | null): CircuitoPisoHidraulico[] {
  if (!fh || fh.circuits.length === 0) return [];

  const caudalTotalPiso = fh.potenciaTotalKcalh / DELTA_T_PISO; // L/h
  const dpMontante =
    perdidaFriccionMca(fh.longitudMontantesM, caudalTotalPiso, DIAM_INTERIOR_MM[32]) *
    FACTOR_PERDIDAS_LOCALES;

  return fh.circuits.map((c) => {
    const carga = c.cargaKcalh ?? c.potenciaKcalh;
    const caudal = carga / DELTA_T_PISO; // L/h
    // longitudTotal ya es el recorrido completo del caracol (ida y vuelta) más
    // la acometida al colector, en Ø20 (interior 16 mm) → no se duplica.
    const dpLoop =
      perdidaFriccionMca(c.longitudTotal, caudal, DIAM_INTERIOR_MM[20]) *
      FACTOR_PERDIDAS_LOCALES;
    return {
      zoneId: c.zoneId,
      etiqueta: c.etiqueta,
      deltaPMca: dpLoop + DP_COLECTOR_PISO_MCA + dpMontante,
    };
  });
}

function analizarPiso(fh: FloorHeatingBudget | null): CircuitoHidraulico[] {
  const nombrePorZona = new Map((fh?.circuits ?? []).map((c) => [c.zoneId, c.zoneName]));
  return analizarPisoDetalle(fh).map((d) => ({
    etiqueta: `${nombrePorZona.get(d.zoneId) ?? ''} ${d.etiqueta}`.trim(),
    tipo: 'piso' as const,
    deltaPMca: d.deltaPMca,
  }));
}

/** Veredicto de un circuito según su ΔP y la altura útil de la bomba. */
export function estadoCircuito(
  deltaPMca: number,
  alturaBombaMca: number,
): VeredictoHidraulico {
  const ratio = deltaPMca / alturaBombaMca;
  if (ratio <= MARGEN_BOMBA) return 'ok';
  if (ratio <= 1) return 'limite';
  return 'insuficiente';
}

/**
 * ΔP y veredicto por circuito de piso, para incluir como dato en la tabla de
 * circuitos (panel y PDF). Clave: `${zoneId}#${etiqueta}`.
 */
export function validarCircuitosPiso(
  fh: FloorHeatingBudget | null,
  alturaBombaMca: number = ALTURA_BOMBA_DEFAULT_MCA,
): Map<string, { deltaPMca: number; estado: VeredictoHidraulico }> {
  const map = new Map<string, { deltaPMca: number; estado: VeredictoHidraulico }>();
  for (const d of analizarPisoDetalle(fh)) {
    map.set(`${d.zoneId}#${d.etiqueta}`, {
      deltaPMca: r1(d.deltaPMca),
      estado: estadoCircuito(d.deltaPMca, alturaBombaMca),
    });
  }
  return map;
}

/**
 * Valida si la bomba de la caldera mueve la instalación. Devuelve null si no
 * hay nada que validar todavía (sin tuberías de radiadores ni piso).
 */
export function validarHidraulica(
  pipes: PipeSegment[],
  radiators: Radiator[],
  floorHeating: FloorHeatingBudget | null,
  alturaBombaMca: number = ALTURA_BOMBA_DEFAULT_MCA,
): ValidacionHidraulica | null {
  const circuitos = [
    ...analizarRadiadores(pipes, radiators),
    ...analizarPiso(floorHeating),
  ].sort((a, b) => b.deltaPMca - a.deltaPMca);

  if (circuitos.length === 0) return null;

  const indice = circuitos[0];
  const indiceMca = r1(indice.deltaPMca);
  const disponibleMca = r1(alturaBombaMca);
  const ratio = indice.deltaPMca / alturaBombaMca;

  let veredicto: VeredictoHidraulico;
  let mensaje: string;
  let detalle: string;

  if (ratio <= MARGEN_BOMBA) {
    veredicto = 'ok';
    mensaje = 'La bomba de la caldera mueve la instalación con holgura.';
    detalle =
      `El circuito más exigente (${indice.etiqueta}) necesita ${indiceMca} m y la ` +
      `bomba entrega ${disponibleMca} m: queda margen de sobra.`;
  } else if (ratio <= 1) {
    veredicto = 'limite';
    mensaje = 'La instalación queda al límite de lo que empuja la bomba de la caldera.';
    detalle =
      `El circuito más exigente (${indice.etiqueta}) necesita ${indiceMca} m y la ` +
      `bomba entrega ${disponibleMca} m: queda justo. Poné la bomba en velocidad ` +
      `máxima (III) y equilibrá con los detentores de los radiadores más cercanos, ` +
      `para mandarle más caudal a ese ramal. Con eso llega sin problema; si aun así ` +
      `ese ambiente queda frío, subí un diámetro en el troncal de ese ramal.`;
  } else {
    veredicto = 'insuficiente';
    mensaje = 'La bomba de la caldera no llega a mover el circuito más largo.';
    detalle =
      `El circuito más exigente (${indice.etiqueta}) pide ${indiceMca} m y la bomba ` +
      `entrega ${disponibleMca} m. Primero poné la bomba en velocidad máxima (III) y ` +
      `equilibrá con los detentores (cerrá un poco los radiadores cercanos para forzar ` +
      `el caudal a ese ramal). Si aun así queda frío, ` +
      `${indice.tipo === 'piso'
        ? 'dividí ese serpentín en circuitos más cortos o acercá el colector'
        : 'subí un diámetro en el troncal de ese ramal o dividilo en dos ramales más cortos'}` +
      `; como último recurso, sumá una bomba para ese circuito (o un separador hidráulico).`;
  }

  return {
    veredicto,
    disponibleMca,
    indiceMca,
    circuitoIndice: indice.etiqueta,
    circuitos: circuitos.map((c) => ({ ...c, deltaPMca: r1(c.deltaPMca) })),
    mensaje,
    detalle,
  };
}
