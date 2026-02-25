// Error: La caldera arranca y para constantemente — Corto-ciclado
// Tier: pro

export const errorCalderaCortaCiclado = {
    id: 'caldera-corta-ciclado',
    titulo: 'La caldera arranca y para constantemente',
    categoria: 'Dimensionamiento',
    tier: 'pro' as const,
    preview: 'Ciclos cortos que reducen la vida útil del equipo.',
    resumen: 'El corto-ciclado (short cycling) ocurre cuando la potencia instalada supera ampliamente la carga real del sistema. La caldera alcanza rápidamente su límite de temperatura y corta, para encender nuevamente minutos después.',
}

export function ErrorCalderaCortaCicladoDetalle() {
    return (
        <div className="prose">
            <h2>El problema</h2>
            <p>
                La caldera enciende, trabaja 3–5 minutos, alcanza la temperatura objetivo y corta.
                A los 5–10 minutos, la temperatura baja ligeramente y vuelve a encender.
                Este ciclo se repite decenas de veces por día. La calefacción "funciona"
                en términos de temperatura ambiente, pero el equipo trabaja en condiciones
                extremadamente desfavorables.
            </p>

            <h2>Por qué es un problema grave</h2>
            <ul>
                <li>
                    <strong>Desgaste acelerado:</strong> cada arranque somete al quemador,
                    el intercambiador y los componentes electrónicos a un ciclo térmico completo.
                    Una caldera diseñada para 15.000–20.000 arranques tiene una vida útil
                    que se mide en años si hace 10–30 arranques por hora.
                </li>
                <li>
                    <strong>Mayor consumo de gas:</strong> en cada arranque, la caldera gasta
                    gas en la purga de gases y en calentar el intercambiador desde temperatura
                    ambiente. El consumo por unidad de calor producido es mayor que en
                    funcionamiento continuo.
                </li>
                <li>
                    <strong>Menor eficiencia de condensación:</strong> el intercambiador no
                    alcanza régimen estable de condensación en ciclos muy cortos.
                </li>
            </ul>

            <div className="callout callout-warning">
                <div className="callout-label">Cuánto es demasiado</div>
                <p>
                    Una frecuencia de ciclo mayor a 6 arranques por hora en días de frío moderado
                    (temperatura exterior 5–10°C) indica corto-ciclado. En días muy fríos (−5°C),
                    la caldera debería funcionar de manera semi-continua.
                </p>
            </div>

            <h2>Las causas</h2>

            <h3>1. Caldera sobredimensionada (causa principal)</h3>
            <p>
                La causa más frecuente. Al calcular la potencia de la caldera, se aplican
                coeficientes de seguridad sucesivos: por pérdidas, por arranque en frío,
                por agua caliente sanitaria, por "margen de reserva". El resultado puede
                ser una caldera de 35 kW para una vivienda que en el día más frío del año
                demanda 18 kW.
            </p>
            <p>
                Una caldera correctamente dimensionada debería funcionar casi continuamente
                en el día de diseño (la noche más fría esperada para la zona). Si en ese
                día cicla, está sobredimensionada.
            </p>

            <h3>2. Termostato de ambiente mal ubicado</h3>
            <p>
                Un termostato expuesto a la radiación solar directa, cercano a una fuente
                de calor o en un corredor que se calienta rápido, corta la demanda antes
                de que el resto de la vivienda haya alcanzado la temperatura objetivo.
            </p>

            <h3>3. Temperatura máxima de la caldera demasiado baja</h3>
            <p>
                Si la temperatura límite de la caldera está configurada muy cerca de la
                temperatura de operación, la caldera alcanza el límite rápidamente y corta.
                Esto puede indicar una configuración incorrecta del parámetro de histéresis
                o curva de calefacción.
            </p>

            <h3>4. Radiadores con válvulas termostáticas que cierran simultáneamente</h3>
            <p>
                En el horario de máxima temperatura (mediodía con sol), muchas válvulas
                termostáticas cierran al mismo tiempo. La resistencia del circuito aumenta,
                la temperatura de impulsión sube rápidamente y la caldera corta por límite
                de temperatura, aunque la demanda de la vivienda no sea cero.
            </p>

            <h2>La solución</h2>

            <h3>Para caldera sobredimensionada existente</h3>
            <ol>
                <li>
                    <strong>Ajustar el diferencial de histéresis</strong> en la caldera:
                    aumentar la diferencia entre temperatura de encendido y apagado
                    (ej: encender a 60°C, apagar a 80°C) hace los ciclos más largos.
                </li>
                <li>
                    <strong>Instalar un acumulador hidráulico (buffer tank):</strong>
                    un tanque de inercia de 50–200 litros agrega masa al circuito y
                    alarga los ciclos significativamente. Es la solución más efectiva
                    sin cambiar la caldera.
                </li>
                <li>
                    <strong>Instalar una válvula de bypass termostatizada</strong> entre
                    impulsión y retorno para mantener caudal mínimo cuando las válvulas
                    de zona cierran.
                </li>
            </ol>

            <h3>Para nuevas instalaciones: dimensionar correctamente</h3>
            <p>
                La caldera se dimensiona para la <strong>carga de diseño real</strong>,
                no con coeficientes de seguridad acumulados. El agua caliente sanitaria
                se cubre con un acumulador separado o sistema instantáneo, sin sobredimensionar
                la caldera de calefacción.
            </p>

            <div className="callout callout-tip">
                <div className="callout-label">Regla de campo</div>
                <p>
                    Una caldera correctamente dimensionada debería ser la más pequeña posible
                    que satisfaga la demanda en el día de diseño. En la práctica, es mejor
                    quedar un 10–15% por encima de la carga calculada que un 40–80% por encima
                    como ocurre frecuentemente.
                </p>
            </div>
        </div>
    )
}
