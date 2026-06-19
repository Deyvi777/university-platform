---
name: dashboard-nav-sections
description: Dashboard left sidebar nav is grouped into NavSection[] with headers (like the home cards); how sections render across expanded/rail/flyout/mobile and the Usuarios sub-items with ?rol= active detection
metadata:
  type: project
---

The dashboard left sidebar was restructured from a flat `NavItem[]` into **grouped sections** mirroring the home page's card grouping ("Usuarios", "Gestión del sitio").

**Why:** user wanted the sidebar divided into labeled sections like the home (`page.tsx` HomeSection uses `text-xs font-semibold uppercase tracking-wide text-muted-foreground` headers).

**How to apply / key files:**

- `nav-items.ts`: source of truth. `NavSection = { title?: string; icon?: NavIcon; items: NavItem[] }`. A section with no `title` renders its items loose without a header ("Inicio" is its own headerless group, placed first). Everything stays serializable (Server→Client): `icon` is a STRING key resolved via `NAV_ICONS`, never a React component. Functions: `navSectionsForRole(role)` returns `NavSection[]` (ADMIN gets Inicio + Usuarios + Gestión del sitio; others get just Inicio); `quickLinksFromSections(sections)` flattens to `NavItem[]` minus `/dashboard` for the profile panel quick-links. **If you change section shape, update `layout.tsx` (passes `sections` to DashboardSidebar) and `profile-panel.tsx` (consumes flattened quickLinks).**
- `dashboard-sidebar.tsx`: `DashboardSidebar({ sections })`. Section rendering across the 4 states:
  - **Expanded (15rem):** header `<p>` visible (`px-4 pb-1.5 text-xs uppercase`), sub-items pills with `pl-7` indent (only when section has a title).
  - **Rail (4.5rem collapsed, no hover):** headers `hidden`; items become `size-11` icon-only pills; a subtle `border-t` separator (`w-8 self-center`) replaces the text header between groups.
  - **Flyout (collapsed + hover/focus → 15rem):** headers AND labels mounted always but collapsed (header `h-0 opacity-0`, label `w-0 opacity-0`); revealed via `group-hover/flyout:`/`group-focus-within/flyout:` classes, gated by `suppressHover` (the existing flyout-suppress-on-collapse flag).
  - **Mobile overlay:** full sections with headers + labels (no rail); added `overflow-y-auto` since sections make it taller.
- **Usuarios sub-items active detection by `?rol=`:** the 3 sub-items (Administrativos/Docentes/Estudiantes) share pathname `/dashboard/usuarios` and differ only by query (`?rol=administrativos|docentes|estudiantes`). `NavSections` reads `useSearchParams()` to mark the active sub-item (pathname match AND `rol` query match). Because `useSearchParams()` needs a Suspense boundary in Next 16 prod builds, `NavSections` is wrapped by `SidebarNav` in `<Suspense>` with `NavSectionsFallback` (same markup, active-by-pathname only, no query). `splitHref()` helper parses an item href into `{ path, rol }`.

**Usuarios page `administrativos` filter (`usuarios/page.tsx`):** added a 4th URL filter `?rol=administrativos` → `listAdminUsers("ADMIN")`. `listAdminUsers` signature widened to accept full `AdminUserRole` (backend `findAllAdmin` already lists ADMIN; only CREATE rejects ADMIN). **Business rule:** in `administrativos` the "Crear usuario" CTA is HIDDEN (`canCreate = filter !== "administrativos"`) — creating an ADMIN would 400 — plus an amber read-only notice and the empty state drops its "create" affordance. `FILTER_TO_ROLE` maps UI filter → backend role; `nounFor`/`EMPTY_TITLE` give per-filter Spanish copy.

Related: [[dashboard-shell-layout]], [[dashboard-sidebar-flyout-suppress]].
