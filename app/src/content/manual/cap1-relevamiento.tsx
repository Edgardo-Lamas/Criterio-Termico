import { DiagramaMedicionPlanta } from './diagrams/DiagramaMedicionPlanta'
import { FotoManual } from './diagrams/FotoManual'

export function Cap1Relevamiento() {
    return (
        <div className="prose">
            <p>
                El relevamiento técnico de la vivienda se hace normalmente sobre el plano: con un
                plano 2D claro hay información suficiente para dimensionar y presupuestar. Ir a la
                obra también suma: en el lugar se ajustan detalles que el plano no muestra.
            </p>
            <p>
                La visita es necesaria en estas situaciones:
            </p>
            <ul>
                <li><strong>No hay plano.</strong> Sin plano no hay de dónde sacar las medidas.</li>
                <li>
                    <strong>Vivienda antigua.</strong> Hay que ver por dónde se puede hacer el tendido
                    de la tubería, dónde se ubica la caldera y qué tipo de instalación entra.
                </li>
                <li>
                    <strong>Obra compleja, con muchos rubros.</strong> El recorrido de la tubería se
                    define en el lugar, con el arquitecto o con quien dirija la obra, junto a los
                    demás rubros.
                </li>
                <li>
                    <strong>Confirmar que las medidas del plano sean las declaradas.</strong> Eso va
                    después, con la obra ya vendida, calculada y presupuestada.
                </li>
            </ul>
            <p>
                Fuera de esos casos, el plano alcanza.
            </p>

            <h2>Qué define el proyecto</h2>
            <p>
                Antes de calcular una sola kcal/h, necesitás saber con qué estás trabajando.
                Una casa antigua de ladrillo macizo con patio interno tiene pérdidas térmicas
                completamente distintas a una casa nueva del mismo metraje, con muros aislados
                y DVH.
            </p>
            <p>
                Y la construcción es apenas uno de los factores a ponderar. También pesan el uso
                que se le va a dar a la vivienda, quiénes la van a habitar y qué hay adentro.
                Cada uno puede cambiar el cálculo y, además, el sistema que corresponde proponer.
                El porqué de cada uno se desarrolla en los capítulos que siguen.
            </p>

            <h2>Qué medir: las dimensiones que importan</h2>
            <p>
                Las medidas de cada ambiente son los datos con los que se calcula su carga
                térmica, que se desarrolla en el capítulo 4. Lo que necesitás:
            </p>

            <h3>Por ambiente</h3>
            <ul>
                <li><strong>Largo × ancho:</strong> superficie del piso</li>
                <li><strong>Altura:</strong> desde piso hasta cielorraso (no hasta la viga, hasta el cielorraso)</li>
                <li><strong>Pared exterior:</strong> si el ambiente tiene al menos una pared al exterior o a un espacio no calefaccionado</li>
                <li><strong>Ventanas:</strong> cuántas tiene y de qué tamaño</li>
                <li><strong>Aislación:</strong> cómo está construido (muros, aberturas y techo, que se ven más abajo)</li>
            </ul>

            <DiagramaMedicionPlanta />

            <h3>Orientación</h3>
            <p>
                Registrá la orientación de la vivienda y de cada ambiente (<strong>N, S, E, O</strong>):
                se tiene en cuenta para la casa y para ubicar los radiadores.
            </p>

            <h2>Qué observar: la envolvente de la vivienda</h2>
            <p>
                La envolvente es el conjunto de elementos que separan el espacio calefaccionado
                del exterior: muros, aberturas y techo. Cada componente tiene una resistencia
                térmica diferente, y juntos definen el nivel de aislación de cada ambiente.
                Durante el relevamiento, registrá:
            </p>

            <h3>Muros</h3>
            <p>
                El tipo de muro exterior: ladrillo macizo, ladrillo hueco revocado, muro con
                aislación o bloque de hormigón.
            </p>

            <FotoManual
                alt="Tipos de muros exteriores: ladrillo hueco, macizo y con aislación"
                caption="Identificar el tipo de muro es parte del relevamiento. De izquierda a derecha: ladrillo hueco revocado, ladrillo macizo y muro con aislación exterior."
            />

            <h3>Techos y entrepisos</h3>
            <p>
                Un techo mal aislado tiene pérdidas altas: el calor se pierde por arriba. Una losa
                sin aislación se enfría y pierde el calor por conducción.
            </p>
            <ul>
                <li><strong>Techo o losa sin aislación:</strong> pérdidas altas</li>
                <li><strong>Techo o losa con aislación:</strong> pérdidas bajas</li>
                <li><strong>Entrepiso con un ambiente calefaccionado arriba:</strong> sin pérdida por ese lado</li>
            </ul>

            <h3>Aberturas</h3>
            <p>
                Las ventanas y las puertas al exterior son puntos críticos de pérdida de calor.
                Registrá:
            </p>
            <ul>
                <li><strong>Vidrio:</strong> simple o DVH (doble vidriado hermético)</li>
                <li><strong>Marco:</strong> aluminio sin ruptura de puente térmico, PVC o madera</li>
            </ul>

            <FotoManual
                alt="Comparación entre vidrio simple y doble vidriado hermético (DVH)"
                caption="Vidrio simple (izquierda) y DVH (derecha)."
            />

            <h2>Qué detectar: patologías y condiciones especiales</h2>
            <p>
                El relevamiento técnico no es solo medir. Es leer la vivienda. Durante la visita,
                prestá atención a:
            </p>

            <h3>Humedad y condensación</h3>
            <FotoManual
                alt="Manchas de humedad y condensación en esquina de pared exterior"
                caption="Hongos y manchas en esquinas son señal de condensación superficial. Registrá estas condiciones durante el relevamiento y dejalas documentadas en el presupuesto."
            />
            <ul>
                <li>Hongos y manchas en esquinas → condensación superficial</li>
                <li>Sótanos o locales bajo nivel de vereda → condiciones de humedad permanente</li>
            </ul>

            <div className="callout callout-info">
                <div className="callout-label">Dato informativo</div>
                <p>
                    La condensación aparece en la superficie más fría del ambiente, que no
                    siempre es donde se genera el vapor: el vapor del baño o de la cocina puede
                    condensar en otro ambiente.
                </p>
            </div>

            <h3>Instalaciones existentes</h3>
            <ul>
                <li>¿Hay una caldera existente? ¿Gas natural o GLP?</li>
                <li>¿Hay tuberías embutidas? ¿En qué material? ¿Hay planos?</li>
                <li>¿La presión y el caudal de gas alcanzan para la potencia de la caldera? Se tienen que verificar.</li>
            </ul>

            <h3>Lo que pide el manual de instalación de la caldera</h3>
            <ul>
                <li>
                    <strong>Evacuación de gases:</strong> si la caldera reemplaza a un artefacto
                    existente, verificar que la evacuación que hay sea compatible con la caldera nueva.
                </li>
                <li>
                    <strong>Conexión eléctrica:</strong> tomacorriente accesible y con puesta a tierra,
                    sin extensiones ni triples.
                </li>
                <li>
                    <strong>Espacio libre alrededor</strong> para el mantenimiento. Lo necesitan las
                    calderas murales y las de pie; las de pie, más.
                </li>
            </ul>

            <h3>Condiciones de obra</h3>
            <ul>
                <li>Acceso para materiales: escalera, patio angosto</li>
                <li>Tipo de piso: si hay que abrir, ¿es un piso de valor (mosaico calcáreo, pinotea)?</li>
                <li>Posibilidad de pasar tuberías por cielorrasos vs embutidas</li>
                <li>Cercanía del tendido a las cañerías de agua fría</li>
            </ul>

            <div className="callout callout-info">
                <div className="callout-label">Dato informativo</div>
                <p>
                    La tubería de calefacción tendida junto a la de agua fría la calienta, y la
                    cañería de agua fría puede condensar en su superficie. Por eso los
                    fabricantes de tubería piden aislarlas.
                </p>
            </div>

            <h2>Checklist de relevamiento — mínimo profesional</h2>
            <p>
                Este listado no es exhaustivo, pero cubre lo que no puede faltar:
            </p>
            <ul>
                <li>Dimensiones de cada ambiente (largo, ancho, alto)</li>
                <li>Orientación de la vivienda y de cada ambiente</li>
                <li>Ambientes con pared exterior</li>
                <li>Tipo de muros exteriores</li>
                <li>Ventanas por ambiente: cantidad, tamaño y tipo de vidrio</li>
                <li>Condición del techo o entrepiso sobre cada ambiente</li>
                <li>Identificación de ambientes sobre espacios no calefaccionados (garaje, sótano)</li>
                <li>Gas: presión y caudal disponibles para la potencia de la caldera</li>
                <li>Lugar previsto para la caldera, con el espacio libre y la evacuación de gases que pide su manual</li>
                <li>Estado general: humedad, estado de revoque, condición de las aberturas</li>
                <li>Registro fotográfico de puntos críticos</li>
            </ul>

            <div className="callout callout-tip">
                <div className="callout-label">Buena práctica</div>
                <p>
                    Tomá una hoja de relevamiento impresa o una planilla en el celular.
                    Anotar en el momento evita confusiones.
                </p>
            </div>

            <h2>Errores más comunes en el relevamiento</h2>
            <ol>
                <li>
                    <strong>Calcular por m² de superficie.</strong> La carga térmica sale del volumen
                    del ambiente, y la cambian la pared exterior, las ventanas y la aislación.
                </li>
                <li>
                    <strong>Ignorar los espacios no calefaccionados adyacentes.</strong> Un ambiente
                    sobre un garaje pierde calor por el piso. Un ambiente junto a un patio interior
                    tiene una pared exterior que el plano no siempre distingue.
                </li>
                <li>
                    <strong>No verificar la disponibilidad de gas.</strong> Si la presión o el caudal
                    no alcanzan para la potencia requerida, el proyecto queda trunco.
                </li>
                <li>
                    <strong>Asumir que el cliente sabe qué materiales usaron.</strong> "Me parece que
                    el muro es de ladrillo" no es información para un cálculo. Si no podés verificarlo
                    visualmente, lo aclarás en el presupuesto como supuesto.
                </li>
            </ol>
        </div>
    )
}
