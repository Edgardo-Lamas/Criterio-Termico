export function Cap3Perdidas() {
    return (
        <article className="prose">
            <h1>Capítulo 3 — Análisis de pérdidas térmicas reales</h1>
            <p className="lead">
                Un cálculo de potencia correcto empieza por entender cuánto calor pierde cada
                ambiente. No todos los locales pierden igual: la misma superficie en un edificio
                con losa expuesta al viento pierde el doble que en un departamento interior.
                Este capítulo explica los factores reales que determinan esa pérdida.
            </p>

            <h2>¿Qué es la pérdida térmica?</h2>
            <p>
                Un ambiente calefaccionado pierde calor hacia el exterior en forma continua.
                Esa pérdida depende de la diferencia de temperatura entre adentro y afuera,
                y de qué tan bien aíslan los cerramientos (paredes, techo, piso, aberturas).
            </p>
            <p>
                La potencia del sistema de calefacción debe compensar exactamente esa pérdida
                para mantener la temperatura de diseño. Si la potencia instalada es menor
                que la pérdida, el sistema nunca alcanza temperatura en los días más fríos.
            </p>

            <div className="callout-tip">
                <strong>Temperatura de diseño en Argentina (zona IIIA — Buenos Aires):</strong>
                se calcula con exterior a <strong>2°C</strong> e interior a <strong>20°C</strong>,
                es decir una diferencia de 18°C. En zona IV (Patagonia) la diferencia llega a 30°C
                o más — el mismo local necesita el doble de potencia.
            </div>

            <h2>Los factores que determinan la pérdida</h2>

            <h3>1. Las paredes exteriores</h3>
            <p>
                Una pared de ladrillo hueco de 18 cm (la más común en Argentina) tiene un valor
                de transmitancia térmica (U) de aproximadamente <strong>1.4 W/m²·K</strong>.
                Con cámara de aire + ladrillo revocado exterior baja a 1.1. Con aislación
                interior de 5 cm de EPS baja a 0.4 — pierde tres veces menos.
            </p>
            <p>
                En obra el instalador no puede cambiar la constructiva, pero <strong>sí debe
                saber leerla</strong>: una casa de block o ladrillo sin aislación en zona
                IV justifica subir el factor térmico de cálculo a 60 Kcal/h·m³ o más.
            </p>

            <h3>2. Las aberturas (ventanas y puertas)</h3>
            <p>
                Las ventanas son el punto débil de cualquier cerramiento. Un vidrio simple de
                4 mm tiene U = 5.7 W/m²·K — pierde cuatro veces más que la pared que reemplaza.
                El doble vidriado hermético (DVH) baja a 2.8–3.2 según el espesor de la cámara.
            </p>

            <table>
                <thead>
                    <tr>
                        <th>Tipo de abertura</th>
                        <th>U aprox. (W/m²·K)</th>
                        <th>Referencia relativa</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Vidrio simple 4 mm</td>
                        <td>5.7</td>
                        <td>Peor caso</td>
                    </tr>
                    <tr>
                        <td>Vidrio simple + persiana metálica</td>
                        <td>4.0</td>
                        <td>Mejora leve (solo cerrada)</td>
                    </tr>
                    <tr>
                        <td>DVH (4-6-4 mm)</td>
                        <td>2.8 – 3.2</td>
                        <td>Mejora significativa</td>
                    </tr>
                    <tr>
                        <td>DVH + marco con RPT</td>
                        <td>1.4 – 1.8</td>
                        <td>Referencia pro</td>
                    </tr>
                    <tr>
                        <td>Triple vidrio</td>
                        <td>0.7 – 1.0</td>
                        <td>Passivhaus / norte de Europa</td>
                    </tr>
                    <tr>
                        <td>Pared ladrillo hueco 18 cm</td>
                        <td>1.4</td>
                        <td>Referencia pared estándar</td>
                    </tr>
                </tbody>
            </table>

            <div className="callout-warning">
                <strong>El error más frecuente:</strong> dimensionar para una casa que va a
                tener DVH cuando todavía tiene vidrio simple. El instalador que no pregunta
                termina con un sistema subdimensionado. Verificar siempre qué hay instalado
                o qué está presupuestado al momento de la obra.
            </div>

            <h3>3. Techo y losa</h3>
            <p>
                El calor sube. En un ambiente con techo al exterior (azotea, losa en contacto
                con el aire), la pérdida por techo puede representar el 30–40% del total.
                Una losa de 12 cm de hormigón sin aislación tiene U ≈ 3.0 W/m²·K.
                Con 5 cm de EPS por encima baja a 0.55.
            </p>
            <p>
                En departamentos intermedios (losa hacia otro ambiente calefaccionado) la
                pérdida por techo es prácticamente nula — y esto cambia completamente el
                cálculo respecto a una planta baja con azotea expuesta.
            </p>

            <h3>4. Piso</h3>
            <p>
                En plantas bajas sobre terreno natural o sobre locales no calefaccionados,
                el piso pierde calor. Una losa de 12 cm sobre terreno sin aislación tiene
                U ≈ 1.0–1.5 W/m²·K. En departamentos sobre otros departamentos la pérdida
                es despreciable.
            </p>

            <h3>5. Infiltraciones</h3>
            <p>
                Las infiltraciones de aire frío exterior son una fuente de pérdida que
                <strong> no aparece en ninguna fórmula simplificada</strong> pero que en
                casas viejas puede representar el 20–30% del calor total necesario.
            </p>
            <p>
                Señales que debe detectar durante el relevamiento:
            </p>
            <ul>
                <li>Puertas y ventanas que no ajustan bien (luz visible por los bordes)</li>
                <li>Marcos de madera hinchados o deformados</li>
                <li>Burletes inexistentes o deteriorados</li>
                <li>Ventanas corredizas sin doble riel</li>
                <li>Aberturas al patio interior sin burletes</li>
            </ul>

            <div className="callout-tip">
                Un living con cuatro ventanas sin burletes en invierno puede necesitar un
                30–40% más de potencia que lo que indica el cálculo volumétrico estándar.
                En esos casos usar el factor 60 Kcal/h·m³ aunque la construcción sea nueva.
            </div>

            <h2>La orientación en Argentina</h2>
            <p>
                En el hemisferio sur, el sol sale por el norte (en Buenos Aires el sol de
                invierno tiene azimut norte). Esto tiene consecuencias directas para el cálculo:
            </p>
            <ul>
                <li><strong>Frentes al norte:</strong> reciben sol en invierno — menor necesidad de calefacción</li>
                <li><strong>Frentes al sur:</strong> sin sol directo todo el año — mayor necesidad de calefacción</li>
                <li><strong>Este/Oeste:</strong> sol de mañana o tarde, efecto intermedio</li>
            </ul>
            <p>
                Para instalaciones con alta superficie vidriada (muros cortina, grandes paños),
                el factor de orientación puede justificar un ajuste de ±15% respecto al cálculo
                sin orientación.
            </p>

            <h2>Cómo usar todo esto en la práctica</h2>
            <p>
                El método volumétrico (Capítulo 4) incorpora estas variables de manera
                simplificada a través del <strong>factor térmico</strong> y los
                <strong>ajustes por pared exterior y ventanas</strong>. No es un cálculo
                de ingeniería exacto, pero para el 90% de las obras residenciales da
                resultados suficientemente precisos si se eligen bien los parámetros.
            </p>
            <p>
                La tabla de decisión para elegir el factor térmico:
            </p>

            <table>
                <thead>
                    <tr>
                        <th>Situación constructiva</th>
                        <th>Factor a usar</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Construcción nueva, aislación en muros y techo, DVH</td>
                        <td>40 Kcal/h·m³</td>
                    </tr>
                    <tr>
                        <td>Construcción estándar de los años 80–2010, sin aislación, vidrio simple</td>
                        <td>50 Kcal/h·m³</td>
                    </tr>
                    <tr>
                        <td>Construcción vieja, infiltraciones, losa sin aislación, zona fría</td>
                        <td>60 Kcal/h·m³</td>
                    </tr>
                    <tr>
                        <td>Zona IV o V (Patagonia, Cuyo), cualquier construcción</td>
                        <td>60–70 Kcal/h·m³ (consultar normativa IRAM)</td>
                    </tr>
                </tbody>
            </table>

            <div className="callout-info">
                <strong>Resumen práctico:</strong> si durante el relevamiento detectás
                infiltraciones evidentes, losa al exterior sin aislación, o la vivienda está
                en una zona con inviernos severos, usá siempre el factor más alto. El costo
                de una caldera algo mayor es insignificante frente al costo de un sistema
                que no alcanza temperatura en pleno invierno.
            </div>
        </article>
    )
}
