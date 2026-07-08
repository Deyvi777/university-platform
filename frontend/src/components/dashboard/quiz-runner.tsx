"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  CalendarClock,
  CalendarPlus,
  CheckCircle2,
  Clock,
  ListChecks,
  Loader2,
  RotateCcw,
  Send,
  Timer,
  Trophy,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type {
  QuizRunner as QuizRunnerData,
  QuizReviewQuestion,
  QuizRunnerQuestion,
  SavedQuizAnswer,
} from "@/lib/api/me";
import { DUE_URGENCY_CLS, dueUrgency, formatDueDateTime } from "@/lib/due-date";
import { cn } from "@/lib/utils";

type AnswerState = {
  selectedOptionIds: string[];
  boolValue: boolean | null;
  textValue: string;
};

function fmtRemaining(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function QuizRunner({ activityId }: { activityId: string }) {
  const qc = useQueryClient();
  const queryKey = ["me-quiz", activityId];

  const { data, isLoading } = useQuery<QuizRunnerData>({
    queryKey,
    queryFn: async () => {
      const res = await fetch(`/api/me/quiz/${activityId}`);
      if (!res.ok) throw new Error("No se pudo cargar el cuestionario");
      return res.json();
    },
    // No refetchear por foco de ventana ni marcar como obsoleto pronto: si el
    // estudiante cambia de pestaña a mitad del intento, el formulario NO debe
    // remontarse (perdería las respuestas ya elegidas).
    refetchOnWindowFocus: false,
    staleTime: 5 * 60_000,
  });

  const startMut = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/me/quiz/${activityId}/start`, {
        method: "POST",
      });
      if (!res.ok) {
        const m = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(m.message ?? "No se pudo iniciar");
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey }),
    onError: (e: Error) => toast.error(e.message),
  });

  // "Ahora" fijado una vez por montaje, para teñir el cierre por urgencia.
  const now = useMemo(() => new Date().getTime(), []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-xl border bg-background p-6 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Cargando…
      </div>
    );
  }
  // Solo error duro cuando NO hay datos en caché (un error de refetch en segundo
  // plano no debe desmontar el formulario en curso).
  if (!data) {
    return (
      <div className="rounded-xl border bg-background p-6 text-sm text-muted-foreground">
        No se pudo cargar el cuestionario.
      </div>
    );
  }

  const isExam = data.activity.type === "EXAM";
  const noun = isExam ? "examen" : "cuestionario";

  // Intento en curso → formulario de resolución (con cronómetro), restaurando
  // lo autoguardado si el estudiante recargó la página.
  if (data.attempt?.status === "IN_PROGRESS" && data.questions) {
    return (
      <QuizForm
        activityId={activityId}
        questions={data.questions}
        deadline={data.attempt.deadline ?? null}
        savedAnswers={data.savedAnswers}
        onSubmitted={() => qc.invalidateQueries({ queryKey })}
      />
    );
  }

  // Intento enviado, pendiente de corrección de ensayos.
  if (data.attempt?.status === "SUBMITTED") {
    return (
      <StateCard
        icon={<Clock className="size-5" />}
        tone="amber"
        title="Tu intento fue enviado"
        text="Tiene preguntas abiertas que el docente debe corregir. Tu nota aparecerá cuando termine la revisión."
      />
    );
  }

  // Intento calificado. Si admite varios intentos y sigue abierto, se puede
  // volver a rendir (el nuevo intento reemplaza la nota).
  if (data.attempt?.status === "GRADED") {
    return (
      <div className="space-y-4">
        <StateCard
          icon={<Trophy className="size-5" />}
          tone="emerald"
          title={isExam ? "Examen calificado" : "Cuestionario calificado"}
          text={
            data.attempt.score != null
              ? `Obtuviste ${data.attempt.score} de ${data.activity.maxScore}.${
                  data.activity.recoveryStage
                    ? " Esta nota reemplaza tu nota final del módulo."
                    : ""
                }`
              : "Tu intento fue calificado."
          }
        />
        {data.canStart && (
          <Button
            type="button"
            variant="outline"
            disabled={startMut.isPending}
            onClick={() => startMut.mutate()}
          >
            {startMut.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RotateCcw className="size-4" />
            )}
            Intentar de nuevo
          </Button>
        )}
        {data.review && data.review.length > 0 && (
          <ReviewList review={data.review} />
        )}
      </div>
    );
  }

  // Sin intento: portada con ajustes + botón de inicio.
  return (
    <div className="rounded-xl border bg-background p-5">
      <div className="flex items-center gap-2">
        <span className="flex size-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
          <ListChecks className="size-5" />
        </span>
        <div>
          <p className="font-medium">{data.activity.title}</p>
          <p className="text-xs text-muted-foreground">
            {data.activity.questionCount}{" "}
            {data.activity.questionCount === 1 ? "pregunta" : "preguntas"} ·
            sobre {data.activity.maxScore}
          </p>
        </div>
      </div>

      {/* Examen de recuperación: la nota obtenida reemplaza la del módulo. */}
      {data.activity.recoveryStage && (
        <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
          Este es tu examen de{" "}
          {data.activity.recoveryStage === "SEGUNDA_INSTANCIA"
            ? "segunda instancia"
            : "recuperatorio"}
          : la nota que obtengas <strong>reemplazará tu nota final del módulo</strong>.
        </p>
      )}

      {data.activity.instructions && (
        <p className="mt-3 text-sm text-muted-foreground">
          {data.activity.instructions}
        </p>
      )}

      {/* Ventana de disponibilidad: desde cuándo se puede rendir y el cierre
          (teñido por urgencia: verde → ámbar → rosa según lo que falte). */}
      {(() => {
        const from = formatDueDateTime(data.settings.availableFrom);
        const until = formatDueDateTime(data.settings.availableUntil);
        const untilUrgency = dueUrgency(data.settings.availableUntil, now);
        if (!from && !until) return null;
        return (
          <div className="mt-3.5 flex flex-wrap gap-2">
            {from && (
              <p className="inline-flex items-center gap-1.5 rounded-lg bg-sky-100 px-2.5 py-1 text-xs font-medium text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
                <CalendarPlus className="size-3.5 shrink-0" aria-hidden="true" />
                <span>
                  Disponible desde: <span className="font-semibold">{from}</span>
                </span>
              </p>
            )}
            {until && untilUrgency && (
              <p
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium",
                  DUE_URGENCY_CLS[untilUrgency],
                )}
              >
                <CalendarClock
                  className="size-3.5 shrink-0"
                  aria-hidden="true"
                />
                <span>
                  Fecha y hora límite:{" "}
                  <span className="font-semibold">{until}</span>
                  {untilUrgency === "overdue" && " · cerrado"}
                </span>
              </p>
            )}
          </div>
        );
      })()}

      <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
        {data.settings.timeLimitMin != null && (
          <li className="flex items-center gap-2">
            <Timer className="size-4" /> Tiempo límite:{" "}
            {data.settings.timeLimitMin} min (una vez iniciado)
          </li>
        )}
        {data.settings.singleAttempt && (
          <li className="flex items-center gap-2">
            <AlertCircle className="size-4" /> Tienes un solo intento.
          </li>
        )}
        {data.settings.shuffle && (
          <li className="flex items-center gap-2">
            <ListChecks className="size-4" /> Las preguntas se presentan en orden
            aleatorio.
          </li>
        )}
      </ul>

      {data.moduleFinished ? (
        <p className="mt-4 text-sm text-muted-foreground">
          El módulo está concluido.
        </p>
      ) : !data.open ? (
        <p className="mt-4 text-sm text-amber-600 dark:text-amber-400">
          El {noun} no está disponible en este momento.
        </p>
      ) : data.activity.questionCount === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          El docente aún no agregó preguntas.
        </p>
      ) : (
        <Button
          type="button"
          className="mt-4"
          disabled={startMut.isPending}
          onClick={() => startMut.mutate()}
        >
          {startMut.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
          Comenzar {noun}
        </Button>
      )}
    </div>
  );
}

function QuizForm({
  activityId,
  questions,
  deadline,
  savedAnswers,
  onSubmitted,
}: {
  activityId: string;
  questions: QuizRunnerQuestion[];
  deadline: string | null;
  savedAnswers?: SavedQuizAnswer[];
  onSubmitted: () => void;
}) {
  const [answers, setAnswers] = useState<Record<string, AnswerState>>(() => {
    // Restaura el autoguardado del servidor (si el estudiante recargó la
    // página o volvió tras un corte, sus respuestas siguen aquí).
    const saved = new Map((savedAnswers ?? []).map((a) => [a.questionId, a]));
    return Object.fromEntries(
      questions.map((q) => {
        const s = saved.get(q.id);
        return [
          q.id,
          {
            selectedOptionIds: s?.selectedOptionIds ?? [],
            boolValue: s?.boolValue ?? null,
            textValue: s?.textValue ?? "",
          },
        ];
      }),
    );
  });
  // Espejo en ref de `answers`: el envío lo lee desde aquí para no depender del
  // closure del render (evita mandar respuestas vacías por cierres obsoletos).
  const answersRef = useRef(answers);
  // El restante lo fija el efecto del cronómetro en su primer tick (no se puede
  // llamar Date.now() en render — regla react-hooks/purity).
  const [remaining, setRemaining] = useState<number | null>(null);
  const submittedRef = useRef(false);

  function answersPayload() {
    const current = answersRef.current;
    return {
      answers: questions.map((q) => ({
        questionId: q.id,
        selectedOptionIds: current[q.id]?.selectedOptionIds ?? [],
        boolValue: current[q.id]?.boolValue ?? null,
        textValue: current[q.id]?.textValue || null,
      })),
    };
  }

  // Autoguardado progresivo (sin calificar): si el intento vence sin envío —
  // corte de luz/internet, pestaña cerrada — el servidor califica lo guardado
  // en vez de poner 0. Silencioso: nunca molesta al estudiante con errores.
  const autosaveMut = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/me/quiz/${activityId}/answers`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(answersPayload()),
      });
      if (!res.ok) throw new Error("autosave");
    },
    onError: () => {},
  });

  // Actualiza estado + ref a la vez (la escritura del ref ocurre dentro del
  // updater de setState, en un manejador de eventos, no en render).
  function commit(updater: (prev: Record<string, AnswerState>) => Record<string, AnswerState>) {
    setAnswers((prev) => {
      const next = updater(prev);
      answersRef.current = next;
      return next;
    });
  }

  // Debounce del autoguardado: cada cambio de `answers` agenda un guardado y
  // cancela el anterior (refs solo en efectos — regla react-hooks/refs).
  useEffect(() => {
    const id = setTimeout(() => {
      if (!submittedRef.current) autosaveMut.mutate();
    }, 2500);
    return () => clearTimeout(id);
    // autosaveMut es estable (referencia de react-query); answers gobierna el debounce.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers]);

  const submitMut = useMutation({
    mutationFn: async (auto: boolean) => {
      const res = await fetch(`/api/me/quiz/${activityId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(answersPayload()),
      });
      if (!res.ok) {
        const m = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(m.message ?? "No se pudo enviar");
      }
      const body = (await res.json().catch(() => ({}))) as {
        expired?: boolean;
      };
      return { auto, expired: body.expired ?? false };
    },
    onSuccess: ({ auto, expired }) => {
      // `expired`: llegó pasada la fecha límite + gracia → el servidor cerró
      // el intento calificando lo autoguardado (el envío tardío no cuenta).
      if (expired) {
        toast.warning(
          "El tiempo había expirado: se calificó con tus respuestas autoguardadas",
        );
      } else {
        toast.success(
          auto ? "Tiempo agotado: intento enviado" : "Intento enviado",
        );
      }
      onSubmitted();
    },
    onError: (e: Error) => {
      submittedRef.current = false;
      toast.error(e.message);
    },
  });

  // Cronómetro: actualiza el restante y auto-envía al llegar a cero.
  useEffect(() => {
    if (!deadline) return;
    const tick = () => {
      const ms = new Date(deadline).getTime() - Date.now();
      setRemaining(ms);
      if (ms <= 0 && !submittedRef.current) {
        submittedRef.current = true;
        submitMut.mutate(true);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
    // submitMut es estable (referencia de react-query); deadline gobierna el efecto.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deadline]);

  // Al ocultarse/cerrarse la pestaña, un último autoguardado con `keepalive`
  // (sobrevive al cierre) para no perder lo respondido desde el último debounce.
  useEffect(() => {
    const flush = () => {
      if (submittedRef.current) return;
      void fetch(`/api/me/quiz/${activityId}/answers`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(answersPayload()),
        keepalive: true,
      }).catch(() => {});
    };
    window.addEventListener("pagehide", flush);
    return () => window.removeEventListener("pagehide", flush);
    // answersPayload lee refs estables; activityId es fijo por montaje.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const emptyAnswer = (): AnswerState => ({
    selectedOptionIds: [],
    boolValue: null,
    textValue: "",
  });

  function setAnswer(qid: string, patch: Partial<AnswerState>) {
    commit((prev) => ({
      ...prev,
      [qid]: { ...(prev[qid] ?? emptyAnswer()), ...patch },
    }));
  }

  function toggleOption(qid: string, optId: string, multiple: boolean) {
    commit((prev) => {
      const base = prev[qid] ?? emptyAnswer();
      const cur = base.selectedOptionIds;
      const next = multiple
        ? cur.includes(optId)
          ? cur.filter((id) => id !== optId)
          : [...cur, optId]
        : [optId];
      return { ...prev, [qid]: { ...base, selectedOptionIds: next } };
    });
  }

  function confirmSubmit() {
    if (submittedRef.current) return;
    submittedRef.current = true;
    submitMut.mutate(false);
  }

  const lowTime = remaining != null && remaining <= 60_000;

  return (
    <div className="space-y-4">
      {remaining != null && (
        <div
          className={cn(
            "sticky top-2 z-10 flex items-center justify-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold tabular-nums shadow-sm",
            lowTime
              ? "border-destructive bg-destructive/10 text-destructive"
              : "border-border bg-background",
          )}
        >
          <Timer className="size-4" /> {fmtRemaining(remaining)}
        </div>
      )}

      <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        {autosaveMut.isPending ? (
          <>
            <Loader2 className="size-3 animate-spin" /> Guardando…
          </>
        ) : (
          <>
            <CheckCircle2 className="size-3" /> Tus respuestas se guardan
            automáticamente
          </>
        )}
      </p>

      <ol className="space-y-4">
        {questions.map((q, i) => (
          <li key={q.id} className="rounded-xl border bg-background p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium">
                {i + 1}. {q.prompt}
              </p>
              <span className="shrink-0 text-xs text-muted-foreground">
                {q.points} pt{q.points === 1 ? "" : "s"}
              </span>
            </div>

            <div className="mt-3 space-y-2">
              {(q.type === "SINGLE_CHOICE" || q.type === "MULTIPLE_CHOICE") &&
                q.options.map((o) => {
                  const selected =
                    answers[q.id]?.selectedOptionIds.includes(o.id) ?? false;
                  return (
                    <label
                      key={o.id}
                      className={cn(
                        "flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-sm transition-colors",
                        selected
                          ? "border-primary bg-primary/5"
                          : "hover:bg-accent",
                      )}
                    >
                      <input
                        type={
                          q.type === "MULTIPLE_CHOICE" ? "checkbox" : "radio"
                        }
                        name={`q-${q.id}`}
                        checked={selected}
                        onChange={() =>
                          toggleOption(
                            q.id,
                            o.id,
                            q.type === "MULTIPLE_CHOICE",
                          )
                        }
                        className="size-4 accent-primary"
                      />
                      <span>{o.text}</span>
                    </label>
                  );
                })}

              {q.type === "TRUE_FALSE" &&
                [
                  { label: "Verdadero", value: true },
                  { label: "Falso", value: false },
                ].map((opt) => {
                  const selected = answers[q.id]?.boolValue === opt.value;
                  return (
                    <label
                      key={opt.label}
                      className={cn(
                        "flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-sm transition-colors",
                        selected
                          ? "border-primary bg-primary/5"
                          : "hover:bg-accent",
                      )}
                    >
                      <input
                        type="radio"
                        name={`q-${q.id}`}
                        checked={selected}
                        onChange={() => setAnswer(q.id, { boolValue: opt.value })}
                        className="size-4 accent-primary"
                      />
                      <span>{opt.label}</span>
                    </label>
                  );
                })}

              {q.type === "SHORT_TEXT" && (
                <Input
                  value={answers[q.id]?.textValue ?? ""}
                  onChange={(e) => setAnswer(q.id, { textValue: e.target.value })}
                  placeholder="Tu respuesta…"
                />
              )}

              {q.type === "ESSAY" && (
                <Textarea
                  value={answers[q.id]?.textValue ?? ""}
                  onChange={(e) => setAnswer(q.id, { textValue: e.target.value })}
                  placeholder="Escribe tu respuesta…"
                  className="min-h-28"
                />
              )}
            </div>
          </li>
        ))}
      </ol>

      <div className="flex justify-end">
        <Button
          type="button"
          disabled={submitMut.isPending}
          onClick={confirmSubmit}
        >
          {submitMut.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
          Enviar respuestas
        </Button>
      </div>
    </div>
  );
}

function StateCard({
  icon,
  tone,
  title,
  text,
}: {
  icon: React.ReactNode;
  tone: "amber" | "emerald";
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-xl border bg-background p-5">
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg",
            tone === "amber"
              ? "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
              : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
          )}
        >
          {icon}
        </span>
        <div>
          <p className="font-medium">{title}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">{text}</p>
        </div>
      </div>
    </div>
  );
}

/** Revisión por pregunta para el estudiante (cuando el docente revela respuestas). */
function ReviewList({ review }: { review: QuizReviewQuestion[] }) {
  return (
    <div className="space-y-3">
      <h3 className="font-heading text-sm font-semibold">Revisión</h3>
      <ol className="space-y-3">
        {review.map((q, i) => {
          const correct = q.answer?.isCorrect;
          return (
            <li key={q.id} className="rounded-xl border bg-background p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium">
                  {i + 1}. {q.prompt}
                </p>
                {q.type !== "ESSAY" && correct != null && (
                  <span
                    className={cn(
                      "inline-flex shrink-0 items-center gap-1 text-xs font-semibold",
                      correct
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-destructive",
                    )}
                  >
                    {correct ? (
                      <CheckCircle2 className="size-4" />
                    ) : (
                      <XCircle className="size-4" />
                    )}
                    {q.answer?.pointsAwarded ?? 0}/{q.points}
                  </span>
                )}
              </div>

              <div className="mt-2 space-y-1 text-sm">
                {(q.type === "SINGLE_CHOICE" || q.type === "MULTIPLE_CHOICE") &&
                  q.options.map((o) => {
                    const chosen =
                      q.answer?.selectedOptionIds.includes(o.id) ?? false;
                    return (
                      <div
                        key={o.id}
                        className={cn(
                          "flex items-center gap-2 rounded-lg px-3 py-1.5",
                          o.isCorrect
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                            : chosen
                              ? "bg-destructive/10 text-destructive"
                              : "text-muted-foreground",
                        )}
                      >
                        {o.isCorrect ? (
                          <CheckCircle2 className="size-3.5 shrink-0" />
                        ) : chosen ? (
                          <XCircle className="size-3.5 shrink-0" />
                        ) : (
                          <span className="size-3.5 shrink-0" />
                        )}
                        <span>{o.text}</span>
                      </div>
                    );
                  })}

                {q.type === "TRUE_FALSE" && (
                  <p className="text-muted-foreground">
                    Respuesta correcta:{" "}
                    <strong>{q.boolAnswer ? "Verdadero" : "Falso"}</strong>
                    {" · "}Tu respuesta:{" "}
                    {q.answer?.boolValue == null
                      ? "—"
                      : q.answer.boolValue
                        ? "Verdadero"
                        : "Falso"}
                  </p>
                )}

                {q.type === "SHORT_TEXT" && (
                  <p className="text-muted-foreground">
                    Tu respuesta:{" "}
                    <strong>{q.answer?.textValue || "—"}</strong>
                    {" · "}Aceptadas: {q.acceptedAnswers.join(", ")}
                  </p>
                )}

                {q.type === "ESSAY" && (
                  <p className="text-muted-foreground">
                    Tu respuesta: {q.answer?.textValue || "—"}
                    {q.answer?.pointsAwarded != null && (
                      <>
                        {" · "}
                        <strong>
                          {q.answer.pointsAwarded}/{q.points} pts
                        </strong>
                      </>
                    )}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
