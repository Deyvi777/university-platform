import { Clock, MapPin } from "lucide-react";
import type { ClassSession } from "@/lib/api/teacher";
import { cn } from "@/lib/utils";

const MONTHS = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

/** "2026-07-14" → "lunes, 14 de julio de 2026" (fecha local, sin zona horaria). */
export function prettySessionDate(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const wd = date.toLocaleDateString("es-BO", { weekday: "long" });
  return `${wd}, ${d} de ${MONTHS[m - 1]} de ${y}`;
}

/** "YYYY-MM-DD" de una fecha en hora local (para comparar con `ClassSession.date`). */
export function localDateKey(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Rango horario legible: "19:00 – 21:00" o solo la hora de inicio. */
export function sessionTimeRange(s: {
  startTime: string;
  endTime: string | null;
}): string {
  return s.endTime ? `${s.startTime} – ${s.endTime}` : s.startTime;
}

/**
 * Lista de solo lectura del cronograma de clases de un módulo (vista del
 * estudiante en el aula). Las clases pasadas se atenúan y la siguiente por
 * venir se marca como "Próxima". `today` es "YYYY-MM-DD" en hora local, lo
 * calcula el consumidor (regla `react-hooks/purity`: no `new Date()` en render).
 */
export function ClassScheduleList({
  sessions,
  today,
}: {
  sessions: ClassSession[];
  today: string;
}) {
  const nextId = sessions.find((s) => s.date >= today)?.id ?? null;

  return (
    <ol className="space-y-1.5">
      {sessions.map((s) => {
        const past = s.date < today;
        const isNext = s.id === nextId;
        return (
          <li
            key={s.id}
            className={cn(
              "rounded-xl border px-3 py-2",
              isNext
                ? "border-sky-300 bg-sky-50 dark:border-sky-500/40 dark:bg-sky-500/10"
                : "bg-card",
              past && "opacity-60",
            )}
          >
            <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs font-semibold capitalize">
              {prettySessionDate(s.date)}
              {isNext && (
                <span className="rounded-full bg-sky-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-700 dark:text-sky-300">
                  Próxima
                </span>
              )}
            </p>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1 tabular-nums">
                <Clock className="size-3.5" aria-hidden="true" />
                {sessionTimeRange(s)}
              </span>
              {s.location && (
                <span className="inline-flex min-w-0 items-center gap-1">
                  <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
                  <span className="truncate">{s.location}</span>
                </span>
              )}
            </p>
            {s.title && (
              <p className="mt-0.5 text-xs text-foreground/80">{s.title}</p>
            )}
          </li>
        );
      })}
    </ol>
  );
}
