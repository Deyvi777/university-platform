import { ArrowUpRight, CalendarDays, Layers, Presentation } from "lucide-react";
import Link from "next/link";
import { COURSE_ICONS, DEFAULT_COURSE_ICON } from "@/lib/course-icons";
import type { CourseStatus, MyCourse } from "@/lib/api/me";
import { cn } from "@/lib/utils";

const STATUS_META: Record<
  CourseStatus,
  { label: string; badge: string }
> = {
  DRAFT: {
    label: "Borrador",
    badge: "bg-amber-400/20 text-amber-100 ring-1 ring-amber-300/30",
  },
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

function formatStart(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("es-BO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Tarjeta de un curso asignado, para el home de docente/estudiante. Hero navy
 * con un icono grande (elegido por el admin) que identifica el programa, el
 * código y el estado; cuerpo con el nombre, modalidad y métricas. Para docentes
 * muestra además chips de los módulos a su cargo.
 */
export function CourseCard({ course }: { course: MyCourse }) {
  const status = STATUS_META[course.status];
  const start = formatStart(course.startDate);
  const isTeacher = course.myModules !== null;
  const myModules = course.myModules ?? [];
  const shownModules = myModules.slice(0, 3);
  const extraModules = myModules.length - shownModules.length;
  const Icon =
    (course.icon && COURSE_ICONS[course.icon]?.Icon) ||
    COURSE_ICONS[DEFAULT_COURSE_ICON].Icon;
  // El docente entra al detalle del curso; el estudiante va a "Mis programas"
  // (acordeón de programas → módulos → aula).
  const href = isTeacher
    ? `/dashboard/mis-cursos/${course.id}`
    : "/dashboard/mis-programas";

  return (
    <Link
      href={href}
      className="group flex min-h-[19rem] flex-col overflow-hidden rounded-3xl border bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-950/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50 dark:hover:shadow-black/40"
    >
      {/* Hero navy con icono grande */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-800 via-blue-900 to-blue-950 px-6 pb-6 pt-5 dark:from-slate-800 dark:via-slate-900 dark:to-slate-950">
        {/* Adornos de fondo */}
        <div
          className="pointer-events-none absolute -right-10 -top-12 size-40 rounded-full bg-white/[0.07] blur-2xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-16 -left-10 size-40 rounded-full bg-sky-400/10 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative flex items-start justify-between gap-3">
          <span className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-1 font-mono text-[11px] font-medium tracking-wide text-white/70 ring-1 ring-white/10">
            {course.code}
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

        {/* Icono grande del programa */}
        <div className="relative mt-5 flex items-center justify-between">
          <span
            className="flex size-20 items-center justify-center rounded-2xl bg-white/10 text-white shadow-lg shadow-blue-950/30 ring-1 ring-white/15 backdrop-blur-sm transition-transform duration-300 group-hover:scale-105"
            aria-hidden="true"
          >
            <Icon className="size-10" strokeWidth={1.75} />
          </span>
          <ArrowUpRight
            className="size-5 text-white/40 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-white/80"
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Cuerpo */}
      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-heading text-lg font-bold leading-snug tracking-tight transition-colors group-hover:text-blue-700 dark:group-hover:text-sky-300">
          {course.name}
        </h3>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
          {course.modality && (
            <span className="inline-flex items-center gap-1.5">
              <Presentation className="size-4 shrink-0" aria-hidden="true" />
              {course.modality}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5">
            <Layers className="size-4 shrink-0" aria-hidden="true" />
            {course.moduleCount}{" "}
            {course.moduleCount === 1 ? "módulo" : "módulos"}
          </span>
          {start && (
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-4 shrink-0" aria-hidden="true" />
              {start}
            </span>
          )}
        </div>

        {/* Módulos a cargo (docente) */}
        {isTeacher && myModules.length > 0 && (
          <div className="mt-auto border-t pt-4">
            <p className="text-xs font-medium text-muted-foreground">
              {myModules.length === 1
                ? "Módulo a tu cargo"
                : `${myModules.length} módulos a tu cargo`}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {shownModules.map((m) => (
                <span
                  key={m.id}
                  className="inline-flex max-w-full items-center gap-1 rounded-full bg-sky-100 px-2.5 py-1 text-xs font-medium text-sky-700 dark:bg-sky-500/15 dark:text-sky-300"
                >
                  <span className="truncate">{m.name}</span>
                </span>
              ))}
              {extraModules > 0 && (
                <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                  +{extraModules}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
