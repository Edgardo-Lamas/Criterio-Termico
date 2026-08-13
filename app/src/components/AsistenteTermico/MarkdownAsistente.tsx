import { Fragment } from 'react'
import { parsearMarkdown, type Inline } from '../../lib/markdownAsistente'
import styles from './MarkdownAsistente.module.css'

/**
 * Muestra la respuesta del asistente con el Markdown ya interpretado.
 *
 * Arma elementos de React a partir de la estructura que devuelve el parser:
 * nunca `dangerouslySetInnerHTML`, así que el texto que viene del modelo no
 * puede inyectar nada. Ver `lib/markdownAsistente.ts` para qué se soporta.
 */

function Inlines({ partes }: { partes: Inline[] }) {
    return (
        <>
            {partes.map((parte, i) => {
                switch (parte.tipo) {
                    case 'fuerte':
                        return <strong key={i}>{parte.texto}</strong>
                    case 'codigo':
                        return <code key={i} className={styles.codigo}>{parte.texto}</code>
                    default:
                        return <Fragment key={i}>{parte.texto}</Fragment>
                }
            })}
        </>
    )
}

export function MarkdownAsistente({ texto }: { texto: string }) {
    const bloques = parsearMarkdown(texto)

    return (
        <div className={styles.contenido}>
            {bloques.map((bloque, i) => {
                switch (bloque.tipo) {
                    case 'titulo':
                        return (
                            <p key={i} className={styles.titulo}>
                                <Inlines partes={bloque.contenido} />
                            </p>
                        )

                    case 'separador':
                        return <hr key={i} className={styles.separador} />

                    case 'lista': {
                        const Lista = bloque.ordenada ? 'ol' : 'ul'
                        return (
                            <Lista key={i} className={styles.lista}>
                                {bloque.items.map((item, j) => (
                                    <li key={j}>
                                        <Inlines partes={item} />
                                    </li>
                                ))}
                            </Lista>
                        )
                    }

                    default:
                        return (
                            <p key={i} className={styles.parrafo}>
                                <Inlines partes={bloque.contenido} />
                            </p>
                        )
                }
            })}
        </div>
    )
}
