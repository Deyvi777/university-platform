import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// Entrega del estudiante: texto y/o archivo (al menos uno).
export const submitActivitySchema = z
  .object({
    content: z.string().trim().max(20000).nullish(),
    fileUrl: z.string().trim().max(2000).nullish(),
  })
  .refine((d) => Boolean(d.content?.trim()) || Boolean(d.fileUrl?.trim()), {
    message: 'Adjunta un archivo o escribe tu entrega',
    path: ['content'],
  });

export class SubmitActivityDto extends createZodDto(submitActivitySchema) {}

// Calificación del docente sobre una actividad de un estudiante.
export const gradeSubmissionSchema = z.object({
  score: z.coerce.number().min(0).max(10000),
  feedback: z.string().trim().max(5000).nullish(),
});

export class GradeSubmissionDto extends createZodDto(gradeSubmissionSchema) {}

// Observación del docente sobre la nota de módulo de un estudiante.
export const moduleObservationSchema = z.object({
  observations: z.string().max(5000),
});

export class ModuleObservationDto extends createZodDto(
  moduleObservationSchema,
) {}
