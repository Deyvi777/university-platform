---
name: dashboard-persisted-ui-state
description: How the internal dashboard shell persists UI prefs (collapsed sidebar, profile panel) in localStorage without hydration mismatch
metadata:
  type: project
---

El shell del dashboard (`src/app/dashboard/dashboard-sidebar.tsx`) persiste preferencias de UI (`collapsed` del sidebar, `profileOpen` del panel derecho) en localStorage usando **`useSyncExternalStore`**, NO `useState(() => readStored(...))`.

**Why:** Leer localStorage en el inicializador de `useState` NO es SSR-safe — provoca hydration mismatch (el SSR usa defaults, el primer render cliente lee localStorage y puede diferir), rompiendo `aria-pressed`/`aria-label` de los toggles y las clases `grid-template-columns` del shell.

**How to apply:** Para cualquier estado de UI interno que viva en localStorage, usa el patrón `createBooleanStore(key, fallback)` ya presente en `dashboard-sidebar.tsx`: `getServerSnapshot` devuelve el fallback (= HTML del SSR), `getSnapshot` lee localStorage en cliente, `subscribe` escucha el evento `storage` (otras pestañas) + un `Set` de listeners propio (misma pestaña, porque `storage` no se dispara en quien escribe), y `set()` escribe + notifica. El salto post-hidratación se suaviza con `transition`. NO uses `useEffect`+setState (regla `react-hooks/set-state-in-effect`). La API del contexto `useSidebar` se mantiene estable para no tocar consumidores (`dashboard-shell.tsx`). Relacionado: [[dashboard-shell-layout]].
