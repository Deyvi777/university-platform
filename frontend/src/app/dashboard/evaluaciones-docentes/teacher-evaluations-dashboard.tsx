"use client";

import {
  ArrowDown,
  ArrowUp,
  CheckSquare,
  ListChecks,
  Loader2,
  MessageSquareText,
  Plus,
  Save,
  Star,
  Trash2,
} from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  TeacherEvaluationQuestion,
  TeacherEvaluationQuestionType,
  TeacherEvaluationResult,
} from "@/lib/api/admin";
import { saveTeacherEvaluationQuestionnaireAction } from "./actions";

type EditableQuestion = Omit<TeacherEvaluationQuestion, "order">;

const TYPES: Array<{
  type: TeacherEvaluationQuestionType;
  label: string;
  Icon: typeof Star;
}> = [
  { type: "SCALE_1_5", label: "Escala de 1 a 5", Icon: Star },
  { type: "SINGLE_CHOICE", label: "Selección única", Icon: ListChecks },
  { type: "MULTIPLE_CHOICE", label: "Selección múltiple", Icon: CheckSquare },
  { type: "TEXT", label: "Texto libre", Icon: MessageSquareText },
];

export function TeacherEvaluationsDashboard({
  initialQuestions,
  results,
}: {
  initialQuestions: TeacherEvaluationQuestion[];
  results: TeacherEvaluationResult[];
}) {
  const router = useRouter();
  const [questions, setQuestions] = useState<EditableQuestion[]>(
    initialQuestions.map((question) => ({
      id: question.id,
      type: question.type,
      prompt: question.prompt,
      required: question.required,
      options: question.options,
    })),
  );
  const [saving, startSaving] = useTransition();
  const [query, setQuery] = useState("");

  function add(type: TeacherEvaluationQuestionType) {
    setQuestions((current) => [
      ...current,
      {
        id: `new-${crypto.randomUUID()}`,
        type,
        prompt: "",
        required: true,
        options:
          type === "SINGLE_CHOICE" || type === "MULTIPLE_CHOICE"
            ? ["Opción 1", "Opción 2"]
            : [],
      },
    ]);
  }

  function update(index: number, patch: Partial<EditableQuestion>) {
    setQuestions((current) =>
      current.map((question, position) =>
        position === index ? { ...question, ...patch } : question,
      ),
    );
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= questions.length) return;
    setQuestions((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function save() {
    if (questions.length === 0) {
      toast.error("Agrega al menos una pregunta");
      return;
    }
    if (questions.some((question) => !question.prompt.trim())) {
      toast.error("Todas las preguntas deben tener un enunciado");
      return;
    }
    if (
      questions.some(
        (question) =>
          (question.type === "SINGLE_CHOICE" ||
            question.type === "MULTIPLE_CHOICE") &&
          question.options.filter((option) => option.trim()).length < 2,
      )
    ) {
      toast.error("Las preguntas de selección necesitan al menos dos opciones");
      return;
    }

    startSaving(async () => {
      const payload = questions.map((question) => ({
        ...question,
        id: question.id.startsWith("new-") ? undefined : question.id,
        prompt: question.prompt.trim(),
        options: question.options.map((option) => option.trim()).filter(Boolean),
      }));
      const result = await saveTeacherEvaluationQuestionnaireAction(payload);
      if (result.ok) {
        setQuestions(
          result.data.map((question) => ({
            id: question.id,
            type: question.type,
            prompt: question.prompt,
            required: question.required,
            options: question.options,
          })),
        );
        toast.success("Cuestionario institucional guardado");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  const normalizedQuery = query.trim().toLocaleLowerCase("es");
  const filteredResults = results.filter((result) =>
    [
      result.module.course.name,
      result.module.name,
      result.teacher.lastName,
      result.teacher.firstName,
      result.student.lastName,
      result.student.firstName,
      result.student.email,
    ]
      .join(" ")
      .toLocaleLowerCase("es")
      .includes(normalizedQuery),
  );

  return (
    <Tabs defaultValue="questionnaire" className="mt-6">
      <TabsList className="h-10 rounded-full p-1">
        <TabsTrigger value="questionnaire" className="rounded-full px-4">
          Cuestionario
        </TabsTrigger>
        <TabsTrigger value="results" className="rounded-full px-4">
          Resultados ({results.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="questionnaire" className="mt-5 space-y-4">
        <div className="rounded-2xl border bg-card p-4 shadow-sm shadow-blue-950/[0.04] sm:p-5 dark:shadow-none">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-heading text-lg font-semibold">
                Preguntas institucionales
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Este mismo cuestionario se usa en todos los módulos. Los cambios
                solo afectan evaluaciones futuras; las respuestas guardadas
                conservan el texto y tipo originales.
              </p>
            </div>
            <Button onClick={save} disabled={saving}>
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              Guardar cuestionario
            </Button>
          </div>
        </div>

        {questions.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-muted/20 px-6 py-12 text-center">
            <MessageSquareText className="mx-auto size-9 text-muted-foreground" />
            <p className="mt-3 font-medium">Aún no hay preguntas</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Agrega preguntas con los botones inferiores para habilitar el
              cuestionario institucional.
            </p>
          </div>
        ) : (
          <ol className="space-y-3">
            {questions.map((question, index) => {
              const meta = TYPES.find((item) => item.type === question.type)!;
              const TypeIcon = meta.Icon;
              const selectable =
                question.type === "SINGLE_CHOICE" ||
                question.type === "MULTIPLE_CHOICE";
              return (
                <li
                  key={question.id}
                  className="rounded-2xl border bg-card p-4 shadow-sm shadow-blue-950/[0.04] sm:p-5 dark:shadow-none"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
                      <TypeIcon className="size-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {index + 1}. {meta.label}
                        </span>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Subir pregunta"
                            disabled={index === 0}
                            onClick={() => move(index, -1)}
                          >
                            <ArrowUp />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Bajar pregunta"
                            disabled={index === questions.length - 1}
                            onClick={() => move(index, 1)}
                          >
                            <ArrowDown />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon-sm"
                            aria-label="Quitar pregunta"
                            onClick={() =>
                              setQuestions((current) =>
                                current.filter((_, position) => position !== index),
                              )
                            }
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor={`type-${index}`}>Tipo de respuesta</Label>
                        <select
                          id={`type-${index}`}
                          value={question.type}
                          onChange={(event) => {
                            const type = event.target
                              .value as TeacherEvaluationQuestionType;
                            const selectable =
                              type === "SINGLE_CHOICE" ||
                              type === "MULTIPLE_CHOICE";
                            update(index, {
                              type,
                              options: selectable
                                ? question.options.length >= 2
                                  ? question.options
                                  : ["Opción 1", "Opción 2"]
                                : [],
                            });
                          }}
                          className="mt-1.5 h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                        >
                          {TYPES.map((type) => (
                            <option key={type.type} value={type.type}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label htmlFor={`question-${index}`}>Enunciado</Label>
                        <Input
                          id={`question-${index}`}
                          className="mt-1.5"
                          value={question.prompt}
                          onChange={(event) =>
                            update(index, { prompt: event.target.value })
                          }
                          placeholder="Escribe la pregunta…"
                        />
                      </div>
                      {selectable && (
                        <div>
                          <Label htmlFor={`options-${index}`}>
                            Opciones (una por línea)
                          </Label>
                          <Textarea
                            id={`options-${index}`}
                            className="mt-1.5 min-h-24"
                            value={question.options.join("\n")}
                            onChange={(event) =>
                              update(index, {
                                options: event.target.value.split("\n"),
                              })
                            }
                          />
                        </div>
                      )}
                      <label className="inline-flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={question.required}
                          onChange={(event) =>
                            update(index, { required: event.target.checked })
                          }
                          className="size-4 accent-primary"
                        />
                        Respuesta obligatoria
                      </label>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}

        <div className="flex flex-wrap gap-2 rounded-2xl border border-dashed bg-muted/20 p-4">
          <span className="mr-1 inline-flex items-center gap-1.5 text-sm font-medium">
            <Plus className="size-4" /> Agregar:
          </span>
          {TYPES.map(({ type, label, Icon }) => (
            <Button key={type} variant="outline" size="sm" onClick={() => add(type)}>
              <Icon /> {label}
            </Button>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="results" className="mt-5">
        <div className="rounded-2xl border bg-card p-4 shadow-sm shadow-blue-950/[0.04] sm:p-5 dark:shadow-none">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-heading text-lg font-semibold">
                Respuestas identificadas
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Solo los administradores pueden consultar esta información.
              </p>
            </div>
            <Input
              className="w-full rounded-full sm:w-80"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar programa, módulo, docente o estudiante…"
            />
          </div>
        </div>

        {filteredResults.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed bg-muted/20 px-6 py-12 text-center text-sm text-muted-foreground">
            {results.length === 0
              ? "Aún no se recibieron evaluaciones docentes."
              : "No hay resultados que coincidan con la búsqueda."}
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {filteredResults.map((result) => (
              <details
                key={result.id}
                className="group rounded-2xl border bg-card shadow-sm shadow-blue-950/[0.04] dark:shadow-none"
              >
                <summary className="cursor-pointer list-none px-4 py-4 sm:px-5 [&::-webkit-details-marker]:hidden">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">
                        {result.teacher.lastName} {result.teacher.firstName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {result.module.course.name} · Módulo {result.module.order}: {result.module.name}
                      </p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-sm font-medium">
                        Estudiante: {result.student.lastName} {result.student.firstName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {result.student.email} · {new Intl.DateTimeFormat("es-BO", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(new Date(result.createdAt))}
                      </p>
                    </div>
                  </div>
                </summary>
                <ol className="space-y-3 border-t px-4 py-4 sm:px-5">
                  {result.answers.map((answer) => (
                    <li key={answer.id}>
                      <p className="text-sm font-medium">
                        {answer.questionOrderSnapshot}. {answer.questionPromptSnapshot}
                      </p>
                      <p className="mt-1 rounded-xl bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                        {answer.scaleValue ??
                          (answer.selectedOptions.length
                            ? answer.selectedOptions.join(", ")
                            : answer.textValue || "Sin respuesta")}
                      </p>
                    </li>
                  ))}
                </ol>
              </details>
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
