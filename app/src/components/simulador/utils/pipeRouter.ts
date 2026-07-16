import type { Radiator } from '../models/Radiator';
import type { Boiler } from '../models/Boiler';
import type { PipeSegment } from '../models/PipeSegment';
import type { FloorHeatingZone } from '../models/FloorHeatingZone';
// Única fuente de verdad del dimensionamiento (tabla por caudal, ΔT=10°C):
// acá había TRES copias de la tabla que podían divergir
import { calculateFlowRate, calculatePipeDiameter } from './pipeDimensioning';

// Diámetro por potencia acumulada (kcal/h) — atajo sobre la tabla común
function diametroPorPotencia(powerKcalh: number): number {
  return calculatePipeDiameter(calculateFlowRate(powerKcalh));
}

interface Point {
  x: number;
  y: number;
}

// Rectángulo a esquivar por el ruteo: radiadores y también zonas de piso
// radiante (una troncal no debe atravesar un panel de serpentines)
interface Obstaculo {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Encuentra el camino más corto ortogonal entre dos puntos
 * EVITANDO pasar por encima de radiadores
 * Intenta múltiples opciones y elige la que no cruza radiadores
 */
function findShortestPath(start: Point, end: Point, radiators?: Obstaculo[]): Point[] {
  const margin = 40; // Margen de seguridad alrededor del radiador

  // Función para verificar si un segmento de línea cruza un obstáculo
  const segmentIntersectsRadiator = (p1: Point, p2: Point): Obstaculo | undefined => {
    if (!radiators) return undefined;
    return radiators.find(rad => {
      const radLeft = rad.x - margin;
      const radRight = rad.x + rad.width + margin;
      const radTop = rad.y - margin;
      const radBottom = rad.y + rad.height + margin;

      if (p1.y === p2.y) {
        // Segmento horizontal
        const minX = Math.min(p1.x, p2.x);
        const maxX = Math.max(p1.x, p2.x);
        return p1.y >= radTop && p1.y <= radBottom &&
          maxX >= radLeft && minX <= radRight;
      } else if (p1.x === p2.x) {
        // Segmento vertical
        const minY = Math.min(p1.y, p2.y);
        const maxY = Math.max(p1.y, p2.y);
        return p1.x >= radLeft && p1.x <= radRight &&
          maxY >= radTop && minY <= radBottom;
      }
      return false;
    });
  };

  // Verificar si un path completo cruza algún radiador
  const pathCrossesRadiator = (path: Point[]): boolean => {
    for (let i = 0; i < path.length - 1; i++) {
      if (segmentIntersectsRadiator(path[i], path[i + 1])) {
        return true;
      }
    }
    return false;
  };

  // Opción 1: Ir horizontal primero, luego vertical (L-shape)
  const corner1 = { x: end.x, y: start.y };
  const path1: Point[] = [start, corner1, end];

  // Opción 2: Ir vertical primero, luego horizontal (L-shape invertido)
  const corner2 = { x: start.x, y: end.y };
  const path2: Point[] = [start, corner2, end];

  // Si no hay radiadores, elegir el path más directo
  if (!radiators || radiators.length === 0) {
    return Math.abs(end.x - start.x) >= Math.abs(end.y - start.y) ? path1 : path2;
  }

  // Verificar qué paths cruzan radiadores
  const path1Crosses = pathCrossesRadiator(path1);
  const path2Crosses = pathCrossesRadiator(path2);

  // Si uno no cruza, usarlo
  if (!path1Crosses) return path1;
  if (!path2Crosses) return path2;

  // Ambos cruzan - buscar un camino alternativo rodeando los radiadores
  // Encontrar el radiador que bloquea
  const blockingRad = segmentIntersectsRadiator(start, corner1) ||
    segmentIntersectsRadiator(corner1, end) ||
    segmentIntersectsRadiator(start, corner2) ||
    segmentIntersectsRadiator(corner2, end);

  if (blockingRad) {
    // Generar caminos alternativos rodeando el radiador
    const radLeft = blockingRad.x - margin;
    const radRight = blockingRad.x + blockingRad.width + margin;
    const radTop = blockingRad.y - margin;
    const radBottom = blockingRad.y + blockingRad.height + margin;

    // Opciones para rodear: por arriba, abajo, izquierda o derecha
    const alternatives: Point[][] = [];

    // Rodear por arriba
    if (start.y < radTop || end.y < radTop) {
      const waypoint = { x: (start.x + end.x) / 2, y: radTop - 10 };
      alternatives.push([start, { x: start.x, y: waypoint.y }, waypoint, { x: end.x, y: waypoint.y }, end]);
    }

    // Rodear por abajo
    if (start.y > radBottom || end.y > radBottom) {
      const waypoint = { x: (start.x + end.x) / 2, y: radBottom + 10 };
      alternatives.push([start, { x: start.x, y: waypoint.y }, waypoint, { x: end.x, y: waypoint.y }, end]);
    }

    // Rodear por izquierda
    if (start.x < radLeft || end.x < radLeft) {
      const waypoint = { x: radLeft - 10, y: (start.y + end.y) / 2 };
      alternatives.push([start, { x: waypoint.x, y: start.y }, waypoint, { x: waypoint.x, y: end.y }, end]);
    }

    // Rodear por derecha
    if (start.x > radRight || end.x > radRight) {
      const waypoint = { x: radRight + 10, y: (start.y + end.y) / 2 };
      alternatives.push([start, { x: waypoint.x, y: start.y }, waypoint, { x: waypoint.x, y: end.y }, end]);
    }

    // Buscar la primera alternativa que no cruce
    for (const altPath of alternatives) {
      if (!pathCrossesRadiator(altPath)) {
        return altPath;
      }
    }
  }

  // Fallback: devolver el path más corto aunque cruce
  return Math.abs(end.x - start.x) >= Math.abs(end.y - start.y) ? path1 : path2;
}

/**
 * Calcula la longitud total de un path en metros (50px = 1m)
 */
function calculatePathLength(points: Point[]): number {
  let length = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const dx = points[i + 1].x - points[i].x;
    const dy = points[i + 1].y - points[i].y;
    length += Math.sqrt(dx * dx + dy * dy);
  }
  // Escala del canvas: 50 px = 1 m (la misma que usa TODO el simulador —
  // finishPipe, createManualPipe, piso radiante). OJO: acá decía /100 y las
  // tuberías del Conectar Auto se presupuestaban con la MITAD de los metros.
  return length / 50;
}



/**
 * Ordena los radiadores en UN ÚNICO troncal por cercanía a la caldera
 * (o al punto de arranque del troncal en la otra planta).
 *
 * CRITERIO DE OBRA (Edgardo): sale UN troncal de la caldera cargando el total
 * de la planta y va reduciendo el diámetro a medida que deja radiadores atrás.
 * Antes se partía en 2 circuitos por dispersión espacial: cada troncal salía
 * de la caldera con la MITAD de la potencia, así que un sistema de 11.600 kcal/h
 * daba dos Ø20 en vez del Ø25 que corresponde al total. Con un solo troncal el
 * tramo de la caldera se dimensiona por el total y baja al derivar cada radiador.
 */
function divideIntoCircuits(radiators: Radiator[], boilerCenter: Point): Radiator[][] {
  if (radiators.length === 0) return [];
  const sorted = [...radiators].sort((a, b) => {
    const distA = Math.hypot(a.x + a.width / 2 - boilerCenter.x, a.y + a.height / 2 - boilerCenter.y);
    const distB = Math.hypot(b.x + b.width / 2 - boilerCenter.x, b.y + b.height / 2 - boilerCenter.y);
    return distA - distB;
  });
  return [sorted];
}

/**
 * Genera tuberías para UN circuito (grupo de radiadores)
 * ARQUITECTURA: Troncal principal + ramales a cada radiador
 * - El troncal pasa cerca de todos los radiadores
 * - Ramales cortos conectan desde el troncal a cada radiador
 * - El dimensionamiento se hace según potencia acumulada
 */
function generateCircuitPipes(
  radiators: Radiator[],
  originPoint: Point,
  originElementId: string,
  floor: 'ground' | 'first',
  circuitId: string,
  floorHeatingZones: FloorHeatingZone[] = []
): PipeSegment[] {
  // Obstáculos del ruteo: los radiadores del circuito + las zonas de piso
  // radiante de la planta (una troncal no atraviesa un panel de serpentines)
  const zonasPlanta = floorHeatingZones.filter(z => z.floor === floor);
  const pipes: PipeSegment[] = [];
  let pipeIdCounter = Date.now();
  const PARALLEL_OFFSET = 8;
  const BRANCH_LENGTH = 30; // Longitud mínima del ramal

  if (radiators.length === 0) return pipes;

  // Calcular potencia total del circuito
  const totalPower = radiators.reduce((sum, r) => sum + r.power, 0);

  // Ordenar radiadores por distancia al origen
  const sortedRadiators = [...radiators].sort((a, b) => {
    const distA = Math.sqrt(Math.pow(a.x + a.width / 2 - originPoint.x, 2) + Math.pow(a.y + a.height / 2 - originPoint.y, 2));
    const distB = Math.sqrt(Math.pow(b.x + b.width / 2 - originPoint.x, 2) + Math.pow(b.y + b.height / 2 - originPoint.y, 2));
    return distA - distB;
  });

  let currentTrunkPoint = originPoint;
  let currentTrunkId = originElementId;
  let remainingPower = totalPower;

  sortedRadiators.forEach((radiator) => {
    const isVertical = radiator.height > radiator.width;

    // Punto de conexión en el radiador
    const radiatorConnection = {
      x: isVertical ? radiator.x + radiator.width / 3 : radiator.x + 10,
      y: isVertical ? radiator.y + 10 : radiator.y + radiator.height / 2
    };

    // Punto de derivación (donde el ramal sale del troncal)
    // Está en línea con el troncal pero cerca del radiador
    let derivationPoint: Point;

    // Calcular un punto de derivación que esté en el recorrido pero no en el radiador
    const dx = radiatorConnection.x - currentTrunkPoint.x;
    const dy = radiatorConnection.y - currentTrunkPoint.y;

    // El punto de derivación está en el eje principal del movimiento
    if (Math.abs(dx) > Math.abs(dy)) {
      // Movimiento principalmente horizontal
      derivationPoint = {
        x: radiatorConnection.x - Math.sign(dx) * BRANCH_LENGTH,
        y: currentTrunkPoint.y
      };
    } else {
      // Movimiento principalmente vertical
      derivationPoint = {
        x: currentTrunkPoint.x,
        y: radiatorConnection.y - Math.sign(dy) * BRANCH_LENGTH
      };
    }

    // Diámetro del troncal según potencia restante (todo lo que queda por alimentar)
    const trunkDiameter = diametroPorPotencia(remainingPower);

    // === TRONCAL: desde punto actual hasta punto de derivación ===
    if (currentTrunkPoint.x !== derivationPoint.x || currentTrunkPoint.y !== derivationPoint.y) {
      const trunkPath = findShortestPath(currentTrunkPoint, derivationPoint, [...radiators, ...zonasPlanta]);
      const trunkId = `${circuitId}-supply-trunk-${pipeIdCounter++}`;

      pipes.push({
        id: trunkId,
        type: 'pipe',
        pipeType: 'supply',
        points: trunkPath,
        diameter: trunkDiameter,
        material: 'Multicapa',
        floor: floor,
        fromElementId: currentTrunkId,
        toElementId: undefined, // El troncal NO conecta al radiador directamente
        length: calculatePathLength(trunkPath),
      });

      pipes.push({
        id: trunkId.replace('supply', 'return'),
        type: 'pipe',
        pipeType: 'return',
        points: trunkPath.map(p => ({ x: p.x + PARALLEL_OFFSET, y: p.y + PARALLEL_OFFSET })),
        diameter: trunkDiameter,
        material: 'Multicapa',
        floor: floor,
        fromElementId: undefined,
        toElementId: currentTrunkId.replace('supply', 'return'),
        length: calculatePathLength(trunkPath),
      });

      currentTrunkId = trunkId;
      currentTrunkPoint = derivationPoint;
    }

    // === RAMAL: desde punto de derivación hasta el radiador ===
    const branchPath = findShortestPath(
      derivationPoint,
      radiatorConnection,
      [...radiators.filter(r => r.id !== radiator.id), ...zonasPlanta]
    );
    const branchId = `${circuitId}-supply-branch-${pipeIdCounter++}`;

    // Diámetro del ramal: solo la potencia de ESTE radiador
    const branchDiameter = diametroPorPotencia(radiator.power);

    pipes.push({
      id: branchId,
      type: 'pipe',
      pipeType: 'supply',
      points: branchPath,
      diameter: branchDiameter,
      material: 'Multicapa',
      floor: floor,
      fromElementId: currentTrunkId, // El ramal sale del troncal
      toElementId: radiator.id,      // Y conecta al radiador
      length: calculatePathLength(branchPath),
    });

    pipes.push({
      id: branchId.replace('supply', 'return'),
      type: 'pipe',
      pipeType: 'return',
      points: branchPath.map(p => ({ x: p.x + PARALLEL_OFFSET, y: p.y + PARALLEL_OFFSET })),
      diameter: branchDiameter,
      material: 'Multicapa',
      floor: floor,
      fromElementId: radiator.id,
      toElementId: currentTrunkId.replace('supply', 'return'),
      length: calculatePathLength(branchPath),
    });

    // Restar potencia de este radiador
    remainingPower -= radiator.power;
  });

  return pipes;
}

/**
 * Genera tuberías automáticas para UNA planta
 * NUEVA LÓGICA: Crea circuitos balanceados
 */
export function generateAutoPipes(
  radiators: Radiator[],
  boilers: Boiler[],
  floorHeatingZones: FloorHeatingZone[] = []
): {
  pipes: PipeSegment[];
  repositionedRadiators: Array<{ id: string; x: number; y: number; width?: number; height?: number }>;
} {
  if (boilers.length === 0 || radiators.length === 0) {
    return { pipes: [], repositionedRadiators: [] };
  }

  const boiler = boilers[0];
  const boilerCenter = {
    x: boiler.x + boiler.width / 2,
    y: boiler.y + boiler.height / 2
  };
  const floor = boiler.floor as 'ground' | 'first';
  // Dividir en circuitos
  const circuits = divideIntoCircuits(radiators, boilerCenter);
  const allPipes: PipeSegment[] = [];

  // Generar tuberías para cada circuito
  circuits.forEach((circuitRadiators, circuitIndex) => {
    const circuitId = `circuit-${circuitIndex + 1}`;
    const circuitPipes = generateCircuitPipes(
      circuitRadiators,
      boilerCenter,
      boiler.id,
      floor,
      circuitId,
      floorHeatingZones
    );

    allPipes.push(...circuitPipes);
  });
  return { pipes: allPipes, repositionedRadiators: [] };
}

/**
 * NUEVO: Genera tuberías para sistema multi-planta
 * Detecta automáticamente si necesita montante vertical
 */
export function generateMultiFloorPipes(
  allRadiators: Radiator[],
  allBoilers: Boiler[],
  riserPosition?: Point, // Posición del montante (opcional, se calcula automáticamente)
  floorHeatingZones: FloorHeatingZone[] = []
): {
  pipes: PipeSegment[];
  riserPoint: Point | null;
  summary: {
    groundPipes: number;
    firstPipes: number;
    verticalPipes: number;
    totalPower: { ground: number; first: number };
  };
} {
  const pipes: PipeSegment[] = [];
  const PARALLEL_OFFSET = 8;

  // Separar elementos por planta
  const groundRadiators = allRadiators.filter(r => r.floor === 'ground');
  const firstRadiators = allRadiators.filter(r => r.floor === 'first');
  const groundBoilers = allBoilers.filter(b => b.floor === 'ground');
  const firstBoilers = allBoilers.filter(b => b.floor === 'first');

  // Calcular potencias por planta
  const groundPower = groundRadiators.reduce((sum, r) => sum + r.power, 0);
  const firstPower = firstRadiators.reduce((sum, r) => sum + r.power, 0);
  // Determinar la caldera principal
  const mainBoiler = groundBoilers[0] || firstBoilers[0];
  if (!mainBoiler) {
    return {
      pipes: [],
      riserPoint: null,
      summary: { groundPipes: 0, firstPipes: 0, verticalPipes: 0, totalPower: { ground: 0, first: 0 } }
    };
  }

  const boilerCenter = {
    x: mainBoiler.x + mainBoiler.width / 2,
    y: mainBoiler.y + mainBoiler.height / 2
  };

  const boilerFloor = mainBoiler.floor as 'ground' | 'first';
  const needsRiser = (boilerFloor === 'ground' && firstRadiators.length > 0) ||
    (boilerFloor === 'first' && groundRadiators.length > 0);

  let riserPoint: Point | null = null;
  let riserId = '';

  // Si necesita montante vertical
  if (needsRiser) {
    // Calcular posición del montante (cerca de la caldera)
    riserPoint = riserPosition || {
      x: boilerCenter.x + 80,
      y: boilerCenter.y
    };

    riserId = `riser-${Date.now()}`;

    // El montante alimenta TODA la potencia de la otra planta: se dimensiona
    // acá mismo (antes quedaba hardcodeado en Ø16 y solo se corregía si el
    // re-dimensionado posterior llegaba a correr)
    const potenciaOtraPlanta = boilerFloor === 'ground' ? firstPower : groundPower;
    const riserDiameter = diametroPorPotencia(potenciaOtraPlanta);

    // TRAMO CALDERA → MONTANTE (conexión horizontal en la planta de la caldera)
    const boilerToRiserPath = findShortestPath(boilerCenter, riserPoint, allRadiators.filter(r => r.floor === boilerFloor));
    const boilerToRiserId = `${riserId}-boiler-connection`;

    pipes.push({
      id: `${boilerToRiserId}-supply`,
      type: 'pipe',
      pipeType: 'supply',
      points: boilerToRiserPath,
      diameter: riserDiameter,
      material: 'Multicapa',
      floor: boilerFloor,
      fromElementId: mainBoiler.id,
      toElementId: `${riserId}-supply`,
      length: calculatePathLength(boilerToRiserPath),
    });

    pipes.push({
      id: `${boilerToRiserId}-return`,
      type: 'pipe',
      pipeType: 'return',
      points: boilerToRiserPath.map(p => ({ x: p.x + PARALLEL_OFFSET, y: p.y + PARALLEL_OFFSET })),
      diameter: riserDiameter,
      material: 'Multicapa',
      floor: boilerFloor,
      fromElementId: `${riserId}-return`,
      toElementId: mainBoiler.id,
      length: calculatePathLength(boilerToRiserPath),
    });

    // Crear tuberías verticales (montante)
    // Estas se visualizan como punto en cada planta
    pipes.push({
      id: `${riserId}-supply`,
      type: 'pipe',
      pipeType: 'supply',
      points: [riserPoint, { x: riserPoint.x, y: riserPoint.y + 10 }], // Símbolo pequeño
      diameter: riserDiameter,
      material: 'Multicapa',
      floor: 'vertical',
      fromElementId: `${boilerToRiserId}-supply`,
      toElementId: boilerFloor === 'ground' ? 'first-trunk' : 'ground-trunk',
      length: 3, // Asumimos 3 metros de altura entre plantas
    });

    pipes.push({
      id: `${riserId}-return`,
      type: 'pipe',
      pipeType: 'return',
      points: [
        { x: riserPoint.x + PARALLEL_OFFSET, y: riserPoint.y },
        { x: riserPoint.x + PARALLEL_OFFSET, y: riserPoint.y + 10 }
      ],
      diameter: riserDiameter,
      material: 'Multicapa',
      floor: 'vertical',
      fromElementId: boilerFloor === 'ground' ? 'first-trunk' : 'ground-trunk',
      toElementId: `${boilerToRiserId}-return`,
      length: 3,
    });
  }

  // Generar tuberías para la planta donde está la caldera (usando circuitos balanceados)
  if (boilerFloor === 'ground' && groundRadiators.length > 0) {
    const circuits = divideIntoCircuits(groundRadiators, boilerCenter);
    circuits.forEach((circuitRads, idx) => {
      const circuitPipes = generateCircuitPipes(
        circuitRads,
        boilerCenter,
        mainBoiler.id,
        'ground',
        `ground-c${idx + 1}`,
        floorHeatingZones
      );
      pipes.push(...circuitPipes);
    });
  } else if (boilerFloor === 'first' && firstRadiators.length > 0) {
    const circuits = divideIntoCircuits(firstRadiators, boilerCenter);
    circuits.forEach((circuitRads, idx) => {
      const circuitPipes = generateCircuitPipes(
        circuitRads,
        boilerCenter,
        mainBoiler.id,
        'first',
        `first-c${idx + 1}`,
        floorHeatingZones
      );
      pipes.push(...circuitPipes);
    });
  }

  // Generar tuberías para la otra planta (si tiene radiadores y hay montante)
  if (needsRiser && riserPoint) {
    // El origen de las tuberías de la otra planta es el montante (ID: riserId-supply)
    const riserSupplyId = `${riserId}-supply`;
    const PARALLEL_OFFSET_LOCAL = 8;

    if (boilerFloor === 'ground' && firstRadiators.length > 0) {
      // Caldera en PB, generar tuberías de PA desde el montante

      // Calcular diámetro del troncal de distribución de PA (potencia total de PA)
      const paTotalDiameter = diametroPorPotencia(firstPower);

      // Crear TRONCAL DE DISTRIBUCIÓN en PA que sale del montante
      // Este troncal tiene el diámetro total de PA y luego se bifurca a los circuitos
      const distributionTrunkId = `first-distribution-trunk-${Date.now()}`;
      const distributionEndPoint = {
        x: riserPoint.x + 50, // Pequeño tramo horizontal desde el montante
        y: riserPoint.y
      };
      pipes.push({
        id: distributionTrunkId,
        type: 'pipe',
        pipeType: 'supply',
        points: [riserPoint, distributionEndPoint],
        diameter: paTotalDiameter,
        material: 'Multicapa',
        floor: 'first',
        fromElementId: riserSupplyId,
        toElementId: undefined,
        length: 0.5, // 50cm
      });

      pipes.push({
        id: distributionTrunkId.replace('supply', 'return').replace('distribution', 'distribution-return'),
        type: 'pipe',
        pipeType: 'return',
        points: [
          { x: riserPoint.x + PARALLEL_OFFSET_LOCAL, y: riserPoint.y + PARALLEL_OFFSET_LOCAL },
          { x: distributionEndPoint.x + PARALLEL_OFFSET_LOCAL, y: distributionEndPoint.y + PARALLEL_OFFSET_LOCAL }
        ],
        diameter: paTotalDiameter,
        material: 'Multicapa',
        floor: 'first',
        fromElementId: undefined,
        toElementId: `${riserId}-return`,
        length: 0.5,
      });

      // Ahora generar los circuitos desde el punto de distribución
      const circuits = divideIntoCircuits(firstRadiators, distributionEndPoint);

      circuits.forEach((circuitRads, idx) => {
        const circuitId = `first-c${idx + 1}`;
        const circuitPipes = generateCircuitPipes(
          circuitRads,
          distributionEndPoint,
          distributionTrunkId, // Conectar al troncal de distribución
          'first',
          circuitId,
          floorHeatingZones
        );
        pipes.push(...circuitPipes);
      });

      // Actualizar el montante para que apunte al troncal de distribución
      const riserSupply = pipes.find(p => p.id === riserSupplyId);
      if (riserSupply) {
        riserSupply.toElementId = distributionTrunkId;
      }

    } else if (boilerFloor === 'first' && groundRadiators.length > 0) {
      // Caldera en PA, generar tuberías de PB desde el montante

      const pbTotalDiameter = diametroPorPotencia(groundPower);

      // Crear TRONCAL DE DISTRIBUCIÓN en PB
      const distributionTrunkId = `ground-distribution-trunk-${Date.now()}`;
      const distributionEndPoint = {
        x: riserPoint.x + 50,
        y: riserPoint.y
      };
      pipes.push({
        id: distributionTrunkId,
        type: 'pipe',
        pipeType: 'supply',
        points: [riserPoint, distributionEndPoint],
        diameter: pbTotalDiameter,
        material: 'Multicapa',
        floor: 'ground',
        fromElementId: riserSupplyId,
        toElementId: undefined,
        length: 0.5,
      });

      pipes.push({
        id: distributionTrunkId.replace('supply', 'return').replace('distribution', 'distribution-return'),
        type: 'pipe',
        pipeType: 'return',
        points: [
          { x: riserPoint.x + PARALLEL_OFFSET_LOCAL, y: riserPoint.y + PARALLEL_OFFSET_LOCAL },
          { x: distributionEndPoint.x + PARALLEL_OFFSET_LOCAL, y: distributionEndPoint.y + PARALLEL_OFFSET_LOCAL }
        ],
        diameter: pbTotalDiameter,
        material: 'Multicapa',
        floor: 'ground',
        fromElementId: undefined,
        toElementId: `${riserId}-return`,
        length: 0.5,
      });

      const circuits = divideIntoCircuits(groundRadiators, distributionEndPoint);

      circuits.forEach((circuitRads, idx) => {
        const circuitId = `ground-c${idx + 1}`;
        const circuitPipes = generateCircuitPipes(
          circuitRads,
          distributionEndPoint,
          distributionTrunkId,
          'ground',
          circuitId,
          floorHeatingZones
        );
        pipes.push(...circuitPipes);
      });

      const riserSupply = pipes.find(p => p.id === riserSupplyId);
      if (riserSupply) {
        riserSupply.toElementId = distributionTrunkId;
      }
    }
  }

  // Estadísticas
  const groundPipesCount = pipes.filter(p => p.floor === 'ground').length;
  const firstPipesCount = pipes.filter(p => p.floor === 'first').length;
  const verticalPipesCount = pipes.filter(p => p.floor === 'vertical').length;
  return {
    pipes,
    riserPoint,
    summary: {
      groundPipes: groundPipesCount,
      firstPipes: firstPipesCount,
      verticalPipes: verticalPipesCount,
      totalPower: { ground: groundPower, first: firstPower }
    }
  };
}
