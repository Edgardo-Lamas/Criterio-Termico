import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type SubscriptionTier = 'free' | 'pro' | 'premium'

interface User {
    id: string
    email: string
    name?: string
    tier: SubscriptionTier
    createdAt: Date
}

interface AuthState {
    user: User | null
    isLoading: boolean
    isAuthenticated: boolean

    // Actions
    setUser: (user: User | null) => void
    setLoading: (loading: boolean) => void
    login: (email: string, password: string) => Promise<void>
    logout: () => void

    // Tier helpers
    canAccess: (requiredTier: SubscriptionTier) => boolean
}

const tierHierarchy: Record<SubscriptionTier, number> = {
    free: 0,
    pro: 1,
    premium: 2
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            isLoading: true,
            isAuthenticated: false,

            setUser: (user) => set({
                user,
                isAuthenticated: !!user,
                isLoading: false
            }),

            setLoading: (isLoading) => set({ isLoading }),

            login: async (email: string, _password: string) => {
                // TODO: Implementar autenticación real con Firebase/Supabase
                // Por ahora, crear usuario demo
                set({ isLoading: true })

                await new Promise(resolve => setTimeout(resolve, 1000))

                const demoUser: User = {
                    id: 'demo-user-1',
                    email,
                    name: 'Usuario Demo',
                    tier: 'free',
                    createdAt: new Date()
                }

                set({
                    user: demoUser,
                    isAuthenticated: true,
                    isLoading: false
                })
            },

            logout: () => {
                set({
                    user: null,
                    isAuthenticated: false
                })
            },

            canAccess: (requiredTier: SubscriptionTier) => {
                const { user } = get()
                if (!user) return requiredTier === 'free'
                return tierHierarchy[user.tier] >= tierHierarchy[requiredTier]
            }
        }),
        {
            name: 'criterio-auth-storage',
            partialize: (state) => ({ user: state.user })
        }
    )
)
