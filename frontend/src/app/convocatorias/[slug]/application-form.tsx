"use client";

import { useState } from "react";
import { CheckCircle2, FileUp, Loader2, Send, X } from "lucide-react";
import type {
  CallApplicationAnswerPayload,
  CallDetail,
  CallUploadedFile,
} from "@/lib/api/calls";
import { submitCallApplicationAction } from "./actions";

const MAX_FILE_BYTES = 20 * 1024 * 1024;
const ACCEPTED_FILES =
  ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.png,.jpg,.jpeg,.webp,.avif";
const ACCEPTED_EXTENSIONS = ACCEPTED_FILES.split(",");

type Values = Record<string, string | string[]>;
type SelectedFiles = Record<string, File[]>;

export function ApplicationForm({ call }: { call: CallDetail }) {
  const [values, setValues] = useState<Values>({});
  const [files, setFiles] = useState<SelectedFiles>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [draggingQuestionId, setDraggingQuestionId] = useState<string | null>(
    null,
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successId, setSuccessId] = useState<string | null>(null);

  if (!call.isOpen) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 px-7 py-12 text-center sm:px-12">
        <h2 className="text-2xl font-bold text-white">
          La recepción de postulaciones está cerrada
        </h2>
        <p className="mt-3 text-slate-300">
          Puedes revisar la información de la convocatoria, pero el formulario
          ya no admite nuevas respuestas.
        </p>
      </div>
    );
  }

  if (successId) {
    return (
      <div className="rounded-3xl border border-emerald-400/25 bg-emerald-400/[0.07] px-7 py-14 text-center sm:px-12">
        <CheckCircle2 className="mx-auto size-12 text-emerald-400" />
        <h2 className="mt-5 text-2xl font-bold text-white">
          Postulación enviada correctamente
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-slate-300">
          Recibimos tus respuestas y archivos. Conserva este código de
          referencia: <strong className="text-white">{successId}</strong>.
        </p>
      </div>
    );
  }

  function setText(questionId: string, value: string) {
    setValues((current) => ({ ...current, [questionId]: value }));
    setErrors((current) => ({ ...current, [questionId]: "" }));
  }

  function toggleMultiple(questionId: string, option: string) {
    const current = Array.isArray(values[questionId])
      ? (values[questionId] as string[])
      : [];
    const next = current.includes(option)
      ? current.filter((value) => value !== option)
      : [...current, option];
    setValues((all) => ({ ...all, [questionId]: next }));
    setErrors((all) => ({ ...all, [questionId]: "" }));
  }

  function selectFiles(questionId: string, selected: FileList | null) {
    if (!selected) return;
    const next = Array.from(selected);
    if (next.length > 5) {
      setErrors((current) => ({
        ...current,
        [questionId]: "Puedes adjuntar como máximo 5 archivos",
      }));
      return;
    }
    const unsupported = next.find((file) => {
      const name = file.name.toLowerCase();
      return !ACCEPTED_EXTENSIONS.some((extension) => name.endsWith(extension));
    });
    if (unsupported) {
      setErrors((current) => ({
        ...current,
        [questionId]: `${unsupported.name} no es un tipo de archivo permitido`,
      }));
      return;
    }
    const oversized = next.find((file) => file.size > MAX_FILE_BYTES);
    if (oversized) {
      setErrors((current) => ({
        ...current,
        [questionId]: `${oversized.name} supera el límite de 20 MB`,
      }));
      return;
    }
    setFiles((current) => ({ ...current, [questionId]: next }));
    setErrors((current) => ({ ...current, [questionId]: "" }));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    for (const question of call.questions) {
      if (!question.required) continue;
      const value = values[question.id];
      const hasValue = Array.isArray(value)
        ? value.length > 0
        : Boolean(value?.trim());
      const hasFiles = (files[question.id]?.length ?? 0) > 0;
      if (question.type === "FILE" ? !hasFiles : !hasValue) {
        nextErrors[question.id] = "Este campo es obligatorio";
      }
    }
    setErrors(nextErrors);
    setFormError(null);
    if (Object.keys(nextErrors).length) {
      document
        .getElementById(`question-${Object.keys(nextErrors)[0]}`)
        ?.focus();
      return;
    }

    setSubmitting(true);
    try {
      const answers: CallApplicationAnswerPayload[] = [];
      for (const question of call.questions) {
        const value = values[question.id];
        const questionFiles = files[question.id] ?? [];
        const uploaded: CallUploadedFile[] = [];
        for (const file of questionFiles) uploaded.push(await uploadFile(file));

        const selectedOptions = Array.isArray(value)
          ? value
          : question.type === "SINGLE_CHOICE" && value
            ? [value]
            : [];
        const textValue =
          question.type === "TEXT" && typeof value === "string"
            ? value.trim()
            : null;
        if (textValue || selectedOptions.length || uploaded.length) {
          answers.push({
            questionId: question.id,
            textValue,
            selectedOptions,
            files: uploaded,
          });
        }
      }

      const result = await submitCallApplicationAction(call.slug, answers);
      if (!result.ok) throw new Error(result.error);
      setSuccessId(result.applicationId);
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "No se pudo enviar la postulación",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-amber-400">
          Formulario de postulación
        </p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-white">
          Completa tu información
        </h2>
        <p className="mt-3 text-slate-300">
          Los campos marcados con <span className="text-amber-300">*</span> son
          obligatorios.
        </p>
      </div>

      {call.questions.map((question, index) => {
        const error = errors[question.id];
        const isDraggingFiles = draggingQuestionId === question.id;
        return (
          <fieldset
            key={question.id}
            className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 sm:p-6"
          >
            <legend className="sr-only">{question.prompt}</legend>
            <label
              htmlFor={`question-${question.id}`}
              className="block font-semibold leading-6 text-white"
            >
              <span className="mr-2 text-sm text-amber-400">{index + 1}.</span>
              {question.prompt}{" "}
              {question.required && <span className="text-amber-300">*</span>}
            </label>
            {question.description && (
              <p className="mt-2 text-sm leading-6 text-slate-400">
                {question.description}
              </p>
            )}

            <div className="mt-4">
              {question.type === "TEXT" && (
                <textarea
                  id={`question-${question.id}`}
                  rows={1}
                  value={
                    typeof values[question.id] === "string"
                      ? values[question.id]
                      : ""
                  }
                  onChange={(event) => {
                    event.currentTarget.style.height = "auto";
                    event.currentTarget.style.height = `${event.currentTarget.scrollHeight}px`;
                    setText(question.id, event.target.value);
                  }}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? `error-${question.id}` : undefined}
                  className="w-full resize-none overflow-hidden rounded-xl border border-white/15 bg-slate-950/60 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-amber-400/70 focus:ring-2 focus:ring-amber-400/20"
                  placeholder="Escribe tu respuesta…"
                />
              )}

              {question.type === "SINGLE_CHOICE" && (
                <div
                  id={`question-${question.id}`}
                  tabIndex={-1}
                  className="space-y-2"
                >
                  {question.options.map((option) => (
                    <label
                      key={option}
                      className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 px-4 py-3 text-slate-200 transition hover:bg-white/5"
                    >
                      <input
                        type="radio"
                        name={question.id}
                        value={option}
                        checked={values[question.id] === option}
                        onChange={() => setText(question.id, option)}
                        className="mt-1 accent-amber-400"
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              )}

              {question.type === "MULTIPLE_CHOICE" && (
                <div
                  id={`question-${question.id}`}
                  tabIndex={-1}
                  className="space-y-2"
                >
                  {question.options.map((option) => {
                    const selected = Array.isArray(values[question.id])
                      ? (values[question.id] as string[]).includes(option)
                      : false;
                    return (
                      <label
                        key={option}
                        className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 px-4 py-3 text-slate-200 transition hover:bg-white/5"
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleMultiple(question.id, option)}
                          className="mt-1 accent-amber-400"
                        />
                        <span>{option}</span>
                      </label>
                    );
                  })}
                </div>
              )}

              {question.type === "FILE" && (
                <div>
                  <label
                    id={`question-${question.id}`}
                    tabIndex={-1}
                    onDragOver={(event) => {
                      event.preventDefault();
                      event.dataTransfer.dropEffect = "copy";
                      setDraggingQuestionId(question.id);
                    }}
                    onDragLeave={() => setDraggingQuestionId(null)}
                    onDrop={(event) => {
                      event.preventDefault();
                      setDraggingQuestionId(null);
                      selectFiles(question.id, event.dataTransfer.files);
                    }}
                    aria-label="Arrastra y suelta archivos aquí, o haz clic para seleccionarlos"
                    className={`flex cursor-pointer flex-col items-center rounded-2xl border border-dashed px-5 py-8 text-center outline-none transition focus-visible:ring-2 focus-visible:ring-amber-400/40 ${
                      isDraggingFiles
                        ? "border-amber-400 bg-amber-400/10 ring-2 ring-amber-400/20"
                        : "border-white/20 bg-slate-950/35 hover:border-amber-400/50 hover:bg-amber-400/[0.04]"
                    }`}
                  >
                    <FileUp
                      className={`pointer-events-none size-8 text-amber-400 ${
                        isDraggingFiles ? "animate-bounce" : ""
                      }`}
                    />
                    <span className="pointer-events-none mt-3 font-medium text-white">
                      {isDraggingFiles
                        ? "Suelta los archivos aquí"
                        : "Arrastra y suelta aquí o selecciona archivos"}
                    </span>
                    <span className="pointer-events-none mt-1 text-xs text-slate-400">
                      {isDraggingFiles
                        ? "Se agregarán a esta pregunta"
                        : "Imágenes, PDF, Office, texto o ZIP · máximo 20 MB"}
                    </span>
                    <input
                      type="file"
                      multiple
                      accept={ACCEPTED_FILES}
                      className="sr-only"
                      onChange={(event) => {
                        selectFiles(question.id, event.target.files);
                        event.currentTarget.value = "";
                      }}
                    />
                  </label>
                  {(files[question.id]?.length ?? 0) > 0 && (
                    <ul className="mt-3 space-y-2">
                      {files[question.id].map((file) => (
                        <li
                          key={`${file.name}-${file.size}`}
                          className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-sm text-slate-300"
                        >
                          <span className="truncate">{file.name}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setFiles((current) => ({
                                ...current,
                                [question.id]: current[question.id].filter(
                                  (item) => item !== file,
                                ),
                              }))
                            }
                            aria-label={`Quitar ${file.name}`}
                            className="ml-3 rounded-full p-1 hover:bg-white/10 hover:text-white"
                          >
                            <X className="size-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {error && (
              <p
                id={`error-${question.id}`}
                className="mt-3 text-sm text-rose-300"
                role="alert"
              >
                {error}
              </p>
            )}
          </fieldset>
        );
      })}

      {formError && (
        <p
          role="alert"
          className="rounded-xl border border-rose-400/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-200"
        >
          {formError}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-amber-400 px-7 py-4 font-semibold text-slate-950 shadow-lg shadow-amber-400/20 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {submitting ? (
          <Loader2 className="size-5 animate-spin" />
        ) : (
          <Send className="size-5" />
        )}
        {submitting ? "Enviando postulación…" : "Enviar postulación"}
      </button>
    </form>
  );
}

async function uploadFile(file: File): Promise<CallUploadedFile> {
  const form = new FormData();
  form.append("file", file);
  const response = await fetch("/api/calls/upload", {
    method: "POST",
    body: form,
  });
  const body = (await response.json().catch(() => ({}))) as {
    url?: string;
    message?: string;
  };
  if (!response.ok || !body.url) {
    throw new Error(body.message ?? `No se pudo subir ${file.name}`);
  }
  return {
    name: file.name,
    url: body.url,
    size: file.size,
    mimeType: file.type,
  };
}
