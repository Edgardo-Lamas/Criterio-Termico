export type ErrorTier = 'free' | 'pro' | 'premium'

/**
 * Familias del índice temático. Agrupan por lo que el instalador está VIENDO,
 * no por la causa técnica: llega con un síntoma delante, no con un diagnóstico.
 */
export type FamiliaIndice =
    | 'no-calienta'
    | 'presion'
    | 'ruidos'
    | 'agua'
    | 'uniones'
    | 'puesta-en-marcha'
    | 'consumo'
    | 'frontera'
    | 'seguridad'

export const FAMILIAS: { id: FamiliaIndice; nombre: string; descripcion: string }[] = [
    { id: 'no-calienta', nombre: 'No calienta o calienta mal', descripcion: 'Radiadores fríos, desparejos o ambientes que no llegan a temperatura.' },
    { id: 'presion', nombre: 'Presión', descripcion: 'La aguja sube, baja o no se queda quieta.' },
    { id: 'ruidos', nombre: 'Ruidos', descripcion: 'Silbidos, golpes, chasquidos y borboteo.' },
    { id: 'agua', nombre: 'Agua del circuito y corrosión', descripcion: 'Sarro, lodos, aditivos y protección del sistema.' },
    { id: 'uniones', nombre: 'Uniones, materiales y trazado', descripcion: 'Cómo se une, con qué se sella y por dónde va la cañería.' },
    { id: 'puesta-en-marcha', nombre: 'Puesta en marcha y verificación', descripcion: 'Probar la instalación antes de entregarla.' },
    { id: 'consumo', nombre: 'Consumo y regulación', descripcion: 'Factura alta, curva de calefacción y temperaturas de trabajo.' },
    { id: 'frontera', nombre: 'Frontera con otros oficios', descripcion: 'Donde el trabajo del electricista o del gasista se conecta con la calefacción.' },
    { id: 'seguridad', nombre: 'Seguridad e higiene en la obra', descripcion: 'Cómo no lastimarse ni lastimar a nadie haciendo el trabajo.' },
]

/**
 * Una entrada del índice temático: el término tal como lo nombra el instalador,
 * apuntando al ancla exacta del párrafo que lo responde.
 *
 * Un mismo `ancla` puede aparecer en varias entradas, con términos y familias
 * distintas: la misma respuesta sirve según por dónde entró la duda. Y un caso
 * puede aportar entradas a familias que no son la suya (el termostato mal
 * ubicado vive en un caso de ciclado, pero se busca desde la frontera eléctrica).
 */
export interface EntradaIndice {
    /** Cómo lo nombraría el instalador al leerlo en una lista. */
    termino: string
    /** `id` del <h2>/<h3> dentro del caso. Escritos a mano en el TSX. */
    ancla: string
    familia: FamiliaIndice
}

export interface ErrorMeta {
    id: string
    titulo: string
    categoria: string
    tier: ErrorTier
    preview: string
    resumen: string
    /**
     * Entradas que este caso aporta al índice temático. Van acá y no en un
     * listado central para que un caso nuevo —propio o aportado por un
     * instalador— se registre solo en el índice, sin editar otro archivo.
     */
    cubre?: EntradaIndice[]
}
