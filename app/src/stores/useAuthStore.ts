import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

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
    authError: string | null

    // Actions
    setUser: (user: User | null) => void
    setLoading: (loading: boolean) => void
    initAuth: () => () => void            // devuelve unsubscribe
    login: (email: string, password: string) => Promise<void>
    register: (email: string, password: string) => Promise<void>
    logout: () => Promise<void>
    clearError: () => void

    // Tier helpers
    canAccess: (requiredTier: SubscriptionTier) => boolean
}

const tierHierarchy: Record<SubscriptionTier, number> = {
    free: 0,
    pro: 1,
    premium: 2,
}

// ── Helpers para Supabase ────────────────────────────────────────────────────

async function fetchProfile(userId: string): Promise<SubscriptionTier> {
    const { data } = await supabase
        .from('profiles')
        .select('tier')
        .eq('id', userId)
        .single()
    return (data?.tier as SubscriptionTier) ?? 'free'
}

function supabaseUserToStore(sbUser: { id: string; email?: string }, tier: SubscriptionTier): User {
    return {
        id: sbUser.id,
        email: sbUser.email ?? '',
        name: sbUser.email?.split('@')[0],
        tier,
        createdAt: new Date(),
    }
}

// ── Store ────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            isLoading: true,
            isAuthenticated: false,
            authError: null,

            setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),
            setLoading: (isLoading) => set({ isLoading }),
            clearError: () => set({ authError: null }),

            // ── initAuth — llamar una vez al montar la app ───────────────
            initAuth: () => {
                if (!isSupabaseConfigured) {
                    set({ isLoading: false })
                    return () => {}
                }

                // Recuperar sesión existente
                supabase.auth.getSession().then(async ({ data: { session } }) => {
                    if (session?.user) {
                        const tier = await fetchProfile(session.user.id)
                        set({
                            user: supabaseUserToStore(session.user, tier),
                            isAuthenticated: true,
                            isLoading: false,
                        })
                    } else {
                        set({ isLoading: false })
                    }
                })

                // Escuchar cambios de sesión (login, logout, token refresh)
                const { data: { subscription } } = supabase.auth.onAuthStateChange(
                    async (event, session) => {
                        if (session?.user) {
                            const tier = await fetchProfile(session.user.id)
                            set({
                                user: supabaseUserToStore(session.user, tier),
                                isAuthenticated: true,
                                isLoading: false,
                            })
                        } else if (event === 'SIGNED_OUT') {
                            set({ user: null, isAuthenticated: false, isLoading: false })
                        }
                    }
                )

                return () => subscription.unsubscribe()
            },

            // ── login ────────────────────────────────────────────────────
            login: async (email, password) => {
                set({ isLoading: true, authError: null })

                if (!isSupabaseConfigured) {
                    // Modo demo — pro para acceder a todo el contenido en desarrollo
                    await new Promise(resolve => setTimeout(resolve, 800))
                    set({
                        user: { id: 'demo-1', email, name: email.split('@')[0], tier: 'pro', createdAt: new Date() },
                        isAuthenticated: true,
                        isLoading: false,
                    })
                    return
                }

                const { error } = await supabase.auth.signInWithPassword({ email, password })
                if (error) {
                    set({ isLoading: false, authError: friendlyError(error.message) })
                }
                // Si ok, onAuthStateChange actualiza el estado
            },

            // ── register ─────────────────────────────────────────────────
            register: async (email, password) => {
                set({ isLoading: true, authError: null })

                if (!isSupabaseConfigured) {
                    await new Promise(resolve => setTimeout(resolve, 800))
                    set({
                        user: { id: 'demo-1', email, name: email.split('@')[0], tier: 'pro', createdAt: new Date() },
                        isAuthenticated: true,
                        isLoading: false,
                    })
                    return
                }

                const { error } = await supabase.auth.signUp({ email, password })
                if (error) {
                    set({ isLoading: false, authError: friendlyError(error.message) })
                } else {
                    set({ isLoading: false, authError: null })
                    // onAuthStateChange maneja el estado si la confirmación de email está desactivada
                }
            },

            // ── logout ───────────────────────────────────────────────────
            logout: async () => {
                if (isSupabaseConfigured) {
                    await supabase.auth.signOut()
                }
                set({ user: null, isAuthenticated: false })
            },

            // ── canAccess ────────────────────────────────────────────────
            canAccess: (requiredTier) => {
                const { user } = get()
                if (!user) return requiredTier === 'free'
                return tierHierarchy[user.tier] >= tierHierarchy[requiredTier]
            },
        }),
        {
            name: 'criterio-auth-storage',
            partialize: (state) => ({ user: state.user }),
        }
    )
)

// ── Errores amigables ────────────────────────────────────────────────────────

function friendlyError(msg: string): string {
    if (msg.includes('Invalid login credentials')) return 'Email o contraseña incorrectos.'
    if (msg.includes('Email not confirmed')) return 'Confirmá tu email antes de ingresar.'
    if (msg.includes('User already registered')) return 'Ya existe una cuenta con ese email.'
    if (msg.includes('Password should be at least')) return 'La contraseña debe tener al menos 6 caracteres.'
    if (msg.includes('rate limit')) return 'Demasiados intentos. Esperá unos minutos.'
    return 'Ocurrió un error. Intentá de nuevo.'
}
