import styles from './Diagrams.module.css'

interface FotoManualProps {
    src?: string           // Ruta a la foto real (ej: /images/manual/cap1/medicion-living.jpg)
    alt: string
    caption: string
}

/**
 * Muestra una foto si está disponible, o un placeholder si no.
 * Para agregar una foto: copiar el archivo a app/public/images/manual/cap1/
 * y pasar la ruta en la prop `src`.
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

    return (
        <div className={styles.photoPlaceholder}>
            <span>📷</span>
            <strong>{caption}</strong>
            <span>Agregar foto: <code>app/public/images/manual/cap1/</code></span>
        </div>
    )
}
