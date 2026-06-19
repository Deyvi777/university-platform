---
name: dashboard-sidebar-flyout-suppress
description: How the collapsed desktop sidebar's CSS flyout-on-hover is suppressed right after clicking minimize so the rail collapses immediately
metadata:
  type: project
---

El sidebar de escritorio colapsado (`src/app/dashboard/dashboard-sidebar.tsx`) tiene un flyout-on-hover **puramente CSS** (`group/flyout` + `hover:w-60`/`focus-within:w-60` en el contenedor; `group-hover/flyout:`/`group-focus-within/flyout:` en los items de `NavList`). Al pulsar "minimizar" con el cursor encima, ese hover CSS re-expandía el riel al instante (no se veía minimizado hasta el `mouseleave`).

**Fix:** bandera de UI **transitoria** `suppressHover` (`useState(false)` local en `DashboardSidebar`, NO en el store persistido `useSyncExternalStore`, NO en localStorage). `CollapseToggle` recibe `onCollapse` y lo invoca solo cuando el clic colapsa (`if (!collapsed) onCollapse()`). Mientras `suppressHover` sea true se **omiten** las clases reactivas del flyout (gateadas con un flag `flyoutActive = expandOnHover && !suppressHover` en `NavList`, y `collapsed && !suppressHover` para `hover:w-60`/`focus-within:w-60` del contenedor).

**Reset (clave):** `onMouseLeave` del `<aside>` limpia la bandera (cursor sale → próximo hover real expande). Para teclado, `onBlur` del aside con guarda `!event.currentTarget.contains(event.relatedTarget)` (solo cuando el foco abandona el aside completo, no al moverse entre hijos) — así tras colapsar con el botón enfocado el riel no queda atrapado expandido por `focus-within`, pero un nuevo tab-in sí expande.

**Why:** estado transitorio de interacción, no preferencia → no debe persistirse ni reintroducir hydration mismatch (default `false` coincide SSR/cliente). Manejado por handlers de evento, NO `useEffect` (regla `react-hooks/set-state-in-effect`).

Relacionado: [[dashboard-persisted-ui-state]] (el `collapsed` sí persistido), [[dashboard-shell-layout]].
