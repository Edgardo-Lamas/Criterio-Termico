import { usePageMeta } from '../../lib/usePageMeta'
import styles from './Legal.module.css'

export function PoliticaPrivacidad() {
    usePageMeta({
        title: 'Política de Privacidad',
        description: 'Política de privacidad y tratamiento de datos personales de la plataforma Criterio Térmico.'
    })

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <h1>🔒 Política de Privacidad</h1>
                <p className={styles.version}>Versión 1.0 — Julio 2026</p>
            </div>

            <article className={styles.content}>
                <section className={styles.section}>
                    <h2>1. Responsable del Tratamiento</h2>
                    <p>
                        Criterio Térmico es una plataforma técnica independiente destinada a instaladores
                        profesionales de calefacción. El responsable del tratamiento de los datos personales
                        recolectados a través de la plataforma es el titular del proyecto Criterio Térmico,
                        operando desde Argentina.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>2. Datos que Recolectamos</h2>
                    <p>Recolectamos los siguientes datos personales, únicamente los necesarios para operar el servicio:</p>
                    <ul>
                        <li><strong>Datos de cuenta:</strong> email y contraseña (gestionada de forma segura por Supabase Auth, nunca almacenada en texto plano).</li>
                        <li><strong>Datos de suscripción:</strong> tier contratado (Gratuito, Pro, Premium) y estado del pago.</li>
                        <li><strong>Datos de facturación:</strong> gestionados directamente por MercadoPago. Criterio Térmico <strong>no almacena números de tarjeta ni datos financieros sensibles</strong> — esa información nunca toca nuestros servidores.</li>
                        <li><strong>Consultas al asistente técnico:</strong> el contenido de las preguntas realizadas al asistente de IA se procesa para generar respuestas y se registra de forma agregada para control de uso (rate limiting), no para entrenamiento de modelos de terceros.</li>
                        <li><strong>Datos de uso:</strong> interacción con calculadoras, proyectos guardados en el Simulador 2D y preferencias de la plataforma.</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>3. Finalidad del Tratamiento</h2>
                    <ul>
                        <li>Proveer acceso a las herramientas y contenido según el plan contratado.</li>
                        <li>Procesar pagos y gestionar suscripciones.</li>
                        <li>Responder consultas a través del asistente técnico con IA.</li>
                        <li>Enviar comunicaciones relacionadas con la cuenta (confirmación de email, recuperación de contraseña, cambios de plan).</li>
                        <li>Mejorar la plataforma en base al uso agregado y anónimo.</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>4. Terceros que Procesan Datos (Encargados del Tratamiento)</h2>
                    <p>Para operar el servicio, compartimos datos estrictamente necesarios con los siguientes proveedores:</p>
                    <ul>
                        <li><strong>Supabase</strong> (Estados Unidos / infraestructura en la nube) — autenticación, base de datos y almacenamiento.</li>
                        <li><strong>MercadoPago</strong> — procesamiento de pagos y suscripciones. Sujeto a su propia política de privacidad.</li>
                        <li><strong>Anthropic</strong> (proveedor del modelo de IA) — procesamiento de las consultas enviadas al asistente técnico, exclusivamente a través de Edge Functions seguras, nunca de forma directa desde el navegador.</li>
                        <li><strong>Sentry</strong> — monitoreo de errores técnicos de la aplicación, con el fin de detectar y corregir fallos. No se envían datos sensibles ni de pago a este servicio.</li>
                    </ul>
                    <p>
                        Ninguno de estos proveedores está autorizado a usar los datos con fines distintos a los
                        de prestar el servicio contratado por Criterio Térmico.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>5. Seguridad de los Datos</h2>
                    <ul>
                        <li>La base de datos utiliza Row Level Security (RLS) a nivel de motor: cada usuario solo puede acceder a sus propios datos, controlado por PostgreSQL y no por el frontend.</li>
                        <li>Las claves de API de terceros (IA, pagos) nunca se exponen en el navegador — se gestionan exclusivamente en Edge Functions del lado del servidor.</li>
                        <li>Las comunicaciones entre el navegador y nuestros servidores se realizan siempre bajo HTTPS.</li>
                        <li>Los webhooks de pago verifican firma criptográfica (HMAC-SHA256) para evitar manipulación de datos de suscripción.</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>6. Derechos del Usuario</h2>
                    <p>
                        De acuerdo con la Ley 25.326 de Protección de Datos Personales de Argentina, y en línea
                        con los principios del Reglamento General de Protección de Datos (GDPR) de la Unión Europea
                        para usuarios de España, Alemania y otros países del EEE, el usuario tiene derecho a:
                    </p>
                    <ul>
                        <li><strong>Acceso:</strong> solicitar qué datos personales tenemos sobre él/ella.</li>
                        <li><strong>Rectificación:</strong> corregir datos inexactos o incompletos.</li>
                        <li><strong>Supresión:</strong> solicitar la eliminación de su cuenta y datos asociados ("derecho al olvido").</li>
                        <li><strong>Portabilidad:</strong> recibir sus datos en un formato estructurado y de uso común.</li>
                        <li><strong>Oposición y limitación:</strong> oponerse a determinados usos de sus datos.</li>
                    </ul>
                    <p>
                        Para ejercer estos derechos, el usuario puede contactar al soporte de la plataforma
                        desde la sección "Cuenta". Nos comprometemos a responder en un plazo razonable y,
                        en cualquier caso, dentro de los límites legales aplicables.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>7. Conservación de los Datos</h2>
                    <p>
                        Los datos de cuenta y suscripción se conservan mientras la cuenta permanezca activa.
                        Si el usuario solicita la eliminación de su cuenta, los datos personales se eliminan
                        de nuestros sistemas dentro de un plazo razonable, salvo aquellos que debamos conservar
                        por obligación legal o fiscal (por ejemplo, registros de facturación).
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>8. Cookies y Almacenamiento Local</h2>
                    <p>
                        Criterio Térmico utiliza almacenamiento local del navegador (localStorage) para mantener
                        la sesión iniciada y preferencias de la aplicación, y para permitir el funcionamiento
                        offline de la Progressive Web App (PWA). No utilizamos cookies de rastreo publicitario
                        de terceros.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>9. Menores de Edad</h2>
                    <p>
                        Criterio Térmico es una herramienta profesional dirigida a instaladores y técnicos.
                        No está destinada a menores de edad y no recolectamos deliberadamente datos de menores.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>10. Cambios en esta Política</h2>
                    <p>
                        Esta política puede actualizarse a medida que evolucione la plataforma o cambien los
                        requisitos legales aplicables, incluyendo la expansión a nuevos mercados (España, Alemania).
                        Los cambios relevantes se comunicarán a través de la plataforma o por email.
                    </p>
                </section>

                <div className={styles.footer}>
                    <p>Documento vivo — sujeto a evolución junto con la plataforma Criterio Térmico.</p>
                </div>
            </article>
        </div>
    )
}
