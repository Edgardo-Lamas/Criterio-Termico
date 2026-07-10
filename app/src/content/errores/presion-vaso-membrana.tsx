// Caso: Caída de presión por membrana del vaso de expansión pinchada
// Tier: pro

export const errorPresionVasoMembrana = {
    id: 'presion-vaso-membrana',
    titulo: 'La presión cae y no aparece la pérdida: membrana del vaso de expansión pinchada',
    categoria: 'Componentes hidráulicos',
    tier: 'pro' as const,
    preview: 'La caldera pierde presión cada pocos días y hay que recargar seguido, pero no hay charcos, goteras ni manchas de humedad en ninguna parte. Se revisó todo el circuito y la pérdida no aparece.',
    resumen: 'Con el uso y el tiempo, la membrana que separa el agua del nitrógeno dentro del vaso de expansión se deteriora y se pincha. El agua del circuito pasa al compartimiento del gas y el vaso se inunda: esa agua que migró es una pérdida invisible que el manómetro registra pero que no moja nada. La señal que delata la falla es doble: la presión cae en frío sin fuga visible, y sube muy rápido apenas la caldera enciende y calienta, porque ya no hay colchón de gas que absorba la dilatación.',
}

export function ErrorPresionVasoMembranaDetalle() {
    return (
        <div className="prose">
            <h2>El problema</h2>
            <p>
                La caldera pierde presión y hay que recargar el circuito cada pocos
                días o semanas. Se revisan las uniones, los purgadores, las válvulas
                y los radiadores: no hay charcos, no hay goteras, no hay manchas de
                humedad. La pérdida no aparece por ningún lado, pero el manómetro
                sigue bajando.
            </p>
            <p>
                Cuando la pérdida de agua no se encuentra en el circuito, hay que
                mirar adentro de un componente que casi nunca se revisa por dentro:
                el <strong>vaso de expansión</strong>. Su membrana interna puede estar
                pinchada, y esa falla produce una <strong>pérdida invisible</strong>:
                el agua se va del circuito, pero no moja nada porque queda guardada
                dentro del propio vaso.
            </p>

            <h2>Cuánto pierde el sistema: la frecuencia de recarga como medida</h2>
            <p>
                Antes de buscar dónde está la pérdida, conviene medir cuán grande es.
                El dato ya lo tiene el usuario aunque no lo sepa: <strong>cada cuánto
                hay que recargar la presión</strong>. Esa periodicidad es un indicador
                directo del caudal que se está perdiendo:
            </p>
            <ul>
                <li>
                    <strong>Recarga cada 2 o 3 días:</strong> pérdida importante.
                    Hay un volumen de agua considerable saliendo del circuito y el
                    problema hay que resolverlo ya — cada recarga mete agua nueva
                    con oxígeno que corroe el sistema por dentro.
                </li>
                <li>
                    <strong>Recarga cada algunas semanas:</strong> pérdida moderada.
                    Da margen para diagnosticar con calma, pero no para ignorarla.
                </li>
                <li>
                    <strong>Recarga cada varios meses:</strong> pérdida muy pequeña,
                    del orden de gotas por día. Puede ser un purgador que apenas
                    rezuma, una junta que transpira o una fisura mínima. Molesta
                    poco, pero conviene ubicarla antes de que crezca.
                </li>
            </ul>
            <p>
                Preguntar "¿cada cuánto le cargás agua?" es la primera pregunta del
                diagnóstico: dice el tamaño de la pérdida antes de tocar nada, y
                permite decidir si se busca una fuga franca o una filtración mínima.
            </p>

            <h2>Cómo funciona el vaso de expansión</h2>
            <p>
                El vaso de expansión es un recipiente metálico dividido en dos
                compartimientos por una <strong>membrana elástica</strong> (de goma
                EPDM o butilo):
            </p>
            <ul>
                <li>
                    De un lado está el <strong>agua del circuito</strong>, conectada
                    directamente a la instalación.
                </li>
                <li>
                    Del otro lado hay <strong>gas a presión</strong> (nitrógeno o aire),
                    cargado de fábrica a una precarga de aproximadamente 1 bar. Ese
                    gas se controla y recarga por una válvula tipo Schrader, igual
                    a la de un neumático.
                </li>
            </ul>
            <p>
                El agua es prácticamente incompresible: cuando la caldera calienta,
                el agua del circuito se dilata (alrededor de un 4% entre 10°C y 90°C)
                y ese volumen extra tiene que ir a algún lado. El vaso lo absorbe:
                el agua empuja la membrana, el gas del otro lado se comprime como
                un resorte, y la presión del sistema sube apenas unas décimas de bar.
                Cuando el agua se enfría, el gas empuja la membrana de vuelta y
                devuelve el agua al circuito. Ese colchón de gas es lo que mantiene
                la presión estable entre frío y caliente.
            </p>

            <h2>La falla: membrana pinchada, la pérdida invisible</h2>
            <p>
                La membrana es una pieza de goma que trabaja flexionándose miles de
                veces por año, en contacto con agua caliente. Con el uso y el tiempo
                el material se fatiga, se reseca, se agrieta y termina
                <strong> pinchándose</strong>. Cuando eso ocurre:
            </p>
            <ol>
                <li>
                    El agua del circuito pasa por el pinchazo hacia el compartimiento
                    del gas. Los dos lados quedan comunicados y el vaso se va
                    llenando de agua.
                </li>
                <li>
                    El gas de la precarga se pierde: se diluye en el agua y se escapa
                    de a poco por la válvula Schrader o junto con el agua. El colchón
                    elástico desaparece.
                </li>
                <li>
                    El agua que migró al lado del gas <strong>salió del circuito</strong>:
                    el manómetro registra esa falta como una caída de presión. Pero como
                    esa agua quedó encerrada dentro del vaso, no hay gotera, ni charco,
                    ni mancha. Es una pérdida real pero invisible desde afuera.
                </li>
            </ol>
            <p>
                El resultado es un sistema que pierde presión en frío sin fuga a la
                vista, y que además se queda sin capacidad de absorber la dilatación
                del agua cuando calienta.
            </p>

            <h2>La señal que delata la falla: la presión sube rápido al calentar</h2>
            <p>
                Con el vaso inundado ya no hay gas que haga de resorte. El agua que
                se dilata al calentar no tiene dónde ir, y como el agua no se comprime,
                la presión del sistema se dispara. La observación clave en campo:
            </p>
            <ul>
                <li>
                    Encender la caldera y mirar el manómetro mientras sube la temperatura.
                </li>
                <li>
                    Con el vaso sano, la presión sube despacio y apenas unas décimas
                    (por ejemplo, de 1.2 a 1.5 bar).
                </li>
                <li>
                    Con la membrana pinchada, la aguja <strong>trepa rápido</strong> y
                    en pocos minutos se acerca a los 3 bar. Ahí abre la válvula de
                    seguridad y descarga agua.
                </li>
            </ul>
            <p>
                Esa descarga cierra el círculo del problema: en caliente la válvula
                de seguridad expulsa agua (muchas veces hacia un desagüe, donde nadie
                la ve), y cuando el sistema se enfría falta esa agua y la presión
                queda baja. El usuario recarga, la caldera calienta, la válvula vuelve
                a descargar, y el ciclo se repite. Cada recarga además mete agua nueva
                con oxígeno y sales al circuito, lo que acelera la corrosión.
            </p>

            <div className="callout callout-info">
                <div className="callout-label">El cuadro completo de síntomas</div>
                <p>
                    Presión que cae en frío sin pérdida visible + presión que sube
                    rápido al calentar + válvula de seguridad que descarga = vaso de
                    expansión fuera de servicio. Si aparecen las tres señales juntas,
                    el diagnóstico está prácticamente cerrado antes de tocar una herramienta.
                </p>
            </div>

            <h2>El diagnóstico en campo: la prueba de la válvula Schrader</h2>
            <p>
                La confirmación es simple y no requiere desarmar nada. Con la caldera
                fría y el circuito despresurizado (o el vaso aislado del circuito,
                si tiene llave de corte):
            </p>
            <ol>
                <li>
                    Ubicar la válvula Schrader del vaso (en las calderas murales el
                    vaso está integrado atrás del equipo; la válvula suele quedar
                    accesible por debajo o por un lateral).
                </li>
                <li>
                    Apretar el pin central de la válvula con un destornillador fino,
                    igual que para desinflar un neumático.
                </li>
                <li>
                    <strong>Si sale agua</strong>: la membrana está pinchada. El agua
                    del circuito llegó al compartimiento del gas. No hay nada que
                    recargar ni regular: el vaso se reemplaza.
                </li>
                <li>
                    <strong>Si sale aire</strong>: la membrana está sana. Medir la
                    precarga con un manómetro de neumáticos: si está por debajo del
                    valor de placa (generalmente 0.8 a 1 bar), el vaso está descargado
                    y se recarga con un inflador.
                </li>
            </ol>
            <p>
                Una verificación complementaria: golpear suavemente el vaso con los
                nudillos. Un vaso sano suena hueco del lado del gas y mate del lado
                del agua. Un vaso inundado suena lleno y pesado en toda su superficie.
            </p>

            <div className="callout callout-warning">
                <div className="callout-label">Medir la precarga siempre con el circuito despresurizado</div>
                <p>
                    Si se mide la precarga con el circuito a presión, el manómetro
                    lee la presión del agua empujando la membrana, no la del gas.
                    La lectura engaña y puede hacer creer que el vaso está bien.
                    Para una medición real: caldera fría, circuito despresurizado
                    (llevar el manómetro del sistema a 0) y recién ahí medir en la Schrader.
                </p>
            </div>

            <h2>Membrana pinchada vs. vaso descargado: no es la misma falla</h2>
            <p>
                Los dos problemas producen síntomas parecidos (presión inestable,
                válvula de seguridad que descarga), pero la solución es distinta:
            </p>
            <ul>
                <li>
                    <strong>Vaso descargado, membrana sana:</strong> el gas se fue
                    perdiendo de a poco por la Schrader con los años, pero la membrana
                    está entera. Por la Schrader sale aire. Se soluciona recargando
                    con un inflador hasta la precarga de placa. Cuesta cero y lleva
                    diez minutos.
                </li>
                <li>
                    <strong>Membrana pinchada:</strong> por la Schrader sale agua.
                    Recargar no sirve de nada: el gas que se inyecta se escapa por el
                    pinchazo hacia el circuito (y aparece como burbujas en los
                    purgadores). La única solución es el reemplazo.
                </li>
            </ul>

            <h2>La otra pérdida invisible: la cañería empotrada</h2>
            <p>
                Si el vaso pasa la prueba de la Schrader y la válvula de seguridad
                está seca, queda un sospechoso más que tampoco deja charcos a la
                vista: la <strong>cañería empotrada</strong> en paredes, contrapisos
                o losas. Una fisura o una unión defectuosa enterrada pierde agua
                hacia el material que la rodea, y puede ser desde una filtración
                mínima hasta una fuga importante:
            </p>
            <ul>
                <li>
                    <strong>Pérdida pequeña:</strong> el mortero y el contrapiso
                    absorben el agua y la evaporan antes de que aparezca una mancha.
                    Puede pasar meses o años sin dar ninguna señal visible — solo
                    el manómetro que baja de a poco.
                </li>
                <li>
                    <strong>Pérdida importante:</strong> tarde o temprano aparecen
                    manchas de humedad en paredes o cielorrasos del piso de abajo,
                    zócalos hinchados, pisos que se levantan o baldosas tibias en
                    un sector puntual.
                </li>
            </ul>
            <p>
                Para confirmarla o descartarla:
            </p>
            <ol>
                <li>
                    <strong>Sectorizar el circuito:</strong> cerrar llaves de paso
                    por tramos (si la instalación las tiene) y observar en cuál
                    sector la presión se mantiene y en cuál cae.
                </li>
                <li>
                    <strong>Prueba hidráulica del tramo sospechoso:</strong> aislarlo,
                    presurizarlo y verificar si mantiene la presión en el tiempo,
                    con la caldera desconectada del tramo para no dañarla.
                </li>
                <li>
                    <strong>Cámara termográfica:</strong> con el circuito caliente,
                    el recorrido de la cañería empotrada se dibuja en la pared o el
                    piso; una zona con forma de mancha caliente fuera del trazado
                    delata el punto de fuga.
                </li>
            </ol>

            <h2>La solución</h2>
            <ol>
                <li>
                    <strong>Reemplazar el vaso.</strong> La membrana no se repara.
                    En calderas murales el vaso interno es un repuesto del fabricante;
                    si el repuesto no se consigue o el acceso es muy complicado, una
                    alternativa aceptada es anular el vaso interno e instalar un
                    <strong> vaso externo</strong> del mismo volumen o mayor en el
                    retorno, cerca de la caldera.
                </li>
                <li>
                    <strong>Verificar la precarga del vaso nuevo antes de instalarlo.</strong>
                    Viene cargado de fábrica, pero puede haber perdido gas en depósito.
                    Ajustarla al valor que pide el fabricante de la caldera con el
                    vaso todavía desconectado del agua.
                </li>
                <li>
                    <strong>Revisar la válvula de seguridad.</strong> Si estuvo
                    descargando repetidamente, el asiento puede haber quedado marcado
                    por el sarro y seguir goteando aun con el vaso nuevo. Ante la duda,
                    reemplazarla: es un componente de seguridad y de bajo costo.
                </li>
                <li>
                    <strong>Cargar el circuito a la presión de trabajo en frío</strong>
                    (1 a 1.5 bar según el equipo), encender la caldera y verificar el
                    comportamiento: con el vaso sano, la presión en caliente debe subir
                    de forma suave y quedar lejos de los 3 bar.
                </li>
            </ol>

            <div className="callout callout-tip">
                <div className="callout-label">Criterio de campo</div>
                <p>
                    Ante una caldera que pierde presión "sin pérdida", el orden de
                    búsqueda es: primero preguntar cada cuánto se recarga (mide el
                    tamaño de la fuga), después el circuito a la vista (uniones,
                    purgadores, radiadores), la válvula de seguridad (humedad o goteo
                    en su descarga), el vaso de expansión con la prueba de la Schrader,
                    y por último la cañería empotrada.
                    Treinta segundos con un destornillador evitan semanas de buscar
                    una gotera que no existe. Y en cada service anual de caldera,
                    controlar la precarga del vaso debería ser rutina: es la falla
                    silenciosa más común después de los 5 a 8 años de uso.
                </p>
            </div>
        </div>
    )
}
