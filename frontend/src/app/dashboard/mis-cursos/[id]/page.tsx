import {
  BookOpen,
  CalendarDays,
  GraduationCap,
  Layers,
  Presentation,
} from "lucide-react";
import { BackLink } from "@/components/dashboard/back-link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth-guard";
import { getMyCourse, type CourseStatus } from "@/lib/api/me";
import { cn } from "@/lib/utils";
import { CourseModuleItem } from "./course-module-item";

export const metadata = {
  title: "Curso",
};

const COURSE_STATUS: Record<CourseStatus, { label: string; badge: string }> = {
  DRAFT: { label: "Borrador", badge: "bg-amber-400/20 text-amber-100 ring-1 ring-amber-300/30" },
  ACTIVE: {
    label: "En curso",
    badge: "bg-emerald-400/20 text-emerald-100 ring-1 ring-emerald-300/30",
  },
  FINISHED: {
    label: "Concluido",
    badge: "bg-sky-400/20 text-sky-100 ring-1 ring-sky-300/30",
  },
  ARCHIVED: {
    label: "Archivado",
    badge: "bg-white/15 text-white/80 ring-1 ring-white/20",
  },
};

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("es-BO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function MyCourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;
  const course = await getMyCourse(id);
  if (!course) {
    notFound();
  }

  const status = COURSE_STATUS[course.status];
  const start = formatDate(course.startDate);
  const end = formatDate(course.endDate);
  const dateRange =
    start && end ? `${start} – ${end}` : start ? `Desde ${start}` : null;

  return (
    <div className="w-full">
      <BackLink href="/dashboard">Volver al panel</BackLink>

      {/* Cabecera del curso */}
      <section className="mt-4 overflow-hidden rounded-3xl border bg-card shadow-sm">
        <div className="relative flex items-start justify-between gap-3 bg-gradient-to-br from-blue-900 to-blue-950 px-6 py-5 dark:from-slate-900 dark:to-slate-950">
          <div
            className="pointer-events-none absolute -right-10 -top-12 size-40 rounded-full bg-white/[0.06] blur-2xl"
            aria-hidden="true"
          />
          <span className="flex items-center gap-2.5 text-white">
            <span
              className="flex size-10 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15"
              aria-hidden="true"
            >
              <BookOpen className="size-5" />
            </span>
            <span className="font-mono text-xs font-medium tracking-wide text-white/70">
              {course.code}
            </span>
          </span>
          <span
            className={cn(
              "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold",
              status.badge,
            )}
          >
            {status.label}
          </span>
        </div>

        <div className="p-6">
          <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
            {course.name}
          </h1>
          {course.description && (
            <p className="mt-2 max-w-2xl text-muted-foreground">
              {course.description}
            </p>
          )}

          <dl className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
            {course.modality && (
              <div className="inline-flex items-center gap-1.5">
                <Presentation className="size-4 shrink-0" aria-hidden="true" />
                <dt className="sr-only">Modalidad</dt>
                <dd>{course.modality}</dd>
              </div>
            )}
            <div className="inline-flex items-center gap-1.5">
              <Layers className="size-4 shrink-0" aria-hidden="true" />
              <dt className="sr-only">Módulos</dt>
              <dd>
                {course.modules.length}{" "}
                {course.modules.length === 1 ? "módulo" : "módulos"}
              </dd>
            </div>
            {dateRange && (
              <div className="inline-flex items-center gap-1.5">
                <CalendarDays className="size-4 shrink-0" aria-hidden="true" />
                <dt className="sr-only">Fechas</dt>
                <dd>{dateRange}</dd>
              </div>
            )}
            <div className="inline-flex items-center gap-1.5">
              <GraduationCap className="size-4 shrink-0" aria-hidden="true" />
              <dt className="sr-only">Nota mínima de aprobación</dt>
              <dd>Aprobación: {course.passingScore}</dd>
            </div>
          </dl>
        </div>
      </section>

      {/* Módulos */}
      <section aria-labelledby="modulos" className="mt-8">
        <h2 id="modulos" className="font-heading text-lg font-semibold">
          Módulos
        </h2>

        {course.modules.length === 0 ? (
          <div className="mt-4 flex flex-col items-center gap-2 rounded-2xl border border-dashed bg-muted/20 px-6 py-12 text-center">
            <span
              className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground"
              aria-hidden="true"
            >
              <Layers className="size-6" />
            </span>
            <p className="text-sm font-medium text-foreground">
              Este curso aún no tiene módulos
            </p>
          </div>
        ) : (
          <ol className="mt-4 space-y-3">
            {course.modules.map((module, i) => (
              <li key={module.id}>
                <CourseModuleItem
                  module={module}
                  courseId={course.id}
                  defaultOpen={i === 0}
                />
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
