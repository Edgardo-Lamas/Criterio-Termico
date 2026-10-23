// Hook del asistente técnico flotante "Criterio"
// Gestiona estado del chat, streaming SSE y cancelación con AbortController.

import { useState, useRef, useCallback, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { ensureSesionParaAsistente } from '../stores/useAuthStore'
import { useAsistenteUI } from '../stores/useAsistenteUI'
import {
    AVISO_SILENCIO,
    AVISO_SIN_CONEXION,
    ESPERA_CONEXION_MS,
    ESPERA_SILENCIO_MS,
    crearVigia,
    interpretarLineaSSE,
} from './esperaDelAsistente'

// ── Tipos exportados ──────────────────────────────────────────────────────────

export interface Message {
    role: 'user' | 'assistant'
    content: string
}

interface AsistenteState {
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
    /**
     * Cuántas consultas del cupo mensual lleva usadas y cuándo se le renueva.
     * `null` hasta que haga la primera consulta de la sesión —el saldo llega en
     * las cabeceras de la respuesta— y también para el visitante sin cuenta,
     * cuyas 3 consultas no se renuevan.
     */
    cupo: { usadas: number; limite: number; renueva: string | null } | null
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAsistente(): UseAsistente {
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [streaming, setStreaming] = useState(false)
    const [open, setOpen] = useState(false)
    const [isOnline, setIsOnline] = useState(navigator.onLine)
    const [error, setError] = useState<string | null>(null)

    // Cuántas consultas le quedan del mes. Sale de las cabeceras de la
    // respuesta del asistente, así que se actualiza sola con cada consulta y no
    // hace falta una llamada aparte. `null` = todavía no se consultó nada en
    // esta sesión, o el visitante sin cuenta (que no tiene ciclo).
    const [cupo, setCupo] = useState<{ usadas: number; limite: number; renueva: string | null } | null>(null)

    const abortRef = useRef<AbortController | null>(null)

    const preguntaPendiente = useAsistenteUI(s => s.preguntaPendiente)
    const limpiarPregunta = useAsistenteUI(s => s.limpiar)

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

    // Alguien pidió abrir el asistente con una pregunta ya escrita (las de la
    // home). Se escribe en el campo en vez de enviarse sola: el que entra ve la
    // pregunta antes de que salga y puede cambiarla — es su consulta, no un demo
    // que se dispara solo.
    useEffect(() => {
        if (!preguntaPendiente) return

        setOpen(true)
        setInput(preguntaPendiente)
        limpiarPregunta()
    }, [preguntaPendiente, limpiarPregunta])

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

        const controller = new AbortController()
        abortRef.current = controller

        // Si el servidor no contesta, el vigía corta y se avisa. Sin esto la
        // consulta queda «pensando» para siempre (ver `esperaDelAsistente.ts`).
        const vigia = crearVigia(controller)
        vigia.vigilar(ESPERA_CONEXION_MS, AVISO_SIN_CONEXION)

        let assistantText = ''

        try {
            // El visitante sin cuenta también pregunta: si no hay sesión, se abre
            // una anónima acá mismo. No es un login —el header sigue mostrando
            // "Ingresar"— es el token que la Edge Function necesita para contar
            // el uso y responder.
            const listo = await vigia.esperar(ensureSesionParaAsistente())
            const { data: { session } } = await vigia.esperar(supabase.auth.getSession())

            if (!listo || !session?.access_token) {
                throw new Error('No se pudo abrir la conversación. Probá de nuevo en un momento.')
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
                    signal: controller.signal,
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
                } else if (response.status >= 500) {
                    // El detalle técnico queda en los logs de la función: al
                    // instalador no le sirve leer «Error interno del servidor».
                    throw new Error(AVISO_SIN_CONEXION)
                } else {
                    throw new Error(msg)
                }
            }

            // El saldo viene en cabeceras (ver `asistente-termico`). Si el
            // navegador no las expone —falta `Access-Control-Expose-Headers` en
            // el CORS— esto devuelve null y el contador simplemente no se dibuja,
            // sin romper el chat.
            const usadas = Number(response.headers.get('X-Cupo-Usadas'))
            const limite = Number(response.headers.get('X-Cupo-Limite'))
            if (Number.isFinite(usadas) && Number.isFinite(limite) && limite > 0) {
                setCupo({ usadas, limite, renueva: response.headers.get('X-Cupo-Renueva') })
            }

            if (!response.body) {
                throw new Error('No se recibió respuesta del servidor.')
            }

            // Leer stream SSE. Desde acá el reloj mide silencio, no el total:
            // se rearma con cada pedazo que llega.
            vigia.vigilar(ESPERA_SILENCIO_MS, AVISO_SILENCIO)
            const reader = response.body.getReader()
            const decoder = new TextDecoder()
            let buffer = ''
            let terminado = false

            while (!terminado) {
                const { done, value } = await reader.read()
                if (done) break
                vigia.vigilar(ESPERA_SILENCIO_MS, AVISO_SILENCIO)

                buffer += decoder.decode(value, { stream: true })
                const lines = buffer.split('\n')
                // El último elemento puede ser una línea incompleta
                buffer = lines.pop() ?? ''

                for (const line of lines) {
                    const linea = interpretarLineaSSE(line)
                    if (!linea) continue
                    if (linea.tipo === 'fin') {
                        terminado = true
                        break
                    }
                    if (linea.tipo === 'error') throw new Error(AVISO_SILENCIO)

                    assistantText += linea.texto
                    setMessages(prev => [
                        ...prev.slice(0, -1),
                        { role: 'assistant', content: assistantText },
                    ])
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
            const esCorte = err instanceof Error && err.name === 'AbortError'

            if (esCorte && !vigia.aviso) {
                // Cancelación por el usuario — quitar el placeholder
                setMessages(prev => prev.slice(0, -1))
                return
            }

            const message = vigia.aviso
                ?? (err instanceof Error ? err.message : 'Ocurrió un error. Intentá de nuevo.')
            setError(message)
            // Mostrar el error como mensaje del asistente. Si ya había escrito
            // algo, se conserva: el instalador puede haber leído justo eso.
            setMessages(prev => [
                ...prev.slice(0, -1),
                {
                    role: 'assistant',
                    content: assistantText ? `${assistantText}\n\n⚠️ ${message}` : `⚠️ ${message}`,
                },
            ])
        } finally {
            vigia.apagar()
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
        cupo,
        enSimulador,
        setInput,
        setOpen,
        sendMessage,
        clearMessages,
    }
}
