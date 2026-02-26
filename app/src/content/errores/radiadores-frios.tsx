// Error: Algunos radiadores no calientan — Desbalance hidráulico + Cortocircuito de agua
// Tier: free

import { DiagramaCortocircuito } from '../manual/diagrams/DiagramaCortocircuito'

export const errorRadiadoresFrios = {
    id: 'radiadores-frios',
    titulo: 'Algunos radiadores no calientan',
    categoria: 'Desbalance hidráulico',
    tier: 'free' as const,
    preview: 'Los radiadores más alejados de la caldera no alcanzan temperatura.',
    resumen: 'El agua caliente toma el camino de menor resistencia y no llega en caudal suficiente a los radiadores más lejanos o al final del ramal.',
}

export function ErrorRadiadoresFriosDetalle() {
    return (
        <div className="prose">
            <h2>El problema</h2>
            <p>
                En un sistema de calefacción por radiadores, algunos emisores —generalmente
                los más alejados de la caldera o los del último ramal— no alcanzan temperatura
                o directamente permanecen fríos mientras el resto del sistema funciona con normalidad.
                La caldera enciende y el circuito circula, pero la distribución de calor es desigual.
            </p>

            <h2>La causa raíz: desbalance hidráulico</h2>
            <p>
                El agua caliente, como todo fluido, toma el <strong>camino de menor resistencia</strong>.
                En un circuito mal equilibrado, el agua circula preferentemente por los ramales más cortos
                o de menor pérdida de carga, y los ramales más largos o con más resistencia reciben
                caudal insuficiente.
            </p>
            <p>
                Con menos caudal, el agua llega al radiador alejado ya parcialmente enfriada
                y no puede ceder suficiente calor. El resultado es un radiador tibio o frío
                aunque la instalación esté funcionando.
            </p>

            <div className="callout callout-info">
                <div className="callout-label">Diagnóstico rápido</div>
                <p>
                    Tocá el ramal de impulsión (ida) del radiador frío. Si el caño está caliente
                    pero el radiador frío, el problema es de aire o de detente cerrado.
                    Si el caño también está frío o tibio, es desbalance hidráulico o falta de caudal.
                </p>
            </div>

            <h2>Causas secundarias frecuentes</h2>
            <ul>
                <li>
                    <strong>Diámetros de tuberías subdimensionados</strong> en ramales largos:
                    la pérdida de carga aumenta y el caudal cae.
                </li>
                <li>
                    <strong>Válvulas termostáticas sin preajuste</strong> de apertura en función
                    de la posición del radiador en el circuito.
                </li>
                <li>
                    <strong>Bomba de circulación subdimensionada:</strong> no genera suficiente
                    presión diferencial para vencer la resistencia de los ramales más largos.
                </li>
                <li>
                    <strong>Circuito monotubo sin equilibrado:</strong> en el circuito monotubo
                    (serie), cada radiador recibe el agua ya enfriada por el anterior — sin
                    compensación, los últimos siempre estarán más fríos.
                </li>
            </ul>

            <h2>La solución</h2>
            <h3>1. Equilibrado hidráulico por detentes</h3>
            <p>
                Los detentes (válvulas de retorno con regulación de caudal) en cada radiador
                permiten restringir el caudal en los ramales más cercanos a la caldera,
                forzando al agua a repartirse en proporciones más equilibradas.
            </p>
            <p>
                El procedimiento correcto:
            </p>
            <ol>
                <li>Medir temperatura de superficie de todos los radiadores con termómetro infrarrojo</li>
                <li>Identificar cuáles están por encima del objetivo (sobrealimentados) y cuáles por debajo</li>
                <li>Cerrar parcialmente los detentes de los radiadores sobrealimentados</li>
                <li>Repetir el ciclo hasta que las temperaturas se equilibren</li>
            </ol>

            <h3>2. Verificar la bomba de circulación</h3>
            <p>
                Si el equilibrado manual no resuelve el problema, la bomba puede estar
                subdimensionada. Verificar que la curva de la bomba cubra el caudal y
                la altura manométrica del circuito más largo.
            </p>

            <h3>3. En circuito monotubo: instalar bypass en cada radiador</h3>
            <p>
                En sistemas monotubo, el bypass hidráulico en cada emisor garantiza que
                el caudal del circuito principal no se vea afectado por el estado de apertura
                de las válvulas de cada radiador.
            </p>

            <div className="callout callout-tip">
                <div className="callout-label">Prevención en proyectos nuevos</div>
                <p>
                    El diseño bitubo con dimensionamiento correcto de diámetros y válvulas de
                    equilibrado instaladas desde el inicio es la manera de evitar este problema
                    completamente. El equilibrado posterior en una instalación mal diseñada
                    tiene límites claros.
                </p>
            </div>

            <h2>Caso especial: el radiador que se purga, calienta y vuelve a estar frío</h2>
            <p>
                Existe un síntoma particular que no responde al equilibrado hidráulico ni a
                ninguna de las causas anteriores: el radiador está frío, se purga el purgador
                de aire, durante la purga el emisor empieza a calentar —a veces alcanza
                temperatura de trabajo— pero al poco tiempo <strong>vuelve a estar frío</strong>.
                El ciclo se repite cada vez que se purga.
            </p>
            <p>
                Este comportamiento es la firma de lo que se conoce como
                <strong> cortocircuito de agua</strong>: el agua no está circulando
                a través del cuerpo del radiador sino que está tomando un camino
                alternativo de menor resistencia, volviendo al retorno sin ceder
                calor. La purga fuerza momentáneamente un flujo real, pero en cuanto
                se cierra el purgador la circulación se detiene.
            </p>

            <h3>La causa: circuito cruzado en las conexiones del radiador</h3>
            <p>
                La razón más frecuente del cortocircuito de agua es que las conexiones
                del radiador están invertidas en la pared: la tubería que debería
                ser la impulsión (caliente, que entra) está conectada donde debería
                estar el retorno, y viceversa.
            </p>
            <p>
                Con las conexiones cruzadas, el agua de impulsión llega a la
                conexión <em>inferior</em> del radiador y la de retorno a la
                <em>superior</em>. En esta configuración no existe diferencia
                de presión entre entrada y salida del emisor: ambos lados están
                bajo la presión de su respectivo colector, pero invertidos,
                y el agua circula por el camino externo de menor resistencia
                sin atravesar el cuerpo del radiador.
            </p>

            <h3>Diagnóstico por tacto durante la purga</h3>
            <p>
                El procedimiento para confirmar el cortocircuito es simple y
                no requiere herramientas especiales:
            </p>
            <ol>
                <li>
                    Con el sistema en funcionamiento, abrir el purgador del radiador
                    sospechoso y dejar que el agua circule durante unos segundos.
                </li>
                <li>
                    Mientras el agua está fluyendo, tocar con la mano ambas
                    conexiones en la pared —la superior y la inferior— y determinar
                    cuál calienta primero.
                </li>
                <li>
                    <strong>Si la conexión inferior calienta primero:</strong> la impulsión
                    (agua caliente) llega por abajo. Los circuitos están cruzados.
                    Es el diagnóstico confirmado de cortocircuito de agua.
                </li>
                <li>
                    <strong>Si la conexión superior calienta primero:</strong> la
                    impulsión llega por donde corresponde. El problema es otro
                    (aire, detente cerrado, desbalance).
                </li>
            </ol>

            <DiagramaCortocircuito />

            <div className="callout callout-warning">
                <div className="callout-label">La solución implica obra</div>
                <p>
                    Un circuito cruzado en las conexiones del radiador no tiene
                    solución sin intervención en las tuberías. Es necesario abrir
                    el piso o la pared donde se encuentran las tuberías de ese ramal
                    e invertir las conexiones. No existe ajuste de válvulas ni
                    equilibrado que corrija el problema.
                </p>
            </div>

            <h3>Por qué la purga "engaña"</h3>
            <p>
                Cuando se abre el purgador se crea artificialmente una diferencia
                de presión: el agua sale por el purgador, generando un flujo
                momentáneo a través del cuerpo del radiador. Ese flujo cede
                calor y el emisor se calienta. Al cerrar el purgador, la diferencia
                de presión desaparece y el agua vuelve al cortocircuito.
                El radiador enfría en minutos.
            </p>
            <p>
                Este mecanismo hace que el problema sea fácilmente confundible
                con un problema de aire. La diferencia clave: con aire, una sola
                purga resuelve el problema de forma permanente. Con cortocircuito
                de agua, el problema reaparece sistemáticamente.
            </p>
        </div>
    )
}
