// Error: Cortinas largas que anulan el radiador — Convección bloqueada
// Tier: free

export const errorCortinasRadiadores = {
    id: 'cortinas-radiadores',
    titulo: '¿Por qué las cortinas largas son enemigas de los radiadores?',
    categoria: 'Ubicación y convección',
    tier: 'free' as const,
    preview: 'Una cortina hasta el piso puede tirar afuera casi todo el calor del radiador.',
    resumen: 'El radiador va bajo la ventana porque es el punto más frío del ambiente, pero una cortina larga que lo tapa encierra el aire caliente contra el vidrio y lo manda afuera. Antes de fijar la ubicación hay que resolver qué cortinas van.',
}

export function ErrorCortinasRadiadoresDetalle() {
    return (
        <div className="prose">
            <h2>El problema</h2>
            <p>
                El cálculo dio bien, el radiador tiene los elementos que corresponden y está
                puesto en el mejor lugar —bajo la ventana— y aun así la pieza no termina de
                calentar. Cuando eso pasa, muchas veces el culpable no es el radiador: es la
                cortina. Una cortina pesada que baja hasta el piso, colgada por delante del
                radiador, puede tirar afuera buena parte del calor que ese radiador está
                entregando.
            </p>

            <h2>Cómo calienta de verdad un radiador: la convección</h2>
            <p>
                Un radiador no calienta "irradiando" como una estufa a la que le ponés la mano
                enfrente. Calienta sobre todo por <strong>convección</strong>: mueve el aire de
                la habitación. El aire frío, que es más pesado, cae al piso y entra por la parte
                de abajo del radiador. Ahí se entibia, pierde densidad —el aire caliente pesa
                menos— y sube. El aire frío que sigue entrando por abajo lo empuja hacia arriba
                y hacia adentro de la pieza. Así se arma una corriente continua: entra frío por
                abajo, sale caliente por arriba, y la habitación se calienta.
            </p>
            <p>
                Por eso muchos radiadores traen <strong>aletas convectoras</strong> (el
                "aleteado" detrás del panel): no están para irradiar más, están para agrandar la
                superficie en contacto con el aire y acelerar esa corriente. Cuanto mejor circula
                el aire alrededor del radiador, más rinde.
            </p>

            <div className="callout callout-info">
                <div className="callout-label">La clave</div>
                <p>
                    Un radiador rinde por el aire que hace circular. Todo lo que corta esa
                    circulación —un mueble pegado, una tapa decorativa cerrada, una cortina que
                    lo envuelve— le baja la potencia real por debajo de la que dice el catálogo.
                </p>
            </div>

            <h2>Por qué el mejor lugar es bajo la ventana</h2>
            <p>
                La ventana es el punto más frío del ambiente: el vidrio pierde calor y el aire
                que lo toca se enfría y cae al piso formando una "cascada" de aire frío. Poner el
                radiador justo debajo es la mejor jugada, porque su corriente de aire caliente
                sube contra esa cascada y la frena en el mismo lugar donde nace. Se arma una
                especie de cortina de aire tibio pegada al vidrio que sella la zona fría antes de
                que se derrame por la habitación. Por eso, salvo excepción, el radiador va bajo la
                ventana.
            </p>

            <h2>Por qué la cortina larga lo arruina</h2>
            <p>
                Cuando la cortina baja hasta el piso y cuelga por delante del radiador, el
                radiador queda encerrado en un pasillo angosto entre la tela y el vidrio frío. El
                aire caliente que sube ya no sale a la habitación: sube por ese pasillo, pegado al
                vidrio, le entrega el calor al vidrio —que es justo lo que pierde hacia afuera— y
                termina calentando la calle en vez de la pieza. Encima, la tela por delante tapa
                la cara del radiador y frena la convección hacia el ambiente.
            </p>

            <div className="callout callout-warning">
                <div className="callout-label">El efecto real</div>
                <p>
                    Un radiador bien dimensionado, con una cortina gruesa hasta el piso por
                    delante, puede perder una parte importante de su rendimiento. El instalador
                    hizo todo bien y el cliente siente que "el radiador no calienta". El problema
                    no está en la calefacción: está en el cortinado.
                </p>
            </div>

            <h2>La solución</h2>

            <h3>1. Cortinas que no tapen el radiador (la primera opción)</h3>
            <p>
                Lo ideal es que la cortina no cuelgue por delante del radiador. Dos caminos que
                funcionan:
            </p>
            <ul>
                <li>
                    <strong>Cortina que llegue hasta el alféizar</strong>, no hasta el piso: cae
                    por encima del radiador y lo deja libre para que largue el aire a la pieza.
                </li>
                <li>
                    <strong>Cortina tipo blackout</strong> (o roller/estor por dentro del vano):
                    corta la pérdida por el vidrio sin envolver el radiador. El blackout suma
                    aislación en la ventana —que es donde más se pierde— sin robarle rendimiento
                    al emisor.
                </li>
            </ul>

            <h3>2. Si la cortina larga es innegociable: repisa o deflector</h3>
            <p>
                Cuando el cliente quiere sí o sí la cortina hasta el piso, una repisa o un
                deflector sobre el radiador ayuda a desviar el aire caliente hacia adentro de la
                habitación antes de que suba pegado al vidrio. No es tan bueno como liberar el
                radiador, pero recupera parte de lo que se perdería.
            </p>

            <h3>3. Reubicar a la otra pared fría</h3>
            <p>
                Si nada de lo anterior es posible, conviene mover el radiador a la otra ubicación
                más fría del ambiente (otra pared exterior, otro paño). Se resigna el efecto de
                cortar la caída de aire frío del vidrio, pero es preferible a dejar el radiador
                trabajando contra una cortina que le come el rendimiento.
            </p>

            <h3>4. Convección forzada con un cooler (recurso para casos extremos)</h3>
            <p>
                Antes de llegar al ventilador hay que agotar lo que da más potencia de verdad. Si
                el radiador quedó justo, el orden es: primero <strong>sumar elementos</strong>
                mientras haya largo de pared; si no entran más, <strong>pasar a un modelo más
                alto</strong> —un elemento de 600 o 700 mm entrega más kcal/h en el mismo frente
                que uno de 500—. Recién cuando no hay lugar para más elementos ni se puede subir de
                altura, entra el cooler.
            </p>
            <p>
                En ese caso extremo, un ventilador chico (un cooler de PC) debajo del radiador
                fuerza la circulación: mete aire por abajo y empuja el caliente hacia la pieza, así
                saca más potencia del mismo cuerpo. Es la salida cuando el espacio no da para un
                radiador más grande y tampoco se puede reubicar.
            </p>

            <div className="callout callout-tip">
                <div className="callout-label">Ojo con el cooler</div>
                <p>
                    Es la última carta, para el caso extremo sin espacio —no un criterio de diseño
                    ni un reemplazo de calcular bien—. Suma ruido, consumo eléctrico y un
                    componente más que mantener. Si podés resolverlo con más elementos o con un
                    modelo de 600/700 mm, esa es siempre la mejor solución.
                </p>
            </div>

            <div className="callout callout-tip">
                <div className="callout-label">Regla de obra</div>
                <p>
                    La ubicación del radiador no se cierra sin saber qué cortinas van y cómo se
                    amuebla la pieza. El mejor lugar térmico —bajo la ventana— solo sirve si el
                    aire puede circular. Preguntá por las cortinas antes de fijar la posición: es
                    parte del trabajo, no un detalle de decoración.
                </p>
            </div>
        </div>
    )
}
