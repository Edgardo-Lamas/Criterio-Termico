// Error/Mito: "No se pueden empalmar los tubos de piso radiante empotrados"
// Tier: pro

export const errorEmpalmesPisoRadiante = {
    id: 'empalmes-piso-radiante',
    titulo: '¿Se pueden empalmar los tubos de piso radiante empotrados?',
    categoria: 'Diseño de tuberías',
    tier: 'pro' as const,
    preview: 'El miedo a empalmar un circuito de piso radiante bajo la carpeta es más mito que realidad técnica.',
    resumen: 'Una unión bien hecha no pierde por estar empotrada: la sanitaria va enterrada y no pierde. La norma prefiere evitar uniones enterradas por accesibilidad, no porque fallen. Los sistemas de vinculación (compresión radial, casquillo deslizante) son muy confiables si la ejecución es correcta.',
}

export function ErrorEmpalmesPisoRadianteDetalle() {
    return (
        <div className="prose">
            <h2>El mito</h2>
            <p>
                Circula en obra, con un temor casi religioso, la idea de que
                <strong> no se puede empalmar un tubo de piso radiante</strong> en el
                recorrido de un circuito: que si se hace una unión y queda empotrada bajo la
                carpeta, tarde o temprano va a perder. Muchos prefieren descartar un rollo
                entero antes que hacer un empalme.
            </p>
            <p>
                Conviene separar lo que es una <strong>buena práctica</strong> de lo que es un
                <strong> mito técnico</strong>. Empalmar y empotrar no es sinónimo de fuga.
            </p>

            <h2>La realidad: una unión bien hecha no pierde por estar enterrada</h2>
            <p>
                La prueba más simple está a la vista de todos: las cañerías de la
                <strong> red sanitaria</strong> —agua fría y caliente de consumo— van
                empotradas en pisos y paredes, con sus uniones, y no pierden. Lo mismo la
                cloacal, el gas, etc. Una unión no falla <em>porque</em> esté enterrada: falla
                cuando <strong>está mal hecha</strong>. La variable real es la ejecución, no la
                ubicación.
            </p>
            <p>
                El tubo de piso radiante no escapa a esa realidad. Y encima juega a favor: los
                sistemas de vinculación de las marcas de tubería para piso radiante están entre
                los <strong>más confiables</strong> de toda la instalación.
            </p>

            <h2>Por qué la norma prefiere evitar uniones enterradas</h2>
            <p>
                Es cierto que por norma y buena práctica <strong>conviene no dejar uniones
                enterradas</strong>. Pero el motivo no es que una buena unión pierda, sino la
                <strong> accesibilidad</strong>: si algún día esa unión llegara a fallar
                —o hay que intervenir—, está debajo de la carpeta o del hormigón, y llegar a
                ella significa <strong>romper el piso</strong>. Es una regla de mantenibilidad
                y de gestión de riesgo, no una ley física. Por eso el ideal es que cada
                circuito vaya <strong>de colector a colector sin empalmes</strong>. Pero un
                empalme de reparación o de necesidad, bien hecho, es perfectamente legítimo.
            </p>

            <h2>Los sistemas de unión que lo hacen confiable</h2>
            <ul>
                <li>
                    <strong>Casquillo deslizante (expansión en frío):</strong> se expande la
                    boca del tubo, se introduce el accesorio y la propia memoria del PEX
                    contrae el tubo sobre él; después se desliza un casquillo que aprieta todo.
                    No lleva o-ring: el sello es tubo contra accesorio. Son tan seguros que en
                    la jerga los llaman <strong>"antibobos"</strong> — es muy difícil hacerlos
                    mal y quedan aptos para empotrar.
                </li>
                <li>
                    <strong>Compresión radial / prensado:</strong> un casquillo de aluminio o
                    acero se prensa con matriz sobre el accesorio, deformándolo de manera
                    uniforme alrededor del tubo. Ejecutado con la matriz correcta, es una unión
                    permanente y estanca, apta para quedar embutida.
                </li>
                <li>
                    <strong>Manguitos / uniones de la propia marca:</strong> los fabricantes
                    venden acoples rectos homologados justamente para empalmar tramos, muchos
                    aptos para empotrar según su ficha.
                </li>
            </ul>

            <div className="callout callout-warning">
                <div className="callout-label">La regla de oro</div>
                <p>
                    Usá siempre el <strong>accesorio del mismo sistema y marca</strong> que el
                    tubo, con la herramienta correcta (expansora o matriz de prensado que
                    corresponda). La mayoría de las fugas "de empalme" en realidad son fugas de
                    <strong> mala ejecución</strong>: accesorio equivocado, prensado incompleto,
                    boca sobre-expandida, tubo dañado o suciedad en la unión.
                </p>
            </div>

            <h2>Cómo empalmar enterrado con tranquilidad</h2>
            <ol>
                <li>
                    <strong>Accesorio homologado</strong> del sistema del tubo, con la
                    herramienta que indica el fabricante.
                </li>
                <li>
                    <strong>Prueba hidráulica antes de colar la carpeta</strong>, y mantener el
                    circuito <strong>presurizado durante el colado</strong> (con manómetro a la
                    vista). Si un empalme se daña al pisar o al hormigonar, el manómetro lo
                    delata en el momento, cuando todavía está todo accesible.
                </li>
                <li>
                    <strong>Proteger el accesorio embutido:</strong> si la unión queda dentro de
                    la carpeta/hormigón, envolvela con cinta autovulcanizante (o funda) para
                    aislarla del contacto directo con el mortero y evitar corrosión del cuerpo
                    metálico del accesorio.
                </li>
                <li>
                    <strong>Marcar la posición del empalme</strong> en el plano de obra, por si
                    en el futuro hay que ubicarlo.
                </li>
                <li>
                    <strong>Minimizar la cantidad de uniones:</strong> lo ideal sigue siendo el
                    circuito continuo; el empalme es la excepción bien hecha, no la costumbre.
                </li>
            </ol>

            <h2>Fuentes</h2>
            <ul className="fuentes">
                <li>
                    Radiant Floor Company — guía de adaptadores y acoples: la buena práctica es
                    el circuito continuo; los acoples enterrados se reservan para reparación y se
                    protegen (cinta autovulcanizante) del hormigón.
                </li>
                <li>
                    ASTM F1960 — norma de conexiones PEX-A por expansión en frío (casquillo
                    deslizante): unión estanca e inmediata, apta para este tipo de uso.
                </li>
                <li>
                    Heating Help (The Wall) — experiencias de empalmes de PEX embebidos en losa
                    de calefacción radiante.
                </li>
            </ul>

            <div className="callout callout-tip">
                <div className="callout-label">La prueba que despeja el miedo</div>
                <p>
                    El seguro real contra una unión enterrada es la prueba de presión sostenida
                    durante toda la obra (por ejemplo 6 bar con manómetro y by-pass hasta el fin
                    de obra). No es la fe en que "no se empalma": es dejar el circuito bajo
                    presión y que el manómetro sea el testigo. Si aguanta la obra entera, ese
                    empalme no va a perder después.
                </p>
            </div>
        </div>
    )
}
