---
name: admin-401-handling
description: How a backend 401 (dead NextAuth token) is funneled to a logout Route Handler → /login?expired=1 without the redirect loop, plus time-based token-exp gating
metadata:
  type: project
---

Backend JWT TTL is `1d` (`JWT_EXPIRES_IN`). The NextAuth session cookie can outlive the backend token (rolling JWT sessions vs fixed-TTL accessToken; also: user set `isActive=false`, DB reseeded, token expired). Then `GET /admin/*` returns 401.

**The redirect loop (was a real bug, now fixed):** an earlier fix made the admin read/write path `redirect("/login")` on 401. That LOOPED: the NextAuth cookie was still intact (only the _backend token inside it_ was dead), so `login/page.tsx` saw `session?.user` and bounced back to `/dashboard` → 401 → /login → … `ERR_TOO_MANY_REDIRECTS`. Aligning `session.maxAge` to 1d did NOT close it (doesn't expire already-issued cookies; rolling sessions).

**Key constraint:** a Server Component CANNOT write/delete cookies in Next 16 — only Route Handlers and Server Actions can. So the read path (server components) cannot `signOut` directly; it can only `redirect`.

**Fix (applied), the loop-breaker:**

- `frontend/src/app/api/auth/session-expired/route.ts` — GET Route Handler: `await signOut({ redirect: false })` (clears the dead cookie) then `NextResponse.redirect` to `/login?expired=1`. Route Handlers CAN write cookies, so the cookie is gone before /login renders. `/api/*` is excluded by the `proxy.ts` matcher, so it's never gated. THIS is what breaks the loop.
- `frontend/src/lib/api/admin.ts` `parse()`: on 401 → `redirect("/api/auth/session-expired")` (was `/login`). `adminFetch()` no-token branch also redirects there.
- `frontend/src/lib/auth-guard.ts` `handleAdminActionError()`: still calls `unstable_rethrow(error)` first in every admin action catch so the NEXT_REDIRECT propagates instead of becoming a toast.
- `frontend/src/app/login/page.tsx`: reads `?expired=1`; when set, does NOT bounce to /dashboard even if a residual session exists (defense in depth against re-entering the loop), and passes `sessionExpired` to `<LoginForm>`.
- `frontend/src/app/login/login-form.tsx`: shows an informational (amber, `role="status"`) banner "Tu sesión expiró. Inicia sesión nuevamente para continuar." when `sessionExpired && !state.error`.

**Time-based expiry (defense in depth) in `frontend/src/auth.config.ts`:** helpers `getBackendTokenExp` / `isBackendTokenExpired` decode the backend accessToken `exp` edge-safely via `atob` (no Node Buffer). `authorized` returns false for `/dashboard` when the token is expired → middleware sends to /login naturally. `session` callback omits `accessToken` when expired → `adminFetch` sees "no token" → routes to /api/auth/session-expired. Covers the pure-expiry case before any admin call runs; the Route Handler covers the other 401s (inactive user, reseeded DB).

All four admin action files use `handleAdminActionError`: programas, categorias, partners, configuracion.
