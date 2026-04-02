import type { Radiator } from '../models/Radiator';
import type { Boiler } from '../models/Boiler';
import type { PipeSegment } from '../models/PipeSegment';

interface Point {
  x: number;
  y: number;
}

interface RadiatorZone {
  radiators: Radiator[];
  centroid: Point;
  totalPower: number;
}

/**
 * Agrupa radiadores en zonas basándose en proximidad geográfica
 * Los radiadores cercanos entre sí forman una zona común
 * NOTA: Función reservada para uso futuro
 * @deprecated Reservada para implementación futura de zonas inteligentes
 */
export function groupRadiatorsIntoZones(radiators: Radiator[], maxDistance: number = 250): RadiatorZone[] {
  if (radiators.length === 0) return [];
  if (radiators.length === 1) {
    const r = radiators[0];
    return [{
      radiators: [r],
      centroid: { x: r.x + r.width / 2, y: r.y + r.height / 2 },
      totalPower: r.power
    }];
  }

  // Algoritmo de clustering simple por distancia
  const zones: RadiatorZone[] = [];
  const assigned = new Set<string>();

  radiators.forEach(rad => {
    if (assigned.has(rad.id)) return;

    // Iniciar nueva zona con este radiador
    const zone: Radiator[] = [rad];
    assigned.add(rad.id);
    const radCenter = { x: rad.x + rad.width / 2, y: rad.y + rad.height / 2 };

    // Buscar radiadores cercanos
    radiators.forEach(other => {
      if (assigned.has(other.id)) return;
      const otherCenter = { x: other.x + other.width / 2, y: other.y + other.height / 2 };
      const distance = Math.sqrt(
        Math.pow(radCenter.x - otherCenter.x, 2) +
        Math.pow(radCenter.y - otherCenter.y, 2)
      );

      if (distance <= maxDistance) {
        zone.push(other);
        assigned.add(other.id);
      }
    });

    // Calcular centroide de la zona
    const centroid = {
      x: zone.reduce((sum, r) => sum + r.x + r.width / 2, 0) / zone.length,
      y: zone.reduce((sum, r) => sum + r.y + r.height / 2, 0) / zone.length
    };

    const totalPower = zone.reduce((sum, r) => sum + r.power, 0);

    zones.push({ radiators: zone, centroid, totalPower });
  });

  console.log(`📍 Zonas detectadas: ${zones.length}`);
  zones.forEach((z, i) => {
    console.log(`   Zona ${i + 1}: ${z.radiators.length} radiadores, ${z.totalPower} Kcal/h`);
  });

  return zones;
}

/**
 * Encuentra el camino más corto ortogonal entre dos puntos
 * EVITANDO pasar por encima de radiadores
 * Intenta múltiples opciones y elige la que no cruza radiadores
 */
function findShortestPath(start: Point, end: Point, radiators?: Radiator[]): Point[] {
  const margin = 40; // Margen de seguridad alrededor del radiador

  // Función para verificar si un segmento de línea cruza un radiador
  const segmentIntersectsRadiator = (p1: Point, p2: Point): Radiator | undefined => {
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
 * Calcula la longitud total de un path en metros (100px = 1m)
 */
function calculatePathLength(points: Point[]): number {
  let length = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const dx = points[i + 1].x - points[i].x;
    const dy = points[i + 1].y - points[i].y;
    length += Math.sqrt(dx * dx + dy * dy);
  }
  return length / 100; // Convertir pixels a metros
}



/**
 * Divide radiadores en circuitos balanceados
 * Usa división espacial (izquierda/derecha o arriba/abajo según la distribución)
 */
function divideIntoCircuits(radiators: Radiator[], boilerCenter: Point): Radiator[][] {
  if (radiators.length <= 3) {
    // Muy pocos radiadores, un solo circuito
    return [radiators];
  }

  // Calcular centro de masa de todos los radiadores
  const avgX = radiators.reduce((sum, r) => sum + r.x + r.width / 2, 0) / radiators.length;
  const avgY = radiators.reduce((sum, r) => sum + r.y + r.height / 2, 0) / radiators.length;

  // Calcular dispersión en X e Y
  const spreadX = Math.max(...radiators.map(r => r.x)) - Math.min(...radiators.map(r => r.x));
  const spreadY = Math.max(...radiators.map(r => r.y)) - Math.min(...radiators.map(r => r.y));

  // Dividir por el eje con mayor dispersión
  const divideByX = spreadX >= spreadY;
  const divisionPoint = divideByX ? avgX : avgY;

  console.log(`📐 División de circuitos: ${divideByX ? 'Vertical (X)' : 'Horizontal (Y)'} en ${divisionPoint.toFixed(0)}`);

  const circuit1: Radiator[] = [];
  const circuit2: Radiator[] = [];

  radiators.forEach(rad => {
    const radCenter = divideByX ? rad.x + rad.width / 2 : rad.y + rad.height / 2;
    if (radCenter < divisionPoint) {
      circuit1.push(rad);
    } else {
      circuit2.push(rad);
    }
  });

  // Si un circuito quedó vacío, redistribuir
  if (circuit1.length === 0) return [circuit2];
  if (circuit2.length === 0) return [circuit1];

  // Ordenar cada circuito por distancia a la caldera
  const sortByDistance = (rads: Radiator[]) => {
    return [...rads].sort((a, b) => {
      const distA = Math.sqrt(Math.pow(a.x + a.width / 2 - boilerCenter.x, 2) + Math.pow(a.y + a.height / 2 - boilerCenter.y, 2));
      const distB = Math.sqrt(Math.pow(b.x + b.width / 2 - boilerCenter.x, 2) + Math.pow(b.y + b.height / 2 - boilerCenter.y, 2));
      return distA - distB;
    });
  };

  const sorted1 = sortByDistance(circuit1);
  const sorted2 = sortByDistance(circuit2);

  // Calcular potencias
  const power1 = sorted1.reduce((sum, r) => sum + r.power, 0);
  const power2 = sorted2.reduce((sum, r) => sum + r.power, 0);

  console.log(`   Circuito 1: ${sorted1.length} radiadores, ${power1} Kcal/h`);
  console.log(`   Circuito 2: ${sorted2.length} radiadores, ${power2} Kcal/h`);

  return [sorted1, sorted2];
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
  circuitId: string
): PipeSegment[] {
  const pipes: PipeSegment[] = [];
  let pipeIdCounter = Date.now();
  const PARALLEL_OFFSET = 8;
  const BRANCH_LENGTH = 30; // Longitud mínima del ramal

  if (radiators.length === 0) return pipes;

  // Calcular potencia total del circuito
  const totalPower = radiators.reduce((sum, r) => sum + r.power, 0);

  // DEBUG: Mostrar potencia de cada radiador
  console.log(`   📋 Radiadores del circuito ${circuitId}:`);
  radiators.forEach((r, i) => {
    console.log(`      ${i + 1}. ${r.id.substring(0, 15)}... → ${r.power} Kcal/h`);
  });
  console.log(`   📊 Potencia total: ${totalPower} Kcal/h`);

  // Calcular diámetro según potencia
  const calculateDiameter = (power: number): number => {
    const flowRate = power / 10; // ΔT = 10°C
    if (flowRate <= 450) return 16;
    if (flowRate <= 750) return 20;
    if (flowRate <= 1300) return 25;
    if (flowRate <= 2200) return 32;
    return 40;
  };

  // Calcular diámetro inicial del troncal
  const initialTrunkDiameter = calculateDiameter(totalPower);
  console.log(`   🔧 Diámetro inicial troncal: Ø${initialTrunkDiameter}mm (para ${totalPower} Kcal/h)`);

  // Ordenar radiadores por distancia al origen
  const sortedRadiators = [...radiators].sort((a, b) => {
    const distA = Math.sqrt(Math.pow(a.x + a.width / 2 - originPoint.x, 2) + Math.pow(a.y + a.height / 2 - originPoint.y, 2));
    const distB = Math.sqrt(Math.pow(b.x + b.width / 2 - originPoint.x, 2) + Math.pow(b.y + b.height / 2 - originPoint.y, 2));
    return distA - distB;
  });

  let currentTrunkPoint = originPoint;
  let currentTrunkId = originElementId;
  let remainingPower = totalPower;

  sortedRadiators.forEach((radiator, index) => {
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
    const trunkDiameter = calculateDiameter(remainingPower);

    // === TRONCAL: desde punto actual hasta punto de derivación ===
    if (currentTrunkPoint.x !== derivationPoint.x || currentTrunkPoint.y !== derivationPoint.y) {
      const trunkPath = findShortestPath(currentTrunkPoint, derivationPoint, radiators);
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
    const branchPath = findShortestPath(derivationPoint, radiatorConnection, radiators.filter(r => r.id !== radiator.id));
    const branchId = `${circuitId}-supply-branch-${pipeIdCounter++}`;

    // Diámetro del ramal: solo la potencia de ESTE radiador
    const branchDiameter = calculateDiameter(radiator.power);

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

    console.log(`     Rad ${index + 1}: ${radiator.power} Kcal/h → troncal Ø${trunkDiameter}mm, ramal Ø${branchDiameter}mm`);
  });

  return pipes;
}

/**
 * Genera tuberías automáticas para UNA planta
 * NUEVA LÓGICA: Crea circuitos balanceados
 */
export function generateAutoPipes(
  radiators: Radiator[],
  boilers: Boiler[]
): {
  pipes: PipeSegment[];
  repositionedRadiators: Array<{ id: string; x: number; y: number; width?: number; height?: number }>;
} {
  if (boilers.length === 0 || radiators.length === 0) {
    console.warn('⚠️ Se necesitan calderas y radiadores');
    return { pipes: [], repositionedRadiators: [] };
  }

  const boiler = boilers[0];
  const boilerCenter = {
    x: boiler.x + boiler.width / 2,
    y: boiler.y + boiler.height / 2
  };
  const floor = boiler.floor as 'ground' | 'first';

  console.log('🔀 Generando sistema con circuitos balanceados...');
  console.log(`   Caldera en (${boilerCenter.x.toFixed(0)}, ${boilerCenter.y.toFixed(0)})`);
  console.log(`   Total radiadores: ${radiators.length}`);

  // Dividir en circuitos
  const circuits = divideIntoCircuits(radiators, boilerCenter);
  console.log(`   Circuitos creados: ${circuits.length}`);

  const allPipes: PipeSegment[] = [];

  // Generar tuberías para cada circuito
  circuits.forEach((circuitRadiators, circuitIndex) => {
    const circuitId = `circuit-${circuitIndex + 1}`;
    console.log(`\n📦 Generando ${circuitId}:`);

    const circuitPipes = generateCircuitPipes(
      circuitRadiators,
      boilerCenter,
      boiler.id,
      floor,
      circuitId
    );

    allPipes.push(...circuitPipes);
  });

  console.log(`\n✅ Sistema generado: ${allPipes.length} tuberías en ${circuits.length} circuito(s)`);

  return { pipes: allPipes, repositionedRadiators: [] };
}

/**
 * NUEVO: Genera tuberías para sistema multi-planta
 * Detecta automáticamente si necesita montante vertical
 */
export function generateMultiFloorPipes(
  allRadiators: Radiator[],
  allBoilers: Boiler[],
  riserPosition?: Point // Posición del montante (opcional, se calcula automáticamente)
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

  console.log('🏠 Generando sistema multi-planta...');
  console.log(`   PB: ${groundRadiators.length} radiadores (${groundPower} Kcal/h), ${groundBoilers.length} calderas`);
  console.log(`   PA: ${firstRadiators.length} radiadores (${firstPower} Kcal/h), ${firstBoilers.length} calderas`);

  // DEBUG: Mostrar potencia de cada radiador de PA
  if (firstRadiators.length > 0) {
    console.log('   📋 Detalle radiadores PA:');
    firstRadiators.forEach((r, i) => {
      console.log(`      ${i + 1}. ${r.id.substring(0, 12)}... floor=${r.floor}, power=${r.power}`);
    });
  }

  // Determinar la caldera principal
  const mainBoiler = groundBoilers[0] || firstBoilers[0];
  if (!mainBoiler) {
    console.warn('⚠️ No hay calderas');
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

    console.log(`🔼 Creando montante vertical en (${riserPoint.x.toFixed(0)}, ${riserPoint.y.toFixed(0)})`);
    console.log(`   Potencia del montante: ${boilerFloor === 'ground' ? firstPower : groundPower} Kcal/h`);

    // TRAMO CALDERA → MONTANTE (conexión horizontal en la planta de la caldera)
    const boilerToRiserPath = findShortestPath(boilerCenter, riserPoint, allRadiators.filter(r => r.floor === boilerFloor));
    const boilerToRiserId = `${riserId}-boiler-connection`;

    pipes.push({
      id: `${boilerToRiserId}-supply`,
      type: 'pipe',
      pipeType: 'supply',
      points: boilerToRiserPath,
      diameter: 16, // Se dimensionará según potencia total
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
      diameter: 16,
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
      diameter: 16, // Se dimensionará según potencia de la planta que alimenta
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
      diameter: 16,
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
        `ground-c${idx + 1}`
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
        `first-c${idx + 1}`
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
      const calculateDiam = (power: number): number => {
        const flow = power / 10;
        if (flow <= 450) return 16;
        if (flow <= 750) return 20;
        if (flow <= 1300) return 25;
        if (flow <= 2200) return 32;
        return 40;
      };
      const paTotalDiameter = calculateDiam(firstPower);

      // Crear TRONCAL DE DISTRIBUCIÓN en PA que sale del montante
      // Este troncal tiene el diámetro total de PA y luego se bifurca a los circuitos
      const distributionTrunkId = `first-distribution-trunk-${Date.now()}`;
      const distributionEndPoint = {
        x: riserPoint.x + 50, // Pequeño tramo horizontal desde el montante
        y: riserPoint.y
      };

      console.log(`🔀 Creando troncal de distribución PA: ${firstPower} Kcal/h → Ø${paTotalDiameter}mm`);

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
          circuitId
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

      const calculateDiam = (power: number): number => {
        const flow = power / 10;
        if (flow <= 450) return 16;
        if (flow <= 750) return 20;
        if (flow <= 1300) return 25;
        if (flow <= 2200) return 32;
        return 40;
      };
      const pbTotalDiameter = calculateDiam(groundPower);

      // Crear TRONCAL DE DISTRIBUCIÓN en PB
      const distributionTrunkId = `ground-distribution-trunk-${Date.now()}`;
      const distributionEndPoint = {
        x: riserPoint.x + 50,
        y: riserPoint.y
      };

      console.log(`🔀 Creando troncal de distribución PB: ${groundPower} Kcal/h → Ø${pbTotalDiameter}mm`);

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
          circuitId
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

  console.log(`✅ Sistema multi-planta generado:`);
  console.log(`   📊 PB: ${groundPipesCount} tuberías`);
  console.log(`   📊 PA: ${firstPipesCount} tuberías`);
  console.log(`   📊 Verticales: ${verticalPipesCount} tuberías`);

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
