import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth-guard";
import { AdminApiError, getAdminCourse } from "@/lib/api/admin";
import { CourseForm } from "@/app/dashboard/cursos/course-form";

export default async function EditarCursoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  let course;
  try {
    course = await getAdminCourse(id);
  } catch (error) {
    if (error instanceof AdminApiError && error.status === 404) notFound();
    throw error;
  }

  return (
    <div>
      <Link
        href={`/dashboard/cursos/${id}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Volver al programa
      </Link>
      <h1 className="mt-3 text-2xl font-bold tracking-tight">
        Editar programa
      </h1>
      <p className="mt-1 text-muted-foreground">
        Actualiza los datos y los módulos. Quitar un módulo elimina sus docentes
        asignados y notas.
      </p>
      <div className="mt-6">
        <CourseForm course={course} />
      </div>
    </div>
  );
}
