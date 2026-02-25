---
name: responsive-design
description: Build mobile-first, responsive web interfaces. Use when creating layouts, components, or pages that need to work across mobile, tablet, and desktop. Also use when asked to "make responsive", "fix mobile layout", "mobile-first design", or "adapt for different screens".
metadata:
  version: 1.0.0
---

# Responsive Design

Expert guidance for building mobile-first, responsive web interfaces that work flawlessly across all devices and screen sizes.

## Core Philosophy

**Mobile-first always.** Start with the smallest screen and progressively enhance for larger viewports. This ensures:
- Core content is always accessible
- Performance is optimized for constrained devices
- Progressive enhancement over graceful degradation

## Breakpoint System

Use consistent, content-driven breakpoints:

```css
/* Mobile first — no media query needed for base styles */

/* Tablet */
@media (min-width: 768px) { }

/* Desktop */
@media (min-width: 1024px) { }

/* Wide desktop */
@media (min-width: 1440px) { }
```

**CRITICAL**: Never use `max-width` media queries as primary breakpoints. Always build up from mobile.

## Layout Strategies

### CSS Grid for Page Layout
```css
.layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

@media (min-width: 768px) {
  .layout {
    grid-template-columns: 1fr 1fr;
  }
}

@media (min-width: 1024px) {
  .layout {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

### Flexbox for Component Layout
```css
.card-container {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.card {
  flex: 1 1 100%;
}

@media (min-width: 768px) {
  .card {
    flex: 1 1 calc(50% - 0.5rem);
  }
}
```

### Container Queries (Modern)
```css
.component {
  container-type: inline-size;
}

@container (min-width: 400px) {
  .component-child {
    flex-direction: row;
  }
}
```

## Typography

Use fluid typography with `clamp()`:

```css
:root {
  --font-size-base: clamp(1rem, 0.9rem + 0.5vw, 1.125rem);
  --font-size-h1: clamp(1.75rem, 1.5rem + 1.5vw, 3rem);
  --font-size-h2: clamp(1.5rem, 1.25rem + 1vw, 2.25rem);
  --font-size-h3: clamp(1.25rem, 1.1rem + 0.75vw, 1.75rem);
}
```

## Spacing

Use fluid spacing:

```css
:root {
  --space-xs: clamp(0.25rem, 0.2rem + 0.25vw, 0.5rem);
  --space-sm: clamp(0.5rem, 0.4rem + 0.5vw, 0.75rem);
  --space-md: clamp(1rem, 0.8rem + 1vw, 1.5rem);
  --space-lg: clamp(1.5rem, 1.2rem + 1.5vw, 2.5rem);
  --space-xl: clamp(2rem, 1.5rem + 2.5vw, 4rem);
}
```

## Touch-Friendly Interactions

- **Minimum tap target**: 44x44px (WCAG) or 48x48px (Material)
- **Spacing between targets**: minimum 8px
- **Hover states**: always provide non-hover alternatives
- **No hover-only interactions**: everything must be tap-accessible

```css
.button {
  min-height: 44px;
  min-width: 44px;
  padding: 0.75rem 1.5rem;
}

/* Hover only on devices that support it */
@media (hover: hover) {
  .button:hover {
    transform: translateY(-2px);
  }
}
```

## Images & Media

```css
img {
  max-width: 100%;
  height: auto;
  display: block;
}
```

Use `<picture>` for art direction:
```html
<picture>
  <source media="(min-width: 1024px)" srcset="hero-desktop.webp">
  <source media="(min-width: 768px)" srcset="hero-tablet.webp">
  <img src="hero-mobile.webp" alt="Description" loading="lazy">
</picture>
```

## Navigation Patterns

### Mobile: Hamburger or Bottom Nav
- Hamburger menu for complex nav
- Bottom navigation for primary actions (max 5 items)
- Full-screen overlay for mobile menus

### Tablet: Collapsible Sidebar
- Collapsed sidebar with icons
- Expand on hover/tap

### Desktop: Full Navigation
- Horizontal top nav
- Mega menus for complex sites
- Sticky header with scroll behavior

## Testing Checklist

- [ ] Works on 320px width (smallest common phone)
- [ ] Works on 375px (iPhone SE)
- [ ] Works on 768px (tablet portrait)
- [ ] Works on 1024px (tablet landscape / small laptop)
- [ ] Works on 1440px (desktop)
- [ ] Works on 1920px+ (wide desktop)
- [ ] No horizontal scrolling at any size
- [ ] Text is readable without zooming
- [ ] All interactive elements are tappable on touch
- [ ] Images scale properly
- [ ] Forms are usable on mobile
- [ ] Tables have a mobile strategy (scroll, stack, or hide columns)

## Common Mistakes to Avoid

1. **Fixed widths** — Use percentages, fr units, or clamp()
2. **Hiding content on mobile** — Restructure instead of `display: none`
3. **Tiny tap targets** — Always 44px minimum
4. **Text too small on mobile** — Minimum 16px for body text
5. **Hover-only interactions** — Always provide tap alternatives
6. **Not testing real devices** — Emulators miss touch, performance, and rendering differences
