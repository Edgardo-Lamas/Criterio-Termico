// Caso: Congelamiento del sistema — anticongelante en zonas frías
// Tier: free

import { DiagramaAnticongelante } from '../manual/diagrams/DiagramaAnticongelante'

export const errorAnticongelante = {
    id: 'anticongelante',
    titulo: 'Congelamiento del sistema en zonas frías',
    categoria: 'Protección y mantenimiento',
    tier: 'free' as const,
    preview: 'La protección anticongelante de la caldera no es suficiente si se corta la luz o el gas. Un sistema congelado puede destruir radiadores, tuberías y válvulas en minutos.',
    resumen: 'Las calderas modernas tienen protección anticongelante incorporada, pero solo funciona si hay electricidad y gas. En zonas frías, la única protección real e independiente del suministro energético es el anticongelante a base de glicol en el agua del circuito.',
}

export function ErrorAnticongelanteDetalle() {
    return (
        <div className="prose">
            <h2>El riesgo: qué pasa cuando un sistema se congela</h2>
            <p>
                El agua al congelarse aumenta su volumen aproximadamente un 9%.
                En un circuito cerrado y rígido —tuberías, radiadores, válvulas—
                esa expansión no tiene adónde ir. La presión resultante puede
                superar los 200 bar localmente, suficiente para partir un radiador
                de aluminio, reventar una tubería de cobre o destruir el cuerpo
                de una válvula termostática.
            </p>
            <p>
                El daño ocurre en minutos y generalmente no es visible hasta que
                el sistema se descongela: ahí aparecen las pérdidas, a veces
                simultáneamente en varios puntos. La reparación de un sistema
                congelado puede implicar el reemplazo de varios radiadores,
                tramos de tubería y accesorios.
            </p>

            <div className="callout callout-warning">
                <div className="callout-label">Los puntos más vulnerables</div>
                <p>
                    Los elementos más expuestos al congelamiento son los que
                    tienen paredes más delgadas o están en espacios sin calefacción:
                    radiadores en garajes, tuberías en exteriores o en entre-techos,
                    tramos que pasan por muros exteriores sin aislación, y cualquier
                    ramal que quede con agua estática (detente cerrado, ramal cortado).
                </p>
            </div>

            <h2>La protección anticongelante de la caldera</h2>
            <p>
                La mayoría de las calderas modernas incluye una función anticongelante
                programada en su controlador electrónico. Opera en dos etapas:
            </p>
            <ul>
                <li>
                    <strong>A 8°C:</strong> la caldera activa la bomba circuladora
                    sin encender el quemador. El agua en movimiento tiene mucha
                    menos tendencia a congelarse que el agua estática; la velocidad
                    de circulación evita la formación de cristales de hielo incluso
                    a temperaturas bajo cero en zonas puntuales del circuito.
                </li>
                <li>
                    <strong>A 3°C:</strong> si la temperatura sigue bajando, la caldera
                    enciende el quemador y calienta el agua hasta los 20°C.
                    Una vez alcanzada esa temperatura, apaga el quemador y mantiene
                    la bomba activa.
                </li>
            </ul>
            <p>
                Esta protección es efectiva y no requiere intervención del instalador
                ni del usuario. Sin embargo, tiene una limitación fundamental:
            </p>

            <div className="callout callout-error">
                <div className="callout-label">La protección de la caldera solo funciona con luz y gas</div>
                <p>
                    Si se corta el suministro eléctrico, la caldera no puede activar
                    ni la bomba ni el quemador. Si se corta el gas, el quemador no enciende.
                    En condiciones de frío extremo —que es exactamente cuando se producen
                    cortes de suministro— la protección electrónica queda inactiva.
                    El sistema queda expuesto sin ninguna defensa.
                </p>
            </div>

            <DiagramaAnticongelante />

            <h2>La solución real: anticongelante a base de glicol</h2>
            <p>
                El anticongelante de glicol en el agua del circuito es la protección
                independiente del suministro energético. El glicol (del griego
                <em> glykys</em>, dulce) es un alcohol que, mezclado con agua,
                baja el punto de congelamiento de la mezcla de forma proporcional
                a la concentración.
            </p>

            <h3>Tipos de glicol disponibles</h3>
            <p>
                Existen dos tipos principales, ambos aptos para sistemas de calefacción:
            </p>
            <ul>
                <li>
                    <strong>Etilenglicol (anticongelante de autos):</strong> el mismo
                    producto que se usa en los sistemas de refrigeración de motores.
                    Es efectivo, económico y se consigue en cualquier estación de servicio
                    o casa de repuestos. Es tóxico si se ingiere, pero en un sistema
                    de calefacción cerrado, que nunca está en contacto con agua potable,
                    no representa riesgo. Es la opción más práctica y accesible.
                </li>
                <li>
                    <strong>Propilenglicol:</strong> no tóxico, aprobado para uso
                    alimentario. Es la opción recomendada cuando existe aunque sea
                    una posibilidad de contacto con agua de consumo (sistemas combinados
                    de calefacción y ACS sin intercambiador). Su costo es mayor y
                    no siempre se consigue localmente. En zonas remotas, el
                    etilenglicol es la alternativa práctica sin restricciones.
                </li>
            </ul>

            <div className="callout callout-tip">
                <div className="callout-label">El anticongelante de autos funciona igual</div>
                <p>
                    No es necesario adquirir el anticongelante específico para
                    calefacción —que suele comercializarse a precios significativamente
                    más altos en casas de calefacción—. El anticongelante automotor
                    a base de etilenglicol con inhibidores de corrosión es exactamente
                    el mismo producto y cumple la misma función en un circuito cerrado
                    de agua caliente. Verificar que sea del tipo OAT (Organic Acid Technology)
                    o HOAT, que son compatibles con aluminio, acero y cobre.
                    Evitar los de color verde intenso más antiguos (silicato puro)
                    que pueden depositar en circuitos con pasajes estrechos.
                </p>
            </div>

            <h3>Concentraciones según zona climática</h3>
            <p>
                La concentración de glicol determina hasta qué temperatura protege
                la mezcla. La regla práctica es dimensionar para la temperatura
                mínima histórica de la zona, con al menos 5°C de margen:
            </p>
            <table>
                <thead>
                    <tr>
                        <th>Concentración</th>
                        <th>Protección hasta</th>
                        <th>Zona de referencia (Argentina)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>25%</td>
                        <td>-10°C</td>
                        <td>Zona I–II (AMBA, Córdoba, Santa Fe)</td>
                    </tr>
                    <tr>
                        <td>33%</td>
                        <td>-16°C</td>
                        <td>Zona III (Cuyo, Sierras, Mendoza capital)</td>
                    </tr>
                    <tr>
                        <td>40%</td>
                        <td>-25°C</td>
                        <td>Zona IV–V (Patagonia, altura andina)</td>
                    </tr>
                    <tr>
                        <td>50%</td>
                        <td>-37°C</td>
                        <td>Límite práctico — no superar</td>
                    </tr>
                </tbody>
            </table>

            <div className="callout callout-warning">
                <div className="callout-label">No superar el 50% de concentración</div>
                <p>
                    Por encima del 50% la mezcla pierde eficiencia de transferencia
                    de calor, aumenta la viscosidad (la bomba trabaja más), y algunos
                    inhibidores pueden volverse agresivos con los metales del circuito.
                    El punto óptimo entre protección y rendimiento está entre el 30 y el 40%.
                </p>
            </div>

            <h2>Cómo agregar anticongelante a un sistema existente</h2>
            <ol>
                <li>
                    <strong>Calcular el volumen del sistema:</strong> aproximadamente
                    8 a 10 litros por radiador de 6 elementos, más el volumen de
                    las tuberías. En una vivienda tipo de 3 habitaciones el circuito
                    suele tener entre 30 y 60 litros totales.
                </li>
                <li>
                    <strong>Determinar cuánto glicol agregar:</strong> para una
                    concentración del 33% en un sistema de 50 litros, se necesitan
                    aproximadamente 17 litros de glicol puro (o seguir las
                    proporciones de la etiqueta del producto).
                </li>
                <li>
                    <strong>Vaciar parcialmente el sistema</strong> por el punto
                    de vaciado hasta extraer la cantidad equivalente al glicol
                    que se va a agregar.
                </li>
                <li>
                    <strong>Agregar el glicol</strong> por el punto de carga
                    o directamente en el circuito abierto con la bomba de relleno.
                </li>
                <li>
                    <strong>Hacer circular el sistema</strong> durante al menos
                    30 minutos con la bomba activa para homogeneizar la mezcla.
                </li>
                <li>
                    <strong>Verificar la concentración</strong> con un refractómetro
                    (instrumento de bajo costo que mide la concentración de glicol
                    en segundos con una gota de agua del circuito). Los densímetros
                    de flotador son menos precisos pero también sirven.
                </li>
            </ol>

            <h2>Consideraciones adicionales</h2>
            <h3>El glicol y la calidad del agua</h3>
            <p>
                El anticongelante automotor ya viene con inhibidores de corrosión
                incluidos en su formulación. Si se usa glicol puro sin inhibidores,
                debe agregarse un inhibidor compatible por separado. Sin inhibidores,
                el glicol puede volverse ácido con el tiempo y atacar los metales
                del circuito.
            </p>
            <h3>Renovación periódica</h3>
            <p>
                Los inhibidores del anticongelante se degradan con el tiempo y la
                temperatura. En sistemas de calefacción, el intervalo de renovación
                recomendado es de 2 a 4 años dependiendo del producto y las
                horas de operación anuales. Verificar el pH del agua del circuito
                con tiras reactivas (debe estar entre 7 y 8.5): valores ácidos
                indican que los inhibidores están agotados.
            </p>
            <h3>Sistemas en casas de uso no permanente</h3>
            <p>
                Las viviendas de fin de semana o uso estacional en zonas frías
                son las más expuestas: la caldera pasa semanas apagada sin nadie
                que controle el sistema. Para estas situaciones, el anticongelante
                no es opcional —es la única protección real durante la ausencia.
                Alternativamente, vaciar completamente el sistema antes de dejar
                la vivienda deshabitada en invierno.
            </p>

            <div className="callout callout-tip">
                <div className="callout-label">Criterio profesional</div>
                <p>
                    En zonas frías, incluir el anticongelante en el presupuesto
                    de la instalación nueva y explicárselo al cliente como parte
                    del sistema, no como un extra. Un sistema congelado que el
                    instalador no advirtió ni recomendó proteger puede generar
                    un reclamo legítimo. La prevención cuesta mucho menos que
                    la reparación y protege a ambas partes.
                </p>
            </div>
        </div>
    )
}
