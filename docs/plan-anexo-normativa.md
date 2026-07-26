# Anexo de normativa — estado, decisiones y material verificado

**Fecha de esta revisión:** 2026-07-26
**Estado:** investigación cerrada, contenido sin escribir.

---

## 1. Decisión de estructura

La normativa **va como anexo, no como capítulo nuevo**. Razones:

1. No renumera el índice v1.0, que está aprobado. Un capítulo 13 corría errores al 14
   y comunidad al 15, y la regla del manual es evolucionar sin romper versiones anteriores.
2. La normativa se actualiza: leyes que cambian, normas IRAM que se reeditan.
   Concentrarla en un lugar hace que actualizar sea un archivo y no una cacería por 14 capítulos.
3. El material es transversal: IRAM 11603 toca los capítulos 3 y 4; los límites de
   responsabilidad tocan el 12 y el 13. No pertenece a ningún capítulo en particular.

### Estructura propuesta

**Parte VI – Anexos**

- **Anexo A — Marco normativo argentino.** Material de referencia, se consulta.
- **Anexo B — Hasta dónde llega el instalador.** Material de criterio, se aplica.

**Riesgo conocido:** un anexo que nadie abre es un apéndice muerto. Debe quedar
enlazado desde el cuerpo — cap. 3 cuando aparezca la zona bioambiental, cap. 12
al cerrar la puesta en marcha.

### Cambios de código que implica

- `ManualTecnico.tsx:12` — `numero: number` no admite un anexo "A".
  Pasar a `number | string`.
- `ManualTecnico.tsx:263` — el texto "14 capítulos · 5 partes" está hardcodeado.
  Actualizarlo **contando**, no estimando.
- `content/manual/index.ts` — registrar los TSX nuevos.

---

## 2. Reglas de contenido para este anexo

1. **Las medidas propias no se tocan.** Paso 15 cm y 7 m/m² en piso radiante,
   caldera = suma de cargas ÷ 0,80. La normativa se cita como respaldo, nunca
   reemplaza el criterio de obra propio.
2. **El encuadre no es punitivo.** En Argentina no hay control efectivo en obra:
   no hay inspectores que verifiquen una instalación. El ángulo no es "te multan",
   es **respaldo del instalador**: el que hizo las cosas bien y lo puede demostrar
   sigue trabajando cuando algo falla.
3. **Ninguna cifra sin fuente verificable.** Vale para este anexo y para todo el sitio.
4. **Toda cita lleva fecha de verificación.** Ver sección 5.

---

## 3. Material verificado

### 3.1 IRAM 11603 — Clasificación bioambiental

**Cita correcta:** IRAM 11603:2012, 3.ª edición — *"Acondicionamiento térmico de
edificios. Clasificación bioambiental de la República Argentina"*. Reemplaza la
edición de diciembre de 1996.

Verificado:

- Seis zonas: **I** muy cálida, **II** cálida, **III** templada cálida,
  **IV** templada fría, **V** fría, **VI** muy fría.
- Las zonas frías (IV, V, VI) se delimitan por **grados-día para necesidades de
  calefacción**; las cálidas, por temperatura efectiva corregida (TEC).
- Datos climáticos de **96 estaciones meteorológicas**, período 1980/2009.

Dos criterios directamente aplicables en obra:

- **Situación de borde.** Una localidad en el límite entre dos zonas debe satisfacer
  **las condiciones más desfavorables**, y las consideraciones microclimáticas
  prevalecen sobre las generales de la zona. Coincide con el criterio conservador
  del proyecto.
- **Advertencia de la propia norma.** Los valores de TEC se usaron *exclusivamente*
  para armar la clasificación y **no deben usarse para balances térmicos de
  dimensionamiento**. Vale como advertencia explícita en el manual: alguien puede
  agarrar esos números y meterlos en un cálculo de potencia.

> ⚠ **No usar el borrador.** Circula un PDF "Esquema 1 de Norma IRAM 11603",
> marcado DOCUMENTO EN ESTUDIO, de noviembre de 2011. **No es la norma publicada.**
> Diferencia comprobada: el borrador habla de 90 estaciones meteorológicas y la
> edición 2012 trae 96. Los valores numéricos de isolíneas (TEC y grados-día) que
> aparecen en ese borrador **no están verificados contra la edición vigente**.

**Falta:** los valores exactos de isolíneas por zona y, sobre todo, el **listado de
departamentos por provincia** (Anexo B de la norma) — que es lo que un instalador
necesita, porque su pregunta real es "¿en qué zona estoy?".

**Recomendación:** comprar la IRAM 11603:2012. Gasto único, pasa a ser un activo
del manual. Sin ella siempre vamos a citar de segunda mano.

### 3.2 CABA — Registro de artefactos térmicos

**Cita correcta, con las dos patas:**

- **Código de Edificación de CABA, Art. 5.1.6** — *"Conservación de Instalaciones
  Térmicas"*. Es el **artículo marco**: obliga a inscribir los artefactos en el
  registro y pone la conservación a cargo del propietario. Remite al Reglamento
  Técnico para los requisitos concretos.
- **Resolución 412/AGC/19, Anexo III** — es el **Reglamento Técnico** que lo
  desarrolla: check list, periodicidades, libro digital, oblea QR.

> ⚠ Los artículos 2.2, 4.3, 4.5.3, 4.6, 4.8.2 y 4.9 pertenecen al **Anexo III de la
> Resolución**, no al Código de Edificación. Citarlos como "Art. 4.6 del Código"
> es un error: quien lo busque no lo encuentra.

**Umbral de alcance — el dato que define todo:**

Deben registrarse los artefactos térmicos que **superan 50.000 kcal/h o 300 litros**.

| Equipo | Potencia | ¿Alcanzado? |
|---|---|---|
| Mural | hasta 35.000 kcal/h | **No.** Queda entera afuera |
| Bajomesada | hasta 100.000 kcal/h | **Depende.** El umbral la parte al medio |
| Sala de calderas (4 × 35.000 en cascada) | 140.000 kcal/h | Sí |

**Consecuencia:** la caldera mural de una vivienda unifamiliar **no tiene marco
normativo de mantenimiento obligatorio** en CABA.

**Periodicidades de certificación** (varían según el equipo, no son todas cuatrimestrales):

| Artefacto | Periodicidad |
|---|---|
| Caldera de vapor de alta presión | Trimestral |
| Caldera de agua caliente, vapor de baja presión, fluido térmico | Cuatrimestral |
| Acumulador de agua (termotanque) | Semestral |

**Constancias:** libro digital por artefacto (informe regular a cargar dentro de las
72 h, con dictamen tipo "apto" / "apto requiere mejoras menores" / "no apto") y
**oblea con código QR de vigencia anual**, exhibida junto al artefacto.

---

## 4. Alcance del Anexo B — corregido

**El mantenimiento de calderas NO es trabajo del instalador.** Lo hace un técnico
específico. El suscriptor de Criterio Térmico es instalador: su trabajo es la
instalación, la reparación por pérdidas y el reemplazo de calderas o radiadores.
Ante un problema de caldera, llama al técnico.

Por lo tanto el Anexo B **no es un protocolo de mantenimiento**. Es:

1. **Dónde termina la responsabilidad del instalador.** Qué es problema de
   instalación y qué es problema de caldera. El check list de la Res. 412/AGC/19
   entra sólo como referencia de qué hace el técnico, para saber qué pedirle —
   nunca como tarea a ejecutar.
2. **Qué corresponde avisarle al propietario.** Si la instalación queda alcanzada
   por el registro (bajomesada de más de 50.000 kcal/h, edificios), el propietario
   necesita un certificante. El instalador no certifica, pero saberlo y decirlo
   lo separa del que instala y se va.

**Alcance declarado del manual:** vivienda unifamiliar — mural hasta 35.000 kcal/h
y bajomesada hasta 100.000 kcal/h. El anexo cierra diciendo explícitamente que de
ahí para arriba es otro terreno.

---

## 5. La normativa se actualiza — cómo lo resolvemos

Contenido normativo sin mecanismo de actualización se pudre solo: a los dos años
el manual afirma cosas viejas con total seguridad y nadie se entera.

**Fuente única de datos**, en `src/content/manual/normativa.ts`:

```ts
export interface Norma {
    id: string              // 'iram-11603'
    organismo: 'IRAM' | 'CABA' | 'PBA' | 'ENARGAS' | 'Nacional'
    codigo: string          // 'IRAM 11603'
    edicion: string         // '2012'
    titulo: string
    alcance: string         // para qué la citamos nosotros
    estado: 'vigente' | 'derogada' | 'reemplazada'
    reemplazadaPor?: string
    verificadaEl: string    // '2026-07-26'
    fuente?: string
}
```

Los capítulos citan con `<CitaNorma id="iram-11603" />` y el Anexo A se arma solo
desde ese archivo. Una norma cambia, se toca un renglón, se actualiza en todos lados.

**`estado` en vez de borrar:** una instalación de 2015 se hizo bajo la norma de
entonces, y el que la revisa hoy necesita saber qué regía cuando se hizo.

**⚠ Riesgo con el RAG.** El asistente busca sobre `public.conocimiento` con
embeddings. Si los anexos se indexan y después se actualiza una norma, **el
asistente sigue respondiendo con la versión vieja hasta que se reindexe** — y lo
hace con total seguridad, porque para él ese fragmento es la fuente. El reindexado
tiene que ser parte del flujo de actualización, no un paso que uno recuerda hacer.

---

## 6. Pendientes de verificación

- [ ] **IRAM 11603:2012** — conseguir la edición vigente. Faltan los valores de
      isolíneas por zona y el listado de departamentos por provincia.
- [ ] **Res. 412/AGC/19** — es de 2019; no está confirmado que siga sin
      modificaciones. Verificar antes de publicar.
- [ ] **El borde de la cascada.** Cuatro murales de 35.000 kcal/h suman 140.000,
      pero ninguna supera el umbral individualmente. ¿El límite se cuenta por
      artefacto o por instalación? Sin fuente. Consultar a la AGC. **No suponerlo.**
- [ ] **Umbral exacto:** "superen 50.000" o "a partir de 50.000". Para una caldera
      de exactamente 50.000 kcal/h, cambia. Confirmar en fuente oficial.
- [ ] **Nombre del registro:** el propio gobierno usa **RAT** y **RIT** en distintas
      páginas para lo mismo. Determinar cuál es el vigente.
- [ ] **IRAM 11900, IRAM 62406, Ley 13059 (PBA), Ley 4458 (CABA)** — mencionadas,
      sin verificar contenido ni vigencia.

---

## 7. Descartado

- **Cifra de ahorro energético del 50 % al 65 %** por ajustar el diseño a la zona
  bioambiental. Aparece sin documento, año ni organismo. No entra sin fuente exacta.
- **Separación de cañerías de piso radiante de 20 a 30 cm.** El criterio del
  proyecto es paso fijo de 15 cm y no se modifica. Si se menciona, es para explicar
  la diferencia con lo que se ve en el mercado, nunca como corrección.
- **Salas de calderas y cascadas.** Otras potencias, ACS, sala de máquinas,
  ventilaciones, ENARGAS. Es otro producto, no este manual.
- **Protocolo de mantenimiento de calderas.** Es trabajo de técnico, no de instalador.

---

## 8. Temas abiertos, para otra sesión

- **Radiadores de fundición.** Térmicamente superiores a los de aluminio y con más
  vida útil. Reemplazar fundición por aluminio es un error frecuente. Hay demanda
  nueva por las reversiones de estilo vintage. Faltaría material de alturas,
  potencias y criterios de elección.
- **Salida de gases** al reemplazar una caldera: es lo que hay que mirar, más allá
  de respetar la potencia.
- **Actualización de la plataforma** (distinto de la actualización normativa):
  fecha de última actualización visible por capítulo, registro de cambios del
  manual —que además vende, porque muestra que el producto está vivo— y
  reindexado del RAG en cada cambio.

---

## ► PRÓXIMA SESIÓN — arrancar por acá

La investigación está cerrada. **No hay que volver a buscar normativa**: lo verificado
está en la sección 3 y lo descartado en la sección 7.

**Camino A — escribir ya, con lo verificado.** No depende de conseguir ninguna norma:

1. Andamiaje, que no necesita contenido: `normativa.ts` con la interfaz `Norma`
   (sección 5), componente `CitaNorma`, `numero: number | string` en
   `ManualTecnico.tsx:12`, Parte VI con los dos anexos.
2. **Anexo A** con las seis zonas de la IRAM 11603:2012, el criterio de borde y la
   advertencia sobre no usar los valores de TEC para dimensionar. Sin la tabla de
   departamentos, que se suma cuando esté la norma.
3. **Anexo B** con el umbral de 50.000 kcal/h y los límites de responsabilidad del
   instalador. **Requiere input de Edgardo**: de los 12 puntos del check list de la
   Res. 412/AGC/19, cuáles corresponden al técnico y dónde exactamente termina el
   trabajo del instalador.
4. Enlazar desde el cap. 3 y el cap. 12, y actualizar el contador de
   `ManualTecnico.tsx:263` **contando**.
5. Reindexar el RAG.

**Camino B — desbloquear lo que falta.** Comprar la IRAM 11603:2012 (tabla de
departamentos por provincia) y consultar a la AGC por el borde de la cascada
(sección 6).

**Herramienta:** el cuaderno de NotebookLM "Normativas de Calefacción" es
`notebooklm.google.com/notebook/e5723b94-1b9e-4260-93b1-30f6a1f758d2`. La sesión
automatizada **quedó sin autenticar** — hay que rehacer el login con
`python3 scripts/run.py auth_manager.py reauth` desde
`~/.claude/skills/notebooklm`, con la cuenta de Google que tiene ese cuaderno.
Mientras tanto funciona igual pegando las respuestas a mano.

---

## Fuentes consultadas

- [Catálogo Biblioteca CPAU — IRAM 11603](https://cpau.opac.com.ar/pergamo/documento.php?ui=1&recno=41881&id=CPAU.1.41881)
- [SEDICI UNLP — Norma IRAM 11603](http://sedici.unlp.edu.ar/handle/10915/79505)
- [Esquema 1 de Norma IRAM 11603 (borrador nov. 2011 — **no citar como norma**)](https://procesosconstructivos.wordpress.com/wp-content/uploads/2011/08/iram-11603-e1.pdf)
- [Código de la Edificación CABA — CEDOM](https://www.cedom.gob.ar/legislacion/normas/codigos/edifica/index6.html)
- [Resolución 412/AGC/19 — texto completo (PDF)](https://revdelascensor.com/wp-content/uploads/2025/03/ck_PE-RES-MJYSGC-AGC-412-19-5706.pdf)
- [Registro de Artefactos Térmicos (RAT) — AGC, Gobierno de CABA](https://www.buenosaires.gob.ar/agc/registro-de-artefactos-termicos-rat)
- [Control de Artefactos Térmicos — umbral, alcance y periodicidades](https://www.prevencionemede.com.ar/notas/control_artefactos_termicos.html)
- [Certificación por profesionales certificantes — Gobierno de CABA](https://www.buenosaires.gob.ar/tramites/registro-de-artefactos-termicos-por-parte-de-profesionales-certificados-calderas)
