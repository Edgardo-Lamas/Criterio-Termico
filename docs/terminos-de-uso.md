# Términos de Uso — Plataforma Criterio Térmico (v1.0)

## 1. Naturaleza del Servicio

Criterio Térmico es una plataforma técnica profesional destinada a instaladores de calefacción y profesionales de la construcción. Su finalidad es **asistir el análisis, cálculo y toma de decisiones técnicas**, sin reemplazar la responsabilidad profesional del usuario.

El servicio combina contenido técnico, herramientas de cálculo y simulación, y funcionalidades interactivas bajo un modelo de suscripción.

---

## 2. Alcance y Limitaciones

* Los resultados obtenidos mediante la plataforma son **orientativos y de apoyo técnico**.
* La correcta ejecución en obra, cumplimiento normativo y validación final corresponden exclusivamente al profesional interviniente.
* Criterio Térmico no reemplaza proyectos firmados ni dirección técnica.

---

## 3. Cuentas y Suscripciones

El acceso a ciertas funcionalidades está sujeto al plan contratado (Gratuito, Pro, Premium).

El usuario se compromete a:

* Utilizar una única cuenta personal.
* No compartir credenciales.
* No intentar eludir restricciones de acceso.

---

## 4. Propiedad Intelectual

Todo el contenido de la plataforma, incluyendo pero no limitado a:

* Código fuente
* Algoritmos de cálculo
* Simuladores
* Textos técnicos
* Estructura metodológica

es propiedad intelectual de **Criterio Térmico**.

Queda prohibido:

* Copiar, reproducir o redistribuir total o parcialmente el contenido.
* Extraer o reutilizar la lógica de cálculo.
* Utilizar los resultados con fines de reventa de software o servicios equivalentes.

---

## 5. Uso de la API y Herramientas

Las herramientas de cálculo y simulación funcionan exclusivamente dentro de la plataforma.

No está permitido:

* Acceder a los endpoints fuera del entorno autorizado.
* Realizar ingeniería inversa.
* Automatizar consultas mediante bots o scripts externos.

---

## 6. Aportes de Usuarios y Contenido Subido

El usuario puede aportar:

* Experiencias técnicas
* Casos reales de obra
* Imágenes

Al subir contenido, el usuario:

* Conserva la autoría de su material.
* Otorga a Criterio Térmico una **licencia no exclusiva** para usarlo con fines de:

  * análisis técnico
  * mejora del sistema
  * contenido educativo y comunitario

Las imágenes pueden ser analizadas mediante herramientas de inteligencia artificial con fines orientativos.

---

## 7. Responsabilidad sobre Análisis por IA

Los análisis automáticos:

* No constituyen diagnóstico definitivo.
* No sustituyen la evaluación profesional en obra.
* Se brindan como apoyo técnico.

---

## 8. Modificaciones del Servicio

Criterio Térmico se reserva el derecho de:

* Actualizar contenidos
* Modificar funcionalidades
* Ajustar planes y precios

Las modificaciones no afectarán derechos adquiridos durante el período contratado.

---

## 9. Terminación

El incumplimiento de estos términos podrá resultar en la suspensión o cancelación de la cuenta sin derecho a reclamo.

---

## 10. Aceptación

El uso de la plataforma implica la aceptación plena de estos Términos de Uso.

---

# Apéndice Técnico — Endpoints Protegidos

## Principio General

Toda lógica que represente **criterio técnico, know-how o decisión automática** reside exclusivamente en backend.

---

## Endpoints Backend de Acceso Restringido

### Cálculo Térmico

* POST /api/calculate/thermal-power
* POST /api/calculate/room-losses

### Dimensionamiento

* POST /api/dimension/radiators
* POST /api/dimension/boiler
* POST /api/dimension/pipes

### Diseño Hidráulico

* POST /api/design/pipe-routing
* POST /api/design/circuit-balance

### Presupuestación

* POST /api/budget/generate
* POST /api/budget/optimize

### Simulación

* POST /api/simulator/run
* POST /api/simulator/export-pdf

### IA y Análisis

* POST /api/ai/image-analysis
* POST /api/ai/diagnosis

---

## Frontend (Solo Inputs y Visualización)

Permitido en frontend:

* Captura de datos
* Visualización de resultados
* Gráficos y advertencias
* Explicaciones simplificadas

No permitido en frontend:

* Fórmulas completas
* Factores de corrección
* Algoritmos de decisión

---

**Documento vivo — sujeto a evolución junto con la plataforma Criterio Térmico.**
