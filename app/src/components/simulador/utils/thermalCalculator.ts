import type { Room } from '../models/Room';
import type { Radiator } from '../models/Radiator';

/**
 * Calcula la potencia requerida para una habitación
 * Formula base: Volumen (m²×altura) × Factor térmico (Kcal/h·m³)
 * Ajustes opcionales (suma, no multiplica):
 * - Pared exterior: +15%
 * - Ventanas: +0% a +20%
 */
type RoomPowerInput = Pick<Room, 'area' | 'height' | 'thermalFactor' | 'hasExteriorWall' | 'windowsLevel'>;

export function calculateRoomPower(room: RoomPowerInput): number {
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

// Caldera más chica del mercado argentino: 24 kW. No es un mínimo térmico sino
// COMERCIAL — abajo de eso no hay producto. Con la regla del 80% cubre 16.512
// kcal/h, que es la casa promedio (unos 80 elementos de 500 × 200 kcal/h).
// Por eso el cálculo casi nunca elige la caldera: su trabajo real es avisar
// CUÁNDO te pasás de 24 kW y hay que ir a una más grande.
export const CALDERA_MIN_KW = 24;
export const CALDERA_MIN_KCALH = CALDERA_MIN_KW * 860; // 20.640 kcal/h

/**
 * Calcula la potencia de caldera necesaria a partir de los emisores instalados
 * (radiadores + piso radiante), no de la pérdida de los ambientes: con el
 * elemento valuado en 200 kcal/h —valor de obra, ver autoLayout— la potencia
 * instalada no viene inflada, así que es lo que la caldera tiene que alimentar.
 *
 * La caldera trabaja al 80% de su capacidad → Caldera = Emisores ÷ 0,80,
 * con piso en la más chica que existe (24 kW).
 */
export function calculateBoilerPower(
  radiators: Radiator[],
  pisoRadianteKcalh = 0
): {
  totalRadiatorPower: number;
  totalEmittersPower: number;
  /** Lo que pide la instalación (emisores ÷ 0,80), sin piso comercial */
  calculatedPower: number;
  /** La caldera a instalar: nunca menos que la más chica del mercado */
  recommendedBoilerPower: number;
  /** true si manda el mínimo comercial y no el cálculo */
  limitadoPorMinimoComercial: boolean;
  workingPercentage: number;
} {
  const totalRadiatorPower = radiators.reduce((sum, rad) => sum + rad.power, 0);
  const totalEmittersPower = totalRadiatorPower + Math.max(0, pisoRadianteKcalh);

  const calculatedPower = Math.round(totalEmittersPower / 0.80);
  const recommendedBoilerPower = Math.max(calculatedPower, CALDERA_MIN_KCALH);

  return {
    totalRadiatorPower,
    totalEmittersPower,
    calculatedPower,
    recommendedBoilerPower,
    limitadoPorMinimoComercial: calculatedPower < CALDERA_MIN_KCALH,
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
