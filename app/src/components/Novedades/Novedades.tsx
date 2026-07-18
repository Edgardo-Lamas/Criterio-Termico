// Sección "Novedades" de la Home. El contenido vive en la tabla `novedades`
// de Supabase (lectura pública; activa y vigencia las resuelve RLS) y se
// administra desde el dashboard sin deploy. El destino del espacio es B2B:
// empresas que compren suscripciones para sus clientes podrán publicar acá
// charlas técnicas, promociones y productos — siempre etiquetados como tales,
// nunca disfrazados de recomendación técnica.

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'
import styles from './Novedades.module.css'

interface Novedad {
    id: string
    titulo: string
    bajada: string
    etiqueta: string | null
    imagen_url: string
    link_url: string | null
}

export function Novedades() {
    const [items, setItems] = useState<Novedad[]>([])

    useEffect(() => {
        // Sin Supabase configurado o sin conexión la sección no se muestra:
        // la Home sigue funcionando offline igual que siempre.
        if (!isSupabaseConfigured || !navigator.onLine) return
        let cancelado = false

        supabase
            .from('novedades')
            .select('id, titulo, bajada, etiqueta, imagen_url, link_url')
            .order('orden', { ascending: true })
            .limit(6)
            .then(({ data, error }) => {
                if (!cancelado && !error && data && data.length > 0) {
                    setItems(data as Novedad[])
                }
            })

        return () => {
            cancelado = true
        }
    }, [])

    if (items.length === 0) return null

    return (
        <section className={styles.novedades} aria-labelledby="novedades-titulo">
            <h2 id="novedades-titulo" className={styles.titulo}>Novedades</h2>
            <div className={styles.grid}>
                {items.map(item => {
                    const contenido = (
                        <>
                            <div className={styles.imagenWrap}>
                                <img
                                    src={item.imagen_url}
                                    alt=""
                                    loading="lazy"
                                    className={styles.imagen}
                                />
                                {item.etiqueta && (
                                    <span className={styles.etiqueta}>{item.etiqueta}</span>
                                )}
                            </div>
                            <div className={styles.cuerpo}>
                                <h3 className={styles.cardTitulo}>{item.titulo}</h3>
                                <p className={styles.cardBajada}>{item.bajada}</p>
                            </div>
                        </>
                    )

                    // Ruta interna → Link del router; URL externa → pestaña nueva;
                    // sin link → card informativa sin acción.
                    if (item.link_url?.startsWith('/')) {
                        return (
                            <Link key={item.id} to={item.link_url} className={styles.card}>
                                {contenido}
                            </Link>
                        )
                    }
                    if (item.link_url) {
                        return (
                            <a
                                key={item.id}
                                href={item.link_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.card}
                            >
                                {contenido}
                            </a>
                        )
                    }
                    return (
                        <article key={item.id} className={styles.card}>
                            {contenido}
                        </article>
                    )
                })}
            </div>
        </section>
    )
}
