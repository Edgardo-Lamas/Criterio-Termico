// Error: Ruidos en las tuberías — Velocidad excesiva
// Tier: free

export const errorRuidosTuberia = {
    id: 'ruidos-tuberia',
    titulo: 'Ruidos en las tuberías',
    categoria: 'Velocidad excesiva',
    tier: 'free' as const,
    preview: 'Silbidos o golpes de ariete en el sistema.',
    resumen: 'Los ruidos en tuberías de calefacción tienen causas específicas: velocidad excesiva del agua, aire atrapado o dilatación térmica mal resuelta.',
}

export function ErrorRuidosTuberiaDetalle() {
    return (
        <div className="prose">
            <h2>El problema</h2>
            <p>
                El sistema de calefacción produce ruidos: silbidos continuos, golpes intermitentes,
                chasquidos al encender o apagar, o un flujo turbulento audible en paredes y cielorrasos.
                Además de ser molesto, un sistema ruidoso generalmente indica un problema técnico
                que afecta la eficiencia y puede acelerar el desgaste de componentes.
            </p>

            <h2>Tipos de ruido y sus causas</h2>

            <h3>Silbido continuo — Velocidad excesiva</h3>
            <p>
                El ruido más común. Ocurre cuando el agua circula a una velocidad superior
                a la recomendada para el diámetro de la tubería. El rango seguro para
                tuberías de calefacción residencial es <strong>0.5 a 1.0 m/s</strong>
                (máximo 1.5 m/s en tramos principales).
            </p>
            <p>
                Causas:
            </p>
            <ul>
                <li>Bomba de circulación sobredimensionada o en velocidad máxima innecesaria</li>
                <li>Tuberías subdimensionadas para el caudal que circula</li>
                <li>Válvulas termostáticas muy cerradas concentrando el caudal en pocos ramales</li>
            </ul>

            <h3>Golpes de ariete — Cambios bruscos de caudal</h3>
            <p>
                Golpe seco audible cuando una válvula termostática cierra bruscamente o la
                bomba arranca/para. El cambio de caudal súbito genera una onda de presión
                que se propaga por el circuito.
            </p>
            <ul>
                <li>Válvulas termostáticas de cierre rápido sin amortiguación</li>
                <li>Bomba sin variador de frecuencia que arranca a pleno</li>
                <li>Circuito sin vaso de expansión correctamente dimensionado</li>
            </ul>

            <h3>Chasquidos al encender o apagar — Dilatación térmica</h3>
            <p>
                Al calentarse, las tuberías se dilatan. Si están embutidas en pared o piso
                sin manga de protección y sin puntos de deslizamiento libre, la dilatación
                genera tensión que se libera en forma de chasquido.
            </p>
            <p>
                El coeficiente de dilatación del polipropileno (termofusión) es de
                <strong> ~0.15 mm/m°C</strong>. En un tendido de 10 metros con ΔT de 50°C,
                eso es 75 mm de dilatación libre — si está contenida, crea fuerza.
            </p>

            <h3>Borboteo o flujo turbulento — Aire atrapado</h3>
            <p>
                El aire que no fue purgado del sistema queda atrapado en los puntos altos
                del circuito y en los radiadores. Cuando el agua lo arrastra, genera el
                sonido característico de mezcla agua-aire.
            </p>

            <div className="callout callout-warning">
                <div className="callout-label">Atención</div>
                <p>
                    El aire en el circuito no solo genera ruido: provoca corrosión acelerada
                    (el oxígeno del aire ataca el hierro de los radiadores y la caldera) y
                    zonas sin circulación en los radiadores con bolsas de aire.
                </p>
            </div>

            <h2>La solución</h2>

            <h3>Para velocidad excesiva</h3>
            <ol>
                <li>Bajar la velocidad de la bomba de circulación (si tiene regulación de velocidades)</li>
                <li>Verificar que los diámetros de tubería correspondan al caudal proyectado</li>
                <li>Revisar que las válvulas termostáticas no estén todas cerradas al mismo tiempo</li>
            </ol>

            <h3>Para aire atrapado</h3>
            <ol>
                <li>Purgar todos los radiadores manualmente desde el purgador manual</li>
                <li>Instalar purgadores automáticos en los puntos más altos del circuito</li>
                <li>Verificar que el vaso de expansión esté correctamente presurizado</li>
                <li>Rellenar el circuito con agua hasta la presión correcta (generalmente 1–1.5 bar en frío)</li>
            </ol>

            <h3>Para dilatación térmica</h3>
            <ol>
                <li>En nuevas instalaciones: instalar mangas deslizantes donde la tubería cruza muros</li>
                <li>Dejar puntos de deslizamiento libre cada 1.5–2 m en tramos largos</li>
                <li>Instalar compensadores en tramos largos embutidos</li>
            </ol>

            <div className="callout callout-tip">
                <div className="callout-label">Diagnóstico de campo</div>
                <p>
                    Para identificar si el ruido es de velocidad o de aire: apagá la bomba
                    por 10 segundos y volvé a encenderla. Si el ruido desaparece durante la pausa,
                    es velocidad. Si sigue o cambia de tono, es probablemente aire moviéndose
                    en la convección natural residual.
                </p>
            </div>
        </div>
    )
}
