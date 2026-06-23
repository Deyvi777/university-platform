---
name: admin-delete-button
description: Shared DeleteButton modal pattern for admin row deletion across the 5 admin entities
metadata:
  type: project
---

`src/components/admin/delete-button.tsx` is the shared destructive-delete confirmation used by ALL 5 admin sections (usuarios, categorias, programas, partners, cursos) — each `page.tsx` imports it in the row actions. Update this one file to change delete UX everywhere.

It uses the base-ui `AlertDialog` (`src/components/ui/alert-dialog.tsx`, with `AlertDialogMedia` for the warning icon + `TriangleAlert`), controlled `open` state, `useTransition`, sonner `toast`, `router.refresh()`. Confirm button is `variant="destructive"`.

Public API: props `action: () => Promise<ActionResult>`, `confirmMessage: string`, plus optional `title?` (default "¿Eliminar este registro?"). Keep new props optional so call-sites stay untouched.

**Why:** confirmations were a native `window.confirm()` (inconsistent with the panel); unified to a modern modal 2026-06-20.
**How to apply:** for any new admin list with destructive row actions, reuse `DeleteButton` — don't roll a new dialog. `enrollment-control.tsx` (quitar inscripción) still uses its own `window.confirm` and is NOT this component.
