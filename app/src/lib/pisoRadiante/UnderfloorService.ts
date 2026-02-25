// Motor de cálculo de piso radiante — funciones puras, sin dependencias de servidor
// Adaptado de: API Piso Radiante (Edgardo Lamas)

import { TipoDeSuelo, AdvisoryLevel } from './types'
import type {
    UnderfloorCalculationInput,
    UnderfloorCalculationOutput,
    FloorConfig,
    PipeStepConfig,
    AdvisoryMessage
} from './types'

const FLOOR_CONFIG_TABLE: Record<TipoDeSuelo, FloorConfig> = {
    [TipoDeSuelo.PETREO]:          { maxPower: 100, requiresStep15: false },
    [TipoDeSuelo.MADERA_MACIZA]:   { maxPower: 70,  requiresStep15: false },
    [TipoDeSuelo.MADERA_FLOTANTE]: { maxPower: 60,  requiresStep15: true  },
    [TipoDeSuelo.MOQUETA]:         { maxPower: 60,  requiresStep15: true  }
}

const PIPE_STEP_15CM: PipeStepConfig = { stepCm: 15, density: 6.7 }
const PIPE_STEP_20CM: PipeStepConfig = { stepCm: 20, density: 5.0 }
const MAX_CIRCUIT_LENGTH = 120

function selectPipeStep(cargaTermica: number, tipoDeSuelo: TipoDeSuelo): PipeStepConfig {
    const floorConfig = FLOOR_CONFIG_TABLE[tipoDeSuelo]
    if (floorConfig.requiresStep15) return PIPE_STEP_15CM
    if (cargaTermica > 70) return PIPE_STEP_15CM
    return PIPE_STEP_20CM
}

function generateAdvisory(
    input: UnderfloorCalculationInput,
    longitudTotal: number,
    potenciaMaximaSuelo: number
): AdvisoryMessage | undefined {
    const messages: string[] = []
    let level: AdvisoryLevel = AdvisoryLevel.INFO

    if (longitudTotal > MAX_CIRCUIT_LENGTH) {
        const n = Math.ceil(longitudTotal / MAX_CIRCUIT_LENGTH)
        messages.push(
            `PÉRDIDA DE CARGA: La longitud total (${Math.round(longitudTotal)} m) excede los ${MAX_CIRCUIT_LENGTH} m recomendados. ` +
            `Dividir en ${n} circuitos para mantener caudal adecuado.`
        )
        level = AdvisoryLevel.WARNING
    }

    const isMaderaFlotante = input.tipoDeSuelo === TipoDeSuelo.MADERA_FLOTANTE
    const isMoqueta = input.tipoDeSuelo === TipoDeSuelo.MOQUETA
    const exceedsPower = input.cargaTermicaRequerida > potenciaMaximaSuelo

    if ((isMaderaFlotante || isMoqueta) && exceedsPower) {
        messages.push(
            `SUELO INADECUADO: El tipo de suelo (${input.tipoDeSuelo}) limita la emisión a ${potenciaMaximaSuelo} W/m², ` +
            `pero la carga requerida es ${input.cargaTermicaRequerida} W/m². ` +
            `Considerar acabado pétreo (permite hasta 100 W/m²) o rediseñar la aislación del edificio.`
        )
        level = AdvisoryLevel.CRITICAL
    } else if ((isMaderaFlotante || isMoqueta) && !exceedsPower) {
        messages.push(
            `INFORMACIÓN: El suelo ${input.tipoDeSuelo} tiene resistencia térmica elevada (máx ${potenciaMaximaSuelo} W/m²). ` +
            `La carga está dentro del rango, pero el sistema tendrá mayor inercia y respuesta más lenta.`
        )
        level = AdvisoryLevel.INFO
    }

    if (messages.length === 0) return undefined

    return { level, message: messages.join(' | ') }
}

export function calcularPisoRadiante(input: UnderfloorCalculationInput): UnderfloorCalculationOutput {
    const pipeStep = selectPipeStep(input.cargaTermicaRequerida, input.tipoDeSuelo)

    const longitudSerpentina = Math.round(input.area * pipeStep.density * 100) / 100
    const longitudAcometida  = Math.round(input.distanciaAlColector * 2 * 100) / 100
    const longitudTotal      = Math.round((longitudSerpentina + longitudAcometida) * 100) / 100
    const numeroCircuitos    = Math.ceil(longitudTotal / MAX_CIRCUIT_LENGTH)

    const floorConfig = FLOOR_CONFIG_TABLE[input.tipoDeSuelo]
    const advisoryMessage = generateAdvisory(input, longitudTotal, floorConfig.maxPower)

    return {
        pasoSeleccionado: pipeStep.stepCm,
        densidadTuberia: pipeStep.density,
        longitudSerpentina,
        longitudAcometida,
        longitudTotal,
        numeroCircuitos,
        potenciaMaximaSuelo: floorConfig.maxPower,
        advisoryMessage,
        notaDiseno: 'Cálculo con tubería PE-X 20mm. Máx. 120 m por circuito.',
        distanciaAlimentacion: input.distanciaAlimentacion
    }
}
