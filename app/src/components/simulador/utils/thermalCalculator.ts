import type { Room } from '../models/Room';
import type { Radiator } from '../models/Radiator';

/**
 * Calcula la potencia requerida para una habitación
 * Formula base: Volumen (m²×altura) × Factor térmico (Kcal/h·m³)
 * Ajustes opcionales (suma, no multiplica):
 * - Pared exterior: +15%
 * - Ventanas: +0% a +20%
 */
export function calculateRoomPower(room: Room): number {
  // Potencia base: volumen × factor térmico
  const volume = room.area * room.height;
  let power = volume * room.thermalFactor;

  // Ajustes se suman, NO se multiplican
  let totalAdjustment = 0;

  // Ajuste por pared exterior
  if (room.hasExteriorWall) {
    totalAdjustment += 0.15; // +15%
  }

  // Ajuste por nivel de ventanas
  const windowAdjustments = {
    'sin-ventanas': 0,      // 0%
    'pocas': 0.05,          // +5%
    'normales': 0.10,       // +10%
    'muchas': 0.20          // +20%
  };
  totalAdjustment += windowAdjustments[room.windowsLevel];

  // Aplicar ajuste total
  power = power * (1 + totalAdjustment);

  return Math.round(power);
}

/**
 * Calcula la potencia total instalada en radiadores de una habitación
 */
export function calculateInstalledPower(room: Room, radiators: Radiator[]): number {
  const roomRadiators = radiators.filter(rad => room.radiatorIds.includes(rad.id));
  const totalPower = roomRadiators.reduce((sum, rad) => sum + rad.power, 0);
  return totalPower;
}

/**
 * Verifica si la potencia instalada es suficiente para la habitación
 */
export function isPowerSufficient(room: Room, radiators: Radiator[]): {
  required: number;
  installed: number;
  sufficient: boolean;
  percentage: number;
} {
  const required = calculateRoomPower(room);
  const installed = calculateInstalledPower(room, radiators);
  const percentage = required > 0 ? Math.round((installed / required) * 100) : 0;

  return {
    required,
    installed,
    sufficient: installed >= required,
    percentage
  };
}

/**
 * Calcula la potencia de caldera necesaria
 * La caldera debe trabajar al 80% de su capacidad máxima
 * Por lo tanto: Potencia Caldera = Potencia Total Radiadores ÷ 0.80
 */
export function calculateBoilerPower(radiators: Radiator[]): {
  totalRadiatorPower: number;
  recommendedBoilerPower: number;
  workingPercentage: number;
} {
  // Sumar potencia de todos los radiadores
  const totalRadiatorPower = radiators.reduce((sum, rad) => sum + rad.power, 0);

  // La caldera debe tener capacidad para que trabaje al 80%
  // Potencia Caldera = Potencia Radiadores ÷ 0.80
  const recommendedBoilerPower = Math.round(totalRadiatorPower / 0.80);

  return {
    totalRadiatorPower,
    recommendedBoilerPower,
    workingPercentage: 80
  };
}

/**
 * Convierte Kcal/h a kW (para mostrar en ambas unidades)
 */
export function kcalToKw(kcal: number): number {
  return Math.round((kcal / 860) * 10) / 10; // 1 kW = 860 Kcal/h
}

/**
 * Convierte kW a Kcal/h
 */
export function kwToKcal(kw: number): number {
  return Math.round(kw * 860);
}
