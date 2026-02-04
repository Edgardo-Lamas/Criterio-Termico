# Guía Rectora del Proyecto

## Criterio Térmico

Este documento define los **principios no negociables** que rigen el diseño, desarrollo y crecimiento de la plataforma **Criterio Térmico**. Debe ser utilizado como referencia permanente por cualquier persona o sistema (incluido Antigravity) que participe en el proyecto.

---

## 1. Naturaleza del Proyecto

**Criterio Térmico NO es:**

* Un curso académico
* Un blog técnico
* Un catálogo de productos
* Un manual dependiente de marcas

**Criterio Térmico SÍ es:**

* Una plataforma técnica independiente
* Un sistema de toma de decisiones para instalaciones reales
* Una síntesis entre teoría clara, experiencia de obra y herramientas prácticas

El proyecto nace desde el **oficio**, no desde la academia ni el marketing.

---

## 2. Público Objetivo

El contenido está dirigido principalmente a:

* Instaladores de calefacción por radiadores
* Profesionales de la construcción (Arquitectos / MMO)

El lector/usuario:

* Trabaja en obra
* Necesita decidir rápido
* Valora el criterio por sobre la marca
* Busca soluciones que funcionen en la práctica, no solo en el papel

---

## 3. Enfoque Pedagógico

El aprendizaje se basa en tres pilares:

1. **Comprensión** – Entender por qué las cosas funcionan como funcionan
2. **Aplicación** – Usar herramientas reales (API de cálculo)
3. **Experiencia** – Incorporar errores frecuentes y soluciones de obra

Regla clave:

> Si un concepto puede demostrarse mejor con una herramienta que con texto, **la herramienta tiene prioridad**.

---

## 4. Relación Contenido ↔ Herramientas

El contenido escrito cumple un rol específico:

* Explicar criterios
* Justificar decisiones
* Advertir límites

Las herramientas (API):

* Ejecutan cálculos reales
* Simulan escenarios
* Muestran consecuencias técnicas y económicas

El manual **no compite** con la API: la **acompaña y la explica**.

---

## 4.1 El Manual como Base Técnica Viva

El Manual Técnico **NO es un contenido educativo cerrado**. Es una **base técnica viva**, orientada a criterio profesional y monetización.

**Características clave:**

* **Índice v1.0 estable** – Estructura inicial definida que sirve como esqueleto permanente
* **Enriquecimiento continuo** – Se actualiza con experiencia real de obra y aportes validados
* **Aportes de usuarios validados** – Los profesionales pueden proponer mejoras, correcciones o casos de uso
* **Evolución monetizable** – El contenido avanzado justifica suscripciones Pro/Premium

El manual crece con la comunidad, pero mantiene rigor técnico y criterio profesional.

---

## 5. Experiencia Real de Obra (Diferencial)

Criterio Térmico incorpora una sección central de:

* Errores frecuentes
* Decisiones incorrectas comunes
* Situaciones reales de instalación
* Soluciones probadas en obra

Este contenido:

* No proviene de libros
* No es generado por IA
* Es conocimiento acumulado por experiencia directa

Es uno de los principales diferenciales del proyecto.

---

## 6. Formatos y Accesibilidad

El contenido debe estar disponible en múltiples formatos:

* HTML interactivo (plataforma)
* Herramientas de cálculo integradas
* PDF descargable para uso offline

El PDF:

* No reemplaza la plataforma
* Complementa la experiencia
* Es un servicio al usuario

---

## Principio Final

> Criterio Térmico existe para **enseñar a pensar instalaciones**,
> no para repetir fórmulas ni copiar catálogos.

Cualquier decisión futura del proyecto debe poder justificarse a la luz de este documento.

---
---

# PROMPT MAESTRO PARA ANTIGRAVITY

**Rol de Antigravity:** actuar como arquitecto y desarrollador full‑stack senior.

---

## Contexto General

Estás desarrollando una plataforma web llamada **CRITERIO TÉRMICO**. No es un curso, ni un blog, ni un catálogo comercial. Es una plataforma técnica independiente orientada a instaladores de calefacción por radiadores y profesionales de la construcción (Arquitectos / MMO).

El objetivo del proyecto es enseñar criterio técnico aplicado, combinando:

* Contenido claro y práctico
* Herramientas reales de cálculo (API existente)
* Experiencia real de obra (errores frecuentes)

**NO debes tomar decisiones conceptuales por tu cuenta.** Todo el desarrollo debe respetar estrictamente las reglas siguientes.

---

## Reglas No Negociables

1. La estructura manda sobre el contenido. No desarrollar textos finales.
2. Las herramientas tienen prioridad sobre el texto cuando explican mejor un concepto.
3. Independencia de marcas: no centrar el sistema en fabricantes.
4. Pensado para obra real, no para academia.
5. El PDF es complementario, nunca reemplaza la plataforma.
6. La experiencia del instalador es el eje del diseño UX.

---

## Arquitectura de la Plataforma (MVP)

### Secciones obligatorias:

#### Home – Criterio Térmico
* Presentación clara del concepto
* CTA principal: Ingresar a la Escuela del Instalador

#### Escuela del Instalador (núcleo)
* Manual Técnico (HTML)
* Herramientas del Instalador (API)
* Errores Frecuentes
* Asistente Técnico (fase posterior)
* Certificación (NO en MVP)

#### Manual Técnico
* Estructura preparada para HTML y PDF
* Capítulos como contenedores (sin texto final)
* Enlaces previstos a herramientas y errores frecuentes

#### Herramientas del Instalador
* Integración de la API existente
* Flujo simple: ingresar datos → ver resultados → exportar

#### Errores Frecuentes
* Estructura de casos reales (problema / causa / solución)
* Sin contenido definitivo aún

#### Cuenta del Usuario
* Autenticación
* Proyectos guardados
* Descargas PDF

---

## Alcance del MVP

### Desarrollar únicamente:
* Estructura completa del sitio
* Navegación
* Autenticación básica
* Integración inicial de la API (1 herramienta visible)
* Soporte para PDF descargable (estructura)

### NO desarrollar:
* Asistente IA
* Certificación
* Simuladores avanzados
* Contenido extenso

---

## Objetivo del Desarrollo

Entregar una plataforma funcional, clara y escalable, que sirva como base sólida para cargar contenido y ampliar herramientas posteriormente.

Todas las decisiones técnicas deben priorizar:

1. **Claridad**
2. **Simplicidad**
3. **Escalabilidad**

---

## Confirmación Requerida

> Antes de avanzar, validar que esta arquitectura y alcance sean respetados sin desviaciones.
