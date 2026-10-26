import { DiagramaElementosAluminio } from './diagrams/DiagramaElementosAluminio'
import { DiagramaRadiador } from './diagrams/DiagramaRadiador'

export function Cap5Radiadores() {
    return (
        <div className="prose">
            <h1>Capítulo 5 — Selección y dimensionamiento de radiadores</h1>

            <p>
                En el capítulo anterior calculamos cuánta potencia necesita cada ambiente. Ahora viene
                la parte que más le interesa al instalador: traducir ese número en un radiador real que
                entra en el espacio disponible y calefacciona de verdad.
            </p>

            <h2>Los tipos de radiadores que se usan en Argentina</h2>

            <div className="callout callout-info">
                <strong>Nota de mercado:</strong> Los catálogos internacionales muestran muchas
                variantes: paneles de acero, tubos de acero, convectores. En Argentina, la vivienda se
                resuelve con tres: el radiador de <strong>aluminio por elementos</strong>, el de{' '}
                <strong>fundición</strong> y el <strong>toallero</strong>. El panel de acero se sigue
                usando en otros países, pero hace tiempo que no llega al mercado argentino.
            </div>

            <h3>Aluminio por elementos</h3>

            <p>
                Es el radiador más difundido en Argentina. Liviano, económico y de{' '}
                <strong>baja inercia térmica</strong>: toma temperatura rápido y también se enfría
                rápido cuando la caldera corta. Se arma sumando <strong>elementos</strong>: cada elemento es una unidad
                independiente que se une al siguiente con niples de acero, con una junta en el medio.
                A más elementos, más potencia.
            </p>

            <DiagramaElementosAluminio />

            <p>
                Se fabrica en alturas de 500, 600 y 700 mm. El <strong>estándar es el de 500 mm</strong>.
                Los elementos, como cualquier repuesto de calefacción, se consiguen en casas
                especializadas de calefacción y en algunas casas de sanitarios grandes.
            </p>

            <h3>Fundición</h3>

            <p>
                Se elige por su <strong>mayor inercia térmica</strong> y su{' '}
                <strong>larga vida útil</strong>. En Argentina no se fabrica nuevo: lo que se consigue
                son radiadores reciclados y recuperados.
            </p>

            <h3>Toalleros</h3>

            <p>
                Son <strong>siempre de agua</strong>: van conectados a la instalación de calefacción
                como un emisor más. Su potencia normalmente no alcanza para cubrir la demanda del baño,
                y con los toallones colgados encima pierden la convección. En esos casos el baño se
                refuerza con un radiador.
            </p>

            <h2>Cuántos elementos lleva un ambiente</h2>

            <p>
                La <strong>potencia por elemento</strong> con la que trabaja Criterio Térmico, la misma
                que usa el Simulador:
            </p>

            <table>
                <thead>
                    <tr>
                        <th>Altura nominal</th>
                        <th>Potencia por elemento</th>
                        <th>Equivalente en Watts</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>500 mm (estándar)</strong></td>
                        <td><strong>200 Kcal/h</strong></td>
                        <td><strong>≈ 233 W</strong></td>
                    </tr>
                    <tr>
                        <td>600 mm</td>
                        <td>240 Kcal/h</td>
                        <td>≈ 279 W</td>
                    </tr>
                    <tr>
                        <td>700 mm</td>
                        <td>280 Kcal/h</td>
                        <td>≈ 326 W</td>
                    </tr>
                </tbody>
            </table>

            <p>La fórmula de dimensionamiento es directa:</p>

            <blockquote>
                <strong>Nº de elementos = Potencia requerida (Kcal/h) ÷ Potencia por elemento</strong>
            </blockquote>

            <p>
                El resultado siempre se redondea <strong>hacia arriba</strong>.
            </p>

            <div className="callout callout-info">
                <strong>Conversión Watts ↔ Kcal/h:</strong> Hay catálogos que publican la potencia en
                Watts y otros en Kcal/h. Si necesitás
                convertir: <strong>1 W = 0,86 Kcal/h</strong> y <strong>1 Kcal/h = 1,163 W</strong>.
            </div>

            <h2>Ejemplo paso a paso: el living del capítulo 4</h2>

            <p>
                Dato de partida: el living calculado en el capítulo 4 necesita <strong>4.219 Kcal/h</strong>.
                Es un ambiente de 25 m² y 2,70 m de altura, con pared exterior y dos ventanas medianas
                de vidrio simple.
            </p>

            <h3>Paso 1 — Cantidad de elementos</h3>

            <p>Con el elemento estándar de 500 mm, de <strong>200 Kcal/h</strong>:</p>
            <p>
                Cantidad de elementos = 4.219 ÷ 200 = 21,1 → <strong>22 elementos</strong>
            </p>

            <h3>Paso 2 — Distribución en el ambiente</h3>

            <p>
                Los radiadores van en la zona más fría del living, y ninguno pasa de 12 elementos: el
                total se reparte en varias baterías. Los 22 elementos pueden ir, por ejemplo, en{' '}
                <strong>dos radiadores de 11</strong>.
            </p>

            <h2>Dónde colocar los radiadores</h2>

            <h3>En la zona más fría del ambiente</h3>

            <p>
                El radiador se coloca en la <strong>zona más fría de la habitación</strong>, y esa
                zona es <strong>debajo de la ventana</strong>.
            </p>

            <p>
                No siempre se puede colocar ahí. Cuando no se puede, se busca la siguiente zona más
                fría: cualquier pared al exterior, empezando por la que da al <strong>sur</strong>.
            </p>

            <DiagramaRadiador />

            <h3>Distancias de instalación</h3>

            <table>
                <thead>
                    <tr>
                        <th>Referencia</th>
                        <th>Distancia</th>
                        <th>Por qué importa</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Del piso</td>
                        <td>12 cm</td>
                        <td>Entrada de aire frío desde el piso por convección natural</td>
                    </tr>
                    <tr>
                        <td>De la pared posterior</td>
                        <td>2,5 a 3 cm</td>
                        <td>Circulación de aire por detrás del radiador</td>
                    </tr>
                    <tr>
                        <td>Del alféizar / ventana por arriba</td>
                        <td>5 cm libres</td>
                        <td>Salida del aire caliente sin obstáculo</td>
                    </tr>
                </tbody>
            </table>

            <p>El radiador va <strong>nivelado</strong>.</p>

            <h3>Radiadores dentro de nichos</h3>

            <p>
                Todavía hay casas con el radiador metido en un nicho de la pared y tapado con una
                puerta de mimbre o similar. El aire entra por las rendijas de la puerta, pero entra
                poco: la convección se reduce y el radiador pierde <strong>mucha potencia</strong>. El nicho es un detalle de terminación de la
                arquitectura de la casa, que no tuvo en cuenta esa pérdida.
            </p>

            <h2>Errores frecuentes en obra</h2>

            <h3>1. Confundir W con Kcal/h en el catálogo</h3>

            <p>
                Hay catálogos que publican en Watts y otros en Kcal/h. Si mezclás unidades sin convertir, el cálculo
                queda completamente errado. Un radiador de 1.000 W = 860 Kcal/h, no 1.000 Kcal/h.
            </p>

            <h3>2. Un solo radiador grande en vez de varios</h3>

            <p>
                Ninguna batería pasa de <strong>12 elementos</strong>, y el tope es hidráulico: la bomba
                circuladora de la caldera no mueve baterías más grandes. Si un ambiente pide más, la
                potencia se reparte en varios radiadores, ubicados en la zona más fría.
            </p>

            <h3>3. Mezclar elementos de distintos fabricantes</h3>

            <p>
                Los niples de unión tienen medidas y pasos de rosca que no siempre son intercambiables
                entre marcas. Mezclar elementos de distintas marcas puede generar juntas que pierden
                agua, o que directamente no aprietan bien durante el llenado inicial. Usá siempre
                elementos del mismo fabricante dentro de cada radiador.
            </p>

            <div className="callout callout-tip">
                <strong>Resumen del capítulo:</strong>
                <ul>
                    <li>Aluminio por elementos: el estándar es el de 500 mm, con 200 Kcal/h por elemento.</li>
                    <li>La cantidad de elementos se redondea hacia arriba.</li>
                    <li>Ninguna batería pasa de 12 elementos.</li>
                    <li>Instalá en la zona más fría del ambiente, nivelado y respetando las distancias.</li>
                    <li>Nunca mezcles elementos de distintos fabricantes en el mismo radiador.</li>
                </ul>
            </div>
        </div>
    )
}
