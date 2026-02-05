import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type TipoContribucion = 'mejora' | 'caso-obra' | 'error'
export type EstadoContribucion = 'pendiente' | 'en-revision' | 'aprobada' | 'rechazada'

export interface Contribucion {
    id: string
    usuarioId: string
    usuarioEmail: string
    tipo: TipoContribucion
    capituloId?: string
    titulo: string
    descripcionProblema: string
    solucionAplicada: string
    leccionesAprendidas?: string
    imagenes: string[] // URLs de las imágenes
    estado: EstadoContribucion
    fechaCreacion: Date
    fechaRevision?: Date
    comentarioRevisor?: string
    creditosOtorgados?: number
}

interface ContribucionesState {
    contribuciones: Contribucion[]
    creditosUsuario: number

    // Acciones
    agregarContribucion: (contribucion: Omit<Contribucion, 'id' | 'estado' | 'fechaCreacion'>) => void
    obtenerContribucionesUsuario: (usuarioId: string) => Contribucion[]
    obtenerCreditosUsuario: () => number

    // Simulación de aprobación (en producción sería backend)
    aprobarContribucion: (id: string, creditos: number) => void
}

// Escala de créditos por tipo de aporte
export const CREDITOS_POR_TIPO: Record<TipoContribucion, number> = {
    'mejora': 50,
    'caso-obra': 100,
    'error': 25
}

// Descuentos por créditos acumulados
export const DESCUENTOS_POR_CREDITOS = [
    { creditos: 100, descuento: 5, label: '5% de descuento' },
    { creditos: 250, descuento: 10, label: '10% de descuento' },
    { creditos: 500, descuento: 15, label: '15% de descuento' },
    { creditos: 1000, descuento: 25, label: '25% de descuento + Badge Colaborador' }
]

export const useContribucionesStore = create<ContribucionesState>()(
    persist(
        (set, get) => ({
            contribuciones: [],
            creditosUsuario: 0,

            agregarContribucion: (contribucion) => {
                const nuevaContribucion: Contribucion = {
                    ...contribucion,
                    id: crypto.randomUUID(),
                    estado: 'pendiente',
                    fechaCreacion: new Date()
                }

                set(state => ({
                    contribuciones: [...state.contribuciones, nuevaContribucion]
                }))
            },

            obtenerContribucionesUsuario: (usuarioId) => {
                return get().contribuciones.filter(c => c.usuarioId === usuarioId)
            },

            obtenerCreditosUsuario: () => {
                return get().creditosUsuario
            },

            aprobarContribucion: (id, creditos) => {
                set(state => ({
                    contribuciones: state.contribuciones.map(c =>
                        c.id === id
                            ? { ...c, estado: 'aprobada' as EstadoContribucion, creditosOtorgados: creditos, fechaRevision: new Date() }
                            : c
                    ),
                    creditosUsuario: state.creditosUsuario + creditos
                }))
            }
        }),
        {
            name: 'criterio-contribuciones-storage'
        }
    )
)

// Helper para calcular descuento actual
export function calcularDescuentoActual(creditos: number): { descuento: number; label: string; proximoNivel?: typeof DESCUENTOS_POR_CREDITOS[0] } {
    let descuentoActual = { descuento: 0, label: 'Sin descuento' }
    let proximoNivel = DESCUENTOS_POR_CREDITOS[0]

    for (let i = DESCUENTOS_POR_CREDITOS.length - 1; i >= 0; i--) {
        if (creditos >= DESCUENTOS_POR_CREDITOS[i].creditos) {
            descuentoActual = DESCUENTOS_POR_CREDITOS[i]
            proximoNivel = DESCUENTOS_POR_CREDITOS[i + 1]
            break
        }
    }

    return { ...descuentoActual, proximoNivel }
}
