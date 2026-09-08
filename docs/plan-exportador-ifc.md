# Plan: arreglar el exportador IFC del Simulador

> Auditado el 2026-07-30. Reverificado el 2026-08-09.
>
> ✅ **RESUELTO el 2026-09-08.** Los tres bugs del plan, más dos que la auditoría no
> había visto: **los radiadores no se exportaban** y **el esquema declarado era falso**.
> Rama `arreglo/exportador-ifc`. Siete casos nuevos en
> `app/src/components/simulador/utils/ifcExporter.test.ts` fijan cada invariante,
> porque ninguno de estos errores daba error: el archivo se generaba igual.
>
> **Lo que NO se hizo, y sigue abierto:** colectores (`IfcDistributionChamberElement`)
> y ambientes (`IfcSpace`) con la carga térmica. Ver «Pendientes menores».

> **La parte de render 3D salió de este documento el 2026-08-09.** Se mudó a un proyecto
> aparte: `~/Desktop/Trabajos/salas-de-maquinas/`. Motivo: es Python + Blender corriendo
> local, con piezas 3D pesadas, y no puede vivir en el repo de un SaaS que publica a
> producción con cada push.

---

## Qué es esto y para qué sirve

El IFC es un formato de archivo estándar para intercambiar proyectos de construcción. Sirve
para **darle el archivo a otro** —un estudio, un arquitecto, otro instalador— y que lo abra
en su programa. El Simulador ya tiene el exportador escrito.

Archivo: `app/src/components/simulador/utils/ifcExporter.ts`
Enganchado en: `app/src/components/simulador/components/Toolbar/Toolbar.tsx`

**Lo bueno:** el andamiaje está completo y bien hecho — unidades, contexto geométrico,
jerarquía sitio→edificio→plantas, property sets, GUIDs válidos, encabezado IFC2X3. Es el 80%
tedioso, y ya está.

**Lo malo: hoy el archivo que genera no abre bien en ningún visor.**

---

## ✅ Antes que los bugs: verificar la escala

**No coincidía.** El simulador mide a **50 px/m** (`PIXELS_PER_METER`, `floorHeating.ts:17`)
y el exportador tenía escritos a mano los 100 px/m de la escala vieja — el propio test del
ruteador lo dice: *«no los 5 m que daba la escala vieja de 100 px/m»*. **Todo el modelo se
exportaba a la mitad del tamaño real**: un archivo de Edgardo del 8/9 medía 4 × 6 m cuando
debía medir 8 × 12.

Arreglado importando la constante del simulador: `PIXELS_TO_METERS = 1 / PIXELS_PER_METER`.
Nunca volver a escribir el número a mano.

⬜ **Queda por confirmar**, que era la otra mitad de esta pregunta: qué pasa cuando el
usuario sube un plano con SU propia escala. Hoy el exportador asume siempre los 50 px/m
del canvas.

---

## ✅ Bug 1 — El proyecto se genera dos veces (bloqueante)

`exportProject()` llama a `setupProject()` (línea 727) y después `generate()` lo vuelve a
llamar (línea 682). El archivo sale con **dos `IFCPROJECT`, dos `IFCSITE`, dos `IFCBUILDING`
y cuatro `IFCBUILDINGSTOREY`**. Un IFC admite **un solo `IFCPROJECT`** — es la raíz de toda
la estructura. Con dos, el visor lo rechaza o muestra cualquier cosa.

Peor: las relaciones de calderas y caños con las plantas se crean entre las dos llamadas, así
que apuntan a las plantas del **primer** setup, mientras `storeyGroundId` / `storeyFirstId`
quedan pisados por el segundo.

**Arreglado** haciendo `setupProject()` idempotente con un guard (`projectReady`), y no
sacándole la llamada a uno de los dos: `exportProject()` NECESITA el proyecto armado antes
de exportar elementos —de ahí saca en qué planta va cada uno— y `generate()` es público y se
puede llamar solo. Con el guard, el proyecto está armado por los dos caminos y se escribe una
vez. `exportProject()` lo suelta en su reset, o una segunda exportación con el mismo objeto
saldría sin proyecto.

Confirmado en el archivo del 8/9: `#18` en la línea 26 y `#825` en la 833, dos jerarquías
completas, la segunda sin un solo elemento adentro.

---

## ✅ Bug 2 — Los caños no tienen cuerpo, solo eje

En `exportPipeSegment` (líneas 508-519) se genera únicamente la representación de eje
(`'Axis'`, `Curve3D`, línea 515) con un `IFCPOLYLINE`. El perfil circular está comentado como
sin uso. El comentario del código lo admite: *"IFC usa IfcSweptDiskSolid para tuberías, pero
simplificamos con representación de curva"*.

Resultado: **exporta alambres sin espesor, no tubos.** Los datos sí están todos y bien
(diámetro, DN, material PEX, longitud, ida/retorno, circuito, sistema).

**Arreglado** con `IFCSWEPTDISKSOLID` (radio = diámetro exterior en mm ÷ 2000, directriz = la
polilínea que ya existía), conservando el eje además del cuerpo.

🔑 El `RepresentationType` es **`'AdvancedSweptSolid'`, no `'SweptSolid'`**: `SweptSolid` es
para extrusiones y revoluciones; barrer un perfil a lo largo de una directriz cae en
`AdvancedSweptSolid` (IFC4, tabla 693). Con el tipo equivocado un visor estricto ignora el
cuerpo y estaríamos igual que antes.

De paso: el material iba clavado en `'PEX'` aunque `PipeSegment.material` lo trae.

---

## ✅ Bug 3 — La caldera queda al doble de distancia del origen

Líneas 603-627: el mismo `placement` (creado en `(x, y, z)`) se usa como posición del
`IFCEXTRUDEDAREASOLID` **y** como base del `IFCLOCALPLACEMENT` del objeto. La traslación se
aplica dos veces → la caldera aparece en `(2x, 2y, 2z)`.

**Arreglado**: el sólido va en el origen del sistema local y la posición vive una sola vez, en
el `IFCLOCALPLACEMENT`.

⚠ **Este bug y el de la escala se tapaban entre sí.** Al duplicarse la traslación, la caldera
caía en 2 × (px/100) = px/50, o sea justo donde le correspondía con la escala buena, mientras
los caños quedaban a la mitad. Arreglar uno solo desalineaba la caldera de la instalación:
van juntos.

---

## ✅ Bug 4 — Los radiadores no se exportaban (no estaba en la auditoría)

El más grande de todos, y el más fácil de no ver: el botón de la Toolbar comprobaba que
hubiera radiadores para habilitarse —`if (radiators.length === 0 && boilers.length === 0)`—
y después llamaba a `downloadIFCFile({ boilers, pipes, … })` **sin pasarlos**. El exportador
ni siquiera importaba el modelo `Radiator`. En una instalación de radiadores, el archivo
salía sin un solo radiador: en el IFC del 8/9 hay 1 caldera, 36 caños y cero radiadores.

**Arreglado**: `exportRadiator()` los escribe como `IfcSpaceHeater` con
`PredefinedType = .RADIATOR.` (IFC4, subtipo de `IfcFlowTerminal`), con la potencia en
Kcal/h y en kW, la cantidad de elementos y la altura del elemento como propiedades. El alto
del sólido sale de `alturaElementoMm`; si la batería no lo trae, 0,60 m.

⬜ **Para preguntarle a Edgardo:** el radiador se dibuja apoyado en el piso (z = 0). Si
conviene levantarlo los centímetros reales a los que va montado, es criterio de obra y la
fuente es él.

## ✅ Bug 5 — El archivo declaraba un esquema que no era el suyo

`FILE_SCHEMA(('IFC2X3'))` mientras el cuerpo escribía `IFCBOILER` y `IFCPIPESEGMENT`.
**Esas entidades no existen en IFC2X3**: ahí hay `IfcBoilerType`, `IfcPipeSegmentType` y
`IfcSpaceHeaterType`, y la ocurrencia va como `IfcFlowSegment`,
`IfcEnergyConversionDevice` o `IfcFlowTerminal`. Verificado el 2026-09-08 contra el listado
alfabético de entidades de buildingSMART.

Un visor tolerante lo abría igual (el de Edgardo lo abrió), pero Revit o Solibri pueden
descartar esos elementos sin decir nada.

**Arreglado declarando IFC4**, donde las tres entidades existen tal como el código ya las
escribía, con `ViewDefinition [DesignTransferView_V1.0]` en lugar del `CoordinationView`,
que es un MVD de 2X3.

⚠ Si algún día hace falta llegar a un programa que sólo lea IFC2X3, el cambio es rescribir
esas tres entidades como ocurrencia + `...Type`, no volver el encabezado atrás.

## Pendientes menores, en orden de importancia

- ✅ **El encabezado prometía cosas que no existen** (colectores y ambientes). Corregido: hoy
  dice lo que exporta y lo que no.
- **Colectores** como `IfcDistributionChamberElement` — hoy no se exportan. Vale la pena: es
  el elemento que el instalador más quiere ver ubicado.
- **`IfcSpace` por ambiente**, con la carga térmica como propiedad. Es lo que convierte el
  archivo en algo consultable y no un dibujo.
- `PredefinedType` en `.USERDEFINED.` (línea 543) exige que `ObjectType` esté cargado; hoy va
  `'$'`. Es un aviso de validación, no rompe.
- El `Pset_PipeSegmentCommon` usa nombres de propiedad en castellano inventados, no los del
  estándar. Importa igual como set propio. Aceptable, pero saberlo.

---

## Orden de trabajo — hecho el 2026-09-08

1. ✅ Verificar la escala. Estaba mal: 100 px/m contra los 50 del simulador.
2. ✅ Bug 1 (doble setup).
3. 🟡 Generar un IFC de prueba y abrirlo en un visor. Generado y verificado por archivo
   (388 entidades, **cero referencias colgadas**, un solo `IfcProject`, la caldera en
   (4 · 6) m y no en (8 · 12), 10 caños con cuerpo, 5 radiadores, extensión 12,80 × 11,40 m
   exacta contra los píxeles de entrada). **Falta la confirmación visual**: el visor abre el
   archivo con el selector del sistema operativo, que no se puede accionar desde acá.
   Lo mira Edgardo — el archivo quedó en `~/Downloads/prueba-ifc-arreglado.ifc`.
4. ✅ Bug 3 (caldera al doble).
5. ✅ Bug 2 (caños sin cuerpo).
6. ✅ Bug 4 (radiadores) y Bug 5 (esquema), que no estaban en la lista.

---

## Restricciones

- Esto **sí** es código de la app (el exportador vive en el Simulador, tier Premium) y va por
  el flujo normal: rama, `npm run typecheck`, tests, PR a `main`.
- El Simulador es Premium y **en producción no hay sesión**: la verificación visual va en
  `localhost:5173`.
- Sin `any` en TypeScript, CSS Modules únicamente, cálculos en el browser.

---

## Contexto: de dónde salió todo esto

Una arquitecta le sugirió a Edgardo estudiar Revit para ofrecerse a estudios de arquitectura
como dibujante de planos de calefacción. Se evaluó reemplazar Revit con FreeCAD y **se
descartó**: nada ajeno a Autodesk puede escribir `.rvt`, y el IFC de FreeCAD llega a Revit
facetado y sin propiedades. Se descartó también construir un CAD propio — años de trabajo
para terminar en el mismo puente al que se llega por el camino corto.

**Lo que quedó:** entregar el proyecto ya calculado y documentado para **sus propias obras**.
Ahí el problema del `.rvt` desaparece, porque nadie tiene que abrirlo en Revit.
**El hilo de Revit y los estudios está pausado por decisión de Edgardo.**
