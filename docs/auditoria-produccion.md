# Auditoría de Producción — Criterio Térmico

**Fecha:** 25 de febrero de 2026  
**Objetivo:** Evaluar el estado actual de la plataforma para identificar qué falta antes de producción.

---

## Estado General

La plataforma tiene una **estructura sólida** (navegación, autenticación, suscripciones, UI) pero le falta **todo el contenido técnico** y la **integración funcional de herramientas**.

---

## ✅ Implementado y Funcional

| Componente | Archivo(s) | Estado |
|---|---|---|
| Home (hero + features + diferenciadores) | `routes/Home.tsx` | ✅ Completo |
| Navegación y layout principal | `layouts/MainLayout.tsx` | ✅ Completo |
| Índice del Manual (14 caps, 5 partes) | `routes/ManualTecnico.tsx` | ✅ Estructura |
| Autenticación demo (Zustand + persist) | `stores/useAuthStore.ts` | ✅ Demo |
| Control de acceso free/pro/premium | `useAuthStore.canAccess()` | ✅ Funcional |
| Planes de suscripción en Cuenta | `routes/Cuenta.tsx` | ✅ Completo |
| Formulario de contribuciones | `components/contributions/` | ✅ Completo |
| Términos de Uso | `routes/TerminosDeUso.tsx` | ✅ Completo |
| SEO (meta tags, schema.org, sitemap) | `index.html`, `sitemap.xml` | ✅ Básico |
| API de cálculo (proyecto separado) | `api-calefaccion-source/` | ✅ Existe |
| Documentación del proyecto | `docs/` (4 archivos) | ✅ Completo |

---

## ❌ Faltante para Producción

### 1. Contenido Técnico del Manual — PRIORIDAD ALTA

**Estado actual:** 0% de contenido. Cada capítulo muestra *"📝 Contenido en desarrollo"*.  
Los directorios `content/manual/` y `content/errores/` están vacíos.

**Capítulos marcados como disponibles (sin contenido):**

| Cap | Título | Acceso | Contenido |
|-----|--------|--------|-----------|
| 1 | El relevamiento técnico de la vivienda | free | ❌ Vacío |
| 2 | Estrategia de confort térmico | free | ❌ Vacío |
| 3 | Análisis de pérdidas térmicas reales | pro | ❌ Vacío |
| 4 | Cálculo de potencia térmica por ambiente | pro | ❌ Vacío |
| 13 | Errores frecuentes en instalaciones reales | pro | ❌ Vacío |
| 14 | Experiencias reales y aportes de la comunidad | free | ❌ Vacío |

**Capítulos marcados como no disponibles (caps 5–12):** bloqueados con "Próximamente".

**Acción requerida:** Escribir contenido técnico real para caps 1, 2, 3, 4, 13, 14 como mínimo.

---

### 2. Errores Frecuentes — PRIORIDAD ALTA

**Estado actual:** 5 tarjetas con título y preview, sin contenido detallado.

| Error | Categoría | Tier | Contenido completo |
|-------|-----------|------|---------------------|
| Algunos radiadores no calientan | Desbalance hidráulico | free | ❌ |
| Ruidos en las tuberías | Velocidad excesiva | free | ❌ |
| Factura de gas muy alta | Eficiencia | pro | ❌ |
| La caldera arranca y para constantemente | Dimensionamiento | pro | ❌ |
| Radiador frío en la parte inferior | Acumulación de lodos | premium | ❌ |

**Problemas técnicos:**
- No existe ruta `/errores/:id` en `App.tsx` — los links "Ver caso completo" apuntan a una ruta inexistente
- No hay componente para la vista individual de un caso

**Acción requerida:**
1. Crear contenido completo (problema → causa → solución) para cada caso
2. Agregar ruta `errores/:errorId` en `App.tsx`
3. Crear vista individual de error

---

### 3. Herramientas de Cálculo — PRIORIDAD MEDIA-ALTA

**Estado actual:** 5 herramientas listadas, todas muestran *"🚧 Herramienta en desarrollo"*.

| Herramienta | Tier | Funcional |
|-------------|------|-----------|
| Calculadora de Potencia | free | ❌ Placeholder |
| Calculadora de Diámetros | pro | ❌ Placeholder |
| Calculadora de Caudal | pro | ❌ Placeholder |
| Simulador 2D | premium | ❌ Placeholder |
| Generador de Presupuestos | premium | ❌ No disponible |

**Nota:** La API de cálculo existe en `api-calefaccion-source/src/utils/` con:
- `thermalCalculator.ts` — cálculos térmicos
- `pipeDimensioning.ts` — dimensionamiento de tuberías
- `calculations.ts` — cálculos generales
- `pdfGenerator.ts` — generación de PDF

**Acción requerida:** Integrar al menos la calculadora de potencia (herramienta free) como MVP funcional.

---

### 4. Autenticación Real — PRIORIDAD MEDIA

**Estado actual:** Login demo — cualquier email crea un "Usuario Demo" en tier free.  
**Archivo:** `stores/useAuthStore.ts` línea 51: `// TODO: Implementar autenticación real con Firebase/Supabase`

**Acción requerida:** Integrar Supabase o Firebase para autenticación real.

---

### 5. Pasarela de Pago — PRIORIDAD MEDIA

**Estado actual:** El upgrade solo cambia el estado local.  
**Archivo:** `routes/Cuenta.tsx` línea 70: `// TODO: Integrar pasarela de pago real`

**Acción requerida:** Integrar Stripe o MercadoPago para suscripciones reales.

---

## ⚠️ Problemas Técnicos Adicionales

1. **Datos hardcodeados en componentes** — Los datos del manual, errores y herramientas están inline en los `.tsx`. Deberían estar en archivos de datos separados (`content/`) para facilitar actualizaciones.

2. **Directorios vacíos creados pero no desarrollados:**
   - `components/manual/`
   - `components/calculadoras/`
   - `components/simulador/`

3. **Inconsistencia de precios entre documentos:**
   - `monetizacion.md`: PRO USD 10/mes, PREMIUM USD 18/mes
   - `VISION_Y_ROADMAP.md`: PRO €49/mes (España), PREMIUM €149/mes (España)
   - `Cuenta.tsx`: PRO USD 10/mes, PREMIUM USD 18/mes
   - **Decisión necesaria:** unificar el modelo de precios

4. **Sin sistema de contenido** — No hay MDX, no hay CMS, no hay archivos JSON de contenido. Se necesita definir cómo se cargará el contenido técnico.

---

## 📋 Plan de Continuación (orden sugerido)

### Fase 1 — Contenido mínimo viable
- [ ] Definir formato de contenido (MDX recomendado)
- [ ] Escribir contenido del Capítulo 1 (Relevamiento técnico)
- [ ] Escribir contenido del Capítulo 2 (Estrategia de confort)
- [ ] Implementar renderizado de contenido en `ManualTecnico.tsx`
- [ ] Mover datos de capítulos a archivos de contenido separados

### Fase 2 — Errores frecuentes funcionales
- [ ] Escribir casos completos (problema/causa/solución) para los 5 errores
- [ ] Agregar ruta `/errores/:errorId` en `App.tsx`
- [ ] Crear componente de vista individual de error
- [ ] Mover datos de errores a archivos de contenido

### Fase 3 — Primera herramienta funcional
- [ ] Integrar `thermalCalculator.ts` de la API
- [ ] Crear componente `CalculadoraPotencia` funcional
- [ ] Conectar con la ruta `/herramientas/potencia`

### Fase 4 — Infraestructura de producción
- [ ] Autenticación real (Supabase)
- [ ] Pasarela de pago (Stripe)
- [ ] Unificar modelo de precios

---

**Próxima sesión:** Continuar con Fase 1 — definir formato de contenido y comenzar a cargar los capítulos del manual.
