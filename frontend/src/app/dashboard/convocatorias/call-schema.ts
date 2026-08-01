import { z } from "zod";
import type { AdminCall } from "@/lib/api/admin";
import type { CallPayload } from "@/app/dashboard/admin-types";

const questionSchema = z
  .object({
    id: z.string().uuid().optional(),
    type: z.enum(["SINGLE_CHOICE", "MULTIPLE_CHOICE", "TEXT", "FILE"]),
    prompt: z.string().trim().min(1, "Escribe la pregunta"),
    description: z.string(),
    required: z.boolean(),
    options: z.array(
      z.object({ value: z.string().trim().min(1, "Requerido") }),
    ),
  })
  .superRefine((question, context) => {
    const selection =
      question.type === "SINGLE_CHOICE" || question.type === "MULTIPLE_CHOICE";
    if (selection && question.options.length < 2) {
      context.addIssue({
        code: "custom",
        path: ["options"],
        message: "Agrega al menos dos opciones",
      });
    }
    if (!selection && question.options.length) {
      context.addIssue({
        code: "custom",
        path: ["options"],
        message: "Este tipo no admite opciones",
      });
    }
  });

export const callFormSchema = z
  .object({
    title: z.string().trim().min(1, "Requerido"),
    slug: z
      .string()
      .regex(/^[a-z0-9-]*$/, "Solo minúsculas, números y guiones"),
    summary: z
      .string()
      .trim()
      .min(1, "Requerido")
      .max(500, "Máximo 500 caracteres"),
    description: z.string(),
    coverUrl: z.string(),
    opensAt: z.string(),
    closesAt: z.string(),
    isPublished: z.boolean(),
    questions: z.array(questionSchema).min(1, "Agrega al menos una pregunta"),
  })
  .superRefine((call, context) => {
    if (
      call.opensAt &&
      call.closesAt &&
      new Date(call.opensAt) > new Date(call.closesAt)
    ) {
      context.addIssue({
        code: "custom",
        path: ["closesAt"],
        message: "Debe ser posterior a la apertura",
      });
    }
  });

export type CallFormValues = z.infer<typeof callFormSchema>;

function toLocalDateTime(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  const shifted = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return shifted.toISOString().slice(0, 16);
}

export function toCallFormValues(call?: AdminCall): CallFormValues {
  if (!call) {
    return {
      title: "",
      slug: "",
      summary: "",
      description: "",
      coverUrl: "",
      opensAt: "",
      closesAt: "",
      isPublished: true,
      questions: [
        {
          id: undefined,
          type: "TEXT",
          prompt: "",
          description: "",
          required: true,
          options: [],
        },
      ],
    };
  }
  return {
    title: call.title,
    slug: call.slug,
    summary: call.summary,
    description: call.description ?? "",
    coverUrl: call.coverUrl ?? "",
    opensAt: toLocalDateTime(call.opensAt),
    closesAt: toLocalDateTime(call.closesAt),
    isPublished: call.isPublished,
    questions: call.questions.map((question) => ({
      id: question.id,
      type: question.type,
      prompt: question.prompt,
      description: question.description ?? "",
      required: question.required,
      options: question.options.map((value) => ({ value })),
    })),
  };
}

export function toCallPayload(values: CallFormValues): CallPayload {
  return {
    title: values.title.trim(),
    slug: values.slug.trim() || undefined,
    summary: values.summary.trim(),
    description: values.description.trim() || null,
    coverUrl: values.coverUrl || null,
    opensAt: values.opensAt ? new Date(values.opensAt).toISOString() : null,
    closesAt: values.closesAt ? new Date(values.closesAt).toISOString() : null,
    isPublished: values.isPublished,
    questions: values.questions.map((question) => ({
      id: question.id,
      type: question.type,
      prompt: question.prompt.trim(),
      description: question.description.trim() || null,
      required: question.required,
      options: question.options.map((option) => option.value.trim()),
    })),
  };
}
