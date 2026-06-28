# DATAMODEL.md — Modelo de datos

Documenta el esquema de Prisma (`backend/prisma/schema.prisma`) de la plataforma **Certificate**. PostgreSQL 18, `prisma-client-js` con driver adapter (`@prisma/adapter-pg`, ver `backend/src/prisma/prisma.service.ts`). El datasource real está en `backend/prisma.config.ts`, no en `schema.prisma`.

## Convenciones generales

- Todas las tablas usan `id String @id @default(uuid())` y se mapean a nombres `snake_case` en plural vía `@@map(...)`. **Excepción:** `SiteSettings` es un singleton con id fijo (`@default("singleton")`).
- Timestamps `createdAt`/`updatedAt` (`@default(now())` / `@updatedAt`) en todos los modelos salvo `ProgramModule`/`ProgramTeacher`.
- Campos `Decimal` (`enrollmentFee`, `totalCost`) llegan al frontend serializados como **string** vía JSON — formatear con `Number(x).toLocaleString("es-BO")`.
- Rutas de imágenes (`flyerUrl`, `logoUrl`, `photoUrl`) son **paths relativos**, nunca URLs absolutas: o bien assets estáticos de `frontend/public/landing/...`, o bien objetos subidos servidos por `GET /files/:folder/:filename` (Garage/S3, módulo `storage`). Las subidas del admin guardan la ruta **relativa** `/files/...` que devuelve `POST /uploads`; el frontend hace proxy de `/files/*` al backend (ver CLAUDE.md → Storage module). No guardar `http://localhost:4000/...`: rompe `next/image` en producción y por el bloqueo SSRF de Next 16.

## Enums

### `Role`

```
ADMIN | PROFESSOR | STUDENT
```

Usado por `User.role` y por el decorador `@Roles(...)` de `RolesGuard` para proteger endpoints `/admin/...`. Los tres flujos por rol de la capa **Academia / LMS** ya están implementados:

- **ADMIN** — `/admin/users` (cuentas PROFESSOR/STUDENT, módulo `backend/src/users/`) y `/admin/courses` (programas académicos `Course`, módulo `backend/src/courses/`): crear con N módulos, asignar **varios docentes por módulo** (co-docencia, `ModuleTeacher`) e inscribir estudiantes a nivel de curso. También envía **avisos** masivos vía `/admin/notifications` (ver `Announcement`).
- **PROFESSOR** — gestiona el **temario** de **sus** módulos como una lista ordenable de `ModuleContent` (tema/video/material/actividad) vía `/me/modules/...` (módulo `backend/src/module-content/`) y **califica** vía la libreta (`/me/modules/:id/gradebook`, `/me/modules/:id/students/:sid/observation`) o por actividad (`/me/activities/.../grade`, módulo `backend/src/grading/`), lo que recalcula la `ModuleGrade` ponderada. Ve sus cursos en `GET /me/courses`.
- **STUDENT** — ve sus cursos (`GET /me/courses[/:id]`), **entrega actividades** (texto/archivo) vía `/me/activities/:id/submit`, y consulta su **kárdex** consolidado en `GET /me/kardex`.

**Notas de estudiantes (vista del ADMIN).** El admin consulta las notas de cualquier estudiante vía `/admin/students/:id/kardex` (mismo payload que `GET /me/kardex` del estudiante) y `/admin/students/:id/grades` (**detalle por actividad**: programas → módulos → cada `ACTIVITY` con su puntaje + la `ModuleGrade` final y su observación). Ambos guardados `@Roles(ADMIN)`, en `backend/src/courses/admin-student-grades.controller.ts`, reutilizando `CoursesService.getKardex`/`getStudentGradeDetail` (misma visibilidad que el estudiante: cursos `ACTIVE`/`FINISHED`, sin módulos `DRAFT`). UI en `frontend/src/app/dashboard/notas-estudiantes/` (ver CLAUDE.md, sección Admin).

Los endpoints `/me/*` solo exigen `JwtAuthGuard`: el servicio autoriza por **inscripción** (estudiante) o **docencia** (`ModuleTeacher`) según el recurso. Subidas de archivo de docente/estudiante vía `POST /me/uploads` (carpeta `materials`/`submissions` según rol; ver CLAUDE.md → Storage module).

### Enums de la capa académica (LMS)

| Enum                | Valores                                          | Usado en                                          |
| ------------------- | ------------------------------------------------ | ------------------------------------------------- |
| `CourseStatus`      | `DRAFT \| ACTIVE \| FINISHED \| ARCHIVED`        | `Course.status`                                   |
| `ModuleStatus`      | `DRAFT \| ACTIVE \| FINISHED`                    | `CourseModule.status`                             |
| `EnrollmentStatus`  | `ACTIVE \| WITHDRAWN \| GRADUATED`               | `Enrollment.status`                               |
| `ContentKind`       | `TEXT \| VIDEO \| MATERIAL \| ACTIVITY`          | `ModuleContent.kind`                              |
| `ActivityType`      | `ASSIGNMENT \| QUIZ \| EXAM \| PROJECT \| FORUM` | `ModuleContent.activityType`                      |
| `SubmissionStatus`  | `PENDING \| SUBMITTED \| LATE \| GRADED`         | `Submission.status`                               |
| `MaterialType`      | `FILE \| LINK \| VIDEO`                          | `ModuleContent.materialType` (solo `FILE`/`LINK`) |
| `ModuleGradeStatus` | `IN_PROGRESS \| PASSED \| FAILED`                | `ModuleGrade.status`                              |

### Enums de notificaciones

| Enum                   | Valores                                                                                     | Usado en                |
| ---------------------- | ------------------------------------------------------------------------------------------- | ----------------------- |
| `NotificationType`     | `ENROLLMENT \| MODULE_ASSIGNMENT \| ANNOUNCEMENT \| GRADE \| ACTIVITY_PUBLISHED \| MESSAGE` | `Notification.type`     |
| `AnnouncementAudience` | `ALL \| PROFESSORS \| STUDENTS \| SELECTED`                                                 | `Announcement.audience` |

`MESSAGE` = mensaje de chat recibido (docente ↔ estudiante dentro de un módulo); ver `ChatMessage` y el gateway WebSocket más abajo.

## Modelos

### `User` → tabla `users`

| Campo                     | Tipo            | Notas                                      |
| ------------------------- | --------------- | ------------------------------------------ |
| `id`                      | `String` (uuid) | PK                                         |
| `email`                   | `String`        | `@unique`                                  |
| `password`                | `String`        | hash argon2 (ver `backend/src/auth/`)      |
| `firstName` / `lastName`  | `String`        |                                            |
| `phone`                   | `String`        | teléfono de contacto (**obligatorio**)     |
| `idDocument`              | `String?`       | documento de identidad / carnet (opcional) |
| `role`                    | `Role`          | default `STUDENT`                          |
| `isActive`                | `Boolean`       | default `true`                             |
| `createdAt` / `updatedAt` | `DateTime`      |                                            |

Fuente de verdad de identidad y RBAC; NextAuth no gestiona usuarios (ver CLAUDE.md, "Auth flow"). **Cuenta desactivada (`isActive=false`):** `AuthService.login` valida primero correo+contraseña y, si son correctos pero la cuenta está inactiva, responde **403** (no 401) para que el login muestre el mensaje de **cuenta suspendida** ("comunícate con administración"); el chequeo va después de validar la contraseña para no revelar qué correos existen. Además `JwtStrategy.validate` hace que **todo token ya emitido** de un usuario inactivo devuelva **401**; en el frontend ese 401 (igual que un token vencido o una DB reseedeada) se enruta a `/api/auth/session-expired`, que cierra la sesión muerta de NextAuth y manda a `/login?expired=1` (ver `frontend/AGENTS.md`). La contraseña exige **mínimo 6 caracteres** (DTOs de `register`/`login`/`create`/`update`/carga masiva y los schemas Zod del frontend).

**Gestión admin** (`backend/src/users/`, módulo solo-admin sin controlador público): `/admin/users` (guardado `@Roles(ADMIN)`) con `findAll(?role=PROFESSOR|STUDENT|ADMIN)`/`findOne`/`create`/`update`/`remove` + **`POST /admin/users/bulk`** (carga masiva). El formulario del panel **solo emite cuentas PROFESSOR o STUDENT** (el `role` del DTO Zod excluye `ADMIN` → `400`; correo duplicado → `409`); en **edición** el rol **no se envía** (el update parcial conserva el rol actual, incluido ADMIN). La contraseña se hashea con argon2 y **ninguna respuesta incluye el hash** (`safeSelect`, que sí expone `phone`/`idDocument`). **Carga masiva de estudiantes** (`bulkCreateStudents`): recibe `{ students: [...] }` (filas parseadas de un Excel en el cliente), valida **fila por fila** con Zod y hace **carga parcial** (crea las válidas como STUDENT, reporta `{ total, created, errors[{ index, email, message }] }`; detecta duplicados dentro del archivo y contra la BD vía `P2002`). UI en `frontend/src/app/dashboard/usuarios/` (ver CLAUDE.md, sección Admin).

Relaciones académicas (todas opcionales, dependen del rol): `taughtModules` (`ModuleTeacher[]`, módulos que dicta como docente vía la tabla intermedia de co-docencia), `enrollments` (`Enrollment[]`, cursos en que está inscrito como estudiante), `submissions` (`Submission[]`, sus entregas), `gradedSubmissions` (`Submission[]` que calificó — relación `"SubmissionGrader"`), `moduleGrades` (`ModuleGrade[]`, su kárdex — relación `"StudentGrades"`), `gradedModules` (`ModuleGrade[]` que calificó — relación `"ModuleGrader"`), `contentProgress` (`ContentProgress[]`). Relaciones de notificaciones: `notifications` (`Notification[]`, las que recibe), `sentAnnouncements` (`Announcement[]`, los avisos que envió como admin — relación `"AnnouncementSender"`). Relaciones de **chat**: `chatAsStudent` / `chatAsTeacher` (`ChatMessage[]`, conversaciones donde es el estudiante / el docente — relaciones `"ChatStudent"` / `"ChatTeacher"`) y `sentMessages` (`ChatMessage[]` que envió — relación `"ChatSender"`). Un mismo `User` con rol PROFESSOR/STUDENT cuelga de estas relaciones.

### `ProgramCategory` → tabla `program_categories`

| Campo                     | Tipo            | Notas                                                                                                 |
| ------------------------- | --------------- | ----------------------------------------------------------------------------------------------------- |
| `id`                      | `String` (uuid) | PK                                                                                                    |
| `name`                    | `String`        | ej. "Maestría", "Diplomado"                                                                           |
| `slug`                    | `String`        | `@unique`, auto-generado desde `name` vía `slugify` con reintento numérico                            |
| `displayOrder`            | `Int`           | default `0`; ordena tabs en landing y filas en admin (se cambia por **drag-and-drop**, no en el form) |
| `isActive`                | `Boolean`       | default `true`; solo categorías activas se exponen en `GET /categories`                               |
| `createdAt` / `updatedAt` | `DateTime`      |                                                                                                       |
| `programs`                | `Program[]`     | relación inversa 1:N                                                                                  |

Gestión completa vía `/admin/categories` (CRUD) + **`PUT /admin/categories/reorder`** (`{ orderedIds }`, drag-and-drop). El form de crear/editar **no** edita `displayOrder`; al crear se agrega al final. Borrar una categoría con `programs.count > 0` devuelve `409 Conflict`. Reemplaza el antiguo enum fijo `ProgramCategory` (MAESTRIA/DIPLOMADO) — esos dos valores siguen existiendo como filas semilla (`slug: maestria`, `slug: diplomado`) pero ahora son datos, no tipos.

### `Program` → tabla `programs`

| Campo                     | Tipo               | Notas                                                                                                                     |
| ------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| `id`                      | `String` (uuid)    | PK                                                                                                                        |
| `slug`                    | `String`           | `@unique`, auto-generado desde `title` vía `slugify` con reintento numérico                                               |
| `title`                   | `String`           |                                                                                                                           |
| `categoryId`              | `String`           | FK → `ProgramCategory.id`                                                                                                 |
| `category`                | `ProgramCategory`  | relación N:1                                                                                                              |
| `flyerUrl`                | `String`           | path de imagen (ver convenciones)                                                                                         |
| `objective`               | `String`           | objetivo del programa                                                                                                     |
| `targetAudience`          | `String`           | "dirigido a"                                                                                                              |
| `modality`                | `String`           | ej. "Virtual con clases en vivo"                                                                                          |
| `startDate`               | `DateTime`         | inicio de clases (UTC)                                                                                                    |
| `duration`                | `String`           | ej. "18 meses (4 semestres)"                                                                                              |
| `schedule`                | `String`           | ej. "Viernes 19:00–22:00 y sábados 09:00–12:00"                                                                           |
| `requirements`            | `String[]`         | lista de requisitos                                                                                                       |
| `enrollmentFee`           | `Decimal(10,2)`    | matrícula                                                                                                                 |
| `totalCost`               | `Decimal(10,2)`    | inversión total                                                                                                           |
| `currency`                | `String`           | default `"Bs"`                                                                                                            |
| `paymentFacilities`       | `String?`          | texto libre, facilidades de pago                                                                                          |
| `isPublished`             | `Boolean`          | default `true`; solo publicados se exponen públicamente                                                                   |
| `displayOrder`            | `Int`              | default `0`; **orden manual** (drag-and-drop del panel) que rige tanto la tabla del dashboard como el orden en la landing |
| `createdAt` / `updatedAt` | `DateTime`         |                                                                                                                           |
| `modules`                 | `ProgramModule[]`  | relación 1:N, `onDelete: Cascade`                                                                                         |
| `teachers`                | `ProgramTeacher[]` | relación 1:N, `onDelete: Cascade`                                                                                         |

Índice: `@@index([categoryId, isPublished])`.

Endpoints públicos: `GET /programs` (filtrable por `?category=<slug>`, ordenado por `displayOrder` y `startDate` como desempate), `GET /programs/:slug`. Admin: `/admin/programs` (CRUD; `modules`/`teachers` se reemplazan completos en cada `update` dentro de una transacción) + **`PUT /admin/programs/reorder`** (`{ orderedIds }`, drag-and-drop). Al **crear**, el programa se agrega al final (mayor `displayOrder`+1); el form de crear/editar **no** edita `displayOrder` (el orden se cambia solo por drag-and-drop). Mismo patrón de reorden que `categories`/`partners`/`team`.

### `ProgramModule` → tabla `program_modules`

| Campo       | Tipo            | Notas                                  |
| ----------- | --------------- | -------------------------------------- |
| `id`        | `String` (uuid) | PK                                     |
| `programId` | `String`        | FK → `Program.id`, `onDelete: Cascade` |
| `order`     | `Int`           | orden de la malla académica            |
| `name`      | `String`        | nombre del módulo                      |
| `contents`  | `String[]`      | asignaturas/contenidos                 |

Índice único: `@@unique([programId, order])`.

### `ProgramTeacher` → tabla `program_teachers`

| Campo         | Tipo            | Notas                                                 |
| ------------- | --------------- | ----------------------------------------------------- |
| `id`          | `String` (uuid) | PK                                                    |
| `programId`   | `String`        | FK → `Program.id`, `onDelete: Cascade`                |
| `fullName`    | `String`        |                                                       |
| `credentials` | `String`        | grado académico / especialidad                        |
| `photoUrl`    | `String?`       | path de imagen; si es `null`, la UI muestra iniciales |
| `order`       | `Int`           | default `0`                                           |

### `Partner` → tabla `partners`

| Campo                     | Tipo            | Notas                                                       |
| ------------------------- | --------------- | ----------------------------------------------------------- |
| `id`                      | `String` (uuid) | PK                                                          |
| `name`                    | `String`        | nombre de la institución aliada                             |
| `logoUrl`                 | `String`        | `@unique`, path de imagen (ej. `/landing/partners/2.webp`)  |
| `displayOrder`            | `Int`           | default `0`; se cambia por **drag-and-drop**, no en el form |
| `isPublished`             | `Boolean`       | default `true`                                              |
| `createdAt` / `updatedAt` | `DateTime`      |                                                             |

Índice: `@@index([isPublished, displayOrder])`. Endpoints públicos: `GET /partners` (solo publicados, ordenados). Admin: `/admin/partners` (CRUD) + **`PUT /admin/partners/reorder`** (`{ orderedIds }`, drag-and-drop). El form de crear/editar **no** edita `displayOrder`; al crear se agrega al final.

### `SiteSettings` → tabla `site_settings`

Configuración global de la landing. Es un **singleton**: una única fila con id fijo `"singleton"` (no uuid). Guarda los enlaces a redes sociales que se muestran en el footer; un campo `null` (o vacío al guardar) **oculta** su icono.

| Campo                     | Tipo       | Notas                                         |
| ------------------------- | ---------- | --------------------------------------------- |
| `id`                      | `String`   | PK fija `@default("singleton")`               |
| `facebook`                | `String?`  | URL del perfil; `null` oculta el icono        |
| `instagram`               | `String?`  |                                               |
| `linkedin`                | `String?`  |                                               |
| `youtube`                 | `String?`  |                                               |
| `tiktok`                  | `String?`  |                                               |
| `whatsapp`                | `String?`  | URL completa, ej. `https://wa.me/59170000000` |
| `createdAt` / `updatedAt` | `DateTime` |                                               |

Endpoint público: `GET /settings` (solo los 6 campos de redes). Admin: `GET /admin/settings` y `PATCH /admin/settings` (módulo `backend/src/settings/`). El service usa `upsert` por id `"singleton"`, así la fila se crea sola la primera vez. El DTO Zod normaliza cadena vacía → `null` y valida que un valor no vacío sea URL. Pensada para crecer con más "datos de la landing" (textos, contacto, etc.).

---

## Academia / LMS

Capa académica **real**, separada del marketing de la landing. Decisiones de diseño tomadas con el cliente:

- **`Course` es independiente de `Program`** (el `Program` de la landing es solo marketing/catálogo; el `Course` es la operación académica). No hay FK entre ambos.
- **La inscripción es a nivel de curso** (`Enrollment` = estudiante ↔ curso): inscribir a un estudiante en un `Course` le da acceso a **todos** sus módulos. El **kárdex** de un estudiante es el conjunto de sus `ModuleGrade` (una nota final por módulo).
- Flujos por rol: **ADMIN** crea cursos/módulos, asigna docentes (vía `ModuleTeacher`) e inscribe estudiantes — y además **puede gestionar cualquier módulo como un docente** (entra desde el detalle del programa: `ensureTeaches` en `ModuleContentService`/`GradingService` deja pasar a un usuario `ADMIN` aunque no figure en `ModuleTeacher`); **PROFESSOR** arma el temario de sus módulos creando **contenidos** (`ModuleContent`: tema/video/material/actividad), los reordena por drag-and-drop, califica entregas y **conversa con sus estudiantes por chat** dentro de cada módulo; **STUDENT** recorre el temario en el aula, marca contenidos como completados, entrega actividades, **chatea con el/los docente(s) del módulo** y consulta su kárdex. (El **chat** docente↔estudiante es mensajería 1 a 1 por módulo, vía `ChatMessage` + WebSocket — ver más abajo.)
- **Temario = lista ordenable de `ModuleContent`.** Un módulo ya **no** tiene tablas separadas de temas/materiales/actividades: tiene una sola lista de contenidos heterogéneos (`kind`), ordenada por `order` (reordenable). El estudiante ve esa misma lista/orden en el aula.
- **Nota de módulo automática (ponderada).** Al calificar una entrega (`GradingService`, módulo `backend/src/grading/`), la `ModuleGrade` del estudiante se **recalcula**: cada contenido `ACTIVITY` publicado con `weight > 0` se normaliza a base 100 (`score/maxScore*100`) y se pondera por su `weight`; las no calificadas cuentan como 0. `status` queda `IN_PROGRESS` hasta calificar todas las actividades ponderadas, luego `PASSED`/`FAILED` según `Course.passingScore`. El kárdex (`GET /me/kardex`) consolida estas notas por curso. (Default de `weight` al **crear** una actividad/calificación en el panel: **100%**.)
- **Las etiquetas Aprobado/Reprobado solo se muestran cuando el módulo está `FINISHED`.** Mientras el módulo está `ACTIVE`, la nota final se muestra como número pero con etiqueta neutra "En curso" (el frontend fuerza el badge a `IN_PROGRESS` si el módulo no está concluido) — en la libreta del docente, las "Notas" del aula, el detalle del curso y el kárdex. El `passedCount` del kárdex ("Aprobados X/Y") cuenta solo módulos **`FINISHED` y `PASSED`**.
- **Módulo `FINISHED` = solo lectura (backend = fuente de verdad).** Cuando un módulo se marca Concluido, `ModuleContentService` y `GradingService` rechazan con **403** toda escritura sobre él: crear/editar/eliminar/reordenar contenidos, marcar progreso (estudiante), entregar actividad (estudiante) y calificar/observación (docente) — vía los helpers `ensureModuleNotFinished`/`ensureContentModuleNotFinished`. El frontend además oculta/inhabilita esas acciones y muestra un aviso (ver CLAUDE.md/AGENTS.md). (El **chat** no se bloquea por estado: la comunicación sigue disponible.)

Las rutas de archivos (`ModuleContent.url`, `Submission.fileUrl`) siguen la misma convención que el resto: paths relativos `/files/...` del módulo `storage`, nunca URLs absolutas.

### `Course` → tabla `courses`

| Campo                     | Tipo             | Notas                                                                                                                                                                  |
| ------------------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                      | `String` (uuid)  | PK                                                                                                                                                                     |
| `code`                    | `String`         | `@unique`, código institucional (ej. `MBA-2026-I`)                                                                                                                     |
| `name`                    | `String`         |                                                                                                                                                                        |
| `description`             | `String?`        |                                                                                                                                                                        |
| `modality`                | `String?`        | ej. "Virtual con clases en vivo"                                                                                                                                       |
| `startDate` / `endDate`   | `DateTime?`      |                                                                                                                                                                        |
| `passingScore`            | `Decimal(5,2)`   | nota mínima de aprobación. `@default(70)` en el schema, pero el **formulario de creación y el DTO Zod usan `71`** (valor por defecto efectivo al crear desde el panel) |
| `status`                  | `CourseStatus`   | default `DRAFT`                                                                                                                                                        |
| `createdAt` / `updatedAt` | `DateTime`       |                                                                                                                                                                        |
| `modules`                 | `CourseModule[]` | 1:N, `onDelete: Cascade`                                                                                                                                               |
| `enrollments`             | `Enrollment[]`   | 1:N, `onDelete: Cascade`                                                                                                                                               |

Índice: `@@index([status])`.

### `CourseModule` → tabla `course_modules`

Módulo académico dentro de un curso, dictado por un docente.

| Campo                                                         | Tipo            | Notas                                                                                                                      |
| ------------------------------------------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `id`                                                          | `String` (uuid) | PK                                                                                                                         |
| ------------------------------------------------------------- | --------------- | -------------------------------------                                                                                      |
| `courseId`                                                    | `String`        | FK → `Course.id`, `onDelete: Cascade`                                                                                      |
| `order`                                                       | `Int`           | posición en la malla                                                                                                       |
| `name`                                                        | `String`        |                                                                                                                            |
| `description`                                                 | `String?`       |                                                                                                                            |
| `credits`                                                     | `Int?`          |                                                                                                                            |
| `startDate` / `endDate`                                       | `DateTime?`     |                                                                                                                            |
| `status`                                                      | `ModuleStatus`  | default **`ACTIVE`**; lo fija el admin (Activo/Concluido/Borrador). Un módulo **`DRAFT` no es visible para el estudiante** |
| `createdAt` / `updatedAt`                                     | `DateTime`      |                                                                                                                            |
| `teachers` / `contents` / `grades`                            | relaciones      | 1:N (`contents` = `ModuleContent`)                                                                                         |

Índice: `@@unique([courseId, order])`. **Co-docencia**: los docentes a cargo se modelan vía la tabla intermedia `ModuleTeacher` (un módulo puede tener varios docentes), no con un FK `teacherId` directo. **Estado/visibilidad:** el admin cambia el estado con `PATCH /admin/courses/:id/modules/:moduleId/status`; las lecturas del estudiante (`/me/courses`, `/me/courses/:id`, `/me/modules/:id/learn`, `/me/kardex`) excluyen los módulos en `DRAFT` (el docente sí los ve).

### `ModuleTeacher` → tabla `course_module_teachers`

Asignación docente↔módulo (co-docencia). Reemplaza el antiguo `CourseModule.teacherId`.

| Campo        | Tipo            | Notas                                                   |
| ------------ | --------------- | ------------------------------------------------------- |
| `id`         | `String` (uuid) | PK                                                      |
| `moduleId`   | `String`        | FK → `CourseModule.id`, `onDelete: Cascade`             |
| `teacherId`  | `String`        | FK → `User.id` (docente PROFESSOR), `onDelete: Cascade` |
| `assignedAt` | `DateTime`      | default `now()`                                         |

Índices: `@@unique([moduleId, teacherId])` (no se duplica la asignación), `@@index([teacherId])`.

### `Enrollment` → tabla `enrollments`

Inscripción estudiante ↔ curso.

| Campo                     | Tipo               | Notas                                 |
| ------------------------- | ------------------ | ------------------------------------- |
| `id`                      | `String` (uuid)    | PK                                    |
| `studentId`               | `String`           | FK → `User.id`, `onDelete: Cascade`   |
| `courseId`                | `String`           | FK → `Course.id`, `onDelete: Cascade` |
| `status`                  | `EnrollmentStatus` | default `ACTIVE`                      |
| `enrolledAt`              | `DateTime`         | default `now()`                       |
| `createdAt` / `updatedAt` | `DateTime`         |                                       |

Índices: `@@unique([studentId, courseId])` (no se duplica inscripción), `@@index([courseId])`.

### `ModuleContent` → tabla `module_contents`

Un **contenido del temario** de un módulo, creado por el docente. Reemplaza el antiguo trío `Topic`/`Material`/`Activity`: el temario es ahora **una sola lista ordenable** de contenidos heterogéneos. Cada fila es de un `kind` (`ContentKind`) y usa solo el subconjunto de campos que aplica a su tipo (el resto queda `null`).

| Campo                     | Tipo                | Notas                                                                                                                                                   |
| ------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                      | `String` (uuid)     | PK                                                                                                                                                      |
| `moduleId`                | `String`            | FK → `CourseModule.id`, `onDelete: Cascade`                                                                                                             |
| `order`                   | `Int`               | posición en el temario (reordenable por drag-and-drop)                                                                                                  |
| `kind`                    | `ContentKind`       | `TEXT \| VIDEO \| MATERIAL \| ACTIVITY`                                                                                                                 |
| `title`                   | `String`            |                                                                                                                                                         |
| `isPublished`             | `Boolean`           | default `true`                                                                                                                                          |
| `body`                    | `String?`           | **TEXT**: HTML del editor enriquecido (Tiptap)                                                                                                          |
| `videoUrl`                | `String?`           | **VIDEO**: enlace YouTube/Vimeo                                                                                                                         |
| `materialType`            | `MaterialType?`     | **MATERIAL**: `FILE \| LINK`                                                                                                                            |
| `url`                     | `String?`           | **MATERIAL**: ruta `/files/...` (subida) o enlace externo                                                                                               |
| `activityType`            | `ActivityType?`     | **ACTIVITY**                                                                                                                                            |
| `instructions`            | `String?`           | **ACTIVITY**                                                                                                                                            |
| `dueDate`                 | `DateTime?`         | **ACTIVITY**                                                                                                                                            |
| `maxScore`                | `Decimal(5,2)?`     | **ACTIVITY**: default 100 al crear                                                                                                                      |
| `weight`                  | `Decimal(5,2)?`     | **ACTIVITY**: peso (%) en la nota del módulo. El **formulario de creación** lo inicia en **100%** (al editar conserva el valor guardado)                |
| `isOffline`               | `Boolean`           | **ACTIVITY**: presencial — la califica el docente a mano en la libreta (sin entrega del estudiante); no aparece en el temario del aula. default `false` |
| `createdAt` / `updatedAt` | `DateTime`          |                                                                                                                                                         |
| `submissions`             | `Submission[]`      | 1:N (solo `kind = ACTIVITY`)                                                                                                                            |
| `progress`                | `ContentProgress[]` | 1:N (avance por estudiante)                                                                                                                             |

Índices: `@@unique([moduleId, order])`, `@@index([moduleId])`.

### `ContentProgress` → tabla `content_progress`

Progreso de un estudiante en un contenido (si lo marcó como completado). Alimenta el % de avance del módulo en el aula.

| Campo                     | Tipo            | Notas                                        |
| ------------------------- | --------------- | -------------------------------------------- |
| `id`                      | `String` (uuid) | PK                                           |
| `studentId`               | `String`        | FK → `User.id`, `onDelete: Cascade`          |
| `contentId`               | `String`        | FK → `ModuleContent.id`, `onDelete: Cascade` |
| `completed`               | `Boolean`       | default `false`                              |
| `completedAt`             | `DateTime?`     |                                              |
| `createdAt` / `updatedAt` | `DateTime`      |                                              |

Índices: `@@unique([studentId, contentId])`, `@@index([contentId])`.

> **Nota:** el antiguo modelo `ContentNote` (apuntes privados del estudiante) **fue eliminado**. La pestaña "Apuntes" del aula se reemplazó por **"Chat"** (ver `ChatMessage`).

### `Submission` → tabla `submissions`

Entrega de un estudiante para un contenido de tipo `ACTIVITY`; calificada por el docente.

| Campo                     | Tipo               | Notas                                                     |
| ------------------------- | ------------------ | --------------------------------------------------------- |
| `id`                      | `String` (uuid)    | PK                                                        |
| `contentId`               | `String`           | FK → `ModuleContent.id`, `onDelete: Cascade`              |
| `studentId`               | `String`           | FK → `User.id`, `onDelete: Cascade`                       |
| `text`                    | `String?`          | texto de la entrega                                       |
| `fileUrl`                 | `String?`          | adjunto, ruta `/files/...`                                |
| `status`                  | `SubmissionStatus` | default `PENDING`                                         |
| `score`                   | `Decimal(5,2)?`    |                                                           |
| `feedback`                | `String?`          |                                                           |
| `submittedAt`             | `DateTime?`        |                                                           |
| `gradedById`              | `String?`          | FK → `User.id` (docente calificador), `onDelete: SetNull` |
| `gradedAt`                | `DateTime?`        |                                                           |
| `createdAt` / `updatedAt` | `DateTime`         |                                                           |

Índices: `@@unique([contentId, studentId])` (una entrega por estudiante/actividad), `@@index([studentId])`.

### `ModuleGrade` → tabla `module_grades`

Nota final de un estudiante en un módulo. El conjunto de las `ModuleGrade` de un estudiante es su **kárdex**.

| Campo                     | Tipo                | Notas                                                                         |
| ------------------------- | ------------------- | ----------------------------------------------------------------------------- |
| `id`                      | `String` (uuid)     | PK                                                                            |
| `studentId`               | `String`            | FK → `User.id`, `onDelete: Cascade` (relación `"StudentGrades"`)              |
| `moduleId`                | `String`            | FK → `CourseModule.id`, `onDelete: Cascade`                                   |
| `finalScore`              | `Decimal(5,2)?`     | nota final del módulo                                                         |
| `status`                  | `ModuleGradeStatus` | default `IN_PROGRESS`                                                         |
| `observations`            | `String?`           |                                                                               |
| `gradedById`              | `String?`           | FK → `User.id` (calificador), `onDelete: SetNull` (relación `"ModuleGrader"`) |
| `gradedAt`                | `DateTime?`         |                                                                               |
| `createdAt` / `updatedAt` | `DateTime`          |                                                                               |

Índices: `@@unique([studentId, moduleId])`, `@@index([moduleId])`.

### `ChatMessage` → tabla `chat_messages`

Mensaje de **chat directo (1 a 1)** entre un docente y un estudiante **dentro de un módulo**. La conversación se identifica por la terna `(moduleId, studentId, teacherId)`; `senderId` (igual a `studentId` o a `teacherId`) indica la dirección. Reemplaza al eliminado `ContentNote`.

| Campo       | Tipo            | Notas                                                                                        |
| ----------- | --------------- | -------------------------------------------------------------------------------------------- |
| `id`        | `String` (uuid) | PK                                                                                           |
| `moduleId`  | `String`        | FK → `CourseModule.id`, `onDelete: Cascade`                                                  |
| `studentId` | `String`        | FK → `User.id` (estudiante de la conversación), `onDelete: Cascade` (`"ChatStudent"`)        |
| `teacherId` | `String`        | FK → `User.id` (docente de la conversación), `onDelete: Cascade` (`"ChatTeacher"`)           |
| `senderId`  | `String`        | FK → `User.id` (quién envió, == studentId o teacherId), `onDelete: Cascade` (`"ChatSender"`) |
| `body`      | `String`        | texto (máx. 4000)                                                                            |
| `readAt`    | `DateTime?`     | cuándo lo leyó el receptor (`null` = no leído)                                               |
| `createdAt` | `DateTime`      |                                                                                              |

Índices: `@@index([moduleId, studentId, teacherId, createdAt])`, `@@index([senderId])`.

**Autorización (módulo `backend/src/chat/`):** el `ChatService` autoriza por **docencia** (`ModuleTeacher`, o `ADMIN`) y **inscripción** (`Enrollment`); el estudiante solo conversa con los docentes del módulo (no en módulos `DRAFT`), y el docente con los estudiantes inscritos. REST `GET /me/chat/:moduleId/contacts` (contactos + no leídos por contacto) y `GET /me/chat/:moduleId/contacts/:counterpartId/messages` (historial; marca leídos los entrantes). El **envío** va por **WebSocket** (`ChatGateway`, socket.io namespace `/chat`, auth con el mismo JWT del backend en el handshake): el cliente emite `chat:send` y el gateway persiste vía `ChatService`, crea una `Notification` tipo `MESSAGE` para el receptor (colapsada por `conversationKey` para no inundar la campana) y reemite `chat:new` a las salas `user:<id>` del emisor y del receptor. Al abrir una conversación, el backend marca leídos sus mensajes + notificaciones y emite `notification:read` (ver Notificaciones → push WebSocket).

---

## Notificaciones

Módulo `backend/src/notifications/`. Una `Notification` es una fila **por destinatario**; un `Announcement` es el **registro (log) de un envío** del admin (una fila por envío, no por destinatario).

### `Notification` → tabla `notifications`

Notificación persistida para un usuario (docente/estudiante). Se crea al inscribir a un estudiante, asignar un docente a un módulo, calificar una actividad, publicar una actividad, **recibir un mensaje de chat** (`MESSAGE`), o cuando un admin envía un aviso.

| Campo       | Tipo               | Notas                                                                           |
| ----------- | ------------------ | ------------------------------------------------------------------------------- |
| `id`        | `String` (uuid)    | PK                                                                              |
| `userId`    | `String`           | FK → `User.id`, `onDelete: Cascade` (destinatario)                              |
| `type`      | `NotificationType` |                                                                                 |
| `title`     | `String`           |                                                                                 |
| `body`      | `String`           | el frontend resalta en negrita lo que va entre comillas angulares `«…»`         |
| `read`      | `Boolean`          | default `false`                                                                 |
| `readAt`    | `DateTime?`        | se fija al marcar como leída (abrir = leer, estilo Gmail)                       |
| `data`      | `Json?`            | contexto opcional (`{ courseId, moduleId, activityId, audience }`); sin FK dura |
| `createdAt` | `DateTime`         |                                                                                 |

Índices: `@@index([userId, read])`, `@@index([userId, createdAt])`. Endpoints: `GET /notifications`, `GET /notifications/unread-count`, `GET /notifications/:id` (devuelve y marca leída), `PATCH /notifications/:id/read`, `PATCH /notifications/read-all` (todos guardados por `JwtAuthGuard`; cada usuario opera solo las suyas).

**Push en tiempo real por WebSocket (sin polling).** El `NotificationsGateway` (socket.io namespace `/notifications`, auth con el JWT del backend) une al usuario a su sala `user:<id>`. `NotificationsService.createMany` usa **`createManyAndReturn`** y empuja cada fila como `notification:new`; cuando se crean dentro de una transacción (aviso masivo, inscripción, asignación de docente), el llamador emite **tras el commit** con `emitNotifications(rows)`. Al abrir un chat, `emitConversationRead(userId, conversationKey)` empuja `notification:read` para que la campana marque leídas esas notificaciones al instante. La campana del frontend escucha estos eventos (ya no hace polling cada 5 s).

### `Announcement` → tabla `announcements`

Registro de cada aviso que un administrador envía (una fila por envío, con cuántas notificaciones generó). Alimenta el "historial de avisos enviados".

| Campo            | Tipo                   | Notas                                                                               |
| ---------------- | ---------------------- | ----------------------------------------------------------------------------------- |
| `id`             | `String` (uuid)        | PK                                                                                  |
| `title` / `body` | `String`               |                                                                                     |
| `audience`       | `AnnouncementAudience` | a quién se dirigió                                                                  |
| `recipientCount` | `Int`                  | nº de notificaciones creadas en el envío                                            |
| `senderId`       | `String`               | FK → `User.id` (admin emisor), relación `"AnnouncementSender"`, `onDelete: Cascade` |
| `createdAt`      | `DateTime`             |                                                                                     |

Índice: `@@index([createdAt])`. Endpoints (ADMIN): `POST /admin/notifications` (envía a la audiencia y crea el `Announcement` + las `Notification` en una transacción), `GET /admin/notifications` (historial paginado/filtrable por audiencia y texto).

## Diagrama de relaciones

```
── Marketing / landing ──────────────────────────────────────────────
ProgramCategory 1───N Program 1───N ProgramModule
                                 1───N ProgramTeacher
Partner       (independiente)
SiteSettings  (independiente — singleton, fila única "singleton")

── Identidad / RBAC ─────────────────────────────────────────────────
User (ADMIN | PROFESSOR | STUDENT)

── Academia / LMS (Course independiente de Program) ─────────────────
Course 1───N CourseModule 1───N ModuleContent (temario: TEXT|VIDEO|MATERIAL|ACTIVITY)
                          │             1───N Submission       (solo ACTIVITY)
                          │             1───N ContentProgress  (por estudiante)
                          1───N ModuleGrade
                          1───N ChatMessage   (chat docente↔estudiante, 1 a 1)
                          N───N User (PROFESSOR)  vía ModuleTeacher (co-docencia)
Course 1───N Enrollment

User (PROFESSOR) N───N CourseModule          vía ModuleTeacher
User (STUDENT)   1───N Enrollment            (inscripción a curso)
                 1───N Submission            (entregas)
                 1───N ContentProgress       (avance por contenido)
                 1───N ModuleGrade           (kárdex)
User (calificador) 1───N Submission / ModuleGrade  (gradedBy)
User (docente/estudiante) N───N (vía ChatMessage: ChatStudent / ChatTeacher / ChatSender)

── Notificaciones ───────────────────────────────────────────────────
User 1───N Notification        (recibe; push por WebSocket /notifications)
User (ADMIN) 1───N Announcement (envía — log de avisos, "AnnouncementSender")
```

## Seed (`backend/prisma/seed.ts`)

Idempotente (`upsert` por `slug`/clave única). Siembra:

- 2 categorías: Maestría (`displayOrder: 1`), Diplomado (`displayOrder: 2`).
- 3 programas (2 maestrías + 1 diplomado) conectados por `category: { connect: { slug: ... } }`, cada uno con sus `modules` y `teachers`.
- 8 instituciones aliadas (`partners`).
- 1 fila `SiteSettings` (`upsert` por id `"singleton"`) con enlaces de redes de ejemplo.
- 1 usuario ADMIN (`admin@certificate.bo`) con `phone` (campo obligatorio del modelo `User`).

Ejecutar con `pnpm --filter backend exec prisma db seed`.
