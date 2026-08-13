import { create } from 'zustand'

/**
 * Canal para abrir el asistente desde cualquier parte de la app con una
 * pregunta ya escrita.
 *
 * El panel del asistente maneja su propio `open` adentro de `useAsistente`, así
 * que desde afuera no hay forma de abrirlo. Esto es lo mínimo para lograrlo sin
 * levantar todo el estado del chat a un store global: se deja una pregunta
 * pendiente, el asistente la toma y la limpia.
 */
interface AsistenteUIState {
    /** Pregunta que espera ser tomada por el asistente, o null. */
    preguntaPendiente: string | null
    /** Abre el asistente con esta pregunta escrita en el campo. */
    abrirCon: (pregunta: string) => void
    /** La llama el asistente cuando ya la usó. */
    limpiar: () => void
}

export const useAsistenteUI = create<AsistenteUIState>(set => ({
    preguntaPendiente: null,
    abrirCon: (pregunta) => set({ preguntaPendiente: pregunta }),
    limpiar: () => set({ preguntaPendiente: null }),
}))
