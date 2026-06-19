---
name: dashboard-role-aware
description: How the /dashboard home + nav branch by role (ADMIN/PROFESSOR/STUDENT) and the guards/components involved.
metadata:
  type: project
---

The internal `/dashboard` is role-aware. Roles come from `session.user.role` (`ADMIN | PROFESSOR | STUDENT`); `session.user.name` is populated as "firstName lastName" (mapped in `src/auth.ts`).

**Guards** (`src/lib/auth-guard.ts`): `requireAdmin()` (login→/login, non-admin→/) for admin-only sections; `requireUser()` (login-only, no role gate) for shared screens like the dashboard home. The proxy (`src/proxy.ts` / `authorized` in `src/auth.config.ts`) only gates `/dashboard` by _login_, not role — role gating is per-page.

**Nav** is a single source of truth: `src/app/dashboard/nav-items.ts` → `navItemsForRole(role)`. ADMIN sees Inicio + Programas/Categorías/Instituciones/Redes sociales; PROFESSOR/STUDENT see only Inicio (no actions they can't run). `layout.tsx` consumes it.

**Home** (`src/app/dashboard/page.tsx`): `requireUser()` then branches. ADMIN → `AdminHome()` (link-cards under a "Gestión del sitio · Landing" section header, icon-in-rounded-amber-tint-square, tabular-nums counts, hover arrow). PROFESSOR/STUDENT → shared `ComingSoonHome` component (`coming-soon-home.tsx`) with role-tailored copy: welcome with first name, "Próximamente" badge, Sparkles icon, 3 feature-hint chips. **Why:** user explicitly wanted a polished, intentional empty state (no fake CTA) — PROFESSOR/STUDENT features (cursos/módulos/kardex) are placeholders only; do NOT build real endpoints/screens for them yet.

**How to apply:** when adding real PROFESSOR/STUDENT screens later, add their nav items to `navItemsForRole` and replace the `ComingSoonHome` branch. Amber accent stays moderate (icon tints, badge), light shadcn theme throughout — see [[dashboard-visual-system]].
