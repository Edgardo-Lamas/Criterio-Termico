// Caso: Prueba hidráulica en dos etapas — verificación y protección del instalador
// Tier: pro

import { DiagramaCircuitoCruzado } from '../manual/diagrams/DiagramaCircuitoCruzado'
import { DiagramaPruebaHidraulica } from '../manual/diagrams/DiagramaPruebaHidraulica'

export const errorPruebaHidraulica = {
    id: 'prueba-hidraulica',
    titulo: 'Circuito cruzado y prueba hidráulica mal ejecutada',
    categoria: 'Verificación y puesta en marcha',
    tier: 'pro' as const,
    preview: 'Un radiador queda permanentemente frío aunque el sistema funcione. La causa: ida y retorno invertidos en ese ramal durante el tendido de tuberías.',
    resumen: 'El circuito cruzado es uno de los errores más difíciles de detectar a posteriori. La prueba hidráulica en dos etapas — primero un solo circuito, luego ambos a presión — permite detectarlo antes de instalar los artefactos y protege legalmente al instalador ante daños producidos por otros oficios durante la obra.',
}

export function ErrorPruebaHidraulicaDetalle() {
    return (
        <div className="prose">
            <h2>El problema</h2>
            <p>
                Un radiador permanece completamente frío mientras el resto de la instalación
                funciona con normalidad. El diagnóstico descarta desbalance hidráulico
                (la temperatura de la tubería de impulsión es correcta en ese ramal),
                descarta aire (el purgador no libera nada) y descarta válvula cerrada
                (está completamente abierta). Sin embargo, el emisor no calienta.
            </p>
            <p>
                En la mayoría de estos casos el origen está en el tendido de tuberías:
                la línea de impulsión y la de retorno fueron invertidas en ese ramal,
                produciendo un <strong>circuito cruzado</strong>.
            </p>

            <h2>Por qué ocurre y cómo se detecta tarde</h2>
            <p>
                Durante el tendido de tuberías en obra, especialmente cuando los circuitos
                discurren por zonas de difícil acceso, entre paredes, bajo losas o en
                cielorrasos, es relativamente frecuente que en algún punto la línea de
                impulsión y la de retorno se intercambien. Visualmente las tuberías
                son idénticas; el error no es evidente hasta que el sistema funciona.
            </p>
            <p>
                En un circuito cruzado, el agua entra al radiador por el lado del retorno
                y sale por el lado de la impulsión. Como ambos lados están conectados a
                la misma presión de su respectivo colector, no existe la diferencia de
                presión necesaria para que haya circulación. El resultado es un radiador
                frío con tuberías aparentemente correctas.
            </p>

            <DiagramaCircuitoCruzado />

            <div className="callout callout-info">
                <div className="callout-label">Diagnóstico en campo</div>
                <p>
                    Para confirmar un circuito cruzado: cerrar todos los detentes excepto
                    el del radiador sospechoso. Si al abrir solo ese ramal el sistema
                    no circula (la bomba no genera diferencial de temperatura entre
                    impulsión y retorno), el circuito está cruzado. Confirmación definitiva:
                    invertir las conexiones en el colector de ese ramal — el radiador
                    debe comenzar a calentar de inmediato.
                </p>
            </div>

            <h2>La solución: prueba hidráulica en dos etapas</h2>
            <p>
                La forma de detectar y corregir un circuito cruzado <strong>antes de
                instalar los artefactos</strong> — cuando el acceso a las tuberías
                todavía es relativamente sencillo — es mediante una prueba hidráulica
                realizada en dos etapas bien diferenciadas.
            </p>

            <DiagramaPruebaHidraulica />

            <h3>Etapa 1 — Verificación de circuitos (un solo colector)</h3>
            <p>
                Una vez terminado el tendido de tuberías y antes de conectar el bypass
                que une los dos colectores, se conecta la presión <strong>solamente
                al circuito de impulsión</strong>, dejando el circuito de retorno
                taponeado en el colector.
            </p>
            <p>
                Con solo la impulsión presurizada, cada boca del colector corresponde
                a un ramal. Es posible verificar una a una que el agua sale por el
                extremo correcto de cada ramal (el lado de impulsión de cada radiador)
                y no por el lado de retorno. Si en algún ramal el agua sale por el
                extremo equivocado, el circuito está cruzado y se corrige en ese
                momento, con la instalación todavía accesible.
            </p>

            <div className="callout callout-tip">
                <div className="callout-label">Por qué esta etapa es crítica</div>
                <p>
                    Detectar un circuito cruzado antes de colocar los radiadores
                    implica corregir un caño en la distribución. Detectarlo después
                    puede implicar abrir paredes, levantar pisos o desmontar
                    revestimientos — con el costo y el conflicto con el cliente
                    que eso genera.
                </p>
            </div>

            <h3>Etapa 2 — Prueba de hermeticidad a 6 bar (24 horas)</h3>
            <p>
                Verificados los circuitos, se conecta el bypass que une impulsión
                y retorno. Antes de pressurizar, es imprescindible
                <strong> purgar completamente el aire</strong> del sistema: el aire
                comprimido es peligroso y además genera lecturas de presión falsas.
                Se purga por los purgadores de cada ramal hasta que solo salga agua.
            </p>
            <p>
                Con el sistema purgado, se lleva la presión a <strong>6 bar</strong>
                con una bomba de prueba manual (también llamada bomba hidrostática).
                Se registra la lectura y se deja reposar durante <strong>24 horas</strong>.
                Si la presión no varía, el sistema es estanco. Cualquier caída
                indica una pérdida que debe localizarse y repararse antes de continuar.
            </p>

            <div className="callout callout-info">
                <div className="callout-label">Presiones de prueba según material</div>
                <p>
                    El estándar general para instalaciones hidrónicas residenciales
                    es 1.5 veces la presión máxima de trabajo. Para sistemas con
                    presión de trabajo de 3–4 bar, la prueba a 6 bar es el valor
                    habitual. Para tuberías de polipropileno o multicapa, verificar
                    siempre las especificaciones del fabricante: algunos sistemas
                    tienen presión máxima de prueba inferior.
                </p>
            </div>

            <h3>Etapa 3 — Mantenimiento a 3 bar hasta fin de obra</h3>
            <p>
                Confirmada la estanqueidad a 6 bar, se reduce la presión a
                <strong> 3 bar</strong> y se deja el sistema presurizado con
                agua hasta la entrega final. Un manómetro debe quedar instalado
                en el cuadro de conexión de la caldera, en un lugar visible para
                el instalador y para los otros oficios que trabajan en la obra.
            </p>
            <p>
                Esta precaución cumple dos funciones fundamentales:
            </p>
            <ul>
                <li>
                    <strong>Protección del sistema:</strong> si durante la obra algún
                    otro gremio daña accidentalmente una tubería (golpe, perforación,
                    doblez), la pérdida de presión es inmediatamente detectable. El
                    instalador puede actuar antes de que el daño genere una inundación
                    o quede oculto bajo revestimientos.
                </li>
                <li>
                    <strong>Protección legal del instalador:</strong> si al momento
                    de la colocación de los radiadores la presión está en 3 bar,
                    queda demostrado que el circuito fue entregado en perfectas
                    condiciones. Cualquier daño posterior no puede imputársele.
                    El manómetro funciona como testigo silencioso de la integridad
                    del sistema durante toda la obra.
                </li>
            </ul>

            <div className="callout callout-warning">
                <div className="callout-label">Acta de prueba hidráulica</div>
                <p>
                    Es recomendable documentar la prueba con un acta simple que incluya:
                    fecha, presión de prueba, duración, resultado y firma del instalador.
                    En obras con dirección técnica o inspección, presentar el acta junto
                    con una foto del manómetro en la lectura de prueba. Esta documentación
                    puede ser determinante en caso de reclamos posteriores.
                </p>
            </div>

            <h2>Equipo necesario para la prueba</h2>
            <ul>
                <li>
                    <strong>Bomba de prueba hidrostática manual:</strong> bomba de palanca
                    con manómetro incorporado y salida estándar de 1/2" o 3/4". Permite
                    alcanzar 6 bar de forma controlada sin riesgo de sobrepresión brusca.
                </li>
                <li>
                    <strong>Manómetro calibrado:</strong> rango 0–10 bar, precisión de
                    0.2 bar. El manómetro integrado en la bomba de prueba suele ser
                    suficiente para la etapa de verificación; el manómetro que queda
                    instalado en el cuadro debe tener escala legible a distancia.
                </li>
                <li>
                    <strong>Tapones y caps roscados:</strong> para sellar las bocas
                    del circuito de retorno durante la etapa 1 de verificación.
                </li>
                <li>
                    <strong>Registro de prueba:</strong> formulario simple con fecha,
                    lectura inicial, lectura final y firma.
                </li>
            </ul>

            <h2>Verificación final a temperatura de trabajo</h2>
            <p>
                La prueba hidráulica en frío verifica estanqueidad mecánica, pero
                no simula las condiciones reales de operación. Una vez colocados
                todos los artefactos y antes de la entrega definitiva, se debe
                realizar una prueba en caliente: poner en marcha la caldera,
                llevar el sistema a temperatura de trabajo (70–80°C para sistemas
                convencionales) y verificar todas las uniones con el sistema
                circulando durante al menos 2 horas.
            </p>
            <p>
                Algunas pérdidas solo aparecen cuando el metal se dilata con el
                calor — especialmente en uniones con sellado insuficiente o en
                roscas con filetes en mal estado. La verificación en caliente
                es la prueba definitiva antes de dar por entregada la instalación.
            </p>

            <div className="callout callout-tip">
                <div className="callout-label">Criterio profesional</div>
                <p>
                    Un instalador que puede mostrarle al cliente un acta de prueba
                    hidráulica, un manómetro estable a 3 bar y un registro de la
                    verificación en caliente está en una posición completamente
                    diferente a quien entrega sin documentación. Ante cualquier
                    reclamo posterior, esa documentación define quién es responsable
                    de qué. Es la diferencia entre un profesional y un changarín.
                </p>
            </div>
        </div>
    )
}
