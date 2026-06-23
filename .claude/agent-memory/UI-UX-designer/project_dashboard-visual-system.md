---
name: dashboard-visual-system
description: Authenticated dashboard design language — LIGHT mode = "Certificate dashboard" education blue palette; DARK mode = navy (unchanged); amber accent; sidebar navy in both modes
metadata:
  type: project
---

The authenticated/internal area (`src/app/dashboard/**` + `/login`) follows the **"Certificate dashboard" design language** (synthesized from the "EDUCATION2025" education mockup): brand blue + navy gradient sidebar + white very-rounded cards with soft shadows on a cool-gray canvas. It is theme-aware:

- **LIGHT mode** = the education blue palette (this note + `DESIGN.md` Part 2 table + skill `ui-educativa`).
- **DARK mode** = the institutional **navy** palette already in the `.dark` block of `globals.css` — left **unchanged**.
- The **sidebar is navy in BOTH modes** (it is dark always, like the mockup).

**Why:** the user asked to make light mode match the mockup while preserving the existing navy dark mode. The old grayscale `neutral` light `:root` was replaced with oklch tokens at blue hue ~258–262 (twin of the dark hue ~265). **Do NOT reintroduce grayscale `neutral`.** Prefer semantic tokens so styling applies to both modes automatically; use `dark:` only where a light color must not flip.

**Light-mode tokens (`:root` in `globals.css`):** `--background` cool gray `#EEF1F5`; `--card` white; `--foreground` navy `#102A4C`; `--primary` brand blue `#2563EB` (primary-fg white); `--muted`/`--secondary`/`--accent` light blue-gray; `--border`/`--input` `#DDE3EC`; `--radius: 0.75rem`. Sidebar tokens (`--sidebar*`) are navy in **both** `:root` and `.dark` (active pill = white via `--sidebar-primary`). amber accent stays via direct `amber-*` classes.

**How to apply (internal screens):**

- Surfaces: `bg-background` page canvas (cool gray); cards `rounded-2xl border bg-card p-6 shadow-sm shadow-blue-950/[0.04] dark:shadow-none`; list/table wrappers `overflow-hidden rounded-2xl border bg-card shadow-sm ...`. Header `bg-card/85 backdrop-blur-md`. The shadcn `Card` primitive already carries `rounded-2xl` + the soft navy shadow.
- **Sidebar** (`dashboard-sidebar.tsx`): navy panel `rounded-3xl bg-gradient-to-b from-blue-700 via-blue-900 to-blue-950 shadow-lg shadow-blue-950/10 ring-1 ring-white/5`, brand block top (`SidebarLogo`: white `size-9 rounded-xl bg-white text-primary` mark + "Certificate / Plataforma · v1.0"). Nav items: inactive `text-sidebar-foreground/75 hover:bg-white/10`; **active = white pill** `bg-sidebar-primary text-sidebar-primary-foreground` with icon in `text-primary`. Mobile overlay panel also navy.
- **Topbar** (`layout.tsx`): user pill `rounded-full border bg-background` (avatar `bg-blue-950 text-amber-300` initials + email) + `ThemeToggle`.
- Container width: `mx-auto max-w-6xl px-6` (see `dashboard/layout.tsx`).
- Institutional accent: `amber-500` (e.g. logo dot `text-amber-500`, primary CTA `bg-amber-500 text-slate-950 hover:bg-amber-400`). Use sparingly.
- The white logo (`/landing/logo.webp`) only works on dark backgrounds — wrap it in a dark container when used on a light internal screen. The login brand panel + its mobile logo pill use `bg-blue-950` (deep navy, ~19:1 vs white, amber accents pop as the complementary contrast) — chosen over `slate-950` so the panel reads as elegant dark blue, not near-black.
- Forms: `react-hook-form` + `zodResolver` + `sonner` toasts + `Loader2` spinner; inline errors as `text-xs text-destructive`. Canonical example: `src/app/dashboard/configuracion/settings-form.tsx`.
- Section folder shape: `page.tsx` (server) + `actions.ts` (server actions) + `*-schema.ts` (Zod) + `*-form.tsx` (client). Nav item added in `dashboard/layout.tsx`.
- `Toaster` (sonner, richColors, top-right) is already mounted in root `layout.tsx` — don't re-add.

See [[login-auth-action-pattern]].
