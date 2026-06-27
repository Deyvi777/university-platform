import { BackLink } from "@/components/dashboard/back-link";
import { requireAdmin } from "@/lib/auth-guard";
import { UserForm } from "@/app/dashboard/usuarios/user-form";
import type { UserFormRole } from "@/app/dashboard/usuarios/user-schema";

/** Rol preseleccionado según la sección desde la que se llegó (?rol=...). */
function roleFromParam(value: string | string[] | undefined): UserFormRole {
  if (value === "docentes") return "PROFESSOR";
  return "STUDENT";
}

const TITLE: Record<UserFormRole, string> = {
  PROFESSOR: "Crear docente",
  STUDENT: "Crear estudiante",
};

/** Texto del enlace "Volver a ..." según el rol. */
const BACK_LABEL: Record<UserFormRole, string> = {
  PROFESSOR: "Volver a docentes",
  STUDENT: "Volver a estudiantes",
};

/** Sección a la que vuelve (enlace superior, cancelar y tras crear). */
const BACK_HREF: Record<UserFormRole, string> = {
  PROFESSOR: "/dashboard/usuarios?rol=docentes",
  STUDENT: "/dashboard/usuarios?rol=estudiantes",
};

export default async function NuevoUsuarioPage({
  searchParams,
}: {
  searchParams: Promise<{ rol?: string | string[] }>;
}) {
  await requireAdmin();
  const { rol } = await searchParams;
  const defaultRole = roleFromParam(rol);

  return (
    <div className="w-full">
      <BackLink href={BACK_HREF[defaultRole]}>{BACK_LABEL[defaultRole]}</BackLink>
      <h1 className="mt-3 text-2xl font-bold tracking-tight">
        {TITLE[defaultRole]}
      </h1>
      <p className="mt-1 text-muted-foreground">
        Registra un docente o estudiante. Recibirá acceso con el correo y la
        contraseña que definas.
      </p>
      <div className="mt-6">
        <UserForm defaultRole={defaultRole} backHref={BACK_HREF[defaultRole]} />
      </div>
    </div>
  );
}
