import { CalendarClock, ClipboardList } from "lucide-react";
import { BackLink } from "@/components/dashboard/back-link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth-guard";
import { getActivityGrading } from "@/lib/api/teacher";
import { GradingRow } from "./grading-row";

export const metadata = {
  title: "Calificar actividad",
};

function formatDue(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString("es-BO", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function ActivityGradingPage({
  params,
}: {
  params: Promise<{ activityId: string }>;
}) {
  await requireUser();
  const { activityId } = await params;
  const data = await getActivityGrading(activityId);
  if (!data) {
    notFound();
  }

  const { activity, students } = data;
  const readOnly = activity.module.status === "FINISHED";
  const due = formatDue(activity.dueDate);
  const gradedCount = students.filter(
    (s) => s.submission?.status === "GRADED",
  ).length;

  return (
    <div className="w-full">
      <BackLink href={`/dashboard/modulos/${activity.module.id}`}>Volver al módulo</BackLink>

      <header className="mt-4 flex items-start gap-3">
        <span
          className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300"
          aria-hidden="true"
        >
          <ClipboardList className="size-5" />
        </span>
        <div>
          <p className="text-sm text-muted-foreground">
            {activity.course.name} · Módulo {activity.module.order}
          </p>
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            {activity.title}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span>Sobre {activity.maxScore}</span>
            {activity.weight > 0 && <span>Peso {activity.weight}%</span>}
            {due && (
              <span className="inline-flex items-center gap-1">
                <CalendarClock className="size-4" />
                {due}
              </span>
            )}
          </div>
        </div>
      </header>

      {activity.instructions && (
        <p className="mt-4 rounded-2xl border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
          {activity.instructions}
        </p>
      )}

      <div className="mt-6 flex items-baseline justify-between gap-3">
        <h2 className="font-heading text-lg font-semibold">Estudiantes</h2>
        <span className="text-sm text-muted-foreground">
          {gradedCount} de {students.length} calificados
        </span>
      </div>

      {students.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed bg-muted/20 px-6 py-12 text-center text-sm text-muted-foreground">
          No hay estudiantes inscritos en este programa todavía.
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {students.map((row) => (
            <GradingRow
              key={row.student.id}
              activityId={activity.id}
              maxScore={activity.maxScore}
              row={row}
              readOnly={readOnly}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
