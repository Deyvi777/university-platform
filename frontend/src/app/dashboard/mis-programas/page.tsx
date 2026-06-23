import {
  BookOpen,
  CalendarDays,
  ChevronDown,
  GraduationCap,
  Layers,
  PlayCircle,
  Presentation,
} from "lucide-react";
import Link from "next/link";
import { requireUser } from "@/lib/auth-guard";
import {
  listMyCourses,
  type CourseStatus,
  type ModuleStatus,
  type MyCourse,
  type ProgramModule,
} from "@/lib/api/me";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Mis programas",
};

const COURSE_STATUS: Record<CourseStatus, { label: string; badge: string }> = {
  DRAFT: { label: "Borrador", badge: "bg-amber-400/20 text-amber-100 ring-1 ring-amber-300/30" },
  ACTIVE: { label: "En curso", badge: "bg-emerald-400/20 text-emerald-100 ring-1 ring-emerald-300/30" },
  FINISHED: { label: "Concluido", badge: "bg-sky-400/20 text-sky-100 ring-1 ring-sky-300/30" },
  ARCHIVED: { label: "Archivado", badge: "bg-white/15 text-white/80 ring-1 ring-white/20" },
};

const MODULE_STATUS: Record<ModuleStatus, { label: string; badge: string }> = {
  DRAFT: { label: "Borrador", badge: "bg-muted text-muted-foreground" },
  ACTIVE: {
    label: "En curso",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  },
  FINISHED: {
    label: "Concluido",
    badge: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
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

export default async function MyProgramsPage() {
  await requireUser();
  const courses = await listMyCourses();

  // El estudiante recibe los módulos en `modules`; nos quedamos con esos.
  const programs = courses.filter((c) => Array.isArray(c.modules));

  return (
    <div className="w-full">
      <header>
        <p className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
          <GraduationCap className="size-4" aria-hidden="true" />
          Aprendizaje
        </p>
        <h1 className="mt-0.5 font-heading text-2xl font-bold tracking-tight sm:text-3xl">
          Mis programas
        </h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          Tus programas inscritos y sus módulos. Abre un programa y entra a un
          módulo para ver sus lecciones en el aula.
        </p>
      </header>

      <div className="mt-8">
        {programs.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed bg-muted/20 px-6 py-16 text-center">
            <span
              className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground"
              aria-hidden="true"
            >
              <GraduationCap className="size-7" />
            </span>
            <p className="text-base font-medium text-foreground">
              Aún no estás inscrito en ningún programa
            </p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Cuando te inscriban en un programa, aparecerá aquí con todos sus
              módulos.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {programs.map((program, i) => (
              <ProgramAccordion
                key={program.id}
                program={program}
                defaultOpen={i === 0}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProgramAccordion({
  program,
  defaultOpen,
}: {
  program: MyCourse;
  defaultOpen: boolean;
}) {
  const status = COURSE_STATUS[program.status];
  const start = formatStart(program.startDate);
  const modules = program.modules ?? [];

  return (
    <details
      open={defaultOpen}
      className="group overflow-hidden rounded-3xl border bg-card shadow-sm shadow-blue-950/[0.04] dark:shadow-none"
    >
      {/* Cabecera navy */}
      <summary className="relative flex cursor-pointer list-none items-center gap-4 bg-gradient-to-br from-blue-900 to-blue-950 px-5 py-4 dark:from-slate-900 dark:to-slate-950 [&::-webkit-details-marker]:hidden">
        <span
          className="pointer-events-none absolute -right-8 -top-10 size-32 rounded-full bg-white/[0.06] blur-2xl"
          aria-hidden="true"
        />
        <span
          className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white ring-1 ring-white/15"
          aria-hidden="true"
        >
          <BookOpen className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-medium tracking-wide text-white/70">
              {program.code}
            </span>
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-[0.65rem] font-semibold",
                status.badge,
              )}
            >
              {status.label}
            </span>
          </div>
          <h2 className="mt-0.5 truncate font-heading text-base font-bold leading-tight text-white sm:text-lg">
            {program.name}
          </h2>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/70">
            {program.modality && (
              <span className="inline-flex items-center gap-1.5">
                <Presentation className="size-3.5" aria-hidden="true" />
                {program.modality}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <Layers className="size-3.5" aria-hidden="true" />
              {program.moduleCount}{" "}
              {program.moduleCount === 1 ? "módulo" : "módulos"}
            </span>
            {start && (
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="size-3.5" aria-hidden="true" />
                {start}
              </span>
            )}
          </div>
        </div>
        <ChevronDown
          className="size-5 shrink-0 text-white/70 transition-transform group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>

      {/* Lista de módulos */}
      <div className="border-t p-3 sm:p-4">
        {modules.length === 0 ? (
          <p className="rounded-xl border border-dashed bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
            Este programa todavía no tiene módulos.
          </p>
        ) : (
          <ol className="space-y-1.5">
            {modules.map((m) => (
              <ModuleRow key={m.id} module={m} />
            ))}
          </ol>
        )}
      </div>
    </details>
  );
}

function ModuleRow({ module: m }: { module: ProgramModule }) {
  const status = MODULE_STATUS[m.status];
  return (
    <li>
      <Link
        href={`/dashboard/aula/${m.id}`}
        className="group/row flex items-center gap-3 rounded-xl border bg-background px-4 py-3 transition-colors hover:border-primary/40 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 font-heading text-sm font-semibold tabular-nums text-primary"
          aria-hidden="true"
        >
          {m.order}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{m.name}</p>
          <span
            className={cn(
              "mt-0.5 inline-flex rounded-full px-2 py-0.5 text-[0.65rem] font-medium",
              status.badge,
            )}
          >
            {status.label}
          </span>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary opacity-0 transition-opacity group-hover/row:opacity-100">
          Entrar al aula
          <PlayCircle className="size-4" aria-hidden="true" />
        </span>
      </Link>
    </li>
  );
}
