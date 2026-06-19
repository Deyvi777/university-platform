---
name: admin-section-pattern
description: The exact file recipe + helper locations for a new dashboard admin CRUD section (page/actions/schema/form), plus semantic badge + role-filter conventions
metadata:
  type: project
---

Canonical admin CRUD section under `frontend/src/app/dashboard/<seccion>/` (see `partners`, `programas`, `usuarios`). Each new section is a folder:

- `page.tsx` (server): `await requireAdmin()`, fetch via `src/lib/api/admin.ts`, shadcn `Table`, header with count + "Crear" `Button` (link via `nativeButton={false} render={<Link/>}`), row actions = edit icon (`variant="ghost" size="icon-sm"`) + `<DeleteButton action={...} confirmMessage=.../>` (`src/components/admin/delete-button.tsx` — uses `window.confirm`, NOT AlertDialog).
- `nuevo/page.tsx` + `[id]/page.tsx` (server): dedicated ROUTES for create/edit (no dialog). Edit catches `AdminApiError` `status===404` → `notFound()`. Back-link `<ArrowLeft/> Volver a ...`.
- `actions.ts` (`"use server"`): one fn per mutation → `mutateAdmin(method, path, body)` then a `revalidate*()` helper hitting EVERY affected route. Catch block ALWAYS calls `handleAdminActionError(error)` FIRST (rethrows NEXT_REDIRECT for dead-session 401), then returns `{ ok:false, error: errorMessage(error) }`. `errorMessage` reads `AdminApiError.message` so backend 409/validation text surfaces verbatim.
- `*-schema.ts`: zod (v4) mirroring backend DTO + `to*FormValues` / `to*Payload` converters.
- `*-form.tsx` (`"use client"`): react-hook-form + `zodResolver`, toast on success → `router.push(list)` + `router.refresh()`, toast.error otherwise.

**Reads/writes wiring** in `src/lib/api/admin.ts`: add the entity interface, `listAdmin*`/`getAdmin*` (parse(await adminFetch(path))), and reuse `mutateAdmin`. Payload interfaces live in `src/app/dashboard/admin-types.ts` (`ActionResult<T>` is there too).

**Integration points for every new ADMIN section:**

- `src/app/dashboard/nav-items.ts` → add to `ADMIN_ITEMS` (role-gated by `navItemsForRole`; PROFESSOR/STUDENT only see Inicio).
- `src/app/dashboard/page.tsx` `AdminHome` → add a link-card (amber icon chip `bg-amber-500/10 text-amber-600 ring-amber-500/20`, count via the list fetch). Home is grouped into sections via `HomeSection` ("Personas" for usuarios, "Gestión del sitio · Landing" for content).

**Usuarios specifics:** semantic badges in `usuarios/user-badges.tsx` — `RoleBadge` (Docente=sky, Estudiante=violet, Administrador=amber) + `StatusBadge` (Activo=emerald, Inactivo=secondary). Role filter is **URL-driven server-side** (`?rol=docentes|estudiantes`, segmented `<Link>` pills styled like a tablist) — NO client tabs/useSearchParams needed, keeps the list a server component. Backend `?role=PROFESSOR|STUDENT`. Password field reuses login's show/hide toggle; create requires password (min8), edit makes it optional (empty = unchanged, omitted from payload). Duplicate-email 409 → `setError("email")` + form-level alert banner + toast.
