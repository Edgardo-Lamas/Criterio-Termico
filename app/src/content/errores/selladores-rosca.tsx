// Error: Sellador de rosca incorrecto — pérdidas en uniones de calefacción
// Tier: free

import { DiagramaSelladores } from '../manual/diagrams/DiagramaSelladores'

export const errorSelladoresRosca = {
    id: 'selladores-rosca',
    titulo: 'Goteos en uniones después de la puesta en marcha',
    categoria: 'Materiales y sellado',
    tier: 'free' as const,
    preview: 'Las uniones que no perdían en frío empiezan a gotear cuando el sistema llega a temperatura.',
    resumen: 'El sellador de rosca incorrecto no tolera los ciclos de dilatación y contracción del sistema. El teflón standard es el caso más frecuente: funciona bien en frío pero falla cuando la instalación trabaja a 70–90°C.',
}

export function ErrorSelladoresRoscaDetalle() {
    return (
        <div className="prose">
            <h2>El problema</h2>
            <p>
                Las uniones roscadas de radiadores, colectores, válvulas o accesorios
                que no presentaban pérdidas durante el llenado en frío comienzan a gotear
                días o semanas después de la puesta en marcha, cuando el sistema alcanza
                su temperatura de trabajo. En otros casos la pérdida es inmediata pero
                aumenta con el tiempo.
            </p>
            <p>
                Es un síntoma casi siempre asociado al material de sellado elegido:
                el sellador funciona en frío pero no está diseñado para soportar
                las condiciones reales de un circuito de calefacción.
            </p>

            <h2>Por qué las uniones de calefacción son exigentes</h2>
            <p>
                Un circuito de calefacción somete a las uniones roscadas a tres tensiones
                simultáneas que no existen en instalaciones de agua fría:
            </p>
            <ul>
                <li>
                    <strong>Temperatura sostenida:</strong> el agua de impulsión trabaja
                    habitualmente entre 70 y 90°C en sistemas de alta temperatura,
                    y entre 45 y 55°C en sistemas de baja temperatura.
                </li>
                <li>
                    <strong>Ciclos de dilatación y contracción:</strong> una tubería de hierro
                    negro de un metro de longitud se dilata aproximadamente 1.2 mm por cada
                    10°C de variación. En un arranque desde frío el sistema completo trabaja
                    mecánicamente, y ese movimiento se transmite a cada unión roscada.
                </li>
                <li>
                    <strong>Vibración:</strong> la bomba de circulación genera vibración continua
                    que, en uniones mal selladas o con sellador rígido, favorece el aflojamiento
                    progresivo.
                </li>
            </ul>

            <div className="callout callout-info">
                <div className="callout-label">Dato técnico</div>
                <p>
                    Un circuito de 10 metros de tubería de hierro que pasa de 10°C a 80°C
                    se dilata aproximadamente 8.4 mm en total. Esa variación dimensional
                    debe absorberse en las curvas, los sifones y — si el sellador no es
                    el adecuado — en las uniones roscadas.
                </p>
            </div>

            <h2>Los cuatro tipos de selladores y cuándo usar cada uno</h2>

            <DiagramaSelladores />

            <h3>Teflón (cinta PTFE)</h3>
            <p>
                El más difundido y el más mal usado. La cinta de PTFE (politetrafluoroetileno)
                ofrece una resistencia química excelente y es perfectamente apta para
                agua fría, agua caliente sanitaria (ACS) hasta 60°C y gas con
                las versiones de alta densidad.
            </p>
            <p>
                El problema en calefacción no es la temperatura en sí —el PTFE tolera
                hasta 260°C en condiciones estáticas— sino el <strong>trabajo mecánico</strong>.
                La cinta se comprime entre los filetes pero no recupera su espesor original
                al relajarse la rosca (fluencia plástica). Con los ciclos de calentamiento
                y enfriamiento, los filetes trabajan microscópicamente y el sellado se
                va perdiendo de forma progresiva. Además, con el tiempo y la temperatura sostenida,
                el material se vuelve quebradizo y frágil.
            </p>

            <div className="callout callout-warning">
                <div className="callout-label">No usar teflón en calefacción</div>
                <p>
                    El teflón en cinta no es apto para instalaciones hidrónicas con
                    temperatura superior a 60°C ni para uniones sometidas a ciclos
                    térmicos repetidos. Su uso en calefacción es el origen del
                    goteo más frecuente que se diagnostica en instalaciones existentes.
                </p>
            </div>

            <h3>Cáñamo (estopa)</h3>
            <p>
                El cáñamo es una fibra vegetal natural obtenida de la planta de cannabis
                (<em>Cannabis sativa</em>). Tiene una larga historia en plomería por su
                capacidad de hincharse con la humedad y ajustarse a los filetes.
                Solo, sin embargo, no es suficiente: el cáñamo debe usarse
                <strong> siempre combinado con una pasta sellante</strong>.
            </p>
            <p>
                La fibra embebida en pasta forma una junta semirígida que admite
                cierta deformación elástica, haciéndola significativamente más
                tolerante a los ciclos térmicos que el teflón solo.
                Según la normativa europea EN 751-2, el cáñamo con pasta apta
                tiene una temperatura de servicio de hasta 130°C.
            </p>

            <h3>Pastas sellantes de junta (sellantes de rosca)</h3>
            <p>
                Productos como Unipak, Tangit, Fermit, Loctite 55 o similares
                sellan el espacio entre filetes formando una <strong>junta flexible</strong>
                que es la clave de su ventaja sobre el teflón: el sellado puede deformarse
                elásticamente y recuperar su forma, absorbiendo los movimientos de
                dilatación sin perder la estanqueidad.
            </p>
            <p>
                La combinación <strong>cáñamo + pasta sellante</strong> es la opción
                más confiable y versátil para instalaciones de calefacción residencial.
                La fibra actúa como soporte mecánico y la pasta rellena los microespacios
                garantizando hermeticidad. Es importante verificar que la pasta elegida
                sea compatible con la temperatura de trabajo del sistema.
            </p>

            <h3>Selladores anaeróbicos</h3>
            <p>
                Los selladores anaeróbicos (Loctite 542, 543, 567, Delo-ML, Precote y otros)
                polimerizan en ausencia de oxígeno: el curado se activa precisamente cuando
                el producto queda encerrado entre dos superficies metálicas en contacto,
                sin acceso al aire. El resultado es un sellado rígido con excelente
                resistencia mecánica y química.
            </p>
            <p>
                Son la mejor opción para uniones que se prevé que no se desmonten,
                zonas con vibración permanente (cerca de la bomba) o colectores fijos.
                Su principal limitación es que <strong>no permiten el desmontaje</strong>
                sin aplicar calor (200°C aproximadamente para ablandar el polímero)
                y requieren que las superficies estén perfectamente limpias y
                desengrasadas antes de la aplicación. El tiempo de curado completo
                es de 24 horas a temperatura ambiente; en materiales porosos o
                pasivos (acero inoxidable, aleaciones de zinc) se recomienda
                usar el primer activador correspondiente.
            </p>

            <div className="callout callout-tip">
                <div className="callout-label">Combinación óptima para calefacción</div>
                <p>
                    Para la gran mayoría de las uniones roscadas en calefacción residencial:
                    <strong> cáñamo + pasta sellante compatible con temperatura</strong>.
                    Reservar el sellador anaeróbico para uniones definitivas o con alta
                    vibración. Descartar el teflón en cinta para este tipo de instalación.
                </p>
            </div>

            <h2>Diagnóstico en instalaciones existentes</h2>
            <p>
                Si se detectan goteos en uniones roscadas de una instalación en funcionamiento:
            </p>
            <ol>
                <li>
                    <strong>Identificar el material de sellado original.</strong> Si es teflón
                    en cinta, el origen del problema está claro.
                </li>
                <li>
                    <strong>Evaluar la magnitud de la pérdida.</strong> Una pérdida mínima
                    en frío puede empeorar significativamente cuando el sistema alcanza
                    temperatura de trabajo.
                </li>
                <li>
                    <strong>Desmontar y rehacor la unión.</strong> No existe solución
                    definitiva que no implique desmontar, limpiar los filetes completamente
                    y rehacer el sellado con el material correcto.
                </li>
                <li>
                    <strong>Verificar el estado del hilo de rosca.</strong> Si hay
                    corrosión, óxido o daño mecánico en los filetes, el sellador
                    no puede compensarlo — la pieza debe reemplazarse.
                </li>
            </ol>

            <div className="callout callout-warning">
                <div className="callout-label">No tapar goteos con silicona</div>
                <p>
                    La silicona y los selladores de superficie no resuelven goteos
                    en uniones roscadas bajo presión. Es una solución provisoria que
                    se desprende con la temperatura y puede generar mayores problemas
                    al encubrir el origen real del defecto.
                </p>
            </div>

            <h2>Prevención en instalaciones nuevas</h2>
            <p>
                La selección del sellador correcto desde el inicio es la única
                forma de evitar este problema completamente:
            </p>
            <ul>
                <li>Definir el material de sellado antes de comenzar la instalación</li>
                <li>Usar siempre cáñamo + pasta, o anaeróbico según el caso</li>
                <li>Verificar que la pasta elegida declare compatibilidad con
                    la temperatura máxima del sistema</li>
                <li>Aplicar el sellador con el hilo limpio y seco</li>
                <li>Realizar la prueba hidráulica en frío <em>antes</em> de tapar
                    o revestir cualquier unión</li>
                <li>Hacer una segunda verificación a temperatura de trabajo,
                    a las 24 horas de la puesta en marcha</li>
            </ul>
        </div>
    )
}
