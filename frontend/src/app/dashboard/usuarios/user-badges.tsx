import { Badge } from "@/components/ui/badge";
import type { AdminUserRole } from "@/lib/api/admin";

const ROLE_LABELS: Record<AdminUserRole, string> = {
  ADMIN: "Administrador",
  PROFESSOR: "Docente",
  STUDENT: "Estudiante",
};

/**
 * Badge semántico de rol. Docente y Estudiante con colores distintos y sobrios;
 * Administrador (no creable desde aquí, pero puede aparecer si se listan todos)
 * resaltado con el ámbar institucional.
 */
export function RoleBadge({ role }: { role: AdminUserRole }) {
  if (role === "PROFESSOR") {
    return (
      <Badge className="border-transparent bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
        {ROLE_LABELS.PROFESSOR}
      </Badge>
    );
  }
  if (role === "STUDENT") {
    return (
      <Badge className="border-transparent bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
        {ROLE_LABELS.STUDENT}
      </Badge>
    );
  }
  return (
    <Badge className="border-transparent bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
      {ROLE_LABELS.ADMIN}
    </Badge>
  );
}

/** Badge semántico de estado activo/inactivo. */
export function StatusBadge({ isActive }: { isActive: boolean }) {
  if (isActive) {
    return (
      <Badge className="border-transparent bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
        Activo
      </Badge>
    );
  }
  return <Badge variant="secondary">Inactivo</Badge>;
}
