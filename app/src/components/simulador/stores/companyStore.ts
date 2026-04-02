import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Promotion {
  id: string;
  name: string;
  discount: number;
  enabled: boolean;
}

export interface ClientInfo {
  name: string;
  email: string;
  phone: string;
  projectName: string;
  projectDate: string;
}

export interface CompanyInfo {
  logo: string;
  companyName: string;
  address: string;
  phone: string;
  email: string;
  website: string;
}

// Default company data (editable by user)
const defaultCompanyInfo: CompanyInfo = {
  logo: '',
  companyName: '',
  address: '',
  phone: '',
  email: '',
  website: '',
};

const defaultClientInfo: ClientInfo = {
  name: '',
  email: '',
  phone: '',
  projectName: '',
  projectDate: new Date().toISOString(),
};

interface CompanyStore {
  companyDetails: CompanyInfo;
  clientDetails: ClientInfo;

  updateCompanyInfo: (info: Partial<CompanyInfo>) => void;
  updateClientInfo: (info: Partial<ClientInfo>) => void;
  resetCompanyInfo: () => void;
  resetClientInfo: () => void;

  // Legacy/Promotions kept for internal use
  promotions: Promotion[];
  addPromotion: (promotion: Promotion) => void;
  updatePromotion: (id: string, updates: Partial<Promotion>) => void;
  deletePromotion: (id: string) => void;
  getActivePromotions: () => Promotion[];
}

export const useCompanyStore = create<CompanyStore>()(
  persist(
    (set, get) => ({
      companyDetails: defaultCompanyInfo,
      clientDetails: defaultClientInfo,
      promotions: [],

      updateCompanyInfo: (info) =>
        set((state) => ({
          companyDetails: { ...state.companyDetails, ...info },
        })),

      updateClientInfo: (info) =>
        set((state) => ({
          clientDetails: { ...state.clientDetails, ...info },
        })),

      resetCompanyInfo: () =>
        set({ companyDetails: defaultCompanyInfo }),

      resetClientInfo: () =>
        set({ clientDetails: { ...defaultClientInfo, projectDate: new Date().toISOString() } }),

      addPromotion: (promotion) =>
        set((state) => ({
          promotions: [...state.promotions, promotion],
        })),

      updatePromotion: (id, updates) =>
        set((state) => ({
          promotions: state.promotions.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        })),

      deletePromotion: (id) =>
        set((state) => ({
          promotions: state.promotions.filter((p) => p.id !== id),
        })),

      getActivePromotions: () =>
        get().promotions.filter((p) => p.enabled),
    }),
    {
      name: 'company-storage-v3', // Versioned to avoid conflicts with old data
      partialize: (state) => ({
        companyDetails: state.companyDetails,
        clientDetails: state.clientDetails
      }),
    }
  )
);

