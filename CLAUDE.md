# Criterio Térmico — CLAUDE.md

Plataforma SaaS para instaladores de calefacción por radiadores.
Stack: React 19 + TypeScript 5.9 + Vite 7 + Supabase + Vercel.
Producción: https://criterio-termico.vercel.app (root directory: `app/`).

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

⚠️ **El CLI se cuelga MUDO en shell no interactiva.** No puede leer el llavero,
se queda esperando un login que nunca llega y no imprime nada: CPU en 0, sin
conexiones de red, y parece que estuviera trabajando. Pasarle el token a mano:

```bash
export SUPABASE_ACCESS_TOKEN=$(security find-generic-password -s "Supabase CLI" -w \
  | sed 's/^go-keyring-base64://' | base64 -d)
```

⚠️ **Aplicar migraciones a producción NO es `supabase db push`**: ese comando no
acepta `--project-ref` y pide la contraseña de la base, así que también cuelga.
Va por la Management API, con el mismo token:

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
npm run test         # Tests unitarios (Vitest)
npm run test:ui      # Tests con interfaz visual
npm run test:e2e     # Tests end-to-end (Playwright)
npm run test:coverage # Coverage report
```

---

## Estructura del proyecto

```
criterio-termico/
├── src/
│   ├── components/        # Componentes reutilizables
│   ├── pages/             # Páginas (lazy loaded)
│   ├── hooks/             # Custom hooks
│   ├── store/             # Zustand stores
│   ├── lib/               # Utilidades y cálculos de ingeniería
│   ├── types/             # TypeScript types e interfaces
│   ├── styles/            # CSS Modules globales y design tokens
│   └── content/           # Manual y casos de errores (TSX nativo)
├── supabase/
│   ├── functions/         # Edge Functions (Deno)
│   ├── migrations/        # Migraciones SQL ordenadas
│   └── seed.sql           # Datos iniciales para desarrollo
├── mcp-server/            # Servidor MCP de Criterio Térmico
│   └── src/
│       ├── index.ts
│       ├── tools/         # Handlers de cada herramienta MCP
│       └── lib/           # Cliente Supabase, cálculos, tipos
├── public/                # Assets estáticos
├── .github/
│   └── workflows/         # GitHub Actions (CI/CD)
├── CLAUDE.md              # Este archivo
└── .mcp.json              # Configuración del servidor MCP local
```

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
MERCADOPAGO_ACCESS_TOKEN=APP_USR-...
MAX_REQUESTS_PER_USER_FREE=10
MAX_REQUESTS_PER_USER_PRO=50
MAX_REQUESTS_PER_USER_PREMIUM=200
ALLOWED_ORIGIN=https://criterio-termico.vercel.app   # origen permitido para CORS — actualizar al comprar dominio propio
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

| Tier | Herramientas | IA/día |
|---|---|---|
| *(sin cuenta)* | prueba el asistente y nada más | 3 consultas |
| `free` | Calculadora Potencia, 5 errores, índice manual | 10 consultas |
| `pro` | + Diámetros, Caudal, Piso Radiante, Bombas | 50 consultas |
| `premium` | + Simulador 2D, BIM, todo el manual | 200 consultas |

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
| `asistente-termico` | `/functions/v1/asistente-termico` | Chat con streaming SSE + RAG. Registra en `consultas_abiertas` lo que declara no saber |
| `analizar-plano` | `/functions/v1/analizar-plano` | Visión: lee el plano y devuelve por ambiente pared exterior, ventanas y puerta (solo Premium, cupo 20/día) |
| `indexar-conocimiento` | `/functions/v1/indexar-conocimiento` | Indexa fragmentos con embeddings gte-small (solo service_role) |
| `mercadopago-webhook` | `/functions/v1/mercadopago-webhook` | Webhook de MercadoPago |
| `create-subscription` | `/functions/v1/create-subscription` | Iniciar pago MP |

### Modelo de IA (desde 2026-08-14)

Las dos funciones de IA corren **`claude-opus-5`** con pensamiento adaptativo en
esfuerzo `medium`, SDK `@anthropic-ai/sdk@0.117.1`.

⚠ **`max_tokens` topea PENSAMIENTO + RESPUESTA juntos.** Es el error que ya se
cometió: con 512 las respuestas se cortaban a mitad sin dar ningún error. Hoy
son 2048 (anónimo y free), 3072 (pro), 4096 (premium) y 8192 en `analizar-plano`.
Si se sube el esfuerzo, subir también estos topes.

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

## Servidor MCP — configuración local

```json
// .mcp.json en la raíz del proyecto
{
  "mcpServers": {
    "criterio-termico": {
      "type": "url",
      "url": "http://localhost:8000/mcp",
      "headers": {
        "Authorization": "Bearer <SUPABASE_ANON_KEY>"
      }
    }
  }
}
```

Herramientas disponibles en el MCP:
- `buscar_caso_error` — busca en los casos documentados
- `calcular_potencia_ambiente` — cálculo de potencia térmica
- `consultar_manual` — acceso al contenido del manual
- `verificar_usuario` — perfil y tier del usuario
- `validar_diseno_instalacion` — validación técnica de un diseño
- `obtener_estadisticas_proyecto` — métricas actuales del proyecto

---

## Skills del proyecto

Las tres skills del proyecto están en la raíz del repo:

| Archivo | Cuándo Claude lo usa |
|---|---|
| `criterio-termico-dev/SKILL.md` | Arquitectura, stack, convenciones de código |
| `criterio-termico-ia/SKILL.md` | Prompts del asistente, Edge Functions de IA |
| `criterio-termico-mcp/SKILL.md` | Servidor MCP, herramientas, SQL |

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
  tuberías automáticamente. Exporta a PDF (jsPDF) y BIM.

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
  - Agregar: máximo 50 mensajes en el array, máximo 4000 chars por `content`.

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
2. 🔴 **Test end-to-end de MercadoPago en sandbox.** Nunca se hizo y van a
   cobrar. Los secrets `MP_ACCESS_TOKEN` y `MP_WEBHOOK_SECRET` tampoco están
   cargados en Supabase.
3. ⬜ **Activar el filtro por tier del RAG.** La columna `conocimiento.tier`
   está poblada pero el filtro no está encendido — decisión de Edgardo, se
   enciende antes de empezar a cobrar (es pasarle el tier a `match_conocimiento`).
4. ⬜ **SMTP real antes del lanzamiento.** Hoy `mailer_autoconfirm=true`: el
   registro no verifica el email porque no hay servidor de correo.
5. ⬜ **Auditar los 17 casos con Edgardo**, empezando por los de tier pro. Ya
   apareció contenido técnico mal en tier pago más de una vez.
6. ⬜ **Cap. 14 y las 5 fotos del manual** — los dos esperan material de él.

⚠️ **Cuando hay que confirmar un número técnico, la fuente es Edgardo, no una
fuente general ni el razonamiento propio.** Está en la skill
`criterio-termico-obra`, junto con la separación entre lo que es **fondo**
(ingeniería: se afirma) y lo que es **forma** (ejecución: hay varias maneras
válidas y no se corona ninguna).
