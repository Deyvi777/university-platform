import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// Un archivo adjunto de una entrega de Proyecto.
export const submissionFileSchema = z.object({
  name: z.string().trim().min(1).max(500),
  url: z.string().trim().min(1).max(2000),
  size: z.number().int().nonnegative().nullish(),
});

// Entrega del estudiante: texto y/o archivo(s) (al menos uno). `fileUrl` es el
// archivo único de la Tarea; `files` es la lista de archivos del Proyecto.
export const submitActivitySchema = z
  .object({
    content: z.string().trim().max(20000).nullish(),
    fileUrl: z.string().trim().max(2000).nullish(),
    files: z.array(submissionFileSchema).max(30).optional(),
  })
  .refine(
    (d) =>
      Boolean(d.content?.trim()) ||
      Boolean(d.fileUrl?.trim()) ||
      (d.files?.length ?? 0) > 0,
    {
      message: 'Adjunta al menos un archivo o escribe tu entrega',
      path: ['content'],
    },
  );

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
