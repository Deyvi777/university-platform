import { CalendarClock, Download, Paperclip } from "lucide-react";
import { BackLink } from "@/components/dashboard/back-link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth-guard";
import { getActivityGrading } from "@/lib/api/teacher";
import { ACTIVITY_TYPES } from "@/lib/activity-types";
import { ForumThread } from "@/components/dashboard/forum-thread";
import { QuizManager } from "@/components/dashboard/quiz-manager";
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
  const typeMeta = ACTIVITY_TYPES[activity.type];
  const TypeIcon = typeMeta.Icon;
  const isForum = activity.type === "FORUM";
  const isQuiz = activity.type === "QUIZ" || activity.type === "EXAM";

  return (
    <div className="w-full">
      <BackLink href={`/dashboard/modulos/${activity.module.id}`}>Volver al módulo</BackLink>

      <header className="mt-4 flex items-start gap-3">
        <span
          className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ${typeMeta.tint}`}
          aria-hidden="true"
        >
          <TypeIcon className="size-5" />
        </span>
        <div>
          <p className="text-sm text-muted-foreground">
            {activity.course.name} · Módulo {activity.module.order}
          </p>
          <h1 className="flex flex-wrap items-center gap-2 font-heading text-2xl font-bold tracking-tight">
            {activity.title}
            {/* Examen de recuperación: nota mayor con tope de aprobación. */}
            {activity.recoveryStage && (
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  activity.recoveryStage === "SEGUNDA_INSTANCIA"
                    ? "bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300"
                    : "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"
                }`}
              >
                {activity.recoveryStage === "SEGUNDA_INSTANCIA"
                  ? "Segunda instancia"
                  : "Recuperatorio"}
              </span>
            )}
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

      {activity.activityFileUrl && (
        <a
          href={activity.activityFileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex max-w-full items-center gap-2 rounded-xl border bg-muted/20 px-4 py-3 text-sm font-medium text-primary transition-colors hover:bg-muted/40"
        >
          <Paperclip className="size-4 shrink-0" aria-hidden="true" />
          <span className="truncate">
            {activity.activityFileName || "Documento adjunto"}
          </span>
          <Download className="size-4 shrink-0" aria-hidden="true" />
        </a>
      )}

      {/* Foro: el docente lee y participa en el hilo; abajo califica la
          participación de cada estudiante con el flujo de notas normal. */}
      {isForum && (
        <section className="mt-6">
          <h2 className="mb-3 font-heading text-lg font-semibold">Discusión</h2>
          <ForumThread activityId={activity.id} />
        </section>
      )}

      {/* Cuestionario/Examen: el motor de preguntas (constructor + intentos +
          corrección de ensayos). La nota fluye sola a la libreta. */}
      {isQuiz ? (
        <QuizManager activityId={activity.id} />
      ) : (
        <>
          <div className="mt-6 flex items-baseline justify-between gap-3">
            <h2 className="font-heading text-lg font-semibold">
              {isForum ? "Calificación por participación" : "Estudiantes"}
            </h2>
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
                  activityTitle={activity.title}
                  maxScore={activity.maxScore}
                  row={row}
                  readOnly={readOnly}
                />
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
