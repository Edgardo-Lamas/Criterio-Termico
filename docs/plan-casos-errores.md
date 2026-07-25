# Plan de casos de errores — qué falta documentar

Documento de trabajo abierto el 2026-07-24. Lista los huecos del contenido de
`app/src/content/errores` para escribirlos en sesiones siguientes.

**El contenido técnico lo aporta Edgardo.** Acá están marcados el hueco y la razón
por la que un instalador lo buscaría; las respuestas no están escritas a propósito.

---

## 0. PRIORIDAD: auditar el contenido existente

**Abierto el 2026-07-24, antes que cualquier caso nuevo.**

Revisando `prueba-hidraulica` (tier **pro**, o sea contenido pago) apareció una frase
con dos errores técnicos, detectados por Edgardo:

> *"purgar completamente el aire del sistema: el aire comprimido es peligroso y
> además genera lecturas de presión falsas"*

1. **No es aire comprimido.** El comprimido es el que se inyecta con una herramienta.
   Lo que se purga es el aire natural que ya estaba en radiadores y tuberías y quedó
   encerrado al llenar con agua; se junta en las partes altas, y para eso existen los
   purgadores.
2. **Ese aire no genera lecturas falsas.** El manómetro no distingue densidades de
   fluido: lee la presión del circuito y nada más.

Ya está corregido (commit `8aea7ae`), pero **el hallazgo importa más que la
corrección**: si esto estaba publicado en un caso pro, hay que revisar los 17 con
Edgardo antes de sumar contenido nuevo. Un error técnico en contenido pago le cuesta
al negocio mucho más que la falta de un caso.

**Cómo hacerlo:** caso por caso, Edgardo leyendo y marcando; yo corrijo y dejo
registro de qué se cambió y por qué. Prioridad a los `pro` y `premium`.

## 1. Qué hay hoy: 17 casos

8 free · 8 pro · 1 premium. Entre 616 y 2.050 palabras cada uno.

| Categoría | Casos |
|---|---|
| Química del agua / Corrosión | sarro en el intercambiador · pasivador incompatible con aluminio |
| Componentes hidráulicos | membrana del vaso pinchada · agua de red que entra al circuito |
| Dimensionamiento | la caldera cicla · la casa no calienta con el cálculo bien |
| Diseño de tuberías | ramal robado · empalmes de piso radiante empotrados |
| Desbalance hidráulico | radiadores lejanos fríos |
| Acumulación de lodos | radiador frío en la parte inferior |
| Materiales y sellado | goteos en uniones después de la puesta en marcha |
| Tuberías y materiales | el tubo PEX se estranguló en obra |
| Verificación y puesta en marcha | circuito cruzado y prueba hidráulica mal ejecutada |
| Protección y mantenimiento | congelamiento en zonas frías |
| Ubicación y convección | cortinas largas sobre radiadores |
| Velocidad excesiva | ruidos en las tuberías |
| Eficiencia | factura de gas muy alta |

**Observación de fondo:** los 17 responden a la misma pregunta — *"está instalado y
anda mal, ¿por qué?"*. No hay ningún caso de **ejecución**: cómo se hace bien la
maniobra. Ese es el hueco más grande y es donde caen casi todos los temas que
Edgardo propuso.

**Las categorías están sobre-fragmentadas:** 13 para 17 casos. "Tuberías y
materiales", "Diseño de tuberías" y "Materiales y sellado" son el mismo cajón, y
"Velocidad excesiva" no es una categoría sino la causa del caso de ruidos. Al sumar
casos nuevos conviene reagrupar en 5-6 familias, o el buscador del SaaS no ayuda.

---

## 2. Huecos DENTRO de casos que ya existen

Lo más barato y lo más rentable: el caso ya está escrito y le falta el dato que el
instalador busca. Verificado leyendo los archivos, no de memoria.

### 2.1 · `selladores-rosca` — falta el sentido de aplicación
*Propuesto por Edgardo.*

El caso explica los cuatro selladores (teflón, cáñamo, pasta, anaeróbico) y cuándo
usar cada uno, pero **no dice para qué lado se enrolla sobre la rosca**. Cero
menciones de sentido / horario / antihorario en todo el archivo.

Es lo primero que busca alguien que viene de otro oficio, y aplicado al revés el
sellador se desarma al roscar.

### 2.2 · `prueba-hidraulica` — falta el efecto de la temperatura
*Propuesto por Edgardo.*

El caso tiene una sección "Verificación final a temperatura de trabajo", pero **cero
menciones de dilatación o de temperatura ambiente**. Falta responder lo que Edgardo
planteó: *dejo la instalación presurizada para control, la presión baja y no aparece
ninguna pérdida — ¿qué tiene que ver el calor del ambiente?*

Es el caso que hace dudar al instalador de una obra que en realidad está bien, y lo
lleva a buscar una fuga que no existe. Se conecta con el protocolo de Edgardo (6 bar
de prueba, manómetro con by-pass y 3 bar hasta fin de obra).

### 2.3 · `calidad-agua` — falta con qué se trata el agua
*Propuesto por Edgardo.*

El caso tiene una sección titulada "Cuando no hay otra opción: agua tratada" que
**no nombra un solo equipo**: cero menciones de polifosfato, ablandador, ósmosis,
descalcificador o filtro. Explica el problema y no dice con qué se resuelve.

A cubrir: filtros de polifosfato, ablandadores de resina, y si la ósmosis inversa
conviene o no para un circuito de calefacción — Edgardo tiene la duda planteada y
la respuesta es criterio de obra, no folleto de proveedor.

---

## 3. Casos nuevos propuestos por Edgardo

| # | Caso | Nota |
|---|---|---|
| 1 | **Termofusión: ¿es fusión o es pegado?** Temperatura, tiempo de calentado, tiempo de enfriado sin mover la pieza | El que viene de sanitaria lo hace a ojo |
| 2 | **Cómo aflojar piezas con tuercas y roscas sin romperlas** | Maniobra de todos los días, no está documentada en ningún lado |
| 3 | **Por qué no conviene tubo sin barrera antioxígeno en calefacción** | Hoy aparece de pasada en `pex-memoria-termica` y en `radiador-frio-abajo` como una causa más de lodos; nunca explicado como tema propio |

El #3 tiene una particularidad: el concepto ya está usado dos veces como causa, pero
el instalador que compra el tubo no tiene dónde leer por qué importa. Es candidato a
caso free, porque decide una compra antes de la obra.

---

## 4. Casos nuevos propuestos (a validar con Edgardo)

### A · Ejecución y montaje — el hueco grande

| # | Caso | Por qué lo buscaría |
|---|---|---|
| A1 | Cada material se une distinto: termofusión, prensado, pegado, roscado, soldadura — cuál va con cuál y qué no se mezcla | El error de origen del que cruza de oficio |
| A2 | Corte del tubo: escuadra, rebaba, biselado | Falla que aparece semanas después |
| A3 | Sobre-apriete de roscas y fittings | Oficio de fuerza aplicado a un material que no la tolera |
| A4 | Dilatación: liras, puntos fijos, abrazaderas que no dejan mover | Ruido y rotura que nadie asocia a la causa |
| A5 | Soportería: separación de grapas según material y diámetro | Se hace "cada tanto" y el tubo panza |
| A6 | Pasos de muro y losa: vaina, nunca mortero directo | Se descubre cuando hay que romper |

### B · Gas y evacuación — cero casos hoy

El público principal del sitio es el gasista y no hay un solo caso de su terreno:
ventilaciones y rejillas, conducto de evacuación (pendiente, longitud, terminal),
recirculación de gases, dimensionado de la cañería y caída de presión.

**Cuidado con este bloque:** es materia reglamentada y el error mata. Es el contenido
de mayor autoridad que se puede publicar y también el que más cuidado necesita en
cómo se redacta.

### C · Eléctrico y control — cero casos hoy

Termostato mal ubicado (sobre fuente de calor, en pared fría, en un ambiente que no
representa la casa), bomba o válvula sin ciclo correcto, puesta a tierra. El H1 del
sitio promete cuatro oficios y la electricidad no aparece en ningún caso.

### S · Seguridad e higiene en la obra — cero casos hoy
*Planteado por Edgardo.*

No se habló del tema en ningún caso, y es el único bloque donde el error no arruina
una instalación sino que lastima a alguien. Temas candidatos, para que Edgardo marque
cuáles vio pasar de verdad:

> **Corrección 2026-07-24.** Acá figuraba "probar con aire comprimido en vez de
> agua" como caso candidato. **Estaba mal planteado y lo saqué**: según Edgardo, en
> calefacción no es un error que se cometa — se prueba con agua justamente porque con
> aire no se ve de dónde sale la pérdida. La prueba con aire es el procedimiento de
> **gas** (hermeticidad), otro oficio. Salió de conocimiento general de ingeniería,
> no del contenido ni del criterio de obra.

| Tema | Por qué |
|---|---|
| Trabajo con llama abierta y soldadura | Qué hay alrededor cuando se suelda, y qué tiene que estar a mano |
| Monóxido en pruebas de encendido | Sala cerrada, equipo funcionando |
| Purga y vaciado en caliente | Quemaduras: cuándo esperar |
| Manipulación de químicos | Pasivadores, inhibidores, glicol: protección y qué hacer ante contacto |
| Intervenir con tensión presente | Antes de tocar bomba, válvulas o termostato |
| Peso y postura | Radiadores de fundición, calderas, colectores |
| Trabajo en altura | Colectores altos, radiadores en planta alta |
| Orden y limpieza | La parte de "higiene": tubos y recortes en el piso de una obra en marcha |

Mismo cuidado que el bloque de gas: acá lo que se publica puede terminar en una
decisión de alguien que está solo en una obra. Conviene redactarlo con Edgardo
dictando y sin inventar ni un dato.

### D · Puesta en marcha

Orden de llenado y purgado, presión en frío contra presión en caliente, barrido del
circuito antes de arrancar. Hoy hay uno solo (`prueba-hidraulica`).

---

## 5. Orden sugerido

1. **Los tres huecos de la sección 2** — el caso ya existe, se agrega la sección que
   falta. Menos trabajo por unidad de valor que cualquier caso nuevo.
2. **Los tres de Edgardo de la sección 3** — salieron de su memoria de obra, que es
   el mejor indicador de frecuencia real que hay.
3. **Familia A (ejecución)** — son preguntas que el instalador tipea literal en
   Google ("para qué lado va el teflón", "a qué temperatura se fusiona el caño") y
   hoy nadie las contesta bien en Argentina. Sirven al SaaS y a `/oficio` del sitio
   con el mismo material.
4. **Familia B (gas)** — la de mayor autoridad, cuando haya tiempo para redactarla
   con el cuidado que pide.

## 6. Al escribir cada caso

- Estructura del archivo: metadata (`id`, `titulo`, `categoria`, `tier`, `preview`,
  `resumen`) + componente de detalle. Copiar la forma de `radiadores-frios.tsx`.
- Decidir `tier`: lo que decide una compra o evita un accidente conviene `free`;
  el criterio fino, `pro`.
- Registrar el caso en `errores/index.ts`.
- El RAG se reindexa solo al pushear cambios en `src/content/errores`
  (GitHub Actions `reindex-rag.yml`).
- Al sumar casos, reagrupar las categorías (ver observación de la sección 1).
