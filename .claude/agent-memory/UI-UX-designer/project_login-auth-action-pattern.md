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

- Split-panel: dark `slate-950` brand aside (`hidden lg:flex`, white logo + amber highlights) + light form panel. Mobile shows a compact logo-in-dark-pill instead.
- Password visibility toggle is a native `<button>` with `aria-label` + `aria-pressed`, positioned `absolute inset-y-0 right-0` over an `Input` with `pr-10`.
- "Recordarme" checkbox is **UI-only / decorative** — NextAuth session lifetime is JWT-strategy default; there is no backend "remember me" contract. If real persistence is wanted later, it needs `maxAge` handling in `auth.config.ts` session. No password-recovery link was added (no backend endpoint exists); instead a "contacta a la administración" hint.

See [[dashboard-visual-system]].
