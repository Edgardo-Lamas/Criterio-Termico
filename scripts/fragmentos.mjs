// Parte el texto de una sección en tramos que entren en un fragmento del RAG.
//
// POR QUÉ EXISTE: hasta el 2026-10-28 los dos extractores cortaban cada sección
// con `.slice(0, 2800)`, y lo que pasaba de ahí se perdía sin aviso: 4 secciones
// (3 casos y una del cap. 3) llegaban a Martín sin su final. Ahora el resto va
// a otro fragmento, con el mismo encabezado, en vez de tirarse.

export const MAX_FRAGMENTO = 2800

/**
 * Devuelve los contenidos de los fragmentos de una sección, ya con el encabezado
 * adelante. Corta por renglón; un renglón que no entra solo se corta por palabra.
 * Del segundo tramo en adelante el encabezado lleva «(continuación)».
 */
export function partirSeccion(encabezado, texto, max = MAX_FRAGMENTO) {
    const conEncabezado = (n) => (n === 0 ? encabezado : `${encabezado} (continuación)`)
    const lugar = (n) => max - conEncabezado(n).length - 1 // el salto después del encabezado

    const tramos = []
    let actual = []
    let largo = 0

    const cerrar = () => {
        if (actual.length) tramos.push(actual.join('\n'))
        actual = []
        largo = 0
    }

    const renglones = texto.split('\n').flatMap((r) => partirRenglon(r, lugar(1)))
    for (const r of renglones) {
        const disponible = lugar(tramos.length)
        const agregado = actual.length ? r.length + 1 : r.length
        if (largo + agregado > disponible) cerrar()
        actual.push(r)
        largo += actual.length > 1 ? r.length + 1 : r.length
    }
    cerrar()

    return tramos.map((t, n) => `${conEncabezado(n)}\n${t}`)
}

function partirRenglon(renglon, max) {
    if (renglon.length <= max) return [renglon]
    const partes = []
    let actual = ''
    for (const palabra of renglon.split(' ')) {
        const candidato = actual ? `${actual} ${palabra}` : palabra
        if (candidato.length > max && actual) {
            partes.push(actual)
            actual = palabra
        } else {
            actual = candidato
        }
    }
    if (actual) partes.push(actual)
    return partes
}
