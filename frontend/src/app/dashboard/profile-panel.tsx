import { Mail, ShieldCheck } from "lucide-react";
import { ProfileCalendar } from "@/components/dashboard/profile-calendar";

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
 * Server component: solo recibe datos de sesión. El cierre de sesión vive al pie
 * del sidebar (`SidebarLogout`), no en este panel.
 */
export function ProfilePanel({
  name,
  email,
  role,
}: {
  name?: string | null;
  email?: string | null;
  role?: string;
}) {
  const displayName = name?.trim() || "Usuario";
  const roleLabel = role ? (ROLE_LABEL[role] ?? role) : "—";

  return (
    <aside aria-label="Perfil y calendario">
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

        {/* Calendario: fecha actual, feriados de Bolivia, fechas plazo de
            actividades y recordatorios del usuario. */}
        <ProfileCalendar role={role} />
      </div>
    </aside>
  );
}
