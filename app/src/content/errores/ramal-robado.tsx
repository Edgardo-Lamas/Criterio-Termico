// Error: Ramal robado — reducción de diámetro antes de la derivación (efecto Venturi)
// Tier: pro

export const errorRamalRobado = {
    id: 'ramal-robado',
    titulo: 'Ramal robado: la reducción antes de la derivación',
    categoria: 'Diseño de tuberías',
    tier: 'pro' as const,
    preview: 'Un radiador queda sin caudal aunque los diámetros parecen correctos: la reducción está antes de la tee.',
    resumen: 'Reducir el diámetro de la troncal antes de la derivación acelera el agua (continuidad/Venturi) y baja la presión justo donde el ramal necesita tomar su caudal. La regla: reducir siempre después de la tee, nunca antes.',
}

export function ErrorRamalRobadoDetalle() {
    return (
        <div className="prose">
            <h2>El problema</h2>
            <p>
                Un radiador —o todo un ramal— recibe poco caudal y no alcanza temperatura,
                aunque en el proyecto los diámetros parecen correctos: la troncal arranca
                en Ø25, sigue en Ø20 y los ramales son Ø16, tal como indica la tabla.
                El instalador revisa purga, detentes y bomba, y todo está bien.
                El detalle que nadie mira: <strong>dónde</strong> está colocada cada
                reducción respecto de la tee de derivación.
            </p>

            <h2>La física: continuidad y efecto Venturi</h2>
            <p>
                El agua es incompresible: el caudal que entra a un tramo tiene que salir.
                Si el <strong>mismo caudal</strong> pasa a una sección menor, la velocidad
                sube en proporción al cuadrado del diámetro interior (v = Q / A) —
                y por Bernoulli, donde la velocidad sube, <strong>la presión baja</strong>.
                Ese es el efecto Venturi, el mismo principio del carburador o del
                pulverizador de pintura.
            </p>
            <p>
                Con números de obra: 600 L/h viajando por PE-X Ø20 (interior ~16,2 mm)
                van a 0,81 m/s. Si ese mismo caudal se mete en un Ø16
                (interior ~12,4 mm) <em>antes</em> de derivar nada, la velocidad salta a
                <strong> 1,38 m/s</strong> — casi el doble, con más pérdida de carga por
                metro, menos presión disponible y, por encima de ~1,5 m/s, ruido de agua
                en el caño.
            </p>

            <h2>El error: reducir antes de la tee</h2>
            <p>
                Cuando la reducción queda <strong>antes</strong> de la derivación,
                todo el caudal pasa por la garganta angosta y llega a la tee acelerado
                y con menos presión. El ramal que sale de esa tee necesita justamente
                presión diferencial para tomar su caudal — y no la encuentra.
                El resultado es un <strong>ramal robado</strong>: el agua de la troncal
                pasa de largo hacia los tramos siguientes y el radiador de ese ramal
                queda tibio, sin que ninguna válvula lo explique.
            </p>

            <div className="callout callout-warning">
                <div className="callout-label">La regla de obra</div>
                <p>
                    <strong>La reducción va siempre después de la derivación, nunca antes.</strong>
                    Primero la tee toma su caudal con el diámetro grande; recién después
                    el caño reduce, porque el caudal que sigue viajando ya es menor.
                </p>
            </div>

            <h2>Por qué la reducción progresiva bien hecha NO acelera el agua</h2>
            <p>
                Puede sonar contradictorio: ¿reducir el diámetro no acelera siempre el agua?
                No — porque en una troncal bien dimensionada cada reducción va después de
                una tee, y en ese punto <strong>el caudal también bajó</strong>: una parte
                se fue por el ramal. El diámetro nuevo se elige justo para que el caudal
                restante siga viajando a la velocidad de diseño (~1 m/s).
            </p>
            <p>
                Con la tabla de Criterio Térmico: una troncal con 6.000 kcal/h por delante
                (600 L/h) va en Ø20 a 0,81 m/s; después de derivar un radiador de
                2.000 kcal/h quedan 400 L/h, que en Ø16 viajan a 0,92 m/s.
                La velocidad se mantiene prácticamente constante a lo largo de todo el
                recorrido. La reducción progresiva no acelera el agua:
                <strong> evita que se frene</strong>. Sin reducir, el agua llegaría al
                último radiador arrastrándose a 0,3 m/s por un caño sobredimensionado
                que el cliente pagó de más.
            </p>

            <h2>Diagnóstico</h2>
            <ol>
                <li>
                    Identificar el radiador robado: caño de ida tibio y caudal pobre,
                    con detente y válvula abiertos y sin aire.
                </li>
                <li>
                    Seguir la troncal aguas arriba de esa tee y ubicar la última
                    reducción de diámetro.
                </li>
                <li>
                    <strong>Si la reducción está antes de la tee</strong> (el ramal sale
                    de un tramo ya reducido que sigue alimentando más radiadores):
                    diagnóstico confirmado.
                </li>
            </ol>

            <h2>La solución</h2>
            <p>
                Reubicar la reducción: la tee del ramal robado debe quedar sobre el
                diámetro grande, y la cupla de reducción inmediatamente
                <em> después</em> de la derivación. Es una corrección puntual de
                cuplas y tee — pero si la tubería va embutida, implica abrir. Por eso
                este error se paga caro: es barato de prevenir en el proyecto y caro
                de corregir en la obra terminada.
            </p>

            <div className="callout callout-tip">
                <div className="callout-label">Prevención en el proyecto</div>
                <p>
                    Dimensionar cada tramo de troncal por la <strong>potencia acumulada
                    que le queda por alimentar</strong> (caudal = kcal/h ÷ ΔT10) y colocar
                    cada reducción después de su derivación. El Conectar Auto del
                    Simulador 2D de Criterio Térmico aplica exactamente este criterio:
                    cada tramo lleva el diámetro del caudal que todavía transporta,
                    y la reducción ocurre recién después de cada tee.
                </p>
            </div>
        </div>
    )
}
