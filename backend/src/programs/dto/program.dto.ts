import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const moduleSchema = z.object({
  order: z.coerce.number().int().min(1),
  name: z.string().min(1),
  contents: z.array(z.string().min(1)).default([]),
});

const teacherSchema = z.object({
  fullName: z.string().min(1),
  credentials: z.string().min(1),
  photoUrl: z.string().min(1).nullish(),
  order: z.coerce.number().int().min(0).default(0),
});

export const createProgramSchema = z.object({
  title: z.string().min(1),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, 'Slug inválido')
    .optional(),
  categoryId: z.uuid(),
  flyerUrl: z.string().min(1),
  objective: z.string().min(1),
  targetAudience: z.string().min(1),
  modality: z.string().min(1),
  // Fecha en formato ISO (ej. "2026-08-03"); se convierte a Date en el servicio.
  startDate: z.string().min(1),
  duration: z.string().min(1),
  schedule: z.string().min(1),
  requirements: z.array(z.string().min(1)).default([]),
  enrollmentFee: z.coerce.number().nonnegative(),
  totalCost: z.coerce.number().nonnegative(),
  currency: z.string().min(1).default('Bs'),
  paymentFacilities: z.string().nullish(),
  isPublished: z.boolean().default(true),
  modules: z.array(moduleSchema).default([]),
  teachers: z.array(teacherSchema).default([]),
});

export const updateProgramSchema = createProgramSchema.partial();

export class CreateProgramDto extends createZodDto(createProgramSchema) {}
export class UpdateProgramDto extends createZodDto(updateProgramSchema) {}
