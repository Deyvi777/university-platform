---
name: teacher-topic-nested-content
description: Teacher module mgmt restructured — materials/activities now nested under each topic (lesson), not at module level
metadata:
  type: project
---

Gestión de contenido del docente en `src/app/dashboard/modulos/[moduleId]/`.

**Cambio de modelo:** materiales y actividades ahora pertenecen a un TEMA (lección), no al módulo. `page.tsx` renderiza SOLO `<TopicsSection moduleId topics={mod.topics} />`. `TeacherModule` ya no tiene `materials`/`activities` a nivel módulo.

**`topics-section.tsx`:** cada tema = tarjeta `<details>` expandible. Resumen: orden, título, badge Publicada/Borrador, chip "Video" si `videoUrl`, conteo de materiales/actividades. Al abrir: botones Editar lección / DeleteButton, el `TopicForm`, y grid `lg:grid-cols-2` con `<TopicMaterials>` + `<TopicActivities>`. `TopicForm` incluye campo `videoUrl` (enlace YouTube/Vimeo opcional).

**`topic-materials.tsx` / `topic-activities.tsx`:** subcomponentes reutilizables que reciben `moduleId` + `topicId`. Misma lógica que las viejas materials-section/activities-section (DeleteButton, badges, "Calificar" → `/dashboard/actividades/[id]`, upload vía `/api/teacher/upload`) pero scoped al tema. `createMaterialAction`/`createActivityAction` reciben `(moduleId, topicId, payload)`.

Las viejas `materials-section.tsx` y `activities-section.tsx` fueron ELIMINADAS (código muerto).

Estado vacío sin temas: "Crea la primera lección para poder añadirle materiales y actividades."

Relacionado: [[aula-classroom]].
