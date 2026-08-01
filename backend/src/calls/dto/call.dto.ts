import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const nullableText = z
  .string()
  .trim()
  .transform((value) => value || null)
  .nullable()
  .optional();

const questionSchema = z
  .object({
    id: z.uuid().optional(),
    type: z.enum(['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TEXT', 'FILE']),
    prompt: z.string().trim().min(1).max(500),
    description: nullableText,
    required: z.boolean().default(true),
    options: z.array(z.string().trim().min(1).max(300)).max(30).default([]),
  })
  .superRefine((question, context) => {
    const needsOptions =
      question.type === 'SINGLE_CHOICE' || question.type === 'MULTIPLE_CHOICE';
    if (needsOptions && question.options.length < 2) {
      context.addIssue({
        code: 'custom',
        path: ['options'],
        message: 'Las preguntas de selección necesitan al menos dos opciones',
      });
    }
    if (!needsOptions && question.options.length > 0) {
      context.addIssue({
        code: 'custom',
        path: ['options'],
        message: 'Este tipo de pregunta no admite opciones',
      });
    }
  });

const callSchemaBase = z.object({
  title: z.string().trim().min(1).max(200),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, 'Slug inválido')
    .optional(),
  summary: z.string().trim().min(1).max(500),
  description: nullableText,
  coverUrl: z.string().trim().min(1).nullable().optional(),
  opensAt: z.string().trim().min(1).nullable().optional(),
  closesAt: z.string().trim().min(1).nullable().optional(),
  isPublished: z.boolean().default(false),
  questions: z.array(questionSchema).min(1).max(100),
});

function validateDates(
  call: { opensAt?: string | null; closesAt?: string | null },
  context: z.RefinementCtx,
) {
  if (
    call.opensAt &&
    call.closesAt &&
    new Date(call.opensAt) > new Date(call.closesAt)
  ) {
    context.addIssue({
      code: 'custom',
      path: ['closesAt'],
      message: 'La fecha de cierre debe ser posterior a la apertura',
    });
  }
}

export const createCallSchema = callSchemaBase.superRefine(validateDates);
export const updateCallSchema = callSchemaBase
  .partial()
  .superRefine(validateDates);

const uploadedFileSchema = z.object({
  name: z.string().trim().min(1).max(255),
  url: z
    .string()
    .startsWith('/files/call-applications/', 'Ruta de archivo inválida'),
  size: z
    .number()
    .int()
    .nonnegative()
    .max(20 * 1024 * 1024),
  mimeType: z.string().trim().min(1).max(150),
});

const applicationAnswerSchema = z.object({
  questionId: z.uuid(),
  textValue: z.string().max(10_000).nullable().optional(),
  selectedOptions: z.array(z.string().max(300)).max(30).default([]),
  files: z.array(uploadedFileSchema).max(5).default([]),
});

export const createCallApplicationSchema = z.object({
  answers: z.array(applicationAnswerSchema).max(100),
});

export class CreateCallDto extends createZodDto(createCallSchema) {}
export class UpdateCallDto extends createZodDto(updateCallSchema) {}
export class CreateCallApplicationDto extends createZodDto(
  createCallApplicationSchema,
) {}
