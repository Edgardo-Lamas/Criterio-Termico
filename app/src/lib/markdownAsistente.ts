/**
 * Parser mínimo de Markdown para las respuestas del asistente.
 *
 * El asistente contesta en Markdown y el panel lo mostraba crudo: se leían los
 * asteriscos de `**Cómo diferenciarlo:**` en vez de la negrita.
 *
 * Es un parser propio y no una librería a propósito: se soporta SOLO lo que el
 * asistente realmente escribe —negrita, listas, títulos, separadores y código
 * corto— y no hay dependencia nueva ni HTML generado. Devuelve una estructura
 * de datos; quien renderiza arma elementos de React, así que nunca hay
 * `dangerouslySetInnerHTML` con texto que viene de un modelo.
 *
 * Lo que NO se soporta, por decisión: cursiva con un solo asterisco (se
 * confunde con la multiplicación en un texto lleno de fórmulas), tablas,
 * imágenes y HTML embebido.
 */

export type Inline =
    | { tipo: 'texto'; texto: string }
    | { tipo: 'fuerte'; texto: string }
    | { tipo: 'codigo'; texto: string }

export type Bloque =
    | { tipo: 'parrafo'; contenido: Inline[] }
    | { tipo: 'titulo'; contenido: Inline[] }
    | { tipo: 'lista'; ordenada: boolean; items: Inline[][] }
    | { tipo: 'separador' }

const RE_TITULO = /^#{1,4}\s+(.*)$/
const RE_SEPARADOR = /^\s*(-{3,}|\*{3,}|_{3,})\s*$/
const RE_VINETA = /^\s*[-*•]\s+(.*)$/
const RE_NUMERADA = /^\s*\d+[.)]\s+(.*)$/

/** `**negrita**` y `` `código` ``. El resto del texto queda tal cual. */
export function parsearInline(texto: string): Inline[] {
    const partes: Inline[] = []
    // Se recorre con UNA sola expresión alternando ambos formatos para que no
    // haga falta un segundo pase que volvería a mirar adentro de lo ya marcado.
    const re = /\*\*([^*]+)\*\*|`([^`]+)`/g

    let ultimo = 0
    let m: RegExpExecArray | null

    while ((m = re.exec(texto)) !== null) {
        if (m.index > ultimo) {
            partes.push({ tipo: 'texto', texto: texto.slice(ultimo, m.index) })
        }

        if (m[1] !== undefined) {
            partes.push({ tipo: 'fuerte', texto: m[1] })
        } else if (m[2] !== undefined) {
            partes.push({ tipo: 'codigo', texto: m[2] })
        }

        ultimo = m.index + m[0].length
    }

    if (ultimo < texto.length) {
        partes.push({ tipo: 'texto', texto: texto.slice(ultimo) })
    }

    return partes
}

export function parsearMarkdown(fuente: string): Bloque[] {
    const bloques: Bloque[] = []
    const lineas = fuente.split('\n')

    // Acumuladores: un párrafo o una lista se arman con varias líneas seguidas
    // y recién se cierran cuando aparece algo distinto.
    let parrafo: string[] = []
    let items: string[] = []
    let listaOrdenada = false

    const cerrarParrafo = () => {
        if (parrafo.length === 0) return
        bloques.push({ tipo: 'parrafo', contenido: parsearInline(parrafo.join('\n')) })
        parrafo = []
    }

    const cerrarLista = () => {
        if (items.length === 0) return
        bloques.push({
            tipo: 'lista',
            ordenada: listaOrdenada,
            items: items.map(parsearInline),
        })
        items = []
    }

    const cerrarTodo = () => {
        cerrarParrafo()
        cerrarLista()
    }

    for (const linea of lineas) {
        if (linea.trim() === '') {
            cerrarTodo()
            continue
        }

        if (RE_SEPARADOR.test(linea)) {
            cerrarTodo()
            bloques.push({ tipo: 'separador' })
            continue
        }

        const titulo = RE_TITULO.exec(linea)
        if (titulo) {
            cerrarTodo()
            bloques.push({ tipo: 'titulo', contenido: parsearInline(titulo[1]) })
            continue
        }

        const numerada = RE_NUMERADA.exec(linea)
        if (numerada) {
            cerrarParrafo()
            // Cambiar de viñetas a numerada (o al revés) abre una lista nueva.
            if (items.length > 0 && !listaOrdenada) cerrarLista()
            listaOrdenada = true
            items.push(numerada[1])
            continue
        }

        const vineta = RE_VINETA.exec(linea)
        if (vineta) {
            cerrarParrafo()
            if (items.length > 0 && listaOrdenada) cerrarLista()
            listaOrdenada = false
            items.push(vineta[1])
            continue
        }

        // Línea suelta: si venía una lista, la corta.
        cerrarLista()
        parrafo.push(linea)
    }

    cerrarTodo()
    return bloques
}
