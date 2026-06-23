import { Award, BookOpen, CheckCircle2, Download, ScrollText } from "lucide-react";
import Link from "next/link";
import { requireUser } from "@/lib/auth-guard";
import {
  getKardex,
  type CourseStatus,
  type KardexCourse,
  type ModuleGradeStatus,
} from "@/lib/api/me";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Kárdex",
};

const COURSE_STATUS: Record<CourseStatus, { label: string; badge: string }> = {
  DRAFT: { label: "Borrador", badge: "bg-white/15 text-white/80" },
  ACTIVE: {
    label: "En curso",
    badge: "bg-emerald-400/20 text-emerald-100 ring-1 ring-emerald-300/30",
  },
  FINISHED: {
    label: "Concluido",
    badge: "bg-sky-400/20 text-sky-100 ring-1 ring-sky-300/30",
  },
  ARCHIVED: { label: "Archivado", badge: "bg-white/15 text-white/80" },
};

const GRADE_STATUS: Record<ModuleGradeStatus, { label: string; badge: string }> =
  {
    IN_PROGRESS: {
      label: "En curso",
      badge:
        "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    },
    PASSED: {
      label: "Aprobado",
      badge:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    },
    FAILED: {
      label: "Reprobado",
      badge: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
    },
  };

export default async function KardexPage() {
  await requireUser();
  const courses = await getKardex();

  return (
    <div>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            Kárdex
          </h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Tu historial académico: las notas de cada módulo en los cursos en
            los que estás inscrito.
          </p>
        </div>
        {courses.length > 0 && (
          <Link
            href="/kardex-pdf"
            target="_blank"
            className="inline-flex items-center gap-2 rounded-full border bg-background px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50"
          >
            <Download className="size-4" aria-hidden="true" />
            Descargar PDF
          </Link>
        )}
      </header>

      {courses.length === 0 ? (
        <div className="mt-8 flex flex-col items-center gap-3 rounded-3xl border border-dashed bg-muted/20 px-6 py-16 text-center">
          <span
            className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground"
            aria-hidden="true"
          >
            <ScrollText className="size-7" />
          </span>
          <p className="text-base font-medium text-foreground">
            Tu kárdex está vacío
          </p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Cuando te inscriban en un curso y obtengas notas, aparecerán aquí.
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          {courses.map((course) => (
            <KardexCourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}

function KardexCourseCard({ course }: { course: KardexCourse }) {
  const status = COURSE_STATUS[course.status];

  return (
    <section className="overflow-hidden rounded-3xl border bg-card shadow-sm">
      {/* Banda navy con resumen */}
      <div className="relative bg-gradient-to-br from-blue-900 to-blue-950 px-6 py-5 dark:from-slate-900 dark:to-slate-950">
        <div
          className="pointer-events-none absolute -right-10 -top-12 size-40 rounded-full bg-white/[0.06] blur-2xl"
          aria-hidden="true"
        />
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="font-mono text-xs font-medium tracking-wide text-white/60">
              {course.code}
            </span>
            <h2 className="font-heading text-xl font-bold tracking-tight text-white">
              {course.name}
            </h2>
          </div>
          <span
            className={cn(
              "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold",
              status.badge,
            )}
          >
            {status.label}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2.5">
          <Stat
            icon={Award}
            label="Promedio"
            value={course.average !== null ? String(course.average) : "—"}
          />
          <Stat
            icon={CheckCircle2}
            label="Aprobados"
            value={`${course.passedCount}/${course.moduleCount}`}
          />
          <Stat
            icon={BookOpen}
            label="Calificados"
            value={`${course.gradedCount}/${course.moduleCount}`}
          />
        </div>
      </div>

      {/* Módulos */}
      <ul className="divide-y">
        {course.modules.map((m) => {
          const grade = m.grade ? GRADE_STATUS[m.grade.status] : null;
          return (
            <li
              key={m.id}
              className="flex items-center gap-3 px-5 py-3.5"
            >
              <span
                aria-hidden="true"
                className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-xs font-semibold tabular-nums text-sky-700 dark:bg-sky-500/15 dark:text-sky-300"
              >
                {m.order}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{m.name}</p>
                {m.credits !== null && (
                  <p className="text-xs text-muted-foreground">
                    {m.credits} {m.credits === 1 ? "crédito" : "créditos"}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="font-heading text-lg font-bold tabular-nums">
                  {m.grade?.finalScore !== null &&
                  m.grade?.finalScore !== undefined
                    ? m.grade.finalScore
                    : "—"}
                </span>
                {grade ? (
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                      grade.badge,
                    )}
                  >
                    {grade.label}
                  </span>
                ) : (
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                    Sin nota
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Award;
  label: string;
  value: string;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-white/10">
      <Icon className="size-4 text-amber-300" aria-hidden="true" />
      <span className="text-xs text-white/70">{label}</span>
      <span className="font-heading text-sm font-bold tabular-nums text-white">
        {value}
      </span>
    </span>
  );
}
