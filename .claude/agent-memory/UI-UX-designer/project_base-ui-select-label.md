---
name: base-ui-select-label
description: base-ui Select shows raw value (e.g. DRAFT) in trigger unless Select.Root gets items prop or Value gets a render fn
metadata:
  type: project
---

The dashboard `Select` (`src/components/ui/select.tsx`) wraps **base-ui** (`@base-ui/react/select`), NOT Radix. base-ui's `<Select.Value />` renders the **raw selected value** (e.g. `DRAFT`, `PROFESSOR`) in the trigger when given no children render function.

**Fix (preferred):** pass `items` to `<Select>` (= `Select.Root`) — an array of `{ value, label }` (the same options array already mapped to `<SelectItem>`). base-ui then renders the label of the selected item in the trigger automatically (and improves a11y). Confirmed in `node_modules/@base-ui/react/select/root/SelectRoot.d.ts` and `.../value/SelectValue.d.ts`.

```tsx
<Select items={STATUS_OPTIONS} value={field.value} onValueChange={field.onChange}>
  <SelectTrigger><SelectValue /></SelectTrigger>
  ...
```

**Alt fix:** `<SelectValue>{(value) => labels[value]}</SelectValue>` (render-fn children).

**Why:** base-ui differs from Radix (where `<SelectValue/>` auto-shows the item's text). Training data assumes Radix → easy to miss.

**How to apply:** any new dashboard form with a `<Select>` whose option labels differ from raw values MUST pass `items` (or a render fn). Applied to cursos `course-form.tsx` (Estado) and usuarios `user-form.tsx` (Rol). Both had the bug.
