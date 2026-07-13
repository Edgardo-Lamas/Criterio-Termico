// Error: El tubo PEX se estranguló/acodó en obra — Memoria térmica y barrera antioxígeno
// Tier: free

export const errorPexMemoriaTermica = {
    id: 'pex-memoria-termica',
    titulo: 'El tubo PEX se estranguló en obra',
    categoria: 'Tuberías y materiales',
    tier: 'free' as const,
    preview: 'Un tubo PEX aplastado o acodado que cerró el paso no se tira: se recupera con calor.',
    resumen: 'El PEX (polietileno reticulado) tiene "memoria": si se estrangula, aplastando o acodando el paso, se le devuelve la forma calentándolo con pistola de calor. El multicapa con aluminio, en cambio, no tiene memoria y hay que cortarlo.',
}

export function ErrorPexMemoriaTermicaDetalle() {
    return (
        <div className="prose">
            <h2>El problema</h2>
            <p>
                Pasa seguido en obra: un tramo de tubería PEX queda <strong>estrangulado</strong>
                —pisado, doblado en una curva demasiado cerrada o acodado— y el paso del agua
                se cierra casi por completo. El tubo queda marcado, con un pliegue, pero
                no llegó a cortarse. La reacción instintiva es cortar ese tramo y empalmar,
                con todo el trabajo que eso implica si ya está tendido.
            </p>
            <p>
                En la mayoría de los casos no hace falta: si el tubo es PEX, se puede
                <strong> recuperar con calor</strong> y seguir usándolo intacto.
            </p>

            <h2>Qué es la "memoria" del PEX</h2>
            <p>
                PEX significa <strong>polietileno reticulado</strong> (cross-linked): durante
                la fabricación, las cadenas del polímero se "entrelazan" formando una red
                tridimensional. Esa red guarda la forma original del tubo tal como salió de
                fábrica. Cuando el tubo se dobla o se aplasta en frío, la red se tensiona pero
                no se rompe: el material "quiere" volver a su forma.
            </p>
            <p>
                Al calentarlo, se le da a esas cadenas la energía para relajarse y
                <strong> volver a la forma que recuerdan</strong>. El pliegue se abre solo y el
                tubo recupera su diámetro. Es el mismo principio de la memoria de forma que
                usan las uniones de casquillo deslizante (expansión en frío).
            </p>

            <h2>Cómo recuperarlo — paso a paso</h2>
            <ol>
                <li>
                    Usar una <strong>pistola de calor</strong> (aire caliente). Nunca soplete
                    ni llama directa: la llama quema el material antes de que recupere la forma.
                </li>
                <li>
                    Mantener la pistola a unos <strong>10 cm</strong> del tubo y moverla en
                    forma constante, sin quedarse fija en un punto.
                </li>
                <li>
                    Calentar <strong>parejo, girando alrededor</strong> del estrangulamiento,
                    para que el calor entre uniforme en toda la circunferencia.
                </li>
                <li>
                    Ir despacio: se ve cómo el pliegue se va abriendo y el tubo recupera su
                    forma. Acompañar el proceso sin forzar con la mano.
                </li>
                <li>
                    Cuando recuperó el diámetro, dejar <strong>enfriar sin manipularlo</strong>
                    y verificar el paso libre.
                </li>
            </ol>

            <div className="callout callout-warning">
                <div className="callout-label">Dónde está el límite</div>
                <p>
                    Si el material se pone <strong>brilloso, se dora, burbujea o cambia de
                    color</strong>, se pasó de temperatura y ese tramo quedó dañado: ahí sí hay
                    que cortar y unir. El calor recupera la forma, no arregla un tubo quemado
                    ni uno que ya tenía una fisura por el pliegue.
                </p>
            </div>

            <h2>Ojo: el multicapa (con aluminio) NO tiene memoria</h2>
            <p>
                Esto es clave y es donde muchos se equivocan. El truco del calor funciona en
                <strong> PEX y PE-RT</strong>. El <strong>tubo multicapa (PEX-AL-PEX)</strong>,
                el que lleva una lámina de aluminio en el medio y se usa mucho en radiadores,
                <strong> no tiene memoria</strong>: cuando se acoda, el aluminio se deforma de
                forma permanente (queda plegado para siempre) y calentarlo no lo recupera —
                incluso puede despegar las capas. Un multicapa estrangulado <strong>se corta y
                se une</strong> con la conexión de la marca (prensado o compresión).
            </p>

            <div className="callout callout-info">
                <div className="callout-label">Cómo reconocerlos</div>
                <p>
                    PEX / PE-RT: pared homogénea de plástico, más flexible, "vuelve" al soltarlo.
                    Multicapa: se siente la rigidez del aluminio y <strong>mantiene la forma</strong>
                    cuando lo doblás (por eso es cómodo para curvas prolijas a la vista, pero por
                    eso mismo no perdona un acode cerrado).
                </p>
            </div>

            <h2>La barrera antioxígeno y por qué exige más cuidado con el calor</h2>
            <p>
                En calefacción el agua circula siempre por el mismo circuito cerrado, en
                contacto con piezas de hierro y acero: el cuerpo de la caldera, el cuerpo de la
                bomba (fundición), el colector de acero, las válvulas y —en radiadores— el
                propio emisor de chapa. Si entra oxígeno al agua, esas piezas se corroen y se
                forman lodos (magnetita) que tapan y desgastan todo. El plástico solo, sin
                protección, deja <strong>pasar oxígeno a través de la pared</strong> del tubo:
                según la norma DIN 4726, un tubo con barrera admite como máximo 0,1 g/m³·día,
                mientras que uno sin barrera deja pasar del orden de 5 g/m³·día — unas 50 veces
                más. Por eso los tubos de calefacción llevan una <strong>barrera antioxígeno</strong>,
                que puede ser de dos tipos:
            </p>
            <ul>
                <li>
                    <strong>Barrera física (aluminio):</strong> la lámina metálica del
                    <strong> multicapa</strong> (PEX-AL-PEX). Al ser metal, es una barrera total
                    al oxígeno. Es la que solés tener en el tubo de radiadores.
                </li>
                <li>
                    <strong>Barrera química/funcional (EVOH):</strong> una capa muy fina de
                    etilen-vinil-alcohol co-extruida sobre el PEX/PE-RT. Es la que llevan los
                    tubos de piso radiante <em>con barrera</em>.
                </li>
            </ul>

            <div className="callout callout-info">
                <div className="callout-label">Un mito de mercado que conviene aclarar</div>
                <p>
                    Suele decirse que "el tubo con barrera es para radiadores y el tubo sin
                    barrera es para piso radiante". <strong>No es una regla técnica.</strong> Por
                    norma, todo circuito de calefacción cerrado —piso o radiadores— debería ir
                    con barrera, porque lo que hay que proteger no es el emisor sino la caldera,
                    la bomba y el colector. El tubo <em>sin</em> barrera está pensado en realidad
                    para agua sanitaria (donde el agua se renueva y no importa el oxígeno). La
                    costumbre de "piso sin barrera" viene más de un tema
                    <strong> comercial y de costo</strong> (el tubo sin barrera es bastante más
                    barato) que de una razón de ingeniería. La excepción legítima: si todo el
                    circuito es no ferroso (caldera de inox, bomba de bronce) o está separado por
                    un intercambiador de placas, ahí sí el piso puede ir sin barrera.
                </p>
            </div>

            <p>
                Y esto se conecta con la reparación: cuando calentás un tubo <strong>con barrera</strong>,
                hay que ser más prudente todavía. Si te pasás de temperatura podés dañar o
                despegar la capa de EVOH (o el aluminio del multicapa) y, aunque el tubo "cierre"
                bien, se arruina la protección contra el oxígeno. Más distancia, más movimiento y
                menos insistencia.
            </p>

            <div className="callout callout-tip">
                <div className="callout-label">Regla práctica</div>
                <p>
                    Tubo de <strong>piso radiante</strong> con barrera (PEX/PE-RT + EVOH): tiene
                    memoria → se recupera con calor, cuidando de no cocinar la barrera. Tubo de
                    <strong> radiadores</strong> multicapa (barrera de aluminio): no tiene
                    memoria → si se acoda, se corta y se une. Y salvo circuito 100% no ferroso,
                    en calefacción cerrada elegí siempre tubo con barrera: es lo que protege la
                    caldera y la bomba de la corrosión.
                </p>
            </div>

            <h2>Fuentes</h2>
            <ul className="fuentes">
                <li>
                    Norma DIN 4726 — límite de permeabilidad al oxígeno en tuberías plásticas de
                    calefacción (0,1 g/m³·día).
                </li>
                <li>
                    REHAU — Oxygen diffusion through RAUPEX O2 barrier pipe (TB196) y ficha de
                    tubería PE-RT para calefacción con barrera de oxígeno.
                </li>
                <li>
                    General Fittings — ficha técnica de tubos PE-Xa con barrera externa de EVOH
                    y cumplimiento DIN 4726.
                </li>
                <li>
                    Giacomini — tubo PEX reticulado con barrera de oxígeno "ideal para sistemas
                    de calefacción por radiadores".
                </li>
                <li>
                    Heating Help (The Wall) — uso de PEX sin barrera en piso radiante solo con
                    componentes no ferrosos o intercambiador de placas.
                </li>
            </ul>
        </div>
    )
}
