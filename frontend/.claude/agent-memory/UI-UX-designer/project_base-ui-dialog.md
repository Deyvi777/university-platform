---
name: base-ui-dialog
description: Reusable generic Dialog primitive (Base UI, NOT Radix) at src/components/ui/dialog.tsx — modal for the teacher content-type picker
metadata:
  type: project
---

`src/components/ui/dialog.tsx` is the generic floating-modal primitive, built on **Base UI** (`@base-ui/react/dialog`), mirroring `src/components/ui/alert-dialog.tsx`'s structure/`data-slot` pattern. Use this (not the AlertDialog) for non-confirmation modals.

**Why:** AlertDialog is semantically for destructive confirmations; a plain centered dialog (selectors, forms) needed its own primitive. shadcn-add would pull Radix, which this project does not use.

**How to apply:**

- Exports: `Dialog` (Root, controlled via `open`/`onOpenChange`), `DialogTrigger`, `DialogPortal`, `DialogClose`, `DialogOverlay`, `DialogContent`, `DialogHeader`, `DialogFooter`, `DialogTitle`, `DialogDescription`.
- `DialogContent` portals to body, centers (`rounded-2xl shadow-lg shadow-blue-950/10 ring-1`), backdrop blur, open/closed animations, built-in X close button (`showCloseButton` prop, default true, `aria-label="Cerrar"`). Escape/backdrop/X close handled natively by Base UI.
- Usages in `dashboard/modulos/[moduleId]/content-manager.tsx`: (1) content-type **picker** modal ("¿Qué quieres agregar?" → 4 KIND_META cards), state `pickerOpen`; choosing a kind does `setPickerOpen(false)` + `setAdding(kind)`. (2) content **config form** modal (`ContentFormDialog` wrapper) for both create AND edit — replaces the old inline forms. Create: `open={adding !== null}`. Edit: each `SortableRow` renders its own `ContentFormDialog open={editingId === content.id}` (inline expand panel removed). DialogTitle = "Nuevo/Editar {label}" with tinted icon; ContentForm's own heading was removed to avoid dup.
- **Tall-content modals (Tiptap editor / many fields):** make the dialog wider + scrollable via consumer className `max-w-2xl max-h-[85vh] overflow-y-auto` on `DialogContent` (primitive unchanged). The X close button is `absolute` to the popup, so it stays put while the body scrolls. Form mounts/unmounts with open → editor reinitializes per open (fine, `immediatelyRender:false`). See [[teacher-topic-nested-content]].
