import { requireAdmin } from "@/lib/auth-guard";
import { listAdminUsers, type AdminUser } from "@/lib/api/admin";
import { StudentGradesTable } from "./students-grades-table";

export const metadata = {
  title: "Notas de estudiantes",
};

export default async function NotasEstudiantesPage() {
  await requireAdmin();

  let students: AdminUser[] = [];
  let loadError: string | null = null;
  try {
    students = await listAdminUsers("STUDENT");
  } catch {
    loadError =
      "No se pudieron cargar los estudiantes. Intenta recargar la página.";
  }

  if (loadError) {
    return (
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Notas de estudiantes
        </h1>
        <p className="mt-1 text-muted-foreground">
          Consulta el detalle de notas y el kárdex de cada estudiante.
        </p>
        <div className="mt-4 rounded-2xl border bg-card px-4 py-10 text-center text-destructive shadow-sm shadow-blue-950/[0.04] dark:shadow-none">
          {loadError}
        </div>
      </div>
    );
  }

  return <StudentGradesTable students={students} />;
}
