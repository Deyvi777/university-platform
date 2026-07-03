import { BackLink } from "@/components/dashboard/back-link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth-guard";
import {
  AdminApiError,
  getAdminUser,
  type AdminUserRole,
} from "@/lib/api/admin";
import { UserForm } from "@/app/dashboard/usuarios/user-form";

/** Sección de origen según el rol del usuario editado (enlace superior + cancelar). */
const BACK_HREF: Record<AdminUserRole, string> = {
  ADMIN: "/dashboard/usuarios?rol=administrativos",
  PROFESSOR: "/dashboard/usuarios?rol=docentes",
  STUDENT: "/dashboard/usuarios?rol=estudiantes",
};

const BACK_LABEL: Record<AdminUserRole, string> = {
  ADMIN: "Volver a administrativos",
  PROFESSOR: "Volver a docentes",
  STUDENT: "Volver a estudiantes",
};

export default async function EditarUsuarioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  let user;
  try {
    user = await getAdminUser(id);
  } catch (error) {
    if (error instanceof AdminApiError && error.status === 404) notFound();
    throw error;
  }

  const backHref = BACK_HREF[user.role];

  return (
    <div className="w-full">
      <BackLink href={backHref}>{BACK_LABEL[user.role]}</BackLink>
      <h1 className="mt-3 text-2xl font-bold tracking-tight">Editar usuario</h1>
      <p className="mt-1 text-muted-foreground">
        {user.lastName} {user.firstName} · {user.email}
      </p>
      <div className="mt-6">
        <UserForm user={user} backHref={backHref} />
      </div>
    </div>
  );
}
