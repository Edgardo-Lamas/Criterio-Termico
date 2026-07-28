import styles from './Diagrams.module.css'

interface FotoManualProps {
    src?: string           // Ruta a la foto real (ej: /images/manual/cap1/medicion-living.jpg)
    alt: string
    caption: string
}

/**
 * Muestra una foto si está disponible.
 * Para agregar una foto: copiar el archivo a app/public/images/manual/<capítulo>/
 * y pasar la ruta en la prop `src`.
 *
 * Sin `src` el bloque queda como marcador de la foto pendiente: el `alt` y el
 * `caption` documentan qué va ahí. El recordatorio se ve solo en desarrollo —
 * al lector no le puede llegar un hueco con instrucciones internas.
 */
export function FotoManual({ src, alt, caption }: FotoManualProps) {
    if (src) {
        return (
            <figure className={styles.photoSlot}>
                <img src={src} alt={alt} loading="lazy" />
                <figcaption>{caption}</figcaption>
            </figure>
        )
    }

    if (!import.meta.env.DEV) return null

    return (
        <div className={styles.photoPlaceholder}>
            <span>📷</span>
            <strong>{caption}</strong>
            <span>Agregar foto: <code>app/public/images/manual/</code></span>
        </div>
    )
}
