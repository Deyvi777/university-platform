---
name: dashboard-dark-mode
description: Dark mode (navy default) infra for the dashboard — ThemeProvider, navy .dark palette, sliding pill toggle, and how tinted (non-token) surfaces get dark: variants.
metadata:
  type: project
---

Dashboard has a light/dark theme toggle; **dark (navy) is the default** (user requested it, overriding DESIGN.md which said dashboard is light-by-default).

**Why:** user explicitly asked for dark-as-default with institutional dark-blue tones.

**How to apply / where things live:**

- Infra: `src/components/providers/theme-provider.tsx` wraps `next-themes` (`attribute="class"`, `defaultTheme="dark"`, `enableSystem={false}`, `disableTransitionOnChange`). Wired in root `src/app/layout.tsx` (which also got `suppressHydrationWarning` on `<html>`). `next-themes` already in package.json.
- Palette: the `.dark { ... }` block in `src/app/globals.css` is **navy oklch** (hue ~265 across all surfaces): background ~oklch(0.19 0.03 265), card a step lighter, border/input are blue-tinted white alphas. `@custom-variant dark (&:is(.dark *))` was already declared. Landing (`/`) and `/login` use hardcoded slate/navy colors (not shadcn tokens), so the global `.dark` class doesn't affect them.
- Toggle: `src/components/dashboard/theme-toggle.tsx` — sliding pill (`role="switch"`, `aria-checked`), Sun(left)/Moon(right), thumb = amber+sun (light) / blue+moon (dark) via `translate-x`. Mounted-guard via `useSyncExternalStore` (no useEffect) to avoid hydration mismatch. Placed in `dashboard/layout.tsx` header, right side next to email/ProfileToggle.
- **Tinted (non-token) surfaces need explicit `dark:` variants.** Pattern used: light `bg-X-100 text-X-700` → add `dark:bg-X-500/15 dark:text-X-300`; selected `bg-amber-50 border-amber-300` → `dark:bg-amber-500/10 dark:border-amber-500/40`; `text-amber-600` icon tiles → `dark:text-amber-300`. Files touched: `dashboard/page.tsx` (home card TINTS + count/arrow chips), `cursos/course-badges.tsx`, `cursos/enrollment-control.tsx` + `module-teachers-control.tsx` (shared AVATAR_TINTS array + selected rows + checkmarks + empty-icons), `cursos/[id]/page.tsx`, `cursos/course-form.tsx`, `coming-soon-home.tsx`, `profile-panel.tsx` (role pill), `usuarios/page.tsx` (readonly banner), `dashboard-sidebar.tsx` (active nav pill → `dark:bg-blue-600/25 ring-blue-400/20`). `user-badges.tsx` already had dark variants.
- Sections `programas/categorias/partners/configuracion` use pure shadcn tokens → covered automatically by the palette, no edits needed. Same for `image-upload-field.tsx`/`delete-button.tsx`.
- New internal screens: prefer semantic tokens (`bg-card`, `bg-muted`, `text-muted-foreground`, `border`); if you use a raw Tailwind color tint, ALWAYS pair it with a `dark:` variant.
