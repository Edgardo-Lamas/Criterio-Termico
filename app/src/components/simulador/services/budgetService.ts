import { CATALOG } from '../data/catalog';
import type { BoilerModel, RadiatorModel, AccessoryModel } from '../data/catalog';
import type { ProductPrices } from '../store/usePriceStore';

export interface BudgetOptions {
    suggestedBoilers: BoilerModel[];
    allRadiators: RadiatorModel[];
    accessories: AccessoryModel[];
}

export interface SelectedBudget {
    boilerId: string | null;
    radiatorId: string | null;
    totalCost: number;
    materialsCost: number;
    laborCost: number;
    markupAmount: number;
    breakdown: {
        boiler: { model: BoilerModel; cost: number } | null;
        radiators: { model: RadiatorModel; count: number; totalCost: number } | null;
        pipes: { diameterMm: number; meters: number; costPerMeter: number; totalCost: number }[];
        accessories: { model: AccessoryModel; count: number; totalCost: number }[];
        labor: {
            radiatorInstallation: { count: number; costPer: number; total: number };
            boilerInstallation: { count: number; costPer: number; total: number };
            pipingInstallation: { meters: number; costPerMeter: number; total: number };
        };
    };
}

export interface PipeQuantities {
    [diameterMm: number]: number; // meters per diameter
}

/**
 * Generates available options for the budget based on technical requirements
 */
export function generateBudgetOptions(totalPowerKcal: number): BudgetOptions {
    // 1. Filter boilers
    const validBoilers = CATALOG.boilers
        .filter(b => b.maxPowerKcal >= totalPowerKcal)
        .sort((a, b) => a.maxPowerKcal - b.maxPowerKcal);

    // If no boiler is powerful enough, return the most powerful one as a fallback suggestion
    if (validBoilers.length === 0 && CATALOG.boilers.length > 0) {
        const mostPowerful = [...CATALOG.boilers].sort((a, b) => b.maxPowerKcal - a.maxPowerKcal)[0];
        validBoilers.push(mostPowerful);
    }

    return {
        suggestedBoilers: validBoilers,
        allRadiators: CATALOG.radiators,
        accessories: CATALOG.accessories || [],
    };
}

/**
 * Calculates the total budget based on selected models and user-configured prices
 */
export function calculateTotalBudget(
    boilerId: string | null,
    radiatorId: string | null,
    radiatorTotalElements: number,
    radiatorCount: number,
    prices: ProductPrices,
    pipeQuantities: PipeQuantities = {}
): SelectedBudget {
    let materialsCost = 0;
    let laborCost = 0;

    // 1. BOILER COST
    const boiler = CATALOG.boilers.find(b => b.id === boilerId) || null;
    const boilerCost = boiler ? (prices.boilers[boiler.id] || 0) : 0;
    materialsCost += boilerCost;

    // 2. RADIATOR COST (price per element × total elements)
    const radiator = CATALOG.radiators.find(r => r.id === radiatorId) || null;
    let radiatorTotalCost = 0;
    if (radiator) {
        const pricePerElement = prices.radiators[radiator.id] || 0;
        radiatorTotalCost = radiatorTotalElements * pricePerElement;
    }
    materialsCost += radiatorTotalCost;

    // 3. PIPES COST (price per meter × meters per diameter)
    const pipesBreakdown: { diameterMm: number; meters: number; costPerMeter: number; totalCost: number }[] = [];
    for (const [diameter, meters] of Object.entries(pipeQuantities)) {
        const diameterNum = parseInt(diameter);
        const costPerMeter = prices.pipes[diameterNum] || 0;
        const totalCost = meters * costPerMeter;
        materialsCost += totalCost;
        if (meters > 0) {
            pipesBreakdown.push({
                diameterMm: diameterNum,
                meters,
                costPerMeter,
                totalCost
            });
        }
    }

    // 4. ACCESSORIES COST
    const accessoriesBreakdown: { model: AccessoryModel; count: number; totalCost: number }[] = [];

    if (CATALOG.accessories) {
        // Radiator Kits (1 per actual radiator unit)
        if (radiatorCount > 0) {
            const kit = CATALOG.accessories.find(a => a.id === 'kit-radiador');
            if (kit) {
                const pricePerKit = prices.accessories['kit-radiador'] || 0;
                const cost = radiatorCount * pricePerKit;
                materialsCost += cost;
                accessoriesBreakdown.push({ model: kit, count: radiatorCount, totalCost: cost });
            }
        }

        // Boiler Connection Kit (1 if boiler is present)
        if (boilerId) {
            const kit = CATALOG.accessories.find(a => a.id === 'kit-conexion-caldera');
            if (kit) {
                const pricePerKit = prices.accessories['kit-conexion-caldera'] || 0;
                const cost = 1 * pricePerKit;
                materialsCost += cost;
                accessoriesBreakdown.push({ model: kit, count: 1, totalCost: cost });
            }
        }

        // Thermostat (Always 1 suggested)
        const thermo = CATALOG.accessories.find(a => a.id === 'termostato');
        if (thermo) {
            const price = prices.accessories['termostato'] || 0;
            const cost = 1 * price;
            materialsCost += cost;
            accessoriesBreakdown.push({ model: thermo, count: 1, totalCost: cost });
        }
    }

    // 5. LABOR COSTS
    const radiatorInstallationTotal = radiatorCount * (prices.labor.radiatorInstallation || 0);
    const boilerInstallationTotal = boilerId ? (prices.labor.boilerInstallation || 0) : 0;
    const totalPipeMeters = Object.values(pipeQuantities).reduce((sum, m) => sum + m, 0);
    const pipingInstallationTotal = totalPipeMeters * (prices.labor.pipingPerMeter || 0);

    laborCost = radiatorInstallationTotal + boilerInstallationTotal + pipingInstallationTotal;

    // 6. MARKUP
    const markupPercent = prices.markupPercent || 0;
    const markupAmount = (materialsCost * markupPercent) / 100;

    // TOTAL
    const totalCost = materialsCost + laborCost + markupAmount;

    return {
        boilerId,
        radiatorId,
        totalCost,
        materialsCost,
        laborCost,
        markupAmount,
        breakdown: {
            boiler: boiler ? { model: boiler, cost: boilerCost } : null,
            radiators: radiator ? { model: radiator, count: radiatorTotalElements, totalCost: radiatorTotalCost } : null,
            pipes: pipesBreakdown,
            accessories: accessoriesBreakdown,
            labor: {
                radiatorInstallation: {
                    count: radiatorCount,
                    costPer: prices.labor.radiatorInstallation || 0,
                    total: radiatorInstallationTotal
                },
                boilerInstallation: {
                    count: boilerId ? 1 : 0,
                    costPer: prices.labor.boilerInstallation || 0,
                    total: boilerInstallationTotal
                },
                pipingInstallation: {
                    meters: totalPipeMeters,
                    costPerMeter: prices.labor.pipingPerMeter || 0,
                    total: pipingInstallationTotal
                },
            }
        }
    };
}

