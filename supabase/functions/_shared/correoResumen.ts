/**
 * El correo con la consulta, para que le quede de repaso.
 *
 * Va la pregunta y la respuesta TAL COMO SALIERON, sin pasarlas de nuevo por el
 * modelo: cuestan cero —ya están escritas— y un resumen puede comerse justo el
 * número o el criterio fino, que es lo que se va a releer en la obra.
 *
 * 🔑 EL HTML SE ARMA ACÁ, EN EL SERVIDOR, Y NUNCA LLEGA HECHO DEL NAVEGADOR.
 * Si el cliente pudiera mandar el cuerpo, cualquiera se haría enviar un correo
 * con la firma de Criterio Térmico y el reenvío de eso ya no distingue de uno
 * legítimo. Del navegador entra texto, y todo texto se escapa.
 *
 * Martín contesta en Markdown. Se soporta lo mismo que el panel del chat
 * (`app/src/lib/markdownAsistente.ts`): negrita, código corto, títulos, listas
 * y separadores. Nada de cursiva de un asterisco —se confunde con la
 * multiplicación en un texto lleno de fórmulas—, ni tablas ni HTML embebido.
 */

// La paleta del correo sale de `app/src/styles/tokens.css`, pero sobre fondo
// claro: el ámbar del panel (#f59e0b) sobre blanco no llega a contraste, y el
// oscuro (#b45309) sí.
const ACENTO = '#b45309'
const TEXTO = '#1f2328'
const TENUE = '#5b6672'
const BORDE = '#e6e1dc'

/** Tope del asunto, para que no lo corte el cliente de correo a mitad. */
const ASUNTO_MAX = 78

export function escaparHtml(valor: string): string {
    return String(valor ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
}

const RE_TITULO = /^#{1,4}\s+(.*)$/
const RE_SEPARADOR = /^\s*(-{3,}|\*{3,}|_{3,})\s*$/
const RE_VINETA = /^\s*[-*•]\s+(.*)$/
const RE_NUMERADA = /^\s*\d+[.)]\s+(.*)$/

/**
 * `**negrita**` y `` `código` `` a HTML. El texto se escapa SIEMPRE, marcado o
 * no: lo que entra acá lo escribió un modelo y lo copió un navegador.
 */
export function inlineAHtml(texto: string): string {
    const re = /\*\*([^*]+)\*\*|`([^`]+)`/g
    let salida = ''
    let ultimo = 0
    let m: RegExpExecArray | null

    while ((m = re.exec(texto)) !== null) {
        if (m.index > ultimo) salida += escaparHtml(texto.slice(ultimo, m.index))

        if (m[1] !== undefined) {
            salida += `<strong>${escaparHtml(m[1])}</strong>`
        } else if (m[2] !== undefined) {
            salida += `<code style="background:#f3efec;padding:1px 4px;border-radius:3px">${escaparHtml(m[2])}</code>`
        }

        ultimo = m.index + m[0].length
    }

    return salida + escaparHtml(texto.slice(ultimo))
}

/** Markdown del asistente a HTML de correo, con los estilos en línea. */
export function markdownAHtml(fuente: string): string {
    const lineas = String(fuente ?? '').split('\n')
    const bloques: string[] = []

    let parrafo: string[] = []
    let items: string[] = []
    let ordenada = false

    const cerrarParrafo = () => {
        if (parrafo.length === 0) return
        bloques.push(`<p style="margin:0 0 12px">${inlineAHtml(parrafo.join(' '))}</p>`)
        parrafo = []
    }

    const cerrarLista = () => {
        if (items.length === 0) return
        const etiqueta = ordenada ? 'ol' : 'ul'
        const li = items.map(i => `<li style="margin:0 0 4px">${inlineAHtml(i)}</li>`).join('')
        bloques.push(`<${etiqueta} style="margin:0 0 12px;padding-left:20px">${li}</${etiqueta}>`)
        items = []
    }

    const cerrarTodo = () => { cerrarParrafo(); cerrarLista() }

    for (const linea of lineas) {
        if (linea.trim() === '') { cerrarTodo(); continue }

        if (RE_SEPARADOR.test(linea)) {
            cerrarTodo()
            bloques.push(`<hr style="border:0;border-top:1px solid ${BORDE};margin:18px 0">`)
            continue
        }

        const titulo = linea.match(RE_TITULO)
        if (titulo) {
            cerrarTodo()
            bloques.push(
                `<p style="margin:18px 0 8px;font-size:15px;font-weight:700;color:${TEXTO}">` +
                `${inlineAHtml(titulo[1])}</p>`,
            )
            continue
        }

        const numerada = linea.match(RE_NUMERADA)
        if (numerada) {
            cerrarParrafo()
            if (items.length > 0 && !ordenada) cerrarLista()
            ordenada = true
            items.push(numerada[1])
            continue
        }

        const vineta = linea.match(RE_VINETA)
        if (vineta) {
            cerrarParrafo()
            if (items.length > 0 && ordenada) cerrarLista()
            ordenada = false
            items.push(vineta[1])
            continue
        }

        cerrarLista()
        parrafo.push(linea.trim())
    }

    cerrarTodo()
    return bloques.join('')
}

/**
 * La misma respuesta en texto plano, para el cliente de correo que no muestra
 * HTML. No se manda el Markdown crudo: los asteriscos de `**Cómo
 * diferenciarlo:**` se leen como basura.
 */
export function markdownATexto(fuente: string): string {
    return String(fuente ?? '')
        .split('\n')
        .map(linea => {
            if (RE_SEPARADOR.test(linea)) return '—'
            const titulo = linea.match(RE_TITULO)
            if (titulo) return limpiarMarcas(titulo[1]).toUpperCase()
            const vineta = linea.match(RE_VINETA)
            if (vineta) return `- ${limpiarMarcas(vineta[1])}`
            return limpiarMarcas(linea)
        })
        .join('\n')
        .trim()
}

function limpiarMarcas(texto: string): string {
    return texto.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/`([^`]+)`/g, '$1')
}

/** La pregunta es el asunto: es lo que el instalador va a buscar en la bandeja. */
export function asuntoDe(pregunta: string): string {
    const limpia = limpiarMarcas(String(pregunta ?? '')).replace(/\s+/g, ' ').trim()
    if (limpia === '') return 'Tu consulta con Martín'

    const cuerpo = limpia.length <= ASUNTO_MAX ? limpia : limpia.slice(0, ASUNTO_MAX - 1).trimEnd() + '…'
    return cuerpo
}

export interface DatosDelResumen {
    pregunta: string
    respuesta: string
    /** Inyectable para los tests; en producción es `new Date()`. */
    fecha?: Date
}

export interface CorreoArmado {
    asunto: string
    html: string
    texto: string
}

function fechaEnCastellano(fecha: Date): string {
    // Con zona horaria fija: el servidor corre en UTC y sin esto un correo
    // mandado a las 22 de Buenos Aires lleva la fecha del día siguiente.
    return new Intl.DateTimeFormat('es-AR', {
        dateStyle: 'long',
        timeStyle: 'short',
        timeZone: 'America/Argentina/Buenos_Aires',
    }).format(fecha)
}

export function armarCorreo({ pregunta, respuesta, fecha = new Date() }: DatosDelResumen): CorreoArmado {
    const cuando = fechaEnCastellano(fecha)

    const html = `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.55;color:${TEXTO};max-width:640px">
  <p style="margin:0 0 2px;font-size:13px;color:${ACENTO};font-weight:700;letter-spacing:.04em;text-transform:uppercase">Criterio Térmico</p>
  <p style="margin:0 0 18px;font-size:13px;color:${TENUE}">Tu consulta con Martín · ${escaparHtml(cuando)}</p>

  <p style="margin:0 0 6px;font-size:13px;color:${TENUE};font-weight:600">Lo que preguntaste</p>
  <div style="margin:0 0 20px;padding:10px 14px;background:#faf7f4;border-left:3px solid ${ACENTO};border-radius:2px">${markdownAHtml(pregunta)}</div>

  <p style="margin:0 0 6px;font-size:13px;color:${TENUE};font-weight:600">Lo que te contestó</p>
  <div style="margin:0 0 22px">${markdownAHtml(respuesta)}</div>

  <hr style="border:0;border-top:1px solid ${BORDE};margin:22px 0 14px">
  <p style="margin:0 0 6px;font-size:13px;color:${TENUE}">Este correo salió porque lo pediste con el botón al pie de la respuesta. Martín no manda nada por su cuenta.</p>
  <p style="margin:0;font-size:13px;color:${TENUE}">Si en la instalación ves algo que no cierra con esto, contámelo en el chat: el caso de obra manda.</p>
</div>`

    const texto = [
        'CRITERIO TÉRMICO',
        `Tu consulta con Martín · ${cuando}`,
        '',
        'LO QUE PREGUNTASTE',
        markdownATexto(pregunta),
        '',
        'LO QUE TE CONTESTÓ',
        markdownATexto(respuesta),
        '',
        '—',
        'Este correo salió porque lo pediste con el botón al pie de la respuesta.',
        'Martín no manda nada por su cuenta.',
        'Si en la instalación ves algo que no cierra con esto, contámelo en el chat: el caso de obra manda.',
    ].join('\n')

    return { asunto: asuntoDe(pregunta), html, texto }
}
