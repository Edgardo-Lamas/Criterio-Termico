# Plan — la memoria de Martín

**Estado: diseñado, sin código.** Diseño original del 2026-09-08, replanteado el
2026-09-11 después de abrir el código.

---

## Lo que ya estaba decidido

Son **tres cosas distintas**, no una:

| | Qué resuelve | Suma por consulta |
|---|---|---|
| **Resumen de la charla** | que se acuerde de lo de hace cinco minutos sin reenviar todo | $1,40 |
| **Ficha del instalador** | zona, marcas, tipo de obra: no contárselo nunca más | $2,30 |
| **Charlas anteriores** | «¿te acordás del problema de la casa de Martínez?» | $4,60 |
| **Las tres juntas** | | **$8,30** |

Con 80 consultas al mes son **$664 por usuario: el 2% de los $30.000**.

🔑 **No es un gasto encima del historial: es lo que permite achicarlo sin que se
note.** Con la ficha y un resumen se pueden mandar seis idas y vueltas en vez de
la charla entera. El recorte ahorra ~63% del historial; la memoria cuesta 2%.

**Infraestructura nueva: cero.** `pgvector` ya está, el generador de embeddings
corre gratis dentro de Supabase (`Supabase.ai.Session('gte-small')`) y las
cuentas ya existen.

---

## 🔴 Lo que apareció al abrir el código, y ordena las etapas

**1. Las charlas no se guardan en ningún lado.** No hay tabla de conversaciones:
el chat vive en el navegador y se pierde al cerrar. Las tablas de `public` son
`profiles`, `ai_usage`, `conocimiento`, `novedades`, `consultas_abiertas`,
`contribuciones` y `suscripciones` — ninguna guarda un mensaje.

**Consecuencia directa: el resumen de la charla y las charlas anteriores no se
pueden hacer todavía.** Los dos necesitan que primero se guarde lo que se dice.
La ficha del instalador, en cambio, es una tabla y una pantalla.

**2. La ficha NO puede ir en el system prompt.** El system está cacheado y es
estable a propósito —cuatro variantes: anónimo y los tres tiers— y meterle algo
que cambia por usuario rompe la caché **para todos**. Va por
`construirContextoConsulta()`, como mensaje de rol `system` al final de
`messages`, exactamente por donde ya entra el RAG.

---

## Etapa 1 — La ficha del instalador

**Lo que la hace segura: la escribe él, no la infiere Martín.**

El cuidado serio del diseño original es que *una memoria equivocada es peor que
no tener*: si «se acuerda» de que el tipo usa una marca y el tipo cambió,
arrastra el error en todas las respuestas siguientes y con total seguridad. Si
los datos los carga el instalador en una pantalla, ese riesgo **no existe** en
esta etapa. Que Martín proponga recordar algo («¿querés que me acuerde de que
trabajás con tal marca?») es una etapa posterior, y recién con la ficha andando.

**Tabla `memoria_instalador`**, una fila por cuenta, `on delete cascade`, RLS de
`auth.uid() = user_id` para las cuatro operaciones. Cada uno ve y borra lo suyo,
y nada más.

**Pantalla**: «Qué sabe Martín de vos», dentro de la cuenta. Los campos, un botón
de guardar y un **«borrar todo»** que deja la ficha vacía de verdad.

**Cómo entra a la respuesta**: una parte más en `construirContextoConsulta()`,
con la instrucción de usarla para no volver a preguntar lo que ya le dijeron —
**y de no recitarla**. Un asistente que arranca cada respuesta repitiendo la
ficha es peor que uno que no la tiene.

⬜ **LOS CAMPOS LOS DEFINE EDGARDO.** Qué dato cambia de verdad una respuesta en
obra es criterio suyo, no mío. La propuesta a corregir está al final.

## Etapa 2 — Guardar las charlas, y el resumen

Lo que de verdad permite bajar `MENSAJES_AL_MODELO` de 8. Necesita tabla de
conversaciones y mensajes, RLS, y un resumen que se reescriba cada N turnos.
🔴 **Acá empiezan a guardarse datos de terceros** —si un instalador cuenta la
obra de un cliente, eso queda escrito—: tiene que estar en la política de
privacidad y tiene que poder borrarse. No se arranca sin eso.

## Etapa 3 — Charlas anteriores

Búsqueda semántica sobre lo guardado en la etapa 2. Es la más cara ($4,60) y la
que más datos de terceros toca. **Se decide cuando las dos anteriores estén
andando**, no antes.

---

## La ficha que propongo, para que él la corrija

Ninguno es obligatorio: la ficha vacía deja a Martín como está hoy.

| Campo | Por qué cambiaría una respuesta |
|---|---|
| **Zona donde trabaja** | la temperatura de diseño y las pérdidas salen de ahí |
| **Qué instala más** | radiadores · piso radiante · las dos |
| **Tipo de trabajo** | obra nueva · reforma · service y reparación |
| **Combustible** | gas natural · envasado · las dos cosas |
| **Marcas con las que trabaja** | de qué manual sale la tabla de fallas que le sirve |
| **Nota libre** | lo que él quiera que Martín sepa, en sus palabras |

⬜ **Las preguntas que quedan abiertas y son suyas:** ¿sobra alguno? ¿falta
alguno que en obra cambie la respuesta y acá no esté? ¿El combustible se
pregunta así o se pregunta de otra manera?
