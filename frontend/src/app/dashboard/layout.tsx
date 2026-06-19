import Link from "next/link";
import { auth, signOut } from "@/auth";
import { DashboardShell, HeaderLogout, ProfileToggle } from "./dashboard-shell";
import {
  DashboardSidebar,
  SidebarProvider,
  SidebarTrigger,
} from "./dashboard-sidebar";
import { navSectionsForRole, quickLinksFromSections } from "./nav-items";
import { ProfilePanel } from "./profile-panel";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const navSections = navSectionsForRole(session?.user?.role);
  // Accesos rápidos = items de nav (aplanados) sin "Inicio" (href base del panel).
  const quickLinks = quickLinksFromSections(navSections);

  async function logout() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-muted/40">
        {/* Barra superior — marca + (móvil) hamburguesa + salir compacto */}
        <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
          <div className="flex h-16 w-full items-center justify-between gap-4 px-3 sm:px-4 lg:px-5">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <Link
                href="/dashboard"
                className="font-heading text-base font-bold tracking-tight"
              >
                Certificate<span className="text-amber-500"> · Panel</span>
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden text-sm text-muted-foreground md:inline">
                {session?.user?.email}
              </span>
              {/* Ocultar/mostrar el panel de perfil derecho (escritorio xl+) */}
              <ProfileToggle />
              {/* Salir compacto: bajo xl siempre; en xl+ solo si el panel de
                  perfil (que también tiene "Cerrar sesión") está oculto. */}
              <HeaderLogout logout={logout} />
            </div>
          </div>
        </header>

        {/* Shell de 3 zonas: sidebar · contenido · panel de perfil.
            El grid vive en un Client Component para reaccionar al colapso. */}
        <DashboardShell
          sidebar={<DashboardSidebar sections={navSections} />}
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
