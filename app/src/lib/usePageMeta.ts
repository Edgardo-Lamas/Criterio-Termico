import { useEffect } from 'react'

interface PageMetaOptions {
    title: string
    description?: string
}

/**
 * Hook para establecer el título y meta description de cada página.
 * Mejora el SEO al dar a cada ruta su propio título y descripción.
 */
export function usePageMeta({ title, description }: PageMetaOptions) {
    useEffect(() => {
        // Título con sufijo de marca
        document.title = `${title} — Criterio Térmico`

        // Meta description dinámica
        if (description) {
            let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null
            if (!meta) {
                meta = document.createElement('meta')
                meta.name = 'description'
                document.head.appendChild(meta)
            }
            meta.content = description
        }

        // Canonical dinámico
        let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
        if (!canonical) {
            canonical = document.createElement('link')
            canonical.rel = 'canonical'
            document.head.appendChild(canonical)
        }
        canonical.href = window.location.href

        // Cleanup: restaurar título genérico al desmontar
        return () => {
            document.title = 'Criterio Térmico — Plataforma Técnica para Instaladores'
        }
    }, [title, description])
}
