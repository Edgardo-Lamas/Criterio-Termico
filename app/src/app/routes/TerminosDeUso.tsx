import { usePageMeta } from '../../lib/usePageMeta'
import styles from './Legal.module.css'

export function TerminosDeUso() {
    usePageMeta({
        title: 'Términos de Uso',
        description: 'Términos y condiciones de uso de la plataforma Criterio Térmico.'
    })

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <h1>📜 Términos de Uso</h1>
                <p className={styles.version}>Versión 1.0 — Febrero 2026</p>
            </div>

            <article className={styles.content}>
                <section className={styles.section}>
                    <h2>1. Naturaleza del Servicio</h2>
                    <p>
                        Criterio Térmico es una plataforma técnica profesional destinada a instaladores
                        de calefacción y profesionales de la construcción. Su finalidad es <strong>asistir
                            el análisis, cálculo y toma de decisiones técnicas</strong>, sin reemplazar la
                        responsabilidad profesional del usuario.
                    </p>
                    <p>
                        El servicio combina contenido técnico, herramientas de cálculo y simulación,
                        y funcionalidades interactivas bajo un modelo de suscripción.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>2. Alcance y Limitaciones</h2>
                    <ul>
                        <li>Los resultados obtenidos mediante la plataforma son <strong>orientativos y de apoyo técnico</strong>.</li>
                        <li>La correcta ejecución en obra, cumplimiento normativo y validación final corresponden exclusivamente al profesional interviniente.</li>
                        <li>Criterio Térmico no reemplaza proyectos firmados ni dirección técnica.</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>3. Cuentas y Suscripciones</h2>
                    <p>
                        El acceso a ciertas funcionalidades está sujeto al plan contratado
                        (Gratuito, Pro, Premium).
                    </p>
                    <p>El usuario se compromete a:</p>
                    <ul>
                        <li>Utilizar una única cuenta personal.</li>
                        <li>No compartir credenciales.</li>
                        <li>No intentar eludir restricciones de acceso.</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>4. Propiedad Intelectual</h2>
                    <p>
                        Todo el contenido de la plataforma, incluyendo código fuente, algoritmos de cálculo,
                        simuladores, textos técnicos y estructura metodológica, es propiedad intelectual
                        de <strong>Criterio Térmico</strong>.
                    </p>
                    <p>Queda prohibido:</p>
                    <ul>
                        <li>Copiar, reproducir o redistribuir total o parcialmente el contenido.</li>
                        <li>Extraer o reutilizar la lógica de cálculo.</li>
                        <li>Utilizar los resultados con fines de reventa de software o servicios equivalentes.</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>5. Uso de la API y Herramientas</h2>
                    <p>
                        Las herramientas de cálculo y simulación funcionan exclusivamente dentro de la plataforma.
                    </p>
                    <p>No está permitido:</p>
                    <ul>
                        <li>Acceder a los endpoints fuera del entorno autorizado.</li>
                        <li>Realizar ingeniería inversa.</li>
                        <li>Automatizar consultas mediante bots o scripts externos.</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>6. Aportes de Usuarios</h2>
                    <p>
                        El usuario puede aportar experiencias técnicas, casos reales de obra e imágenes.
                    </p>
                    <p>Al subir contenido, el usuario:</p>
                    <ul>
                        <li>Conserva la autoría de su material.</li>
                        <li>Otorga a Criterio Térmico una <strong>licencia no exclusiva</strong> para usarlo
                            con fines de análisis técnico, mejora del sistema y contenido educativo.</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>7. Responsabilidad sobre Análisis por IA</h2>
                    <p>Los análisis automáticos:</p>
                    <ul>
                        <li>No constituyen diagnóstico definitivo.</li>
                        <li>No sustituyen la evaluación profesional en obra.</li>
                        <li>Se brindan como apoyo técnico.</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>8. Modificaciones del Servicio</h2>
                    <p>Criterio Térmico se reserva el derecho de:</p>
                    <ul>
                        <li>Actualizar contenidos</li>
                        <li>Modificar funcionalidades</li>
                        <li>Ajustar planes y precios</li>
                    </ul>
                    <p>Las modificaciones no afectarán derechos adquiridos durante el período contratado.</p>
                </section>

                <section className={styles.section}>
                    <h2>9. Terminación</h2>
                    <p>
                        El incumplimiento de estos términos podrá resultar en la suspensión o cancelación
                        de la cuenta sin derecho a reclamo.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>10. Aceptación</h2>
                    <p>
                        El uso de la plataforma implica la aceptación plena de estos Términos de Uso.
                    </p>
                </section>

                <div className={styles.footer}>
                    <p>Documento vivo — sujeto a evolución junto con la plataforma Criterio Térmico.</p>
                </div>
            </article>
        </div>
    )
}
