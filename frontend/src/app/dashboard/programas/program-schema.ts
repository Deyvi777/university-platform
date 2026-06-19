import { z } from "zod";
import type { AdminProgram } from "@/lib/api/admin";
import type { ProgramPayload } from "@/app/dashboard/admin-types";

// React Hook Form requiere objetos en los field arrays, por eso las listas de
// strings (requisitos, contenidos) se modelan como { value: string }.
export const programFormSchema = z.object({
  title: z.string().min(1, "Requerido"),
  slug: z
    .string()
    .regex(/^[a-z0-9-]*$/, "Solo minúsculas, números y guiones")
    .optional(),
  categoryId: z.string().min(1, "Selecciona una categoría"),
  flyerUrl: z.string().min(1, "Sube un flyer"),
  objective: z.string().min(1, "Requerido"),
  targetAudience: z.string().min(1, "Requerido"),
  modality: z.string().min(1, "Requerido"),
  startDate: z.string().min(1, "Requerido"),
  duration: z.string().min(1, "Requerido"),
  schedule: z.string().min(1, "Requerido"),
  currency: z.string().min(1),
  enrollmentFee: z.number().nonnegative("Debe ser ≥ 0"),
  totalCost: z.number().nonnegative("Debe ser ≥ 0"),
  paymentFacilities: z.string().optional(),
  isPublished: z.boolean(),
  requirements: z.array(z.object({ value: z.string().min(1, "Requerido") })),
  modules: z.array(
    z.object({
      name: z.string().min(1, "Requerido"),
      contents: z.array(z.object({ value: z.string().min(1, "Requerido") })),
    }),
  ),
  teachers: z.array(
    z.object({
      fullName: z.string().min(1, "Requerido"),
      credentials: z.string().min(1, "Requerido"),
      photoUrl: z.string().optional(),
    }),
  ),
});

export type ProgramFormValues = z.infer<typeof programFormSchema>;

export function toFormValues(program?: AdminProgram): ProgramFormValues {
  if (!program) {
    return {
      title: "",
      slug: "",
      categoryId: "",
      flyerUrl: "",
      objective: "",
      targetAudience: "",
      modality: "",
      startDate: "",
      duration: "",
      schedule: "",
      currency: "Bs",
      enrollmentFee: 0,
      totalCost: 0,
      paymentFacilities: "",
      isPublished: true,
      requirements: [{ value: "" }],
      modules: [{ name: "", contents: [{ value: "" }] }],
      teachers: [{ fullName: "", credentials: "", photoUrl: "" }],
    };
  }

  return {
    title: program.title,
    slug: program.slug,
    categoryId: program.categoryId,
    flyerUrl: program.flyerUrl,
    objective: program.objective,
    targetAudience: program.targetAudience,
    modality: program.modality,
    startDate: program.startDate.slice(0, 10),
    duration: program.duration,
    schedule: program.schedule,
    currency: program.currency,
    enrollmentFee: Number(program.enrollmentFee),
    totalCost: Number(program.totalCost),
    paymentFacilities: program.paymentFacilities ?? "",
    isPublished: program.isPublished,
    requirements: program.requirements.map((value) => ({ value })),
    modules: program.modules.map((m) => ({
      name: m.name,
      contents: m.contents.map((value) => ({ value })),
    })),
    teachers: program.teachers.map((t) => ({
      fullName: t.fullName,
      credentials: t.credentials,
      photoUrl: t.photoUrl ?? "",
    })),
  };
}

export function toPayload(values: ProgramFormValues): ProgramPayload {
  return {
    title: values.title.trim(),
    slug: values.slug?.trim() || undefined,
    categoryId: values.categoryId,
    flyerUrl: values.flyerUrl,
    objective: values.objective.trim(),
    targetAudience: values.targetAudience.trim(),
    modality: values.modality.trim(),
    startDate: values.startDate,
    duration: values.duration.trim(),
    schedule: values.schedule.trim(),
    currency: values.currency.trim() || "Bs",
    enrollmentFee: values.enrollmentFee,
    totalCost: values.totalCost,
    paymentFacilities: values.paymentFacilities?.trim() || null,
    isPublished: values.isPublished,
    requirements: values.requirements
      .map((r) => r.value.trim())
      .filter(Boolean),
    modules: values.modules.map((m, index) => ({
      order: index + 1,
      name: m.name.trim(),
      contents: m.contents.map((c) => c.value.trim()).filter(Boolean),
    })),
    teachers: values.teachers.map((t, index) => ({
      fullName: t.fullName.trim(),
      credentials: t.credentials.trim(),
      photoUrl: t.photoUrl?.trim() || null,
      order: index,
    })),
  };
}
