// Caso: Presión que sube sola por entrada de agua de red al circuito
// Tier: pro

export const errorPresionSubeAguaRed = {
    id: 'presion-sube-agua-red',
    titulo: 'La presión sube sola hasta la válvula de seguridad: agua de red que entra al circuito',
    categoria: 'Componentes hidráulicos',
    tier: 'pro' as const,
    preview: 'La presión del circuito sube sola —incluso con la caldera fría o apagada— hasta que acciona la válvula de sobrepresión. El vaso de expansión está bien y no hay reacción química: el agua está entrando desde la red.',
    resumen: 'Cuando la presión sube también en frío, el circuito está recibiendo agua de la red (3-4 bar) por alguna de sus dos puertas de entrada: la válvula de llenado que no cierra bien, o una comunicación interna entre el lado sanitario y el de calefacción. En calderas con intercambiador bitérmico —diseño encamisado, con el tubo del agua sanitaria dentro del tubo de calefacción— una pinchadura interna comunica los dos circuitos sin ninguna pérdida visible. Lo mismo puede ocurrir por juntas u o\'rings vencidos dentro del grupo hidráulico. Prueba de campo: cerrar la llave de paso de agua de red a la caldera; si la presión deja de subir, la entrada está confirmada.',
}

export function ErrorPresionSubeAguaRedDetalle() {
    return (
        <div className="prose">
            <h2>El problema</h2>
            <p>
                La presión del sistema sube sola hasta acercarse a los 3 bar, la
                válvula de seguridad descarga, y al rato la presión vuelve a subir.
                Se controla el vaso de expansión y está bien. No se agregó ningún
                aditivo al circuito. Y hay un detalle que descoloca: la presión
                sube <strong>aunque la caldera esté fría o apagada</strong>.
            </p>
            <p>
                Ese detalle es la pista principal. La expansión térmica solo puede
                subir la presión cuando el agua se calienta. Si la presión sube en
                frío, hay agua <em>entrando</em> al circuito desde afuera. Y la única
                fuente externa con presión suficiente es el <strong>agua de red</strong>,
                que llega a 3 o 4 bar contra el 1 a 1.5 bar del circuito de calefacción.
            </p>

            <h2>Primera distinción: ¿sube solo en caliente o también en frío?</h2>
            <ul>
                <li>
                    <strong>Sube solo en caliente</strong> y baja al enfriarse:
                    expansión térmica sin colchón — vaso de expansión descargado,
                    con la membrana pinchada, o subdimensionado.
                </li>
                <li>
                    <strong>Sube también en frío</strong>, con la caldera apagada:
                    está entrando agua de red al circuito. Es este caso.
                </li>
                <li>
                    <strong>Sube siempre y no baja ni cerrando la llave de paso</strong>,
                    con gas abundante en los purgadores: producción de gas por reacción
                    química (ver el caso del pasivador incompatible).
                </li>
            </ul>

            <h2>Las dos puertas de entrada del agua de red</h2>
            <p>
                En una caldera mural, el agua de red solo puede meterse al circuito
                de calefacción por dos caminos:
            </p>
            <ol>
                <li>
                    <strong>La válvula de llenado que no cierra bien.</strong> Es la
                    llave con la que se recarga el circuito. Si quedó entreabierta,
                    o si su asiento tiene sarro o el o&apos;ring está vencido, deja
                    pasar agua de red en forma continua. Es la causa más simple y
                    la primera a revisar: cerrarla a fondo y observar si la presión
                    se estabiliza.
                </li>
                <li>
                    <strong>Una comunicación interna entre el lado sanitario y el
                    de calefacción</strong>, dentro del intercambiador o del grupo
                    hidráulico. Es la causa silenciosa: no hay nada que gotee ni
                    ningún mando mal cerrado, y sin embargo la presión sube.
                </li>
            </ol>

            <h2>El intercambiador bitérmico: la fuga que no se ve</h2>
            <p>
                Muchas calderas murales compactas usan un <strong>intercambiador
                bitérmico</strong>: un solo intercambiador que resuelve calefacción
                y agua sanitaria juntas. Su diseño es <strong>encamisado</strong>
                (tubo dentro de tubo): el caño por donde circula el agua sanitaria
                de red va <em>adentro</em> del caño por donde circula el agua de
                calefacción. Así, el agua sanitaria se calienta a través de la pared
                del tubo interior, sin mezclarse con el agua del circuito.
            </p>
            <p>
                Esa pared es la única frontera entre los dos circuitos. Cuando se
                perfora —por corrosión, por fatiga del material o por el desgaste
                de años— los dos circuitos quedan comunicados, y como el lado
                sanitario trabaja a presión de red (3-4 bar) y el de calefacción
                a 1-1.5 bar, el agua pasa siempre en el mismo sentido: de la red
                hacia la calefacción.
            </p>
            <ul>
                <li>
                    La presión del circuito sube <strong>en frío y en caliente</strong>,
                    con la caldera prendida o apagada: la red empuja las 24 horas.
                </li>
                <li>
                    <strong>No hay ninguna pérdida visible</strong>: todo ocurre
                    adentro del intercambiador. Desde afuera la caldera se ve perfecta.
                </li>
                <li>
                    La válvula de seguridad descarga una y otra vez, porque el
                    circuito recibe agua en forma permanente.
                </li>
            </ul>

            <div className="callout callout-info">
                <div className="callout-label">Prueba de campo para confirmar el intercambiador</div>
                <p>
                    Cerrar la llave de paso de agua de red que alimenta la caldera
                    y observar el manómetro: si la presión deja de subir, la entrada
                    de agua de red está confirmada. Para afinar el diagnóstico, con
                    la llave de red cerrada abrir una canilla de agua caliente y
                    mirar el manómetro de calefacción: si la presión del circuito
                    <strong> baja</strong>, el agua de calefacción está escapando por
                    la perforación hacia el lado sanitario — intercambiador pinchado,
                    sin discusión. Si la presión no se mueve, el sospechoso vuelve
                    a ser la válvula de llenado.
                </p>
            </div>

            <h2>El grupo hidráulico: juntas y o&apos;rings internos</h2>
            <p>
                El otro punto donde el lado sanitario y el de calefacción conviven
                a milímetros es el <strong>grupo hidráulico</strong> de la caldera:
                el bloque donde se alojan la válvula de llenado, el presostato,
                la válvula desviadora y las conexiones de ambos circuitos. Adentro,
                la separación entre caminos de agua depende de juntas y o&apos;rings.
            </p>
            <p>
                Con los años, la temperatura y el sarro, esos sellos se endurecen,
                se achatan o se pinchan. Según dónde falle el sello, el resultado es:
            </p>
            <ul>
                <li>
                    <strong>Comunicación interna</strong> entre el lado de red y el
                    de calefacción: mismo síntoma que el bitérmico pinchado — la
                    presión sube también en frío, sin pérdida a la vista.
                </li>
                <li>
                    <strong>Pérdida visible dentro de la caldera</strong>: goteo o
                    transpiración en el cuerpo del grupo hidráulico, a veces solo
                    detectable con el frente abierto y una linterna, siguiendo los
                    rastros blancos de sarro que deja el agua al evaporarse.
                </li>
            </ul>

            <h2>La solución</h2>
            <ol>
                <li>
                    <strong>Válvula de llenado defectuosa:</strong> reemplazo de la
                    válvula o de su o&apos;ring/asiento. Repuesto económico.
                </li>
                <li>
                    <strong>Juntas u o&apos;rings del grupo hidráulico:</strong> kit
                    de juntas del fabricante para ese modelo de grupo. Trabajo fino
                    pero de costo bajo.
                </li>
                <li>
                    <strong>Intercambiador bitérmico perforado:</strong> el
                    intercambiador se reemplaza, no se repara. Es un repuesto caro
                    y de recambio laborioso: en calderas con muchos años encima,
                    cotejar el costo del repuesto más mano de obra contra el de un
                    equipo nuevo antes de decidir.
                </li>
                <li>
                    <strong>Después de la reparación:</strong> llevar el circuito a
                    su presión de trabajo en frío (1 a 1.5 bar) y verificar durante
                    algunos días que la presión se mantenga estable, en frío y en
                    caliente. Si la válvula de seguridad estuvo descargando
                    repetidamente, revisarla o reemplazarla.
                </li>
            </ol>

            <div className="callout callout-tip">
                <div className="callout-label">Criterio de campo</div>
                <p>
                    Ante una presión que sube sola, la primera pregunta es cuándo
                    sube: solo en caliente apunta al vaso de expansión; también en
                    frío apunta a agua de red entrando. Y la llave de paso de red
                    es la herramienta de diagnóstico más barata que existe: cerrarla
                    y mirar el manómetro separa el problema en dos mitades en cinco
                    minutos, sin abrir la caldera.
                </p>
            </div>
        </div>
    )
}
