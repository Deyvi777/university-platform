# UI/UX Designer — Memory Index

- [Base UI Dialog primitive](project_base-ui-dialog.md) — src/components/ui/dialog.tsx generic modal (Base UI, not Radix); content-type picker modal

- [Aula / classroom player](project_aula-classroom.md) — /dashboard/aula/[moduleId]: 2-col LMS player, client lesson switching, progress/notes actions
- [LessonVideo component](project_lesson-video.md) — custom navy poster + click-to-load YouTube/Vimeo iframe, hides external branding
- [Mis programas (estudiante)](project_mis-programas.md) — navy <details> accordion per enrolled program; modules → aula; CourseCard href branches by role
- [Teacher topic-nested content](project_teacher-topic-nested-content.md) — materials/activities now nested under each topic; TopicMaterials/TopicActivities subcomponents

- [Dashboard shell 3-zone layout](project_dashboard-shell-layout.md) — sidebar + content + profile panel structure & components
- [Dashboard persisted UI state](project_dashboard-persisted-ui-state.md) — localStorage prefs via useSyncExternalStore (no hydration mismatch)
- [Sidebar flyout suppress on collapse](project_dashboard-sidebar-flyout-suppress.md) — transient suppressHover flag so minimize collapses rail instantly; reset on mouseleave/blur
- [Dashboard nav sections](project_dashboard-nav-sections.md) — sidebar grouped into NavSection[] w/ headers; Usuarios sub-items active by ?rol=; administrativos read-only filter
- [Sidebar section accordion](project_dashboard-sidebar-accordion.md) — collapsible nav sections; per-section localStorage open state (default open), active section forced open derived in render
- [Sidebar program tree](project_sidebar-program-tree.md) — PROFESSOR/STUDENT 2-level Programas→módulos disclosure tree; per-program localStorage; module href branches by role; rail shows tooltip icon
- [Cursos detalle: asignación](project_cursos-detalle-asignacion.md) — initials avatars (tintFor by id), teacher/student chips, amber primary buttons, expandable checkbox panels
- [Admin DeleteButton modal](project_admin-delete-button.md) — shared destructive-delete AlertDialog used by all 5 admin sections; props action/confirmMessage/title?
- [Dashboard dark mode](project_dashboard-dark-mode.md) — navy default dark mode; next-themes ThemeProvider, navy .dark oklch palette, sliding pill toggle, dark: variants for tinted surfaces
- [Dashboard concave join](project_dashboard-concave-join.md) — OBSOLETE/tombstone: concave ConcaveJoins removed from code; straight navy edge now
- [Sidebar brand + active pill](project_sidebar-brand-active-pill.md) — current: white logo.webp on FLAT navy (light blue-900/dark slate-950); active = translucent pill + white icon badge; fixed rail w/ Base UI tooltips (no flyout widening); topbar brand "Plataforma · Virtual"
