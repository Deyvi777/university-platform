import { z } from "zod";
import type { AdminProgram } from "@/lib/api/admin";
import type { ProgramPayload } from "@/app/dashboard/admin-types";

// Monto opcional capturado como texto: vacío = no se muestra en la landing.
const optionalAmount = z
  .string()
  .refine((v) => v.trim() === "" || Number(v.trim()) >= 0, "Debe ser ≥ 0");

// React Hook Form requiere objetos en los field arrays, por eso las listas de
// strings (requisitos, contenidos, objetivos específicos) se modelan como
// { value: string }.
// Solo título, categoría y flyer son obligatorios; el resto es opcional y la
// landing oculta cada campo vacío.
export const programFormSchema = z.object({
  title: z.string().min(1, "Requerido"),
  slug: z
    .string()
    .regex(/^[a-z0-9-]*$/, "Solo minúsculas, números y guiones")
    .optional(),
  categoryId: z.string().min(1, "Selecciona una categoría"),
  flyerUrl: z.string().min(1, "Sube un flyer"),
  objective: z.string(),
  specificObjectives: z.array(
    z.object({ value: z.string().min(1, "Requerido") }),
  ),
  targetAudience: z.string(),
  modality: z.string(),
  startDate: z.string(),
  duration: z.string(),
  hourlyLoad: z.string(),
  schedule: z.string(),
  // Video promocional: enlace YouTube/Vimeo o ruta /files/... de un archivo subido.
  videoUrl: z.string(),
  extraFeatures: z.array(
    z.object({
      label: z.string().min(1, "Requerido"),
      value: z.string().min(1, "Requerido"),
    }),
  ),
  // Pago al contado (moneda compartida con la matrícula)
  currency: z.string().min(1),
  enrollmentFee: optionalAmount,
  totalCost: optionalAmount,
  // Plan de cuotas (con su propia moneda)
  installmentCurrency: z.string().min(1),
  installmentCount: z
    .string()
    .refine(
      (v) => v.trim() === "" || (Number.isInteger(Number(v)) && Number(v) >= 1),
      "Entero ≥ 1",
    ),
  installmentAmount: optionalAmount,
  paymentFacilities: z.string().optional(),
  // Medios de pago
  bankAccounts: z.array(
    z.object({
      bank: z.string().min(1, "Requerido"),
      accountNumber: z.string().min(1, "Requerido"),
      holder: z.string(),
    }),
  ),
  qrImageUrl: z.string(),
  isPublished: z.boolean(),
  requirements: z.array(z.object({ value: z.string().min(1, "Requerido") })),
  // Con "Módulo 0" activo la malla se numera desde 0 (nivelación).
  moduleZero: z.boolean(),
  modules: z.array(
    z.object({
      name: z.string().min(1, "Requerido"),
      contents: z.array(z.object({ value: z.string().min(1, "Requerido") })),
    }),
  ),
  teachers: z.array(
    z.object({
      fullName: z.string().min(1, "Requerido"),
      credentials: z.string().optional(),
      bio: z.string().optional(),
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
      specificObjectives: [],
      targetAudience: "",
      modality: "",
      startDate: "",
      duration: "",
      hourlyLoad: "",
      schedule: "",
      videoUrl: "",
      extraFeatures: [],
      currency: "Bs",
      enrollmentFee: "",
      totalCost: "",
      installmentCurrency: "Bs",
      installmentCount: "",
      installmentAmount: "",
      paymentFacilities: "",
      bankAccounts: [],
      qrImageUrl: "",
      isPublished: true,
      requirements: [],
      moduleZero: false,
      modules: [{ name: "", contents: [{ value: "" }] }],
      teachers: [],
    };
  }

  return {
    title: program.title,
    slug: program.slug,
    categoryId: program.categoryId,
    flyerUrl: program.flyerUrl,
    objective: program.objective ?? "",
    specificObjectives: program.specificObjectives.map((value) => ({ value })),
    targetAudience: program.targetAudience ?? "",
    modality: program.modality ?? "",
    startDate: program.startDate?.slice(0, 10) ?? "",
    duration: program.duration ?? "",
    hourlyLoad: program.hourlyLoad ?? "",
    schedule: program.schedule ?? "",
    videoUrl: program.videoUrl ?? "",
    extraFeatures: program.extraFeatures.map((f) => ({
      label: f.label,
      value: f.value,
    })),
    currency: program.currency,
    enrollmentFee:
      program.enrollmentFee != null
        ? String(Number(program.enrollmentFee))
        : "",
    totalCost:
      program.totalCost != null ? String(Number(program.totalCost)) : "",
    installmentCurrency: program.installmentCurrency,
    installmentCount:
      program.installmentCount != null ? String(program.installmentCount) : "",
    installmentAmount:
      program.installmentAmount != null
        ? String(Number(program.installmentAmount))
        : "",
    paymentFacilities: program.paymentFacilities ?? "",
    bankAccounts: program.bankAccounts.map((a) => ({
      bank: a.bank,
      accountNumber: a.accountNumber,
      holder: a.holder ?? "",
    })),
    qrImageUrl: program.qrImageUrl ?? "",
    isPublished: program.isPublished,
    requirements: program.requirements.map((value) => ({ value })),
    moduleZero: program.modules[0]?.order === 0,
    modules: program.modules.map((m) => ({
      name: m.name,
      contents: m.contents.map((value) => ({ value })),
    })),
    teachers: program.teachers.map((t) => ({
      fullName: t.fullName,
      credentials: t.credentials ?? "",
      bio: t.bio ?? "",
      photoUrl: t.photoUrl ?? "",
    })),
  };
}

function emptyToNull(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function toPayload(values: ProgramFormValues): ProgramPayload {
  const moduleBase = values.moduleZero ? 0 : 1;
  return {
    title: values.title.trim(),
    slug: values.slug?.trim() || undefined,
    categoryId: values.categoryId,
    flyerUrl: values.flyerUrl,
    objective: emptyToNull(values.objective),
    specificObjectives: values.specificObjectives
      .map((o) => o.value.trim())
      .filter(Boolean),
    targetAudience: emptyToNull(values.targetAudience),
    modality: emptyToNull(values.modality),
    startDate: emptyToNull(values.startDate),
    duration: emptyToNull(values.duration),
    hourlyLoad: emptyToNull(values.hourlyLoad),
    schedule: emptyToNull(values.schedule),
    videoUrl: emptyToNull(values.videoUrl),
    extraFeatures: values.extraFeatures.map((f) => ({
      label: f.label.trim(),
      value: f.value.trim(),
    })),
    currency: values.currency.trim() || "Bs",
    enrollmentFee:
      values.enrollmentFee.trim() === "" ? null : Number(values.enrollmentFee),
    totalCost: values.totalCost.trim() === "" ? null : Number(values.totalCost),
    installmentCurrency: values.installmentCurrency.trim() || "Bs",
    installmentCount:
      values.installmentCount.trim() === ""
        ? null
        : Number(values.installmentCount),
    installmentAmount:
      values.installmentAmount.trim() === ""
        ? null
        : Number(values.installmentAmount),
    paymentFacilities: emptyToNull(values.paymentFacilities),
    bankAccounts: values.bankAccounts.map((a) => ({
      bank: a.bank.trim(),
      accountNumber: a.accountNumber.trim(),
      holder: emptyToNull(a.holder),
    })),
    qrImageUrl: values.qrImageUrl.trim() || null,
    isPublished: values.isPublished,
    requirements: values.requirements
      .map((r) => r.value.trim())
      .filter(Boolean),
    modules: values.modules.map((m, index) => ({
      order: index + moduleBase,
      name: m.name.trim(),
      contents: m.contents.map((c) => c.value.trim()).filter(Boolean),
    })),
    teachers: values.teachers.map((t, index) => ({
      fullName: t.fullName.trim(),
      credentials: emptyToNull(t.credentials),
      bio: emptyToNull(t.bio),
      photoUrl: t.photoUrl?.trim() || null,
      order: index,
    })),
  };
}
