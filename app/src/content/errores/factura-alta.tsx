// Error: Factura de gas muy alta — Eficiencia
// Tier: pro

export const errorFacturaAlta = {
    id: 'factura-alta',
    titulo: 'Factura de gas muy alta',
    categoria: 'Eficiencia',
    tier: 'pro' as const,
    preview: 'Consumo excesivo sin mejora de confort.',
    resumen: 'Un consumo de gas desproporcionado en calefacción es siempre síntoma de uno o varios problemas técnicos: caldera sobredimensionada, curva de calefacción mal ajustada, pérdidas no resueltas o sistema desbalanceado.',
}

export function ErrorFacturaAltaDetalle() {
    return (
        <div className="prose">
            <h2>El problema</h2>
            <p>
                La factura de gas aumenta significativamente con la llegada del invierno,
                pero el confort interior no mejora en proporción. El sistema funciona —
                la caldera enciende, los radiadores calientan — pero algo consume energía
                de manera ineficiente.
            </p>
            <p>
                Este problema raramente tiene una sola causa. Generalmente es la combinación
                de varios factores que se potencian entre sí.
            </p>

            <h2>Las causas más frecuentes</h2>

            <h3>1. Caldera sobredimensionada con corto-ciclado</h3>
            <p>
                Una caldera que enciende, alcanza rápidamente la temperatura objetivo y corta,
                para volver a encender 5–10 minutos después, está en corto-ciclado. Cada arranque
                consume más gas que el funcionamiento continuo (pérdidas por purga de gases y
                calentamiento inicial del intercambiador).
            </p>
            <p>
                Señal de alerta: si la caldera cicla más de 6–8 veces por hora en días de frío
                moderado, está sobredimensionada para la carga real del sistema.
            </p>

            <h3>2. Curva de calefacción (heating curve) mal ajustada</h3>
            <p>
                Las calderas modulantes modernas ajustan la temperatura de impulsión según la
                temperatura exterior. Si la curva está mal configurada, la caldera puede estar
                enviando agua a 75°C cuando con 55°C alcanzaría para las condiciones del día.
            </p>
            <p>
                El consumo es proporcional a la temperatura de impulsión: bajar de 75°C a 55°C
                con una caldera de condensación puede mejorar el rendimiento del 95% al 105–108%.
            </p>

            <div className="callout callout-info">
                <div className="callout-label">Condensación y eficiencia</div>
                <p>
                    Las calderas de condensación alcanzan su máxima eficiencia cuando la
                    temperatura de retorno cae por debajo de 57°C (temperatura de punto de
                    rocío del vapor de agua en los gases). Si la instalación trabaja con
                    temperaturas altas de manera innecesaria, se pierde el beneficio de
                    la condensación.
                </p>
            </div>

            <h3>3. Pérdidas térmicas del edificio no resueltas</h3>
            <p>
                Ventanas con vidrio simple, muros sin aislación, puertas con infiltraciones:
                el sistema de calefacción compensa las pérdidas del edificio. Cuanto mayor
                la pérdida, más consume la caldera.
            </p>
            <p>
                La reducción de pérdidas (mejora del envelope) es la intervención con mayor
                retorno en eficiencia energética, pero requiere inversión en el edificio, no
                en la instalación.
            </p>

            <h3>4. Sistema desbalanceado con sobrecalentamiento de algunos ambientes</h3>
            <p>
                En un sistema desbalanceado, algunos ambientes se sobrecalientan y los ocupantes
                abren ventanas para regularlos. Toda la energía perdida por ventanas abiertas
                es energía que la caldera tiene que reponer.
            </p>

            <h3>5. Temperatura de set-point demasiado alta</h3>
            <p>
                Cada grado de temperatura interior por encima del necesario aumenta el consumo
                un 6–8%. Un set-point de 23°C en lugar de 20°C puede significar 18–24% más
                de consumo sin ganancia real de confort.
            </p>

            <h2>Diagnóstico paso a paso</h2>
            <ol>
                <li>
                    <strong>Registrar la frecuencia de ciclado de la caldera</strong> en un día de frío moderado.
                    Si cicla más de 6 veces por hora, hay sobredimensionamiento o problema de modulación.
                </li>
                <li>
                    <strong>Verificar la temperatura de impulsión y retorno</strong> con termómetro.
                    ΔT entre impulsión y retorno debería estar en el rango de 10–20°C en operación normal.
                </li>
                <li>
                    <strong>Medir la temperatura real de los ambientes</strong> con termómetro de ambiente.
                    Comparar con el set-point del termostato.
                </li>
                <li>
                    <strong>Revisar la curva de calefacción en la caldera</strong> (manual del equipo)
                    y ajustar si corresponde.
                </li>
            </ol>

            <h2>Las soluciones</h2>

            <h3>Ajuste de curva de calefacción</h3>
            <p>
                En calderas modulantes con compensación climática, ajustar la curva para
                que la temperatura de impulsión sea la mínima necesaria para cada temperatura
                exterior es la intervención más efectiva sin costo de materiales.
            </p>

            <h3>Reducción del set-point</h3>
            <p>
                Reducir la temperatura interior de 22°C a 20°C con ropa adecuada
                ahorra 12–16% del consumo anual. En ocupación nocturna: setback a 17–18°C.
            </p>

            <h3>Mejora del equilibrado hidráulico</h3>
            <p>
                Un sistema equilibrado permite mantener la temperatura objetivo con menor
                temperatura de impulsión, lo que directamente mejora el rendimiento de
                la caldera de condensación.
            </p>

            <div className="callout callout-tip">
                <div className="callout-label">Dato de obra</div>
                <p>
                    En instalaciones existentes con calderas no modulantes antiguas,
                    el mayor impacto en consumo viene de instalar una caldera de condensación
                    modulante correctamente dimensionada. El retorno de inversión en zonas
                    frías está típicamente en 4–7 años.
                </p>
            </div>
        </div>
    )
}
