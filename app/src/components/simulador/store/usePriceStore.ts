import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Interface for product prices
 */
export interface ProductPrices {
    // Radiators - price per element
    radiators: Record<string, number>;

    // Boilers - price per unit
    boilers: Record<string, number>;

    // Pipes - price per meter by diameter
    pipes: Record<number, number>; // key is diameter in mm

    // Accessories
    accessories: Record<string, number>;

    // Labor costs
    labor: {
        radiatorInstallation: number; // per radiator
        boilerInstallation: number;   // per boiler
        pipingPerMeter: number;       // per meter of pipe
    };

    // Markup percentage (0-100)
    markupPercent: number;
}

interface PriceStore {
    prices: ProductPrices;
    lastUpdated: string | null;

    // Actions
    updateRadiatorPrice: (productId: string, price: number) => void;
    updateBoilerPrice: (productId: string, price: number) => void;
    updatePipePrice: (diameterMm: number, pricePerMeter: number) => void;
    updateAccessoryPrice: (productId: string, price: number) => void;
    updateLaborCosts: (labor: Partial<ProductPrices['labor']>) => void;
    updateMarkup: (percent: number) => void;
    resetToDefaults: () => void;

    // Getters
    getRadiatorPrice: (productId: string) => number;
    getBoilerPrice: (productId: string) => number;
    getPipePrice: (diameterMm: number) => number;
    getAccessoryPrice: (productId: string) => number;
}

const DEFAULT_PRICES: ProductPrices = {
    radiators: {
        'peisa-tropical-500': 22000,
        'peisa-tropical-350': 18000,
        'baxi-500': 23000,
    },
    boilers: {
        'peisa-diva-ds': 850000,
        'baxi-main-5': 920000,
    },
    pipes: {
        16: 1500,   // PE-X Ø16mm per meter
        20: 2200,   // PE-X Ø20mm per meter
        25: 3500,   // PE-X Ø25mm per meter
        32: 5000,   // PE-X Ø32mm per meter
    },
    accessories: {
        'kit-radiador': 25000,
        'kit-conexion-caldera': 85000,
        'termostato': 45000,
    },
    labor: {
        radiatorInstallation: 15000,
        boilerInstallation: 45000,
        pipingPerMeter: 3000,
    },
    markupPercent: 15,
};

export const usePriceStore = create<PriceStore>()(
    persist(
        (set, get) => ({
            prices: DEFAULT_PRICES,
            lastUpdated: null,

            updateRadiatorPrice: (productId, price) => {
                set((state) => ({
                    prices: {
                        ...state.prices,
                        radiators: { ...state.prices.radiators, [productId]: price },
                    },
                    lastUpdated: new Date().toISOString(),
                }));
            },

            updateBoilerPrice: (productId, price) => {
                set((state) => ({
                    prices: {
                        ...state.prices,
                        boilers: { ...state.prices.boilers, [productId]: price },
                    },
                    lastUpdated: new Date().toISOString(),
                }));
            },

            updatePipePrice: (diameterMm, pricePerMeter) => {
                set((state) => ({
                    prices: {
                        ...state.prices,
                        pipes: { ...state.prices.pipes, [diameterMm]: pricePerMeter },
                    },
                    lastUpdated: new Date().toISOString(),
                }));
            },

            updateAccessoryPrice: (productId, price) => {
                set((state) => ({
                    prices: {
                        ...state.prices,
                        accessories: { ...state.prices.accessories, [productId]: price },
                    },
                    lastUpdated: new Date().toISOString(),
                }));
            },

            updateLaborCosts: (labor) => {
                set((state) => ({
                    prices: {
                        ...state.prices,
                        labor: { ...state.prices.labor, ...labor },
                    },
                    lastUpdated: new Date().toISOString(),
                }));
            },

            updateMarkup: (percent) => {
                set((state) => ({
                    prices: { ...state.prices, markupPercent: percent },
                    lastUpdated: new Date().toISOString(),
                }));
            },

            resetToDefaults: () => {
                set({ prices: DEFAULT_PRICES, lastUpdated: null });
            },

            // Getters with fallback to 0
            getRadiatorPrice: (productId) => {
                return get().prices.radiators[productId] || 0;
            },

            getBoilerPrice: (productId) => {
                return get().prices.boilers[productId] || 0;
            },

            getPipePrice: (diameterMm) => {
                return get().prices.pipes[diameterMm] || 0;
            },

            getAccessoryPrice: (productId) => {
                return get().prices.accessories[productId] || 0;
            },
        }),
        {
            name: 'calefaccion-prices-v2', // Versioned to pick up new defaults
        }
    )
);
