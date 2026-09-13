// «Mandámelo por correo» — el botón al pie de cada respuesta de Martín.
//
// Idea suya del 11/9: que la consulta le quede de repaso al instalador para
// cuando esté en la obra. Sale con un botón y no sola: el que lo pide lo
// quiere, uno automático por consulta se vuelve ruido, y encima cada clic dice
// qué respuestas valieron la pena.
//
// El correo lo arma la Edge Function `enviar-resumen`, que manda SIEMPRE a la
// dirección de la cuenta: de acá sale el texto, nunca el destinatario.

import { useCallback, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

export type EstadoEnvio = 'listo' | 'enviando' | 'enviado' | 'error'

/**
 * La respuesta se identifica por su contenido y no por su posición: si el
 * instalador limpia el chat, los índices se reciclan y un botón recién abierto
 * aparecería como «ya enviado».
 */
export function claveDeRespuesta(respuesta: string): string {
    return `${respuesta.length}:${respuesta.slice(0, 40)}`
}

export interface UseEnviarResumen {
    estadoDe: (respuesta: string) => EstadoEnvio
    errorDe: (respuesta: string) => string | null
    enviar: (pregunta: string, respuesta: string) => Promise<void>
}

export function useEnviarResumen(): UseEnviarResumen {
    const [estados, setEstados] = useState<Record<string, EstadoEnvio>>({})
    const [errores, setErrores] = useState<Record<string, string>>({})

    const estadoDe = useCallback(
        (respuesta: string): EstadoEnvio => estados[claveDeRespuesta(respuesta)] ?? 'listo',
        [estados],
    )

    const errorDe = useCallback(
        (respuesta: string): string | null => errores[claveDeRespuesta(respuesta)] ?? null,
        [errores],
    )

    const enviar = useCallback(async (pregunta: string, respuesta: string) => {
        const clave = claveDeRespuesta(respuesta)

        if (!isSupabaseConfigured) {
            setEstados(e => ({ ...e, [clave]: 'error' }))
            setErrores(e => ({ ...e, [clave]: 'El correo no está disponible en modo de desarrollo.' }))
            return
        }

        setEstados(e => ({ ...e, [clave]: 'enviando' }))
        setErrores(e => ({ ...e, [clave]: '' }))

        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session?.access_token) throw new Error('Tu sesión expiró. Ingresá de nuevo.')

            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
            const res = await fetch(`${supabaseUrl}/functions/v1/enviar-resumen`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ pregunta, respuesta }),
            })

            if (!res.ok) {
                const cuerpo = await res.json().catch(() => ({})) as { message?: string; error?: string }
                throw new Error(cuerpo.message ?? cuerpo.error ?? 'No se pudo mandar el correo.')
            }

            setEstados(e => ({ ...e, [clave]: 'enviado' }))
        } catch (err) {
            setEstados(e => ({ ...e, [clave]: 'error' }))
            setErrores(e => ({
                ...e,
                [clave]: err instanceof Error ? err.message : 'No se pudo mandar el correo.',
            }))
        }
    }, [])

    return { estadoDe, errorDe, enviar }
}
