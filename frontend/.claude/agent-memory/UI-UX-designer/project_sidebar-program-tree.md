---
name: sidebar-program-tree
description: Sidebar 2-level program→module tree for PROFESSOR/STUDENT in dashboard-sidebar.tsx — disclosure tree, per-program localStorage, role-branched module hrefs
metadata:
  type: project
---

El sidebar interno (`src/app/dashboard/dashboard-sidebar.tsx`) muestra para **PROFESSOR y STUDENT** un árbol anidado de 2 niveles "Programas" → programa (toggle) → módulos (enlaces). NO vive en el modelo plano `NavSection`: es un bloque propio (`ProgramTree` + `ProgramRow`) renderizado por el sidebar. ADMIN no lo ve.

**Datos (Server → Client):** `layout.tsx` (server) llama `listMyCourses()` solo si role es PROFESSOR/STUDENT, mapea a `SidebarProgram[]` (`{ id, name, modules: {id,name,order}[] }`, tipo en `nav-items.ts`) usando `course.modules ?? course.myModules ?? []` (STUDENT trae `modules`, PROFESSOR `myModules` = solo los que dicta), ordenado por `order`. Se pasa como prop `programs` a `DashboardSidebar` junto con `moduleHrefBase` (`/dashboard/aula` para STUDENT, `/dashboard/modulos` para PROFESSOR). Todo plano/serializable (sin funciones).

**Inserción posicional:** `navSectionsForRole` para PROFESSOR/STUDENT devuelve **dos** grupos sin título (`[{HOME}]` y `[resto]`); `NavSections`/`NavSectionsFallback` reciben prop `programTree?: ReactNode` y lo renderizan tras la sección `index === 0` (entre "Inicio" y Kárdex/Notificaciones), envolviendo cada sección en `<Fragment>`. Se eliminó el item plano "Programas" (`PROGRAMS_ITEM`) que tenía STUDENT.

**Estado (mismo patrón `createBooleanStore` + `useSyncExternalStore` del shell, ver [[dashboard-persisted-ui-state]] / [[dashboard-sidebar-accordion]]):**

- Encabezado "Programas": `dashboard:nav-programs`, default **`true`** (abierto). Hook `useProgramsHeaderOpen()`.
- Por programa: `dashboard:nav-program:<id>` (cache `Map` `getProgramStore`). Hook `useProgramOpen(id, autoOpen)` — **toggle autoritativo**: lee el estado CRUDO (`getRawSnapshot()` → `true`/`false`/`null`); `open = raw === null ? autoOpen : raw`; `toggle` persiste `!visible` (el opuesto de lo que se ve, NO del crudo). `autoOpen = programActive || containsActive` es solo el DEFAULT cuando el usuario aún no tocó el chevron; su elección manda y persiste (1er clic en un programa activo → escribe `"0"` y lo cierra). `createBooleanStore` ganó `getRawSnapshot()`/`getRawServerSnapshot()` (retrocompat: los demás stores siguen usando `getSnapshot`/`getServerSnapshot`). Módulo activo = `pathname === ${moduleHrefBase}/${id}`, píldora `bg-white/15 ring-white/15`.
- **Bug histórico (corregido):** antes `effectiveOpen = open || containsActive || programActive` forzaba abierto el programa activo, así el chevron parecía muerto (no podía colapsar el que estabas viendo, el caso común). Fix = el toggle autoritativo de arriba.

**Fila de programa = enlace + chevron aparte (NO un solo botón-toggle):** el **nombre del programa es un `<Link>`** (flex-1, lleva `headerId`/`aria-current`) a `/dashboard/mis-cursos/<programId>` (vista detalle: cabecera + módulos, sirve STUDENT y PROFESSOR, backend autoriza). A su derecha, un **botón chevron separado** (`size-6`, `aria-label` Mostrar/Ocultar módulos de <nombre>, `aria-expanded`+`aria-controls`) togglea el submenú sin navegar. Wrapper `div.group/prog` lleva la píldora activa (`bg-white/15 ring-white/15`) cuando `pathname === programHref`. NO se anida button en link ni viceversa.

**Riel colapsado (escritorio):** `ProgramTree` recibe `railOnly` (= `collapsed` en escritorio; el riel es `w-18` fijo, no se ensancha — ver [[sidebar-brand-active-pill]]). En `railOnly` solo muestra el icono `GraduationCap` con `Tooltip` Base UI (`side=right`) que enlaza a `/dashboard/mis-programas`. Árbol completo solo en expandido y overlay móvil (`railOnly=false`).

**UX/a11y:** encabezado "Programas" = toggle acordeón + enlace sutil "Ver todos" → `/dashboard/mis-programas`. Toggles con `aria-expanded`/`aria-controls`; región `role="region"`; plegado con `grid-rows-[1fr]/[0fr]` + `inert` cuando cerrado. Módulos sangrados con borde-L (`border-l border-white/10 ml-4 pl-2`). Vacío: `<p>` "Sin programas asignados" bajo el encabezado.

Relacionado: [[mis-programas]] (vista completa), [[aula-classroom]], [[teacher-topic-nested-content]].
