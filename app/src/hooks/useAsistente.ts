// Hook del asistente técnico flotante "Criterio"
// Gestiona estado del chat, streaming SSE y cancelación con AbortController.

import { useState, useRef, useCallback, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

// ── Tipos exportados ──────────────────────────────────────────────────────────

export interface Message {
    role: 'user' | 'assistant'
    content: string
}

export interface AsistenteState {
    messages: Message[]
    input: string
    streaming: boolean
    open: boolean
}

export interface UseAsistente extends AsistenteState {
    setInput: (value: string) => void
    setOpen: (value: boolean) => void
    sendMessage: () => Promise<void>
    clearMessages: () => void
    isOnline: boolean
    error: string | null
    /** true si el usuario está en el Simulador 2D: Criterio ve el proyecto abierto */
    enSimulador: boolean
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAsistente(): UseAsistente {
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [streaming, setStreaming] = useState(false)
    const [open, setOpen] = useState(false)
    const [isOnline, setIsOnline] = useState(navigator.onLine)
    const [error, setError] = useState<string | null>(null)

    const abortRef = useRef<AbortController | null>(null)

    // En el Simulador, cada consulta viaja con el resumen del proyecto abierto
    // (AsistenteTermico se monta dentro de BrowserRouter, así que hay Router).
    const location = useLocation()
    const enSimulador = location.pathname.startsWith('/herramientas/simulador')

    // Detectar cambios de conectividad
    useEffect(() => {
        const handleOnline = () => setIsOnline(true)
        const handleOffline = () => setIsOnline(false)
        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)
        return () => {
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
        }
    }, [])

    // Cancelar stream al desmontar
    useEffect(() => {
        return () => {
            abortRef.current?.abort()
        }
    }, [])

    const sendMessage = useCallback(async () => {
        const trimmed = input.trim()
        if (!trimmed || streaming) return

        // Sin conexión: mostrar error claro en lugar de fallar silenciosamente
        if (!isOnline) {
            setError('Sin conexión a internet. El asistente requiere conexión.')
            return
        }

        if (!isSupabaseConfigured) {
            setError('El asistente no está disponible en modo de desarrollo sin Supabase configurado.')
            return
        }

        setError(null)

        const userMessage: Message = { role: 'user', content: trimmed }
        const updatedMessages: Message[] = [...messages, userMessage]
        const placeholderAssistant: Message = { role: 'assistant', content: '' }

        setMessages([...updatedMessages, placeholderAssistant])
        setInput('')
        setStreaming(true)

        abortRef.current = new AbortController()

        try {
            // Obtener token JWT de la sesión activa
            const { data: { session } } = await supabase.auth.getSession()
            if (!session?.access_token) {
                throw new Error('Sesión no válida. Iniciá sesión nuevamente.')
            }

            // Contexto del Simulador: se arma fresco en cada envío para que
            // refleje el estado actual del canvas. Import dinámico: el módulo
            // vive en el chunk del Simulador y no engorda el bundle principal.
            let contextoSimulador: string | null = null
            if (enSimulador) {
                try {
                    const { resumenProyectoSimulador } = await import('../components/simulador/utils/asistenteContext')
                    contextoSimulador = resumenProyectoSimulador()
                } catch {
                    // Sin contexto el asistente responde igual que siempre
                }
            }

            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
            const response = await fetch(
                `${supabaseUrl}/functions/v1/asistente-termico`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.access_token}`,
                    },
                    body: JSON.stringify({
                        messages: updatedMessages,
                        ...(contextoSimulador ? { contextoSimulador } : {}),
                    }),
                    signal: abortRef.current.signal,
                }
            )

            // Manejar errores HTTP antes de leer el stream
            if (!response.ok) {
                const errorBody = await response.json().catch(() => ({ error: 'Error desconocido' })) as { error?: string; message?: string }
                const msg = errorBody.message ?? errorBody.error ?? `Error ${response.status}`

                if (response.status === 429) {
                    throw new Error(msg)
                } else if (response.status === 401) {
                    throw new Error('Tu sesión expiró. Iniciá sesión nuevamente.')
                } else {
                    throw new Error(msg)
                }
            }

            if (!response.body) {
                throw new Error('No se recibió respuesta del servidor.')
            }

            // Leer stream SSE
            const reader = response.body.getReader()
            const decoder = new TextDecoder()
            let assistantText = ''
            let buffer = ''

            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                buffer += decoder.decode(value, { stream: true })
                const lines = buffer.split('\n')
                // El último elemento puede ser una línea incompleta
                buffer = lines.pop() ?? ''

                for (const line of lines) {
                    if (!line.startsWith('data: ')) continue
                    const payload = line.slice(6).trim()
                    if (payload === '[DONE]') break

                    try {
                        const parsed = JSON.parse(payload) as { text?: string; error?: string }
                        if (parsed.error) throw new Error(parsed.error)
                        if (parsed.text) {
                            assistantText += parsed.text
                            setMessages(prev => [
                                ...prev.slice(0, -1),
                                { role: 'assistant', content: assistantText },
                            ])
                        }
                    } catch {
                        // Línea malformada — ignorar y continuar
                    }
                }
            }

            // Si no llegó nada, poner un mensaje de error
            if (!assistantText) {
                setMessages(prev => [
                    ...prev.slice(0, -1),
                    { role: 'assistant', content: 'No recibí respuesta. Intentá de nuevo.' },
                ])
            }

        } catch (err) {
            if (err instanceof Error && err.name === 'AbortError') {
                // Cancelación por el usuario — quitar el placeholder
                setMessages(prev => prev.slice(0, -1))
                return
            }

            const message = err instanceof Error ? err.message : 'Ocurrió un error. Intentá de nuevo.'
            setError(message)
            // Mostrar el error como mensaje del asistente
            setMessages(prev => [
                ...prev.slice(0, -1),
                { role: 'assistant', content: `⚠️ ${message}` },
            ])
        } finally {
            setStreaming(false)
        }
    }, [input, messages, streaming, isOnline, enSimulador])

    const clearMessages = useCallback(() => {
        abortRef.current?.abort()
        setMessages([])
        setError(null)
        setStreaming(false)
    }, [])

    return {
        messages,
        input,
        streaming,
        open,
        isOnline,
        error,
        enSimulador,
        setInput,
        setOpen,
        sendMessage,
        clearMessages,
    }
}
