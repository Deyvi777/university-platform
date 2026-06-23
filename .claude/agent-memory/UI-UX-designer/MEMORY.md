# UI/UX Designer — Memory Index

## Project

- [Dashboard visual system](project_dashboard-visual-system.md) — "Certificate dashboard" language: LIGHT=education blue palette, DARK=navy (unchanged), sidebar navy both modes, rounded-2xl+soft shadows; tokens in globals.css.
- [Dashboard role-aware](project_dashboard-role-aware.md) — /dashboard home + nav branch by role; requireUser() vs requireAdmin(); ComingSoonHome placeholder for PROFESSOR/STUDENT.
- [Login auth-action pattern](project_login-auth-action-pattern.md) — useActionState + server action calling signIn; rethrow NEXT_REDIRECT via unstable_rethrow; remember-me is UI-only.
- [base-ui Select label](project_base-ui-select-label.md) — base-ui (not Radix); `<SelectValue/>` shows raw value; fix by passing `items` to Select.Root.
