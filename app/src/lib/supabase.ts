import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''

/** true cuando las variables de entorno están configuradas */
export const isSupabaseConfigured = !!supabaseUrl && !!supabaseAnonKey

// createClient lanza error con strings vacíos.
// Usamos valores placeholder cuando no está configurado — el store
// revisa isSupabaseConfigured antes de hacer cualquier llamada real.
export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-anon-key-not-configured'
)

export type SupabaseProfile = {
    id: string
    email: string
    tier: 'free' | 'pro' | 'premium'
    created_at: string
}
