"use client";

import { CheckCircle2, Loader2, Send, Star } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { StudentTeacherEvaluationData } from "@/lib/api/me";
import {
  submitTeacherEvaluationAction,
  type EvaluationAnswerPayload,
} from "./actions";

type AnswerState = Record<
  string,
  { scaleValue?: number; selectedOptions: string[]; textValue?: string }
>;

export function TeacherEvaluationForm({
  moduleId,
  teacher,
  questions,
}: {
  moduleId: string;
  teacher: StudentTeacherEvaluationData["teachers"][number];
  questions: StudentTeacherEvaluationData["questions"];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [answers, setAnswers] = useState<AnswerState>(() =>
    Object.fromEntries(
      questions.map((question) => [question.id, { selectedOptions: [] }]),
    ),
  );

  function update(
    questionId: string,
    patch: Partial<AnswerState[string]>,
  ) {
    setAnswers((current) => ({
      ...current,
      [questionId]: { ...current[questionId], ...patch },
    }));
  }

  function submit() {
    const missing = questions.find((question) => {
      if (!question.required) return false;
      const answer = answers[question.id];
      if (question.type === "SCALE_1_5") return !answer?.scaleValue;
      if (question.type === "TEXT") return !answer?.textValue?.trim();
      return !answer?.selectedOptions.length;
    });
    if (missing) {
      toast.error(`Responde la pregunta ${missing.order}`);
      return;
    }

    const payload: EvaluationAnswerPayload[] = questions.map((question) => ({
      questionId: question.id,
      scaleValue: answers[question.id]?.scaleValue ?? null,
      selectedOptions: answers[question.id]?.selectedOptions ?? [],
      textValue: answers[question.id]?.textValue?.trim() || null,
    }));

    startTransition(async () => {
      const result = await submitTeacherEvaluationAction(
        moduleId,
        teacher.id,
        payload,
      );
      if (result.ok) {
        toast.success(`Evaluación de ${teacher.lastName} ${teacher.firstName} enviada`);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  if (teacher.submittedAt) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 dark:border-emerald-500/30 dark:bg-emerald-500/10">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="size-6 text-emerald-600 dark:text-emerald-300" />
          <div>
            <h2 className="font-heading font-semibold">
              {teacher.lastName} {teacher.firstName}
            </h2>
            <p className="text-sm text-emerald-700 dark:text-emerald-200">
              Evaluación enviada correctamente.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="rounded-2xl border bg-card p-4 shadow-sm shadow-blue-950/[0.04] sm:p-6 dark:shadow-none">
      <header className="border-b pb-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-violet-600 dark:text-violet-300">
          Docente a evaluar
        </p>
        <h2 className="mt-1 font-heading text-lg font-semibold">
          {teacher.lastName} {teacher.firstName}
        </h2>
        <p className="text-sm text-muted-foreground">{teacher.email}</p>
      </header>

      <ol className="mt-5 space-y-6">
        {questions.map((question) => {
          const answer = answers[question.id];
          return (
            <li key={question.id}>
              <p className="text-sm font-medium">
                {question.order}. {question.prompt}
                {question.required && (
                  <span className="ml-1 text-destructive" aria-label="obligatoria">
                    *
                  </span>
                )}
              </p>

              {question.type === "SCALE_1_5" && (
                <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label={question.prompt}>
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={answer?.scaleValue === value}
                      onClick={() => update(question.id, { scaleValue: value })}
                      className={cn(
                        "flex size-11 items-center justify-center gap-1 rounded-xl border text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                        answer?.scaleValue === value
                          ? "border-amber-400 bg-amber-400 text-slate-950 shadow-sm"
                          : "bg-background hover:border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-500/10",
                      )}
                    >
                      <Star className="size-3.5" aria-hidden="true" /> {value}
                    </button>
                  ))}
                </div>
              )}

              {question.type === "TEXT" && (
                <Textarea
                  className="mt-3 min-h-28"
                  value={answer?.textValue ?? ""}
                  onChange={(event) =>
                    update(question.id, { textValue: event.target.value })
                  }
                  placeholder="Escribe tu respuesta…"
                />
              )}

              {(question.type === "SINGLE_CHOICE" ||
                question.type === "MULTIPLE_CHOICE") && (
                <div className="mt-3 space-y-2">
                  {question.options.map((option) => {
                    const selected = answer?.selectedOptions.includes(option);
                    return (
                      <label
                        key={option}
                        className="flex cursor-pointer items-start gap-3 rounded-xl border bg-background px-3 py-2.5 text-sm transition-colors hover:bg-muted/40"
                      >
                        <input
                          type={
                            question.type === "SINGLE_CHOICE" ? "radio" : "checkbox"
                          }
                          name={`teacher-${teacher.id}-question-${question.id}`}
                          checked={selected}
                          onChange={() => {
                            const next =
                              question.type === "SINGLE_CHOICE"
                                ? [option]
                                : selected
                                  ? answer.selectedOptions.filter(
                                      (current) => current !== option,
                                    )
                                  : [...(answer?.selectedOptions ?? []), option];
                            update(question.id, { selectedOptions: next });
                          }}
                          className="mt-0.5 size-4 accent-primary"
                        />
                        <span>{option}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </li>
          );
        })}
      </ol>

      <div className="mt-6 flex justify-end border-t pt-4">
        <Button
          onClick={submit}
          disabled={pending}
          className="bg-amber-500 font-semibold text-slate-950 hover:bg-amber-400"
        >
          {pending ? <Loader2 className="animate-spin" /> : <Send />}
          Enviar evaluación
        </Button>
      </div>
    </section>
  );
}
