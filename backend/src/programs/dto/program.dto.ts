import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const moduleSchema = z.object({
  // 0 permitido: la malla puede empezar en "Módulo 0" (nivelación).
  order: z.coerce.number().int().min(0),
  name: z.string().min(1),
  contents: z.array(z.string().min(1)).default([]),
});

const teacherSchema = z.object({
  fullName: z.string().min(1),
  credentials: z.string().min(1).nullish(),
  bio: z.string().min(1).nullish(),
  photoUrl: z.string().min(1).nullish(),
  order: z.coerce.number().int().min(0).default(0),
});

// "Más características del programa": pares etiqueta/valor definidos por el admin.
const extraFeatureSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
});

// Cuenta bancaria para depósito/transferencia (medios de pago).
const bankAccountSchema = z.object({
  bank: z.string().min(1),
  accountNumber: z.string().min(1),
  holder: z
    .string()
    .trim()
    .nullable()
    .optional()
    .transform((value) => value || null),
});

// Solo title/categoryId/flyerUrl son obligatorios; el resto es opcional y la
// landing oculta los campos vacíos.
export const createProgramSchema = z.object({
  title: z.string().min(1),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, 'Slug inválido')
    .optional(),
  categoryId: z.uuid(),
  flyerUrl: z.string().min(1),
  objective: z.string().min(1).nullish(),
  specificObjectives: z.array(z.string().min(1)).default([]),
  targetAudience: z.string().min(1).nullish(),
  modality: z.string().min(1).nullish(),
  // Fecha en formato ISO (ej. "2026-08-03"); se convierte a Date en el servicio.
  startDate: z.string().min(1).nullish(),
  duration: z.string().min(1).nullish(),
  hourlyLoad: z.string().min(1).nullish(),
  schedule: z.string().min(1).nullish(),
  // Video promocional: enlace YouTube/Vimeo o ruta /files/... de un archivo subido.
  videoUrl: z.string().min(1).nullish(),
  extraFeatures: z.array(extraFeatureSchema).default([]),
  requirements: z.array(z.string().min(1)).default([]),
  enrollmentFee: z.coerce.number().nonnegative().nullish(),
  totalCost: z.coerce.number().nonnegative().nullish(),
  currency: z.string().min(1).default('Bs'),
  installmentCount: z.coerce.number().int().min(1).nullish(),
  installmentFirstAmount: z.coerce.number().nonnegative().nullish(),
  installmentAmount: z.coerce.number().nonnegative().nullish(),
  installmentEnrollmentFee: z.coerce.number().nonnegative().nullish(),
  installmentCurrency: z.string().min(1).default('Bs'),
  paymentFacilities: z.string().nullish(),
  bankAccounts: z.array(bankAccountSchema).default([]),
  qrImageUrl: z.string().min(1).nullish(),
  isPublished: z.boolean().default(true),
  modules: z.array(moduleSchema).default([]),
  teachers: z.array(teacherSchema).default([]),
});

export const updateProgramSchema = createProgramSchema.partial();

export const reorderProgramsSchema = z.object({
  orderedIds: z.array(z.string().min(1)).min(1),
});

export class CreateProgramDto extends createZodDto(createProgramSchema) {}
export class UpdateProgramDto extends createZodDto(updateProgramSchema) {}
export class ReorderProgramsDto extends createZodDto(reorderProgramsSchema) {}
