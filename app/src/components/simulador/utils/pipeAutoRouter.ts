// Ruteo automático de tuberías caldera → radiadores (Etapa 2 del auto-diseño).
// Usa el mismo router A* ortogonal de las acometidas de piso radiante: cada
// radiador recibe su par ida/retorno desde la caldera más cercana de la
// planta, en peine (las celdas ocupadas penalizan, así los tramos corren en
// paralelo sin pisarse). Genera PipeSegment comunes: el instalador puede
// seleccionarlos y borrarlos como cualquier tubería manual.

import { rutearOrtogonal, marcarRuta, areaDeTrabajo } from './orthogonalRouter';
import type { RouterPoint } from './orthogonalRouter';
import { PIXELS_PER_METER } from './floorHeating';
import type { Radiator } from '../models/Radiator';
import type { Boiler } from '../models/Boiler';
import type { FloorHeatingZone } from '../models/FloorHeatingZone';
import type { PipeSegment, Point } from '../models/PipeSegment';

// Diámetro sugerido del ramal individual en bitubo (PE-X): con ΔT 10°C un
// Ø16 mueve cómodo hasta ~2.000 kcal/h; arriba de eso, Ø20. Es una
// sugerencia de diseño — el instalador puede cambiarlo en el panel.
export function diametroRamalMm(potenciaKcalh: number): number {
  return potenciaKcalh > 2000 ? 20 : 16;
}

// Conexiones del radiador en vista superior (las mismas que dibuja el canvas):
// vertical (rotado) → arriba, a 1/3 y 2/3 del ancho; horizontal → lado
// izquierdo, a 1/3 y 2/3 del alto.
function conexionesRadiador(rad: Radiator): { ida: Point; retorno: Point } {
  const OFFSET = 5;
  const isVertical = rad.height > rad.width;
  if (isVertical) {
    return {
      ida: { x: rad.x + rad.width / 3, y: rad.y + OFFSET },
      retorno: { x: rad.x + (2 * rad.width) / 3, y: rad.y + OFFSET },
    };
  }
  return {
    ida: { x: rad.x + OFFSET, y: rad.y + rad.height / 3 },
    retorno: { x: rad.x + OFFSET, y: rad.y + (2 * rad.height) / 3 },
  };
}

// Punto de salida sobre el borde de la caldera que mira al radiador, con la
// vía repartida a lo largo del borde (t) para que los ramales salgan en peine
function salidaCaldera(boiler: Boiler, hacia: Point, t: number): Point {
  const cx = boiler.x + boiler.width / 2;
  const cy = boiler.y + boiler.height / 2;
  const dx = hacia.x - cx;
  const dy = hacia.y - cy;
  if (Math.abs(dx) >= Math.abs(dy)) {
    return { x: dx >= 0 ? boiler.x + boiler.width : boiler.x, y: boiler.y + boiler.height * t };
  }
  return { x: boiler.x + boiler.width * t, y: dy >= 0 ? boiler.y + boiler.height : boiler.y };
}

function longitudM(pts: Point[]): number {
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    total += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  }
  return Math.round((total / PIXELS_PER_METER) * 100) / 100;
}

// Camino en L de respaldo cuando el A* no encuentra ruta
function caminoEnL(desde: Point, hasta: Point): Point[] {
  return [desde, { x: hasta.x, y: desde.y }, hasta];
}

/**
 * Rutea ida y retorno desde la caldera más cercana hacia cada radiador de la
 * planta que todavía no tenga tuberías conectadas. Las zonas de piso radiante
 * son obstáculo (no atravesar un panel con ramales de radiadores); si el
 * router no encuentra camino, cae a una L directa.
 */
export function rutearTuberiasRadiadores(
  radiators: Radiator[],
  boilers: Boiler[],
  floorHeatingZones: FloorHeatingZone[],
  floor: 'ground' | 'first',
  pipesExistentes: PipeSegment[] = []
): PipeSegment[] {
  const boilersPlanta = boilers.filter(b => !b.floor || b.floor === floor);
  if (boilersPlanta.length === 0) return [];

  // Radiadores de la planta sin tubería conectada (ni como origen ni destino)
  const conectados = new Set(
    pipesExistentes.flatMap(p => [p.fromElementId, p.toElementId]).filter(Boolean)
  );
  const pendientes = radiators.filter(
    r => r.floor === floor && !conectados.has(r.id)
  );
  if (pendientes.length === 0) return [];

  const zonesPlanta = floorHeatingZones.filter(z => z.floor === floor);
  const area = areaDeTrabajo([...pendientes, ...boilersPlanta, ...zonesPlanta]);
  const ocupadas = new Set<string>();
  const nuevas: PipeSegment[] = [];

  // Vías por caldera para el peine (t = fracción a lo largo del borde)
  const viasPorCaldera = new Map<string, number>();

  for (const rad of pendientes) {
    // Caldera más cercana de la planta
    let boiler = boilersPlanta[0];
    let mejorDist = Infinity;
    const rcx = rad.x + rad.width / 2;
    const rcy = rad.y + rad.height / 2;
    for (const b of boilersPlanta) {
      const d = Math.hypot(b.x + b.width / 2 - rcx, b.y + b.height / 2 - rcy);
      if (d < mejorDist) {
        mejorDist = d;
        boiler = b;
      }
    }

    const conex = conexionesRadiador(rad);
    const slot = viasPorCaldera.get(boiler.id) ?? 0;
    viasPorCaldera.set(boiler.id, slot + 2);
    const tIda = Math.min((slot + 1) / 10, 0.9);
    const tRetorno = Math.min((slot + 2) / 10, 0.95);

    const diameter = diametroRamalMm(rad.power);
    const hecha = (
      pipeType: 'supply' | 'return',
      salida: Point,
      llegada: Point
    ): PipeSegment => {
      const ruta: RouterPoint[] | null = rutearOrtogonal({
        start: salida,
        goal: llegada,
        obstaculos: zonesPlanta,
        ocupadas,
        area,
      });
      const points = ruta ? [...ruta] : caminoEnL(salida, llegada);
      if (ruta) marcarRuta(ocupadas, ruta);
      return {
        id: `pipe-auto-${rad.id}-${pipeType}`,
        type: 'pipe',
        pipeType,
        points,
        diameter,
        material: 'pex',
        fromElementId: boiler.id,
        toElementId: rad.id,
        length: longitudM(points),
        floor,
      };
    };

    nuevas.push(hecha('supply', salidaCaldera(boiler, conex.ida, tIda), conex.ida));
    nuevas.push(hecha('return', salidaCaldera(boiler, conex.retorno, tRetorno), conex.retorno));
  }

  return nuevas;
}
