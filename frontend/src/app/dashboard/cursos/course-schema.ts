import { z } from "zod";
import type { AdminCourse } from "@/lib/api/admin";
import type { CoursePayload } from "@/app/dashboard/admin-types";

export const courseFormSchema = z.object({
  name: z.string().min(1, "Requerido"),
  code: z
    .string()
    .regex(/^[A-Za-z0-9-]*$/, "Solo letras, números y guiones")
    .optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  modality: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  passingScore: z.number().min(0, "≥ 0").max(100, "≤ 100"),
  status: z.enum(["DRAFT", "ACTIVE", "FINISHED", "ARCHIVED"]),
  // El admin define la cantidad y el nombre de cada módulo. `id` se conserva al
  // editar módulos existentes (no se recrean → no se pierden docentes/notas).
  modules: z
    .array(
      z.object({
        id: z.string().optional(),
        name: z.string().min(1, "Requerido"),
      }),
    )
    .min(1, "Agrega al menos un módulo"),
});

export type CourseFormValues = z.infer<typeof courseFormSchema>;

export function toFormValues(course?: AdminCourse): CourseFormValues {
  if (!course) {
    return {
      name: "",
      code: "",
      description: "",
      icon: "",
      modality: "",
      startDate: "",
      endDate: "",
      passingScore: 71,
      status: "DRAFT",
      modules: [{ name: "" }],
    };
  }

  return {
    name: course.name,
    code: course.code,
    description: course.description ?? "",
    icon: course.icon ?? "",
    modality: course.modality ?? "",
    startDate: course.startDate ? course.startDate.slice(0, 10) : "",
    endDate: course.endDate ? course.endDate.slice(0, 10) : "",
    passingScore: Number(course.passingScore),
    status: course.status,
    modules: course.modules.map((m) => ({ id: m.id, name: m.name })),
  };
}

export function toPayload(values: CourseFormValues): CoursePayload {
  return {
    name: values.name.trim(),
    code: values.code?.trim() || undefined,
    description: values.description?.trim() || null,
    icon: values.icon?.trim() || null,
    modality: values.modality?.trim() || null,
    startDate: values.startDate || null,
    endDate: values.endDate || null,
    passingScore: values.passingScore,
    status: values.status,
    modules: values.modules.map((m) => ({
      ...(m.id ? { id: m.id } : {}),
      name: m.name.trim(),
    })),
  };
}
