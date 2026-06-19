import { Pencil, Plus, Users } from "lucide-react";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth-guard";
import {
  listAdminUsers,
  type AdminUser,
  type AdminUserRole,
} from "@/lib/api/admin";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteUserAction } from "@/app/dashboard/usuarios/actions";
import { RoleBadge, StatusBadge } from "@/app/dashboard/usuarios/user-badges";

const dateFmt = new Intl.DateTimeFormat("es-BO", {
  timeZone: "UTC",
  day: "2-digit",
  month: "short",
  year: "numeric",
});

type RolFilter = "todos" | "administrativos" | "docentes" | "estudiantes";

const FILTERS: { key: RolFilter; label: string; href: string }[] = [
  { key: "todos", label: "Todos", href: "/dashboard/usuarios" },
  {
    key: "administrativos",
    label: "Administrativos",
    href: "/dashboard/usuarios?rol=administrativos",
  },
  {
    key: "docentes",
    label: "Docentes",
    href: "/dashboard/usuarios?rol=docentes",
  },
  {
    key: "estudiantes",
    label: "Estudiantes",
    href: "/dashboard/usuarios?rol=estudiantes",
  },
];

function normalizeFilter(value: string | string[] | undefined): RolFilter {
  if (
    value === "administrativos" ||
    value === "docentes" ||
    value === "estudiantes"
  ) {
    return value;
  }
  return "todos";
}

/** Mapeo del filtro de la UI al rol que entiende el backend (`?role=`). */
const FILTER_TO_ROLE: Record<RolFilter, AdminUserRole | undefined> = {
  todos: undefined,
  administrativos: "ADMIN",
  docentes: "PROFESSOR",
  estudiantes: "STUDENT",
};

/** Sustantivo (singular/plural) para el subtítulo de cada filtro. */
function nounFor(filter: RolFilter, count: number): string {
  const singular = count === 1;
  switch (filter) {
    case "administrativos":
      return singular ? "administrativo" : "administrativos";
    case "docentes":
      return singular ? "docente" : "docentes";
    case "estudiantes":
      return singular ? "estudiante" : "estudiantes";
    default:
      return singular ? "usuario" : "usuarios";
  }
}

const EMPTY_TITLE: Record<RolFilter, string> = {
  todos: "Aún no hay usuarios.",
  administrativos: "Aún no hay administrativos.",
  docentes: "Aún no hay docentes.",
  estudiantes: "Aún no hay estudiantes.",
};

export default async function UsuariosAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ rol?: string | string[] }>;
}) {
  await requireAdmin();
  const { rol } = await searchParams;
  const filter = normalizeFilter(rol);
  const roleParam = FILTER_TO_ROLE[filter];

  // Los administrativos (ADMIN) son una vista de SOLO LECTURA: el módulo de
  // usuarios solo permite CREAR docentes/estudiantes (el DTO del backend excluye
  // ADMIN → 400). Por eso ocultamos el CTA de crear en ese filtro.
  const canCreate = filter !== "administrativos";

  let users: AdminUser[] = [];
  let loadError: string | null = null;
  try {
    users = await listAdminUsers(roleParam);
  } catch {
    loadError =
      "No se pudieron cargar los usuarios. Intenta recargar la página.";
  }

  const noun = nounFor(filter, users.length);

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {filter === "administrativos" ? "Administrativos" : "Usuarios"}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {loadError
              ? "Personas con acceso a la plataforma."
              : `${users.length} ${noun}.`}
          </p>
        </div>
        {canCreate && (
          <Button
            nativeButton={false}
            render={<Link href="/dashboard/usuarios/nuevo" />}
          >
            <Plus className="size-4" /> Crear usuario
          </Button>
        )}
      </div>

      {/* Filtro por rol — navegación por URL (?rol=...), sin estado de cliente. */}
      <nav
        aria-label="Filtrar usuarios por rol"
        className="mt-6 inline-flex items-center gap-1 rounded-lg bg-muted p-1"
      >
        {FILTERS.map((f) => {
          const active = f.key === filter;
          return (
            <Link
              key={f.key}
              href={f.href}
              aria-current={active ? "page" : undefined}
              className={
                active
                  ? "rounded-md bg-background px-3 py-1.5 text-sm font-medium text-foreground shadow-sm"
                  : "rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              }
            >
              {f.label}
            </Link>
          );
        })}
      </nav>

      {/* Aviso de solo-lectura para administrativos. */}
      {filter === "administrativos" && !loadError && (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Las cuentas administrativas se gestionan de forma interna. Desde aquí
          puedes consultarlas, pero no crear nuevas.
        </p>
      )}

      <div className="mt-4 rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Correo</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Creado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loadError && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-destructive"
                >
                  {loadError}
                </TableCell>
              </TableRow>
            )}

            {!loadError && users.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-14">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <span
                      className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground"
                      aria-hidden="true"
                    >
                      <Users className="size-5" />
                    </span>
                    <div>
                      <p className="font-medium">{EMPTY_TITLE[filter]}</p>
                      {canCreate && (
                        <p className="text-sm text-muted-foreground">
                          Crea el primero para empezar.
                        </p>
                      )}
                    </div>
                    {canCreate && (
                      <Button
                        nativeButton={false}
                        size="sm"
                        render={<Link href="/dashboard/usuarios/nuevo" />}
                      >
                        <Plus className="size-4" /> Crear usuario
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}

            {!loadError &&
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.firstName} {user.lastName}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.email}
                  </TableCell>
                  <TableCell>
                    <RoleBadge role={user.role} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge isActive={user.isActive} />
                  </TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">
                    {dateFmt.format(new Date(user.createdAt))}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        nativeButton={false}
                        render={
                          <Link
                            href={`/dashboard/usuarios/${user.id}`}
                            aria-label={`Editar ${user.firstName} ${user.lastName}`}
                          />
                        }
                        variant="ghost"
                        size="icon-sm"
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <DeleteButton
                        action={deleteUserAction.bind(null, user.id)}
                        confirmMessage={`¿Eliminar a "${user.firstName} ${user.lastName}"? Esta acción no se puede deshacer.`}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
