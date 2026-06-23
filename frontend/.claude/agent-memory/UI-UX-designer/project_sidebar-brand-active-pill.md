---
name: sidebar-brand-active-pill
description: Sidebar visual language (current) — white Certificate logo.webp directly on flat navy, active nav = translucent pill + white circular icon badge, flat color (no gradient), fixed rail with tooltips (no flyout widening).
metadata:
  type: project
---

`dashboard-sidebar.tsx` visual language as of the dark-mode/login redesign pass (2026-06-21). Verified against code, not the older mockup-restyle notes.

**Brand block (`SidebarLogo`, desktop):** the **white `logo.webp`** (`/landing/logo.webp`) rendered **directly on the navy** via `next/image` — NOT a wordmark pill. (The earlier "white blob with Certificate wordmark in blue" survives ONLY in the **mobile drawer** brand block, with `v 1.0.0 / 2025` version text.) In the rail the logo shrinks (`max-h-9 max-w-[2.75rem]`).

**Active nav item (`NavLink` active):** translucent light pill `bg-white/15 ring-1 ring-white/15 text-white` (both themes, no `dark:`) with a **white circular icon BADGE** (`size-9 rounded-full bg-white`) holding the icon in `text-primary` (brand blue). Inactive: `text-sidebar-foreground/90`, same-size `size-9` no-bg icon wrapper for column alignment, hover `bg-white/[0.07]`.

**Panel color = FLAT (no perceptible gradient):** light `blue-900`, dark `slate-950`. Written as a gradient utility but all stops are the same color: `bg-gradient-to-b from-blue-900 from-0% via-blue-900 via-45% to-blue-900 to-100% dark:from-slate-950 dark:via-slate-950 dark:to-slate-950`. (Supersedes the old `from-blue-600 via-blue-800 to-blue-950` vivid gradient.) Panel is `rounded-r-3xl` in both expanded and rail.

**Rail behavior:** minimized rail is **fixed width `w-18`** and **does NOT widen on hover** — the old flyout-on-hover machinery (`expandOnHover`, `group-hover/flyout:` classes) still threads through the props but is inert because the panel width is locked to `w-18`. Instead, **hovering a rail icon shows a Base UI `Tooltip`** (`side="right"`) with the option name; Base UI portals to `body` so the rail's `overflow-y-auto` doesn't clip it. `TooltipProvider delay={150}` wraps the sidebar.

**Topbar brand:** "Plataforma · Virtual" (`· Virtual` in `text-amber-500`) — NOT "Certificate · Plataforma".

**Layout:** two-column flex root; sidebar is `sticky top-0 h-screen` full-height, **sibling** of the content column (`DashboardShell`), so the sticky topbar is confined to the content column.

See [[dashboard-dark-mode]], [[dashboard-sidebar-accordion]], [[dashboard-shell-layout]]. NOTE: the concave-join feature was REMOVED — see that memory's note.
