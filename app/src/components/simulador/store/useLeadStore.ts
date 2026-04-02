import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SelectedBudget } from '../services/budgetService';
import type { ClientInfo } from '../stores/companyStore';

export interface Lead {
    id: string;
    clientId: string; // email or unique ref
    clientInfo: ClientInfo;
    budgetSummary: {
        totalPower: number;
        radiatorCount: number;
        boilerModel: string;
        totalCost: number;
    };
    createdAt: string;
}

interface LeadStore {
    leads: Lead[];
    globalBudgetCount: number; // For the "Proof" counter

    saveLead: (clientInfo: ClientInfo, budget: SelectedBudget, totalPower: number, radiatorCount: number) => void;
    incrementGlobalCount: () => void;
    getLeads: () => Lead[];
}

// Initial fake base for "Social Proof" (e.g. 14,352)
const INITIAL_COUNT_BASE = 14352;

export const useLeadStore = create<LeadStore>()(
    persist(
        (set, get) => ({
            leads: [],
            globalBudgetCount: INITIAL_COUNT_BASE,

            saveLead: (clientInfo, budget, totalPower, radiatorCount) => {
                const newLead: Lead = {
                    id: crypto.randomUUID(),
                    clientId: clientInfo.email || 'anonymous',
                    clientInfo,
                    budgetSummary: {
                        totalPower,
                        radiatorCount,
                        boilerModel: budget.breakdown.boiler?.model.model || 'N/A',
                        totalCost: budget.totalCost,
                    },
                    createdAt: new Date().toISOString(),
                };

                set((state) => ({
                    leads: [...state.leads, newLead],
                    globalBudgetCount: state.globalBudgetCount + 1,
                }));

                console.log('Lead Captured:', newLead);
            },

            incrementGlobalCount: () => {
                set((state) => ({ globalBudgetCount: state.globalBudgetCount + 1 }));
            },

            getLeads: () => get().leads,
        }),
        {
            name: 'lead-storage'
        }
    )
);
