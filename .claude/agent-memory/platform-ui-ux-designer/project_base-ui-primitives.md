---
name: base-ui-primitives
description: This project's shadcn/ui is built on @base-ui/react (NOT Radix) — Select/Tabs/AlertDialog/Button APIs differ; key prop signatures for internal dashboard work
metadata:
  type: project
---

The dashboard's shadcn primitives in `frontend/src/components/ui/` wrap **`@base-ui/react`**, not Radix. APIs differ from typical shadcn/training data. Verified for the usuarios section.

**Select** (`select.tsx`):

- Root `<Select value onValueChange={(value)=>...}>` (base-ui passes `(value, eventDetails)`).
- `<SelectValue placeholder="..." />` — `placeholder` is a real prop (base-ui `SelectValue.Props`).
- `<SelectTrigger>` is `w-fit` by default — add `className="w-full"` for full-width form fields.
- With react-hook-form: wrap in `<Controller>`, bind `value={field.value}` + `onValueChange={field.onChange}`.

**Tabs / AlertDialog** also base-ui (`@base-ui/react/tabs`, `.../alert-dialog`). AlertDialog exports include `AlertDialogMedia` (base-ui extra).

**Button** (`button.tsx`) is base-ui `ButtonPrimitive`: supports `nativeButton={false}` + `render={<Link .../>}` to render as a link (canonical pattern across admin pages for "create" CTAs and row edit icons). Sizes: `default|xs|sm|lg|icon|icon-xs|icon-sm|icon-lg`. Variants: `default|outline|secondary|ghost|destructive|link`. Row action icons use `variant="ghost" size="icon-sm"`.

**Zod is v4** (`z.email("msg")` top-level, NOT `z.string().email()` which is deprecated; `z.enum(values, { error: "msg" })` for custom enum error). Login schema uses `z.email({ message })`.

Components present in `ui/`: badge, button, card, input, label, select, sonner, switch, table, textarea, tabs, alert-dialog. Added tabs + alert-dialog via `pnpm dlx shadcn@latest add` for usuarios (they pull base-ui versions automatically).
