import { MessageSquareMore, ShieldCheck } from "lucide-react";
import { notFound } from "next/navigation";
import { BackLink } from "@/components/dashboard/back-link";
import { requireUser } from "@/lib/auth-guard";
import { getStudentTeacherEvaluation } from "@/lib/api/me";
import { TeacherEvaluationForm } from "./teacher-evaluation-form";

export const metadata = { title: "Evaluar docentes" };

export default async function StudentTeacherEvaluationPage({
  params,
}: {
  params: Promise<{ moduleId: string }>;
}) {
  const session = await requireUser();
  if (session.user.role !== "STUDENT") notFound();
  const { moduleId } = await params;
  const data = await getStudentTeacherEvaluation(moduleId);
  if (!data) notFound();

  return (
    <div className="mx-auto w-full max-w-4xl">
      <BackLink href={`/dashboard/aula/${moduleId}`}>Volver al aula</BackLink>

      <header className="mt-4 flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
          <MessageSquareMore className="size-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm text-muted-foreground">
            {data.module.course.name} · Módulo {data.module.order}
          </p>
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            Evaluación docente
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {data.module.name}
          </p>
        </div>
      </header>

      <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200">
        <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <p>
          Esta evaluación no es anónima. Tu identidad y tus respuestas serán
          visibles únicamente para los administradores de la plataforma.
        </p>
      </div>

      {!data.enabled ? (
        <div className="mt-5 rounded-2xl border border-dashed bg-muted/20 px-6 py-12 text-center text-sm text-muted-foreground">
          La evaluación docente no está disponible para este módulo.
        </div>
      ) : data.questions.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed bg-muted/20 px-6 py-12 text-center text-sm text-muted-foreground">
          El cuestionario institucional aún no fue configurado.
        </div>
      ) : data.teachers.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed bg-muted/20 px-6 py-12 text-center text-sm text-muted-foreground">
          Este módulo no tiene docentes asignados para evaluar.
        </div>
      ) : (
        <div className="mt-5 space-y-5">
          {data.teachers.map((teacher) => (
            <TeacherEvaluationForm
              key={teacher.id}
              moduleId={moduleId}
              teacher={teacher}
              questions={data.questions}
            />
          ))}
        </div>
      )}
    </div>
  );
}
