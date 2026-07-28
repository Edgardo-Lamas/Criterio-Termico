# Borrador — Capítulo 14: Experiencias reales y aportes de la comunidad

Escrito el 2026-07-28. **Sin aprobar y sin publicar.** El capítulo está marcado
`disponible: false` en `ManualTecnico.tsx` hasta que se resuelvan las dos cosas
que se listan al final.

**Falta un dato que solo aporta Edgardo:** qué gana el instalador que aporta.

---

## Por qué existe este borrador

El párrafo de cierre del prólogo (ya publicado) promete comunidad:

> Este no es un curso cerrado. El manual crece con lo que aparece en obra: la
> experiencia que un instalador documenta se estudia y, cuando suma, entra con el
> reconocimiento de quien la trajo. El objetivo de fondo es ese: que el oficio se
> ayude, y que lo que a uno le costó resolver no haya que volver a pagarlo cada vez.

Hoy el manual no explica en ningún lado cómo se aporta. Este capítulo es esa
explicación.

---

## Texto propuesto

> Los capítulos anteriores son criterio probado. Este es el que todavía se está
> escribiendo, y no lo escribe una sola persona.
>
> Cada instalador tiene obras que le enseñaron algo: la que no calentaba y el
> motivo no era el que parecía, la maniobra que en el manual del fabricante
> figura de una forma y en obra se hace de otra, el material que prometía y no
> rindió. Ese conocimiento normalmente se pierde: queda en la memoria del que
> estuvo ahí y, como mucho, en la del oficial que lo acompañaba.
>
> ### Qué sirve como aporte
>
> No hace falta que escribas bien ni que armes un informe. Con tres cosas alcanza:
>
> - **Qué pasaba.** El síntoma, como lo viste: qué no calentaba, qué ruido hacía,
>   qué marcaba el manómetro.
> - **Qué era.** La causa que encontraste, y cómo llegaste a ella.
> - **Cómo lo resolviste.** La maniobra concreta, con los materiales que usaste.
>
> Si tenés fotos, mejor: una foto de obra explica lo que tres párrafos no.
>
> ### Qué pasa cuando llega
>
> Se lee y se estudia. Se contrasta con la ingeniería y con lo que se ve en otras
> obras, igual que el resto del manual: acá no entra nada porque alguien lo dijo.
> Si el criterio se sostiene, se suma como caso documentado y queda a nombre de
> quien lo trajo.
>
> Si no se sostiene, también te vas a enterar y por qué. Muchas veces eso vale
> más que la publicación.
>
> ### [HUECO — CRITERIO DE EDGARDO] Qué gana el que aporta
>
> Acá va lo que él defina: consultas al asistente, días de Pro, descuento en la
> suscripción. Hace falta el número o el concepto; la redacción sale de ahí.

---

## Decisiones de redacción, para discutir

- **Es corto a propósito.** Un capítulo que pide participación no puede ser una
  lectura larga: cuanto antes llegue el instalador a "qué tengo que mandar", mejor.
- **"No hace falta que escribas bien"** está puesto porque es la barrera real: el
  que tiene la mejor obra para contar suele ser el que menos ganas tiene de
  redactarla. Si el tono no cierra, se saca.
- **"Acá no entra nada porque alguien lo dijo"** sostiene el criterio del prólogo
  —el contenido no sale de debate— sin entrar en polémica con nadie.

---

## Qué falta antes de publicarlo

1. **El hueco de arriba** (qué gana el que aporta) y la corrección de Edgardo
   sobre el resto del texto.
2. **Una puerta real.** `ContribucionForm` + `useContribucionesStore` existen en
   el código pero escriben en `localStorage` y ahí mueren: el punto de entrada se
   sacó en la auditoría (C-4, opción B) porque no había forma de procesarlas.
   Publicar el capítulo sin esto lo convierte en una promesa vacía — el mismo
   error que las fotos rotas (ver `docs/fotos-manual.md`).

   Para que funcione hace falta: tabla `contributions` en Supabase con RLS,
   Storage para las fotos, y un modo de que Edgardo revise y apruebe. El plan
   original contemplaba además un pre-análisis con IA antes de la aprobación
   manual.
3. **Registrar el contenido** en `manualContent` (`app/src/content/manual/index.ts`)
   y recién ahí pasar el capítulo a `disponible: true`. ⚠ Un capítulo marcado
   disponible que no esté en `manualContent` cae en la pantalla "Contenido en
   desarrollo" — es exactamente lo que le pasaba al capítulo 13.
