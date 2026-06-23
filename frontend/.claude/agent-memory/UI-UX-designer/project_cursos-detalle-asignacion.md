---
name: cursos-detalle-asignacion
description: Course detail page (/dashboard/cursos/[id]) UI conventions — initials avatars, teacher/student chips, amber primary action buttons, expandable checkbox panels
metadata:
  type: project
---

The course detail page (`/dashboard/cursos/[id]`) is where ADMIN assigns docentes to módulos (co-docencia) and enrolls estudiantes. Redesigned 2026-06-20 for a more modern/attractive look while keeping all server-action logic intact.

**Why:** user wanted the "Módulos y docentes" section to look modern (better hierarchy, avatars instead of plain badges, polished empty state + checkbox panel) and the two main action buttons ("Asignar docentes", "Inscribir estudiantes") to be more visually prominent (amber accent instead of grey `outline`).

**How to apply / key patterns established:**

- **Initials avatars (no Avatar component exists):** a local `Avatar` helper in each client file = `<span>` `rounded-full font-heading font-semibold` with initials. Tint is assigned **deterministically by id** via `tintFor(id)` (sum of charCodes % AVATAR_TINTS) so a person keeps the same color. Palette: `bg-{sky,violet,emerald,rose,amber,cyan}-100 text-{...}-700`. Reuse this exact approach for any internal person-list (kardex, plantel, etc.).
- **Assigned-docente chips** (`module-teachers-control.tsx`): `rounded-full border bg-card` pill = avatar + name. Empty state = `Users` icon + "Sin docentes asignados." inline (muted).
- **Primary action buttons are SOLID `primary` (sober navy/slate), NOT amber, NOT outline (updated 2026-06-20):** the three action buttons — "Asignar/Editar docentes" (per módulo), "Inscribir estudiantes", and "Editar datos" (page header) — use the default `Button` variant (`variant="default"` = `bg-primary text-primary-foreground`, dark slate token) + `className="shadow-xs"`, NO custom color classes. **Why:** user found the prior amber (`bg-amber-500 text-slate-950`) too loud — amber is already the brand accent everywhere (avatars, badges, selected rows), so amber action buttons killed hierarchy. Solid primary reads as "action" without shouting and frees amber to be a pure accent. Hierarchy among the trio is by SIZE not color: block-dominant ("Inscribir estudiantes") is `size="default"`; secondary/per-row ("Editar docentes", "Editar datos") are `size="sm"`. In-panel "Guardar"/"Inscribir(n)" also default solid; "Cancelar" stays `variant="ghost"`. "Asignar docentes" label still flips to "Editar docentes" when ≥1 assigned; `aria-expanded={open}` on the toggles. This is now the convention for primary actions in the internal area — prefer the `primary` token over amber-tinted buttons.
- **Expandable checkbox panel:** `rounded-xl border bg-muted/30 p-3 shadow-xs`; each row is a `<label>` with `accent-amber-500` checkbox + avatar; selected rows get `border-amber-300 bg-amber-50` + trailing amber `Check`. Footer has amber "Guardar"/"Inscribir" + ghost "Cancelar" + live selection count (`tabular-nums`). Dirty-check / pending logic unchanged (`sameSet`, `setModuleTeachersAction`, `addEnrollmentsAction`).
- **Module cards** (`[id]/page.tsx`): `rounded-2xl border bg-card shadow-xs hover:border-amber-200`, numbered amber square badge (`size-9 rounded-xl bg-amber-100 text-amber-700`) + "MÓDULO n" eyebrow + name, control area below a `border-t pt-4` divider.
- **Section headers** get a `size-9 rounded-xl bg-amber-100` icon (`BookOpen` for módulos, `GraduationCap` for estudiantes) next to title+subtitle.
- **Empty states added:** course with 0 módulos (dashed card → "Edita el programa"); 0 estudiantes inscritos (dashed card). Enrolled list itself is `rounded-xl border bg-card divide-y` with avatar + name/email + ghost destructive remove (still `window.confirm`).
- Headings use `font-heading` (Merriweather, see [[dashboard-shell-layout]]); avatar initials also use `font-heading`.

Verified: eslint clean + `pnpm build` pass. `size-4.5` is a valid Tailwind v4 class.
