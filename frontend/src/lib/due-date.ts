/**
 * Urgencia de una fecha límite de entrega, para teñir la fecha según el tiempo
 * restante (más llamativo cuanto menos falta). Compartido por la tarjeta de
 * actividad del estudiante (Tarea/Proyecto), el foro y la portada del
 * cuestionario/examen.
 *
 * `now` se recibe como argumento (los componentes cliente lo obtienen con
 * `useMemo(() => Date.now(), [])` — la regla `react-hooks/purity` no permite
 * llamarlo directo en render).
 */

export type DueUrgency = "relaxed" | "soon" | "critical" | "overdue";

const DAY_MS = 24 * 60 * 60 * 1000;

export function dueUrgency(iso: string | null, now: number): DueUrgency | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  const left = t - now;
  if (left < 0) return "overdue";
  if (left <= DAY_MS) return "critical";
  if (left <= 3 * DAY_MS) return "soon";
  return "relaxed";
}

/** Píldora tintada por urgencia: verde (con tiempo) → ámbar (≤3 días) →
 * rosa (≤24 h) → rosa fuerte con borde (plazo vencido). */
export const DUE_URGENCY_CLS: Record<DueUrgency, string> = {
  relaxed:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  soon: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  critical: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  overdue:
    "bg-rose-100 text-rose-700 ring-1 ring-rose-300 dark:bg-rose-500/20 dark:text-rose-200 dark:ring-rose-500/40",
};

/** "19 jul, 11:59 p. m." — fecha + hora local, corta pero completa. */
export function formatDueDateTime(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString("es-BO", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
