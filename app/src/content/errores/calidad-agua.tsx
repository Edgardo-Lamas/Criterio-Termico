import type { ErrorMeta } from './index'
import { DiagramaCalidadAgua } from '../manual/diagrams/DiagramaCalidadAgua'

export const errorCalidadAgua: ErrorMeta = {
    id: 'calidad-agua',
    titulo: 'Agua dura y recargas: el sarro que destruye el intercambiador',
    categoria: 'Química del agua / Corrosión',
    tier: 'free',
    preview:
        'Un sistema de calefacción por radiadores necesita mantenimiento casi nulo — siempre que el circuito sea hermético. ' +
        'La trampa está en agregar agua cuando baja la presión sin buscar la causa: cada recarga aporta ' +
        'nuevas sales minerales y oxígeno disuelto que reinician el ciclo de sarro y corrosión desde cero.',
    resumen:
        'En un circuito bien cerrado, las sales precipitan en la primera temporada y el agua queda ' +
        'neutra (pH 7) y estable — sin nuevas reacciones. El problema empieza cuando se recarga agua ' +
        'de red sin reparar la pérdida: el sarro crece en el intercambiador, los lodos de magnetita ' +
        'se acumulan en los radiadores y la vida útil de la caldera se acorta drásticamente.',
}

export function ErrorCalidadAguaDetalle() {
    return (
        <div className="prose">

            <h2>La promesa de bajo mantenimiento</h2>
            <p>
                Una de las grandes ventajas de la calefacción por radiadores es su bajo mantenimiento.
                A diferencia del piso radiante o de los splits, un circuito de agua caliente bien
                instalado puede funcionar por décadas sin intervención. Pero esa ventaja tiene una
                condición fundamental: el circuito debe ser un sistema <strong>hermético y cerrado</strong>.
            </p>
            <p>
                Un circuito cerrado es aquel en el que el mismo volumen de agua circula año tras año
                sin renovarse. La caldera lo calienta, los radiadores lo enfrian, la bomba lo mueve
                y el vaso de expansión absorbe los cambios de volumen por temperatura. No entra agua
                nueva, no sale agua vieja.
            </p>

            <h2>Qué hay disuelto en el agua de red</h2>
            <p>
                El agua de red contiene sales minerales en solución. La composición varía según la
                zona, pero las más relevantes para la calefacción son:
            </p>
            <ul>
                <li>
                    <strong>Calcio (Ca²⁺) y magnesio (Mg²⁺):</strong> son la "dureza" del agua.
                    Las zonas con acuíferos calcáreos (gran parte de la llanura pampeana, Mendoza,
                    Córdoba) tienen agua muy dura. La costa atlántica suele tener agua más blanda.
                </li>
                <li>
                    <strong>Bicarbonato (HCO₃⁻):</strong> es la fracción de dureza "temporal".
                    Con el calor, el bicarbonato de calcio se descompone en sarro (carbonato de calcio,
                    CaCO₃), que es insoluble y precipita.
                </li>
                <li>
                    <strong>Oxígeno disuelto (O₂):</strong> es el principal agente de corrosión.
                    El acero de la caldera, los caños de hierro negro y las conexiones de fundición
                    se oxidan en presencia de O₂ y agua.
                </li>
                <li>
                    <strong>Cloruros (Cl⁻) y sulfatos (SO₄²⁻):</strong> en concentraciones normales
                    de agua de red no son críticos, pero en sistemas con aluminio (radiadores de
                    aluminio o cabezales) los cloruros pueden acelerar la corrosión puntual.
                </li>
            </ul>

            <h2>Lo que pasa en la primera temporada: el ciclo de precipitación</h2>
            <p>
                Cuando se carga el sistema por primera vez, entra toda esa agua con sus sales.
                En la primera temporada de funcionamiento, el calor desencadena la reacción:
            </p>
            <div className="callout callout-info">
                <div className="callout-label">Reacción de precipitación del sarro</div>
                <p>
                    <strong>Ca²⁺ + 2 HCO₃⁻ → CaCO₃↓ + CO₂↑ + H₂O</strong>
                </p>
                <p>
                    El carbonato de calcio (CaCO₃) precipita como sarro sólido sobre las superficies
                    más calientes del sistema, principalmente el intercambiador de la caldera.
                    El dióxido de carbono (CO₂) liberado sube como burbuja y es expulsado por los
                    purgadores automáticos de aire.
                </p>
            </div>
            <p>
                El proceso es autolimitado: una vez que todo el calcio y bicarbonato precipitaron,
                ya no hay más sales en solución. El agua queda "muerta" químicamente. No puede
                formar más sarro porque no hay más materia prima para hacerlo.
            </p>
            <p>
                Lo mismo ocurre con el oxígeno disuelto: reacciona con el hierro y el acero
                formando una capa delgada de magnetita (Fe₃O₄) que actúa como pasivación
                natural — protege el metal subyacente de seguir oxidándose.
                Una vez consumido el O₂ inicial, sin renovación de agua, no hay más fuente de
                oxígeno en el circuito.
            </p>

            <h2>El estado estable: pH 7, agua neutra</h2>
            <p>
                Al final de la primera temporada, en un circuito bien cerrado, el agua alcanza
                un estado de equilibrio:
            </p>
            <ul>
                <li>
                    <strong>pH entre 7 y 8 (neutro a levemente básico):</strong> en el campo se dice
                    que el pH queda en "cero" o "neutro", queriendo decir ni ácido ni alcalino.
                    Es importante aclarar que esto significa pH 7 — la escala de pH va de 0 a 14,
                    donde 7 es el punto neutro. Un pH literal de 0 sería un ácido fuerte; eso
                    no ocurre en el circuito.
                </li>
                <li>
                    <strong>Dureza prácticamente nula:</strong> todas las sales de calcio y magnesio
                    precipitaron. No hay más solutos en concentración significativa.
                </li>
                <li>
                    <strong>Sin oxígeno activo:</strong> el O₂ fue consumido en las primeras
                    semanas. La capa de magnetita formada protege los metales.
                </li>
            </ul>
            <p>
                Este estado es óptimo. El agua ya no ataca los metales ni forma nuevos depósitos.
                El sistema puede funcionar décadas sin necesidad de tratamiento químico adicional.
            </p>

            <DiagramaCalidadAgua />

            <h2>El problema: las recargas de agua nueva</h2>
            <p>
                La presión de trabajo del circuito es entre 1 y 1,5 bar en frío. Si baja de 0,8 bar,
                la caldera puede entrar en falla. Cuando esto sucede, la reacción habitual del
                instalador o del propietario es abrir la llave de relleno y agregar agua hasta
                recuperar la presión.
            </p>
            <p>
                El error no está en agregar agua — a veces es necesario. El error está en
                <strong> no buscar la causa de la pérdida</strong>. Si la presión baja, es porque
                el agua salió en algún punto: una unión que gotea, una válvula que suda, la válvula
                de seguridad que abre por sobrepresión, el vaso de expansión que perdió su
                precarga de nitrógeno. Agregar agua sin reparar la pérdida no soluciona nada —
                y agrava el daño interno.
            </p>

            <h3>Lo que entra con cada recarga</h3>
            <p>
                Cada litro de agua de red que entra al circuito trae consigo:
            </p>
            <ul>
                <li>
                    <strong>Más calcio y bicarbonatos:</strong> que precipitan en las superficies
                    calientes. El sarro en el intercambiador se acumula capa sobre capa.
                    Una capa de sarro de apenas 1 mm reduce la transferencia de calor un 10-15%.
                    Con 3 mm, la caldera ya trabaja notablemente más para entregar la misma
                    temperatura.
                </li>
                <li>
                    <strong>Más oxígeno disuelto:</strong> que rompe la capa de pasivación formada
                    en la primera temporada y retoma la oxidación del hierro y el acero.
                    El resultado son lodos negros de magnetita (Fe₃O₄) que se acumulan en los
                    puntos bajos del sistema y en los radiadores, reduciendo el caudal.
                </li>
                <li>
                    <strong>En sistemas mixtos cobre-aluminio:</strong> el agua con oxígeno disuelve
                    iones de cobre (Cu²⁺) de los caños de cobre o conexiones de bronce. Esos iones
                    viajan con el fluido y se depositan galvánicamente sobre las superficies de
                    aluminio (radiadores de aluminio). El par galvánico cobre-aluminio acelera
                    la corrosión del aluminio de manera muy agresiva — los poros y perforaciones
                    en los cuerpos del radiador pueden aparecer en pocos años.
                </li>
            </ul>

            <div className="callout callout-warning">
                <div className="callout-label">Ciclo acumulativo</div>
                <p>
                    El sarro en el intercambiador reduce la transmisión de calor → la caldera
                    trabaja más tiempo para alcanzar la temperatura → el agua en el intercambiador
                    llega a mayor temperatura → precipita más carbonato → el sarro crece más rápido.
                    Es un ciclo que se retroalimenta y se acelera con cada recarga.
                </p>
            </div>

            <h2>Cómo reconocer un sistema con recargas frecuentes</h2>
            <p>
                Estos son los indicadores que deben encender una alarma:
            </p>
            <ul>
                <li>
                    <strong>La presión baja periódicamente:</strong> una vez por semana, una vez
                    por mes, antes o después de cada temporada. Si la presión no se mantiene sola,
                    hay una pérdida real que buscar.
                </li>
                <li>
                    <strong>La válvula de seguridad gotea o expulsa agua:</strong> puede estar
                    abriéndose por sobrepresión al calentar, porque el vaso de expansión perdió
                    su precarga. El agua que sale por la válvula se repone después, creando
                    un ciclo de recarga crónica.
                </li>
                <li>
                    <strong>Agua oscura o marrón al purgar radiadores:</strong> los lodos de
                    magnetita (Fe₃O₄) en suspensión tiñen el agua de un color marrón oscuro
                    o negro. En un sistema sano, el agua debe ser transparente o levemente
                    amarillenta después de años.
                </li>
                <li>
                    <strong>Ruido de "hervido" en la caldera (kettling):</strong> el sarro actúa
                    como aislante térmico. El agua en contacto con el sarro se recalienta
                    localmente y produce ese sonido característico de vapor o burbujeo.
                    En Argentina se describe como "la caldera que hace ruido".
                </li>
                <li>
                    <strong>Radiadores que se enfrían con el tiempo aunque la caldera funcione:</strong>
                    los lodos se depositan y reducen el diámetro interno del circuito,
                    limitando el caudal.
                </li>
            </ul>

            <h2>La regla de oro</h2>
            <div className="callout callout-error">
                <div className="callout-label">Nunca recargar sin causa</div>
                <p>
                    Si la presión baja, el problema es una pérdida. Buscarla y repararla es la
                    única solución. Agregar agua tapa el síntoma pero agrava el daño interno.
                    Un sistema en buen estado no pierde presión: si pierde, tiene una pérdida.
                </p>
            </div>

            <h2>Cuando no hay otra opción: agua tratada</h2>
            <p>
                Si por alguna razón es necesario recargar el sistema (obra nueva, reparación
                importante, purga programada), lo correcto es usar agua de menor agresividad:
            </p>
            <ul>
                <li>
                    <strong>Agua osmótica o desmineralizada:</strong> no tiene sales que precipiten
                    como sarro. Es la mejor opción. Se consigue en ferreterías o se puede usar
                    agua de destilador doméstico.
                </li>
                <li>
                    <strong>Agua ablandada (pasada por resina de intercambio catiónico):</strong>
                    elimina la dureza (calcio y magnesio) aunque deja otros iones.
                    Mejor que el agua de red, pero no tan buena como la osmótica.
                </li>
                <li>
                    <strong>Inhibidor de corrosión:</strong> si se recarga con agua de red,
                    agregar un inhibidor de corrosión (como los productos Fernox o similares
                    disponibles en el mercado argentino) ayuda a proteger los metales del O₂
                    que entra con el agua nueva.
                </li>
            </ul>
            <div className="callout callout-warning">
                <div className="callout-label">Agua destilada pura sin inhibidor</div>
                <p>
                    El agua perfectamente desmineralizada no tiene sales — pero tampoco tiene
                    la alcalinidad natural que protege los metales. En contacto con hierro y
                    cobre, el agua destilada pura puede ser agresiva. Siempre agregar un
                    inhibidor de corrosión cuando se usa agua tratada.
                </p>
            </div>

            <h2>Criterio profesional</h2>
            <div className="callout callout-tip">
                <div className="callout-label">Puntos clave para el instalador</div>
                <ul>
                    <li>
                        <strong>En las primeras semanas de instalación nueva:</strong> purgar el
                        sistema varias veces para eliminar el CO₂ liberado por la primera
                        precipitación de carbonatos. Los purgadores automáticos lo hacen solos,
                        pero conviene revisar.
                    </li>
                    <li>
                        <strong>Verificar el vaso de expansión al inicio de cada temporada:</strong>
                        un vaso sin precarga es la causa más común de caída de presión y recargas
                        innecesarias. La precarga debe estar entre 0,5 y 0,8 bar (según la altura
                        del circuito) con el sistema frío y sin presión de agua.
                    </li>
                    <li>
                        <strong>Si el cliente dice que carga agua "de vez en cuando":</strong>
                        hay una pérdida que no encontraron. Inspeccionar todas las uniones,
                        válvulas y conexiones. El sistema no pierde presión por sí solo.
                    </li>
                    <li>
                        <strong>Diagnóstico rápido del agua:</strong> una tira reactiva de pH
                        y dureza (se consiguen en acuarística o piscinas) permite verificar el
                        estado del agua del circuito. pH entre 7 y 8 y dureza baja es el
                        estado ideal.
                    </li>
                </ul>
            </div>

        </div>
    )
}
