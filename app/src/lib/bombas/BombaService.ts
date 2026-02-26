// Motor de cálculo de bomba circuladora — funciones puras, sin dependencias de UI
// Fórmulas: Darcy-Weisbach + criterio caudal campo (860 kcal/kWh)

import { DIAMETROS_CAÑERIA } from './types'
import type { BombaInput, BombaOutput } from './types'

// Fricción Darcy para caño metálico liso en régimen turbulento (λ ≈ 0.025)
// Válido para acero negro, cobre y latón en condiciones habituales de calefacción
const DARCY_FRICTION = 0.025
const GRAVITY = 9.81              // m/s²
const RESISTENCIA_CALDERA = 2.0   // mca — resistencia interna caldera residencial promedio
const COEF_FITTINGS = 1.40        // +40% por codos, válvulas y accesorios

export function calcularBomba(input: BombaInput): BombaOutput {
    const { potenciaTotal, deltaT, longitudCircuito, diametroCañeria } = input
    const advertencias: string[] = []
    const notas: string[] = []

    // ── 1. Caudal ────────────────────────────────────────────────────────────
    // Q (l/h) = P (kW) × 860 / ΔT
    // Derivación: 1 kW = 860 kcal/h; calor específico agua ≈ 1 kcal/l·°C
    const caudal = (potenciaTotal * 860) / deltaT
    const caudalM3h = caudal / 1000
    const caudalM3s = caudal / 3_600_000

    // ── 2. Velocidad ─────────────────────────────────────────────────────────
    const D = DIAMETROS_CAÑERIA[diametroCañeria]  // diámetro interno en metros
    const area = Math.PI * (D / 2) ** 2           // m²
    const velocidad = caudalM3s / area             // m/s

    // ── 3. Pérdida de carga lineal (Darcy-Weisbach) ──────────────────────────
    // J (mca/m) = f × v² / (2 × g × D)
    const perdidaCargaLineal = (DARCY_FRICTION * velocidad ** 2) / (2 * GRAVITY * D)

    // ── 4. Pérdida total ─────────────────────────────────────────────────────
    // Longitud doble (ida + vuelta) + 40% fittings + resistencia caldera
    const longitudTotal = longitudCircuito * 2
    const perdidaCargaTotal =
        perdidaCargaLineal * longitudTotal * COEF_FITTINGS + RESISTENCIA_CALDERA

    // ── 5. Advertencias de velocidad ─────────────────────────────────────────
    if (velocidad < 0.25) {
        advertencias.push(
            `Velocidad muy baja (${velocidad.toFixed(2)} m/s): riesgo de depósitos de magnetita y arrastre de aire deficiente. ` +
            `Considerar reducir el diámetro al tramo principal.`
        )
    } else if (velocidad > 1.2) {
        advertencias.push(
            `Velocidad excesiva (${velocidad.toFixed(2)} m/s): genera ruido en curvas y erosión. ` +
            `Aumentar el diámetro de la cañería principal.`
        )
    }

    // ── 6. Advertencias de pérdida de carga ──────────────────────────────────
    if (perdidaCargaTotal > 10) {
        advertencias.push(
            `Pérdida de carga alta (${perdidaCargaTotal.toFixed(1)} mca). ` +
            `Verificar el diámetro del tramo principal o dividir en zonas independientes.`
        )
    }

    // ── 7. Categoría de bomba ─────────────────────────────────────────────────
    // Clasificación por punto de operación: Q (m³/h) × H (mca)
    let categoria: BombaOutput['categoria']

    if (caudalM3h <= 1.2 && perdidaCargaTotal <= 5) {
        categoria = 'pequeña'
        notas.push(
            'Bomba circuladora pequeña (hasta 1.2 m³/h y 5 mca). ' +
            'Modelos de referencia: Wilo Star-S 25/5, Grundfos UP 15-14, DAB VCM 25/130. ' +
            'Indicada para zonas secundarias, viviendas pequeñas o circuitos de apoyo.'
        )
    } else if (caudalM3h <= 3.0 && perdidaCargaTotal <= 7) {
        categoria = 'mediana'
        notas.push(
            'Bomba circuladora mediana (hasta 3 m³/h y 7 mca). ' +
            'Modelos de referencia: Wilo Yonos PICO 25/1-6, Grundfos UPS 25-60, DAB Evosta 40/180. ' +
            'La más común en instalaciones residenciales de 5 a 20 radiadores.'
        )
    } else {
        categoria = 'grande'
        notas.push(
            'Bomba circuladora grande (más de 3 m³/h o más de 7 mca). ' +
            'Modelos de referencia: Wilo Stratos 30/1-8, Grundfos UPS 32-80, DAB Evosta 80/180. ' +
            'Indicada para casas grandes, edificios pequeños o circuitos de gran longitud.'
        )
    }

    // ── 8. Nota sobre ΔT ─────────────────────────────────────────────────────
    if (deltaT === 5) {
        notas.push(
            'ΔT 5 °C: típico de piso radiante. El caudal resultante es alto respecto a la potencia. ' +
            'Verificar que la bomba y las válvulas de colector soporten ese caudal.'
        )
    }

    return {
        caudal:              Math.round(caudal),
        caudalM3h:           Math.round(caudalM3h * 100) / 100,
        velocidad:           Math.round(velocidad * 100) / 100,
        perdidaCargaLineal:  Math.round(perdidaCargaLineal * 1000) / 1000,
        perdidaCargaTotal:   Math.round(perdidaCargaTotal * 10) / 10,
        categoria,
        advertencias,
        notas,
    }
}
