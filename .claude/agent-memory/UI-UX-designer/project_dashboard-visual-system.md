---
name: dashboard-visual-system
description: The authenticated dashboard uses the LIGHT shadcn theme (not the dark landing); amber-500 is the internal accent
metadata:
  type: project
---

The authenticated/internal area (`src/app/dashboard/**` + `/login`) uses the **light shadcn theme**, NOT the dark slate landing palette from `frontend/DESIGN.md`.

**Why:** `frontend/DESIGN.md` governs the public landing (dark `slate-950`, amber-400). The dashboard was built separately on shadcn's neutral/`base-nova` light theme (`components.json` style `base-nova`, baseColor `neutral`; `globals.css` `:root` is near-white). DESIGN.md's amber-400 carries over but as **amber-500** in the light context.

**How to apply (internal screens):**

- Surfaces: `bg-muted/30` page background, cards `rounded-xl border bg-card p-6`. Header `border-b bg-background`.
- Container width: `mx-auto max-w-6xl px-6` (see `dashboard/layout.tsx`).
- Institutional accent: `amber-500` (e.g. logo dot `text-amber-500`, primary CTA `bg-amber-500 text-slate-950 hover:bg-amber-400`). Use sparingly.
- The white logo (`/landing/logo.webp`) only works on dark backgrounds — wrap it in a dark container when used on a light internal screen. The login brand panel + its mobile logo pill use `bg-blue-950` (deep navy, ~19:1 vs white, amber accents pop as the complementary contrast) — chosen over `slate-950` so the panel reads as elegant dark blue, not near-black.
- Forms: `react-hook-form` + `zodResolver` + `sonner` toasts + `Loader2` spinner; inline errors as `text-xs text-destructive`. Canonical example: `src/app/dashboard/configuracion/settings-form.tsx`.
- Section folder shape: `page.tsx` (server) + `actions.ts` (server actions) + `*-schema.ts` (Zod) + `*-form.tsx` (client). Nav item added in `dashboard/layout.tsx`.
- `Toaster` (sonner, richColors, top-right) is already mounted in root `layout.tsx` — don't re-add.

See [[login-auth-action-pattern]].
