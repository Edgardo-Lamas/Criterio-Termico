// Error: Radiador frío en la parte inferior — Acumulación de lodos
// Tier: premium

export const errorRadiadorFrioAbajo = {
    id: 'radiador-frio-abajo',
    titulo: 'Radiador frío en la parte inferior',
    categoria: 'Acumulación de lodos',
    tier: 'premium' as const,
    preview: 'La mitad inferior del radiador no calienta.',
    resumen: 'Cuando la parte inferior de un radiador no calienta y la superior sí, hay lodos o sedimentos depositados que bloquean la circulación interna. Es señal de corrosión activa en el sistema.',
}

export function ErrorRadiadorFrioAbajoDetalle() {
    return (
        <div className="prose">
            <h2>El problema</h2>
            <p>
                Al tocar el radiador en funcionamiento, la zona superior está caliente
                pero la zona inferior permanece fría o tibia. El radiador no está
                completamente frío (algo circula) pero tampoco calienta de manera uniforme.
                La diferencia de temperatura entre parte alta y parte baja puede ser de 15–30°C.
            </p>

            <h2>El diagnóstico: no es aire</h2>
            <p>
                El primer instinto es purgar el radiador, pensando que hay aire atrapado.
                Pero si al abrir el purgador sale agua inmediatamente (sin aire), y el
                problema persiste, el diagnóstico cambia: hay <strong>sedimentos sólidos</strong>
                depositados en la parte inferior del radiador.
            </p>

            <div className="callout callout-warning">
                <div className="callout-label">Diferencia clave</div>
                <p>
                    Aire atrapado → la parte <em>superior</em> del radiador está fría (el aire sube).
                    Lodos depositados → la parte <em>inferior</em> está fría (los sólidos se depositan por gravedad).
                </p>
            </div>

            <h2>La causa: corrosión interna y lodos de magnetita</h2>
            <p>
                El agua de un circuito de calefacción, en contacto con el hierro de los
                radiadores y la acería de la caldera, produce óxido de hierro (magnetita, Fe₃O₄).
                Esta magnetita —un polvo negro muy fino— se transporta por el sistema con el agua
                y se deposita en los puntos de menor velocidad de circulación.
            </p>
            <p>
                La parte inferior de los radiadores es exactamente ese punto: velocidad mínima,
                máxima deposición.
            </p>

            <h3>Factores que aceleran la formación de lodos</h3>
            <ul>
                <li>
                    <strong>Presencia de oxígeno en el circuito:</strong> el principal factor.
                    Tuberías de polipropileno sin barrera antioxígeno (barrera de EVOH) permiten
                    la difusión de O₂ a través de la pared. El oxígeno oxida el hierro.
                </li>
                <li>
                    <strong>Reposición frecuente de agua:</strong> cada vez que se repone agua
                    al circuito, se introduce oxígeno disuelto nuevo.
                </li>
                <li>
                    <strong>Agua dura con alta concentración de carbonatos:</strong> forma
                    incrustaciones que se combinan con los lodos.
                </li>
                <li>
                    <strong>Metales distintos en contacto:</strong> uniones galvánicas entre
                    cobre, hierro y aluminio aceleran la corrosión electroquímica.
                </li>
            </ul>

            <div className="callout callout-error">
                <div className="callout-label">Señal de alerta grave</div>
                <p>
                    Si el agua del purgador o del vaciado tiene color marrón-negro oscuro,
                    hay corrosión activa severa en el sistema. El problema no está solo en
                    los radiadores afectados — está en toda la instalación y muy probablemente
                    en el intercambiador de la caldera.
                </p>
            </div>

            <h2>La solución</h2>

            <h3>Paso 1: Limpieza del radiador afectado</h3>
            <p>
                Aislar el radiador (cerrar válvula y detente), desconectarlo y realizar una
                limpieza por inversión de flujo con agua a presión. En casos severos, puede
                ser necesario reemplazar el radiador si la acumulación es muy compacta.
            </p>

            <h3>Paso 2: Limpieza del circuito completo (flush)</h3>
            <p>
                Vaciar el sistema, rellenar con agua limpia y vaciar nuevamente para arrastrar
                los lodos del circuito general. En instalaciones con contaminación severa,
                se realiza un <strong>power flush</strong>: limpieza por circulación forzada
                con agente químico dispersante.
            </p>

            <h3>Paso 3: Instalar filtro de magnetita</h3>
            <p>
                Un filtro magnético en el retorno de la caldera captura las partículas de
                magnetita antes de que lleguen al intercambiador. Es el componente más
                efectivo para extender la vida útil de un sistema existente con problemas.
            </p>

            <h3>Paso 4: Inhibidor de corrosión</h3>
            <p>
                Tras la limpieza, añadir al circuito un inhibidor de corrosión homologado
                (ej: Sentinel X100 o equivalente). El inhibidor forma una película protectora
                sobre las superficies metálicas y reduce drásticamente la corrosión futura.
            </p>

            <h3>Paso 5 (largo plazo): Resolver la entrada de oxígeno</h3>
            <p>
                Si las tuberías son de PP sin barrera antioxígeno, el problema volverá.
                Las soluciones a largo plazo incluyen:
            </p>
            <ul>
                <li>Reemplazar gradualmente las tuberías por PP-R con barrera de EVOH</li>
                <li>Instalar un desaireador automático en la impulsión de la caldera</li>
                <li>Mantener la presión del circuito estable para evitar reposiciones frecuentes</li>
            </ul>

            <div className="callout callout-tip">
                <div className="callout-label">Mantenimiento preventivo</div>
                <p>
                    En una instalación sana, el agua del purgador debe ser transparente o
                    levemente amarillenta. Revisión anual del filtro de magnetita y del nivel
                    de inhibidor en el agua del circuito es el mantenimiento mínimo para
                    evitar este problema.
                </p>
            </div>
        </div>
    )
}
