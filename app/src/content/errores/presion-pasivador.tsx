// Caso: Aumento de presión por pasivador incompatible con aluminio
// Tier: pro

import { DiagramaPasivador } from '../manual/diagrams/DiagramaPasivador'

export const errorPresionPasivador = {
    id: 'presion-pasivador',
    titulo: 'Presión que sube sola: pasivador incompatible con aluminio',
    categoria: 'Química del agua / Corrosión',
    tier: 'pro' as const,
    preview: 'La presión del sistema sube progresivamente, acciona la válvula de seguridad y vuelve a subir. La caldera, el vaso de expansión y las purgas no explican el origen.',
    resumen: 'Ciertos pasivadores contienen compuestos alcalinos que reaccionan con el aluminio de los radiadores produciendo gas hidrógeno (H₂). A diferencia de la expansión térmica, el H₂ es un gas no condensable que se acumula en el sistema elevando la presión de forma continua hasta superar los límites de seguridad.',
}

export function ErrorPresionPasivadorDetalle() {
    return (
        <div className="prose">
            <h2>El problema</h2>
            <p>
                La presión del sistema comienza a subir sin causa aparente. La caldera
                funciona correctamente, la temperatura es normal, no hay pérdidas visibles.
                Sin embargo, el manómetro muestra valores que superan los 3 bar,
                la válvula de seguridad abre y expulsa agua, la presión cae momentáneamente
                y al poco tiempo vuelve a subir. El ciclo se repite.
            </p>
            <p>
                Si al purgar algún radiador se acerca un encendedor a la salida del purgador
                y se produce una pequeña llama, el diagnóstico queda confirmado: hay
                <strong> gas hidrógeno acumulado en el circuito</strong>.
            </p>

            <div className="callout callout-warning">
                <div className="callout-label">Prueba del encendedor — precaución</div>
                <p>
                    El hidrógeno (H₂) es inflamable en concentraciones del 4 al 75% en aire.
                    Al purgar, la cantidad que sale del purgador es mínima y la llama que
                    produce es pequeña. La prueba es útil como diagnóstico de campo, pero
                    debe hacerse con ventilación adecuada, lejos de llamas abiertas
                    o chispas, y solo para confirmar el origen —no como procedimiento rutinario.
                </p>
            </div>

            <h2>La causa: reacción química entre pasivador y aluminio</h2>

            <h3>La pasivación como proceso normal</h3>
            <p>
                Los radiadores de aluminio se protegen naturalmente de la corrosión
                a través de la pasivación: cuando el aluminio entra en contacto con
                el agua, se forma espontáneamente una capa fina y adherente de
                <strong> óxido de aluminio (Al₂O₃)</strong> en la superficie interior.
                Esa capa actúa como barrera protectora y detiene la corrosión futura.
            </p>
            <p>
                Muchos fabricantes de radiadores y empresas de servicio técnico recomiendan
                agregar un pasivador al circuito para acelerar y reforzar esa reacción
                inicial. La lógica es correcta: una capa de óxido bien formada desde
                el inicio prolonga la vida útil del radiador.
            </p>

            <h3>El problema: pasivadores alcalinos incompatibles</h3>
            <p>
                El problema surge cuando el pasivador elegido contiene compuestos
                altamente alcalinos —como hidróxido de sodio (NaOH), hidróxido de
                potasio (KOH) o silicatos alcalinos— que elevan el pH del agua
                del circuito por encima de 9.
            </p>
            <p>
                A ese pH, la reacción con el aluminio no forma simplemente la capa
                protectora: disuelve el óxido ya formado y ataca el aluminio puro
                subyacente en forma continua y agresiva:
            </p>

            <div className="callout callout-info">
                <div className="callout-label">Las reacciones en juego</div>
                <p>
                    Reacción básica de pasivación (neutra, deseada):<br />
                    <code>4Al + 3O₂ → 2Al₂O₃</code> (capa protectora — no genera gas)<br /><br />
                    Reacción con agua (lenta en pH neutro):<br />
                    <code>2Al + 3H₂O → Al₂O₃ + 3H₂↑</code><br /><br />
                    Reacción en medio alcalino (rápida y continua, la problemática):<br />
                    <code>2Al + 2NaOH + 2H₂O → 2NaAlO₂ + 3H₂↑</code><br /><br />
                    En todos los casos que involucran agua, se libera
                    <strong> hidrógeno gaseoso (H₂)</strong>. A mayor pH, más rápida
                    la reacción y mayor la producción de gas.
                </p>
            </div>

            <DiagramaPasivador />

            <h2>Por qué la presión sube de forma continua y exponencial</h2>
            <p>
                A diferencia de la expansión térmica normal —que sube cuando la
                caldera calienta y baja cuando el agua se enfría—, la presión
                por acumulación de H₂ <strong>no tiene correlación con la temperatura</strong>
                y no baja cuando el sistema se enfría. Esto es la clave del diagnóstico:
                si la presión sigue alta con el sistema frío, el origen no es térmico.
            </p>
            <p>
                El mecanismo es el siguiente:
            </p>
            <ol>
                <li>
                    El pasivador alcalino reacciona continuamente con el aluminio
                    mientras esté presente en el agua del circuito.
                </li>
                <li>
                    Cada reacción produce H₂, que es un gas no condensable:
                    no se disuelve en el agua a las presiones de trabajo del sistema.
                </li>
                <li>
                    El H₂ se acumula en los puntos altos del circuito (como haría
                    el aire), pero a diferencia del aire que se purga una sola vez,
                    el H₂ se regenera continuamente.
                </li>
                <li>
                    El gas acumulado ocupa volumen en el circuito, comprime el agua
                    y aumenta la presión de manera progresiva.
                </li>
                <li>
                    Cuando la presión supera los 3 bar, la válvula de seguridad abre
                    y expulsa agua (y algo de gas). La presión cae, pero la reacción
                    química continúa y la presión vuelve a subir. El ciclo se repite.
                </li>
            </ol>

            <h3>Por qué el vaso de expansión no puede compensarlo</h3>
            <p>
                El vaso de expansión de membrana cumple una función específica y limitada:
                absorber el <strong>aumento de volumen del agua líquida</strong> cuando
                se calienta (el agua se dilata aproximadamente un 4% entre 10°C y 90°C).
                Su volumen se calcula en función de esa expansión y del volumen total
                del sistema.
            </p>
            <p>
                Cuando hay producción continua de H₂:
            </p>
            <ul>
                <li>
                    El gas entra al circuito de agua y eventualmente llega al vaso de
                    expansión (que está conectado al circuito), ocupando espacio que
                    debería ser agua o membrana comprimida.
                </li>
                <li>
                    El gas no condensable <em>no puede ser absorbido</em> por la membrana
                    del vaso de la misma manera que el líquido: la membrana comprime
                    la cámara de gas del vaso, pero la presión sube de todos modos
                    porque hay más volumen de fluido entrando del que el vaso fue
                    dimensionado para recibir.
                </li>
                <li>
                    En términos simples: el vaso tiene un tamaño calculado para
                    compensar la expansión de X litros de agua. Si el sistema tiene
                    X litros de agua <em>más</em> Y litros de H₂ generados por la
                    reacción, el vaso es insuficiente aunque esté en perfectas condiciones.
                </li>
            </ul>

            <div className="callout callout-info">
                <div className="callout-label">Cómo distinguirlo de otros problemas de presión</div>
                <p>
                    Presión alta por expansión térmica: sube con la temperatura, baja cuando
                    el sistema se enfría. El manómetro en frío debe estar entre 1 y 1.5 bar.<br /><br />
                    Presión alta por H₂: <strong>no baja cuando el sistema está frío</strong>.
                    La válvula de seguridad abre repetidamente. Al purgar los radiadores sale gas
                    (burbujeo abundante) que se regenera. Prueba del encendedor positiva.
                </p>
            </div>

            <h2>El problema ocurre en cualquier sistema, nuevo o existente</h2>
            <p>
                Este fenómeno no es exclusivo de instalaciones nuevas. Puede ocurrir en
                cualquier momento en que se agregue un pasivador incompatible al circuito:
            </p>
            <ul>
                <li>
                    <strong>Instalaciones nuevas:</strong> la superficie de aluminio virgen
                    es la más reactiva. Al agregar el pasivador en la puesta en marcha,
                    la reacción puede ser inmediata y violenta.
                </li>
                <li>
                    <strong>Instalaciones existentes:</strong> al realizar un mantenimiento
                    o recambio de agua se agrega el pasivador y el aluminio reacciona
                    con la nueva formulación, aunque el sistema lleve años en servicio.
                </li>
            </ul>

            <h2>La solución</h2>
            <p>
                No existe corrección parcial. Una vez que el pasivador incompatible
                está en el circuito, la única solución es la eliminación completa:
            </p>
            <ol>
                <li>
                    <strong>Vaciar el sistema completamente</strong> por el punto
                    de vaciado más bajo, con la caldera fría.
                </li>
                <li>
                    <strong>Hacer circular agua limpia</strong> varias veces, vaciando
                    y rellenando hasta que el agua que sale esté clara y sin olor
                    químico. En casos severos puede ser necesario circular el doble
                    o triple del volumen del sistema.
                </li>
                <li>
                    <strong>Verificar el vaso de expansión:</strong> controlar la
                    presión de pre-carga (normalmente 1 bar). Si el vaso perdió
                    gas por la sobrepresión, recargarlo con nitrógeno o reemplazarlo.
                </li>
                <li>
                    <strong>Rellenar con agua nueva</strong> y opcionalmente un inhibidor
                    de corrosión certificado como compatible con aluminio y con
                    el pH especificado por el fabricante del radiador (generalmente 7–8.5).
                </li>
                <li>
                    <strong>Verificar la válvula de seguridad:</strong> si abrió
                    varias veces, puede haber perdido la calibración o estar dañada
                    en el asiento. Reemplazarla si hay duda.
                </li>
            </ol>

            <div className="callout callout-warning">
                <div className="callout-label">Cómo elegir el pasivador correcto</div>
                <p>
                    Verificar siempre que el producto esté certificado para sistemas
                    con <strong>aluminio</strong>. El pH de trabajo debe ser entre 7 y 8.5
                    para radiadores de aluminio. Evitar productos que no especifiquen
                    compatibilidad con aluminio o que indiquen pH superior a 9.
                    En sistemas mixtos (tuberías de cobre + radiadores de aluminio)
                    la elección del inhibidor es especialmente crítica: el par
                    galvánico Cu–Al exige inhibidores específicamente formulados
                    para ambos metales.
                </p>
            </div>

            <h2>Compatibilidad de metales: el caso del cobre con aluminio</h2>
            <p>
                Un aspecto adicional que agrava el problema: cuando el circuito
                tiene tuberías de cobre (o accesorios de latón) y radiadores de
                aluminio, existe una diferencia de potencial electroquímico entre
                ambos metales (<strong>par galvánico Cu–Al</strong>). El aluminio
                actúa como ánodo y el cobre como cátodo: el aluminio se corroe
                preferentemente.
            </p>
            <p>
                En esta combinación, incluso sin pasivador, la corrosión galvánica
                puede generar lodos negros (óxido de aluminio en suspensión)
                y pequeñas cantidades de H₂. El inhibidor correcto neutraliza
                esta reacción. El inhibidor incorrecto la acelera.
            </p>

            <div className="callout callout-tip">
                <div className="callout-label">Criterio de campo</div>
                <p>
                    Antes de agregar cualquier producto químico al circuito —pasivador,
                    anticongelante, inhibidor— leer la ficha técnica y verificar
                    expresamente la compatibilidad con el material de los radiadores.
                    Un pasivador barato o de origen desconocido puede destruir
                    el sistema en semanas. La complejidad de la reparación
                    (vaciar, limpiar, rellenar, verificar válvulas y vaso)
                    no justifica economizar en este punto.
                </p>
            </div>
        </div>
    )
}
