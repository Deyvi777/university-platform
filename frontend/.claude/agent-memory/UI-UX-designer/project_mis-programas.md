---
name: mis-programas
description: Student programs list at /dashboard/mis-programas — navy <details> accordion per enrolled program, modules link to aula
metadata:
  type: project
---

`src/app/dashboard/mis-programas/page.tsx` (server, `requireUser()`). Usa `listMyCourses()` y filtra a `Array.isArray(c.modules)` (los estudiantes reciben `modules: ProgramModule[]`; docentes no).

Cada programa = `<details>` `rounded-3xl` con cabecera navy en degradado (`from-blue-900 to-blue-950` / dark slate), código + badge de estado del curso + nombre + meta (modalidad/módulos/fecha). Al abrir: lista de módulos en orden, cada uno `<Link href={'/dashboard/aula/'+m.id}>` con badge ModuleStatus + "Entrar al aula" en hover. Primer programa `defaultOpen`. Estado vacío con icono `GraduationCap`.

Entrada desde el home: `CourseCard` (`src/components/dashboard/course-card.tsx`) ahora ramifica href — docente → `/dashboard/mis-cursos/[id]` (sin cambios); estudiante (`myModules === null`) → `/dashboard/mis-programas`. `mis-cursos/[id]` se deja intacto.

El sidebar ya NO tiene un item plano "Programas" → esta página; ahora hay un **árbol anidado** (programa → módulos) en el sidebar para PROFESSOR/STUDENT, y `/dashboard/mis-programas` es la "vista completa" enlazada desde el encabezado del árbol ("Ver todos") y desde el icono del riel. Ver [[sidebar-program-tree]].

Relacionado: [[aula-classroom]], [[sidebar-program-tree]].
