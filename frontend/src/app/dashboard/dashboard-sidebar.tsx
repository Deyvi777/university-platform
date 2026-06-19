"use client";

import { ChevronDown, ChevronLeft, ChevronRight, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  createContext,
  Suspense,
  useCallback,
  useContext,
  useState,
  useSyncExternalStore,
} from "react";
import { cn } from "@/lib/utils";
import {
  NAV_ICONS,
  sectionSlug,
  type NavItem,
  type NavSection,
} from "./nav-items";

/**
 * Navegación lateral del panel (estética "píldoras" inspirada en plataformas
 * educativas modernas, adaptada al tema claro institucional navy + ámbar).
 *
 * La navegación está **dividida en secciones con encabezado** (igual que la home
 * del panel agrupa sus tarjetas: "Usuarios", "Gestión del sitio"). "Inicio" va
 * suelto arriba, sin encabezado. La sección "Usuarios" agrupa sub-opciones
 * (Administrativos / Docentes / Estudiantes) que enlazan a `/dashboard/usuarios`
 * con distinto `?rol=`.
 *
 * Estados del sidebar:
 * - En `lg+` es una columna fija a la izquierda (`DashboardSidebar`). Puede
 *   **colapsarse a un riel de solo iconos** (`collapsed`): se ocultan los
 *   encabezados y etiquetas, quedando solo los iconos de cada item con un
 *   separador sutil entre secciones; cada icono conserva su etiqueta vía
 *   `title`/`aria-label`.
 * - **Flyout on hover/foco** (colapsado + hover): el riel se ensancha a `15rem`
 *   revelando encabezados y etiquetas vía CSS (`group-hover/flyout`).
 * - Bajo `lg` colapsa a overlay: el `SidebarTrigger` (hamburguesa) abre un panel
 *   con la navegación completa (secciones con encabezados y etiquetas).
 *
 * El estado se comparte vía contexto para coordinar componentes separados
 * (trigger en el header, sidebar y panel de perfil en el grid) sin renderizar
 * la navegación dos veces. El estado de escritorio (`collapsed` del sidebar y
 * `profileOpen` del panel derecho) se **persiste en localStorage**.
 */

type SidebarCtx = {
  /** Overlay de navegación en móvil. */
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  /** Sidebar de escritorio colapsado a riel de iconos. */
  collapsed: boolean;
  toggleCollapsed: () => void;
  /** Panel de perfil derecho visible (escritorio `xl+`). */
  profileOpen: boolean;
  toggleProfile: () => void;
};

const SidebarContext = createContext<SidebarCtx | null>(null);

export function useSidebar(): SidebarCtx {
  const ctx = useContext(SidebarContext);
  if (!ctx) {
    throw new Error("useSidebar debe usarse dentro de <SidebarProvider>");
  }
  return ctx;
}

const STORAGE_COLLAPSED = "dashboard:sidebar-collapsed";
const STORAGE_PROFILE = "dashboard:profile-open";

/**
 * Pequeño store booleano respaldado por localStorage, consumido con
 * `useSyncExternalStore`. Resuelve el *hydration mismatch* que ocurría al leer
 * localStorage en el inicializador de `useState`:
 *
 * - `getServerSnapshot()` devuelve el **default** — idéntico al HTML del SSR,
 *   así que la hidratación nunca diverge (no más warning de hidratación ni
 *   `aria-pressed`/`aria-label`/anchuras de grid distintos entre server y
 *   cliente).
 * - `getSnapshot()` lee el valor real de localStorage en el cliente. React lo
 *   usa **después** de hidratar, re-renderizando con el estado persistido. El
 *   pequeño "salto" post-hidratación lo suaviza el `transition` del grid.
 * - `subscribe()` escucha tanto el evento nativo `storage` (cambios desde
 *   *otras* pestañas) como un set de listeners propio (el evento `storage` no
 *   se dispara en la pestaña que escribe), de modo que `toggle()` notifica y
 *   re-renderiza en la misma pestaña.
 */
function createBooleanStore(key: string, fallback: boolean) {
  const listeners = new Set<() => void>();

  const emit = () => {
    for (const listener of listeners) listener();
  };

  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      // Sincroniza entre pestañas: el navegador dispara `storage` en las demás.
      const onStorage = (event: StorageEvent) => {
        if (event.key === key) listener();
      };
      window.addEventListener("storage", onStorage);
      return () => {
        listeners.delete(listener);
        window.removeEventListener("storage", onStorage);
      };
    },
    getSnapshot(): boolean {
      const raw = window.localStorage.getItem(key);
      if (raw === null) return fallback;
      return raw === "1";
    },
    getServerSnapshot(): boolean {
      return fallback;
    },
    set(next: boolean) {
      window.localStorage.setItem(key, next ? "1" : "0");
      emit();
    },
  };
}

const collapsedStore = createBooleanStore(STORAGE_COLLAPSED, false);
const profileStore = createBooleanStore(STORAGE_PROFILE, false);

/**
 * Stores del acordeón de secciones, uno por sección titulada. La clave es
 * `dashboard:nav-section:<slug>` (slug derivado del título, ver `sectionSlug`).
 * El **default es `true` (abierto)**: las secciones empiezan desplegadas, así
 * que `getServerSnapshot` devuelve `true` y la hidratación nunca diverge.
 *
 * Cacheamos por slug para no recrear el store (ni su `Set` de listeners) en cada
 * render — `useSyncExternalStore` necesita una referencia estable de `subscribe`
 * por sección.
 */
const sectionStores = new Map<string, ReturnType<typeof createBooleanStore>>();

function getSectionStore(slug: string) {
  let store = sectionStores.get(slug);
  if (!store) {
    store = createBooleanStore(`dashboard:nav-section:${slug}`, true);
    sectionStores.set(slug, store);
  }
  return store;
}

/**
 * Lee el estado abierto/cerrado persistido de una sección. Hook propio para
 * poder llamar `useSyncExternalStore` por sección sin romper las reglas de hooks
 * (se llama una vez por `SectionGroup`, que es un componente).
 */
function useSectionOpen(slug: string): { open: boolean; toggle: () => void } {
  const store = getSectionStore(slug);
  const open = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  );
  const toggle = useCallback(() => {
    store.set(!store.getSnapshot());
  }, [store]);
  return { open, toggle };
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  // Estado persistido leído vía store externo: durante la hidratación React usa
  // el `getServerSnapshot` (= defaults, igual que el SSR) y tras hidratar pasa
  // al valor real de localStorage. Sin mismatch.
  const collapsed = useSyncExternalStore(
    collapsedStore.subscribe,
    collapsedStore.getSnapshot,
    collapsedStore.getServerSnapshot,
  );
  const profileOpen = useSyncExternalStore(
    profileStore.subscribe,
    profileStore.getSnapshot,
    profileStore.getServerSnapshot,
  );

  const toggleCollapsed = useCallback(() => {
    collapsedStore.set(!collapsedStore.getSnapshot());
  }, []);

  const toggleProfile = useCallback(() => {
    profileStore.set(!profileStore.getSnapshot());
  }, []);

  return (
    <SidebarContext.Provider
      value={{
        mobileOpen,
        setMobileOpen,
        collapsed,
        toggleCollapsed,
        profileOpen,
        toggleProfile,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

/** Botón hamburguesa para la barra superior (solo móvil/tablet). */
export function SidebarTrigger() {
  const { mobileOpen, setMobileOpen } = useSidebar();
  return (
    <button
      type="button"
      onClick={() => setMobileOpen(true)}
      aria-label="Abrir menú de navegación"
      aria-expanded={mobileOpen}
      className="inline-flex size-10 items-center justify-center rounded-full border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50 lg:hidden"
    >
      <Menu className="size-5" />
    </button>
  );
}

/**
 * Separa el `href` de un item en su pathname y el `rol` del query string (si lo
 * lleva). Permite distinguir las sub-opciones de "Usuarios", que comparten
 * pathname (`/dashboard/usuarios`) y solo difieren en `?rol=`.
 */
function splitHref(href: string): { path: string; rol: string | null } {
  const [path, query = ""] = href.split("?");
  const rol = new URLSearchParams(query).get("rol");
  return { path, rol };
}

/**
 * Una píldora de navegación. En modo riel se reduce a un icono cuadrado; con
 * flyout, la etiqueta se monta siempre pero queda oculta (ancho 0) hasta que el
 * contenedor se expande por hover/foco.
 */
function NavLink({
  item,
  active,
  collapsed,
  expandOnHover,
  flyoutActive,
  railOnly,
  onNavigate,
  /** Sangría extra para sub-items dentro de una sección (no en riel). */
  nested = false,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  expandOnHover: boolean;
  flyoutActive: boolean;
  railOnly: boolean;
  onNavigate: () => void;
  nested?: boolean;
}) {
  const Icon = NAV_ICONS[item.icon];
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      // En modo riel el `title` actúa de tooltip nativo y el `aria-label` suple
      // a la etiqueta visible que ocultamos.
      title={collapsed ? item.label : undefined}
      aria-label={collapsed ? item.label : undefined}
      className={cn(
        "group flex items-center rounded-full text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50",
        railOnly && "size-11 justify-center",
        expandOnHover && "justify-center px-0 py-2.5",
        flyoutActive &&
          "group-hover/flyout:justify-start group-hover/flyout:gap-3 group-hover/flyout:px-4 group-focus-within/flyout:justify-start group-focus-within/flyout:gap-3 group-focus-within/flyout:px-4",
        !collapsed && "gap-3 px-4 py-2.5",
        // Sangría de sub-items en estado expandido (no en riel/flyout contraído).
        !collapsed && nested && "pl-7",
        flyoutActive &&
          nested &&
          "group-hover/flyout:pl-7 group-focus-within/flyout:pl-7",
        active
          ? "bg-blue-950 text-white shadow-sm"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <Icon
        className={cn(
          "size-[1.15rem] shrink-0 transition-colors",
          active
            ? "text-amber-400"
            : "text-muted-foreground/80 group-hover:text-foreground",
        )}
        aria-hidden="true"
      />
      {!collapsed && <span className="truncate">{item.label}</span>}
      {/* Flyout: la etiqueta existe siempre pero queda oculta (ancho 0) hasta
          que el contenedor se expande por hover/teclado. */}
      {expandOnHover && (
        <span
          className={cn(
            "w-0 overflow-hidden truncate opacity-0 transition-[opacity] duration-200",
            flyoutActive && [
              "group-hover/flyout:w-auto group-hover/flyout:opacity-100",
              "group-focus-within/flyout:w-auto group-focus-within/flyout:opacity-100",
            ],
          )}
        >
          {item.label}
        </span>
      )}
    </Link>
  );
}

/**
 * Una sección de la navegación. Cuando tiene `title` y el sidebar NO está en
 * "riel puro", el encabezado es un **botón de acordeón** (toggle) con chevron que
 * pliega/despliega sus items.
 *
 * Estado abierto/cerrado:
 * - Se persiste por sección vía `useSectionOpen` (store localStorage, default
 *   abierto), con el mismo patrón `useSyncExternalStore` que el resto del shell.
 * - **La sección que contiene la página activa se fuerza abierta**:
 *   `open = storedOpen || containsActive`, derivado en el render (sin `useEffect`,
 *   respetando `react-hooks/set-state-in-effect`). Así nunca se esconde el item
 *   activo aunque el usuario hubiera cerrado la sección.
 *
 * Visibilidad del colapso por estado del sidebar:
 * - **Riel puro** (colapsado sin flyout): no hay encabezados; el acordeón no
 *   aplica y los items se muestran como iconos (comportamiento previo intacto).
 * - **Flyout** (colapsado + hover): el encabezado-botón se revela por hover y
 *   refleja/togglea el estado, pero los items NO se pliegan en este modo —el riel
 *   debe seguir mostrando todos los iconos— para no chocar con la animación de
 *   ancho del flyout. El plegado se "ve" al expandir a ancho completo.
 * - **Expandido y overlay móvil**: el acordeón pliega/despliega los items con
 *   transición de altura/opacidad; cerrada, la región se marca `hidden` para que
 *   sus items no sean foco-navegables.
 */
function SectionGroup({
  section,
  index,
  collapsed,
  expandOnHover,
  flyoutActive,
  railOnly,
  isActive,
  onNavigate,
}: {
  section: NavSection;
  index: number;
  collapsed: boolean;
  expandOnHover: boolean;
  flyoutActive: boolean;
  railOnly: boolean;
  isActive: (href: string) => boolean;
  onNavigate: () => void;
}) {
  const hasHeader = Boolean(section.title);
  const slug = section.title ? sectionSlug(section.title) : "";
  // Hook siempre llamado (orden estable); para grupos sin título el resultado se
  // ignora. El slug de fallback evita una clave vacía.
  const { open: storedOpen, toggle } = useSectionOpen(slug || `group-${index}`);

  const containsActive = section.items.some((item) => isActive(item.href));
  // Estado efectivo: abierto si el usuario lo dejó abierto O si la sección aloja
  // la página actual (no escondemos el activo). Derivado en render, sin efecto.
  const open = storedOpen || containsActive;

  // El acordeón solo PLIEGA los items cuando el encabezado es interactivo y el
  // espacio lo permite: estado expandido o móvil. En riel/flyout los items se
  // mantienen visibles (ver doc del componente).
  const accordionApplies = hasHeader && !collapsed;
  const itemsHidden = accordionApplies && !open;

  const headerId = slug ? `nav-section-${slug}` : undefined;
  const regionId = slug ? `nav-section-${slug}-items` : undefined;

  const items = (
    <div className={cn("flex flex-col gap-1", railOnly && "items-center")}>
      {section.items.map((item) => (
        <NavLink
          key={item.href}
          item={item}
          active={isActive(item.href)}
          collapsed={collapsed}
          expandOnHover={expandOnHover}
          flyoutActive={flyoutActive}
          railOnly={railOnly}
          onNavigate={onNavigate}
          nested={hasHeader}
        />
      ))}
    </div>
  );

  return (
    <div
      // Separación entre grupos. En riel, un borde sutil sustituye al
      // encabezado de texto que no cabe.
      className={cn(
        index > 0 && "mt-3",
        railOnly &&
          index > 0 &&
          "mt-3 w-8 self-center border-t border-border/70 pt-3",
      )}
      role={hasHeader ? "group" : undefined}
      aria-labelledby={headerId}
    >
      {hasHeader && (
        <button
          type="button"
          id={headerId}
          onClick={toggle}
          // En riel el encabezado se oculta por completo (no hay toggle útil).
          // No interactivo cuando está oculto: evita un tab-stop invisible.
          tabIndex={railOnly ? -1 : undefined}
          aria-hidden={railOnly ? true : undefined}
          aria-expanded={open}
          aria-controls={regionId}
          className={cn(
            "group/acc flex w-full items-center justify-between rounded-lg px-4 pb-1.5 pt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground transition-colors",
            "hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50",
            // En riel se oculta del flujo; con flyout reaparece al expandir.
            collapsed && "hidden",
            expandOnHover &&
              "flex h-0 overflow-hidden px-0 pb-0 pt-0 opacity-0 transition-[height,opacity,padding] duration-200",
            flyoutActive &&
              "group-hover/flyout:h-auto group-hover/flyout:px-4 group-hover/flyout:pb-1.5 group-hover/flyout:pt-2 group-hover/flyout:opacity-100 group-focus-within/flyout:h-auto group-focus-within/flyout:px-4 group-focus-within/flyout:pb-1.5 group-focus-within/flyout:pt-2 group-focus-within/flyout:opacity-100",
          )}
        >
          <span className="truncate">{section.title}</span>
          <ChevronDown
            className={cn(
              "size-3.5 shrink-0 text-muted-foreground/70 transition-transform duration-200",
              open ? "rotate-0" : "-rotate-90",
            )}
            aria-hidden="true"
          />
        </button>
      )}

      {/* Región plegable de items. Solo se pliega (altura/opacidad) cuando el
          acordeón aplica; en riel/flyout se muestra siempre. Usamos la técnica de
          `grid-rows: 1fr/0fr` + `overflow-hidden` para animar la altura sin
          conocerla de antemano. `inert` (en vez de `hidden`) cuando está cerrada
          saca sus items del orden de tabulación SIN romper la transición de
          colapso —`hidden` haría `display:none` y mataría la animación (a11y). */}
      <div
        id={regionId}
        role={hasHeader ? "region" : undefined}
        aria-labelledby={headerId}
        inert={itemsHidden}
        className={cn(
          accordionApplies &&
            "grid transition-[grid-template-rows,opacity] duration-200 ease-out",
          accordionApplies &&
            (open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"),
        )}
      >
        {accordionApplies ? (
          <div className="overflow-hidden">{items}</div>
        ) : (
          items
        )}
      </div>
    </div>
  );
}

/**
 * Renderiza la navegación agrupada en secciones. Lee `useSearchParams()` para
 * resaltar la sub-opción activa de "Usuarios" según el `?rol=` actual — por eso
 * debe ir envuelto en `<Suspense>` (regla de Next 16; ver `SidebarNav`).
 */
function NavSections({
  sections,
  collapsed = false,
  /**
   * Cuando el sidebar está colapsado a riel pero el contenedor padre soporta el
   * "flyout on hover" (`expandOnHover`), encabezados y etiquetas se montan
   * siempre y se revelan vía CSS (`group-hover`/`group-focus-within` del
   * flyout); así el riel se ensancha temporalmente sin tocar el estado
   * persistido.
   */
  expandOnHover = false,
  /**
   * Neutraliza temporalmente el flyout: al colapsar con el cursor todavía
   * encima, el hover actual no debe re-expandir el riel. Mientras esté activo NO
   * aplicamos las clases `group-hover/flyout:`/`group-focus-within/flyout:`.
   */
  suppressHover = false,
}: {
  sections: NavSection[];
  collapsed?: boolean;
  expandOnHover?: boolean;
  suppressHover?: boolean;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { setMobileOpen } = useSidebar();
  const onNavigate = () => setMobileOpen(false);

  // Modo "riel puro" = colapsado y SIN flyout. Con flyout, dejamos crecer los
  // items a ancho completo y solo ocultamos texto vía CSS.
  const railOnly = collapsed && !expandOnHover;
  // El flyout solo reacciona al hover/foco cuando NO está suprimido.
  const flyoutActive = expandOnHover && !suppressHover;

  const currentRol = searchParams.get("rol");

  const isActive = (href: string): boolean => {
    const { path, rol } = splitHref(href);
    if (path === "/dashboard") return pathname === "/dashboard";
    // Sub-opción con `?rol=` (Usuarios): activa cuando coincide el pathname Y el
    // rol del query. Si la URL no trae `rol`, "Administrativos" hace de defecto
    // solo cuando el item lo declara explícitamente — preferimos no marcar nada
    // por defecto para evitar resaltar una opción que el usuario no eligió.
    if (rol) {
      return pathname === path && currentRol === rol;
    }
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  return (
    <nav
      className={cn("flex flex-col gap-1", railOnly && "items-center")}
      aria-label="Navegación del panel"
    >
      {sections.map((section, index) => (
        <SectionGroup
          key={section.title ?? `group-${index}`}
          section={section}
          index={index}
          collapsed={collapsed}
          expandOnHover={expandOnHover}
          flyoutActive={flyoutActive}
          railOnly={railOnly}
          isActive={isActive}
          onNavigate={onNavigate}
        />
      ))}
    </nav>
  );
}

/**
 * Envoltura con `<Suspense>` para `NavSections` — obligatoria porque consume
 * `useSearchParams()` (Next 16 falla el build de producción sin un límite de
 * Suspense). El fallback es una nav sin estado activo de query (suficiente para
 * el primer paint).
 */
function SidebarNav(props: {
  sections: NavSection[];
  collapsed?: boolean;
  expandOnHover?: boolean;
  suppressHover?: boolean;
}) {
  return (
    <Suspense fallback={<NavSectionsFallback {...props} />}>
      <NavSections {...props} />
    </Suspense>
  );
}

/**
 * Fallback de Suspense: misma estructura que `NavSections` pero sin leer
 * `useSearchParams` (resalta el activo solo por pathname). Evita un salto de
 * layout mientras se resuelve el boundary.
 */
function NavSectionsFallback({
  sections,
  collapsed = false,
  expandOnHover = false,
  suppressHover = false,
}: {
  sections: NavSection[];
  collapsed?: boolean;
  expandOnHover?: boolean;
  suppressHover?: boolean;
}) {
  const pathname = usePathname();
  const { setMobileOpen } = useSidebar();
  const railOnly = collapsed && !expandOnHover;
  const flyoutActive = expandOnHover && !suppressHover;

  const isActive = (href: string): boolean => {
    const { path, rol } = splitHref(href);
    if (path === "/dashboard") return pathname === "/dashboard";
    if (rol) return false; // sin searchParams no podemos distinguir el rol
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  const onNavigate = () => setMobileOpen(false);

  return (
    <nav
      className={cn("flex flex-col gap-1", railOnly && "items-center")}
      aria-label="Navegación del panel"
    >
      {sections.map((section, index) => (
        <SectionGroup
          key={section.title ?? `group-${index}`}
          section={section}
          index={index}
          collapsed={collapsed}
          expandOnHover={expandOnHover}
          flyoutActive={flyoutActive}
          railOnly={railOnly}
          isActive={isActive}
          onNavigate={onNavigate}
        />
      ))}
    </nav>
  );
}

/**
 * Botón circular flotante para colapsar/expandir el sidebar ("edge toggle"
 * estilo Notion). Solo escritorio. Va anclado al borde derecho del flyout
 * (`-right-3.5`) para que su borde derecho coincida siempre con el borde visible
 * del sidebar en los tres estados. `z-50` (> `z-40` del flyout) evita que quede
 * tapado por `<main>`.
 */
function CollapseToggle({
  collapsed,
  onCollapse,
}: {
  collapsed: boolean;
  /** Se invoca cuando este clic está COLAPSANDO (no al expandir). */
  onCollapse: () => void;
}) {
  const { toggleCollapsed } = useSidebar();
  const Icon = collapsed ? ChevronRight : ChevronLeft;
  return (
    <button
      type="button"
      onClick={(event) => {
        if (!collapsed) {
          onCollapse();
          if (event.detail > 0) event.currentTarget.blur();
        }
        toggleCollapsed();
      }}
      aria-label={
        collapsed ? "Expandir el menú lateral" : "Colapsar el menú lateral"
      }
      aria-pressed={collapsed}
      title={collapsed ? "Expandir" : "Colapsar"}
      className={cn(
        "absolute -right-3.5 top-6 z-50 inline-flex size-7 items-center justify-center",
        "rounded-full border bg-background text-muted-foreground shadow-md",
        "transition-colors hover:bg-muted hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60",
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden="true" />
    </button>
  );
}

/** Columna fija de escritorio + overlay móvil. Renderizar una sola vez. */
export function DashboardSidebar({ sections }: { sections: NavSection[] }) {
  const { mobileOpen, setMobileOpen, collapsed } = useSidebar();

  // Estado de UI transitorio (NO persistido): al colapsar con el cursor encima,
  // suprimimos el flyout-on-hover para que el riel se vea angosto de inmediato.
  // Se inicializa en `false` (coincide SSR/cliente → sin hydration mismatch) y
  // se limpia cuando el cursor/foco realmente salen del aside.
  const [suppressHover, setSuppressHover] = useState(false);

  return (
    <>
      {/*
        Sidebar fijo en escritorio.
        - Expandido: columna en flujo normal (`15rem`), contenido `sticky`.
        - Colapsado: la columna se mantiene como riel angosto (`4.5rem`), pero el
          contenido se convierte en un *flyout* `absolute` que, al hover/foco,
          se ensancha a `15rem` SOBRE el contenido central sin reflowar `<main>`.
      */}
      <aside
        className="hidden lg:block"
        // El cursor sale del sidebar → re-habilita el flyout para el próximo
        // hover real. Manejado por evento (no `useEffect`), conforme a la regla
        // `react-hooks/set-state-in-effect`.
        onMouseLeave={() => {
          if (suppressHover) setSuppressHover(false);
        }}
        onBlur={(event) => {
          if (
            suppressHover &&
            !event.currentTarget.contains(event.relatedTarget)
          ) {
            setSuppressHover(false);
          }
        }}
      >
        {/* Contenedor `sticky`: mantiene el sidebar a la vista al hacer scroll.
            `z-50` eleva todo el subárbol del sidebar por encima del centro para
            que el flyout en hover quede siempre encima de `<main>`. */}
        <div className="sticky top-22 z-50">
          {/* Flyout = contenedor `relative` que ancla el `CollapseToggle` a su
              borde derecho. `overflow-visible` para no recortar el botón
              (`-right-3.5`). Colapsado: superficie sólida de ancho de riel
              (`w-18`) que se expande a `w-60` por hover/foco, animando el ancho
              —de modo que el botón anclado se desliza junto con la expansión. */}
          <div
            className={cn(
              "relative flex flex-col gap-3 overflow-visible",
              collapsed && [
                "group/flyout z-40 w-18 rounded-2xl border bg-background p-2 shadow-sm",
                "transition-[width,box-shadow] duration-200 ease-out",
              ],
              collapsed &&
                !suppressHover && [
                  "hover:w-60 hover:shadow-xl focus-within:w-60 focus-within:shadow-xl",
                ],
            )}
          >
            <CollapseToggle
              collapsed={collapsed}
              onCollapse={() => setSuppressHover(true)}
            />
            <SidebarNav
              sections={sections}
              collapsed={collapsed}
              expandOnHover={collapsed}
              suppressHover={suppressHover}
            />
          </div>
        </div>
      </aside>

      {/* Overlay móvil — siempre con secciones completas y etiquetas (sin riel). */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Cerrar menú de navegación"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-foreground/30 backdrop-blur-sm"
          />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[80%] flex-col gap-4 overflow-y-auto border-r bg-background p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="font-heading text-sm font-semibold tracking-tight">
                Certificate<span className="text-amber-500"> · Panel</span>
              </span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Cerrar menú de navegación"
                className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50"
              >
                <X className="size-5" />
              </button>
            </div>
            <SidebarNav sections={sections} />
          </div>
        </div>
      )}
    </>
  );
}
