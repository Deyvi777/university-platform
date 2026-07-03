"use client";

import { PanelRightClose, PanelRightOpen, X } from "lucide-react";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { useSidebar } from "./dashboard-sidebar";

/**
 * Columna de contenido del panel (cliente). Vive a la DERECHA del sidebar
 * full-height (que ahora es hermano de este componente en el flex raíz del
 * layout, NO un hijo de aquí). Estructura vertical:
 *
 *   ┌──────────────────────────────────────┐
 *   │ topbar (sticky, solo este ancho)     │ ← confinado a la columna de contenido
 *   ├──────────────────────────────────────┤
 *   │ área scrolleable                     │
 *   │   ┌─────────────┬──────────────────┐ │
 *   │   │ <main>      │ panel de perfil  │ │ ← grid de 2 columnas (xl+)
 *   │   └─────────────┴──────────────────┘ │
 *   └──────────────────────────────────────┘
 *
 * El grid interno reacciona a `profileOpen` (solo `xl+`): al ocultar el panel de
 * perfil, `<main>` absorbe el espacio. El ancho del sidebar ya NO se gestiona
 * aquí: lo decide el propio `<aside>` (riel vs. expandido) en el flujo flex del
 * layout, así que `flex-1` deja que esta columna ocupe el resto.
 *
 * Recibe `topbar`, `children` y `profilePanel` como **props** — `topbar` y
 * `profilePanel` son Server Components ya renderizados (no se serializan
 * funciones), válido para componer dentro de este Client Component.
 */
export function DashboardShell({
  topbar,
  children,
  profilePanel,
}: {
  topbar: React.ReactNode;
  children: React.ReactNode;
  profilePanel: React.ReactNode;
}) {
  const { profileOpen, toggleProfile } = useSidebar();

  // Trampa de historial: con el drawer abierto en móvil, el botón "atrás" del
  // navegador debe CERRAR el panel, no salir de la página. Al abrir empujamos
  // una entrada de historial; el `popstate` (atrás) la consume y cierra el
  // drawer. En `xl+` el panel es inline, así que no se intercepta.
  useEffect(() => {
    if (!profileOpen) return;
    if (!window.matchMedia("(max-width: 1279px)").matches) return;

    window.history.pushState({ profileDrawer: true }, "");
    const onPopState = () => toggleProfile();
    window.addEventListener("popstate", onPopState);

    return () => {
      window.removeEventListener("popstate", onPopState);
      // Si el drawer se cerró por la X o el backdrop (no por "atrás"), nuestra
      // entrada sigue siendo la actual: la retiramos para no dejarla colgada.
      if (window.history.state?.profileDrawer) {
        window.history.back();
      }
    };
  }, [profileOpen, toggleProfile]);

  return (
    // `min-w-0` evita que el contenido ancho (tablas, etc.) desborde la columna
    // flex. `flex-1` toma todo el ancho que deje el sidebar.
    <div className="flex min-w-0 flex-1 flex-col">
      {topbar}
      {/* Área scrolleable bajo el topbar sticky. El padding lateral mínimo da el
          respiro de los extremos; el aire real lo dan el `gap` y los paddings
          internos de cada zona. */}
      <div
        className={cn(
          "grid w-full flex-1 gap-6 px-3 py-6 transition-[grid-template-columns] duration-300 ease-out sm:px-4 lg:px-6",
          // Columna del panel de perfil: solo en `xl+` y si está visible.
          profileOpen
            ? "xl:grid-cols-[minmax(0,1fr)_20rem]"
            : "xl:grid-cols-[minmax(0,1fr)]",
        )}
      >
        {/* La columna central absorbe todo el espacio extra (`minmax(0,1fr)`) y
            su contenido ocupa el ancho completo: tablas, libreta de calificaciones,
            aula y listados se benefician del espacio. El respiro de los extremos lo
            da el padding lateral del contenedor del grid (`px-3 sm:px-4 lg:px-6`).
            Cada página decide internamente si limita el ancho de bloques angostos
            (p. ej. formularios de una sola columna). */}
        <main className="min-w-0">{children}</main>
        {/* Columna inline del panel: solo `xl+`. Se monta siempre pero se oculta
            con CSS cuando `profileOpen` es falso, para no perder su contenido. */}
        <div className={cn("hidden min-w-0 xl:block", !profileOpen && "xl:hidden")}>
          {profilePanel}
        </div>
      </div>

      {/* Drawer del panel en móvil/tablet (< xl): backdrop + hoja deslizable
          desde la derecha. Solo se monta cuando está abierto, así no deja un
          elemento fuera de pantalla que provoque scroll horizontal. */}
      {profileOpen && (
        <div className="xl:hidden">
          <button
            type="button"
            onClick={toggleProfile}
            aria-label="Cerrar el panel de perfil"
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[1px] duration-200 motion-safe:animate-in motion-safe:fade-in-0"
          />
          <div className="fixed inset-y-0 right-0 z-50 w-80 max-w-[85vw] bg-background shadow-2xl duration-300 motion-safe:animate-in motion-safe:slide-in-from-right-[20rem]">
            {/* Botón de cierre (X): mismo diseño rojo que "Cerrar sesión",
                medio fuera del panel (left negativo = mitad del ancho del
                botón). Va FUERA del contenedor scrolleable para que el
                `overflow` no lo recorte. */}
            <button
              type="button"
              onClick={toggleProfile}
              aria-label="Cerrar el panel de perfil"
              className="absolute -left-[1.125rem] top-4 z-10 inline-flex size-9 items-center justify-center rounded-full bg-red-500/15 text-white ring-1 ring-red-400/40 transition-colors hover:bg-red-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/60"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
            <div className="h-full overflow-y-auto p-4">{profilePanel}</div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Botón de ocultar/mostrar el panel de perfil derecho. Visible en todos los
 * tamaños: en `xl+` alterna la columna inline; en móvil/tablet abre el panel
 * como un drawer deslizable. Vive en la barra superior.
 */
export function ProfileToggle() {
  const { profileOpen, toggleProfile } = useSidebar();
  return (
    <button
      type="button"
      onClick={toggleProfile}
      aria-label={
        profileOpen ? "Ocultar el panel de perfil" : "Mostrar el panel de perfil"
      }
      aria-pressed={profileOpen}
      title={profileOpen ? "Ocultar perfil" : "Mostrar perfil"}
      className="inline-flex size-10 items-center justify-center rounded-full border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50"
    >
      {profileOpen ? (
        <PanelRightClose className="size-5" aria-hidden="true" />
      ) : (
        <PanelRightOpen className="size-5" aria-hidden="true" />
      )}
    </button>
  );
}
