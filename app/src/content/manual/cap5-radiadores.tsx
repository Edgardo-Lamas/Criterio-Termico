import { DiagramaElementosAluminio } from './diagrams/DiagramaElementosAluminio'
import { DiagramaFactorDT } from './diagrams/DiagramaFactorDT'
import { DiagramaRadiador } from './diagrams/DiagramaRadiador'

export function Cap5Radiadores() {
    return (
        <div className="prose">
            <h1>Capítulo 5 — Selección y dimensionamiento de radiadores</h1>

            <p>
                En el capítulo anterior calculamos cuánta potencia necesita cada ambiente. Ahora viene
                la parte que más le interesa al instalador: traducir ese número en un radiador real que
                entra en el espacio disponible y calienta de verdad.
            </p>

            <h2>Los tipos de radiadores que se usan en Argentina</h2>

            <div className="callout callout-info">
                <strong>Nota de mercado:</strong> Los catálogos internacionales muestran fundición, tubos
                de acero, convectores y muchas variantes. En Argentina, la obra residencial se resuelve
                casi siempre con dos tipos: <strong>columna de aluminio</strong> o <strong>panel de acero</strong>.
                Todo lo demás es marginal o de aplicaciones especiales.
            </div>

            <h3>Columna de aluminio</h3>

            <p>
                Es el radiador más difundido en Argentina. Liviano, económico y de buena inercia
                térmica. Se arma sumando <strong>elementos</strong>: cada elemento es una unidad
                independiente que se une al siguiente con niples de bronce. A más elementos, más potencia.
            </p>

            <DiagramaElementosAluminio />

            <p>
                Las alturas comerciales más comunes son 500 mm, 600 mm, 700 mm y 800 mm. El de
                <strong> 600 mm es el estándar de obra</strong>: encaja bajo la mayoría de las ventanas,
                tiene buena relación potencia/precio y está disponible en todas las ferreterías
                industriales. Marcas habituales en el mercado: Calore, Vitro, Ferroli, Sime, Baxi.
                Los valores de potencia varían hasta un 5% entre fabricantes para la misma altura.
            </p>

            <h3>Panel de acero</h3>

            <p>
                Más compacto que el aluminio para igual potencia. Se fabrica en una sola pieza (no se
                pueden agregar elementos), y se selecciona por tamaño: alto × largo. Los paneles de
                acero se clasifican por tipo según la cantidad de placas y aletas:
            </p>

            <ul>
                <li><strong>Tipo 11:</strong> una placa de agua + una aleta. Perfil fino, menor potencia.</li>
                <li><strong>Tipo 21:</strong> dos placas de agua + una aleta. Potencia intermedia.</li>
                <li><strong>Tipo 22:</strong> dos placas de agua + dos aletas. El más potente y el más
                    usado cuando se elige panel. Marcas: Purmo, Henrad, Calorifer.</li>
            </ul>

            <div className="callout callout-tip">
                <strong>¿Cuándo usar panel de acero?</strong> Cuando el espacio libre bajo la ventana es
                reducido (menos de 15 cm de fondo disponible) o cuando el diseño del ambiente pide un
                perfil más delgado. La columna de aluminio sigue siendo la opción por defecto en obra
                residencial argentina.
            </div>

            <h2>El problema del ΔT: el dato que el catálogo no te dice</h2>

            <p>
                Todos los catálogos de radiadores declaran su potencia a <strong>ΔT50</strong>, según
                la norma europea EN 442. Si no entendés ese número, vas a calcular mal.
            </p>

            <p>
                <strong>ΔT es la diferencia entre la temperatura media del agua en el radiador y la
                temperatura del cuarto.</strong>
            </p>

            <p>Ejemplo con una instalación estándar (caldera a gas convencional):</p>

            <ul>
                <li>Temperatura de impulsión (entrada al radiador): 75°C</li>
                <li>Temperatura de retorno (salida): 65°C</li>
                <li>Temperatura media del agua: (75 + 65) ÷ 2 = <strong>70°C</strong></li>
                <li>Temperatura del cuarto: 20°C</li>
                <li>ΔT = 70 − 20 = <strong>50°C</strong> → coincide exactamente con el catálogo</li>
            </ul>

            <p>
                Hasta acá, todo bien. Pero muchas calderas a gas actuales trabajan a 70/60°C en vez
                de 75/65°C. Eso cambia el cálculo:
            </p>

            <ul>
                <li>Temperatura media del agua: (70 + 60) ÷ 2 = <strong>65°C</strong></li>
                <li>ΔT = 65 − 20 = <strong>45°C</strong></li>
                <li>→ El radiador entrega <strong>menos potencia</strong> que lo que dice el catálogo</li>
            </ul>

            <div className="callout callout-warning">
                <strong>El error más silencioso de la obra:</strong> usar los valores del catálogo sin
                verificar a qué temperatura trabaja la caldera. El radiador queda "justo" en papel,
                pero en el invierno frío el cuarto nunca llega a la temperatura de confort. El instalador
                no entiende por qué, el cliente se queja, y la causa está en 4 grados de diferencia en
                el ajuste de la caldera.
            </div>

            <DiagramaFactorDT />

            <h3>Tabla de factores de corrección</h3>

            <table>
                <thead>
                    <tr>
                        <th>ΔT</th>
                        <th>Factor</th>
                        <th>Condición típica</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>ΔT60</td>
                        <td>1,27</td>
                        <td>Caldera a leña o a gas, alta temperatura (80/70°C)</td>
                    </tr>
                    <tr>
                        <td>ΔT55</td>
                        <td>1,13</td>
                        <td>Instalaciones antiguas (77/65°C)</td>
                    </tr>
                    <tr>
                        <td><strong>ΔT50</strong></td>
                        <td><strong>1,00</strong></td>
                        <td><strong>Referencia catálogo EN 442 (75/65°C)</strong></td>
                    </tr>
                    <tr>
                        <td>ΔT45</td>
                        <td>0,87</td>
                        <td>Caldera a gas moderna (70/60°C) — típico Argentina</td>
                    </tr>
                    <tr>
                        <td>ΔT40</td>
                        <td>0,75</td>
                        <td>Caldera baja temperatura (65/55°C)</td>
                    </tr>
                    <tr>
                        <td>ΔT35</td>
                        <td>0,63</td>
                        <td>Sistemas pre-condensación (60/50°C)</td>
                    </tr>
                    <tr>
                        <td>ΔT30</td>
                        <td>0,51</td>
                        <td>Caldera de condensación (55/45°C)</td>
                    </tr>
                </tbody>
            </table>

            <div className="callout callout-tip">
                <strong>Regla práctica para Argentina:</strong>
                <br />
                — Caldera a gas convencional a <strong>75/65°C</strong> → usá los valores del catálogo
                sin ajustar (estás en ΔT50).
                <br />
                — Caldera a gas moderna a <strong>70/60°C</strong> → dividí la potencia requerida por
                0,87 para saber qué potencia catálogo necesitás. O equivalente: multiplicá la cantidad
                de elementos calculada por 1,15 y redondeá hacia arriba.
            </div>

            <h2>Cómo leer los catálogos</h2>

            <h3>Columna de aluminio</h3>

            <p>
                Los catálogos dan la <strong>potencia por elemento</strong> para cada altura nominal.
                Valores típicos de referencia (varían según fabricante):
            </p>

            <table>
                <thead>
                    <tr>
                        <th>Altura nominal</th>
                        <th>Potencia/elemento a ΔT50</th>
                        <th>Equivalente en Watts</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>500 mm</td>
                        <td>120 Kcal/h</td>
                        <td>≈ 140 W</td>
                    </tr>
                    <tr>
                        <td><strong>600 mm</strong></td>
                        <td><strong>150 Kcal/h</strong></td>
                        <td><strong>≈ 174 W</strong></td>
                    </tr>
                    <tr>
                        <td>700 mm</td>
                        <td>173 Kcal/h</td>
                        <td>≈ 201 W</td>
                    </tr>
                    <tr>
                        <td>800 mm</td>
                        <td>193 Kcal/h</td>
                        <td>≈ 224 W</td>
                    </tr>
                </tbody>
            </table>

            <p>La fórmula de dimensionamiento es directa:</p>

            <blockquote>
                <strong>Nº de elementos = Potencia requerida (Kcal/h) ÷ Potencia por elemento</strong>
            </blockquote>

            <p>
                El resultado siempre se redondea <strong>hacia arriba</strong>, y en obra se agrega
                un margen del 10% sobre la suma total del edificio para compensar pérdidas en las
                tuberías y variaciones entre lotes de elementos.
            </p>

            <h3>Panel de acero Tipo 22</h3>

            <p>
                Los catálogos dan la potencia total por combinación de altura × largo. Valores de
                referencia para panel Tipo 22 (Purmo o equivalente):
            </p>

            <table>
                <thead>
                    <tr>
                        <th>Largo</th>
                        <th>Alto 500 mm</th>
                        <th>Alto 600 mm</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>800 mm</td>
                        <td>892 Kcal/h</td>
                        <td>1.065 Kcal/h</td>
                    </tr>
                    <tr>
                        <td>1000 mm</td>
                        <td>1.115 Kcal/h</td>
                        <td>1.331 Kcal/h</td>
                    </tr>
                    <tr>
                        <td>1200 mm</td>
                        <td>1.338 Kcal/h</td>
                        <td>1.597 Kcal/h</td>
                    </tr>
                    <tr>
                        <td>1600 mm</td>
                        <td>1.784 Kcal/h</td>
                        <td>2.130 Kcal/h</td>
                    </tr>
                </tbody>
            </table>

            <div className="callout callout-info">
                <strong>Conversión Watts ↔ Kcal/h:</strong> Los catálogos europeos (Purmo, Roca, Buderus)
                publican en Watts. Los catálogos locales (Calore, Vitro) publican en Kcal/h. Si necesitás
                convertir: <strong>1 W = 0,86 Kcal/h</strong> y <strong>1 Kcal/h = 1,163 W</strong>.
            </div>

            <h2>Ejemplo paso a paso: el living del capítulo 4</h2>

            <p>
                Dato de partida: el living calculado en el capítulo 4 necesita <strong>4.219 Kcal/h</strong>.
                Es un ambiente de 30 m², orientación norte, con dos ventanas doble vidrio.
            </p>

            <h3>Paso 1 — Verificar las condiciones de la caldera</h3>

            <p>
                La caldera es a gas convencional de tiraje natural, ajustada a 75°C de impulsión y
                65°C de retorno.
            </p>
            <p>
                ΔT = (75 + 65) ÷ 2 − 20 = 70 − 20 = <strong>50°C</strong> → Factor = 1,00.
                No hace falta ajustar los valores del catálogo.
            </p>

            <h3>Paso 2 — Selección con columna de aluminio de 600 mm</h3>

            <p>Potencia por elemento a ΔT50: <strong>150 Kcal/h</strong></p>
            <p>
                Cantidad de elementos = 4.219 ÷ 150 = 28,1 → <strong>30 elementos</strong>
                (redondeamos con un margen del ~7%)
            </p>

            <h3>Paso 3 — Distribución en el ambiente</h3>

            <p>
                El living tiene dos paredes exteriores con ventanas. Lo correcto es poner un radiador
                bajo cada ventana para generar la cortina térmica. Con 30 elementos totales:
            </p>
            <ul>
                <li>Ventana principal (más grande): <strong>radiador de 17 elementos</strong></li>
                <li>Ventana lateral: <strong>radiador de 13 elementos</strong></li>
            </ul>

            <div className="callout callout-warning">
                <strong>Si la caldera trabajara a 70/60°C (ΔT45):</strong>
                <br />
                Potencia catálogo necesaria = 4.219 ÷ 0,87 = <strong>4.850 Kcal/h</strong>
                <br />
                Elementos = 4.850 ÷ 150 = 32,3 → <strong>34 elementos</strong>
                <br />
                La diferencia de 4 elementos más puede parecer menor, pero en la práctica es la
                diferencia entre un cuarto que llega a 21°C en el día más frío del año y uno que
                se queda en 18°C.
            </div>

            <h2>Dónde colocar los radiadores</h2>

            <h3>Bajo las ventanas: no es costumbre, es técnica</h3>

            <p>
                El aire frío que se filtra por la ventana o baja por la superficie fría del vidrio
                forma una "cortina fría" que desciende hasta el piso y se desplaza por el centro del
                cuarto creando sensación de corriente. Un radiador colocado justo debajo genera una
                cortina de aire caliente ascendente que intercepta ese flujo antes de que llegue a la
                zona donde está la gente.
            </p>

            <DiagramaRadiador />

            <p>
                En ambientes donde no hay ventanas en la pared exterior, o donde por razones de obra
                no se puede instalar bajo la ventana, el radiador va sobre la pared más fría del ambiente.
            </p>

            <h3>Distancias mínimas de instalación</h3>

            <table>
                <thead>
                    <tr>
                        <th>Referencia</th>
                        <th>Distancia mínima</th>
                        <th>Por qué importa</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Del piso</td>
                        <td>10 a 15 cm</td>
                        <td>Entrada de aire frío desde el piso por convección natural</td>
                    </tr>
                    <tr>
                        <td>De la pared posterior</td>
                        <td>5 cm</td>
                        <td>Circulación de aire por detrás del radiador</td>
                    </tr>
                    <tr>
                        <td>Del alfeizar / ventana por arriba</td>
                        <td>5 cm libres</td>
                        <td>Salida del aire caliente sin obstáculo</td>
                    </tr>
                </tbody>
            </table>

            <div className="callout callout-error">
                <strong>Atención:</strong> Un radiador dentro de una caja de madera decorativa, tapado
                por una cortina larga o instalado a menos de 5 cm del piso pierde entre un 20% y un 30%
                de su potencia efectiva. No hay corrección de elementos ni ajuste de caldera que compense
                ese error de instalación.
            </div>

            <h2>Errores frecuentes en obra</h2>

            <h3>1. Confundir W con Kcal/h en el catálogo</h3>

            <p>
                Los catálogos europeos (Purmo, Buderus, Roca) publican en Watts. Los catálogos locales
                (Calore, Vitro) publican en Kcal/h. Si mezclás unidades sin convertir, el cálculo
                queda completamente errado. Un panel de 1.000 W = 860 Kcal/h, no 1.000 Kcal/h.
            </p>

            <h3>2. No aplicar el factor de corrección de ΔT</h3>

            <p>
                Es el error más común y el más difícil de detectar después de la obra. El radiador se
                ve bien, la instalación funciona, pero en el invierno más frío el cuarto no llega a
                la temperatura de confort. El cliente llama, el instalador no entiende por qué, y la
                causa está en no haber ajustado por la temperatura real de trabajo de la caldera.
            </p>

            <h3>3. Un solo radiador grande en vez de dos medianos</h3>

            <p>
                Un radiador de 30 elementos en un rincón no calienta igual que dos de 15 bajo las dos
                ventanas. La distribución del calor en el ambiente es tan importante como la cantidad
                total de potencia instalada. Un radiador bien ubicado en la mitad de la pared exterior
                ya es mejor que uno de igual potencia escondido en el rincón más alejado de la ventana.
            </p>

            <h3>4. Mezclar elementos de distintos fabricantes</h3>

            <p>
                Los niples de unión tienen medidas y pasos de rosca que no siempre son intercambiables
                entre marcas. Mezclar elementos Ferroli con Calore puede generar juntas que pierden agua
                a los 2–3 años de instaladas, o que directamente no aprietan bien durante el llenado
                inicial. Usá siempre elementos del mismo fabricante dentro de cada radiador.
            </p>

            <h3>5. Sobredimensionar ambientes con orientación favorable</h3>

            <p>
                Un cuarto con ventana al norte en invierno tiene ganancias solares en el horario
                del mediodía. Un radiador sobredimensionado más esa ganancia pueden provocar
                sobrecalentamiento que obliga al habitante a abrir la ventana — el efecto contrario
                al buscado. Aplicar correctamente los factores de orientación del capítulo 4 evita
                este problema y también ahorra materiales.
            </p>

            <div className="callout callout-tip">
                <strong>Resumen del capítulo:</strong>
                <ul>
                    <li>Verificá siempre a qué temperatura trabaja la caldera antes de consultar el catálogo.</li>
                    <li>Columna de aluminio 600 mm: referencia de 150 Kcal/h por elemento a ΔT50.</li>
                    <li>Caldera a 70/60°C → aplicá factor 0,87: necesitás más elementos que lo que dice el catálogo directo.</li>
                    <li>Siempre que sea posible, instalá bajo las ventanas y respetá las distancias mínimas.</li>
                    <li>Nunca mezcles elementos de distintos fabricantes en el mismo radiador.</li>
                </ul>
            </div>
        </div>
    )
}
