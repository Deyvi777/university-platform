import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth-guard";
import { AdminApiError, getAdminUser } from "@/lib/api/admin";
import { UserForm } from "@/app/dashboard/usuarios/user-form";

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

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/dashboard/usuarios"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Volver a usuarios
      </Link>
      <h1 className="mt-3 text-2xl font-bold tracking-tight">Editar usuario</h1>
      <p className="mt-1 text-muted-foreground">
        {user.firstName} {user.lastName} · {user.email}
      </p>
      <div className="mt-6">
        <UserForm user={user} />
      </div>
    </div>
  );
}
