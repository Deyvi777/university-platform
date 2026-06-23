---
name: dashboard-layout-structure
description: How the dashboard shell is structured — full-height left sidebar + content-confined topbar; which file owns what.
metadata:
  type: project
---

Dashboard layout (`src/app/dashboard/`) uses a **two-column flex root**, not a topbar-over-everything layout.

**Hierarchy** (`layout.tsx`):

```
SidebarProvider
  div.flex.min-h-screen
    <DashboardSidebar>          ← full-height left column (aside h-screen sticky top-0)
    <DashboardShell topbar=… >  ← content column (flex-1 flex-col)
       header (sticky top-0)    ← topbar, CONFINED to content width, NOT over sidebar
       grid (main | profile)    ← scrollable area below topbar
```

**Why:** matches the reference mockup ("EDUCATION2025") — navy sidebar fills the entire left edge top-to-bottom with logo at top + "Salir" at bottom; the topbar only spans the content column to the right of the sidebar.

**How to apply / key facts:**

- `DashboardShell` is the **content column only** — it takes `topbar` + `children` + `profilePanel` as props (no longer the `sidebar`). Its internal grid is 2-col (`main | profile 20rem`) reacting to `profileOpen`. The sidebar width is NOT managed here anymore.
- `DashboardSidebar` `<aside>` = `sticky top-0 h-screen w-60` (expanded) / `w-18` (collapsed). The navy panel is `h-full rounded-r-3xl` (flush-left, rounded only on the inner/right side — full-height panels can't be floating cards on all sides). Collapsed flyout panel is `absolute inset-y-0 left-0` and expands on hover over content (`sticky` aside is the positioning context — no extra `relative` needed).
- Sidebar has a `logout?: () => Promise<void>` prop → "Salir" pinned at the bottom (`SidebarLogout`), with rail/flyout reveal matching nav items. Mobile drawer also got nav-scrollable + bottom "Salir".
- Sidebar nav lives in a `flex-1 overflow-y-auto` middle so "Salir" stays anchored at the foot.
- Collapse/flyout/localStorage persistence/mobile-drawer behavior all preserved. See [[admin-section-pattern]] for the broader dashboard conventions.
