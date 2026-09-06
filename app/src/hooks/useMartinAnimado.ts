// ¿Corresponde traer los clips de Martín en movimiento?

import { useEffect, useState } from 'react'

/**
 * Decide si corresponde traer los videos. Son unos 400 KB cada uno: valen la
 * pena en un escritorio, y no en el celular de alguien que abrió la calculadora
 * en una obra. Además espera a que la página termine de cargar — la primera
 * impresión la da la imagen, que pesa 28 KB.
 */
export function useMartinAnimado(): boolean {
    const [permitido, setPermitido] = useState(false)

    useEffect(() => {
        const anchoSuficiente = window.matchMedia('(min-width: 900px)').matches
        const prefiereQuieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        const conexion = (navigator as { connection?: { saveData?: boolean } }).connection
        if (!anchoSuficiente || prefiereQuieto || conexion?.saveData) return

        const t = setTimeout(() => setPermitido(true), 2500)
        return () => clearTimeout(t)
    }, [])

    return permitido
}

