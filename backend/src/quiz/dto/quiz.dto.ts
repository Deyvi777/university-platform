import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const questionTypeEnum = z.enum([
  'SINGLE_CHOICE',
  'MULTIPLE_CHOICE',
  'TRUE_FALSE',
  'SHORT_TEXT',
  'ESSAY',
  'FILE',
]);

const optionSchema = z.object({
  text: z.string().trim().min(1).max(2000),
  isCorrect: z.boolean().default(false),
});

const questionSchema = z
  .object({
    type: questionTypeEnum,
    prompt: z.string().trim().min(1).max(5000),
    points: z.coerce.number().min(0).max(1000).default(1),
    boolAnswer: z.boolean().nullish(),
    acceptedAnswers: z
      .array(z.string().trim().min(1).max(500))
      .max(20)
      .default([]),
    options: z.array(optionSchema).max(12).default([]),
  })
  .superRefine((q, ctx) => {
    if (q.type === 'SINGLE_CHOICE' || q.type === 'MULTIPLE_CHOICE') {
      if (q.options.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'Una pregunta de opción múltiple necesita al menos 2 opciones',
        });
      }
      const correct = q.options.filter((o) => o.isCorrect).length;
      if (correct < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Marca al menos una opción correcta',
        });
      }
      if (q.type === 'SINGLE_CHOICE' && correct > 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'Una pregunta de una sola respuesta no puede tener varias correctas',
        });
      }
    }
    if (q.type === 'TRUE_FALSE' && q.boolAnswer === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Indica si la afirmación es verdadera o falsa',
      });
    }
    if (q.type === 'SHORT_TEXT' && q.acceptedAnswers.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Agrega al menos una respuesta aceptada',
      });
    }
  });

// Reemplazo total del banco de preguntas de un cuestionario/examen.
export const saveQuestionsSchema = z.object({
  questions: z.array(questionSchema).max(100),
});

export class SaveQuestionsDto extends createZodDto(saveQuestionsSchema) {}

const quizAnswerSchema = z
  .object({
    questionId: z.string().uuid(),
    selectedOptionIds: z.array(z.string().uuid()).max(12).default([]),
    boolValue: z.boolean().nullish(),
    textValue: z.string().max(10000).nullish(),
    fileUrl: z
      .string()
      .trim()
      .regex(
        /^\/files\/submissions\/[0-9a-f-]+\.[a-z0-9]+$/i,
        'La ruta del archivo no es válida',
      )
      .nullish(),
    fileName: z.string().trim().min(1).max(255).nullish(),
    fileSize: z.coerce
      .number()
      .int()
      .min(0)
      .max(20 * 1024 * 1024)
      .nullish(),
  })
  .superRefine((answer, ctx) => {
    if (answer.fileUrl && !answer.fileName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['fileName'],
        message: 'El nombre del archivo es requerido',
      });
    }
    if (!answer.fileUrl && (answer.fileName || answer.fileSize != null)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['fileUrl'],
        message: 'La ruta del archivo es requerida',
      });
    }
  });

// Envío del estudiante: una respuesta por pregunta.
export const submitQuizSchema = z.object({
  answers: z.array(quizAnswerSchema).max(100),
});

export class SubmitQuizDto extends createZodDto(submitQuizSchema) {}

// Autoguardado progresivo del intento en curso (misma forma que el envío
// final): persiste las respuestas sin calificar, para poder calificar un
// intento que venza sin envío y para restaurar el formulario al recargar.
export class AutosaveQuizDto extends createZodDto(submitQuizSchema) {}

// Corrección manual (ensayos/archivos): puntaje por pregunta.
export const gradeEssaysSchema = z.object({
  grades: z
    .array(
      z.object({
        questionId: z.string().uuid(),
        points: z.coerce.number().min(0).max(1000),
      }),
    )
    .max(100),
});

export class GradeEssaysDto extends createZodDto(gradeEssaysSchema) {}
