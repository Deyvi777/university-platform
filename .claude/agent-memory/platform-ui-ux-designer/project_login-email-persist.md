---
name: login-email-persist
description: Login form keeps the typed email after a failed submit by echoing it in LoginState.values and using a controlled input
metadata:
  type: project
---

React 19 resets `<form action={fn}>` on every submit, blanking uncontrolled inputs read via FormData. The login email field was lost on each failed attempt.

**Fix (applied):**

- `frontend/src/app/login/actions.ts`: `LoginState` gained `values?: { email?: string }`. The action captures the raw submitted email (before Zod validation, so even an invalid email is echoed back) and returns it in `values` on EVERY failure branch (validation error, AuthError, generic error). Password is intentionally not preserved (security norm).
- `frontend/src/app/login/login-form.tsx`: email is now a CONTROLLED input (`useState`), seeded from `state.values?.email`. Re-sync after a new server response is done DURING render comparing the previous returned value (`prevReturnedEmail` state), NOT in useEffect — respects `react-hooks/set-state-in-effect`. Password stays uncontrolled.

This is the project's canonical "preserve form values across a failed server-action submit" pattern; reuse for other admin forms if they hit the same React 19 reset issue.
