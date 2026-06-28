"use client";

import { useState, type ReactNode } from "react";
import { BookOpen, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "modulos" | "estudiantes";

/**
 * Pestañas grandes (tipo tarjeta, mitad y mitad) del detalle de un programa
 * (admin): "Módulos y docentes" y "Estudiantes inscritos". Cada pestaña ocupa la
 * mitad superior; debajo se muestra el contenido de la activa. El contenido lo
 * arma el server component y se pasa como `modules`/`students` (ReactNode).
 */
export function CourseDetailTabs({
  moduleCount,
  studentCount,
  modules,
  students,
}: {
  moduleCount: number;
  studentCount: number;
  modules: ReactNode;
  students: ReactNode;
}) {
  const [tab, setTab] = useState<Tab>("modulos");

  return (
    <div className="mt-8">
      <div
        role="tablist"
        aria-label="Secciones del programa"
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4"
      >
        <TabCard
          active={tab === "modulos"}
          onClick={() => setTab("modulos")}
          icon={<BookOpen className="size-5" />}
          title="Módulos y docentes"
          subtitle="Asigna uno o varios docentes a cargo de cada módulo."
          count={moduleCount}
          controls="panel-modulos"
        />
        <TabCard
          active={tab === "estudiantes"}
          onClick={() => setTab("estudiantes")}
          icon={<GraduationCap className="size-5" />}
          title="Estudiantes inscritos"
          subtitle="Inscribe a los estudiantes que pueden cursar el programa."
          count={studentCount}
          controls="panel-estudiantes"
        />
      </div>

      <div
        id={tab === "modulos" ? "panel-modulos" : "panel-estudiantes"}
        role="tabpanel"
        className="mt-6"
      >
        {tab === "modulos" ? modules : students}
      </div>
    </div>
  );
}

function TabCard({
  active,
  onClick,
  icon,
  title,
  subtitle,
  count,
  controls,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  title: string;
  subtitle: string;
  count: number;
  controls: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      aria-controls={controls}
      onClick={onClick}
      className={cn(
        "flex items-start gap-3 rounded-2xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50 sm:p-5",
        active
          ? "border-sky-300 bg-sky-50 ring-1 ring-sky-200 dark:border-sky-500/50 dark:bg-sky-500/10 dark:ring-sky-500/30"
          : "border bg-card hover:border-sky-200 hover:bg-muted/30 dark:hover:border-sky-500/40",
      )}
    >
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors",
          active
            ? "bg-sky-600 text-white dark:bg-sky-500"
            : "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
        )}
        aria-hidden="true"
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h2
            className={cn(
              "font-heading text-lg font-semibold leading-tight",
              active ? "text-sky-900 dark:text-sky-100" : "text-foreground",
            )}
          >
            {title}
          </h2>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
              active
                ? "bg-sky-600 text-white dark:bg-sky-500"
                : "bg-muted text-muted-foreground",
            )}
          >
            {count}
          </span>
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
      </div>
    </button>
  );
}
