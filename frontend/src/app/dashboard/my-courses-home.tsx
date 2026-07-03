import { GraduationCap } from "lucide-react";
import { CourseCard } from "@/components/dashboard/course-card";
import type { MyCourse } from "@/lib/api/me";

/**
 * Home de PROFESSOR / STUDENT: bienvenida + grid de los cursos asignados (los
 * que dicta el docente o en los que está inscrito el estudiante). Estado vacío
 * cuando todavía no tiene ninguno.
 */
export function MyCoursesHome({
  firstName,
  greeting,
  intro,
  courses,
  emptyTitle,
  emptyDescription,
}: {
  firstName?: string | null;
  greeting: string;
  intro: string;
  courses: MyCourse[];
  emptyTitle: string;
  emptyDescription: string;
}) {

  return (
    <div>
      <header>
        <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          {firstName ? `${greeting}, ${firstName}` : greeting}
        </h1>
        <p className="mt-2 max-w-xl text-muted-foreground">{intro}</p>
      </header>

      <section aria-labelledby="mis-cursos" className="mt-8">
        <div className="flex items-baseline gap-2">
          <h2 id="mis-cursos" className="font-heading text-lg font-semibold">
            Mis cursos
          </h2>
          {courses.length > 0 && (
            <span className="text-lg font-semibold text-muted-foreground">
              ({courses.length})
            </span>
          )}
        </div>

        {courses.length === 0 ? (
          <div className="mt-4 flex flex-col items-center gap-3 rounded-3xl border border-dashed bg-muted/20 px-6 py-16 text-center">
            <span
              className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground"
              aria-hidden="true"
            >
              <GraduationCap className="size-7" />
            </span>
            <p className="text-base font-medium text-foreground">
              {emptyTitle}
            </p>
            <p className="max-w-sm text-sm text-muted-foreground">
              {emptyDescription}
            </p>
          </div>
        ) : (
          <div className="mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
