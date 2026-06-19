---
name: dashboard-sidebar-accordion
description: Sidebar sections are collapsible accordions (per-section localStorage open state, active section forced open) in dashboard-sidebar.tsx
metadata:
  type: project
---

Las secciones tituladas del sidebar interno (`src/app/dashboard/dashboard-sidebar.tsx`) son **acordeones desplegables**: el encabezado es un `<button>` con chevron (`ChevronDown` rotando `-rotate-90` cuando cerrado) que pliega/despliega sus items. "Inicio" (sección sin `title`) no es desplegable.

**Modelo de estado abierto/cerrado:**

- Un store por sección vía `getSectionStore(slug)` (cache `Map`), clave `dashboard:nav-section:<slug>`, **default `true` (abierto)**. Mismo patrón `createBooleanStore` + `useSyncExternalStore` que `collapsed`/`profileOpen` (ver [[dashboard-persisted-ui-state]]). Hook `useSectionOpen(slug)`.
- `slug` se deriva del título con `sectionSlug(title)` en `nav-items.ts` (NFD + strip diacríticos + kebab) — NO se guarda en los datos, así `NavSection` sigue serializable Server→Client. El slug alimenta store key + `id`/`aria-controls`/`aria-labelledby`.
- **Sección activa forzada abierta:** `open = storedOpen || containsActive`, derivado en render (sin `useEffect`, regla `react-hooks/set-state-in-effect`). `containsActive` = algún item de la sección pasa `isActive`. Nunca esconde el item activo aunque el usuario cerró la sección.

**Comportamiento por estado del sidebar** (componente compartido `SectionGroup`, usado por `NavSections` y su fallback de Suspense):

- `accordionApplies = hasHeader && !collapsed` → el plegado de items SOLO ocurre en **expandido** y **overlay móvil**.
- **Riel puro** (colapsado sin flyout): encabezado oculto (`hidden` + `tabIndex=-1`/`aria-hidden`), items siempre visibles como iconos. Sin cambios vs. antes.
- **Flyout** (colapsado + hover): el encabezado-botón se revela por hover/foco y togglea el estado, pero los items NO se pliegan (el riel debe mostrar todos los iconos) — evita choque con la animación de ancho del flyout. El plegado se ve al expandir.

**Animación:** técnica `grid grid-rows-[1fr]/[0fr]` + `overflow-hidden` en wrapper interno (anima altura sin conocerla) + `opacity`, `transition-[grid-template-rows,opacity] duration-200`.

**A11y:** botón con `aria-expanded`, `aria-controls` → región `role="region"` `aria-labelledby`. Items cerrados usan **`inert`** (NO `hidden`: `display:none` mataría la transición) para sacarlos del orden de tabulación. Chevron `aria-hidden`. Focus ring ámbar.
