// Motor de cálculo de bomba presurizadora — funciones puras, sin dependencias de UI
//
// Problema: al llenar un circuito cerrado de calefacción, la presión de red disponible
// en el punto de llenado puede ser insuficiente para alcanzar los 1.5 bar requeridos.
// Esto ocurre especialmente en edificios con la sala de calderas en pisos altos,
// o en zonas con baja presión de red.

import type { PresurizadoraInput, PresurizadoraOutput } from './types'

// Relación hidrostática: 10.2 m de columna de agua = 1 bar
const MCA_POR_BAR = 10.2

// Umbral mínimo de boost para considerarlo necesario (evita falsos positivos por redondeo)
const UMBRAL_BOOST = 0.1  // bar

export function calcularPresurizadora(input: PresurizadoraInput): PresurizadoraOutput {
    const { presionRed, alturaFillPoint, alturaCircuito, presionObjetivo } = input
    const advertencias: string[] = []
    const notas: string[] = []

    // ── 1. Presión disponible en el punto de llenado ─────────────────────────
    // Cada metro de altura sobre la calle resta 1/10.2 bar ≈ 0.098 bar
    const presionDisponible = Math.max(0, presionRed - alturaFillPoint / MCA_POR_BAR)

    // ── 2. Presión necesaria en el punto de llenado ──────────────────────────
    // Para que el radiador más alto quede a presión objetivo, el punto de
    // llenado (abajo) debe tener: P_obj + columna estática hasta el tope del circuito
    const presionNecesaria = presionObjetivo + alturaCircuito / MCA_POR_BAR

    // ── 3. Boost necesario ───────────────────────────────────────────────────
    const boostNecesario = Math.max(0, presionNecesaria - presionDisponible)
    const necesitaPresurizadora = boostNecesario > UMBRAL_BOOST
    const alturaManometrica = boostNecesario * MCA_POR_BAR

    // ── 4. Caudal de llenado recomendado ─────────────────────────────────────
    // Para llenado de circuito residencial: 15 l/min es suficiente para purgar
    // el aire y evitar golpe de ariete. Para edificios: 20-30 l/min.
    const caudalLlenado = alturaCircuito > 10 ? 20 : 15

    // ── 5. Categoría de bomba ─────────────────────────────────────────────────
    let categoria: PresurizadoraOutput['categoria']

    if (!necesitaPresurizadora) {
        categoria = 'sin-bomba'
        notas.push(
            `Presión disponible en el punto de llenado: ${presionDisponible.toFixed(2)} bar. ` +
            `Es suficiente para alcanzar ${presionObjetivo} bar en el circuito. ` +
            `No se requiere bomba presurizadora.`
        )
    } else if (boostNecesario <= 1.5) {
        categoria = 'doméstica'
        notas.push(
            `Boost requerido: ${boostNecesario.toFixed(2)} bar (${alturaManometrica.toFixed(1)} mca). ` +
            `Una bomba presurizadora doméstica o autocebante pequeña es suficiente. ` +
            `Modelos de referencia: Grundfos CM 3-2, DAB Jet 102 M, Pedrollo JSW 1A. ` +
            `Caudal de llenado recomendado: ${caudalLlenado} l/min.`
        )
    } else if (boostNecesario <= 3.0) {
        categoria = 'mediana'
        notas.push(
            `Boost requerido: ${boostNecesario.toFixed(2)} bar (${alturaManometrica.toFixed(1)} mca). ` +
            `Bomba presurizadora mediana o grupo de presión compacto. ` +
            `Modelos de referencia: Grundfos MQ 3-35, DAB ESYBOX Mini 3, Pedrollo multietapa. ` +
            `Caudal de llenado recomendado: ${caudalLlenado} l/min.`
        )
    } else {
        categoria = 'industrial'
        notas.push(
            `Boost requerido: ${boostNecesario.toFixed(2)} bar (${alturaManometrica.toFixed(1)} mca). ` +
            `Se requiere grupo de presión multietapa. Consultar con el fabricante o un especialista.`
        )
    }

    // ── 6. Advertencias ──────────────────────────────────────────────────────
    if (presionDisponible < 0.5) {
        advertencias.push(
            `Presión disponible en el punto de llenado muy baja (${presionDisponible.toFixed(2)} bar). ` +
            `Verificar con manómetro la presión real de la red antes de dimensionar la bomba. ` +
            `La presión de red puede variar según la hora del día.`
        )
    }

    if (alturaCircuito > 15) {
        advertencias.push(
            `Circuito con altura mayor a 15 m: ajustar la precarga del vaso de expansión. ` +
            `Precarga = 0.5 bar + (altura estática / 10.2 bar). ` +
            `Para este circuito: ≈ ${(0.5 + alturaCircuito / MCA_POR_BAR).toFixed(1)} bar.`
        )
    }

    if (boostNecesario > 3) {
        advertencias.push(
            `Boost mayor a 3 bar: verificar que las uniones, válvulas y el vaso de expansión ` +
            `soporten la presión de llenado (${presionNecesaria.toFixed(1)} bar). ` +
            `Algunos componentes residenciales tienen límite de 3 bar de trabajo.`
        )
    }

    if (presionRed > 4) {
        advertencias.push(
            `Presión de red muy alta (${presionRed} bar): instalar una válvula reductora de presión ` +
            `antes del llenador para no sobrepasar la presión de trabajo del circuito.`
        )
    }

    return {
        presionDisponible:    Math.round(presionDisponible * 100) / 100,
        presionNecesaria:     Math.round(presionNecesaria * 100) / 100,
        boostNecesario:       Math.round(boostNecesario * 100) / 100,
        necesitaPresurizadora,
        alturaManometrica:    Math.round(alturaManometrica * 10) / 10,
        caudalLlenado,
        categoria,
        advertencias,
        notas,
    }
}
