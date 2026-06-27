import { requireAdmin } from "@/lib/auth-guard";
import {
  listAdminUsers,
  type AdminUser,
  type AdminUserRole,
} from "@/lib/api/admin";
import { UsersTable } from "@/app/dashboard/usuarios/users-table";
import type { UserFormRole } from "@/app/dashboard/usuarios/user-schema";

type RolFilter = "todos" | "administrativos" | "docentes" | "estudiantes";

/** Título de la sección según el rol con el que se entró desde el sidebar. */
const PAGE_TITLE: Record<RolFilter, string> = {
  todos: "Usuarios",
  administrativos: "Administrativos",
  docentes: "Docentes",
  estudiantes: "Estudiantes",
};

/** Texto del botón "Crear ..." según la sección actual. */
const CREATE_LABEL: Record<RolFilter, string> = {
  todos: "Crear usuario",
  administrativos: "Crear usuario",
  docentes: "Crear docente",
  estudiantes: "Crear estudiante",
};

/** Rol con el que se crea desde cada sección (administrativos no crea). */
const CREATE_ROLE: Record<RolFilter, UserFormRole> = {
  todos: "PROFESSOR",
  administrativos: "PROFESSOR",
  docentes: "PROFESSOR",
  estudiantes: "STUDENT",
};

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

  if (loadError) {
    return (
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {PAGE_TITLE[filter]}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Personas con acceso a la plataforma.
        </p>
        <div className="mt-4 rounded-2xl border bg-card px-4 py-10 text-center text-destructive shadow-sm shadow-blue-950/[0.04] dark:shadow-none">
          {loadError}
        </div>
      </div>
    );
  }

  return (
    <div>
      <UsersTable
        users={users}
        canCreate={canCreate}
        createRole={CREATE_ROLE[filter]}
        createLabel={CREATE_LABEL[filter]}
        emptyTitle={EMPTY_TITLE[filter]}
        title={PAGE_TITLE[filter]}
        subtitle={`${users.length} ${noun}.`}
        showReadOnlyNotice={filter === "administrativos"}
        showBulkUpload={filter === "estudiantes"}
      />
    </div>
  );
}
