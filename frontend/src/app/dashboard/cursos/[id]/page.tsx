import { ArrowLeft, BookOpen, GraduationCap, Pencil } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth-guard";
import {
  AdminApiError,
  getAdminCourse,
  listAdminUsers,
  type AdminCourse,
  type AdminCourseUser,
} from "@/lib/api/admin";
import { Button } from "@/components/ui/button";
import { CourseStatusBadge } from "@/app/dashboard/cursos/course-badges";
import { ModuleTeachersControl } from "@/app/dashboard/cursos/module-teachers-control";
import { ModuleStatusControl } from "@/app/dashboard/cursos/module-status-control";
import { EnrollmentControl } from "@/app/dashboard/cursos/enrollment-control";

const dateFmt = new Intl.DateTimeFormat("es-BO", {
  timeZone: "UTC",
  day: "2-digit",
  month: "long",
  year: "numeric",
});

export default async function CursoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  let course: AdminCourse;
  try {
    course = await getAdminCourse(id);
  } catch (error) {
    if (error instanceof AdminApiError && error.status === 404) notFound();
    throw error;
  }

  // Listas para asignar/inscribir. Si fallan, se degradan a vacío (los controles
  // muestran su propio estado "sin docentes/estudiantes").
  const [professors, students] = await Promise.all([
    listAdminUsers("PROFESSOR").catch(() => [] as AdminCourseUser[]),
    listAdminUsers("STUDENT").catch(() => [] as AdminCourseUser[]),
  ]);

  const enrolledStudents = course.enrollments.map((e) => e.student);

  return (
    <div>
      <Link
        href="/dashboard/cursos"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Volver a programas
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{course.name}</h1>
            <CourseStatusBadge status={course.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            <span className="font-mono">{course.code}</span>
            {course.modality ? ` · ${course.modality}` : ""}
            {course.startDate
              ? ` · Inicio ${dateFmt.format(new Date(course.startDate))}`
              : ""}
          </p>
        </div>
        <Button
          nativeButton={false}
          size="sm"
          className="shadow-xs"
          render={<Link href={`/dashboard/cursos/${course.id}/editar`} />}
        >
          <Pencil className="size-4" /> Editar datos
        </Button>
      </div>

      {/* Módulos + docentes (co-docencia) */}
      <section className="mt-8" aria-labelledby="modulos">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
            <BookOpen className="size-4.5" />
          </span>
          <div>
            <h2 id="modulos" className="font-heading text-lg font-semibold">
              Módulos y docentes
            </h2>
            <p className="text-sm text-muted-foreground">
              Asigna uno o varios docentes a cargo de cada módulo.
            </p>
          </div>
        </div>
        {course.modules.length === 0 ? (
          <div className="mt-4 flex flex-col items-center gap-2 rounded-2xl border border-dashed bg-muted/20 px-4 py-10 text-center">
            <span className="flex size-10 items-center justify-center rounded-full bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
              <BookOpen className="size-5" />
            </span>
            <p className="text-sm text-muted-foreground">
              Este programa aún no tiene módulos.{" "}
              <Link
                href={`/dashboard/cursos/${course.id}/editar`}
                className="font-medium text-foreground underline underline-offset-2"
              >
                Edita el programa
              </Link>{" "}
              para agregarlos.
            </p>
          </div>
        ) : (
        <ol className="mt-4 space-y-3">
          {course.modules.map((m) => (
            <li
              key={m.id}
              className="rounded-2xl border bg-card p-4 shadow-xs transition-colors hover:border-sky-200 dark:hover:border-sky-500/40 sm:p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    aria-hidden
                    className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-sky-100 font-heading text-sm font-semibold tabular-nums text-sky-700 dark:bg-sky-500/15 dark:text-sky-300"
                  >
                    {m.order}
                  </span>
                  <div className="min-w-0">
                    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Módulo {m.order}
                    </span>
                    <h3 className="truncate font-heading text-base font-semibold leading-tight">
                      {m.name}
                    </h3>
                  </div>
                </div>
                <ModuleStatusControl
                  courseId={course.id}
                  moduleId={m.id}
                  status={m.status}
                />
              </div>
              <div className="mt-4 border-t pt-4">
                <ModuleTeachersControl
                  courseId={course.id}
                  moduleId={m.id}
                  professors={professors}
                  assignedIds={m.teachers.map((t) => t.teacher.id)}
                />
              </div>
            </li>
          ))}
        </ol>
        )}
      </section>

      {/* Estudiantes inscritos */}
      <section className="mt-10" aria-labelledby="estudiantes">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
            <GraduationCap className="size-4.5" />
          </span>
          <div>
            <h2 id="estudiantes" className="font-heading text-lg font-semibold">
              Estudiantes
            </h2>
            <p className="text-sm text-muted-foreground">
              Inscribe a los estudiantes que pueden cursar el programa.
            </p>
          </div>
        </div>
        <div className="mt-4">
          <EnrollmentControl
            courseId={course.id}
            students={students}
            enrolled={enrolledStudents}
          />
        </div>
      </section>
    </div>
  );
}
