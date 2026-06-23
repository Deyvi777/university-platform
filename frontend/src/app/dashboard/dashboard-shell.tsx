"use client";

import { LogOut, PanelRightClose, PanelRightOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const { profileOpen } = useSidebar();

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
        {/* El panel se monta siempre (es Server Component) pero se oculta con
            CSS cuando `profileOpen` es falso, para no perder su contenido. */}
        <div className={cn("min-w-0", !profileOpen && "xl:hidden")}>
          {profilePanel}
        </div>
      </div>
    </div>
  );
}

/**
 * Botón de ocultar/mostrar el panel de perfil derecho. Solo escritorio `xl+`
 * (el panel solo existe a partir de ese breakpoint). Vive en la barra superior.
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
      className="hidden size-10 items-center justify-center rounded-full border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50 xl:inline-flex"
    >
      {profileOpen ? (
        <PanelRightClose className="size-5" aria-hidden="true" />
      ) : (
        <PanelRightOpen className="size-5" aria-hidden="true" />
      )}
    </button>
  );
}

/**
 * Botón "Salir" compacto de la barra superior. Visible bajo `xl` (donde el panel
 * de perfil derecho — que también ofrece "Cerrar sesión" — no existe) y, en
 * `xl+`, solo cuando ese panel está oculto (`!profileOpen`), para que el usuario
 * nunca se quede sin una forma visible de cerrar sesión.
 *
 * `logout` es un Server Action; pasarlo como prop a este Client Component es
 * válido (Next serializa la referencia de la action, no la función).
 */
export function HeaderLogout({ logout }: { logout: () => Promise<void> }) {
  const { profileOpen } = useSidebar();
  return (
    <form action={logout} className={cn(profileOpen && "xl:hidden")}>
      <Button type="submit" variant="destructive" size="sm">
        <LogOut className="size-4" />
        <span className="hidden sm:inline">Salir</span>
      </Button>
    </form>
  );
}
