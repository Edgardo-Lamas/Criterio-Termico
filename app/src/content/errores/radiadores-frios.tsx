// Error: Algunos radiadores no calientan — Desbalance hidráulico
// Tier: free

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
        </div>
    )
}
