"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  Eye,
  GripVertical,
  ListChecks,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type {
  QuestionType,
  QuizAttemptsList,
  QuizEditor,
  QuizReviewQuestion,
} from "@/lib/api/me";
import { QuizBulkImport } from "@/components/dashboard/quiz-bulk-import";
import { cn } from "@/lib/utils";

const TYPE_LABELS: Record<QuestionType, string> = {
  SINGLE_CHOICE: "Opción múltiple (una correcta)",
  MULTIPLE_CHOICE: "Opción múltiple (varias correctas)",
  TRUE_FALSE: "Verdadero / Falso",
  SHORT_TEXT: "Respuesta corta",
  ESSAY: "Respuesta abierta (ensayo)",
};

export type EditOption = { key: string; text: string; isCorrect: boolean };
export type EditQuestion = {
  key: string;
  type: QuestionType;
  prompt: string;
  points: string;
  boolAnswer: boolean | null;
  acceptedText: string; // una respuesta aceptada por línea
  options: EditOption[];
};

let counter = 0;
const uid = () => `q-${Date.now()}-${counter++}`;

function newQuestion(): EditQuestion {
  return {
    key: uid(),
    type: "SINGLE_CHOICE",
    prompt: "",
    points: "1",
    boolAnswer: true,
    acceptedText: "",
    options: [
      { key: uid(), text: "", isCorrect: true },
      { key: uid(), text: "", isCorrect: false },
    ],
  };
}

export function QuizManager({ activityId }: { activityId: string }) {
  const [tab, setTab] = useState<"questions" | "attempts">("questions");

  return (
    <section className="mt-6">
      <div className="mb-3 flex items-center gap-2">
        <h2 className="font-heading text-lg font-semibold">Cuestionario</h2>
        <div className="ml-auto inline-flex rounded-lg border p-0.5 text-sm">
          <button
            type="button"
            onClick={() => setTab("questions")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1",
              tab === "questions"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground",
            )}
          >
            <ListChecks className="size-4" /> Preguntas
          </button>
          <button
            type="button"
            onClick={() => setTab("attempts")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1",
              tab === "attempts"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground",
            )}
          >
            <Users className="size-4" /> Intentos
          </button>
        </div>
      </div>
      {tab === "questions" ? (
        <QuestionBuilder activityId={activityId} />
      ) : (
        <AttemptsPanel activityId={activityId} />
      )}
    </section>
  );
}

function QuestionBuilder({ activityId }: { activityId: string }) {
  const qc = useQueryClient();
  const queryKey = ["me-quiz-editor", activityId];
  const [items, setItems] = useState<EditQuestion[] | null>(null);

  const { data, isLoading } = useQuery<QuizEditor>({
    queryKey,
    queryFn: async () => {
      const res = await fetch(`/api/me/quiz/${activityId}/editor`);
      if (!res.ok) throw new Error("No se pudo cargar");
      const data: QuizEditor = await res.json();
      // Inicializa el estado local una sola vez con lo del servidor.
      setItems(
        data.questions.map((q) => ({
          key: q.id,
          type: q.type,
          prompt: q.prompt,
          points: String(q.points),
          boolAnswer: q.boolAnswer,
          acceptedText: q.acceptedAnswers.join("\n"),
          options: q.options.map((o) => ({
            key: o.id,
            text: o.text,
            isCorrect: o.isCorrect,
          })),
        })),
      );
      return data;
    },
  });

  const saveMut = useMutation({
    mutationFn: async (questions: EditQuestion[]) => {
      const payload = {
        questions: questions.map((q) => ({
          type: q.type,
          prompt: q.prompt.trim(),
          points: Number(q.points) || 0,
          boolAnswer: q.type === "TRUE_FALSE" ? q.boolAnswer : null,
          acceptedAnswers:
            q.type === "SHORT_TEXT"
              ? q.acceptedText
                  .split("\n")
                  .map((s) => s.trim())
                  .filter(Boolean)
              : [],
          options:
            q.type === "SINGLE_CHOICE" || q.type === "MULTIPLE_CHOICE"
              ? q.options.map((o) => ({
                  text: o.text.trim(),
                  isCorrect: o.isCorrect,
                }))
              : [],
        })),
      };
      const res = await fetch(`/api/me/quiz/${activityId}/questions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const m = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(m.message ?? "No se pudo guardar");
      }
    },
    onSuccess: () => {
      toast.success("Preguntas guardadas");
      qc.invalidateQueries({ queryKey });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading || items === null) {
    return (
      <div className="flex items-center gap-2 rounded-xl border bg-background p-6 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Cargando preguntas…
      </div>
    );
  }

  function update(key: string, patch: Partial<EditQuestion>) {
    setItems((prev) =>
      (prev ?? []).map((q) => (q.key === key ? { ...q, ...patch } : q)),
    );
  }
  function remove(key: string) {
    setItems((prev) => (prev ?? []).filter((q) => q.key !== key));
  }
  function add() {
    setItems((prev) => [...(prev ?? []), newQuestion()]);
  }

  // Con intentos rendidos el banco queda bloqueado: editarlo destruiría las
  // respuestas de los estudiantes (el backend también lo rechaza con 409).
  const locked = (data?.attemptCount ?? 0) > 0;

  return (
    <div className="space-y-3">
      {locked && (
        <p className="rounded-xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
          Ya hay intentos de estudiantes: las preguntas quedaron bloqueadas para
          no invalidar las notas emitidas.
        </p>
      )}
      {items.length === 0 && (
        <p className="rounded-xl border border-dashed bg-muted/20 px-6 py-8 text-center text-sm text-muted-foreground">
          Aún no hay preguntas. Agrega la primera.
        </p>
      )}

      <fieldset disabled={locked} className="min-w-0 disabled:opacity-70">
      <ol className="space-y-3">
        {items.map((q, i) => (
          <li key={q.key} className="rounded-xl border bg-background p-4">
            <div className="flex items-center gap-2">
              <GripVertical className="size-4 text-muted-foreground" />
              <span className="text-sm font-medium">Pregunta {i + 1}</span>
              <select
                value={q.type}
                onChange={(e) =>
                  update(q.key, { type: e.target.value as QuestionType })
                }
                className="ml-auto h-8 rounded-lg border bg-background px-2 text-sm"
              >
                {Object.entries(TYPE_LABELS).map(([v, label]) => (
                  <option key={v} value={v}>
                    {label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => remove(q.key)}
                className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                aria-label="Eliminar pregunta"
              >
                <Trash2 className="size-4" />
              </button>
            </div>

            <Textarea
              value={q.prompt}
              onChange={(e) => update(q.key, { prompt: e.target.value })}
              placeholder="Enunciado de la pregunta…"
              className="mt-2 min-h-16 bg-background"
            />

            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Puntaje</span>
              <Input
                type="number"
                min={0}
                value={q.points}
                onChange={(e) => update(q.key, { points: e.target.value })}
                className="h-8 w-24"
              />
            </div>

            {/* Editor según tipo */}
            <div className="mt-3">
              {(q.type === "SINGLE_CHOICE" || q.type === "MULTIPLE_CHOICE") && (
                <OptionsEditor question={q} onChange={(patch) => update(q.key, patch)} />
              )}

              {q.type === "TRUE_FALSE" && (
                <div className="flex gap-2 text-sm">
                  {[
                    { label: "Verdadero", value: true },
                    { label: "Falso", value: false },
                  ].map((opt) => (
                    <label
                      key={opt.label}
                      className={cn(
                        "inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5",
                        q.boolAnswer === opt.value
                          ? "border-primary bg-primary/5"
                          : "",
                      )}
                    >
                      <input
                        type="radio"
                        name={`tf-${q.key}`}
                        checked={q.boolAnswer === opt.value}
                        onChange={() => update(q.key, { boolAnswer: opt.value })}
                        className="size-4 accent-primary"
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              )}

              {q.type === "SHORT_TEXT" && (
                <div>
                  <span className="text-xs text-muted-foreground">
                    Respuestas aceptadas (una por línea; sin distinguir
                    mayúsculas/acentos)
                  </span>
                  <Textarea
                    value={q.acceptedText}
                    onChange={(e) =>
                      update(q.key, { acceptedText: e.target.value })
                    }
                    placeholder={"respuesta 1\nrespuesta 2"}
                    className="mt-1 min-h-16 bg-background"
                  />
                </div>
              )}

              {q.type === "ESSAY" && (
                <p className="text-xs text-muted-foreground">
                  Respuesta abierta: la corriges tú en la pestaña “Intentos”.
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
      </fieldset>

      {!locked && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={add}>
              <Plus className="size-4" /> Agregar pregunta
            </Button>
            <QuizBulkImport
              onImport={(qs) => setItems((prev) => [...(prev ?? []), ...qs])}
            />
          </div>
          <Button
            type="button"
            size="sm"
            disabled={saveMut.isPending}
            onClick={() => saveMut.mutate(items)}
          >
            {saveMut.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            Guardar preguntas
          </Button>
        </div>
      )}
    </div>
  );
}

function OptionsEditor({
  question,
  onChange,
}: {
  question: EditQuestion;
  onChange: (patch: Partial<EditQuestion>) => void;
}) {
  const multiple = question.type === "MULTIPLE_CHOICE";

  function setOption(key: string, patch: Partial<EditOption>) {
    onChange({
      options: question.options.map((o) =>
        o.key === key ? { ...o, ...patch } : o,
      ),
    });
  }
  function pickCorrect(key: string) {
    onChange({
      options: question.options.map((o) => ({
        ...o,
        isCorrect: multiple ? o.isCorrect : o.key === key,
      })),
    });
  }

  return (
    <div className="space-y-1.5">
      {question.options.map((o) => (
        <div key={o.key} className="flex items-center gap-2">
          <input
            type={multiple ? "checkbox" : "radio"}
            name={`opt-${question.key}`}
            checked={o.isCorrect}
            onChange={() =>
              multiple
                ? setOption(o.key, { isCorrect: !o.isCorrect })
                : pickCorrect(o.key)
            }
            className="size-4 accent-primary"
            aria-label="Correcta"
          />
          <Input
            value={o.text}
            onChange={(e) => setOption(o.key, { text: e.target.value })}
            placeholder="Texto de la opción"
            className="h-8"
          />
          <button
            type="button"
            onClick={() =>
              onChange({
                options: question.options.filter((x) => x.key !== o.key),
              })
            }
            className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            aria-label="Quitar opción"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      ))}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() =>
          onChange({
            options: [
              ...question.options,
              { key: uid(), text: "", isCorrect: false },
            ],
          })
        }
      >
        <Plus className="size-3.5" /> Opción
      </Button>
    </div>
  );
}

function AttemptsPanel({ activityId }: { activityId: string }) {
  const { data, isLoading } = useQuery<QuizAttemptsList>({
    queryKey: ["me-quiz-attempts", activityId],
    queryFn: async () => {
      const res = await fetch(`/api/me/quiz/${activityId}/attempts`);
      if (!res.ok) throw new Error("No se pudo cargar");
      return res.json();
    },
  });

  if (isLoading || !data) {
    return (
      <div className="flex items-center gap-2 rounded-xl border bg-background p-6 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Cargando intentos…
      </div>
    );
  }

  if (data.attempts.length === 0) {
    return (
      <p className="rounded-xl border border-dashed bg-muted/20 px-6 py-8 text-center text-sm text-muted-foreground">
        Ningún estudiante ha rendido todavía.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {data.attempts.map((a) => (
        <AttemptRow
          key={a.attemptId}
          activityId={activityId}
          attemptId={a.attemptId}
          name={`${a.student.lastName} ${a.student.firstName}`}
          status={a.status}
          score={a.totalScore}
          maxScore={data.activity.maxScore}
        />
      ))}
    </ul>
  );
}

function AttemptRow({
  activityId,
  attemptId,
  name,
  status,
  score,
  maxScore,
}: {
  activityId: string;
  attemptId: string;
  name: string;
  status: "IN_PROGRESS" | "SUBMITTED" | "GRADED";
  score: number | null;
  maxScore: number;
}) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [grades, setGrades] = useState<Record<string, string>>({});

  const { data, isLoading } = useQuery<{
    activity: { id: string; title: string };
    review: QuizReviewQuestion[];
  }>({
    queryKey: ["me-quiz-attempt", attemptId],
    queryFn: async () => {
      const res = await fetch(`/api/me/quiz/attempts/${attemptId}`);
      if (!res.ok) throw new Error("No se pudo cargar el intento");
      return res.json();
    },
    enabled: open,
  });

  const gradeMut = useMutation({
    mutationFn: async () => {
      const essays = (data?.review ?? []).filter((q) => q.type === "ESSAY");
      const payload = {
        grades: essays.map((q) => ({
          questionId: q.id,
          points: Number(grades[q.id] ?? q.answer?.pointsAwarded ?? 0) || 0,
        })),
      };
      const res = await fetch(
        `/api/me/quiz/attempts/${attemptId}/grade-essays`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (!res.ok) {
        const m = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(m.message ?? "No se pudo guardar");
      }
    },
    onSuccess: () => {
      toast.success("Ensayos calificados");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["me-quiz-attempts", activityId] });
      qc.invalidateQueries({ queryKey: ["me-quiz-attempt", attemptId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const statusMeta = {
    IN_PROGRESS: { label: "En curso", cls: "bg-muted text-muted-foreground" },
    SUBMITTED: {
      label: "Por corregir",
      cls: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    },
    GRADED: {
      label: "Calificado",
      cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    },
  }[status];

  const essays = (data?.review ?? []).filter((q) => q.type === "ESSAY");

  return (
    <li className="flex items-center gap-3 rounded-xl border bg-background p-3">
      <span className="text-sm font-medium">{name}</span>
      <span
        className={cn(
          "rounded-full px-2 py-0.5 text-[0.65rem] font-semibold",
          statusMeta.cls,
        )}
      >
        {statusMeta.label}
      </span>
      <span className="ml-auto text-sm tabular-nums text-muted-foreground">
        {score != null ? `${score} / ${maxScore}` : "—"}
      </span>
      {status !== "IN_PROGRESS" &&
        (status === "SUBMITTED" ? (
          <Button
            type="button"
            size="sm"
            className="bg-amber-600 text-white hover:bg-amber-700"
            onClick={() => setOpen(true)}
          >
            <Pencil className="size-4" /> Corregir
          </Button>
        ) : (
          <Button type="button" size="sm" onClick={() => setOpen(true)}>
            <Eye className="size-4" /> Ver
          </Button>
        ))}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{name}</DialogTitle>
            <DialogDescription>
              Respuestas del estudiante — {score != null ? `${score} / ${maxScore}` : "sin calificar"}
              {status === "SUBMITTED" && " · pendiente de corregir ensayos"}
            </DialogDescription>
          </DialogHeader>

          {isLoading || !data ? (
            <p className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Cargando…
            </p>
          ) : (
            <div className="space-y-3">
              {data.review.map((q, i) => (
                <div key={q.id} className="rounded-lg border p-3 text-sm">
                  <p className="font-medium">
                    {i + 1}. {q.prompt}{" "}
                    <span className="text-xs text-muted-foreground">
                      ({q.points} pt{q.points === 1 ? "" : "s"})
                    </span>
                  </p>
                  {q.type === "ESSAY" ? (
                    <div className="mt-1.5">
                      <p className="rounded bg-muted/40 px-3 py-2 whitespace-pre-wrap text-foreground/80">
                        {q.answer?.textValue || "(sin respuesta)"}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          Puntaje
                        </span>
                        <Input
                          type="number"
                          min={0}
                          max={q.points}
                          // Controlado (no defaultValue): el modal carga las
                          // respuestas async, y un defaultValue que cambia tras
                          // montarse dispara el warning de Base UI (uncontrolled
                          // → controlled). El valor inicial es el puntaje ya
                          // asignado; luego lo gobierna `grades`.
                          value={grades[q.id] ?? String(q.answer?.pointsAwarded ?? 0)}
                          onChange={(e) =>
                            setGrades((prev) => ({
                              ...prev,
                              [q.id]: e.target.value,
                            }))
                          }
                          className="h-8 w-24"
                        />
                        <span className="text-xs text-muted-foreground">
                          / {q.points}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p
                      className={cn(
                        "mt-1 inline-flex items-center gap-1 text-xs",
                        q.answer?.isCorrect
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-muted-foreground",
                      )}
                    >
                      <CheckCircle2 className="size-3.5" />
                      {q.answer?.pointsAwarded ?? 0}/{q.points} pts
                    </p>
                  )}
                </div>
              ))}

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setOpen(false)}
                >
                  Cerrar
                </Button>
                {essays.length > 0 && (
                  <Button
                    type="button"
                    size="sm"
                    disabled={gradeMut.isPending}
                    onClick={() => gradeMut.mutate()}
                  >
                    {gradeMut.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Save className="size-4" />
                    )}
                    Guardar calificación
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </li>
  );
}
