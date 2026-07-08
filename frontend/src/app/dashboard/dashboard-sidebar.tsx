"use client";

import {
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  createContext,
  Fragment,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  NAV_ICONS,
  sectionSlug,
  type NavItem,
  type NavSection,
  type SidebarProgram,
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
    /**
     * Estado CRUDO sin colapsar a `fallback`: `true`/`false` si el usuario ya
     * eligió, `null` si nunca tocó esta clave. Permite distinguir "no seteado"
     * de "seteado" para que un default dinámico (p. ej. el auto-abierto del
     * programa activo) solo aplique mientras el usuario no haya decidido.
     */
    getRawSnapshot(): boolean | null {
      const raw = window.localStorage.getItem(key);
      if (raw === null) return null;
      return raw === "1";
    },
    /** En SSR/hidratación inicial nada está seteado → `null`, sin mismatch. */
    getRawServerSnapshot(): null {
      return null;
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

/**
 * Stores del árbol de "Programas". Reusan exactamente el mismo patrón
 * `createBooleanStore` + `useSyncExternalStore` que el resto del shell, así que
 * el estado abierto/cerrado persiste en localStorage y la hidratación nunca
 * diverge (`getServerSnapshot` = default).
 *
 * - El encabezado "Programas" usa `dashboard:nav-programs` con default
 *   **`true`** (abierto): el árbol arranca desplegado.
 * - Cada programa usa `dashboard:nav-program:<id>` con default **`true`**
 *   (abierto): al entrar al panel, los módulos de cada programa se ven de
 *   inmediato; el usuario puede colapsar el que no le interese y su elección
 *   persiste (toggle como autoridad, ver `useProgramOpen`).
 *
 * Cacheamos los stores por clave (igual que las secciones) para no recrear el
 * `Set` de listeners en cada render — `useSyncExternalStore` necesita una
 * referencia estable de `subscribe`.
 */
const STORAGE_PROGRAMS = "dashboard:nav-programs";
const programsHeaderStore = createBooleanStore(STORAGE_PROGRAMS, true);

const programStores = new Map<string, ReturnType<typeof createBooleanStore>>();

function getProgramStore(id: string) {
  let store = programStores.get(id);
  if (!store) {
    store = createBooleanStore(`dashboard:nav-program:${id}`, true);
    programStores.set(id, store);
  }
  return store;
}

/**
 * Estado abierto/cerrado de un programa del árbol, con el **toggle como
 * autoridad**.
 *
 * - `autoOpen` es el valor por defecto cuando el usuario **aún no ha tocado**
 *   este programa (p. ej. el programa que estás viendo arranca abierto). En
 *   cuanto el usuario usa el chevron, su elección persiste y manda sobre el
 *   auto-abierto.
 * - Leemos el estado CRUDO (`raw`: `true`/`false`/`null`): `null` = no seteado →
 *   se usa `autoOpen`; si está seteado, gana el valor del usuario. Así el primer
 *   clic sobre un programa auto-abierto lo **cierra** (persiste `"0"`) y se
 *   respeta en recargas.
 * - En SSR/hidratación inicial `raw` es `null` (`getRawServerSnapshot`), así que
 *   `open = autoOpen` en server y cliente → sin mismatch; React pasa al valor
 *   real tras hidratar (patrón estándar de `useSyncExternalStore`).
 * - El `toggle` persiste el opuesto del estado **visible** (`!open`), no del
 *   crudo, para que el botón sea fiable incluso cuando `raw === null`.
 */
function useProgramOpen(
  id: string,
  autoOpen: boolean,
): { open: boolean; toggle: () => void } {
  const store = getProgramStore(id);
  const raw = useSyncExternalStore(
    store.subscribe,
    store.getRawSnapshot,
    store.getRawServerSnapshot,
  );
  const open = raw === null ? autoOpen : raw;
  const toggle = useCallback(() => {
    const current = store.getRawSnapshot();
    const visible = current === null ? autoOpen : current;
    store.set(!visible);
  }, [store, autoOpen]);
  return { open, toggle };
}

/** Estado abierto/cerrado persistido del encabezado "Programas". */
function useProgramsHeaderOpen(): { open: boolean; toggle: () => void } {
  const open = useSyncExternalStore(
    programsHeaderStore.subscribe,
    programsHeaderStore.getSnapshot,
    programsHeaderStore.getServerSnapshot,
  );
  const toggle = useCallback(() => {
    programsHeaderStore.set(!programsHeaderStore.getSnapshot());
  }, []);
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

  // Trampa de historial: con el sidebar abierto como overlay móvil, el botón
  // "atrás" del navegador debe CERRARLO, no salir de la página. Al abrir
  // empujamos una entrada de historial; el `popstate` (atrás) la consume y
  // cierra el overlay. `mobileOpen` solo es true bajo `lg` (el trigger únicamente
  // existe ahí), así que no hace falta condicionar por breakpoint.
  useEffect(() => {
    if (!mobileOpen) return;

    window.history.pushState({ sidebarDrawer: true }, "");
    const onPopState = () => setMobileOpen(false);
    window.addEventListener("popstate", onPopState);

    return () => {
      window.removeEventListener("popstate", onPopState);
      // Si se cerró por navegación/backdrop (no por "atrás"), nuestra entrada
      // sigue siendo la actual: la retiramos para no dejarla colgada.
      if (window.history.state?.sidebarDrawer) {
        window.history.back();
      }
    };
  }, [mobileOpen]);

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
  const link = (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      // En riel, el nombre de la opción se muestra en un Tooltip al pasar el
      // mouse sobre el icono (ver abajo); el `aria-label` suple a la etiqueta
      // visible que ocultamos.
      aria-label={collapsed ? item.label : undefined}
      className={cn(
        "group flex items-center rounded-full text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50",
        // Riel: caja cuadrada que solo aloja el badge circular del icono.
        railOnly && "size-11 justify-center",
        // Padding asimétrico: poco a la izquierda (el badge ya da aire) y más a
        // la derecha, para que la píldora activa respire como en la referencia.
        expandOnHover && "justify-center py-1 pl-1 pr-1",
        flyoutActive &&
          "group-hover/flyout:justify-start group-hover/flyout:gap-3 group-hover/flyout:pl-1 group-hover/flyout:pr-4 group-focus-within/flyout:justify-start group-focus-within/flyout:gap-3 group-focus-within/flyout:pl-1 group-focus-within/flyout:pr-4",
        !collapsed && "gap-3 py-1 pl-1 pr-4",
        // Sangría de sub-items en estado expandido (no en riel/flyout contraído).
        !collapsed && nested && "pl-2",
        flyoutActive &&
          nested &&
          "group-hover/flyout:pl-2 group-focus-within/flyout:pl-2",
        // Sidebar es navy SIEMPRE (mockup de referencia). Activo = píldora
        // rounded-full azul-clara translúcida con BADGE circular del icono y
        // etiqueta en blanco. Inactivo = sin fondo, texto claro atenuado sobre
        // navy con hover translúcido sutil.
        active
          ? "bg-white/15 text-white shadow-sm ring-1 ring-white/15"
          : "text-sidebar-foreground/90 hover:bg-white/[0.07] hover:text-sidebar-foreground",
      )}
    >
      {/* Badge del icono. Activo = círculo blanco con el icono en azul de marca
          (el detalle clave de la referencia). Inactivo = icono de línea claro,
          sin fondo. El tamaño fijo del badge mantiene alineados los iconos entre
          items activos e inactivos. */}
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-full transition-colors",
          active && "bg-white shadow-sm shadow-blue-950/20",
        )}
        aria-hidden="true"
      >
        <Icon
          className={cn(
            "size-[1.15rem] shrink-0 transition-colors",
            active
              ? // Badge blanco en ambos temas: en claro el icono es azul de marca
                // (`text-primary`); en oscuro `--primary` es casi blanco y se
                // perdería, así que se fuerza un navy oscuro para que contraste.
                "text-primary dark:text-blue-950"
              : "text-sidebar-foreground/90 group-hover:text-sidebar-foreground",
          )}
          aria-hidden="true"
        />
      </span>
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

  // En riel minimizado, el hover sobre el icono muestra el nombre de la opción
  // en un tooltip (a la derecha). Base UI lo portala al `body`, así que no lo
  // recorta el scroll del riel. En estado expandido la etiqueta ya es visible.
  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger render={link} />
        <TooltipContent side="right" sideOffset={10}>
          {item.label}
        </TooltipContent>
      </Tooltip>
    );
  }
  return link;
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
    <div className={cn("flex flex-col gap-1.5", railOnly && "items-center gap-2")}>
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
          "mt-3 w-8 self-center border-t border-white/15 pt-3",
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
            "group/acc flex w-full items-center justify-between rounded-lg px-3 pb-1.5 pt-1 text-xs font-semibold uppercase tracking-wide text-sidebar-foreground/75 transition-colors",
            "hover:text-sidebar-foreground/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50",
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
              "size-3.5 shrink-0 text-sidebar-foreground/70 transition-transform duration-200",
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
 * Una fila de programa dentro del árbol. Cuando el programa tiene módulos, la
 * fila entera es un **botón toggle** (nombre + chevron en el mismo control): al
 * hacer clic en el **nombre O en la flecha** se expande/colapsa el submenú de
 * módulos, igual que el encabezado de una `SectionGroup`. Los módulos arrancan
 * **visibles** (default abierto) y el usuario puede colapsarlos; su elección
 * persiste (toggle como autoridad, ver `useProgramOpen`). Es su propio
 * componente para poder llamar `useProgramOpen` (un hook) por programa sin
 * romper las reglas de hooks.
 *
 * Si el programa **no tiene módulos** no hay nada que plegar: la fila se degrada
 * a un **enlace** al detalle del programa (`/dashboard/mis-cursos/<programId>`).
 *
 * - La fila del programa se marca **activa** (misma píldora translúcida del
 *   sidebar) cuando `pathname` es el detalle del programa.
 * - El módulo activo se resalta comparando con `pathname`.
 * - La sangría diferencia visualmente niveles: el programa va sangrado respecto
 *   al encabezado "Programas"; sus módulos, un nivel más.
 */
function ProgramRow({
  program,
  moduleHrefBase,
  pathname,
  onNavigate,
}: {
  program: SidebarProgram;
  moduleHrefBase: string;
  pathname: string;
  onNavigate: () => void;
}) {
  const programHref = `/dashboard/mis-cursos/${program.id}`;
  const programActive = pathname === programHref;
  // Los módulos arrancan visibles (autoOpen = true) al entrar al panel; el
  // `toggle` (autoridad) manda sobre el default, así el usuario puede colapsar
  // cualquier programa y la elección persiste.
  const { open: effectiveOpen, toggle } = useProgramOpen(program.id, true);

  const headerId = `nav-program-${program.id}`;
  const regionId = `nav-program-${program.id}-modules`;
  const hasModules = program.modules.length > 0;

  return (
    <div role="group" aria-labelledby={headerId}>
      {/* Fila con módulos = un solo botón toggle (nombre + chevron): un clic en
          cualquiera de los dos pliega/despliega los módulos. Sin módulos, se
          degrada a un enlace al detalle del programa. */}
      {/* El nombre del programa es el "encabezado" del grupo: superficie sutil
          permanente + icono ámbar (acento institucional) + texto a contraste
          pleno, para que destaque sobre los ítems normales del sidebar. */}
      <div
        className={cn(
          "group/prog flex items-center rounded-lg transition-colors",
          programActive
            ? "bg-white/15 ring-1 ring-white/15"
            : "bg-white/[0.06] hover:bg-white/10",
        )}
      >
        {hasModules ? (
          <button
            type="button"
            id={headerId}
            onClick={toggle}
            aria-expanded={effectiveOpen}
            aria-controls={regionId}
            aria-label={
              effectiveOpen
                ? `Ocultar módulos de ${program.name}`
                : `Mostrar módulos de ${program.name}`
            }
            className={cn(
              "flex min-w-0 flex-1 items-center gap-1.5 rounded-lg py-2 pl-2 pr-2 text-left text-sm font-semibold text-white transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50",
            )}
          >
            <BookOpen
              className="size-3.5 shrink-0 text-amber-300/90"
              aria-hidden="true"
            />
            <span className="min-w-0 flex-1 truncate">{program.name}</span>
            <ChevronDown
              className={cn(
                "size-3.5 shrink-0 text-white/80 transition-transform duration-200",
                effectiveOpen ? "rotate-0" : "-rotate-90",
              )}
              aria-hidden="true"
            />
          </button>
        ) : (
          <Link
            id={headerId}
            href={programHref}
            onClick={onNavigate}
            aria-current={programActive ? "page" : undefined}
            className={cn(
              "flex min-w-0 flex-1 items-center gap-1.5 rounded-lg py-2 pl-2 pr-2 text-left text-sm font-semibold text-white transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50",
            )}
          >
            <BookOpen
              className="size-3.5 shrink-0 text-amber-300/90"
              aria-hidden="true"
            />
            <span className="truncate">{program.name}</span>
          </Link>
        )}
      </div>

      {hasModules && (
        <div
          id={regionId}
          role="region"
          aria-labelledby={headerId}
          inert={!effectiveOpen}
          className={cn(
            "grid transition-[grid-template-rows,opacity] duration-200 ease-out",
            effectiveOpen
              ? "grid-rows-[1fr] opacity-100"
              : "grid-rows-[0fr] opacity-0",
          )}
        >
          <ul className="ml-4 flex flex-col gap-0.5 overflow-hidden border-l border-white/20 pl-2 pt-1">
            {program.modules.map((mod) => {
              const href = `${moduleHrefBase}/${mod.id}`;
              const active = pathname === href;
              return (
                <li key={mod.id}>
                  <Link
                    href={href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    title={mod.name}
                    className={cn(
                      "flex items-center rounded-full px-3 py-1.5 text-sm transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50",
                      active
                        ? "bg-white/15 font-semibold text-white ring-1 ring-white/15"
                        : "text-white/85 hover:bg-white/[0.07] hover:text-white",
                    )}
                  >
                    <span className="truncate">Módulo {mod.order}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * Árbol de "Programas" del sidebar (PROFESSOR/STUDENT): un nivel de programas y,
 * dentro de cada uno, sus módulos como enlaces. NO forma parte del modelo plano
 * `NavSection`; se renderiza como un bloque propio en la posición donde iría
 * "Programas".
 *
 * Modos por estado del sidebar (espeja a `SectionGroup`):
 * - **Riel puro** (colapsado sin flyout): no cabe el árbol → un único icono
 *   "Programas" con `Tooltip` que enlaza a `/dashboard/mis-programas` (la vista
 *   completa). El árbol se ve en expandido y en el overlay móvil.
 * - **Expandido / móvil**: encabezado "Programas" (toggle de acordeón) + enlace
 *   sutil "Ver todos", y debajo el árbol de programas → módulos.
 *
 * Estado vacío: si el rol no tiene programas asignados, bajo el encabezado se
 * muestra un texto sutil "Sin programas asignados".
 */
function ProgramTree({
  programs,
  moduleHrefBase,
  railOnly,
  onNavigate,
}: {
  programs: SidebarProgram[];
  moduleHrefBase: string;
  /**
   * Riel puro (colapsado sin flyout): se reduce a un icono con tooltip que
   * enlaza a la vista completa. `false` = árbol completo (expandido/móvil).
   */
  railOnly: boolean;
  onNavigate: () => void;
}) {
  const pathname = usePathname();
  const { open: headerOpen, toggle: toggleHeader } = useProgramsHeaderOpen();

  // En riel puro: solo el icono "Programas" con tooltip → vista completa.
  if (railOnly) {
    const railLink = (
      <Link
        href="/dashboard/mis-programas"
        onClick={onNavigate}
        aria-label="Programas"
        className={cn(
          "group flex size-11 items-center justify-center rounded-full text-sm font-medium transition-colors",
          "text-sidebar-foreground/90 hover:bg-white/[0.07] hover:text-sidebar-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50",
        )}
      >
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-full"
          aria-hidden="true"
        >
          <GraduationCap
            className="size-[1.15rem] shrink-0 text-sidebar-foreground/90 transition-colors group-hover:text-sidebar-foreground"
            aria-hidden="true"
          />
        </span>
      </Link>
    );
    return (
      <div className="mt-3 flex w-8 flex-col items-center self-center border-t border-white/15 pt-3">
        <Tooltip>
          <TooltipTrigger render={railLink} />
          <TooltipContent side="right" sideOffset={10}>
            Programas
          </TooltipContent>
        </Tooltip>
      </div>
    );
  }

  // Estado expandido / overlay móvil: encabezado + árbol.
  const headerId = "nav-programs";
  const regionId = "nav-programs-items";
  const hasPrograms = programs.length > 0;
  const open = headerOpen;
  // "Ver todos" lleva a la vista de programas inscritos del estudiante; el
  // docente no la necesita (su árbol ya es la lista completa de lo que dicta).
  const isStudent = moduleHrefBase === "/dashboard/aula";

  return (
    <div className="mt-3" role="group" aria-labelledby={headerId}>
      {/* Encabezado "Programas": el texto togglea el acordeón; el enlace sutil
          "Ver todos" lleva a la vista completa `/dashboard/mis-programas`. */}
      <div className="flex items-center justify-between gap-1 pl-3 pr-1">
        <button
          type="button"
          id={headerId}
          onClick={toggleHeader}
          aria-expanded={open}
          aria-controls={regionId}
          className={cn(
            "group/acc flex flex-1 items-center justify-between gap-2 rounded-lg pb-1.5 pt-1 text-xs font-semibold uppercase tracking-wide text-sidebar-foreground/85 transition-colors",
            "hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50",
          )}
        >
          <span className="flex min-w-0 items-center gap-1.5">
            <GraduationCap
              className="size-3.5 shrink-0 text-sidebar-foreground/80"
              aria-hidden="true"
            />
            <span className="truncate">Programas</span>
          </span>
          <ChevronDown
            className={cn(
              "size-3.5 shrink-0 text-sidebar-foreground/70 transition-transform duration-200",
              open ? "rotate-0" : "-rotate-90",
            )}
            aria-hidden="true"
          />
        </button>
        {isStudent && (
          <Link
            href="/dashboard/mis-programas"
            onClick={onNavigate}
            className="shrink-0 rounded-md px-1.5 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide text-sidebar-foreground/55 transition-colors hover:text-sidebar-foreground/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50"
          >
            Ver todos
          </Link>
        )}
      </div>

      <div
        id={regionId}
        role="region"
        aria-labelledby={headerId}
        inert={!open}
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-200 ease-out",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          {hasPrograms ? (
            <div className="flex flex-col gap-0.5">
              {programs.map((program) => (
                <ProgramRow
                  key={program.id}
                  program={program}
                  moduleHrefBase={moduleHrefBase}
                  pathname={pathname}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          ) : (
            <p className="px-3 py-1.5 text-sm text-sidebar-foreground/55">
              Sin programas asignados
            </p>
          )}
        </div>
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
  programTree,
}: {
  sections: NavSection[];
  collapsed?: boolean;
  expandOnHover?: boolean;
  suppressHover?: boolean;
  /**
   * Árbol de "Programas" (PROFESSOR/STUDENT) a insertar ENTRE la primera sección
   * ("Inicio") y el resto. Para ADMIN llega `undefined` y no se renderiza.
   */
  programTree?: React.ReactNode;
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
      className={cn("flex flex-col gap-2", railOnly && "items-center")}
      aria-label="Navegación del panel"
    >
      {sections.map((section, index) => (
        <Fragment key={section.title ?? `group-${index}`}>
          <SectionGroup
            section={section}
            index={index}
            collapsed={collapsed}
            expandOnHover={expandOnHover}
            flyoutActive={flyoutActive}
            railOnly={railOnly}
            isActive={isActive}
            onNavigate={onNavigate}
          />
          {/* El árbol de "Programas" va justo después de la primera sección
              ("Inicio"), antes del resto de la navegación. */}
          {index === 0 && programTree}
        </Fragment>
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
  programTree?: React.ReactNode;
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
  programTree,
}: {
  sections: NavSection[];
  collapsed?: boolean;
  expandOnHover?: boolean;
  suppressHover?: boolean;
  programTree?: React.ReactNode;
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
      className={cn("flex flex-col gap-2", railOnly && "items-center")}
      aria-label="Navegación del panel"
    >
      {sections.map((section, index) => (
        <Fragment key={section.title ?? `group-${index}`}>
          <SectionGroup
            section={section}
            index={index}
            collapsed={collapsed}
            expandOnHover={expandOnHover}
            flyoutActive={flyoutActive}
            railOnly={railOnly}
            isActive={isActive}
            onNavigate={onNavigate}
          />
          {index === 0 && programTree}
        </Fragment>
      ))}
    </nav>
  );
}

/**
 * Bloque de marca en la cabecera del sidebar navy: el **logo de Certificate**
 * (`logo.webp`). El logo es BLANCO (pensado para fondos oscuros), así que va
 * directo sobre el gradiente navy sin necesidad de píldora. En estado riel se
 * reduce para caber en el ancho del riel y, con flyout, recupera su tamaño
 * completo por hover/foco (mismo patrón de revelado que el resto del sidebar).
 */
function SidebarLogo({ collapsed }: { collapsed: boolean }) {
  return (
    <Link
      href="/dashboard"
      aria-label="Certificate — ir al inicio del panel"
      className={cn(
        "group/logo mb-2 flex items-center justify-center rounded-xl px-1 py-1 transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60",
        collapsed
          ? "group-hover/flyout:px-1.5 group-focus-within/flyout:px-1.5"
          : "px-1.5",
      )}
    >
      <Image
        src="/landing/logo.webp"
        alt="Certificate"
        width={408}
        height={174}
        priority
        className={cn(
          "h-auto w-auto object-contain transition-[max-width,max-height] duration-200",
          // Riel: encoge para caber en el ancho del riel; con flyout recupera
          // tamaño. Expandido: tamaño completo de la cabecera.
          collapsed
            ? "max-h-9 max-w-[2.75rem] group-hover/flyout:max-h-12 group-hover/flyout:max-w-[10rem] group-focus-within/flyout:max-h-12 group-focus-within/flyout:max-w-[10rem]"
            : "max-h-12 max-w-[10rem]",
        )}
      />
    </Link>
  );
}

/**
 * Botón "Cerrar sesión" anclado al pie del sidebar navy. Adopta el diseño rojo
 * (destructive) que antes vivía en el topbar. Sigue el mismo patrón de revelado
 * que los items de nav: en riel se reduce a un icono centrado (con
 * `title`/`aria-label`), y con flyout la etiqueta se revela por hover/foco.
 * `logout` es un Server Action (referencia serializable).
 */
function SidebarLogout({
  collapsed,
  logout,
}: {
  collapsed: boolean;
  logout: () => Promise<void>;
}) {
  return (
    <form action={logout} className="mt-1 border-t border-white/10 pt-3">
      <button
        type="submit"
        title={collapsed ? "Cerrar sesión" : undefined}
        aria-label={collapsed ? "Cerrar sesión" : undefined}
        className={cn(
          "group flex w-full items-center rounded-full text-sm font-medium text-red-100 ring-1 ring-red-400/25 transition-colors",
          "bg-red-500/15 hover:bg-red-500/25 hover:text-white",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/60",
          collapsed
            ? "justify-center py-1 pl-1 pr-1 group-hover/flyout:justify-start group-hover/flyout:gap-3 group-hover/flyout:pl-1 group-hover/flyout:pr-4 group-focus-within/flyout:justify-start group-focus-within/flyout:gap-3 group-focus-within/flyout:pl-1 group-focus-within/flyout:pr-4"
            : "gap-3 py-1 pl-1 pr-4",
        )}
      >
        {/* Icono en caja del tamaño del badge de nav, para alinear el texto con
            la columna de iconos de los items de arriba. */}
        <span className="flex size-9 shrink-0 items-center justify-center" aria-hidden="true">
          <LogOut className="size-[1.15rem] shrink-0" aria-hidden="true" />
        </span>
        {!collapsed && <span className="truncate">Cerrar sesión</span>}
        {/* Flyout: etiqueta oculta (ancho 0) hasta expandir por hover/foco. */}
        {collapsed && (
          <span
            className={cn(
              "w-0 overflow-hidden truncate opacity-0 transition-[opacity] duration-200",
              "group-hover/flyout:w-auto group-hover/flyout:opacity-100",
              "group-focus-within/flyout:w-auto group-focus-within/flyout:opacity-100",
            )}
          >
            Cerrar sesión
          </span>
        )}
      </button>
    </form>
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
export function DashboardSidebar({
  sections,
  programs,
  moduleHrefBase = "/dashboard/modulos",
  logout,
}: {
  sections: NavSection[];
  /**
   * Árbol de programas asignados (PROFESSOR/STUDENT). `undefined` para ADMIN: no
   * se renderiza el bloque "Programas".
   */
  programs?: SidebarProgram[];
  /** Base del enlace de cada módulo según rol (`/dashboard/aula` o `/dashboard/modulos`). */
  moduleHrefBase?: string;
  /** Server action de cierre de sesión (botón "Salir" al pie del sidebar). */
  logout?: () => Promise<void>;
}) {
  const { mobileOpen, setMobileOpen, collapsed } = useSidebar();
  const onTreeNavigate = useCallback(
    () => setMobileOpen(false),
    [setMobileOpen],
  );

  // Estado de UI transitorio (NO persistido): al colapsar con el cursor encima,
  // suprimimos el flyout-on-hover para que el riel se vea angosto de inmediato.
  // Se inicializa en `false` (coincide SSR/cliente → sin hydration mismatch) y
  // se limpia cuando el cursor/foco realmente salen del aside.
  const [suppressHover, setSuppressHover] = useState(false);

  return (
    <TooltipProvider delay={150}>
      {/*
        Sidebar fijo en escritorio — ocupa TODA la altura de la pantalla en la
        columna izquierda (de arriba a abajo), con el logo arriba y "Salir" al
        pie. Es hermano de la columna de contenido en el flex raíz del layout
        (NO lo envuelve), por eso el topbar queda confinado a la derecha y nunca
        se extiende sobre el sidebar.
        - Expandido: columna en flujo normal (`15rem`).
        - Colapsado: la columna queda como riel angosto (`4.5rem`), y el panel se
          convierte en un *flyout* que, al hover/foco, se ensancha a `15rem` SOBRE
          el contenido (`absolute`) sin reflowar `<main>`.
      */}
      <aside
        className={cn(
          "sticky top-0 z-50 hidden h-screen shrink-0 self-start lg:block",
          // El ancho de la COLUMNA en el flujo flex (no del panel): riel vs.
          // expandido. En colapsado dejamos `4.5rem` fijos; el panel crece por
          // encima vía `absolute` al hacer hover, sin empujar el contenido.
          collapsed ? "w-18" : "w-60",
          "transition-[width] duration-200 ease-out",
        )}
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
        {/* Panel navy del sidebar (lenguaje del mockup): superficie oscura con
            GRADIENTE azul (más vivo arriba → navy profundo abajo) en AMBOS
            modos. Su borde derecho lleva la esquina redondeada (`rounded-r-3xl`)
            tanto EXPANDIDO como en el flyout COLAPSADO, para que ambos estados
            compartan el mismo diseño de panel. */}
        <div
          className={cn(
            "relative flex h-full flex-col gap-4 overflow-visible rounded-r-3xl p-4 shadow-lg shadow-blue-950/10 ring-1 ring-white/5",
            // Gradiente vivo de la referencia: azul brillante ARRIBA → navy
            // profundo ABAJO, con un punto medio explícito para que el degradado
            // sea claramente perceptible (no un casi-plano). Mismo en ambos temas.
            "bg-sidebar bg-gradient-to-b from-blue-900 from-0% via-blue-900 via-45% to-blue-900 to-100% dark:from-slate-950 dark:via-slate-950 dark:to-slate-950 text-sidebar-foreground",
            // Riel minimizado: ancho fijo de iconos, SIN flyout-on-hover (no se
            // expande al pasar el cursor; las etiquetas siguen accesibles vía
            // `title`/`aria-label`).
            collapsed && "absolute inset-y-0 left-0 z-40 w-18 p-2",
          )}
        >
          <CollapseToggle
            collapsed={collapsed}
            onCollapse={() => setSuppressHover(true)}
          />
          <SidebarLogo collapsed={collapsed} />
          {/* La navegación toma el alto disponible y hace scroll propio si no
              entra; así "Salir" queda siempre anclado al pie. */}
          <div className="-mr-1 min-h-0 flex-1 overflow-y-auto pr-1">
            <SidebarNav
              sections={sections}
              collapsed={collapsed}
              expandOnHover={collapsed}
              suppressHover={suppressHover}
              programTree={
                programs && (
                  <ProgramTree
                    programs={programs}
                    moduleHrefBase={moduleHrefBase}
                    // En escritorio el riel NO se ensancha por hover (memoria del
                    // sidebar): colapsado = riel puro → solo el icono con tooltip.
                    railOnly={collapsed}
                    onNavigate={onTreeNavigate}
                  />
                )
              }
            />
          </div>
          {/* "Salir" al pie del sidebar (lenguaje del mockup). En riel se reduce
              a un icono centrado; con flyout, la etiqueta se revela por hover. */}
          {logout && (
            <SidebarLogout collapsed={collapsed} logout={logout} />
          )}
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
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[80%] flex-col gap-4 bg-sidebar bg-gradient-to-b from-blue-900 from-0% via-blue-900 via-45% to-blue-900 to-100% dark:from-slate-950 dark:via-slate-950 dark:to-slate-950 p-5 text-sidebar-foreground shadow-xl">
            <div className="flex items-center justify-between gap-2">
              <Link
                href="/dashboard"
                onClick={() => setMobileOpen(false)}
                aria-label="Certificate · Plataforma — ir al inicio del panel"
                className="flex items-center rounded-xl py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60"
              >
                {/* Logo blanco de Certificate directo sobre el fondo navy del drawer. */}
                <Image
                  src="/landing/logo.webp"
                  alt="Certificate"
                  width={408}
                  height={174}
                  priority
                  className="h-auto w-auto max-h-11 max-w-[10rem] object-contain"
                />
              </Link>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Cerrar menú de navegación"
                className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-sidebar-foreground/90 transition-colors hover:bg-white/10 hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50"
              >
                <X className="size-5" />
              </button>
            </div>
            {/* Nav scrolleable; "Salir" anclado al pie del drawer. */}
            <div className="-mr-1 min-h-0 flex-1 overflow-y-auto pr-1">
              <SidebarNav
                sections={sections}
                programTree={
                  programs && (
                    <ProgramTree
                      programs={programs}
                      moduleHrefBase={moduleHrefBase}
                      railOnly={false}
                      onNavigate={onTreeNavigate}
                    />
                  )
                }
              />
            </div>
            {logout && (
              <form
                action={logout}
                className="mt-1 border-t border-white/10 pt-3"
              >
                <button
                  type="submit"
                  className="group flex w-full items-center gap-3 rounded-full py-1 pl-1 pr-4 text-sm font-medium text-sidebar-foreground/90 transition-colors hover:bg-white/[0.07] hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center" aria-hidden="true">
                    <LogOut
                      className="size-[1.15rem] shrink-0 text-sidebar-foreground/90 transition-colors group-hover:text-sidebar-foreground"
                      aria-hidden="true"
                    />
                  </span>
                  <span className="truncate">Salir</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </TooltipProvider>
  );
}
