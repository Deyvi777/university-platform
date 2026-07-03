import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// ── Contenido del módulo (temario) ───────────────────────────────────────────
// Un contenido es de un tipo (`kind`); cada tipo usa un subconjunto de campos.
// El `kind` se fija al crear y no cambia luego (los updates son parciales sin
// `kind`).

const activityTypeEnum = z.enum([
  'ASSIGNMENT',
  'QUIZ',
  'EXAM',
  'PROJECT',
  'FORUM',
]);

const contentFields = {
  title: z.string().trim().min(1, 'El título es obligatorio').max(200),
  isPublished: z.boolean().optional(),
  // TEXT
  body: z.string().max(100000).nullish(),
  // VIDEO
  videoUrl: z
    .string()
    .trim()
    .url('Enlace de video inválido')
    .max(2000)
    .nullish(),
  // MATERIAL
  materialType: z.enum(['FILE', 'LINK']).nullish(),
  url: z.string().trim().min(1).max(2000).nullish(),
  // ACTIVITY
  activityType: activityTypeEnum.nullish(),
  instructions: z.string().max(20000).nullish(),
  dueDate: z.string().trim().min(1).nullish(),
  // min 1: una actividad "sobre 0" no es calificable (y dividiría entre cero
  // al ponderar la nota del módulo).
  maxScore: z.coerce
    .number()
    .min(1, 'El puntaje debe ser mayor a 0')
    .max(100)
    .nullish(),
  weight: z.coerce.number().min(0).max(100).nullish(),
  // Actividad presencial (calificada a mano en la libreta).
  isOffline: z.boolean().optional(),
  // ACTIVITY de tipo QUIZ/EXAM — ajustes del motor de preguntas.
  timeLimitMin: z.coerce.number().int().min(0).max(1440).nullish(),
  availableFrom: z.string().trim().min(1).nullish(),
  availableUntil: z.string().trim().min(1).nullish(),
  singleAttempt: z.boolean().nullish(),
  shuffle: z.boolean().nullish(),
  revealAnswers: z.boolean().nullish(),
  // FOLDER — lista de archivos contenidos. En update reemplaza la lista entera.
  files: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(300),
        url: z.string().trim().min(1).max(2000),
        size: z.coerce.number().int().min(0).nullish(),
      }),
    )
    .max(100)
    .nullish(),
};

export const contentCreateSchema = z
  .object({
    kind: z.enum(['TEXT', 'VIDEO', 'MATERIAL', 'ACTIVITY', 'FOLDER']),
    // Examen de recuperación (solo al crear; no se puede convertir después).
    // RECUPERATORIO lo habilita el docente; SEGUNDA_INSTANCIA solo el admin.
    recoveryStage: z.enum(['RECUPERATORIO', 'SEGUNDA_INSTANCIA']).nullish(),
    ...contentFields,
  })
  .superRefine((val, ctx) => {
    if (val.kind === 'VIDEO' && !val.videoUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['videoUrl'],
        message: 'El video requiere un enlace',
      });
    }
    if (val.kind === 'MATERIAL' && !val.url) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['url'],
        message: 'El material requiere un archivo o enlace',
      });
    }
    if (
      val.recoveryStage &&
      (val.kind !== 'ACTIVITY' ||
        (val.activityType !== 'QUIZ' && val.activityType !== 'EXAM'))
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['recoveryStage'],
        message:
          'Un examen de recuperación debe ser una actividad de tipo cuestionario o examen',
      });
    }
  });

// Update parcial: el `kind` no se puede cambiar.
export const contentUpdateSchema = z.object(contentFields).partial();

export class CreateContentDto extends createZodDto(contentCreateSchema) {}
export class UpdateContentDto extends createZodDto(contentUpdateSchema) {}

// ── Reordenamiento (drag-and-drop) ───────────────────────────────────────────
export const reorderSchema = z.object({
  orderedIds: z.array(z.string().min(1)).min(1),
});
export class ReorderContentsDto extends createZodDto(reorderSchema) {}

// ── Progreso del estudiante ──────────────────────────────────────────────────
export const contentProgressSchema = z.object({
  completed: z.boolean(),
});
export class ContentProgressDto extends createZodDto(contentProgressSchema) {}
