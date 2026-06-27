import { Award, BookOpen, CheckCircle2 } from "lucide-react";
import type {
  CourseStatus,
  KardexCourse,
  ModuleGradeStatus,
} from "@/lib/api/me";
import { cn } from "@/lib/utils";

/**
 * Tarjeta de curso del kárdex (banda navy + lista de módulos con su nota).
 * Presentacional (sin APIs de servidor), por eso la comparten la página del
 * kárdex del estudiante y el modal "Ver kárdex" del panel del ADMIN — así el
 * admin ve exactamente lo mismo que el estudiante en su panel.
 */

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

export function KardexCourseCard({ course }: { course: KardexCourse }) {
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
          // Aprobado/reprobado solo si el módulo está concluido; activo → "En curso".
          const effectiveStatus = m.grade
            ? m.status === "FINISHED"
              ? m.grade.status
              : "IN_PROGRESS"
            : null;
          const grade = effectiveStatus ? GRADE_STATUS[effectiveStatus] : null;
          return (
            <li key={m.id} className="flex items-center gap-3 px-5 py-3.5">
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
