import { MessageSquareMore } from "lucide-react";
import { requireAdmin } from "@/lib/auth-guard";
import {
  getTeacherEvaluationQuestionnaire,
  listTeacherEvaluationResults,
} from "@/lib/api/admin";
import { TeacherEvaluationsDashboard } from "./teacher-evaluations-dashboard";

export const metadata = { title: "Evaluaciones docentes" };

export default async function TeacherEvaluationsPage() {
  await requireAdmin();
  const [questions, results] = await Promise.all([
    getTeacherEvaluationQuestionnaire(),
    listTeacherEvaluationResults(),
  ]);

  return (
    <div>
      <header className="flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
          <MessageSquareMore className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            Evaluaciones docentes
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Configura el cuestionario común para todos los módulos y consulta
            las respuestas identificadas de los estudiantes.
          </p>
        </div>
      </header>

      <TeacherEvaluationsDashboard
        initialQuestions={questions}
        results={results}
      />
    </div>
  );
}
