// Error: Se eligió el emisor equivocado para el ambiente (radiador vs piso radiante)
// Tier: free

export const errorEmisorMalElegido = {
    id: 'emisor-mal-elegido',
    titulo: 'La casa no calienta y el cálculo estaba bien',
    categoria: 'Dimensionamiento',
    tier: 'free' as const,
    preview: 'Cuando el cálculo da bien pero el ambiente no conforta, el problema no es la potencia: es el emisor.',
    resumen: 'Radiador y piso radiante no son intercambiables. El radiador calienta por convección y el aire caliente sube: en techos altos calefacciona el volumen que queda arriba de la gente. El piso calienta por radiación pero tiene inercia de horas: en una casa de fin de semana llegás el sábado y rinde el domingo. La potencia puede estar perfecta y el ambiente igual no confortar.',
}

export function ErrorEmisorMalElegidoDetalle() {
    return (
        <div className="prose">
            <h2>El problema</h2>
            <p>
                El cálculo de potencia dio bien. Los radiadores cubren las kcal/h del ambiente.
                La caldera está bien dimensionada. Y el cliente igual llama en julio diciendo
                que <strong>no calienta</strong>.
            </p>
            <p>
                Cuando la potencia está y el confort no, no hay que revisar el cálculo:
                hay que revisar <strong>qué emisor se eligió</strong>. Radiador y piso radiante
                entregan el calor de maneras distintas, y esa diferencia decide en qué
                ambientes funciona cada uno. Es una decisión que ninguna planilla toma por vos.
            </p>

            <h2>Cómo entrega el calor cada uno</h2>
            <p>
                El <strong>radiador</strong> trabaja principalmente por <strong>convección</strong>:
                calienta el aire que lo toca, ese aire se vuelve más liviano y sube. El aire frío
                ocupa su lugar abajo y se genera una circulación. El ambiente se calefacciona
                moviendo aire caliente.
            </p>
            <p>
                El <strong>piso radiante</strong> trabaja principalmente por
                {' '}<strong>radiación</strong>: la superficie del piso emite calor que viaja
                directo a los cuerpos y objetos que "ve", sin necesidad de calentar el aire
                intermedio. Es el mismo principio del sol o de una estufa a leña: te da el calor
                aunque el aire esté fresco.
            </p>

            <h2>Techo alto: el radiador manda el calor arriba</h2>
            <p>
                Como el radiador calienta moviendo aire, y el aire caliente sube, en un ambiente
                alto se forma un <strong>colchón de aire caliente contra el techo</strong>. Eso
                se llama estratificación: abajo, donde está la gente, sigue haciendo frío;
                arriba, donde no hay nadie, hace calor.
            </p>
            <p>
                Arriba de los <strong>3 metros</strong> de techo el radiador deja de ser el
                emisor adecuado. Y lo importante: <strong>no se arregla con más potencia</strong>.
                Cuantos más elementos le colgás, más calor le estás mandando al techo. El
                instalador que responde a la queja agregando elementos empeora el problema
                y encarece la obra.
            </p>
            <div className="callout callout-warning">
                <div className="callout-label">La trampa</div>
                <p>
                    Ambientes de doble altura, lofts, galpones reciclados, living con entrepiso.
                    El cálculo volumétrico te da las kcal/h correctas —el volumen es el volumen—
                    pero esas kcal/h entregadas por convección terminan arriba. La cuenta está
                    bien y el ambiente no conforta.
                </p>
            </div>
            <p>
                En techos altos va <strong>piso radiante</strong>: como transfiere por radiación,
                entrega el calor a la altura donde está la gente. La altura del techo no lo
                afecta.
            </p>

            <h2>Uso intermitente: el piso tiene inercia</h2>
            <p>
                El piso radiante calienta una masa: la carpeta, el contrapiso, el solado. Esa
                masa tarda <strong>horas</strong> en llegar a régimen, y otras tantas en
                entregar el calor que acumuló. Esa inercia es una virtud en una casa habitada
                todos los días —el sistema se estabiliza y trabaja parejo, sin picos— y es un
                problema serio cuando el uso es intermitente.
            </p>
            <p>
                En una <strong>casa de fin de semana</strong>, llegás el sábado a la tarde,
                prendés, y el piso empieza a rendir el domingo cuando ya te estás yendo. Y
                encima seguís pagando el calor que quedó acumulado en el contrapiso después
                de que cerraste la casa.
            </p>
            <p>
                Ahí va <strong>radiador</strong>: tiene poca masa de agua, arranca rápido y
                corta rápido. Es exactamente lo que necesita un uso discontinuo.
            </p>

            <h2>Otros criterios que decide el instalador</h2>
            <p>
                No todo lo que define el emisor está en el plano. Lo que hay que preguntar
                en el relevamiento:
            </p>
            <ul>
                <li>
                    <strong>¿Quién vive acá?</strong> Con personas mayores conviene piso
                    radiante y temperatura de diseño más alta: pasan más tiempo quietas,
                    sienten más el frío y el piso no genera corrientes de aire ni tiene
                    superficies calientes contra las que golpearse.
                </li>
                <li>
                    <strong>¿Cómo se usa la casa?</strong> Uso diario, intermitente o de
                    temporada. Define inercia.
                </li>
                <li>
                    <strong>¿Qué altura tienen los ambientes?</strong> Y no el promedio de la
                    casa: hay que mirarlos uno por uno. Un living de doble altura al lado de
                    dormitorios normales puede necesitar dos criterios distintos en la misma
                    obra.
                </li>
                <li>
                    <strong>¿Hay mascotas o chicos en el piso?</strong> El piso radiante juega
                    a favor.
                </li>
            </ul>

            <div className="callout callout-tip">
                <div className="callout-label">El criterio de fondo</div>
                <p>
                    La potencia te dice <em>cuánto</em> calor hace falta. El emisor decide
                    {' '}<em>dónde y cuándo</em> llega ese calor. Un cálculo perfecto con el
                    emisor equivocado da un ambiente que no conforta, y el cliente no te va a
                    reclamar por las kcal/h: te va a decir que no calienta.
                </p>
            </div>

            <h2>Cómo se resuelve</h2>
            <ol>
                <li>
                    <strong>Antes de calcular, definí el emisor por ambiente.</strong> No al
                    revés. Altura, uso y quién lo habita se preguntan en el relevamiento.
                </li>
                <li>
                    <strong>Ambientes de más de 3 m → piso radiante.</strong> Sin discusión y
                    sin intentar compensar con elementos.
                </li>
                <li>
                    <strong>Uso de fin de semana o de temporada → radiadores.</strong> La
                    inercia del piso juega en contra.
                </li>
                <li>
                    <strong>Mixto solo si hace falta de verdad.</strong> Combinar radiadores y
                    piso en la misma casa implica dos circuitos hidráulicos con temperaturas
                    distintas y válvula mezcladora: encarece bastante la obra. Se justifica
                    cuando los ambientes piden criterios distintos, no por gusto.
                </li>
            </ol>
        </div>
    )
}
