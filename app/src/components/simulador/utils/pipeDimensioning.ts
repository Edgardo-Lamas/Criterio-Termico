import type { PipeSegment } from '../models/PipeSegment';
import type { Radiator } from '../models/Radiator';
import type { Boiler } from '../models/Boiler';

/**
 * Calcula el caudal necesario basado en la potencia
 * Fórmula: Caudal (L/h) = Potencia (Kcal/h) / ΔT
 * Donde ΔT = 10°C (salto térmico estándar para calefacción)
 */
export function calculateFlowRate(powerKcal: number): number {
  const deltaT = 10; // °C (estándar para calefacción)
  return powerKcal / deltaT; // L/h
}

/**
 * Determina el diámetro óptimo de tubería PEX/Multicapa según el caudal
 * IMPORTANTE: Los valores son diámetro EXTERIOR en mm
 * Basado en velocidad óptima del agua: ~1.0 m/s
 * 
 * Tabla de referencia PEX (velocidad ≈1.0 m/s):
 * ┌─────────┬─────────────┬─────────────────┬──────────────────────┐
 * │ Ø Ext   │ Ø Int aprox │ Caudal máx      │ Potencia máx ΔT=10°C │
 * ├─────────┼─────────────┼─────────────────┼──────────────────────┤
 * │ 16 mm   │ ~12.5 mm    │ 450-600 L/h     │ ~5200 Kcal/h (6 kW)  │
 * │ 20 mm   │ ~16 mm      │ 700-900 L/h     │ ~8600 Kcal/h (10 kW) │
 * │ 25 mm   │ ~20.5 mm    │ 1200-1500 L/h   │ ~14600 Kcal/h (17 kW)│
 * │ 32 mm   │ ~26.5 mm    │ 2000-2500 L/h   │ ~24500 Kcal/h (28 kW)│
 * └─────────┴─────────────┴─────────────────┴──────────────────────┘
 * 
 * Nota: Con ΔT=10°C, Caudal(L/h) = Potencia(Kcal/h) / 10
 */
export function calculatePipeDiameter(flowRate: number): number {
  // Tabla de dimensionamiento según caudal (L/h) con ΔT=10°C
  // Usamos valores conservadores (80% del máximo) para seguridad
  if (flowRate <= 450) return 16;   // Hasta ~4500 Kcal/h (~5.2 kW)
  if (flowRate <= 750) return 20;   // Hasta ~7500 Kcal/h (~8.7 kW)
  if (flowRate <= 1300) return 25;  // Hasta ~13000 Kcal/h (~15 kW)
  if (flowRate <= 2200) return 32;  // Hasta ~22000 Kcal/h (~25 kW)
  return 40; // Más de 22000 Kcal/h - troncal principal grande
}

/**
 * ALGORITMO MEJORADO: Calcula la potencia total que pasa por cada tubería
 * usando DFS (Depth-First Search) desde cada tubería hacia los radiadores
 * MEJORA: También considera conexiones via toElementId (para montantes)
 */
function calculatePipePowers(
  pipes: PipeSegment[],
  radiators: Radiator[]
): Map<string, number> {
  const pipePowers = new Map<string, number>();
  const supplyPipes = pipes.filter(p => p.pipeType === 'supply');

  // Crear mapa de radiadores por ID para búsqueda rápida
  const radiatorMap = new Map<string, Radiator>();
  radiators.forEach(r => radiatorMap.set(r.id, r));

  // Crear mapa de pipes por ID
  const pipeMap = new Map<string, PipeSegment>();
  supplyPipes.forEach(p => pipeMap.set(p.id, p));

  // Crear mapa de hijos: para cada pipe/elemento, qué pipes salen de él
  const childrenMap = new Map<string, string[]>();

  // Inicializar con todas las pipes
  supplyPipes.forEach(pipe => {
    childrenMap.set(pipe.id, []);
  });

  // Construir relaciones padre-hijo basadas en fromElementId
  supplyPipes.forEach(pipe => {
    if (pipe.fromElementId) {
      // Asegurar que el padre existe en el mapa
      if (!childrenMap.has(pipe.fromElementId)) {
        childrenMap.set(pipe.fromElementId, []);
      }
      childrenMap.get(pipe.fromElementId)!.push(pipe.id);
    }
  });

  // DEBUG: Mostrar grafo de conexiones
  console.log('📊 Grafo de conexiones (padre → hijos):');
  childrenMap.forEach((children, parentId) => {
    if (children.length > 0) {
      const shortParent = parentId.length > 30 ? parentId.substring(0, 30) + '...' : parentId;
      console.log(`   ${shortParent} → [${children.length} hijos]`);
    }
  });

  // Función recursiva para calcular potencia de una tubería
  function calculatePowerForPipe(pipeId: string, visited: Set<string>): number {
    if (visited.has(pipeId)) return 0; // Evitar ciclos
    visited.add(pipeId);

    const pipe = pipeMap.get(pipeId);
    let power = 0;

    // 1. Si esta tubería conecta directamente a un radiador
    if (pipe?.toElementId) {
      const radiator = radiatorMap.get(pipe.toElementId);
      if (radiator) {
        power += radiator.power;
      }

      // También verificar si toElementId es otra tubería (para montantes)
      const targetPipe = pipeMap.get(pipe.toElementId);
      if (targetPipe) {
        power += calculatePowerForPipe(targetPipe.id, visited);
      }
    }

    // 2. Sumar potencia de todas las tuberías hijas (las que tienen fromElementId = este ID)
    const children = childrenMap.get(pipeId) || [];
    children.forEach(childId => {
      power += calculatePowerForPipe(childId, visited);
    });

    return power;
  }

  // Calcular potencia para cada tubería
  supplyPipes.forEach(pipe => {
    const visited = new Set<string>();
    const power = calculatePowerForPipe(pipe.id, visited);
    pipePowers.set(pipe.id, power);
  });

  return pipePowers;
}

/**
 * Dimensiona automáticamente todas las tuberías según la potencia
 * de los radiadores que alimentan
 * NUEVO ALGORITMO SIMPLIFICADO: usa DFS para calcular potencia de cada tubería
 */
export function dimensionPipes(
  pipes: PipeSegment[],
  radiators: Radiator[],
  boilers: Boiler[]
): PipeSegment[] {
  if (boilers.length === 0 || radiators.length === 0) {
    console.warn('⚠️ Se necesitan calderas y radiadores para dimensionar');
    return pipes;
  }

  const supplyPipes = pipes.filter(p => p.pipeType === 'supply');
  console.log(`📏 Dimensionando ${supplyPipes.length} tuberías de suministro...`);
  console.log(`   Radiadores: ${radiators.length}`);

  // Calcular potencias por planta
  const groundRadiators = radiators.filter(r => r.floor === 'ground');
  const firstRadiators = radiators.filter(r => r.floor === 'first');
  const groundPower = groundRadiators.reduce((sum, r) => sum + r.power, 0);
  const firstPower = firstRadiators.reduce((sum, r) => sum + r.power, 0);
  const totalPower = groundPower + firstPower;

  console.log(`🏠 Potencias: PB=${groundPower} Kcal/h (${groundRadiators.length} rads), PA=${firstPower} Kcal/h (${firstRadiators.length} rads)`);
  console.log(`   Total: ${totalPower} Kcal/h`);

  // NUEVO: Calcular potencia de cada tubería usando DFS
  const pipePowers = calculatePipePowers(pipes, radiators);

  // Debug: mostrar potencias calculadas
  console.log('📊 Potencias por tubería:');
  let pipesWithPower = 0;
  pipePowers.forEach((power, pipeId) => {
    if (power > 0) {
      pipesWithPower++;
      const shortId = pipeId.length > 40 ? pipeId.substring(0, 40) + '...' : pipeId;
      console.log(`   ${shortId}: ${power} Kcal/h`);
    }
  });
  console.log(`   Total con potencia: ${pipesWithPower}/${supplyPipes.length}`);

  // Dimensionar cada tubería
  const dimensionedPipes = pipes.map(pipe => {
    if (pipe.pipeType !== 'supply') {
      return pipe;
    }

    // Obtener potencia calculada
    let power = pipePowers.get(pipe.id) || 0;

    // REGLA ESPECIAL: Montante vertical - usar potencia de la planta que alimenta
    if (pipe.floor === 'vertical' || pipe.id.includes('riser')) {
      power = firstPower > 0 ? firstPower : groundPower;
      const flowRate = calculateFlowRate(power);
      const diameter = calculatePipeDiameter(flowRate);
      console.log(`🔼 MONTANTE: ${power} Kcal/h → Ø${diameter}mm`);
      return { ...pipe, diameter };
    }

    // REGLA ESPECIAL: Conexión desde caldera
    const isFromBoiler = boilers.some(b => b.id === pipe.fromElementId);
    if (isFromBoiler && power === 0) {
      // Si sale de la caldera pero no tiene potencia calculada, usar total
      power = totalPower;
    }

    // Si no tiene potencia, mantener el diámetro actual
    if (power === 0) {
      console.log(`⚠️ ${pipe.id.substring(0, 35)}: sin potencia, mantener Ø${pipe.diameter}mm`);
      return pipe;
    }

    // Calcular diámetro
    const flowRate = calculateFlowRate(power);
    const diameter = calculatePipeDiameter(flowRate);

    const tipo = pipe.id.includes('branch') ? 'RAMAL' :
      pipe.id.includes('trunk') ? 'TRONCAL' : 'TUBERÍA';
    console.log(`🔧 ${tipo}: ${power} Kcal/h → ${flowRate} L/h → Ø${diameter}mm`);

    return { ...pipe, diameter };
  });

  // Copiar diámetros a tuberías de retorno
  const finalPipes = dimensionedPipes.map(pipe => {
    if (pipe.pipeType === 'return') {
      const supplyId = pipe.id.replace('return', 'supply');
      let supplyPipe = dimensionedPipes.find(p => p.id === supplyId);

      if (!supplyPipe) {
        const supplyId2 = pipe.id.replace('-return-', '-supply-');
        supplyPipe = dimensionedPipes.find(p => p.id === supplyId2);
      }

      if (supplyPipe && supplyPipe.diameter) {
        return { ...pipe, diameter: supplyPipe.diameter };
      }
    }
    return pipe;
  });

  // Estadísticas
  const stats = {
    16: finalPipes.filter(p => p.diameter === 16).length,
    20: finalPipes.filter(p => p.diameter === 20).length,
    25: finalPipes.filter(p => p.diameter === 25).length,
    32: finalPipes.filter(p => p.diameter && p.diameter >= 32).length,
  };

  console.log(`✅ Dimensionamiento completado:`);
  console.log(`   Ø16mm: ${stats[16]} | Ø20mm: ${stats[20]} | Ø25mm: ${stats[25]} | Ø32mm+: ${stats[32]}`);

  return finalPipes;
}

/**
 * Obtiene información de dimensionamiento para mostrar en UI
 */
export function getPipeDimensionInfo(
  pipe: PipeSegment,
  allPipes: PipeSegment[],
  radiators: Radiator[]
): {
  totalPower: number;
  flowRate: number;
  recommendedDiameter: number;
  radiatorCount: number;
} {
  const pipePowers = calculatePipePowers(allPipes, radiators);

  let targetPipe = pipe;
  if (pipe.pipeType === 'return') {
    const supplyPipe = allPipes.find(p =>
      p.pipeType === 'supply' &&
      p.id.replace('supply', '') === pipe.id.replace('return', '')
    );
    if (supplyPipe) {
      targetPipe = supplyPipe;
    }
  }

  const totalPower = pipePowers.get(targetPipe.id) || 0;
  const flowRate = calculateFlowRate(totalPower);
  const recommendedDiameter = calculatePipeDiameter(flowRate);

  // Contar radiadores (aproximado)
  const supplyPipes = allPipes.filter(p => p.pipeType === 'supply');
  const childrenMap = new Map<string, string[]>();
  supplyPipes.forEach(p => childrenMap.set(p.id, []));
  supplyPipes.forEach(p => {
    if (p.fromElementId) {
      const arr = childrenMap.get(p.fromElementId);
      if (arr) arr.push(p.id);
    }
  });

  function countRads(pipeId: string, visited: Set<string>): number {
    if (visited.has(pipeId)) return 0;
    visited.add(pipeId);
    const p = supplyPipes.find(x => x.id === pipeId);
    if (!p) return 0;
    let count = p.toElementId && radiators.some(r => r.id === p.toElementId) ? 1 : 0;
    (childrenMap.get(pipeId) || []).forEach(c => count += countRads(c, visited));
    return count;
  }

  const radiatorCount = countRads(targetPipe.id, new Set());

  return {
    totalPower,
    flowRate: Math.round(flowRate),
    recommendedDiameter,
    radiatorCount
  };
}
