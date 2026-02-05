import { useState, useRef } from 'react'
import { useAuthStore } from '../../../stores/useAuthStore'
import { useContribucionesStore, CREDITOS_POR_TIPO } from '../../../stores/useContribucionesStore'
import type { TipoContribucion } from '../../../stores/useContribucionesStore'
import styles from './ContribucionForm.module.css'

interface ContribucionFormProps {
    isOpen: boolean
    onClose: () => void
    tipoInicial?: TipoContribucion
    capituloId?: string
}

const TIPOS_CONTRIBUCION = [
    { id: 'mejora' as TipoContribucion, label: '💡 Sugerir Mejora', desc: 'Proponer corrección o ampliación de contenido' },
    { id: 'caso-obra' as TipoContribucion, label: '🔧 Caso de Obra', desc: 'Compartir experiencia real de instalación' },
    { id: 'error' as TipoContribucion, label: '⚠️ Reportar Error', desc: 'Señalar errores técnicos o información desactualizada' }
]

const MAX_IMAGENES = 3
const MAX_TAMAÑO_MB = 5
const FORMATOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp']

export function ContribucionForm({ isOpen, onClose, tipoInicial, capituloId }: ContribucionFormProps) {
    const { user, isAuthenticated } = useAuthStore()
    const { agregarContribucion } = useContribucionesStore()

    const [paso, setPaso] = useState(1)
    const [tipo, setTipo] = useState<TipoContribucion | null>(tipoInicial || null)
    const [titulo, setTitulo] = useState('')
    const [descripcionProblema, setDescripcionProblema] = useState('')
    const [solucionAplicada, setSolucionAplicada] = useState('')
    const [leccionesAprendidas, setLeccionesAprendidas] = useState('')
    const [imagenes, setImagenes] = useState<File[]>([])
    const [imagenesPreview, setImagenesPreview] = useState<string[]>([])
    const [erroresImagen, setErroresImagen] = useState<string[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitSuccess, setSubmitSuccess] = useState(false)

    const fileInputRef = useRef<HTMLInputElement>(null)

    if (!isOpen) return null

    // Validar que el usuario esté autenticado
    if (!isAuthenticated) {
        return (
            <div className={styles.overlay} onClick={onClose}>
                <div className={styles.modal} onClick={e => e.stopPropagation()}>
                    <div className={styles.header}>
                        <h2>🔒 Inicia sesión para contribuir</h2>
                        <button onClick={onClose} className={styles.closeBtn}>×</button>
                    </div>
                    <div className={styles.content}>
                        <p>Para enviar aportes al manual, necesitás estar registrado en la plataforma.</p>
                        <p className={styles.beneficio}>
                            Los aportes aprobados otorgan <strong>créditos canjeables</strong> por descuentos en tu suscripción.
                        </p>
                        <a href="/cuenta" className={styles.loginBtn}>Ingresar / Registrarse</a>
                    </div>
                </div>
            </div>
        )
    }

    const validarImagen = (file: File): string | null => {
        // Validar formato
        if (!FORMATOS_PERMITIDOS.includes(file.type)) {
            return `Formato no permitido: ${file.type}. Usa JPG, PNG o WebP.`
        }

        // Validar tamaño
        if (file.size > MAX_TAMAÑO_MB * 1024 * 1024) {
            return `Imagen muy grande (${(file.size / 1024 / 1024).toFixed(1)}MB). Máximo ${MAX_TAMAÑO_MB}MB.`
        }

        return null
    }

    const handleImagenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        const nuevosErrores: string[] = []
        const nuevasImagenes: File[] = []
        const nuevosPreview: string[] = []

        for (const file of files) {
            if (imagenes.length + nuevasImagenes.length >= MAX_IMAGENES) {
                nuevosErrores.push(`Máximo ${MAX_IMAGENES} imágenes permitidas.`)
                break
            }

            const error = validarImagen(file)
            if (error) {
                nuevosErrores.push(error)
            } else {
                nuevasImagenes.push(file)
                nuevosPreview.push(URL.createObjectURL(file))
            }
        }

        setErroresImagen(nuevosErrores)
        setImagenes([...imagenes, ...nuevasImagenes])
        setImagenesPreview([...imagenesPreview, ...nuevosPreview])

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const eliminarImagen = (index: number) => {
        URL.revokeObjectURL(imagenesPreview[index])
        setImagenes(imagenes.filter((_, i) => i !== index))
        setImagenesPreview(imagenesPreview.filter((_, i) => i !== index))
    }

    const handleSubmit = async () => {
        if (!tipo || !titulo || !descripcionProblema || !solucionAplicada) return

        setIsSubmitting(true)

        // Simular subida de imágenes (en producción sería Firebase Storage)
        const imagenesUrls = imagenesPreview // En MVP usamos los blob URLs

        agregarContribucion({
            usuarioId: user!.id,
            usuarioEmail: user!.email,
            tipo,
            capituloId,
            titulo,
            descripcionProblema,
            solucionAplicada,
            leccionesAprendidas: leccionesAprendidas || undefined,
            imagenes: imagenesUrls
        })

        setIsSubmitting(false)
        setSubmitSuccess(true)
    }

    const resetForm = () => {
        setPaso(1)
        setTipo(tipoInicial || null)
        setTitulo('')
        setDescripcionProblema('')
        setSolucionAplicada('')
        setLeccionesAprendidas('')
        setImagenes([])
        imagenesPreview.forEach(url => URL.revokeObjectURL(url))
        setImagenesPreview([])
        setErroresImagen([])
        setSubmitSuccess(false)
    }

    // Pantalla de éxito
    if (submitSuccess) {
        return (
            <div className={styles.overlay} onClick={onClose}>
                <div className={styles.modal} onClick={e => e.stopPropagation()}>
                    <div className={styles.successContent}>
                        <span className={styles.successIcon}>✅</span>
                        <h2>¡Aporte enviado!</h2>
                        <p>Tu contribución fue recibida y será revisada por el equipo técnico.</p>
                        <div className={styles.creditosInfo}>
                            <span>Si es aprobada, recibirás:</span>
                            <strong>{CREDITOS_POR_TIPO[tipo!]} créditos</strong>
                        </div>
                        <p className={styles.notaRevision}>
                            Te notificaremos cuando tu aporte sea revisado.
                        </p>
                        <div className={styles.successActions}>
                            <button onClick={() => { resetForm(); onClose() }} className={styles.btnSecondary}>
                                Cerrar
                            </button>
                            <button onClick={resetForm} className={styles.btnPrimary}>
                                Enviar otro aporte
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2>🤝 Contribuir al Manual</h2>
                    <button onClick={onClose} className={styles.closeBtn}>×</button>
                </div>

                {/* Progress */}
                <div className={styles.progress}>
                    <div className={`${styles.step} ${paso >= 1 ? styles.stepActive : ''}`}>1. Tipo</div>
                    <div className={`${styles.step} ${paso >= 2 ? styles.stepActive : ''}`}>2. Contenido</div>
                    <div className={`${styles.step} ${paso >= 3 ? styles.stepActive : ''}`}>3. Imágenes</div>
                    <div className={`${styles.step} ${paso >= 4 ? styles.stepActive : ''}`}>4. Revisar</div>
                </div>

                <div className={styles.content}>
                    {/* Paso 1: Tipo de contribución */}
                    {paso === 1 && (
                        <div className={styles.pasoContent}>
                            <h3>¿Qué tipo de aporte querés hacer?</h3>
                            <div className={styles.tiposGrid}>
                                {TIPOS_CONTRIBUCION.map(t => (
                                    <button
                                        key={t.id}
                                        className={`${styles.tipoCard} ${tipo === t.id ? styles.tipoSelected : ''}`}
                                        onClick={() => setTipo(t.id)}
                                    >
                                        <span className={styles.tipoLabel}>{t.label}</span>
                                        <span className={styles.tipoDesc}>{t.desc}</span>
                                        <span className={styles.tipoCreditos}>+{CREDITOS_POR_TIPO[t.id]} créditos</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Paso 2: Contenido */}
                    {paso === 2 && (
                        <div className={styles.pasoContent}>
                            <h3>Describí tu aporte</h3>

                            <div className={styles.formGroup}>
                                <label>Título o resumen breve *</label>
                                <input
                                    type="text"
                                    value={titulo}
                                    onChange={e => setTitulo(e.target.value.slice(0, 100))}
                                    placeholder="Ej: Radiador no calienta en la parte inferior"
                                    maxLength={100}
                                />
                                <span className={styles.charCount}>{titulo.length}/100</span>
                            </div>

                            <div className={styles.formGroup}>
                                <label>Descripción del problema o situación *</label>
                                <textarea
                                    value={descripcionProblema}
                                    onChange={e => setDescripcionProblema(e.target.value)}
                                    placeholder="Describí qué encontraste, en qué contexto, qué síntomas observaste..."
                                    rows={4}
                                />
                                <span className={styles.charCount}>{descripcionProblema.split(/\s+/).filter(Boolean).length}/500 palabras</span>
                            </div>

                            <div className={styles.formGroup}>
                                <label>Solución aplicada o sugerida *</label>
                                <textarea
                                    value={solucionAplicada}
                                    onChange={e => setSolucionAplicada(e.target.value)}
                                    placeholder="¿Cómo lo resolviste? ¿Qué harías diferente? ¿Qué recomiendas?"
                                    rows={4}
                                />
                                <span className={styles.charCount}>{solucionAplicada.split(/\s+/).filter(Boolean).length}/500 palabras</span>
                            </div>

                            <div className={styles.formGroup}>
                                <label>Lecciones aprendidas (opcional)</label>
                                <textarea
                                    value={leccionesAprendidas}
                                    onChange={e => setLeccionesAprendidas(e.target.value)}
                                    placeholder="¿Qué aprendiste? ¿Qué le dirías a otro instalador?"
                                    rows={2}
                                />
                            </div>
                        </div>
                    )}

                    {/* Paso 3: Imágenes */}
                    {paso === 3 && (
                        <div className={styles.pasoContent}>
                            <h3>Imágenes de la instalación (opcional)</h3>

                            <div className={styles.imageWarning}>
                                <span>⚠️</span>
                                <div>
                                    <strong>Solo imágenes técnicas de instalaciones</strong>
                                    <p>No se aceptan fotos de personas, selfies ni contenido no relacionado.
                                        Las imágenes inapropiadas serán rechazadas automáticamente.</p>
                                </div>
                            </div>

                            <div className={styles.imageUploader}>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    multiple
                                    onChange={handleImagenChange}
                                    className={styles.fileInput}
                                    id="imagen-input"
                                />
                                <label htmlFor="imagen-input" className={styles.uploadLabel}>
                                    <span className={styles.uploadIcon}>📷</span>
                                    <span>Seleccionar imágenes</span>
                                    <span className={styles.uploadHint}>JPG, PNG o WebP · Máximo {MAX_TAMAÑO_MB}MB cada una</span>
                                </label>
                            </div>

                            {erroresImagen.length > 0 && (
                                <div className={styles.erroresImagen}>
                                    {erroresImagen.map((err, i) => (
                                        <p key={i}>❌ {err}</p>
                                    ))}
                                </div>
                            )}

                            {imagenesPreview.length > 0 && (
                                <div className={styles.imagenesGrid}>
                                    {imagenesPreview.map((url, i) => (
                                        <div key={i} className={styles.imagenItem}>
                                            <img src={url} alt={`Imagen ${i + 1}`} />
                                            <button
                                                onClick={() => eliminarImagen(i)}
                                                className={styles.eliminarImg}
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <p className={styles.imageCount}>
                                {imagenes.length}/{MAX_IMAGENES} imágenes
                            </p>
                        </div>
                    )}

                    {/* Paso 4: Revisar */}
                    {paso === 4 && (
                        <div className={styles.pasoContent}>
                            <h3>Revisá tu aporte antes de enviar</h3>

                            <div className={styles.resumen}>
                                <div className={styles.resumenItem}>
                                    <span className={styles.resumenLabel}>Tipo:</span>
                                    <span>{TIPOS_CONTRIBUCION.find(t => t.id === tipo)?.label}</span>
                                </div>
                                <div className={styles.resumenItem}>
                                    <span className={styles.resumenLabel}>Título:</span>
                                    <span>{titulo}</span>
                                </div>
                                <div className={styles.resumenItem}>
                                    <span className={styles.resumenLabel}>Problema:</span>
                                    <span className={styles.resumenTexto}>{descripcionProblema.slice(0, 200)}...</span>
                                </div>
                                <div className={styles.resumenItem}>
                                    <span className={styles.resumenLabel}>Solución:</span>
                                    <span className={styles.resumenTexto}>{solucionAplicada.slice(0, 200)}...</span>
                                </div>
                                <div className={styles.resumenItem}>
                                    <span className={styles.resumenLabel}>Imágenes:</span>
                                    <span>{imagenes.length} archivo(s)</span>
                                </div>
                            </div>

                            <div className={styles.creditosPreview}>
                                <span>Si es aprobado recibirás:</span>
                                <strong>+{CREDITOS_POR_TIPO[tipo!]} créditos</strong>
                            </div>

                            <p className={styles.disclaimer}>
                                Al enviar, aceptás que tu aporte sea revisado y, si es aprobado,
                                publicado en la plataforma con tu nombre como contribuidor.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer con botones */}
                <div className={styles.footer}>
                    {paso > 1 && (
                        <button onClick={() => setPaso(paso - 1)} className={styles.btnSecondary}>
                            ← Anterior
                        </button>
                    )}

                    {paso < 4 && (
                        <button
                            onClick={() => setPaso(paso + 1)}
                            className={styles.btnPrimary}
                            disabled={
                                (paso === 1 && !tipo) ||
                                (paso === 2 && (!titulo || !descripcionProblema || !solucionAplicada))
                            }
                        >
                            Siguiente →
                        </button>
                    )}

                    {paso === 4 && (
                        <button
                            onClick={handleSubmit}
                            className={styles.btnPrimary}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Enviando...' : '✓ Enviar aporte'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
