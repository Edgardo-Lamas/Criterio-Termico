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
| `free` | Calculadora Potencia, 5 errores, índice manual | 10 consultas |
| `pro` | + Diámetros, Caudal, Piso Radiante, Bombas | 50 consultas |
| `premium` | + Simulador 2D, BIM, todo el manual | 200 consultas |

El tier se guarda en la tabla `profiles.tier` y se controla con RLS en Supabase.
**Nunca controlar acceso por tier en el frontend** — solo para mostrar UI.
La restricción real la hace la BD.

---

## Edge Functions disponibles

| Función | Ruta | Descripción |
|---|---|---|
| `asistente-termico` | `/functions/v1/asistente-termico` | Chat con streaming SSE |
| `mcp-server` | `/functions/v1/mcp-server` | Servidor MCP del proyecto |
| `pagos-webhook` | `/functions/v1/pagos-webhook` | Webhook de MercadoPago |
| `crear-suscripcion` | `/functions/v1/crear-suscripcion` | Iniciar pago MP |

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
- `buscar_caso_error` — busca en los 200+ casos documentados
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
  (+200) están implementados como componentes TSX nativos, sin CMS externo.

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

- [x] **[C-4] Contribuciones solo en localStorage — nunca llegan a la BD**
  - Resuelto con Opción B (MVP): se sacó el punto de entrada (`ContributeSection` en
    `ManualTecnico.tsx`). El store y `ContribucionForm.tsx` quedan sin uso, listos para
    retomar con Opción A (tabla `contributions` + Storage) cuando haya un flujo real de
    revisión/aprobación — hoy no hay panel de admin para procesarlas.

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

### Notas para la próxima sesión de trabajo

- El proyecto tiene **stack confirmado**: React 19 + TypeScript + Vite + Supabase + GitHub Pages.
- No hay tests en absoluto en el proyecto (cero archivos `.test.ts` / `.spec.ts`).
- La migración `ai_usage` es el primer paso obligatorio — sin eso nada del asistente funciona.
- El webhook de MP es el segundo paso — es un riesgo de fraude activo desde el día 1.
- El resto puede ir iterando, pero en ese orden.
