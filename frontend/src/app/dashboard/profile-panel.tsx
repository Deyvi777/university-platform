import { LogOut, Mail, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { NAV_ICONS, type NavItem } from "./nav-items";

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Administrador",
  PROFESSOR: "Docente",
  STUDENT: "Estudiante",
};

/** Iniciales para el avatar (sin imágenes remotas — ver gotcha SSRF de next/image). */
function initials(name?: string | null, email?: string | null): string {
  const source = name?.trim() || email?.trim() || "";
  if (!source) return "?";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

/**
 * Panel lateral derecho de perfil + accesos rápidos. Reemplaza el "panel de
 * actividad" de la referencia: como aún no existen métricas reales por rol, no
 * inventamos datos — usamos el espacio para identidad del usuario, su rol y
 * atajos a sus secciones de navegación.
 *
 * Server component: solo recibe datos de sesión y un `logout` server action.
 */
export function ProfilePanel({
  name,
  email,
  role,
  quickLinks,
  logout,
}: {
  name?: string | null;
  email?: string | null;
  role?: string;
  quickLinks: NavItem[];
  logout: () => Promise<void>;
}) {
  const displayName = name?.trim() || "Usuario";
  const roleLabel = role ? (ROLE_LABEL[role] ?? role) : "—";

  return (
    <aside className="hidden xl:block" aria-label="Perfil y accesos rápidos">
      <div className="sticky top-6 space-y-5">
        {/* Tarjeta de perfil */}
        <div className="overflow-hidden rounded-3xl border bg-card shadow-sm">
          <div className="h-20 bg-blue-950" aria-hidden="true" />
          <div className="-mt-10 flex flex-col items-center px-6 pb-6 text-center">
            <span
              className="flex size-20 items-center justify-center rounded-full border-4 border-card bg-amber-400 font-heading text-2xl font-bold text-blue-950"
              aria-hidden="true"
            >
              {initials(name, email)}
            </span>
            <h2 className="mt-3 font-heading text-lg font-bold tracking-tight">
              {displayName}
            </h2>
            <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-blue-950/5 px-3 py-1 text-xs font-medium text-blue-950 dark:bg-white/10 dark:text-foreground">
              <ShieldCheck className="size-3.5 text-amber-500" aria-hidden="true" />
              {roleLabel}
            </span>
            {email && (
              <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <Mail className="size-3.5 shrink-0" aria-hidden="true" />
                <span className="truncate">{email}</span>
              </p>
            )}
          </div>
        </div>

        {/* Accesos rápidos (los mismos items de nav del rol, excepto "Inicio") */}
        {quickLinks.length > 0 && (
          <div className="rounded-3xl border bg-card p-5 shadow-sm">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Accesos rápidos
            </h3>
            <ul className="mt-3 space-y-1">
              {quickLinks.map((item) => {
                const Icon = NAV_ICONS[item.icon];
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50"
                    >
                      <Icon
                        className="size-4 shrink-0 text-muted-foreground/80"
                        aria-hidden="true"
                      />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Cerrar sesión */}
        <form action={logout}>
          <Button type="submit" variant="destructive" size="sm" className="w-full">
            <LogOut className="size-4" />
            Cerrar sesión
          </Button>
        </form>
      </div>
    </aside>
  );
}
