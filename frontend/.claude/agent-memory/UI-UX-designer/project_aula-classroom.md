---
name: aula-classroom
description: Student "aula" (LMS video player) at /dashboard/aula/[moduleId] — 2-col layout, LessonVideo, client lesson switching, progress/notes
metadata:
  type: project
---

Aula del estudiante (reproductor de módulo) en `src/app/dashboard/aula/[moduleId]/`.

**Estructura:** `page.tsx` (server, `requireUser()` + `getLearnModule(moduleId)` de `@/lib/api/me`, `notFound()` si null) → pasa `LearnModule` a `classroom-view.tsx` (client). `actions.ts` tiene `setProgressAction(moduleId, topicId, completed)` y `setNoteAction(moduleId, topicId, content)` vía `mutateMe("PUT", "/me/topics/:id/progress|note")` → `ActionResult` + `revalidatePath`.

**Layout:** `grid lg:grid-cols-[minmax(0,1.85fr)_minmax(0,1fr)]`. Columna principal: `LessonVideo` 16:9 + título + nombre del curso en `text-primary` + descripción + botón "Marcar como completada"/"Completada" + contenido + "Recursos de clase" (MaterialLink chips) + "Actividades" (reusa `StudentActivity` de `mis-cursos/[id]/`, recibe `courseId={learn.course.id}`). Columna lateral `lg:sticky lg:top-20`: tarjeta con pestañas client (Temario/Tus notas) — NO Base UI Tabs, botones `role=tab` propios. Temario = barra de progreso `bg-primary` + lista de lecciones (activa = `bg-primary/10 ring-primary/20`, check verde si completed). Notas = textarea con guardado explícito (botón deshabilitado si no dirty), `key={selected.id}` para resembrar al cambiar lección.

**Lección activa = estado de cliente** (`selectedTopicId`, init = primera no completada o primera). Cambiar lección NO navega, solo `setSelectedId`.

**Gotcha:** la prop se llama `module` en el call site pero se destructura como `{ module: learn }` para evitar `@next/next/no-assign-module-variable`. Mismo patrón `{ module: m }` en `mis-programas`.

Relacionado: [[lesson-video]], [[mis-programas]], [[teacher-topic-nested-content]].
