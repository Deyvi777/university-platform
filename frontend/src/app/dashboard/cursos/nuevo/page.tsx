import { BackLink } from "@/components/dashboard/back-link";
import { requireAdmin } from "@/lib/auth-guard";
import { CourseForm } from "@/app/dashboard/cursos/course-form";

export default async function NuevoCursoPage() {
  await requireAdmin();

  return (
    <div>
      <BackLink href="/dashboard/cursos">Volver a programas</BackLink>
      <h1 className="mt-3 text-2xl font-bold tracking-tight">
        Crear programa
      </h1>
      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
        Completa la información general, ajusta la configuración y arma la malla
        de módulos. Después podrás asignar docentes e inscribir estudiantes.
      </p>
      <div className="mt-6">
        <CourseForm />
      </div>
    </div>
  );
}
