import { GraduationCap, Pencil, Plus, Users } from "lucide-react";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth-guard";
import { listAdminCourses, type AdminCourseListItem } from "@/lib/api/admin";
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
import { deleteCourseAction } from "@/app/dashboard/cursos/actions";
import { CourseStatusBadge } from "@/app/dashboard/cursos/course-badges";

const dateFmt = new Intl.DateTimeFormat("es-BO", {
  timeZone: "UTC",
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export default async function CursosAdminPage() {
  await requireAdmin();

  let courses: AdminCourseListItem[] = [];
  let loadError: string | null = null;
  try {
    courses = await listAdminCourses();
  } catch {
    loadError =
      "No se pudieron cargar los programas. Intenta recargar la página.";
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Programas</h1>
          <p className="mt-1 text-muted-foreground">
            {loadError
              ? "Programas académicos con docentes y estudiantes."
              : `${courses.length} ${courses.length === 1 ? "programa" : "programas"}.`}
          </p>
        </div>
        <Button
          nativeButton={false}
          render={<Link href="/dashboard/cursos/nuevo" />}
        >
          <Plus className="size-4" /> Crear programa
        </Button>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border bg-card shadow-sm shadow-blue-950/[0.04] dark:shadow-none">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Programa</TableHead>
              <TableHead>Código</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-center">Módulos</TableHead>
              <TableHead className="text-center">Inscritos</TableHead>
              <TableHead>Inicio</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loadError && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-10 text-center text-destructive"
                >
                  {loadError}
                </TableCell>
              </TableRow>
            )}

            {!loadError && courses.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-14">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <span
                      className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground"
                      aria-hidden="true"
                    >
                      <GraduationCap className="size-5" />
                    </span>
                    <div>
                      <p className="font-medium">Aún no hay programas.</p>
                      <p className="text-sm text-muted-foreground">
                        Crea el primero para empezar.
                      </p>
                    </div>
                    <Button
                      nativeButton={false}
                      size="sm"
                      render={<Link href="/dashboard/cursos/nuevo" />}
                    >
                      <Plus className="size-4" /> Crear programa
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {!loadError &&
              courses.map((course) => (
                <TableRow key={course.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/dashboard/cursos/${course.id}`}
                      className="hover:underline"
                    >
                      {course.name}
                    </Link>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {course.code}
                  </TableCell>
                  <TableCell>
                    <CourseStatusBadge status={course.status} />
                  </TableCell>
                  <TableCell className="text-center tabular-nums">
                    {course._count.modules}
                  </TableCell>
                  <TableCell className="text-center tabular-nums">
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <Users className="size-3.5" aria-hidden="true" />
                      {course._count.enrollments}
                    </span>
                  </TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">
                    {course.startDate
                      ? dateFmt.format(new Date(course.startDate))
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        nativeButton={false}
                        render={
                          <Link
                            href={`/dashboard/cursos/${course.id}`}
                            aria-label={`Gestionar ${course.name}`}
                          />
                        }
                        variant="ghost"
                        size="icon-sm"
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <DeleteButton
                        action={deleteCourseAction.bind(null, course.id)}
                        confirmMessage={`¿Eliminar el programa "${course.name}"? Se borrarán sus módulos, asignaciones e inscripciones. Esta acción no se puede deshacer.`}
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
