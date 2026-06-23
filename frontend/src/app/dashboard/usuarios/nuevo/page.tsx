import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth-guard";
import { UserForm } from "@/app/dashboard/usuarios/user-form";

export default async function NuevoUsuarioPage() {
  await requireAdmin();

  return (
    <div className="w-full">
      <Link
        href="/dashboard/usuarios"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Volver a usuarios
      </Link>
      <h1 className="mt-3 text-2xl font-bold tracking-tight">Crear usuario</h1>
      <p className="mt-1 text-muted-foreground">
        Registra un docente o estudiante. Recibirá acceso con el correo y la
        contraseña que definas.
      </p>
      <div className="mt-6">
        <UserForm />
      </div>
    </div>
  );
}
