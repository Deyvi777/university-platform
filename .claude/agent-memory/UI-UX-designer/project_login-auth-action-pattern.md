---
name: login-auth-action-pattern
description: Login uses useActionState + a server action that calls signIn; must rethrow the NEXT_REDIRECT via unstable_rethrow
metadata:
  type: project
---

The login screen (`src/app/login/`) drives NextAuth v5 Credentials sign-in through a server action consumed by `useActionState`, returning typed inline error state (no `?error=` query param). Files: `page.tsx` (server, split-panel), `actions.ts` (`authenticate(prevState, formData)`), `login-form.tsx` (client).

**Critical gotcha:** `signIn("credentials", { redirectTo })` throws a `NEXT_REDIRECT` internal error on SUCCESS — it must propagate, not be caught as a credentials error. Use the public Next 16 helper `unstable_rethrow(error)` from `next/navigation` at the top of the `catch` (it rethrows redirect/notFound internals, falls through otherwise). Then `if (error instanceof AuthError)` → return the Spanish "credenciales incorrectas" message; anything else → generic retry message.

**Why this shape (vs. the original `?error=credentials` redirect):** `useActionState` gives `pending` for the submit spinner and lets errors render inline without a full navigation/flash. The auth contract itself (NextAuth → backend `/auth/login`, `src/auth.ts` Zod schema `z.email()` + `password.min(8)`) is UNCHANGED — `actions.ts` mirrors that same schema for client-side field validation.

**How to apply:** reuse this pattern for any auth-style server action that ends in a redirect. Zod v4 is in use: validate with `safeParse`, flatten with `z.flattenError(parsed.error)` (NOT `.flatten()`), read `fieldErrors.<field>?.[0]`.

**UX decisions baked in:**

- Layout (redesigned 2026-06-21): **full-screen background image** (`/landing/image-login.webp`, `next/image fill object-cover priority`) + dark blue-950 gradient overlay, with a **centered glassmorphism card** holding the form. Card is **light translucent** (`bg-background/85 backdrop-blur-xl border-white/40 shadow-2xl`) — chosen over a dark card because `login-form.tsx` uses light shadcn semantic tokens (`Input`/`Label`/`text-muted-foreground`), so a light glass surface keeps the form legible WITHOUT touching the form's logic. White logo sits above the card (valid only over the dark image); copyright sits below it. The previous split-panel (blue-950 brand aside + light form panel) was REPLACED — DESIGN.md §"Login" still describes the old split-panel and is now stale on this point.
- Password visibility toggle is a native `<button>` with `aria-label` + `aria-pressed`, positioned `absolute inset-y-0 right-0` over an `Input` with `pr-10`.
- "Recordarme" now has a REAL backend contract (NOT UI-only anymore): it flows `login-form.tsx` → `auth.ts` → `POST /auth/login` (30d vs 1d token) and `actions.ts` downgrades the session cookie to session-only when unchecked. See CLAUDE.md + frontend/AGENTS.md. No password-recovery link (no backend endpoint); "contacta a la administración" hint instead.

See [[dashboard-visual-system]].
