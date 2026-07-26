# Plan — Panel de Métricas SEO (`/panel`)

> Creado el 2026-07-21. Objetivo: un panel interno para tomar decisiones de
> posicionamiento (SEO) en Criterio Térmico, tomando como modelo el panel ya
> funcionando en el proyecto **Sabiduría para el Corazón** (tab "SEO" +
> serverless functions de Google).

---

## Objetivo

Ruta `/panel` **privada (solo cuenta admin)** que muestre las métricas de SEO
accionables, para responder tres preguntas: *¿por qué palabras me encuentran?*,
*¿qué páginas rinden?* y *¿dónde están las oportunidades de crecimiento?*.

## Modelo de referencia

Proyecto **Sabiduría para el Corazón** (`../Sabiduria para el corazon/`):
- `api/search-console.js` — Google Search Console API (OAuth2 refresh token, caché 30 min)
- `api/analytics.js` — Google Analytics 4 Data API (OAuth2, `GA4_PROPERTY_ID`)
- `src/pages/Panel.jsx` — dashboard con tabs (Resumen / Audiencia / Contenido / YouTube / **SEO** / Heraldo), gráficos con Recharts

Adaptaciones obligatorias para CT (reglas del proyecto):
- **TypeScript** estricto (sin `any`) en vez de JS
- **CSS Modules** + design system propio en vez de Tailwind
- Serverless functions en **`app/api/*.ts`** (root de Vercel = `app/`)
- Ruta **protegida por admin** (Sabiduría la tiene pública; CT es SaaS)

---

## Métricas definidas

### Etapa 1 — Núcleo SEO (Google Search Console)  ← empezar por acá

Fuente: Google Search Console API. Es SEO puro y directamente accionable.

1. **Palabras clave / consultas** — con clics, impresiones, CTR y posición. Habilita:
   - Keywords en **posición 5–20 + muchas impresiones** = fruta al alcance → reforzar contenido para saltar a top 3.
   - Keywords con **impresiones altas + CTR bajo** = reescribir título/meta description.
   - Búsquedas donde **no aparecemos** = hueco de contenido (caso de error, capítulo, landing).
2. **Páginas** — qué URLs traen tráfico orgánico (páginas "motor" vs. flojas).
3. **CTR** — por consulta y por página (mide si el título+meta convencen; lo más rápido de accionar).
4. **Posición media + tendencia** — termómetro de si la estrategia funciona mes a mes.
5. **Impresiones vs. clics (tendencia diaria)** — salud de visibilidad.
6. **País + dispositivo** — dónde nos ven y **móvil vs. desktop** (el instalador busca desde el celular en la obra: prioridad móvil).

### Etapa 2 — Comportamiento y conversión (Google Analytics 4)

Fuente: GA4 Data API. Complementa el SEO uniéndolo al negocio.

7. **Sesiones orgánicas + páginas de aterrizaje** — qué hacen los que llegan por Google.
8. **Engagement** (tiempo, rebote) por página de aterrizaje — si el contenido cumple la intención de búsqueda.
9. **Conversión orgánica → registro (free) → pago** — cierra el círculo SEO ↔ negocio.

---

## Arquitectura / decisiones

- **Ruta:** `/panel` con `lazy()`, registrada en `app/src/App.tsx`. Acceso restringido a la cuenta admin (Edgardo). Definir mecanismo de "admin" (email hardcodeado en env vs. flag en `profiles`).
- **Functions:** `app/api/search-console.ts` y (etapa 2) `app/api/analytics.ts`. OAuth2 con refresh token, mismas env vars que Sabiduría: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN` (+ `GA4_PROPERTY_ID` en etapa 2). Caché en memoria 30 min.
- **UI:** CSS Modules + design system de CT. Tabs como Sabiduría, arrancando con **SEO**.
- **Gráficos:** DECISIÓN ABIERTA → Recharts (rápido, idéntico a Sabiduría) vs. SVG nativo (más fiel a la filosofía "sin librerías" de CT). Recomendación: Recharts.

---

## Bloqueantes / dependencias (para datos reales)

El panel se construye y funciona en "modo instrucciones" sin esto. Para ver
**números reales** hace falta:

- [ ] **Verificar el sitio en Google Search Console** (config con Google, ~5 min).
- [ ] **Dominio propio** (recomendado): en `criterio-termico.vercel.app` el SEO es
      limitado — Google prioriza dominios propios y no se puede verificar a nivel
      raíz un subdominio de vercel.app. (Ya estaba como pendiente del proyecto.)
- [ ] Crear proyecto en Google Cloud + OAuth2 (client id/secret) + obtener refresh token.
- [ ] Cargar env vars en Vercel.

---

## Hallazgos colaterales (SEO de raíz)

Detectados al revisar el repo el 2026-07-21. No bloquean el panel, pero son lo que
hace que las métricas realmente mejoren:

- [ ] **`app/vercel.json` reescribe TODO** (`/(.*)` → `/index.html`). Eso se comería
      las serverless functions. Excluir `/api/` del rewrite (Sabiduría usa `/((?!api/).*)`).
- **Meta tags por página: ya existen** ✅ (corrección del 2026-07-21). Hay un hook
  `src/lib/usePageMeta.ts` que setea `title` + `description` + `canonical` dinámicos
  por ruta, usado en las 9 rutas. Lo que **sí** falta / mejora el SEO:
  - [ ] **Open Graph por página** (`og:title`, `og:description`, `og:image`) — hoy
        `usePageMeta` no los toca; las previews en WhatsApp/redes usan el meta genérico.
  - [ ] **Los metas se setean por JS (SPA sin SSR).** Googlebot ejecuta JS y los ve,
        pero crawlers no-JS y algunos previews de redes leen el HTML servido (meta
        genérico del `index.html`). Evaluar prerender/SSR si el SEO lo exige.
  - `sitemap.xml` y `robots.txt` ya existen ✅.

---

## Etapas de implementación

### Etapa 1 — Panel + tab SEO (Search Console)  ✅ IMPLEMENTADA (2026-07-21)
- [x] Arreglar `app/vercel.json` (excluir `/api/` del rewrite SPA → `/((?!api/).*)`).
- [x] `app/api/search-console.ts` (OAuth2 + queries GSC: totales, daily, queries, pages, países, **device**).
- [x] Ruta `/panel` protegida (gate por email admin, `VITE_ADMIN_EMAIL`) + tabs (SEO activa, Audiencia "pronto").
- [x] UI con CSS Modules (tokens dark de CT) + **Recharts** (lazy-loaded, chunk propio ~113 kB gzip).
- [x] Estado "no conectado": guía de 4 pasos para conectar Google (OAuth2 refresh token).
- [x] Verificado: `tsc -b`, `eslint` y `npm run build` en verde.
- **Pendiente de endurecer:** la function `/api/search-console` es pública (devuelve
  métricas SEO del sitio, no datos de usuarios — riesgo bajo). El gate hoy es solo de
  UI. Mejora futura: validar el JWT de Supabase del admin dentro de la function.
- **Falta para datos reales:** conectar Google (ver "Bloqueantes"). Sin eso el panel
  muestra la guía de configuración.

### Etapa 2 — Google Analytics 4
- [ ] `app/api/analytics.ts` (sesiones, páginas de aterrizaje, engagement).
- [ ] Métrica de conversión orgánica → registro → pago (cruzar GA4 con `profiles`).
- [ ] Tab "Audiencia"/"Conversión" en el panel.

### Etapa 3 — SEO de raíz (complemento)
- [ ] Meta tags dinámicos por ruta (title/description/OG por página).
- [ ] Verificación en Search Console + (idealmente) dominio propio.
- [ ] Revisar/enriquecer `sitemap.xml` con todas las rutas de contenido.

---

## Estado

**2026-07-21 (1)** — Plan definido.
**2026-07-21 (2)** — Recharts confirmado. **Etapa 1 implementada y buildeando en verde.**
**2026-07-21 (3)** — Commit `b25ee8c` pusheado a `main`. **Deploy en producción `● Ready`**
(verificado por `vercel ls`). Panel vivo en `criterio-termico.vercel.app/panel` (gateado).

### Decisiones cerradas hoy
- **Credenciales Google:** se reutilizan las de Sabiduría (mismo Client ID/Secret + Refresh
  Token de la cuenta Google de Edgardo; el scope `webmasters.readonly` cubre todas sus
  propiedades). Solo cambia `GSC_SITE`. Claude tiene acceso al Vercel de CT (CLI, autenticado
  edgardo-lamas) → carga las env vars él cuando esté el dominio.
- **Se espera al dominio propio** (Edgardo lo compra ~2-3 días desde 21/07) antes de conectar
  Google. Configurar sobre vercel.app sería tirable.
- **GA4 no está instalado** en la app (index.html sin gtag). Etapa 2 requiere instalarlo primero.
- **Sesión pausada** — se retoma mañana.

---

## ► PRÓXIMA SESIÓN — arrancar por acá

Según lo que Edgardo tenga mañana:

**Si YA compró el dominio propio:**
1. Edgardo verifica el dominio como propiedad en Google Search Console (paso interactivo, cuenta Google suya).
2. Claude carga por CLI en el Vercel de CT: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`,
   `GOOGLE_REFRESH_TOKEN` (reusados de Sabiduría) + `GSC_SITE` = el dominio nuevo. Redeploy.
3. Verificar que `/panel` muestra datos reales de Search Console.
4. Actualizar `ALLOWED_ORIGIN` / dominio en el resto de la config si aplica (ver CLAUDE.md).

**Para la Etapa 2 (GA4) — se puede empezar sin dominio:**
1. Edgardo crea una propiedad en analytics.google.com y pasa el **Measurement ID** (`G-XXXX`).
   (La propiedad se lleva tal cual al dominio nuevo; GA4 solo mide hacia adelante → cuanto antes, más historia.)
2. Claude instala el tag GA4 en la app + construye `app/api/analytics.ts` + tab "Audiencia"
   en el panel (mismo patrón que Etapa 1). Incluye conversión orgánica → registro → pago (cruzar con `profiles`).

**Datos útiles ya guardados:** credenciales reutilizables de Sabiduría (en su Vercel), acceso
CLI a CT confirmado (proyecto `prj_VFvFS1yW3Xl05ozAJbSRymZrNAtm`, org edgardo-s-projects).
