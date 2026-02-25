import { DiagramaMedicionPlanta } from './diagrams/DiagramaMedicionPlanta'
import { DiagramaOrientacion } from './diagrams/DiagramaOrientacion'
import { FotoManual } from './diagrams/FotoManual'

export function Cap1Relevamiento() {
    return (
        <div className="prose">
            <p>
                El relevamiento es el acto técnico más subestimado en la instalación de calefacción.
                Un presupuesto mal calculado —o peor, calculado sin ver la vivienda— lleva a
                sistemas subdimensionados, sobredimensionados o directamente mal diseñados.
                Esta guía establece el <strong>criterio mínimo</strong> para hacer un relevamiento profesional.
            </p>

            <h2>Por qué el relevamiento define el proyecto</h2>
            <p>
                Antes de calcular una sola kcal/h, necesitás saber con qué estás trabajando.
                Una vivienda antigua de ladrillo macizo en una planta baja con patio interno
                tiene pérdidas térmicas completamente distintas a un departamento del mismo
                metraje en un octavo piso con cerramiento de DVH.
            </p>
            <p>
                El relevamiento correcto te permite:
            </p>
            <ul>
                <li>Calcular pérdidas térmicas reales (no estimadas por superficie)</li>
                <li>Dimensionar la caldera con criterio, no con margen exagerado</li>
                <li>Proponer radiadores en la ubicación correcta</li>
                <li>Detectar patologías existentes antes de presupuestar</li>
                <li>Evitar imprevistos costosos en la etapa de obra</li>
            </ul>

            <div className="callout callout-warning">
                <div className="callout-label">Atención</div>
                <p>
                    Un relevamiento por fotos o planos sin visita presencial no es un relevamiento:
                    es una estimación. Para instalaciones nuevas o reconversiones, la visita es
                    no negociable.
                </p>
            </div>

            <h2>Qué medir: las dimensiones que importan</h2>
            <p>
                Medís los ambientes, pero no para calcular m² de radiador "por regla de pulgar".
                Las dimensiones son insumo para el cálculo de pérdidas térmicas. Lo que necesitás:
            </p>

            <h3>Por ambiente</h3>
            <ul>
                <li><strong>Largo × ancho:</strong> superficie del piso</li>
                <li><strong>Altura:</strong> desde piso hasta cielorraso (no hasta la viga, hasta el cielorraso)</li>
                <li><strong>Superficie de paredes exteriores:</strong> las que dan al exterior o a espacios no calefaccionados</li>
                <li><strong>Superficie de aberturas:</strong> ventanas y puertas exteriores por separado</li>
            </ul>

            <DiagramaMedicionPlanta />

            <h3>Orientación</h3>
            <p>
                Registrá qué paredes son <strong>N, S, E, O</strong>. La orientación afecta la ganancia solar
                y en consecuencia la demanda neta de calefacción. Una habitación con gran paño vidriado al norte
                en Buenos Aires tiene una ganancia solar significativa que un cálculo simplista ignora.
            </p>

            <DiagramaOrientacion />

            <div className="callout callout-tip">
                <div className="callout-label">Consejo de obra</div>
                <p>
                    Llevá una brújula o usá la de tu celular. En obras en construcción o demolición,
                    los planos de arquitectura a veces están sin orientación. Verificar en el lugar
                    tarda 10 segundos y evita un error de diseño grave.
                </p>
            </div>

            <h2>Qué observar: el envelope de la vivienda</h2>
            <p>
                El "envelope" es el conjunto de elementos que separan el espacio calefaccionado
                del exterior. Cada componente tiene una resistencia térmica diferente. Durante el
                relevamiento, registrá:
            </p>

            <h3>Paredes</h3>
            <table>
                <thead>
                    <tr>
                        <th>Tipo de muro</th>
                        <th>Espesor típico</th>
                        <th>Transmitancia U aprox.</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Ladrillo macizo visto (sin revocar)</td>
                        <td>30 cm</td>
                        <td>~1.8 W/m²K</td>
                    </tr>
                    <tr>
                        <td>Ladrillo hueco revocado</td>
                        <td>20 cm</td>
                        <td>~1.2 W/m²K</td>
                    </tr>
                    <tr>
                        <td>Cerámica con aislación (sandwich)</td>
                        <td>25–30 cm</td>
                        <td>~0.5–0.7 W/m²K</td>
                    </tr>
                    <tr>
                        <td>Bloque hormigón sin aislación</td>
                        <td>20 cm</td>
                        <td>~2.0 W/m²K</td>
                    </tr>
                </tbody>
            </table>

            <FotoManual
                src="/Criterio-Termico/images/manual/cap1/tipo-de-muro.jpg"
                alt="Tipos de muros exteriores: ladrillo hueco, macizo y con aislación"
                caption="Identificar el tipo de muro es fundamental para el cálculo. De izquierda a derecha: ladrillo hueco revocado (U≈1.2), ladrillo macizo (U≈1.8) y muro con aislación exterior (U<0.6)."
            />

            <h3>Techos y entrepisos</h3>
            <ul>
                <li><strong>Losa expuesta sin aislación:</strong> pérdida muy alta — factor crítico en PB y último piso</li>
                <li><strong>Techo con cámara de aire:</strong> mejora, pero insuficiente sin aislación</li>
                <li><strong>Losa con membrana + aislación:</strong> el correcto para mínimas pérdidas</li>
                <li><strong>Entrepiso con departamento calefaccionado arriba:</strong> sin pérdida significativa</li>
            </ul>

            <h3>Aberturas</h3>
            <p>
                Las ventanas son el punto de mayor pérdida por unidad de superficie en la mayoría
                de las viviendas antiguas.
            </p>
            <ul>
                <li><strong>Vidrio simple (monolítico):</strong> U ≈ 5.8 W/m²K — muy mala aislación</li>
                <li><strong>DVH (doble vidriado hermético):</strong> U ≈ 2.8–3.0 W/m²K</li>
                <li><strong>DVH con gas argón o bajo emisivo:</strong> U ≈ 1.2–1.8 W/m²K</li>
                <li><strong>Marco:</strong> aluminio sin ruptura de puente térmico vs PVC o madera</li>
            </ul>

            <FotoManual
                src="/Criterio-Termico/images/manual/cap1/comparacion-vidrios.jpg"
                alt="Comparación entre vidrio simple y doble vidriado hermético (DVH)"
                caption="Vidrio simple (izquierda) vs DVH (derecha). La diferencia de transmitancia es de casi el doble: el vidrio simple pierde aproximadamente 5.7 W/m²·K contra 2.8–3.2 W/m²·K del DVH estándar."
            />

            <div className="callout callout-info">
                <div className="callout-label">Criterio práctico</div>
                <p>
                    En edificios con vidrio simple, la superficie de ventanas puede representar
                    el 40–60% de las pérdidas totales del ambiente. El impacto de reemplazar
                    vidrio simple por DVH en el cálculo de potencia es tan grande que conviene
                    presentarlo al cliente como dato: "si cambiás las ventanas, la caldera puede
                    ser 20–30% más chica."
                </p>
            </div>

            <h2>Qué detectar: patologías y condiciones especiales</h2>
            <p>
                El relevamiento técnico no es solo medir. Es leer la vivienda. Durante la visita,
                prestá atención a:
            </p>

            <h3>Humedad y condensación</h3>
            <FotoManual
                alt="Manchas de humedad y condensación en esquina de pared exterior"
                caption="Hongos y manchas en esquinas son señal de condensación superficial por mala aislación. Registrá estas condiciones durante el relevamiento: afectan el cálculo y deben quedar documentadas en el presupuesto."
            />
            <ul>
                <li>Manchas de humedad en paredes o cielorrasos → riesgo de corrosión en tuberías</li>
                <li>Hongos en esquinas → condensación superficial → mala aislación</li>
                <li>Sótanos o locales bajo nivel de vereda → condiciones de humedad permanente</li>
            </ul>

            <h3>Instalaciones existentes</h3>
            <ul>
                <li>¿Hay una caldera existente? ¿Gas natural o GLP?</li>
                <li>¿Hay tuberías embutidas? ¿En qué material? ¿Hay planos?</li>
                <li>¿Existe instalación eléctrica adecuada para la sala de calderas?</li>
                <li>¿La chimenea o tiraje es compartida? ¿Tiene libre salida?</li>
            </ul>

            <h3>Condiciones de obra</h3>
            <ul>
                <li>Acceso para materiales: escalera, ascensor, patio angosto</li>
                <li>Tipo de piso: si hay que abrir, ¿es un piso de valor (mosaico calcáreo, pinotea)?</li>
                <li>Posibilidad de pasar tuberías por cielorrasos vs embutidas</li>
                <li>Proximidad del tendido a puntos de agua fría (condensación exterior en tuberías de impulsión)</li>
            </ul>

            <h2>Checklist de relevamiento — mínimo profesional</h2>
            <p>
                Este listado no es exhaustivo, pero cubre lo que no puede faltar:
            </p>
            <ul>
                <li>Dimensiones de cada ambiente (largo, ancho, alto)</li>
                <li>Orientación de cada pareja de paredes</li>
                <li>Tipo y espesor de muros exteriores</li>
                <li>Tipo y superficie de aberturas por ambiente</li>
                <li>Condición del techo o entrepiso sobre cada ambiente</li>
                <li>Identificación de ambientes sobre espacios no calefaccionados (garaje, sótano)</li>
                <li>Condición de la instalación de gas: caño, medidor, presión disponible</li>
                <li>Lugar previsto para sala de calderas y posibilidad de evacuación de gases</li>
                <li>Estado general: humedad, estado de revoque, condición de las aberturas</li>
                <li>Registro fotográfico de puntos críticos</li>
            </ul>

            <div className="callout callout-tip">
                <div className="callout-label">Buena práctica</div>
                <p>
                    Tomá una hoja de relevamiento impresa o una planilla en el celular.
                    Anotar en el momento evita confusiones y demuestra profesionalismo.
                    Un cliente que te ve trabajando con método confía más en tu presupuesto.
                </p>
            </div>

            <h2>Errores más comunes en el relevamiento</h2>
            <ol>
                <li>
                    <strong>Calcular por m² de superficie sin considerar el envelope.</strong> Dos ambientes
                    de 20 m² pueden tener pérdidas que difieren en un factor de 3 según su orientación,
                    tipo de muro y aberturas.
                </li>
                <li>
                    <strong>Ignorar los espacios no calefaccionados adyacentes.</strong> Un ambiente
                    sobre un garaje pierde calor por el piso. Un ambiente junto a un patio interior
                    tiene una pared exterior que el plano no siempre distingue.
                </li>
                <li>
                    <strong>No verificar la disponibilidad de gas.</strong> Proyectos de caldera a gas
                    que quedan truncos porque la presión de red no alcanza para la potencia requerida
                    son más comunes de lo que parece.
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
