# Plan: arreglar el exportador IFC del Simulador

> Auditado el 2026-07-30. Reverificado el 2026-08-09: **los tres bugs siguen ahí**, el
> archivo no se tocó desde el 30 de junio. Nada implementado.

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

## Antes que los bugs: verificar la escala

`PIXELS_TO_METERS = 0.01` (línea 40) está fijo en 100 píxeles = 1 metro. Hay que confirmar
que coincida con la escala real del canvas **cuando el usuario sube un plano** y lo escala.

Si no coincide, todo el modelo sale de tamaño equivocado y no se nota hasta abrirlo. Va
primero porque condiciona cómo se prueba todo lo demás.

---

## Bug 1 — El proyecto se genera dos veces (bloqueante)

`exportProject()` llama a `setupProject()` (línea 727) y después `generate()` lo vuelve a
llamar (línea 682). El archivo sale con **dos `IFCPROJECT`, dos `IFCSITE`, dos `IFCBUILDING`
y cuatro `IFCBUILDINGSTOREY`**. Un IFC admite **un solo `IFCPROJECT`** — es la raíz de toda
la estructura. Con dos, el visor lo rechaza o muestra cualquier cosa.

Peor: las relaciones de calderas y caños con las plantas se crean entre las dos llamadas, así
que apuntan a las plantas del **primer** setup, mientras `storeyGroundId` / `storeyFirstId`
quedan pisados por el segundo.

**Arreglo:** dejar una sola llamada. `generate()` también se puede llamar directo desde
afuera (es público), así que lo más seguro es que el setup viva ahí y `exportProject()` no lo
llame.

---

## Bug 2 — Los caños no tienen cuerpo, solo eje

En `exportPipeSegment` (líneas 508-519) se genera únicamente la representación de eje
(`'Axis'`, `Curve3D`, línea 515) con un `IFCPOLYLINE`. El perfil circular está comentado como
sin uso. El comentario del código lo admite: *"IFC usa IfcSweptDiskSolid para tuberías, pero
simplificamos con representación de curva"*.

Resultado: **exporta alambres sin espesor, no tubos.** Los datos sí están todos y bien
(diámetro, DN, material PEX, longitud, ida/retorno, circuito, sistema).

**Arreglo:** agregar una representación `'Body'` con `IFCSWEPTDISKSOLID` (perfil = radio del
caño, directriz = la polyline que ya existe). Conservar el eje además del cuerpo, que es lo
correcto en IFC.

---

## Bug 3 — La caldera queda al doble de distancia del origen

Líneas 603-627: el mismo `placement` (creado en `(x, y, z)`) se usa como posición del
`IFCEXTRUDEDAREASOLID` **y** como base del `IFCLOCALPLACEMENT` del objeto. La traslación se
aplica dos veces → la caldera aparece en `(2x, 2y, 2z)`.

**Arreglo:** el sólido va en el origen del sistema local del objeto y la posición vive solo en
el `IFCLOCALPLACEMENT`.

---

## Pendientes menores, en orden de importancia

- **El encabezado promete cosas que no existen.** Las líneas 12-17 dicen que exporta
  colectores (`IfcDistributionChamberElement`) y ambientes (`IfcSpace`). No hay tal función:
  quedó un comentario huérfano en la línea 668 sin nada debajo, y `exportProject()` solo
  recibe `boilers` y `pipes`. Corregir el comentario **o** implementar lo que promete.
- **Colectores** como `IfcDistributionChamberElement` — hoy no se exportan. Vale la pena: es
  el elemento que el instalador más quiere ver ubicado.
- **`IfcSpace` por ambiente**, con la carga térmica como propiedad. Es lo que convierte el
  archivo en algo consultable y no un dibujo.
- `PredefinedType` en `.USERDEFINED.` (línea 543) exige que `ObjectType` esté cargado; hoy va
  `'$'`. Es un aviso de validación, no rompe.
- El `Pset_PipeSegmentCommon` usa nombres de propiedad en castellano inventados, no los del
  estándar. Importa igual como set propio. Aceptable, pero saberlo.

---

## Orden de trabajo

1. Verificar la escala.
2. Bug 1 (doble setup). Chico y acotado, desbloquea poder abrir el archivo y ver algo.
3. Generar un IFC de prueba y **abrirlo en un visor** para confirmar que carga. Sin esta
   verificación no se sabe si quedan más problemas escondidos detrás del bug 1.
4. Bug 3 (caldera al doble), que es más corto.
5. Bug 2 (caños sin cuerpo).

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
