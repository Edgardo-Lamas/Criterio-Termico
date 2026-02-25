export function Cap4Potencia() {
    return (
        <article className="prose">
            <h1>Capítulo 4 — Cálculo de potencia térmica por ambiente</h1>
            <p className="lead">
                Dimensionar bien la potencia es la diferencia entre un sistema que calienta
                en media hora y uno que trabaja al límite sin alcanzar temperatura. Este
                capítulo explica el método práctico que usa el instalador experimentado:
                el cálculo volumétrico con ajustes por condición real.
            </p>

            <h2>El método volumétrico</h2>
            <p>
                El cálculo de potencia parte de una lógica simple: a mayor volumen de aire
                que hay que calentar, más potencia necesaria. La fórmula base es:
            </p>

            <div className="callout-info">
                <strong>Fórmula:</strong><br />
                Potencia (Kcal/h) = Superficie (m²) × Altura (m) × Factor térmico (Kcal/h·m³)
            </div>

            <p>
                El <strong>factor térmico</strong> es el corazón del método. Condensa en un
                solo número la calidad constructiva del ambiente:
            </p>

            <table>
                <thead>
                    <tr>
                        <th>Factor</th>
                        <th>Cuándo usarlo</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>40 Kcal/h·m³</strong></td>
                        <td>Buena aislación: construcción nueva con EPS en muros, DVH, techo aislado</td>
                    </tr>
                    <tr>
                        <td><strong>50 Kcal/h·m³</strong></td>
                        <td>Aislación normal: estándar argentino, ladrillo sin aislación, vidrio simple</td>
                    </tr>
                    <tr>
                        <td><strong>60 Kcal/h·m³</strong></td>
                        <td>Poca aislación: construcción antigua, infiltraciones, losa sin aislación</td>
                    </tr>
                </tbody>
            </table>

            <h2>Los ajustes por condición real</h2>
            <p>
                Una vez calculada la potencia base, se aplican ajustes sumados (no multiplicados)
                según las condiciones del ambiente:
            </p>

            <table>
                <thead>
                    <tr>
                        <th>Condición</th>
                        <th>Ajuste</th>
                        <th>Por qué</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Tiene al menos una pared exterior</td>
                        <td>+15%</td>
                        <td>Contacto directo con el frío exterior</td>
                    </tr>
                    <tr>
                        <td>Sin ventanas al exterior</td>
                        <td>+0%</td>
                        <td>Sin pérdida adicional por vidrios</td>
                    </tr>
                    <tr>
                        <td>Pocas ventanas (1 ventana chica)</td>
                        <td>+5%</td>
                        <td>Pérdida leve por vidrio</td>
                    </tr>
                    <tr>
                        <td>Ventanas normales (1-2 ventanas medianas)</td>
                        <td>+10%</td>
                        <td>Pérdida moderada</td>
                    </tr>
                    <tr>
                        <td>Muchas ventanas o superficie vidriada grande</td>
                        <td>+20%</td>
                        <td>Pérdida alta por vidrios</td>
                    </tr>
                </tbody>
            </table>

            <div className="callout-tip">
                <strong>Los ajustes se suman, no se multiplican.</strong> Un ambiente con
                pared exterior (+15%) y ventanas normales (+10%) tiene un ajuste total
                de +25%, no de +26.5%. Esta es la forma correcta de aplicarlos.
            </div>

            <h2>Ejemplo completo: cálculo de un living</h2>
            <p>Datos del ambiente:</p>
            <ul>
                <li>Superficie: 25 m²</li>
                <li>Altura de techo: 2.70 m</li>
                <li>Aislación: construcción estándar (factor 50)</li>
                <li>Tiene pared exterior (+15%)</li>
                <li>Dos ventanas medianas, vidrio simple (+10%)</li>
            </ul>
            <p>Cálculo:</p>
            <ol>
                <li>Volumen: 25 × 2.70 = 67.5 m³</li>
                <li>Potencia base: 67.5 × 50 = 3.375 Kcal/h</li>
                <li>Ajuste total: 15% + 10% = 25%</li>
                <li>Potencia final: 3.375 × 1.25 = <strong>4.219 Kcal/h ≈ 4.9 kW</strong></li>
            </ol>

            <h2>De la potencia por ambiente a la caldera</h2>
            <p>
                Una vez calculada la potencia de todos los ambientes, la suma da la
                <strong> potencia total requerida</strong>. Pero eso no es lo que debe
                tener la caldera.
            </p>
            <p>
                La caldera trabaja mejor — y dura más — cuando opera entre el 70% y el 80%
                de su capacidad. Si la caldera trabaja siempre al 100% está en
                límite permanente; si está sobredimensionada cicla constantemente.
            </p>

            <div className="callout-info">
                <strong>Regla de la caldera:</strong><br />
                Potencia de caldera = Potencia total radiadores ÷ 0.80
            </div>

            <p>
                Siguiendo el ejemplo: si la suma de todos los ambientes da 18.000 Kcal/h,
                la caldera recomendada es de 18.000 ÷ 0.80 = <strong>22.500 Kcal/h</strong>.
            </p>

            <div className="callout-warning">
                <strong>No sobredimensionar la caldera.</strong> Una caldera demasiado
                grande para el sistema arranca, alcanza temperatura rápido y se apaga:
                el famoso "corto ciclado". Cada arranque genera condensación en el
                intercambiador y acorta la vida útil. El exceso razonable es del
                20–25% sobre la potencia de radiadores — no más.
            </div>

            <h2>Las unidades: Kcal/h y kW</h2>
            <p>
                En Argentina la potencia térmica se expresa históricamente en
                <strong> Kcal/h</strong>. Las calderas importadas y los catálogos
                europeos usan <strong>kW</strong>. La conversión es simple:
            </p>

            <div className="callout-info">
                <strong>1 kW = 860 Kcal/h</strong><br />
                Para pasar de Kcal/h a kW: dividir por 860<br />
                Para pasar de kW a Kcal/h: multiplicar por 860
            </div>

            <p>
                Ejemplo: 18.000 Kcal/h ÷ 860 = <strong>20.9 kW</strong>
            </p>

            <h2>Casos típicos de referencia</h2>

            <table>
                <thead>
                    <tr>
                        <th>Ambiente típico</th>
                        <th>Sup. / Altura</th>
                        <th>Factor</th>
                        <th>Potencia aprox.</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Baño (interior, sin ventana)</td>
                        <td>4 m² / 2.5 m</td>
                        <td>50</td>
                        <td>500 Kcal/h · 0.58 kW</td>
                    </tr>
                    <tr>
                        <td>Dormitorio (1 pared ext., 1 ventana)</td>
                        <td>12 m² / 2.6 m</td>
                        <td>50 +25%</td>
                        <td>1.950 Kcal/h · 2.3 kW</td>
                    </tr>
                    <tr>
                        <td>Living-comedor (2 paredes ext., muchas ventanas)</td>
                        <td>30 m² / 2.7 m</td>
                        <td>50 +35%</td>
                        <td>5.468 Kcal/h · 6.4 kW</td>
                    </tr>
                    <tr>
                        <td>Cocina (1 pared ext., 1 ventana)</td>
                        <td>10 m² / 2.5 m</td>
                        <td>50 +25%</td>
                        <td>1.563 Kcal/h · 1.8 kW</td>
                    </tr>
                    <tr>
                        <td>Estudio (interior, sin ventanas)</td>
                        <td>9 m² / 2.5 m</td>
                        <td>50</td>
                        <td>1.125 Kcal/h · 1.3 kW</td>
                    </tr>
                </tbody>
            </table>

            <h2>Usá la calculadora</h2>
            <p>
                En la sección <strong>Herramientas → Calculadora de Potencia</strong>
                podés ingresar todos los ambientes del proyecto y obtener el cálculo
                completo con la potencia de caldera recomendada. La calculadora aplica
                exactamente el método descripto en este capítulo.
            </p>

            <div className="callout-tip">
                <strong>Tip profesional:</strong> cuando le presentés el presupuesto al
                cliente, mostrá el detalle ambiente por ambiente. Eso diferencia tu trabajo
                de quien tira un número al aire. Un cliente que ve el desglose confía más
                y cuestiona menos el precio.
            </div>
        </article>
    )
}
