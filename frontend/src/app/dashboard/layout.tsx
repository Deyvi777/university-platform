import Link from "next/link";
import { auth, signOut } from "@/auth";
import { DashboardShell, HeaderLogout, ProfileToggle } from "./dashboard-shell";
import {
  DashboardSidebar,
  SidebarProvider,
  SidebarTrigger,
} from "./dashboard-sidebar";
import { ThemeToggle } from "@/components/dashboard/theme-toggle";
import { NotificationBell } from "@/components/dashboard/notification-bell";
import { listNotifications } from "@/lib/api/notifications";
import { listMyCourses } from "@/lib/api/me";
import {
  navSectionsForRole,
  quickLinksFromSections,
  type SidebarProgram,
} from "./nav-items";
import { ProfilePanel } from "./profile-panel";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const role = session?.user?.role;
  // El centro de notificaciones es para docentes y estudiantes (no para ADMIN).
  const showNotifications = role === "PROFESSOR" || role === "STUDENT";
  // Se cargan al entrar al panel (sin tiempo real): el layout las trae con el
  // token de la sesión y se las pasa al campanario.
  const notifications = showNotifications ? await listNotifications() : [];

  // Árbol de "Programas" del sidebar (solo docentes y estudiantes). Se arma a
  // partir de los cursos asignados: para STUDENT los módulos vienen en
  // `modules`; para PROFESSOR en `myModules` (solo los que dicta). Forma plana y
  // serializable para cruzar Server → Client (ver `SidebarProgram`).
  const showPrograms = role === "PROFESSOR" || role === "STUDENT";
  const myCourses = showPrograms ? await listMyCourses() : [];
  const programs: SidebarProgram[] = myCourses.map((course) => ({
    id: course.id,
    name: course.name,
    modules: (course.modules ?? course.myModules ?? [])
      .map((mod) => ({ id: mod.id, name: mod.name, order: mod.order }))
      .sort((a, b) => a.order - b.order),
  }));
  // Destino del enlace de cada módulo según rol: el estudiante entra al aula; el
  // docente a la gestión del módulo.
  const moduleHrefBase =
    role === "STUDENT" ? "/dashboard/aula" : "/dashboard/modulos";

  const navSections = navSectionsForRole(role);
  // Accesos rápidos = items de nav (aplanados) sin "Inicio" (href base del panel).
  const quickLinks = quickLinksFromSections(navSections);

  async function logout() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  // Barra superior — marca + (móvil) hamburguesa + identidad/acciones.
  // Vive DENTRO de la columna de contenido (a la derecha del sidebar full-height),
  // por eso ya no abarca el ancho del sidebar: se le pasa a `DashboardShell` como
  // prop y este la renderiza `sticky` arriba de su columna.
  const topbar = (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-card/85 backdrop-blur-md">
      <div className="flex h-16 w-full items-center justify-between gap-4 px-3 sm:px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <SidebarTrigger />
          <Link
            href="/dashboard"
            className="font-heading text-base font-bold tracking-tight"
          >
            Plataforma<span className="text-blue-800 dark:text-sky-300"> · Virtual</span>
          </Link>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Píldora de usuario (lenguaje del mockup): avatar de iniciales +
              correo en una píldora clara. Solo md+; bajo eso, el panel de
              perfil/menú cubren la identidad. */}
          {session?.user?.email && (
            <span className="hidden items-center gap-2 rounded-full border bg-background py-1 pl-1 pr-3 md:inline-flex">
              <span
                className="flex size-7 items-center justify-center rounded-full bg-blue-950 text-[0.7rem] font-bold text-amber-300"
                aria-hidden="true"
              >
                {(session.user.name?.trim() || session.user.email)
                  .slice(0, 2)
                  .toUpperCase()}
              </span>
              <span className="max-w-[14rem] truncate text-sm text-muted-foreground">
                {session.user.email}
              </span>
            </span>
          )}
          {/* Centro de notificaciones (docentes y estudiantes) */}
          {showNotifications && (
            <NotificationBell
              initialNotifications={notifications.map((n) => ({
                id: n.id,
                type: n.type,
                title: n.title,
                body: n.body,
                createdAt: n.createdAt,
                read: n.read,
                href: `/dashboard/notificaciones/${n.id}`,
              }))}
            />
          )}
          {/* Interruptor claro/oscuro (modo oscuro navy por defecto) */}
          <ThemeToggle />
          {/* Ocultar/mostrar el panel de perfil derecho (escritorio xl+) */}
          <ProfileToggle />
          {/* Salir compacto: bajo xl siempre; en xl+ solo si el panel de
              perfil (que también tiene "Cerrar sesión") está oculto. */}
          <HeaderLogout logout={logout} />
        </div>
      </div>
    </header>
  );

  return (
    <SidebarProvider>
      {/* Raíz del panel: DOS columnas en flujo flex.
          - Izquierda: el sidebar navy a TODA la altura de la pantalla
            (`h-screen sticky top-0`), con el logo arriba y "Salir" abajo.
          - Derecha: la columna de contenido (`flex-1`) que aloja ARRIBA el
            topbar (confinado a este ancho, NO sobre el sidebar) y DEBAJO el
            `<main>` scrolleable + el panel de perfil. */}
      <div className="flex min-h-screen bg-background">
        <DashboardSidebar
          sections={navSections}
          programs={showPrograms ? programs : undefined}
          moduleHrefBase={moduleHrefBase}
          logout={logout}
        />
        <DashboardShell
          topbar={topbar}
          profilePanel={
            <ProfilePanel
              name={session?.user?.name}
              email={session?.user?.email}
              role={session?.user?.role}
              quickLinks={quickLinks}
              logout={logout}
            />
          }
        >
          {children}
        </DashboardShell>
      </div>
    </SidebarProvider>
  );
}
