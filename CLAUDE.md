# Criterio Térmico — CLAUDE.md

Plataforma SaaS para instaladores de calefacción por radiadores.
Stack: React 19 + TypeScript 5.9 + Vite 7 + Supabase + Vercel.
Producción: **https://app.crtermico.com** (root directory: `app/`).
`criterio-termico.vercel.app` sigue existiendo y redirige con 308 al dominio propio
(`app/vercel.json`). El sitio institucional es OTRO repo y OTRO proyecto de Vercel:
`crtermico.com` = `criteriotermico-web`, en Astro.

---

## Comandos esenciales

### Desarrollo
```bash
npm run dev          # Servidor local con HMR (http://localhost:5173)
npm run build        # Build de producción (dist/)
npm run preview      # Preview del build antes de deployar
npm run typecheck    # Verificar tipos TypeScript sin compilar
npm run lint         # ESLint sobre todo el proyecto
```

### Deploy
```bash
git push origin main          # Vercel deploya automáticamente (integración Git)
vercel deploy --prod --yes    # Deploy manual desde app/ (solo si hace falta)
```
GitHub Actions corre CI (typecheck + lint + tests) en cada push y PR.
GitHub Pages fue dado de baja el 2026-07-08 — el hosting es Vercel.

### Supabase
```bash
supabase start                              # Levantar Supabase local
supabase stop                               # Detener Supabase local
supabase db reset                           # Reset de la BD local con migraciones
supabase migration new <nombre>             # Nueva migración SQL
supabase functions serve <nombre>           # Correr Edge Function local
supabase functions deploy <nombre>          # Deploy de Edge Function a producción
supabase functions deploy --all             # Deploy de todas las Edge Functions
supabase gen types typescript --local       # Regenerar tipos TypeScript desde la BD
```

✅ **El CLI FUNCIONA desde una shell no interactiva** (verificado el 2026-09-09
con la versión 2.111.0): `projects list`, `db query` y `functions deploy` corren
y terminan solos. Esta nota decía lo contrario —que se colgaba mudo esperando un
login— y se arrastró meses; era cierto con una versión vieja. **No hace falta
sacar el token del llavero a mano.**

🔑 **Para aplicar una migración a producción, el comando es:**

```bash
supabase db query --linked -f supabase/migrations/<archivo>.sql
```

Va por la Management API con el token que el CLI ya tiene. **No devuelve nada
cuando sale bien**, así que el resultado se verifica consultando la base, no
leyendo la salida.

⚠️ **NO usar `supabase db push`**: el registro de migraciones de la base está
desfasado del disco (cuatro se aplicaron a mano y no figuran), así que falla con
`LegacyDbPushMissingLocalError` y sugiere reparaciones que tocarían el historial.

La Management API con `curl` sigue sirviendo para consultar la base sin abrir el
panel, con el token a mano:

```bash
python3 -c "import json;print(json.dumps({'query':open('supabase/migrations/X.sql').read()}))" > /tmp/mig.json
curl -s -X POST "https://api.supabase.com/v1/projects/ntxkjtirkgqkjlzphvtd/database/query" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" -H "Content-Type: application/json" \
  --data-binary @/tmp/mig.json     # devuelve [] cuando sale bien
```

Con `curl`, **no** con `urllib` de Python: Cloudflare bloquea su User-Agent (403,
error 1010). El mismo endpoint sirve para consultar la base sin abrir el panel.

### Tests
```bash
npm run test          # Tests unitarios (Vitest) — 196 en 15 archivos
npm run test:ui       # Tests con interfaz visual
npm run test:coverage # Coverage report
```

---

## Estructura del proyecto

```
criterio-termico/
├── app/                   # ⚠ TODO el frontend vive acá (root directory de Vercel)
│   ├── src/
│   │   ├── app/
│   │   │   ├── routes/    # Las 11 páginas (lazy loaded)
│   │   │   └── layouts/   # MainLayout
│   │   ├── components/    # ui/, calculadoras/, simulador/, AsistenteTermico/…
│   │   ├── stores/        # Zustand
│   │   ├── lib/           # Servicios de cálculo (bombas, caudal, diámetros, piso radiante)
│   │   ├── hooks/
│   │   ├── styles/        # tokens.css + global.css — el resto es CSS Modules
│   │   └── content/       # Manual y casos de errores (TSX nativo)
│   ├── api/               # Serverless de Vercel (Node): search-console.ts
│   ├── vercel.json
│   └── package.json
├── supabase/
│   ├── functions/         # Edge Functions (Deno)
│   └── migrations/        # 9 migraciones SQL
├── scripts/               # Extracción de contenido y reindexado del RAG
├── docs/                  # Planes y auditorías
├── .github/workflows/     # deploy.yml (CI) + reindex-rag.yml
└── CLAUDE.md              # Este archivo
```

⚠ **No hay `src/` ni `pages/` ni `types/` en la raíz**: el frontend entero está bajo
`app/`. `app/src/features/` existe pero está vacío (vestigio).

---

## Variables de entorno

### Frontend — `.env.local` (nunca commitear)
```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

### Edge Functions — Supabase Dashboard > Settings > Edge Functions
```
ANTHROPIC_API_KEY=sk-ant-...
MP_ACCESS_TOKEN=APP_USR-...          # el código lee este nombre, no MERCADOPAGO_ACCESS_TOKEN
MP_WEBHOOK_SECRET=...                # clave secreta del webhook, panel MP > Webhooks
MP_PRO_PLAN_ID=2c93808...            # id del plan PRO creado en MP
MP_PREMIUM_PLAN_ID=2c93808...        # id del plan PREMIUM
APP_URL=https://app.crtermico.com     # a dónde vuelve el comprador desde el checkout de MP
# ⚠ Los cupos NO salen de variables de entorno: están en `TIER_CONFIG`, dentro
# de `asistente-termico/index.ts`, y son MENSUALES (15 / 80 / 120). Estas tres
# variables quedaron de la época del límite diario y no las lee nadie.
ALLOWED_ORIGIN=https://app.crtermico.com,https://criterio-termico.vercel.app
#   ↑ admite VARIOS separados por coma (ver supabase/functions/_shared/cors.ts).
#   La función contesta el origen que pidió, si está en la lista. Con un solo
#   valor, el navegador descarta las respuestas del otro dominio y el asistente
#   se queda mudo SIN que nada falle del lado del servidor.
```

### MCP Server — `.env` en `/mcp-server`
```
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_ANON_KEY=eyJ...
PORT=8000
```

---

## Reglas de desarrollo — SIEMPRE respetar

1. **No commitear `.env`** — Está en `.gitignore`. Sin excepciones.

2. **Regenerar tipos después de migraciones**
   ```bash
   supabase gen types typescript --local > src/types/supabase.ts
   ```

3. **Lazy loading en todas las páginas**
   ```typescript
   // Correcto
   const Herramientas = lazy(() => import('./pages/Herramientas'))
   // Incorrecto
   import Herramientas from './pages/Herramientas'
   ```

4. **Sin `any` en TypeScript** — Si aparece un `any`, es un bug de tipado,
   no una solución.

5. **CSS Modules únicamente** — Sin Tailwind, sin inline styles,
   sin styled-components.

6. **Cálculos en el browser** — La lógica de ingeniería va en `src/lib/`.
   Nunca mover cálculos a Edge Functions (rompe offline).

7. **API keys solo en Edge Functions** — `ANTHROPIC_API_KEY` y
   `MERCADOPAGO_ACCESS_TOKEN` nunca tocan el frontend.

8. **Typecheck antes de deployar**
   ```bash
   npm run typecheck && npm run build && npm run deploy
   ```

---

## Tiers de suscripción

| Tier | Precio | Herramientas | Consultas de IA |
|---|---|---|---|
| *(sin cuenta)* | — | prueba el asistente y nada más | 3 **y se terminan** |
| `free` | $0 | Calculadora Potencia, 5 errores, índice manual | 15 **al mes** |
| `pro` | $30.000 | + Diámetros, Caudal, Piso Radiante, Bombas | 80 **al mes** |
| `premium` | $40.000 | + Simulador 2D, exportación DXF, todo el manual | 120 **al mes** |

🔴 **EL CUPO ES MENSUAL DESDE EL 2026-09-08, y el mes arranca el día que el
instalador se registró, no el 1°** (ancla: `profiles.created_at`). Si se
reiniciara el 1°, el que se da de alta el 28 tendría el mes entero para gastar
en tres días y otro mes entero el 1°. Vive en
`supabase/migrations/20260908_cupo_mensual.sql`:

| Función | Qué hace |
|---|---|
| `consumir_consulta_ia(user, limite, ancla, cantidad)` | decide y descuenta en una sola operación; si no hay cupo **no descuenta nada**. Sólo service_role |
| `cupo_ia(user, ancla)` | sólo lee, para dibujar el contador. La llama el frontend |
| `inicio_del_ciclo(ancla, hoy)` | primer día del ciclo vigente |

**El visitante sin cuenta va con `ancla = null`: sus 3 consultas NO se le
renuevan.** Una sesión anónima no tiene mes que cumplir y renovársela sería
regalar consultas a cualquiera que vuelva a entrar.

⚠ **El lock de `consumir_consulta_ia` no es decorativo.** El cupo vive repartido
en una fila por día y hay que sumarlas: sin `pg_advisory_xact_lock` por usuario,
dos consultas simultáneas leen la misma suma y las dos pasan. Es la misma race
condition que ya había mordido en el rate limiting diario.

⚠ **El análisis de plano descuenta del MISMO cupo y pesa 1.** Tenía un tope
propio de 20/día «por ser más costoso»: medido, no lo es —es una sola pasada,
sin historial, mientras que una consulta al asistente arrastra la conversación
entera en cada turno—. Si midiendo los tokens resultara más caro, no hay que
inventar otro contador: `consumir_consulta_ia` acepta `p_cantidad`.

### Cuánta conversación viaja al modelo (desde 2026-09-09)

🔴 **EL COSTO DE UNA CONVERSACIÓN CRECE CON EL CUADRADO DE SU LARGO.** Cada turno
reenvía todos los anteriores: la pregunta 10 vuelve a pagar las nueve de antes,
así que una charla de 10 idas y vueltas no cuesta 10 veces la primera sino unas
50. Hasta ese día se mandaba la conversación entera.

`ventanaDeConversacion` (en `asistente-termico/index.ts`) manda las **últimas 4
idas y vueltas** — `MENSAJES_AL_MODELO = 8`, elegido por Edgardo. El instalador
sigue viendo la charla completa en pantalla: lo que se recorta es lo que se paga.

🔑 **La ventana tiene que arrancar con un turno del instalador.** Si el corte cae
sobre una respuesta de Martín, la conversación empieza con él contestando algo
que nadie preguntó y el modelo responde en el aire. Por eso se descarta ese
mensaje suelto.

⚠ **El recorte se hace en la Edge Function, no en el frontend.** Una sola regla y
en el lado que manda: el navegador se puede modificar, la función no.

⚠ **Cuando exista la memoria de Martín, este número se puede bajar sin que se
note**: la memoria es lo que sostiene el hilo cuando la ventana ya no llega.

El visitante sin cuenta usa una **sesión anónima de Supabase** (desde 2026-08-13):
es una sesión real, así que el rate limiting y el RLS funcionan igual. ⚠ Una
sesión anónima **no es un login** — el store la ignora a propósito y el header
sigue mostrando "Ingresar". El cupo es bajo porque cada consulta se paga, pero
el LARGO de la respuesta no se recorta: el que prueba sin cuenta se lleva la
primera impresión del producto.

El tier se guarda en la tabla `profiles.tier` y se controla con RLS en Supabase.
**Nunca controlar acceso por tier en el frontend** — solo para mostrar UI.
La restricción real la hace la BD.

---

## Edge Functions disponibles

| Función | Ruta | Descripción |
|---|---|---|
| `asistente-termico` | `/functions/v1/asistente-termico` | Chat con streaming SSE + RAG. Registra en `consultas_abiertas` lo que declara no saber. **El asistente se llama Martín** (6/9): el nombre está en el prompt del sistema y el personaje en `app/src/components/AsistenteTermico/Martin.tsx`. Desplegado el 8/9 (v29): en producción ya se presenta como Martín |
| `analizar-plano` | `/functions/v1/analizar-plano` | Visión: lee el plano y devuelve por ambiente pared exterior, ventanas y puerta (solo Premium; descuenta del cupo mensual del tier) |
| `indexar-conocimiento` | `/functions/v1/indexar-conocimiento` | Indexa fragmentos con embeddings gte-small (solo service_role) |
| `mercadopago-webhook` | `/functions/v1/mercadopago-webhook` | Webhook de MercadoPago. **Única función sin `verify_jwt`** (ver `supabase/config.toml`): MP no manda JWT, manda firma HMAC |
| `create-subscription` | `/functions/v1/create-subscription` | Iniciar pago MP |

### Modelo de IA (desde 2026-08-14)

Las dos funciones de IA corren **`claude-opus-5`** con pensamiento adaptativo en
esfuerzo `medium`, SDK `@anthropic-ai/sdk@0.117.1`.

⚠ **`max_tokens` topea PENSAMIENTO + RESPUESTA juntos.** Es el error que ya se
cometió: con 512 las respuestas se cortaban a mitad sin dar ningún error. Hoy
son 2048 (anónimo y free), 3072 (pro), 4096 (premium) y 8192 en `analizar-plano`.
Si se sube el esfuerzo, subir también estos topes.

### Martín, el personaje (desde 2026-09-06)

El asistente no es un botón: es un tipo de obra proyectado en la esquina de la
pantalla. Ilustración de Edgardo, generada en Gemini; el original vive fuera del
repo (`~/Desktop/Martin-criterio.jpeg`) y los clips en
`~/Desktop/Trabajos de edicion/doc Criterio Termico/img y videos/`.

| Pieza | Dónde | Peso |
|---|---|---|
| `martin-cuerpo.png` | esquina, con el chat cerrado | 28 KB |
| `martin-cara.png` | encabezado del panel y cada respuesta | 10 KB |
| `martin-reposo.webm` | quieto, respirando | 328 KB |
| `martin-hablando.webm` | gesticulando | 400 KB |

**Las trampas, todas encontradas probando y ninguna visible leyendo el código:**

1. **Los videos van con canal alfa de verdad (VP9 `yuva420p`), no con fondo
   negro fundido.** Se intentó `mix-blend-mode: screen` y no sirve: el asistente
   vive en una capa `position: fixed`, que arma su propio contexto de dibujo, y
   la mezcla nunca llega al fondo de la página — quedaba un rectángulo negro.
2. **Con el video andando hay que apagar la imagen fija y el barrido de luz.**
   Si no, se ven **dos Martín**: la imagen quieta se transparenta bajo el clip, y
   el barrido usa la silueta de la imagen como molde, así que dibuja la pose
   vieja cuando la del video levanta el brazo.
3. **Se comprueba la transparencia en el navegador, no por el nombre del
   navegador**: se lee un píxel del borde del video en un canvas. Si es opaco, no
   hay alfa y queda la imagen fija (`tieneTransparencia` en `Martin.tsx`).
4. **Los clips son ida y vuelta** (el clip más su propio reverso, hecho con
   ffmpeg): así el bucle no da el salto al volver a empezar.
5. **Los videos NO entran al precache de la PWA** — si entraran, se bajarían
   también en el celular. Verificar en `dist/sw.js` después de tocar el build.
6. **Sólo se cargan en escritorio** (≥900 px), nunca con `prefers-reduced-motion`
   ni con ahorro de datos, y recién 2,5 s después de cargar la página. El clip de
   hablar se precarga al ABRIR el chat: pedirlo cuando llega la respuesta es
   tarde. Ver `useMartinAnimado`.
7. **`RUTAS_SIN_ASISTENTE` en `App.tsx`** lista dónde no se dibuja (hoy,
   `/cuenta`). En el Simulador y en el celular se muestra compacto: la figura
   entera tapaba los controles del plano.

⬜ **Pendiente: cómo queda en el celular.** Hoy ahí sólo se ve su cara. La idea
acordada es ponerlo de medio cuerpo asomando sobre el encabezado del chat.

### RAG del asistente (desde 2026-07-08, reescrito 2026-08-14)

El asistente busca en `public.conocimiento` (pgvector, embeddings gte-small 384d
generados en el Edge Runtime, costo cero) los fragmentos más parecidos a la
consulta: 40 candidatos → rondas por caso → 6 al prompt, tope 2 por caso.

🔴 **Los fragmentos NO van en el system prompt.** Viajan como un mensaje de rol
`system` al final de `messages`, detrás del turno del instalador. El motivo es
la caché: la API cachea por PREFIJO, así que meter contenido variable adentro
del system hacía que el prompt cambiara entero en cada consulta y la caché no
pegara nunca. El system quedó estable (4 variantes: anónimo + los tres tiers) y
marcado con `cache_control`. **No volver a meter nada variable ahí adentro.**

🔴 **Los números duros van en el system prompt, no confiados al RAG.** La regla
anti-invención no protege contra material que existe pero no se recuperó: el
asistente dijo 3 cm de separación a la pared donde el manual dice 5, porque esa
tabla nunca entró al contexto. Las separaciones del radiador, las fórmulas y la
potencia por elemento viven en el prompt estable por eso.

**Reindexar es automático**: el workflow `.github/workflows/reindex-rag.yml`
corre en cada push a `main` que toque `app/src/content/errores/**`,
`app/src/content/manual/**`, `ManualTecnico.tsx` o los scripts de extracción.
También se dispara a mano desde la pestaña Actions. Sólo hace falta el POST
manual a `indexar-conocimiento` (lotes de ≤5, el runtime free se queda sin CPU
con lotes grandes) si se indexa material que no vive en esas rutas.

### Bandeja de revisión (desde 2026-08-14)

Las dos entradas por las que crece la base de conocimiento. Ninguna es que el
instalador corrija el contenido: **criterio de Edgardo, no existe canal de
"esto está mal"** — el crecimiento entra por casos, nunca por corrección.

| Tabla | Qué guarda | RLS |
|---|---|---|
| `consultas_abiertas` | lo que el asistente declara no saber, con qué recuperó el RAG y su similitud | activo, **cero policies**: sólo service_role |
| `contribuciones` | el caso que aporta el instalador | insert y select sobre lo propio; sin update ni delete |

El asistente cierra con la marca `<<SIN_DOCUMENTAR>>` cuando escala; la función
la detecta reteniendo la cola del stream y la borra antes de mandar el texto.
**La señal la da el modelo, no un umbral de similitud del RAG** — la primera
consulta registrada recuperó con similitud 0,891 y aun así no tenía la respuesta.

⬜ Falta: enganchar `ContribucionForm` (hoy escribe en localStorage y muere ahí),
la vista en `/panel` vía Edge Function con service_role, y el n8n que las levante.

---

## Servidor MCP — NO existe en este repo

🔴 **Verificado el 2026-08-28: no hay `mcp-server/` ni `.mcp.json` en el repositorio.**
Este archivo documentaba una carpeta, un archivo de configuración y seis herramientas
(`buscar_caso_error`, `calcular_potencia_ambiente`, `consultar_manual`,
`verificar_usuario`, `validar_diseno_instalacion`, `obtener_estadisticas_proyecto`)
que nunca se escribieron. Sigue siendo una idea del roadmap, no código. Si se encara,
escribirlo antes de volver a documentarlo acá.

---

## Skills del proyecto

Las skills **no están en el repo**: viven en `~/.claude/skills/` (por eso no se
versionan con el código y pueden quedar viejas — la fuente de verdad es este archivo).

| Skill | Cuándo se usa | Estado |
|---|---|---|
| `criterio-termico-obra` | **Criterio técnico de obra: qué es verdad.** La fuente. | al día |
| `criterio-termico-dev` | Arquitectura, stack, convenciones | ⚠ desactualizada: dice TanStack Query (no se usa), GitHub Pages, modelos 4-6, y lista A* como pendiente cuando ya está implementado |
| `criterio-termico-ia` | Prompts del asistente, Edge Functions de IA | revisar |
| `criterio-termico-mcp` | Servidor MCP | ⚠ describe código que no existe |

---

## Flujo de trabajo con Git

```bash
# Feature nueva
git checkout -b feature/<nombre-descriptivo>
# ... desarrollar ...
npm run typecheck    # Verificar tipos
npm run test         # Pasar tests
git add .
git commit -m "feat: descripción clara del cambio"
git push origin feature/<nombre>
# → Pull Request a main

# Deploy a producción (solo desde main)
git checkout main
git pull
git push   # Vercel deploya automáticamente
```

### Convención de commits
```
feat:     nueva funcionalidad
fix:      corrección de bug
refactor: refactoring sin cambio de comportamiento
style:    cambios de CSS/UI sin lógica
test:     agregar o corregir tests
docs:     documentación
chore:    tareas de mantenimiento (deps, config)
```

---

## Contexto importante para Claude

- **Simulador 2D**: Canvas API nativo, sin librerías externas. Mantener 60fps.
  El usuario sube un plano, ubica elementos y el sistema calcula y dibuja
  tuberías automáticamente. Exporta a PDF (jsPDF) y a **DXF**
  (`dxfExporter.ts`), que es el entregable para el arquitecto.

- **Motor de cálculo**: Corre 100% en browser. Los algoritmos de ingeniería
  son activo propio del proyecto. Siempre aplicar 15% de margen de seguridad.

- **Contenido como código**: El manual (14 capítulos) y los casos de errores
  (17 casos al 2026-08-14, con 151 anclas y 114 entradas en el índice temático —
  contados contra el código, no de memoria) están implementados como
  componentes TSX nativos, sin CMS externo. **No usar cifras redondeadas hacia
  arriba acá ni en el sitio**: el "+200 errores" que se publicó durante meses
  no existía, y un instalador que se suscribe esperando eso concluye que se le
  vendió humo. Contar antes de afirmar.

- **Mercado principal**: Argentina. MercadoPago como pasarela. Expansión
  planificada a España y Alemania.

- **Costo de infra**: Prácticamente cero (Vercel Hobby + Supabase free tier).
  No agregar servicios pagos sin justificación. OJO: al activar pagos reales,
  Vercel Hobby no permite uso comercial → pasar a Pro (US$20/mes).

- **PWA completa**: La app funciona offline. No romper el flujo offline
  al agregar nuevas features.

---

### 🔴 Las dos plantas son UNA obra (2026-09-10)

Lo encontró Edgardo probando el simulador con planta baja y planta alta:

1. **El plano técnico bajaba una sola hoja**, la de la planta que estaba
   mirando en el canvas. Filtraba por `currentFloor` en seis lugares.
2. **El presupuesto llevaba una captura del canvas**, o sea también una sola
   planta. (Los materiales sí sumaban las dos: eso estaba bien.)

**El fallo era MUDO en los dos casos** —el PDF salía completo y prolijo, con su
rótulo y su planilla—, así que no había manera de notar que faltaba media obra
hasta abrirlo con el plano al lado.

Ahora `dibujarHojaDePlano()` dibuja **una hoja por planta** y la usan los dos:
el plano técnico y el presupuesto, que agrega esas hojas apaisadas al final. La
captura del canvas quedó sólo como respaldo para el proyecto que no tiene plano
de fondo cargado. Y si una planta tiene elementos pero no tiene imagen, el
simulador **avisa cuál queda afuera**.

🔑 **Regla para todo lo que se exporte de acá en más: nada se filtra por
`currentFloor`.** Lo que se entrega es el proyecto, no la pantalla. Vale para el
PDF, para el presupuesto y para el DXF (que ya sacaba las dos).

---

### Exportador DXF — el entregable para el arquitecto (desde 2026-09-10)

`app/src/components/simulador/utils/dxfExporter.ts`. Botón **Exportar DXF** en
la barra del Simulador. Es el **único** formato de exportación del plano: el
2026-09-10 se eliminó el exportador IFC —`ifcExporter.ts`, su test y el botón—
por decisión de Edgardo.

🔴 **Por qué DXF y no IFC**: quien recibe la instalación trabaja en AutoCAD,
muchas veces **LT — que no abre IFC**. Lo que necesita es la planta con
las cañerías dibujadas encima de la suya, y eso es un DXF. Sostener dos
exportadores era sostener uno que nadie iba a poder abrir.

Lo que sale, que es todo lo que el simulador calcula:

- Ambientes con nombre, superficie y pérdida
- Caldera y radiadores, con la identificación de la planilla (`R1`, `R2`…)
- Cañerías **en una capa por material y diámetro**, ida y retorno separadas
  (`CT-PB-PEX20-IDA`) — para radiadores y para piso radiante
- **Colectores y circuitos de piso radiante** —serpentín, acometidas y etiqueta
  `C1.2`—, que se calculaban desde siempre y **nunca salían a ningún archivo**
- Primaria caldera↔colector Ø32 y montantes entre plantas
- Planilla de radiadores, planilla de circuitos y **despiece de materiales**,
  al costado del dibujo
- Una leyenda **«CÓMO USAR ESTE ARCHIVO»** que traduce cada capa de cañería a
  lenguaje de obra (`CT-PB-PEX20-IDA` → «planta baja · PE-X Ø20 · ida ·
  radiadores») y dice qué lleva el plano

🔴 **El exportador sirve para las DOS instalaciones, y los textos tienen que
nombrar a las dos.** La capa sin sufijo de sistema es la de radiadores y se
nombra igual que la de piso radiante: si sólo se nombra el piso, el que abre el
archivo no tiene cómo saber que el resto es la instalación de radiadores. Vale
para el DXF, para la Guía de uso y para el sitio.

🔴🔴 **UNA HERRAMIENTA QUE SIRVE A MUCHOS NO SE REDUCE A UN NICHO.** Criterio
de Edgardo del 2026-09-10, y vale para todo el producto, no sólo para el DXF:
*"si el tema es excluyente del arquitecto o electricista o sanitarista, ahí sí
los mencionamos específicamente"*. El DXF lo abren el arquitecto —que es el
principal—, el ingeniero, el maestro mayor de obras y el dueño de la propiedad,
que también puede manejar AutoCAD. Los textos, **y los comentarios del código**,
hablan de **«el que lo recibe»**: la función concreta en vez de la categoría,
que es el corolario de `docs/norma-lenguaje.md` del sitio. Un rubro se nombra
sólo cuando el tema es de ese rubro.

Invariantes que fija `dxfExporter.test.ts` (32 casos) y que **no hay que
romper**:

1. 🔴 **El dibujo va en METROS, con `$INSUNITS = 6`.** No se escala a mano en
   ningún lado: AutoCAD hace la conversión solo cuando el arquitecto lo inserta
   en un plano en centímetros o en milímetros. Todo se mide en píxeles del
   canvas y se convierte con `aMetros()` / `punto()`, que salen de
   `PIXELS_PER_METER`. **Nunca escribir una escala a mano** (es el mismo error
   que tuvo el IFC).
2. 🔴 **El eje Y se da vuelta.** En el canvas Y crece hacia abajo; en AutoCAD,
   hacia arriba. Sin el espejo el plano sale invertido y no se nota hasta la
   obra.
3. 🔴 **El archivo es ANSI_1252, no UTF-8** — lo declara el header y
   `dxfABytes()` lo escribe byte a byte. El diámetro y el grado van con los
   códigos de control de AutoCAD (`%%C`, `%%D`), no con el carácter: el escape
   `\U+XXXX` sólo lo interpretan algunos visores y el plano llega diciendo
   `\U+00D820` donde tiene que decir Ø20.
4. **Versión AC1015 (AutoCAD 2000)**: es la más vieja que admite `$INSUNITS` y
   `LWPOLYLINE`. La abre cualquier AutoCAD de 2000 en adelante, LT incluido,
   más BricsCAD, DraftSight, LibreCAD y QCAD.
5. **La planta alta va AL LADO de la baja**, separada 3 m. En el canvas las dos
   ocupan el mismo lugar —cada una con su plano de fondo—, así que exportadas
   tal cual quedarían superpuestas.
6. **Sobre el plano va sólo la identificación** (`R1`, `C1.2`, `COLECTOR 1`) y
   los datos van en las planillas, como en un plano de obra: con la longitud y
   el diámetro encima, las etiquetas de dos circuitos vecinos se pisan.
7. 🔴 **Una capa por material y diámetro** —`CT-PB-PEX20-IDA`,
   `CT-PB-PEX32-PRIMARIA-RET`—, no una capa «cañerías». Es lo que le permite al
   arquitecto sacar los metros de cada tubo seleccionando la capa. Ninguna capa
   vacía: el que abre el archivo no tiene que ir apagando capas sin nada.
8. 🔴 **Caldera, radiadores y colectores van como BLOQUES con atributos**
   (`CT_CALDERA`, `CT_RADIADOR`, `CT_COLECTOR`), con la geometría definida en
   un cuadrado de 1 × 1 que cada `INSERT` escala a la medida real. Los
   atributos van **invisibles**: sirven para `ATTEXT` —lo único que tiene LT,
   que no trae `DATAEXTRACTION`— y para que cada aparato se seleccione como un
   objeto. Todo `INSERT` con atributos cierra con `SEQEND`.
9. 🔴 **El despiece de materiales va DIBUJADO adentro del archivo**, por lo
   mismo: si dependiera de que el arquitecto lo extraiga, la mitad no podría.
   **Sin marcas y sin precios**: es una lista para comprar. Sale del mismo
   `calcularPresupuestoPisoRadiante` que el presupuesto, más los metros de
   cañería de radiadores por diámetro.
10. **El colector se dibuja a ESCALA REAL**: ancho = vías × 5 cm (la derivación
    del catálogo REHAU), no al tamaño que se arrastró en pantalla. El plano
    tiene que servir para ver si entra en el nicho.
11. 🔴 **El archivo se explica solo.** La leyenda «CÓMO USAR ESTE ARCHIVO» va
    dibujada al costado porque el que lo abre no tiene a nadie que se lo
    explique: sin ella ve líneas de colores y no se entera de que las cañerías
    están cortadas por diámetro ni de que el despiece ya está adentro. Las
    capas se listan **traducidas** con `explicarCapa()`, que parsea el nombre.
    Si cambia el formato del nombre de capa, hay que cambiar ese parser.
12. 🔴🔴 **UNA etiqueta de diámetro por PAR ida/retorno, girada como el caño —
    nunca una por tramo.** Ida y retorno corren paralelos a 16-22 cm y un
    «Ø16» de 0,22 m de alto ocupa 66 cm de ancho: con una etiqueta por caño se
    montan entre sí. Medido en un CAD sobre un proyecto real: **68 pares de
    rótulos pisados, cuatro exactamente encimados**, o sea el plano ilegible.
    Es geometría, así que pasa igual en AutoCAD. Cómo funciona:
    `tramoPrincipal()` toma el segmento **más largo** de cada caño (no el
    vértice del medio, que cae en una esquina), `agruparPares()` junta los que
    dicen lo mismo y corren pegados y paralelos, y la etiqueta sale al costado
    del haz, girada, con el ángulo siempre entre -90° y 90° para que no se lea
    cabeza abajo. **Los diámetros se dibujan ÚLTIMOS**, después de anotar con
    `anotarEtiqueta()` todo lo que no se mueve —`R1`, `CALDERA`, `COLECTOR 1`,
    `C1.2`, nombres de ambiente—, porque son los únicos rótulos que se pueden
    correr. Lo que ocupa lugar no son sólo los textos: **los aparatos también
    cuentan** —radiador, caldera y colector se anotan con `anotarCaja()`—,
    porque un «Ø25» escrito encima del símbolo de un radiador ensucia el plano
    igual que uno escrito encima de otro texto. Si ninguna de las cuatro
    posiciones queda libre, **la etiqueta no se dibuja**: el diámetro se lee
    igual por la capa y en el despiece, y una etiqueta pisada ensucia sin
    agregar nada.
13. **Los rótulos sobre el dibujo van cortos.** «MONTANTE ENTRE PLANTAS Ø25»
    son 3,70 m de texto sobre un montante de centímetros, y con ida y retorno
    a 16 cm se leía `MO0NTANTEEENTREEPLANTASS`. Va **«MONTANTE Ø25»**, una vez
    por par: lo que se pierde lo explica la leyenda, que traduce la capa
    entera («montante entre plantas · PE-X Ø25 · ida»).

14. 🔴🔴 **Ninguna columna declarada puede quedar vacía en todas las filas.**
    La planilla anunciaba `AMBIENTE` y `ELEMENTOS` y las dejaba en `-`, que es
    lo que ve el que tiene que comprar. Las dos salen ahora de
    `planillaRadiadores()`, que es **la única fuente** —la usan la planilla
    dibujada, los atributos del bloque, el despiece, el PDF y la vista del
    simulador; si el bloque se llenara por su cuenta, `ATTEXT` diría una cosa
    y la planilla otra—:
    - **AMBIENTE**: primero la asignación explícita (`Room.radiatorIds`) y si
      no la hay, **por dónde está dibujado el radiador** (su centro dentro de
      `Room.bounds`, y sólo en su misma planta). El radiador colocado a mano no
      queda en `radiatorIds`, y ahí se perdía el dato teniéndolo. Si no cae en
      ninguno dice `sin asignar`, no un guion.
    - **ELEMENTOS**: si el usuario cargó la composición, es la suya. Si no, se
      **calcula por potencia** —`ceil(power / kcal por elemento)`, con
      `ALTURA_ASUMIDA_MM = 500` → 200 kcal/h, criterio de Edgardo y default de
      la auto-colocación—, y la fila se marca `calculado: true`. Es la misma
      cuenta con la que se presupuesta.
    - 🔴 **Lo calculado se distingue de lo cargado**: `(calc.)` en el DXF, `*`
      en el PDF y en la vista, con la nota al pie que dice el criterio. Un
      número deducido no se presenta como un dato que eligió el usuario.
    - Sin potencia (`power = 0`) no se inventa nada: queda en `-`.
    - El despiece dejó de listar «Radiadores (sin composición cargada)», que no
      se puede comprar: ahora suma los elementos por altura y agrega aparte las
      unidades a montar.

⚠ **Para chequear tipos usá `npx tsc -b`, no `npx tsc --noEmit`.** El
`tsconfig.json` de `app/` es sólo referencias (`tsconfig.app.json` +
`tsconfig.node.json`), así que `--noEmit` sale en verde sin mirar un solo
archivo. `npm run build` sí corre `tsc -b`.

---

### Exportador DWG — el mismo plano, en el formato nativo de AutoCAD (2026-09-10)

`app/src/components/simulador/utils/dwgExporter.ts`. Botón **Exportar DWG** al
lado del de DXF.

🔑 **ACÁ NO SE DIBUJA NADA.** El plano lo arma `dxfExporter.ts` y este archivo
sólo lo convierte: el mismo texto que baja como `.dxf` entra por el lector de
`@node-projects/acad-ts` y sale por su escritor de DWG. **Un solo generador,
dos formatos**: lo que se cambie del dibujo lo heredan los dos. El camino
funciona porque nuestro DXF ya sale en **AC1015**, que está dentro del rango
que esa librería escribe.

**Por qué esa librería y no otra** (evaluado el 2026-09-10):
- **ODA**, lo que usa la industria: hasta **USD 25.000 al año**, y si se deja de
  pagar se pierde el derecho a distribuir lo ya desarrollado.
- **LibreDWG**: GPL → obligaría a abrir el código de Criterio Térmico. Y escribe
  hasta R2000 nomás. Sirve como **herramienta de verificación local**, que no se
  distribuye y por eso no contagia la licencia.
- **`@node-projects/acad-ts`**: MIT, sin dependencias, corre en el navegador.
  Es el puerto a TypeScript de ACadSharp (C#, MIT, vivo desde 2021).

🔴🔴 **LA TRAMPA: acad-ts NO LEE EL TAG DE LOS ATRIBUTOS.** Al leer el DXF
descarta el código 2 de los `ATTDEF` y los `ATTRIB` —avisa
`[AcDbAttributeDefinition] Unhandled dxf code 2`—, así que **los valores llegan
bien y los tags llegan vacíos**. Un DWG así se ve perfecto y **no sirve para lo
que lo entregamos**: sin tag, `ATTEXT` no extrae nada, y `ATTEXT` es lo único
que tiene AutoCAD LT (no trae `DATAEXTRACTION`). `reponerTagsDeAtributos()` los
devuelve **por posición**, usando `ATRIBUTOS_DE_BLOQUE` —la misma constante con
la que el exportador los emite, así que no pueden divergir—. ⚠ Un test compara
el orden que emite el DXF contra esa constante: si algún día cambia el orden de
los atributos de un bloque, el DWG saldría con **los datos cruzados** y no
habría forma de notarlo mirando el plano.

🔴🔴 **Y METE EL `SEQEND` DENTRO DE LA LISTA DE ATRIBUTOS**, en vez de en el
campo `seqend` de la colección. Dos efectos, los dos mudos: el INSERT queda
apuntando al SEQEND como si fuera su último atributo, y la referencia al
terminador se escribe vacía — **el DWG sale con los INSERT sin cerrar**, que es
un archivo inválido (el invariante 8 ya lo pide para el DXF). `ordenarSeqends()`
lo saca del array y lo pone en su campo, antes de reponer los tags.

🔑 **Cómo se detectó, y cómo se vuelve a comprobar:** el DWG se convierte de
vuelta a DXF con `dwg2dxf` de **LibreDWG** y se cuentan las entidades. Salían
17 INSERT con 98 ATTRIB y **cero SEQEND**, y `ezdxf` rechazaba ese DXF con
`Expected DXF entity TEXT or SEQEND`. ⚠ **Antes de culpar al archivo propio,
correr el mismo camino con un DWG ajeno de control** —`test/test-data/example_2000.dwg`
del propio LibreDWG—: ahí salió con sus SEQEND, y eso fue lo que probó que el
problema era nuestro y no del conversor.

🔴 **La tabla `DIMSTYLE` del DXF no puede ir vacía.** El dibujo no lleva cotas,
pero el escritor de DWG busca el estilo de cota actual y sin `Standard` corta
con `Entry 'Standard' not found in table`. Se agregó al DXF —no como parche del
conversor—, que además es lo que AutoCAD da por sentado.

**La librería se carga con `import()` dinámico**, no arriba del archivo: pesa
795 KB (165 KB comprimidos) y queda en un chunk propio que **no figura en el
`index.html`**. El que no exporta a DWG no la descarga nunca; el primero de la
sesión tarda unos segundos y el botón lo dice.

**Verificado con TRES herramientas independientes**, sobre el proyecto real:

| | resultado |
|---|---|
| acad-ts, releyendo el DWG | 70 polilíneas **con todos sus vértices** y 196 textos **con posición, rotación y altura**: idénticos al DXF |
| **LibreDWG** (C, sin relación con acad-ts) | `SUCCESS`; 196 TEXT, 98 ATTRIB **todos con su tag**, 17 INSERT, 17 SEQEND, 22 capas |
| **ezdxf**, sobre el DXF que LibreDWG saca del DWG | **0 errores**, 283 entidades |

⬜ **Falta abrirlo en un AutoCAD de verdad**, igual que el DXF.

⚠ **El DXF sigue siendo el botón probado.** Lo abre cualquier CAD, está
auditado con `ezdxf` y no depende de una librería joven (el puerto a TypeScript
es de abril de 2026). El DWG es la comodidad de recibir el formato de todos los
días.

---

⚠ **El serpentín dibujado es esquemático**, igual que en pantalla: el metraje
de la planilla es el de obra (área real × 7 m/m² a paso 15), no la longitud de
la polilínea del dibujo. Si alguna vez se mide el DXF con una regla, no van a
dar lo mismo.

⬜ Falta: verificarlo abriéndolo en un AutoCAD de verdad (acá se validó con
`ezdxf`: 0 errores de auditoría).

🔑 **Cómo se verifica una etiqueta desde acá, sin AutoCAD:** se regenera el
plano de un proyecto real y se miden las cajas de texto con `ezdxf`. Cuidado
con un detalle que da falsos positivos: **`%%C16` ocupa 3 letras en pantalla,
no 5** —el código de control se dibuja como un solo `Ø`—, así que el ancho hay
que medirlo sobre el texto ya traducido. Sobre el proyecto del 10/9: **68
pares pisados antes, 0 después**, con 50,9 cm de separación mínima.

---

## Auditoría Pre-Producción — Pendientes

> Generado el 2026-06-29 tras revisión completa de código.
> Marcar cada ítem con ✅ cuando esté resuelto.

### Día 0 — Bloqueantes (sin esto no se puede lanzar)

- [x] **[C-2] Migración `ai_usage` vacía**
  - Archivo: `supabase/migrations/20260408_ai_usage.sql`
  - El archivo solo dice "EJECUTE EL SCRIPT". Falta el SQL real.
  - Sin esto, el asistente IA da 500 para todos los usuarios desde el primer día.
  - Crear tabla con columnas: `id, user_id (fk auth.users), date, request_count, tokens_used, created_at`
  - Constraint UNIQUE en `(user_id, date)`. Índice en `(user_id, date)`.
  - Habilitar RLS. Ejecutar con `supabase db push`.

- [x] **[C-1] Webhook MercadoPago sin verificación de firma HMAC**
  - Archivo: `supabase/functions/mercadopago-webhook/index.ts`
  - Cualquiera puede hacer POST falso y subir su tier a premium gratis.
  - MP envía cabecera `x-signature` con HMAC-SHA256. Debe verificarse antes de procesar.
  - Agregar env var `MP_WEBHOOK_SECRET` en Supabase Dashboard > Edge Functions.

- [ ] **[C-4] Contribuciones solo en localStorage — nunca llegan a la BD**
  - 2026-07: parche provisorio (Opción B) — se sacó el punto de entrada
    (`ContributeSection` en `ManualTecnico.tsx`); el store y `ContribucionForm.tsx`
    quedaron sin uso porque no había flujo de revisión.
  - 2026-08-14: **reabierto y a medio hacer.** Existe la tabla `contribuciones`
    con RLS (ver «Bandeja de revisión» más arriba). Falta: enganchar el
    formulario a la tabla, devolverle el punto de entrada, el Storage para fotos
    y la vista de revisión en `/panel`.
  - ⬜ **Bloqueante de producto, y es de Edgardo: qué gana el instalador que
    aporta** (consultas al asistente / días de Pro / descuento). Sin eso el
    cap. 14 no se publica —sería una promesa vacía— y el formulario pide sin
    ofrecer nada.

### Día 1 — Calidad mínima de SaaS

- [x] **[C-3] Race condition en rate limiting del asistente IA**
  - Archivo: `supabase/functions/asistente-termico/index.ts:152-188`
  - Patrón read-then-write permite superar el límite con requests concurrentes.
  - Reemplazar por función SQL atómica con `INSERT ... ON CONFLICT DO UPDATE` y RETURNING.

- [x] **[A-4] Input sin validación de tamaño en la Edge Function**
  - Archivo: `supabase/functions/asistente-termico/index.ts:191`
  - Sin límite en `messages.length` ni `content.length`. Expuesto a abuso de tokens.
  - Agregado: 4000 chars por `content` y tope duro de mensajes en el array.
  - ⚠ **Actualizado el 2026-09-09**: el tope de 50 devolvía `400` y le rompía el
    chat al instalador que venía trabajando hace rato. Ahora el tope duro es 200
    —sólo contra un body absurdo— y el recorte real lo hace
    `ventanaDeConversacion`, que manda al modelo las últimas 4 idas y vueltas
    (`MENSAJES_AL_MODELO = 8`). Ver la sección del asistente.

- [x] **[A-1] Sin lazy loading en páginas (viola regla del CLAUDE.md)**
  - Archivo: `src/App.tsx:1-14`
  - Todos los componentes de página se importan de forma estática.
  - Reemplazar por `React.lazy()` + `<Suspense>` para cada route.

- [x] **[A-6] 99 console.log de debug activos en el Simulador 2D**
  - Archivos: `pipeRouter.ts` (29 logs), `calculations.ts`, `Canvas.tsx`, otros.
  - Rodean lógica interna en la consola del browser en producción.
  - Envolver con `if (import.meta.env.DEV)` o eliminar directamente.

### Semana 1 — Antes de aceptar pagos reales

- [x] **[A-2] CORS wildcard `*` en Edge Functions con autenticación**
  - Archivos: `asistente-termico/index.ts`, `create-subscription/index.ts`
  - Cambiar `'Access-Control-Allow-Origin': '*'` por el dominio real de GitHub Pages.

- [x] **[A-5] CI/CD sin lint antes del deploy**
  - Archivo: `.github/workflows/deploy.yml`
  - Agregar steps `npx tsc --noEmit` y `npm run lint` antes del build.

- [x] **[B-1] Sin error tracking en producción**
  - No hay Sentry ni equivalente. Los errores son invisibles.
  - Integrar Sentry (plan free) o al menos `window.onerror` hacia un log externo.

- [ ] **Testear flujo completo de MercadoPago en sandbox**
  - Verificar: crear suscripción → pago → webhook → tier actualizado en BD → UI refleja cambio.
  - No ir a producción con pagos reales sin este test end-to-end.

### Semana 2 — Estabilización

- [x] **[M-1] Tier persistido en localStorage puede desincronizarse**
  - Si se cancela una suscripción via webhook, el frontend sigue mostrando el tier viejo.
  - No persistir `tier` en localStorage o refrescarlo al navegar.

- [x] **[A-3] Funciones de cálculo con TODO en el Simulador 2D**
  - Verificado: `calculatePressureLoss()` e `isBoilerPowerSufficient()` no se usaban en
    ningún lado del código. Se eliminaron (eran stubs muertos, no funcionalidad crítica).
    Mismo hallazgo y mismo tratamiento en `closestPointOnLine()` (geometry.ts),
    `addElement()` y `moveElement()` (useElementsStore.ts) — todos stubs TODO sin uso real.

- [x] **[M-3] Campo `backgroundImage` deprecado sigue en el store**
  - Archivo: `src/components/simulador/store/useElementsStore.ts:22`
  - Marcado como `// DEPRECATED - usar floorPlans` pero sigue presente.

- [x] **[M-2] Duplicación `store/` vs `stores/` en el simulador**
  - `companyStore.ts` está en `/stores/` mientras los demás están en `/store/`.
  - Unificar en una sola carpeta.

- [x] **Escribir tests para los motores de cálculo**
  - Se eliminó la duplicación: `CalculadoraPotencia.tsx` tenía su propia copia de
    `calcularPotencia()`/`kcalToKw()` casi idéntica a `thermalCalculator.ts`. Ahora
    importa `calculateRoomPower()`/`kcalToKw()` de ahí — un solo lugar para testear.
  - Vitest instalado (`npm run test` / `test:ui` / `test:coverage`, antes no existía
    pese a estar documentado). 28 tests en `thermalCalculator.test.ts` cubriendo
    `calculateRoomPower`, `calculateInstalledPower`, `isPowerSufficient`,
    `calculateBoilerPower`, `kcalToKw`/`kwToKcal` — factores térmicos, ajustes que
    suman (no multiplican), redondeo, división por cero y casos en 0.

### Estado real al 2026-08-14

Este bloque decía, hasta hoy, que no había tests y que el hosting era GitHub
Pages. Las dos cosas eran falsas hacía más de un mes: **si algo de acá no
coincide con el código, gana el código, y se corrige este archivo en la misma
sesión.**

**Salud:** typecheck limpio, lint 0 errores (7 warnings viejos de
`exhaustive-deps` en el Simulador), **186 tests en 14 archivos**, build ~7 s,
producción al día.

**Lo que está resuelto:** hosting en Vercel, `ai_usage` con RPC atómica, webhook
de MP con verificación HMAC, RAG con reindexado automático, asistente en Opus 5
abierto sin cuenta, índice temático de errores, bandeja de consultas abiertas.

**Lo que sigue abierto, en orden:**

1. ⬜ **Cerrar la bandeja** — enganchar `ContribucionForm` a `contribuciones`,
   la vista en `/panel` (vía Edge Function con service_role: el gate por email
   del panel es de frontend y no alcanza para datos de instaladores) y el n8n.
2. 🟡 **El cobro de suscripciones: armado y andando en PRUEBA. Falta pagar
   una vez.** Estado al 2026-09-05, verificado contra producción con
   `bash scripts/mp-suscripciones.sh --verificar`:

   ✅ Tabla `suscripciones` aplicada (RLS activa, 1 policy) · los 4 secrets de
   MP cargados · las 4 Edge Functions desplegadas · el webhook contesta **401
   por firma** (antes 500) · los dos planes creados en MP
   (`MP_PRO_PLAN_ID=3233f403c5bb4671b228bd6ebd1821c6`,
   `MP_PREMIUM_PLAN_ID=912cf6425db543218fcb09ee42210618`, **$30.000 y $40.000
   ARS desde el 2026-09-08**) · **el checkout ABRE con el importe correcto**.

   🔑 **Se está usando la aplicación NUEVA de MP: «Criterio Termico Plataforma»,
   AppID `4528717241708762`, con CREDENCIALES DE PRUEBA.** La del sitio,
   «Criterio Termico» (`1426858103774532`), no se toca: guardar su configuración
   de webhooks regenera la clave y le rompe el cobro de repuestos, que factura
   desde el 1/9.

   🔜 **ACÁ SE SIGUE (lunes 2026-09-08): pagar una vez con el comprador de
   prueba** y confirmar que el tier sube solo y que queda la fila en
   `suscripciones`. Recorrido: cerrar sesión de MP o ventana de incógnito →
   entrar con la cuenta de prueba (panel → Cuentas de prueba) → desde
   `app.crtermico.com/cuenta` con una cuenta gratuita apretar «Actualizar a
   PRO» → pagar con tarjeta de prueba MLA (Mastercard `5031 7557 3453 0604`,
   CVV 123, 11/30; titular **APRO**, DNI 12345678 = pago aprobado).
   ⚠ MP NO deja suscribirse con la cuenta dueña del servicio: con la sesión real
   de Edgardo el pago no va a andar.

   ✅ **2026-09-08 — el webhook aceptaba cualquier texto como usuario** (ya
   desplegado, versión 12; verificado en producción: POST sin firma contesta
   `401 Unauthorized` en texto plano, o sea contesta la función y no el gateway). A la
   01:56 llegó un aviso real con `external_reference` = `"diagnostico|…"`: el
   código comprobaba que el tier fuera válido pero del usuario sólo que no
   estuviera vacío, así que ese texto llegó hasta una columna `uuid` y Postgres
   cortó con `22P02 invalid input syntax for type uuid`. El webhook contestaba
   **500 y MP reintenta todo lo que no conteste 200/201**, de manera que el
   mismo aviso roto vuelve para siempre y el webhook figura como fallado en el
   panel. Ahora el usuario se valida como UUID y **lo que no se puede procesar
   nunca se descarta con 200 dejando rastro en el log** (referencia inválida,
   aviso sin id, factura sin `preapproval_id`); lo que sí puede salir bien en el
   reintento —MP o la base caídas— sigue con 500. De paso, `recalcularTier`
   verifica que el perfil exista: un `update` que no encuentra a nadie no es
   error para PostgREST y el log venía diciendo que el tier subió sin que
   subiera nada.

   ⬜ **Después de la prueba**: repetir con credenciales de PRODUCCIÓN — planes
   nuevos con el token productivo, `--secrets` de nuevo y el webhook en «Modo
   productivo» (la clave secreta es otra).

   ✅ **2026-09-08 — LOS PRECIOS: $30.000 PRO y $40.000 PREMIUM, en pesos.**
   Antes la pantalla anunciaba USD 10 / USD 18 mientras MP cobraba $12.000 y
   $21.000: con el dólar a $1.530 se cobraba un 22% menos de lo anunciado, y el
   desfasaje crecía solo cada vez que se movía el dólar. Se cobra en Argentina
   por MercadoPago, así que el cobro es en pesos y el cartel dice lo mismo.

   🔑 **El precio vive en DOS lugares y los dos se mueven juntos:**
   1. **Lo que se COBRA**: el plan de MP (`PUT /preapproval_plan/{id}` con
      `auto_recurring`). `create-subscription` lo lee antes de cada alta, así
      que cambiarlo NO obliga a redesplegar.
   2. **Lo que se MUESTRA**: `app/src/app/routes/Cuenta.tsx` **y**
      `src/pages/plataforma.astro` del repo del SITIO, que es la puerta de
      entrada al SaaS. Los tres desalineados es como estaba antes.

   ⚠ **El plan anual salió del cartel.** Anunciaba «USD 100/año (2 meses
   gratis)» y no existía: el botón manda `{ tier }` y cada tier mapea a UN plan
   de MP, el mensual, así que el que leía el precio anual y apretaba terminaba
   en el mensual. Para traerlo: dos planes anuales en MP y un selector.

   ✅ **Los topes mensuales, IMPLEMENTADOS el 2026-09-08**: 15 gratuito, 80 PRO
   y 120 PREMIUM, con el ciclo anclado al día de alta. Ver «Tiers de
   suscripción» más arriba para el detalle de las funciones y las trampas.
   El instalador ve cuánto le queda en el pie del chat, **a partir de la mitad
   del cupo**: el saldo viaja en las cabeceras `X-Cupo-*` de la respuesta del
   asistente, así que no hay una llamada aparte para dibujarlo.

   ⚠ Esas cabeceras van declaradas en `Access-Control-Expose-Headers`
   (`_shared/cors.ts`). Sin eso el navegador las esconde, `headers.get()`
   devuelve `null` **sin dar ningún error** y el contador no aparece nunca.

   📐 **De dónde salen esos números** (monotributo, dólar a $1.530, comisión de
   MP del 7,25% con acreditación inmediata): el costo estimado de una consulta
   es de USD 0,09 —USD 0,05 con el historial acotado—, y con 80 y 120 el margen
   queda en 56% y 51%, o 72% y 70% con el recorte. Premium rinde más que Pro
   **mientras la consulta cueste menos de USD 0,15**.

   ✅ **PRIMERA MEDICIÓN REAL — 2026-09-09, 2 consultas en producción:**
   entrada 5.972 · salida 1.065 · caché leída 4.415 · caché escrita 4.415.
   Con los precios de Opus 5 (entrada $5, salida $25, caché $0,50 lectura y
   $6,25 escritura por millón, verificados en claude.com/pricing):

   | | USD por consulta | Margen PRO | Margen PREMIUM |
   |---|---|---|---|
   | Estimado en papel | 0,090 | 56% | 51% |
   | **Medido, caché fría** | **0,043** | **81%** | **79%** |
   | **Medido, caché caliente** | **0,029** | **87%** | **86%** |

   🔑 **La estimación estaba TRIPLICADA.** Y con la ventana de 8 el costo por
   consulta ahora tiene TECHO — antes crecía sin límite con el largo de la
   charla. ⚠ Son 2 consultas y `trimmed_count = 0`: ninguna llegó a tocar la
   ventana, así que el promedio va a subir algo con conversaciones largas.
   **Volver a mirar con una semana de uso antes de mover precios.**

   🔴 **La cuenta vieja era una estimación, no una medición.** Hasta ese día `ai_usage.tokens_used` estuvo en 0 en las 36
   filas de la tabla: 69 consultas en dos meses sin un token registrado, con la
   API devolviendo el consumo real en cada respuesta. Ahora
   `registrar_consumo_ia` guarda entrada, salida y caché por separado (los tres
   precios son distintos) más `trimmed_count`, que dice cuántas consultas
   llegaron con más charla de la que entra en la ventana. **Antes de volver a
   tocar precios o cupos, mirar los números reales**, no éstos:

   ```sql
   select sum(input_tokens), sum(output_tokens), sum(cache_read_tokens),
          sum(request_count), sum(trimmed_count)
     from ai_usage where date >= current_date - 30;
   ```

   ✅ **2026-09-05 — lo que se arregló en el camino**: la suscripción se pedía
   con `preapproval_plan_id`, y ese camino exige `card_token_id` (tarjeta
   tokenizada en formulario propio): MP contestaba 400 y **el botón no hacía
   nada ni mostraba nada**. Ahora se crea SIN plan asociado —MP la deja en
   `pending`, devuelve el checkout y conserva el `external_reference`— y el
   importe se lee del plan, así cambiar el precio en MP no obliga a
   redesplegar. El front pasó a mostrar el motivo de cualquier fallo.

   ✅ **2026-09-05 — lo estructural**: tabla `suscripciones` (no quedaba
   registro de nada: sin `preapproval_id` no se podía contestar un reclamo ni
   cancelar desde la app), el evento `subscription_authorized_payment` (los
   cobros mensuales no se escuchaban) y el tier recalculado desde las
   suscripciones autorizadas en vez de salir del último aviso.

   ⚠ **El archivo `~/.ct-mp-secrets` sigue en el disco** con el token y la clave
   del webhook. Se borra cuando termine la puesta en marcha: `rm ~/.ct-mp-secrets`.

   ✅ **2026-08-28 — dos bugs que lo habrían hecho fallar en silencio, ya
   desplegados el 5/9:**

   - **El gateway de Supabase rechazaba a MercadoPago.** Verificado con curl contra
     producción: el webhook contestaba `UNAUTHORIZED_NO_AUTH_HEADER` a cualquier
     POST sin JWT, y MP no manda JWT. Ningún pago habría subido el tier jamás.
     Declarado `verify_jwt = false` en `supabase/config.toml`.
   - **El manifest de la firma HMAC estaba mal armado.** Era
     `id:<x-request-id>;request-date:<ts>;` y el formato real de MP es
     `id:<data.id>;request-id:<x-request-id>;ts:<ts>;`, con el `data.id` sacado del
     QUERY de la URL. Rechazaba todos los pagos legítimos con 401 sin dar error.
     La comparación pasó a ser en tiempo constante.

   🔑 **La referencia del mismo circuito está en el otro repo**, el sitio Astro:
   `api/mp-webhook.js` de `~/Desktop/Trabajos/Criterio Termico`, con su
   `docs/mercadopago.md`.

2bis. ✅ **El asistente ya no aparece en `/cuenta`** (6/9). Lo había visto
   Edgardo el 5/9. La regla vive en `app/src/App.tsx`: `RUTAS_SIN_ASISTENTE`
   lista las rutas donde no se dibuja, y ahí ni se monta el hook del chat.
   Se sacó de toda la ruta, no sólo del login: en el celular el botón le
   quedaba encima de «Actualizar a PRO».

3. ⬜ **Activar el filtro por tier del RAG.** La columna `conocimiento.tier`
   está poblada pero el filtro no está encendido — decisión de Edgardo, se
   enciende antes de empezar a cobrar (es pasarle el tier a `match_conocimiento`).
4. ⬜ **SMTP real antes del lanzamiento.** Hoy `mailer_autoconfirm=true`: el
   registro no verifica el email porque no hay servidor de correo.
5. ⬜ **Auditar los 17 casos con Edgardo**, empezando por los de tier pro. Ya
   apareció contenido técnico mal en tier pago más de una vez.
6. ⬜ **Cap. 14 y las 5 fotos del manual** — los dos esperan material de él.

### Dominio propio — 2026-09-05

La plataforma pasó de `criterio-termico.vercel.app` a **`app.crtermico.com`**.
El DNS no hubo que tocarlo: `crtermico.com` tiene un comodín `*` ALIAS a Vercel,
así que el subdominio ya resolvía y sólo faltaba que un proyecto lo reclamara
(`vercel domains add app.crtermico.com criterio-termico`). El sitio institucional
no se tocó: sigue con `crtermico.com` y `www.` en el proyecto `criteriotermico-web`.

**Lo que hubo que mover, que es más de lo que parece.** Mudar un dominio acá no
es cambiar un enlace: hay tres cosas que se rompen calladas.

1. 🔴 **CORS de las Edge Functions.** Servido desde el dominio nuevo, con el
   secret viejo el navegador descarta las respuestas: el asistente, el análisis
   de plano y el alta de suscripción dejan de andar y el servidor no registra
   ningún error. Ahora `_shared/cors.ts` acepta varios orígenes y contesta el
   que pidió.
2. 🔴 **Site URL de Auth.** De ahí salen los links de los correos de
   confirmación y de recuperar contraseña; apuntando al dominio viejo el usuario
   termina en otro lado. La lista de redirects se amplía, nunca se pisa.
3. 🟡 **`APP_URL`** — a dónde vuelve el comprador desde el checkout de MP.

Lo demás es visible y se corrigió junto: canonical, `og:url`, `og:image`,
`twitter:image`, `sitemap.xml`, `robots.txt`, el JSON-LD del Home, `ficha.html`,
el default de `GSC_SITE` y el `PLATFORM_URL` del sitio Astro
(`src/pages/plataforma.astro`), que alimenta los siete CTA que son la única
puerta de entrada al SaaS.

`app/vercel.json` redirige con **308** todo lo que llegue por
`criterio-termico.vercel.app`. Sin eso quedarían dos sitios idénticos en Google.
Las URLs de preview no se ven afectadas: tienen otro host.

⚠ **La parte de Supabase se corre a mano** — necesita el token del llavero, que
el asistente no puede leer:

```bash
bash scripts/dominio-a-supabase.sh --solo-diagnostico   # no toca nada
bash scripts/dominio-a-supabase.sh                      # auth + secrets + deploy + verificación
```

⬜ **Pendiente de Search Console:** la propiedad `app.crtermico.com` hay que
verificarla en GSC o el panel `/panel` va a mostrar las instrucciones en vez de
las métricas. Alternativa: cargar `GSC_SITE=sc-domain:crtermico.com` en Vercel,
pero eso mezcla las visitas del sitio con las de la plataforma.

### Hallazgos del relevamiento de stack — 2026-08-28

Verificados contra el código al escribir el informe de stack (artifact
`5347d113-807f-4535-a5b4-7f91009e49fe`). Ninguno estaba anotado acá:

1. ✅ **La cuota se descontaba ANTES de validar el body — resuelto el
   2026-09-08.** Pasaba en `asistente-termico` y también en `analizar-plano`: un
   pedido mal formado (o un plano demasiado grande) devolvía 400 y ya se había
   llevado una consulta del cupo sin llamar al modelo. Se le cobraba al
   instalador un error del programa. En las dos funciones el descuento pasó a
   correr **después** de parsear y validar.
2. 🟡 **«Proyectos guardados ilimitados» — la promesa se sacó del cartel el
   2026-09-09, la función sigue sin existir.** `projectStorage.ts` guarda UN
   proyecto en localStorage bajo la clave `currentProject`, sin la imagen del
   plano. No hay tabla, ni sincronización, ni export del proyecto a archivo (sí
   a DXF y PDF). Decisión de Edgardo: antes que sostener lo que no hay, se
   eliminó el renglón de `Cuenta.tsx` y de la página de precios del sitio. 🔑 **Si
   alguna vez se implementa el guardado, hay que volver a anunciarlo en los DOS
   lados.**

   En la misma pasada salió **«Herramientas de presentación»**, que no
   correspondía a ninguna función —no existía nada con ese nombre en todo el
   frontend— y repetía lo que ya dicen «Exportación PDF profesional» y
   «Presupuestos detallados». En su lugar quedó la exportación del plano, que sí
   es real: desde el 2026-09-10 el cartel dice **«Exportación a DXF (AutoCAD)»**
   en `Cuenta.tsx` y en `GuiaDeUso.tsx`. 🔑 **Si cambia el formato, hay que
   cambiarlo también en la página de precios del sitio Astro** —es otro repo—.
3. ⛔ **Exportador IFC: ELIMINADO el 2026-09-10.** Lo que sigue es historia, no
   trabajo pendiente: el archivo, su test y el botón ya no existen, y el único
   formato de exportación del plano es el DXF. Se conserva el relato porque los
   bugs valen para cualquier exportador que se escriba.

   ✅ **Antes se había arreglado, el 2026-09-08** (rama `arreglo/exportador-ifc`).
   Eran los 3 bugs del plan **más dos que la auditoría no había visto**:
   - 🔴 **Los radiadores no se exportaban.** El botón los comprobaba para
     habilitarse y después no se los pasaba a `downloadIFCFile`. Una
     instalación de radiadores salía sin radiadores.
   - 🔴 **El archivo declaraba IFC2X3 y escribía entidades de IFC4**
     (`IFCBOILER`, `IFCPIPESEGMENT`): en 2X3 esas entidades no existen. Pasó a
     declarar IFC4, que es lo que realmente escribe.
   - 🔴 **La escala estaba a la mitad**: 100 px/m escritos a mano contra los 50
     del simulador. Ahora sale de `PIXELS_PER_METER`. **No volver a copiar el
     número.**
   - Doble `IfcProject` (guard de idempotencia en `setupProject`), caldera al
     doble de distancia (la posición vive sólo en el `IFCLOCALPLACEMENT`) y
     caños sin cuerpo (`IFCSWEPTDISKSOLID` con representación
     **`'AdvancedSweptSolid'`**, no `'SweptSolid'`).

   7 casos nuevos en `ifcExporter.test.ts` fijan cada invariante: ninguno de
   estos errores daba error, el archivo se generaba igual. Detalle completo en
   `docs/plan-exportador-ifc.md`, marcado como histórico. Los colectores y los
   circuitos de piso radiante **sí salen, por el DXF**. ⬜ Lo único que sigue
   abierto de aquella lista: qué hacer cuando el usuario sube un plano con SU
   escala (hoy se asumen siempre los 50 px/m).
4. ⬜ **`app/vercel.json` no tiene cabeceras de seguridad**: sólo define caché
   de `/assets`. El HSTS lo pone Vercel; faltan `X-Content-Type-Options`,
   `X-Frame-Options` y `Referrer-Policy`.
5. ✅ **El default de `ALLOWED_ORIGIN` apuntaba a GitHub Pages** (dado de baja).
   Resuelto el 2026-09-05 con la mudanza a `app.crtermico.com`: los defaults
   viven en `supabase/functions/_shared/cors.ts` y son los dos dominios reales.
6. ⬜ **8 de los 14 capítulos del manual dicen «disponible próximamente»** — hay
   5 escritos y el 13 redirige a `/errores`. Varios de los vacíos son de tier
   pago: un Premium ve capítulos anunciados sin texto.
7. ⚠ **El paywall de calculadoras y contenido es de cliente** — y no puede no
   serlo mientras el cálculo corra offline en el browser. Lo único que la BD
   controla de verdad es la IA y los datos por cuenta. Es tensión de producto,
   no bug; conviene decidirla antes de cobrar.
8. ⚠ **CI y deploy son circuitos independientes**: el repo no declara ninguna
   dependencia entre GitHub Actions y la publicación de Vercel, así que un push
   con tests rotos se publica igual salvo que Vercel esté configurado para
   esperar los checks.

⚠️ **Cuando hay que confirmar un número técnico, la fuente es Edgardo, no una
fuente general ni el razonamiento propio.** Está en la skill
`criterio-termico-obra`, junto con la separación entre lo que es **fondo**
(ingeniería: se afirma) y lo que es **forma** (ejecución: hay varias maneras
válidas y no se corona ninguna).
