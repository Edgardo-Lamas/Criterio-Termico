// Asistente técnico flotante "Criterio"
// Botón FAB fijo en pantalla + panel de chat con streaming SSE.
// Solo se monta si el usuario está autenticado (lo controla App.tsx).

import { useEffect, useRef, type KeyboardEvent } from 'react'
import { useAsistente, type Message, type UseAsistente } from '../../hooks/useAsistente'
import styles from './AsistenteTermico.module.css'
import { Icon } from '../ui/Icon/Icon'

// ── Burbuja de mensaje ────────────────────────────────────────────────────────

interface BubbleProps {
    message: Message
    isLast: boolean
    streaming: boolean
}

function Bubble({ message, isLast, streaming }: BubbleProps) {
    const isUser = message.role === 'user'
    const showCursor = !isUser && isLast && streaming && message.content.length > 0

    return (
        <div
            className={`${styles.bubble} ${isUser ? styles.bubbleUser : styles.bubbleAssistant}`}
            role="article"
            aria-label={isUser ? 'Tu mensaje' : 'Respuesta de Criterio'}
        >
            {message.content}
            {showCursor && <span className={styles.cursor} aria-hidden="true">▋</span>}
        </div>
    )
}

// ── Panel de chat — recibe el estado del hook desde arriba ────────────────────

interface ChatPanelProps {
    asistente: UseAsistente
    onClose: () => void
}

function ChatPanel({ asistente, onClose }: ChatPanelProps) {
    const {
        messages, input, streaming, isOnline,
        setInput, sendMessage, clearMessages,
    } = asistente

    const messagesEndRef = useRef<HTMLDivElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    // Auto-scroll al último mensaje
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    // Foco en textarea al abrir el panel
    useEffect(() => {
        const timer = setTimeout(() => textareaRef.current?.focus(), 50)
        return () => clearTimeout(timer)
    }, [])

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            sendMessage()
        }
    }

    const canSend = input.trim().length > 0 && !streaming && isOnline

    return (
        <div className={styles.panel} role="dialog" aria-label="Asistente técnico Criterio" aria-modal="false">
            {/* Header */}
            <div className={styles.panelHeader}>
                <div className={styles.panelTitle}>
                    <span className={styles.panelIcon} aria-hidden="true"><Icon name="flame" size={22} /></span>
                    <div>
                        <span className={styles.panelName}>Criterio</span>
                        <span className={styles.panelSub}>Asistente técnico</span>
                    </div>
                </div>
                <div className={styles.panelControls}>
                    {messages.length > 0 && (
                        <button
                            className={styles.btnClear}
                            onClick={clearMessages}
                            aria-label="Limpiar conversación"
                            title="Limpiar conversación"
                            disabled={streaming}
                        >
                            ✕ limpiar
                        </button>
                    )}
                    <button
                        className={styles.btnClose}
                        onClick={onClose}
                        aria-label="Cerrar asistente"
                    >
                        ✕
                    </button>
                </div>
            </div>

            {/* Sin conexión */}
            {!isOnline && (
                <div className={styles.offlineBanner} role="alert">
                    Sin conexión — el asistente no está disponible
                </div>
            )}

            {/* Mensajes */}
            <div className={styles.messages} role="log" aria-live="polite" aria-label="Conversación">
                {messages.length === 0 ? (
                    <div className={styles.welcome}>
                        <p className={styles.welcomeTitle}>Hola. Soy Criterio.</p>
                        <p className={styles.welcomeText}>
                            Describime tu consulta o el problema que tenés en obra y te ayudo.
                        </p>
                        <div className={styles.welcomeSuggestions}>
                            {[
                                'Radiadores fríos en planta baja',
                                'Qué diámetro de tubería uso',
                                'Cómo purgar una instalación',
                            ].map(s => (
                                <button
                                    key={s}
                                    className={styles.suggestion}
                                    onClick={() => {
                                        setInput(s)
                                        textareaRef.current?.focus()
                                    }}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    messages.map((msg, i) => (
                        <Bubble
                            key={i}
                            message={msg}
                            isLast={i === messages.length - 1}
                            streaming={streaming}
                        />
                    ))
                )}
                <div ref={messagesEndRef} aria-hidden="true" />
            </div>

            {/* Input */}
            <div className={styles.inputArea}>
                <textarea
                    ref={textareaRef}
                    className={styles.textarea}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={isOnline ? '¿Qué necesitás resolver? (Enter para enviar)' : 'Sin conexión…'}
                    rows={2}
                    disabled={streaming || !isOnline}
                    aria-label="Escribir consulta"
                    aria-disabled={streaming || !isOnline}
                />
                <button
                    className={styles.btnSend}
                    onClick={sendMessage}
                    disabled={!canSend}
                    aria-label={streaming ? 'Enviando…' : 'Enviar consulta'}
                >
                    {streaming ? (
                        <span className={styles.sendingDots} aria-hidden="true">···</span>
                    ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                        </svg>
                    )}
                </button>
            </div>
        </div>
    )
}

// ── Componente raíz — única instancia del hook ────────────────────────────────

export function AsistenteTermico() {
    const asistente = useAsistente()
    const { open, setOpen } = asistente

    return (
        <div className={styles.root}>
            {/* Panel de chat — comparte la instancia del hook */}
            <div
                className={`${styles.panelWrapper} ${open ? styles.panelOpen : ''}`}
                aria-hidden={!open}
            >
                {open && <ChatPanel asistente={asistente} onClose={() => setOpen(false)} />}
            </div>

            {/* Botón FAB */}
            <button
                className={`${styles.fab} ${open ? styles.fabOpen : ''}`}
                onClick={() => setOpen(!open)}
                aria-label={open ? 'Cerrar asistente técnico' : 'Abrir asistente técnico Criterio'}
                aria-expanded={open}
            >
                <span className={styles.fabIcon} aria-hidden="true">
                    <Icon name={open ? 'close' : 'flame'} size={26} />
                </span>
            </button>
        </div>
    )
}
