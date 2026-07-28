# Fotos del manual — qué falta y cómo se agrega

Documento de trabajo abierto el 2026-07-28, a partir de un hallazgo en la plataforma.

**Las fotos las aporta Edgardo.** Acá está marcado qué foto va en cada lugar y por
qué; los archivos no existen todavía.

---

## El hallazgo (2026-07-28)

El manual tenía **5 bloques `<FotoManual>` y ninguna foto real**. En producción se
veían así:

| Cap. | Bloque | Qué se veía |
|---|---|---|
| 1 | Tipos de muro | 🔴 Imagen rota |
| 1 | Vidrio simple vs DVH | 🔴 Imagen rota |
| 1 | Humedad y condensación | ⚠️ Cartel de desarrollo |
| 2 | Radiador bajo ventana | ⚠️ Cartel de desarrollo |
| 3 | Condensación en vidrio | ⚠️ Cartel de desarrollo — **tier pro, contenido pago** |

Dos causas distintas:

1. **Las dos rotas** apuntaban a `/Criterio-Termico/images/manual/cap1/…`, el
   basename de GitHub Pages, dado de baja el 2026-07-08 al migrar a Vercel. Con
   `base: '/'` esa ruta es un 404. Y aunque la ruta hubiera estado bien, el archivo
   tampoco existe: `app/public/images/manual/cap1/` está vacío.
2. **Los tres carteles** eran el placeholder de desarrollo de `FotoManual`, que
   imprimía literalmente *"Agregar foto: `app/public/images/manual/cap1/`"*. Una
   instrucción interna publicada al lector, en un caso dentro de contenido pago.

### Qué se corrigió

- `FotoManual` sin `src` ya **no renderiza nada en producción**; el recordatorio
  queda solo en desarrollo (`import.meta.env.DEV`), que es donde sirve.
- Se sacaron los dos `src` muertos del cap. 1. Los bloques quedan como marcador:
  el `alt` y el `caption` documentan qué foto va ahí.
- De paso, mismo bug fuera del manual: el botón **"Ir al inicio"** de
  `ErrorBoundary` apuntaba a `/Criterio-Termico/`. Si la app fallaba, el botón de
  rescate llevaba a un 404. Corregido a `/`.

Verificado contra el bundle de producción: no queda ninguna ruta `Criterio-Termico/`
ni el texto "Agregar foto".

**Estado: el manual no muestra nada roto, y tampoco tiene ninguna foto.**

---

## Las 5 fotos pendientes

| # | Cap. | Foto | Qué tiene que mostrar |
|---|---|---|---|
| 1 | 1 | Tipos de muro | Tres muros exteriores comparados: ladrillo hueco revocado (U≈1.2), ladrillo macizo (U≈1.8) y muro con aislación exterior (U<0.6) |
| 2 | 1 | Vidrio simple vs DVH | El corte o el canto donde se vea la cámara del DVH contra el vidrio monolítico |
| 3 | 1 | Humedad y condensación | Manchas y hongos en esquina de pared exterior — la señal de condensación superficial por mala aislación |
| 4 | 2 | Radiador bajo ventana | Radiador de panel en su posición correcta, bajo la ventana |
| 5 | 3 | Condensación en vidrio | Ventana de vidrio simple con condensación de invierno, idealmente junto a una de DVH sin condensación |

**Nota:** la 2 y la 5 son casi la misma escena. Conviene diferenciarlas — la del
cap. 1 muestra la construcción del vidrio, la del cap. 3 muestra el efecto
(condensación). Si sale una sola foto, sirve para el cap. 1.

---

## Cómo se agrega una foto

1. Copiar el archivo a `app/public/images/manual/cap<N>/` (crear la carpeta si no
   está — hoy solo existe `cap1/`, vacía).
2. Pasar la ruta en la prop `src`, **desde la raíz del sitio**:

```tsx
<FotoManual
    src="/images/manual/cap1/tipo-de-muro.jpg"
    alt="Tipos de muros exteriores: ladrillo hueco, macizo y con aislación"
    caption="Identificar el tipo de muro es fundamental para el cálculo…"
/>
```

⚠ **La ruta arranca en `/images/`, nunca en `/Criterio-Termico/`.** Ese prefijo es
de la época de GitHub Pages y hoy es un 404.

3. Verificar que el archivo aparezca en `dist/` después de `npm run build`, y abrir
   la página en producción antes de darla por buena.

---

## La regla que dejó el episodio

**Un hueco de contenido no puede verse como una falla de la aplicación.** Falta una
foto: eso es normal en un manual que se sigue escribiendo. Lo que no puede pasar es
que el lector vea un ícono de imagen rota o una nota para desarrolladores — eso no
le dice "falta una foto", le dice "esto está mal hecho", y en contenido pago cuesta
más que la foto faltante.

Cualquier bloque de contenido pendiente debe **desaparecer en producción**, no
mostrarse a medias.
