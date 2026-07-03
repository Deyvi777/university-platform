import {
  ChevronDown,
  LayoutList,
  PlayCircle,
  Settings2,
  Users,
} from "lucide-react";
import Link from "next/link";
import type {
  CourseModuleDetail,
  ModuleGradeStatus,
  ModuleStatus,
} from "@/lib/api/me";
import { cn } from "@/lib/utils";

const MODULE_STATUS: Record<ModuleStatus, { label: string; badge: string }> = {
  DRAFT: {
    label: "Borrador",
    badge: "bg-muted text-muted-foreground",
  },
  ACTIVE: {
    label: "En curso",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  },
  FINISHED: {
    label: "Concluido",
    badge: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  },
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

/**
 * Un módulo del curso como acordeón nativo (`<details>`, sin JS). El resumen
 * muestra orden, nombre, estado y —según el rol— "A tu cargo" o la nota. El
 * contenido lista descripción, docentes y un acceso al aula (estudiante) o a la
 * gestión de contenido (docente).
 */
export function CourseModuleItem({
  module,
  defaultOpen,
}: {
  module: CourseModuleDetail;
  courseId: string;
  defaultOpen?: boolean;
}) {
  const status = MODULE_STATUS[module.status];
  // Aprobado/reprobado solo si el módulo está concluido; activo → "En curso".
  const effectiveStatus = module.grade
    ? module.status === "FINISHED"
      ? module.grade.status
      : "IN_PROGRESS"
    : null;
  const grade = effectiveStatus ? GRADE_STATUS[effectiveStatus] : null;

  return (
    <details
      open={defaultOpen}
      className="group overflow-hidden rounded-2xl border bg-card shadow-sm shadow-blue-950/[0.04] dark:shadow-none"
    >
      <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-4 transition-colors hover:bg-muted/40 sm:px-5 [&::-webkit-details-marker]:hidden">
        <span
          aria-hidden="true"
          className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-sky-100 font-heading text-sm font-semibold tabular-nums text-sky-700 dark:bg-sky-500/15 dark:text-sky-300"
        >
          {module.order}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Módulo {module.order}
            </span>
            {module.mine && (
              <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[0.65rem] font-semibold text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
                A tu cargo
              </span>
            )}
          </div>
          <h3 className="truncate font-heading text-base font-semibold leading-tight">
            {module.name}
          </h3>
        </div>

        {grade ? (
          <span
            className={cn(
              "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold",
              grade.badge,
            )}
          >
            {grade.label}
            {module.grade?.finalScore !== null &&
              module.grade?.finalScore !== undefined &&
              ` · ${module.grade.finalScore}`}
          </span>
        ) : (
          <span
            className={cn(
              "hidden shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold sm:inline",
              status.badge,
            )}
          >
            {status.label}
          </span>
        )}

        <ChevronDown
          className="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>

      <div className="border-t px-4 py-4 sm:px-5">
        {module.description && (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {module.description}
          </p>
        )}

        {/* Docentes */}
        {module.teachers.length > 0 && (
          <div className="mt-4">
            <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Users className="size-3.5" aria-hidden="true" />
              {module.teachers.length === 1 ? "Docente" : "Docentes"}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {module.teachers.map((t) => {
                const initials = `${t.lastName} ${t.firstName}`
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((p) => p[0]?.toUpperCase() ?? "")
                  .join("");
                return (
                  <span
                    key={t.id}
                    className="inline-flex items-center gap-2 rounded-full border bg-background py-1 pl-1 pr-3"
                  >
                    <span
                      className="flex size-6 items-center justify-center rounded-full bg-blue-950 text-[0.6rem] font-bold text-amber-300"
                      aria-hidden="true"
                    >
                      {initials}
                    </span>
                    <span className="text-xs font-medium">
                      {t.lastName} {t.firstName}
                    </span>
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Conteo de contenidos + acceso */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <LayoutList className="size-3.5" aria-hidden="true" />
            {module.contentCount}{" "}
            {module.contentCount === 1 ? "contenido" : "contenidos"}
          </span>
          {module.mine ? (
            <Link
              href={`/dashboard/modulos/${module.id}`}
              className="inline-flex items-center gap-1.5 rounded-full bg-blue-950 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50 dark:bg-sky-600 dark:hover:bg-sky-500"
            >
              <Settings2 className="size-3.5" aria-hidden="true" />
              Gestionar contenido
            </Link>
          ) : (
            module.contentCount > 0 && (
              <Link
                href={`/dashboard/aula/${module.id}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-blue-950 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50 dark:bg-sky-600 dark:hover:bg-sky-500"
              >
                <PlayCircle className="size-3.5" aria-hidden="true" />
                Entrar al aula
              </Link>
            )
          )}
        </div>
      </div>
    </details>
  );
}
