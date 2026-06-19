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

Usado por `User.role` y por el decorador `@Roles(...)` de `RolesGuard` para proteger endpoints `/admin/...`. El admin ya puede **crear y gestionar cuentas de PROFESSOR y STUDENT** vía `/admin/users` (módulo `backend/src/users/`, ver `User`). Los modelos académicos de la capa **Academia / LMS** (cursos, módulos, kárdex, etc.) ya existen en el esquema, pero sus controladores/endpoints (los que usarán PROFESSOR y STUDENT) aún están por implementar.

### Enums de la capa académica (LMS)

| Enum                | Valores                                          | Usado en              |
| ------------------- | ------------------------------------------------ | --------------------- |
| `CourseStatus`      | `DRAFT \| ACTIVE \| FINISHED \| ARCHIVED`        | `Course.status`       |
| `ModuleStatus`      | `DRAFT \| ACTIVE \| FINISHED`                    | `CourseModule.status` |
| `EnrollmentStatus`  | `ACTIVE \| WITHDRAWN \| GRADUATED`               | `Enrollment.status`   |
| `ActivityType`      | `ASSIGNMENT \| QUIZ \| EXAM \| PROJECT \| FORUM` | `Activity.type`       |
| `SubmissionStatus`  | `PENDING \| SUBMITTED \| LATE \| GRADED`         | `Submission.status`   |
| `MaterialType`      | `FILE \| LINK \| VIDEO`                          | `Material.type`       |
| `ModuleGradeStatus` | `IN_PROGRESS \| PASSED \| FAILED`                | `ModuleGrade.status`  |

## Modelos

### `User` → tabla `users`

| Campo                     | Tipo            | Notas                                 |
| ------------------------- | --------------- | ------------------------------------- |
| `id`                      | `String` (uuid) | PK                                    |
| `email`                   | `String`        | `@unique`                             |
| `password`                | `String`        | hash argon2 (ver `backend/src/auth/`) |
| `firstName` / `lastName`  | `String`        |                                       |
| `role`                    | `Role`          | default `STUDENT`                     |
| `isActive`                | `Boolean`       | default `true`                        |
| `createdAt` / `updatedAt` | `DateTime`      |                                       |

Fuente de verdad de identidad y RBAC; NextAuth no gestiona usuarios (ver CLAUDE.md, "Auth flow"). `isActive=false` invalida al usuario en autenticación: `AuthService.login` rechaza el ingreso y `JwtStrategy.validate` hace que **todo token ya emitido** devuelva **401**. En el frontend ese 401 (igual que un token vencido o una DB reseedeada) ya no rompe el panel: se enruta a `/api/auth/session-expired`, que cierra la sesión muerta de NextAuth y manda a `/login?expired=1` (ver `frontend/AGENTS.md`).

**Gestión admin** (`backend/src/users/`, módulo solo-admin sin controlador público): `/admin/users` (guardado `@Roles(ADMIN)`) con `findAll(?role=PROFESSOR|STUDENT)`/`findOne`/`create`/`update`/`remove`. El formulario del panel **solo emite cuentas PROFESSOR o STUDENT** (el `role` del DTO Zod excluye `ADMIN` → `400`; correo duplicado → `409`). La contraseña se hashea con argon2 y **ninguna respuesta incluye el hash** (`safeSelect`). UI en `frontend/src/app/dashboard/usuarios/`.

Relaciones académicas (todas opcionales, dependen del rol): `taughtModules` (`CourseModule[]`, módulos que dicta como docente — relación `"ModuleTeacher"`), `enrollments` (`Enrollment[]`, cursos en que está inscrito como estudiante), `submissions` (`Submission[]`, sus entregas), `gradedSubmissions` (`Submission[]` que calificó — relación `"SubmissionGrader"`), `moduleGrades` (`ModuleGrade[]`, su kárdex — relación `"StudentGrades"`), `gradedModules` (`ModuleGrade[]` que calificó — relación `"ModuleGrader"`). Un mismo `User` con rol PROFESSOR/STUDENT cuelga de estas relaciones.

### `ProgramCategory` → tabla `program_categories`

| Campo                     | Tipo            | Notas                                                                      |
| ------------------------- | --------------- | -------------------------------------------------------------------------- |
| `id`                      | `String` (uuid) | PK                                                                         |
| `name`                    | `String`        | ej. "Maestría", "Diplomado"                                                |
| `slug`                    | `String`        | `@unique`, auto-generado desde `name` vía `slugify` con reintento numérico |
| `displayOrder`            | `Int`           | default `0`; ordena tabs en landing y filas en admin                       |
| `isActive`                | `Boolean`       | default `true`; solo categorías activas se exponen en `GET /categories`    |
| `createdAt` / `updatedAt` | `DateTime`      |                                                                            |
| `programs`                | `Program[]`     | relación inversa 1:N                                                       |

Gestión completa vía `/admin/categories` (CRUD). Borrar una categoría con `programs.count > 0` devuelve `409 Conflict`. Reemplaza el antiguo enum fijo `ProgramCategory` (MAESTRIA/DIPLOMADO) — esos dos valores siguen existiendo como filas semilla (`slug: maestria`, `slug: diplomado`) pero ahora son datos, no tipos.

### `Program` → tabla `programs`

| Campo                     | Tipo               | Notas                                                                       |
| ------------------------- | ------------------ | --------------------------------------------------------------------------- |
| `id`                      | `String` (uuid)    | PK                                                                          |
| `slug`                    | `String`           | `@unique`, auto-generado desde `title` vía `slugify` con reintento numérico |
| `title`                   | `String`           |                                                                             |
| `categoryId`              | `String`           | FK → `ProgramCategory.id`                                                   |
| `category`                | `ProgramCategory`  | relación N:1                                                                |
| `flyerUrl`                | `String`           | path de imagen (ver convenciones)                                           |
| `objective`               | `String`           | objetivo del programa                                                       |
| `targetAudience`          | `String`           | "dirigido a"                                                                |
| `modality`                | `String`           | ej. "Virtual con clases en vivo"                                            |
| `startDate`               | `DateTime`         | inicio de clases (UTC)                                                      |
| `duration`                | `String`           | ej. "18 meses (4 semestres)"                                                |
| `schedule`                | `String`           | ej. "Viernes 19:00–22:00 y sábados 09:00–12:00"                             |
| `requirements`            | `String[]`         | lista de requisitos                                                         |
| `enrollmentFee`           | `Decimal(10,2)`    | matrícula                                                                   |
| `totalCost`               | `Decimal(10,2)`    | inversión total                                                             |
| `currency`                | `String`           | default `"Bs"`                                                              |
| `paymentFacilities`       | `String?`          | texto libre, facilidades de pago                                            |
| `isPublished`             | `Boolean`          | default `true`; solo publicados se exponen públicamente                     |
| `createdAt` / `updatedAt` | `DateTime`         |                                                                             |
| `modules`                 | `ProgramModule[]`  | relación 1:N, `onDelete: Cascade`                                           |
| `teachers`                | `ProgramTeacher[]` | relación 1:N, `onDelete: Cascade`                                           |

Índice: `@@index([categoryId, isPublished])`.

Endpoints públicos: `GET /programs` (filtrable por `?category=<slug>`), `GET /programs/:slug`. Admin: `/admin/programs` (CRUD; `modules`/`teachers` se reemplazan completos en cada `update` dentro de una transacción).

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

| Campo                     | Tipo            | Notas                                                      |
| ------------------------- | --------------- | ---------------------------------------------------------- |
| `id`                      | `String` (uuid) | PK                                                         |
| `name`                    | `String`        | nombre de la institución aliada                            |
| `logoUrl`                 | `String`        | `@unique`, path de imagen (ej. `/landing/partners/2.webp`) |
| `displayOrder`            | `Int`           | default `0`                                                |
| `isPublished`             | `Boolean`       | default `true`                                             |
| `createdAt` / `updatedAt` | `DateTime`      |                                                            |

Índice: `@@index([isPublished, displayOrder])`. Endpoints públicos: `GET /partners` (solo publicados, ordenados). Admin: `/admin/partners` (CRUD).

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
- Flujos por rol: **ADMIN** crea cursos/módulos, asigna docentes (`CourseModule.teacherId`) e inscribe estudiantes; **PROFESSOR** crea temas/materiales/actividades dentro de sus módulos y califica entregas; **STUDENT** consume temas/materiales y entrega actividades.

Las rutas de archivos (`Material.url`, `Submission.fileUrl`) siguen la misma convención que el resto: paths relativos `/files/...` del módulo `storage`, nunca URLs absolutas.

### `Course` → tabla `courses`

| Campo                     | Tipo             | Notas                                              |
| ------------------------- | ---------------- | -------------------------------------------------- |
| `id`                      | `String` (uuid)  | PK                                                 |
| `code`                    | `String`         | `@unique`, código institucional (ej. `MBA-2026-I`) |
| `name`                    | `String`         |                                                    |
| `description`             | `String?`        |                                                    |
| `modality`                | `String?`        | ej. "Virtual con clases en vivo"                   |
| `startDate` / `endDate`   | `DateTime?`      |                                                    |
| `passingScore`            | `Decimal(5,2)`   | default `70`; nota mínima de aprobación            |
| `status`                  | `CourseStatus`   | default `DRAFT`                                    |
| `createdAt` / `updatedAt` | `DateTime`       |                                                    |
| `modules`                 | `CourseModule[]` | 1:N, `onDelete: Cascade`                           |
| `enrollments`             | `Enrollment[]`   | 1:N, `onDelete: Cascade`                           |

Índice: `@@index([status])`.

### `CourseModule` → tabla `course_modules`

Módulo académico dentro de un curso, dictado por un docente.

| Campo                                            | Tipo            | Notas                                                               |
| ------------------------------------------------ | --------------- | ------------------------------------------------------------------- |
| `id`                                             | `String` (uuid) | PK                                                                  |
| `courseId`                                       | `String`        | FK → `Course.id`, `onDelete: Cascade`                               |
| `teacherId`                                      | `String?`       | FK → `User.id` (docente), `onDelete: SetNull`; `null` hasta asignar |
| `order`                                          | `Int`           | posición en la malla                                                |
| `name`                                           | `String`        |                                                                     |
| `description`                                    | `String?`       |                                                                     |
| `credits`                                        | `Int?`          |                                                                     |
| `startDate` / `endDate`                          | `DateTime?`     |                                                                     |
| `status`                                         | `ModuleStatus`  | default `DRAFT`                                                     |
| `createdAt` / `updatedAt`                        | `DateTime`      |                                                                     |
| `topics` / `materials` / `activities` / `grades` | relaciones      | 1:N                                                                 |

Índices: `@@unique([courseId, order])`, `@@index([teacherId])`. Un solo docente por módulo (extensible a join table si se requiere co-docencia).

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

### `Topic` → tabla `topics`

Tema dentro de un módulo, creado por el docente.

| Campo                      | Tipo            | Notas                                       |
| -------------------------- | --------------- | ------------------------------------------- |
| `id`                       | `String` (uuid) | PK                                          |
| `moduleId`                 | `String`        | FK → `CourseModule.id`, `onDelete: Cascade` |
| `order`                    | `Int`           |                                             |
| `title`                    | `String`        |                                             |
| `description`              | `String?`       |                                             |
| `content`                  | `String?`       | contenido enriquecido (HTML/markdown)       |
| `isPublished`              | `Boolean`       | default `false`                             |
| `createdAt` / `updatedAt`  | `DateTime`      |                                             |
| `materials` / `activities` | relaciones      | 1:N                                         |

Índice: `@@unique([moduleId, order])`.

### `Material` → tabla `materials`

Material de apoyo de un módulo (opcionalmente ligado a un tema).

| Campo                     | Tipo            | Notas                                       |
| ------------------------- | --------------- | ------------------------------------------- |
| `id`                      | `String` (uuid) | PK                                          |
| `moduleId`                | `String`        | FK → `CourseModule.id`, `onDelete: Cascade` |
| `topicId`                 | `String?`       | FK → `Topic.id`, `onDelete: SetNull`        |
| `title`                   | `String`        |                                             |
| `type`                    | `MaterialType`  | default `FILE`                              |
| `url`                     | `String`        | ruta `/files/...` (subida) o enlace externo |
| `createdAt` / `updatedAt` | `DateTime`      |                                             |

Índices: `@@index([moduleId])`, `@@index([topicId])`.

### `Activity` → tabla `activities`

Actividad evaluable de un módulo (tarea, examen, etc.), creada por el docente.

| Campo                     | Tipo            | Notas                                       |
| ------------------------- | --------------- | ------------------------------------------- |
| `id`                      | `String` (uuid) | PK                                          |
| `moduleId`                | `String`        | FK → `CourseModule.id`, `onDelete: Cascade` |
| `topicId`                 | `String?`       | FK → `Topic.id`, `onDelete: SetNull`        |
| `type`                    | `ActivityType`  | default `ASSIGNMENT`                        |
| `title`                   | `String`        |                                             |
| `instructions`            | `String?`       |                                             |
| `dueDate`                 | `DateTime?`     |                                             |
| `maxScore`                | `Decimal(5,2)`  | default `100`                               |
| `weight`                  | `Decimal(5,2)`  | default `0`; peso (%) en la nota del módulo |
| `isPublished`             | `Boolean`       | default `false`                             |
| `createdAt` / `updatedAt` | `DateTime`      |                                             |
| `submissions`             | `Submission[]`  | 1:N                                         |

Índices: `@@index([moduleId])`, `@@index([topicId])`.

### `Submission` → tabla `submissions`

Entrega de un estudiante para una actividad; calificada por el docente.

| Campo                     | Tipo               | Notas                                                     |
| ------------------------- | ------------------ | --------------------------------------------------------- |
| `id`                      | `String` (uuid)    | PK                                                        |
| `activityId`              | `String`           | FK → `Activity.id`, `onDelete: Cascade`                   |
| `studentId`               | `String`           | FK → `User.id`, `onDelete: Cascade`                       |
| `content`                 | `String?`          | texto de la entrega                                       |
| `fileUrl`                 | `String?`          | adjunto, ruta `/files/...`                                |
| `status`                  | `SubmissionStatus` | default `PENDING`                                         |
| `score`                   | `Decimal(5,2)?`    |                                                           |
| `feedback`                | `String?`          |                                                           |
| `submittedAt`             | `DateTime?`        |                                                           |
| `gradedById`              | `String?`          | FK → `User.id` (docente calificador), `onDelete: SetNull` |
| `gradedAt`                | `DateTime?`        |                                                           |
| `createdAt` / `updatedAt` | `DateTime`         |                                                           |

Índices: `@@unique([activityId, studentId])` (una entrega por estudiante/actividad), `@@index([studentId])`.

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
Course 1───N CourseModule 1───N Topic
                          1───N Material   (Material/Activity opcional → Topic)
                          1───N Activity 1───N Submission
                          1───N ModuleGrade
Course 1───N Enrollment

User (PROFESSOR) 1───N CourseModule          (teacher)
User (STUDENT)   1───N Enrollment            (inscripción a curso)
                 1───N Submission            (entregas)
                 1───N ModuleGrade           (kárdex)
User (calificador) 1───N Submission / ModuleGrade  (gradedBy)
```

## Seed (`backend/prisma/seed.ts`)

Idempotente (`upsert` por `slug`/clave única). Siembra:

- 2 categorías: Maestría (`displayOrder: 1`), Diplomado (`displayOrder: 2`).
- 3 programas (2 maestrías + 1 diplomado) conectados por `category: { connect: { slug: ... } }`, cada uno con sus `modules` y `teachers`.
- 8 instituciones aliadas (`partners`).
- 1 fila `SiteSettings` (`upsert` por id `"singleton"`) con enlaces de redes de ejemplo.

Ejecutar con `pnpm --filter backend exec prisma db seed`.
