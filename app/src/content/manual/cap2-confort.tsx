// Capítulo 2 — Estrategia de confort térmico
// Acceso: free

import { DiagramaRadiador } from './diagrams/DiagramaRadiador'
import { DiagramaConfort } from './diagrams/DiagramaConfort'
import { DiagramaInercia } from './diagrams/DiagramaInercia'
import { FotoManual } from './diagrams/FotoManual'

export function Cap2Confort() {
    return (
        <div className="prose">
            <p>
                La calefacción por radiadores no es "una tecnología entre otras" —
                es el sistema que más se acerca al ideal de <strong>confort térmico real</strong>
                cuando está bien diseñado. Entender por qué es así te da el argumento
                técnico para proponer y defender el sistema con criterio.
            </p>

            <h2>Qué es el confort térmico (y por qué no es solo "estar caliente")</h2>
            <p>
                El confort térmico es una condición fisiológica: el organismo está en equilibrio
                térmico con el entorno sin esfuerzo de regulación. Esto depende de cuatro factores:
            </p>
            <ul>
                <li><strong>Temperatura del aire:</strong> lo que mide el termómetro</li>
                <li><strong>Temperatura radiante media:</strong> la temperatura de las superficies que rodean al cuerpo</li>
                <li><strong>Velocidad del aire:</strong> corrientes percibidas como "frío de viento"</li>
                <li><strong>Humedad relativa:</strong> afecta la percepción de temperatura</li>
            </ul>
            <p>
                El problema de la mayoría de los sistemas de calefacción económicos (eléctrica por
                convección, estufa a gas de tiro balanceado) es que atacan solo la temperatura del
                aire. Los radiadores trabajan de manera diferente.
            </p>

            <div className="callout callout-info">
                <div className="callout-label">Dato técnico</div>
                <p>
                    Un local con paredes frías se siente incómodo aunque el aire esté a 22°C.
                    Para compensar la baja temperatura radiante media, el cuerpo necesita que
                    el aire esté entre 2°C y 4°C más caliente. Calentar el aire hasta 24–26°C
                    para compensar paredes frías consume 15–25% más energía de lo necesario.
                </p>
            </div>

            <DiagramaConfort />

            <h2>Cómo transfieren calor los radiadores</h2>
            <p>
                Un radiador de agua caliente transfiere calor por <strong>dos vías simultáneas</strong>:
            </p>

            <h3>Radiación (35–45% del total)</h3>
            <p>
                El radiador emite calor por radiación infrarroja directamente a las superficies
                opacas del local: paredes, piso, objetos, el propio cuerpo de las personas.
                Este calor no calienta el aire — calienta las superficies.
                Las superficies calientes, a su vez, elevan la temperatura radiante media
                y producen el "confort envolvente" que distingue al sistema.
            </p>

            <h3>Convección (55–65% del total)</h3>
            <p>
                El aire en contacto con la superficie del radiador se calienta, sube por
                diferencia de densidad y genera una circulación natural que distribuye
                calor en el ambiente. Sin ventilador, sin ruido, sin arrastre de polvo por
                corriente forzada.
            </p>

            <DiagramaRadiador />

            <div className="callout callout-tip">
                <div className="callout-label">Por qué importa la proporción</div>
                <p>
                    La combinación de radiación + convección es lo que diferencia a los radiadores
                    de los fan-coils (solo convección forzada) y de la losa radiante (principalmente
                    radiación). Es un punto intermedio muy eficiente para uso residencial.
                </p>
            </div>

            <FotoManual
                alt="Radiador de panel de acero instalado bajo ventana"
                caption="Radiador de panel instalado en su posición ideal: bajo la ventana, para contrarrestar el frío que ingresa por el vidrio y crear una cortina de aire caliente."
            />

            <h2>Inercia térmica: calor que dura</h2>
            <p>
                Un sistema de calefacción central por agua caliente tiene inercia térmica alta.
                Esto significa que una vez que el sistema alcanzó la temperatura de operación,
                mantener el confort consume mucha menos energía que en los primeros minutos.
            </p>
            <p>
                La masa de agua del circuito actúa como un "reservorio de energía":
            </p>
            <ul>
                <li>La caldera puede funcionar en ciclos más largos y eficientes (menos arranques y paradas)</li>
                <li>Si la caldera se apaga por unos minutos, el agua caliente en el circuito sigue cediendo calor</li>
                <li>Los ambientes no caen en temperatura bruscamente cuando la caldera corta</li>
            </ul>

            <h3>Comparativa de inercia</h3>
            <table>
                <thead>
                    <tr>
                        <th>Sistema</th>
                        <th>Inercia</th>
                        <th>Tiempo de respuesta</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Calefacción central por agua (radiadores)</td>
                        <td>Alta</td>
                        <td>20–45 min para calentar en frío</td>
                    </tr>
                    <tr>
                        <td>Losa radiante</td>
                        <td>Muy alta</td>
                        <td>2–4 horas (no apta para uso intermitente)</td>
                    </tr>
                    <tr>
                        <td>Estufa eléctrica por convección</td>
                        <td>Nula</td>
                        <td>Inmediata (pero se apaga y el local enfría rápido)</td>
                    </tr>
                    <tr>
                        <td>Split frío/calor en modo calefacción</td>
                        <td>Baja</td>
                        <td>5–15 min (se apaga y enfría en minutos)</td>
                    </tr>
                </tbody>
            </table>

            <DiagramaInercia />

            <h2>Distribución homogénea: el indicador de un buen diseño</h2>
            <p>
                En una instalación bien diseñada, todos los ambientes alcanzan y mantienen
                la misma temperatura objetivo sin que el usuario tenga que intervenir.
                Esto requiere:
            </p>
            <ul>
                <li><strong>Dimensionamiento correcto de cada radiador</strong> según las pérdidas reales del ambiente</li>
                <li><strong>Equilibrado hidráulico del circuito</strong> — que el caudal que llega a cada radiador sea el adecuado</li>
                <li><strong>Caldera correctamente dimensionada</strong> — ni sobredimensionada (corto-ciclado) ni subdimensionada (temperatura insuficiente)</li>
            </ul>

            <div className="callout callout-warning">
                <div className="callout-label">Error de concepto frecuente</div>
                <p>
                    "Poner más elementos en todos los radiadores por las dudas" no produce
                    distribución homogénea — produce desequilibrio. Los radiadores que reciben
                    demasiado calor relativo sobrecalientan el ambiente; los que reciben poco,
                    no llegan. El equilibrio se logra con cálculo, no con margen.
                </p>
            </div>

            <h2>Cuándo la calefacción central por radiadores es la solución correcta</h2>
            <p>
                No todo proyecto requiere calefacción central. Pero hay condiciones en que
                esta solución es claramente superior:
            </p>

            <h3>Viviendas que se usan de manera continua o semi-continua</h3>
            <p>
                La inercia térmica del sistema "vale" cuando la vivienda se habita regularmente.
                Para una casa de fin de semana que pasa 5 días vacía, la losa radiante sería
                ineficiente; los radiadores también tienen un tiempo de arranque. En ese caso,
                otras soluciones pueden ser mejores.
            </p>

            <h3>Climas fríos con inviernos prolongados</h3>
            <p>
                En zonas con inviernos de 4 o más meses, la eficiencia estacional del sistema
                hidrónico supera a la mayoría de las alternativas. Cuanto más horas por día
                funciona el sistema, más rentable es en términos de costo por kW de calor útil.
            </p>

            <h3>Espacios grandes o con varios ambientes</h3>
            <p>
                Una única caldera puede calefaccionar 10, 15 o 20 ambientes simultáneamente
                con un solo equipo de generación de calor. El costo por ambiente cubierto cae
                significativamente en proyectos grandes frente a soluciones por ambiente
                (un split o estufa por habitación).
            </p>

            <h3>Cuando el confort es prioritario</h3>
            <p>
                Un dormitorio o living con radiador bien ubicado y equilibrado produce
                un confort que los ocupantes perciben como cualitativamente diferente
                al de un split o estufa. No es marketing — es consecuencia directa
                de la temperatura radiante media elevada.
            </p>

            <h2>Comparativa frente a otras soluciones</h2>
            <table>
                <thead>
                    <tr>
                        <th>Sistema</th>
                        <th>Confort</th>
                        <th>Eficiencia</th>
                        <th>Costo inicial</th>
                        <th>Ruido</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Radiadores + caldera</td>
                        <td>Muy alto</td>
                        <td>Alta (caldera condensación)</td>
                        <td>Alto</td>
                        <td>Muy bajo</td>
                    </tr>
                    <tr>
                        <td>Split frío/calor</td>
                        <td>Medio</td>
                        <td>Alta (COP &gt;3)</td>
                        <td>Medio</td>
                        <td>Medio</td>
                    </tr>
                    <tr>
                        <td>Losa radiante</td>
                        <td>Muy alto</td>
                        <td>Alta (muy inerciada)</td>
                        <td>Muy alto</td>
                        <td>Nulo</td>
                    </tr>
                    <tr>
                        <td>Estufa a gas tiro balanceado</td>
                        <td>Bajo</td>
                        <td>Media</td>
                        <td>Bajo</td>
                        <td>Bajo</td>
                    </tr>
                    <tr>
                        <td>Calefacción eléctrica</td>
                        <td>Bajo-Medio</td>
                        <td>Baja (costo operativo alto)</td>
                        <td>Muy bajo</td>
                        <td>Bajo</td>
                    </tr>
                </tbody>
            </table>

            <div className="callout callout-tip">
                <div className="callout-label">Criterio profesional</div>
                <p>
                    La calefacción central por radiadores tiene el mayor costo inicial entre las
                    opciones comunes, pero el menor costo operativo por unidad de confort producido
                    cuando está bien diseñada. Presentalo así al cliente: es una inversión con
                    retorno medible, no un gasto de lujo.
                </p>
            </div>
        </div>
    )
}
