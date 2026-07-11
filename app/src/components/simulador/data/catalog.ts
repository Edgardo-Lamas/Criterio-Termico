// Tipo de salida de gases de la caldera. Define la compatibilidad con piso
// radiante: condensación IDEAL (aprovecha el retorno frío), forzado aceptable,
// natural NUNCA (el retorno frío condensa los gases y corroe el equipo).
export type TipoTiro = 'condensacion' | 'forzado' | 'natural';

export const TIPO_TIRO_LABEL: Record<TipoTiro, string> = {
    condensacion: 'Condensación',
    forzado: 'Tiro forzado',
    natural: 'Tiro natural',
};

export interface BoilerModel {
    id: string;
    brand: 'BAXI' | 'PEISA' | 'Generic';
    model: string;
    tipoTiro: TipoTiro;
    maxPowerKcal: number;
    maxPowerKw: number;
    cost: number;
    width: number;
    height: number;
    depth: number;
    isDefault?: boolean;
}

export interface RadiatorModel {
    id: string;
    brand: 'BAXI' | 'PEISA' | 'Generic';
    model: string;
    heightMm: number; // Distancia entre centros o altura total según contexto (aquí usaremos convención estándar)
    widthMm: number;
    powerKcal: number; // Potencia por elemento a ΔT50
    cost: number;
}

export interface PipeModel {
    id: string;
    brand: string;
    diameterMm: number;
    costPerMeter: number;
}

export interface AccessoryModel {
    id: string;
    name: string;
    cost: number;
}

export const CATALOG = {
    boilers: [
        {
            id: 'peisa-diva-ds',
            brand: 'PEISA',
            model: 'Diva DS',
            tipoTiro: 'natural', // VERIFICAR con catálogo del fabricante
            maxPowerKcal: 20640, // ~24kW
            maxPowerKw: 24,
            cost: 850000,
            width: 400,
            height: 700,
            depth: 320,
            isDefault: true
        },
        {
            id: 'baxi-main-5',
            brand: 'BAXI',
            model: 'Main 5',
            tipoTiro: 'forzado', // cámara estanca — VERIFICAR con catálogo
            maxPowerKcal: 20640,
            maxPowerKw: 24,
            cost: 920000,
            width: 400,
            height: 700,
            depth: 300
        },
        {
            id: 'baxi-duotec-compact-24',
            brand: 'BAXI',
            model: 'Duo-tec Compact 24',
            tipoTiro: 'condensacion', // PRECIO DE REFERENCIA — ajustar
            maxPowerKcal: 20640,
            maxPowerKw: 24,
            cost: 1900000,
            width: 400,
            height: 700,
            depth: 300
        }
    ] as BoilerModel[],

    radiators: [
        {
            id: 'peisa-tropical-500',
            brand: 'PEISA',
            model: 'Tropical 500',
            heightMm: 500,
            widthMm: 80,
            powerKcal: 200, // REGLA CRÍTICA: Valor forzado a 200 Kcal/h
            cost: 22000
        },
        {
            id: 'peisa-tropical-350',
            brand: 'PEISA',
            model: 'Tropical 350',
            heightMm: 350,
            widthMm: 80,
            powerKcal: 140, // Estimado proporcional (200 * 350/500 = 140)
            cost: 18000
        },
        {
            id: 'baxi-500',
            brand: 'BAXI',
            model: 'Modelo 500',
            heightMm: 500,
            widthMm: 80,
            powerKcal: 200, // REGLA CRÍTICA
            cost: 23000
        }
    ] as RadiatorModel[],

    pipes: [] as PipeModel[],
    accessories: [
        {
            id: 'kit-radiador',
            name: 'Kit de Armado de Radiador',
            cost: 25000
        },
        {
            id: 'kit-conexion-caldera',
            name: 'Kit de Conexión de Caldera',
            cost: 85000
        },
        {
            id: 'termostato',
            name: 'Termostato de Ambiente Digital',
            cost: 45000
        }
    ] as AccessoryModel[]
};
