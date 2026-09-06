// Martín — el ayudante técnico de la plataforma
// De cuerpo entero en la esquina mientras está cerrado, panel de chat con
// streaming SSE al abrirlo. El personaje vive en Martin.tsx.
// Se monta SIEMPRE: el visitante sin cuenta también pregunta, con una sesión
// anónima y un cupo bajo (ver ensureSesionParaAsistente en useAuthStore).

import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { useAsistente, type Message, type UseAsistente } from '../../hooks/useAsistente'
import { MarkdownAsistente } from './MarkdownAsistente'
import { MartinCuerpo, MartinRetrato } from './Martin'
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
    // El modelo razona antes de escribir, así que entre el envío y la primera
    // palabra hay unos segundos con la burbuja vacía. Sin esto se lee como que
    // la consulta se perdió.
    const pensando = !isUser && isLast && streaming && message.content.length === 0

    // La respuesta va con la cara de Martín al lado: es lo que lo convierte en
    // alguien que contesta y no en un cuadro de texto que aparece.
    const cuerpo = (
        <div
            className={`${styles.bubble} ${isUser ? styles.bubbleUser : styles.bubbleAssistant}`}
            role="article"
            aria-label={isUser ? 'Tu mensaje' : 'Respuesta de Martín'}
        >
            {/* El asistente contesta en Markdown; el usuario escribe texto plano.
                Mientras streamea, un `**` todavía sin cerrar se muestra tal cual
                y pasa a negrita cuando llega el cierre — no hace falta esperar
                al final de la respuesta para empezar a leerla bien. */}
            {isUser
                ? message.content
                : pensando
                    ? (
                        <span className={styles.pensando} role="status" aria-label="Martín está pensando la respuesta">
                            <span className={styles.punto} />
                            <span className={styles.punto} />
                            <span className={styles.punto} />
                        </span>
                    )
                    : <MarkdownAsistente texto={message.content} />}
            {showCursor && <span className={styles.cursor} aria-hidden="true">▋</span>}
        </div>
    )

    if (isUser) return cuerpo

    return (
        <div className={styles.filaAsistente}>
            <span className={styles.caraMensaje}><MartinRetrato size={26} /></span>
            {cuerpo}
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
        messages, input, streaming, isOnline, enSimulador,
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
        <div className={styles.panel} role="dialog" aria-label="Martín, tu ayudante técnico" aria-modal="false">
            {/* Header */}
            <div className={styles.panelHeader}>
                <div className={styles.panelTitle}>
                    <span
                        className={`${styles.panelIcon} ${streaming ? styles.panelIconPensando : ''}`}
                        aria-hidden="true"
                    >
                        <MartinRetrato size={38} />
                    </span>
                    <div>
                        <span className={styles.panelName}>Martín</span>
                        <span className={styles.panelSub}>
                            {!isOnline
                                ? 'Tu ayudante técnico'
                                : streaming
                                    ? 'Pensando…'
                                    : 'Tu ayudante técnico · en línea'}
                        </span>
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

            {/* En el Simulador: Martín recibe el proyecto abierto en cada consulta */}
            {enSimulador && (
                <div className={styles.contextStrip}>
                    <Icon name="ruler" size={13} /> Veo el proyecto abierto en el Simulador
                </div>
            )}

            {/* Mensajes */}
            <div className={styles.messages} role="log" aria-live="polite" aria-label="Conversación">
                {messages.length === 0 ? (
                    <div className={styles.welcome}>
                        <p className={styles.welcomeTitle}>Hola. Soy Martín.</p>
                        <p className={styles.welcomeText}>
                            Describime tu consulta o el problema que tenés en obra y te ayudo.
                        </p>
                        <div className={styles.welcomeSuggestions}>
                            {(enSimulador ? [
                                '¿La caldera alcanza para este proyecto?',
                                'Revisame las cargas por ambiente',
                                '¿Qué me falta para cerrar el diseño?',
                            ] : [
                                'Radiadores fríos en planta baja',
                                'Qué diámetro de tubería uso',
                                'Cómo purgar una instalación',
                            ]).map(s => (
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

// ── El holograma y sus estados ────────────────────────────────────────────────

/** Lo que Martín está haciendo, y que se nota en cómo se proyecta. */
type EstadoHolo = 'calma' | 'atento' | 'pensando' | 'hablando'

/**
 * La figura con los efectos encima. El estado no es decoración: es la única
 * señal de que del otro lado está pasando algo mientras la respuesta tarda.
 */
function Holograma({ alto, estado }: { alto: number; estado: EstadoHolo }) {
    return (
        <span className={styles.holo} data-estado={estado} aria-hidden="true">
            <span className={styles.pulso}>
                <MartinCuerpo alto={alto} />
            </span>
        </span>
    )
}

// ── Componente raíz — única instancia del hook ────────────────────────────────

const SALUDO_VISTO = 'ct.martin.saludo'

// sessionStorage tira excepción en algunos navegadores con las cookies
// bloqueadas, y ahí es preferible saludar de más que romper la pantalla.
function leerSaludoVisto(): boolean {
    try {
        return sessionStorage.getItem(SALUDO_VISTO) === '1'
    } catch {
        return false
    }
}

function guardarSaludoVisto() {
    try {
        sessionStorage.setItem(SALUDO_VISTO, '1')
    } catch {
        /* sin almacenamiento: el saludo puede volver a aparecer, nada más */
    }
}

export function AsistenteTermico() {
    const asistente = useAsistente()
    const { open, setOpen, enSimulador, streaming, input, messages } = asistente
    const [saludo, setSaludo] = useState(false)

    // Mientras la respuesta se está armando hay dos momentos bien distintos: el
    // modelo razonando (burbuja todavía vacía) y el texto llegando. Se ven
    // distinto, igual que alguien que piensa antes de hablar y después habla.
    const ultimo = messages[messages.length - 1]
    const armandoRespuesta = streaming && ultimo?.role === 'assistant'
    const estado: EstadoHolo = armandoRespuesta
        ? (ultimo.content.length === 0 ? 'pensando' : 'hablando')
        : streaming
            ? 'pensando'
            : input.trim().length > 0
                ? 'atento'
                : 'calma'

    // El saludo aparece una sola vez por visita, unos segundos después de
    // entrar: es lo que arranca la conversación sin que el instalador tenga que
    // decidir apretar nada. Si abrió el chat alguna vez, no vuelve a aparecer.
    useEffect(() => {
        if (open) return
        if (leerSaludoVisto()) return
        const t = setTimeout(() => setSaludo(true), 4000)
        return () => clearTimeout(t)
    }, [open])

    const cerrarSaludo = () => {
        setSaludo(false)
        guardarSaludoVisto()
    }

    const abrir = () => {
        cerrarSaludo()
        setOpen(true)
    }

    return (
        <div className={styles.root}>
            {/* Con el chat abierto, Martín se queda al lado del panel en vez de
                desaparecer: es la conversación la que lo necesita moviéndose.
                En pantallas angostas no entra y el CSS lo esconde. */}
            <div className={styles.fila}>
                {open && (
                    <span className={styles.holoLado}>
                        <Holograma alto={330} estado={estado} />
                    </span>
                )}
                <div
                    className={`${styles.panelWrapper} ${open ? styles.panelOpen : ''}`}
                    aria-hidden={!open}
                >
                    {open && <ChatPanel asistente={asistente} onClose={() => setOpen(false)} />}
                </div>
            </div>

            {!open && saludo && (
                <div className={styles.saludo} role="status">
                    <button className={styles.saludoTexto} onClick={abrir}>
                        ¿Te tiro una mano con el cálculo?
                    </button>
                    <button
                        className={styles.saludoCerrar}
                        onClick={cerrarSaludo}
                        aria-label="No, gracias"
                        title="No, gracias"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Martín parado en la esquina; con el chat abierto deja su lugar al
                botón de cierre, que si no le queda encima al panel. */}
            {open ? (
                <button
                    className={`${styles.fab} ${styles.fabOpen}`}
                    onClick={() => setOpen(false)}
                    aria-label="Cerrar el chat con Martín"
                    aria-expanded={true}
                >
                    <span className={styles.fabIcon} aria-hidden="true">
                        <Icon name="close" size={24} />
                    </span>
                </button>
            ) : (
                <button
                    className={`${styles.botonMartin} ${enSimulador ? styles.soloPildora : ''}`}
                    onClick={abrir}
                    aria-label="Consultarle a Martín, tu ayudante técnico"
                    aria-expanded={false}
                >
                    {/* De cuerpo entero donde hay lugar; en el celular y en el
                        Simulador, la píldora con su cara: ahí la esquina es mesa
                        de trabajo y le taparía los controles del plano. */}
                    <span className={styles.figura} aria-hidden="true">
                        <Holograma alto={200} estado={estado} />
                        <span className={styles.cartel}>
                            <span className={styles.cartelNombre}>Martín</span>
                            <span className={styles.cartelOficio}>Ayudante técnico</span>
                        </span>
                    </span>
                    <span className={styles.pildora} aria-hidden="true">
                        <span className={styles.pildoraCara}><MartinRetrato size={36} /></span>
                        <span className={styles.pildoraTexto}>Martín</span>
                    </span>
                </button>
            )}
        </div>
    )
}
