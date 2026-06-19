"use client";

import { LogOut, PanelRightClose, PanelRightOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSidebar } from "./dashboard-sidebar";

/**
 * Contenedor del grid del panel (cliente) para que las anchuras de las columnas
 * reaccionen al estado de colapso del contexto:
 *   - `collapsed` → el sidebar pasa de `15rem` a un riel de `4.5rem`.
 *   - `profileOpen` (solo `xl+`) → muestra/oculta la columna de `20rem`; al
 *     ocultarse, el área de contenido central absorbe el espacio liberado.
 *
 * Recibe `sidebar`, `children` y `profilePanel` como **props** — son Server
 * Components renderizados en el server y compuestos dentro de este Client
 * Component, lo cual NO rompe la serialización (no se pasan funciones ni
 * componentes, solo árboles ya renderizados).
 */
export function DashboardShell({
  sidebar,
  children,
  profilePanel,
}: {
  sidebar: React.ReactNode;
  children: React.ReactNode;
  profilePanel: React.ReactNode;
}) {
  const { collapsed, profileOpen } = useSidebar();

  return (
    <div
      className={cn(
        // Ancho completo: sin `max-w` ni `mx-auto`, el sidebar queda pegado al
        // borde izquierdo y el panel de perfil al derecho. El padding lateral es
        // mínimo (solo el respiro mínimo de los extremos); el aire visual real
        // lo dan el `gap` entre columnas y el padding interno de cada zona.
        "grid w-full gap-6 px-3 py-6 transition-[grid-template-columns] duration-300 ease-out sm:px-4 lg:px-5",
        // Columna 1 (sidebar): riel angosto cuando está colapsado.
        collapsed
          ? "lg:grid-cols-[4.5rem_minmax(0,1fr)]"
          : "lg:grid-cols-[15rem_minmax(0,1fr)]",
        // Columna 3 (panel de perfil): solo en `xl+` y si está visible.
        profileOpen
          ? collapsed
            ? "xl:grid-cols-[4.5rem_minmax(0,1fr)_20rem]"
            : "xl:grid-cols-[15rem_minmax(0,1fr)_20rem]"
          : collapsed
            ? "xl:grid-cols-[4.5rem_minmax(0,1fr)]"
            : "xl:grid-cols-[15rem_minmax(0,1fr)]",
      )}
    >
      {sidebar}
      {/* La columna central absorbe todo el espacio extra (`minmax(0,1fr)`),
          pero su contenido se centra con un `max-w` generoso para que en
          pantallas muy anchas las líneas/tarjetas no queden estiradas. */}
      <main className="min-w-0">
        <div className="mx-auto w-full max-w-6xl">{children}</div>
      </main>
      {/* El panel se monta siempre (es Server Component) pero se oculta con
          CSS cuando `profileOpen` es falso, para no perder su contenido. */}
      <div className={cn("min-w-0", !profileOpen && "xl:hidden")}>
        {profilePanel}
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
