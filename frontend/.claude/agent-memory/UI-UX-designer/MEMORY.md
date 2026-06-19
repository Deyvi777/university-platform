# UI/UX Designer — Memory Index

- [Dashboard shell 3-zone layout](project_dashboard-shell-layout.md) — sidebar + content + profile panel structure & components
- [Dashboard persisted UI state](project_dashboard-persisted-ui-state.md) — localStorage prefs via useSyncExternalStore (no hydration mismatch)
- [Sidebar flyout suppress on collapse](project_dashboard-sidebar-flyout-suppress.md) — transient suppressHover flag so minimize collapses rail instantly; reset on mouseleave/blur
- [Dashboard nav sections](project_dashboard-nav-sections.md) — sidebar grouped into NavSection[] w/ headers; Usuarios sub-items active by ?rol=; administrativos read-only filter
- [Sidebar section accordion](project_dashboard-sidebar-accordion.md) — collapsible nav sections; per-section localStorage open state (default open), active section forced open derived in render
