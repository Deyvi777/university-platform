import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const questionSchema = z
  .object({
    id: z.uuid().optional(),
    type: z.enum(['SCALE_1_5', 'SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TEXT']),
    prompt: z.string().trim().min(1).max(500),
    required: z.boolean().default(true),
    options: z.array(z.string().trim().min(1).max(300)).max(20).default([]),
  })
  .superRefine((question, context) => {
    const selectable =
      question.type === 'SINGLE_CHOICE' || question.type === 'MULTIPLE_CHOICE';
    if (selectable && question.options.length < 2) {
      context.addIssue({
        code: 'custom',
        path: ['options'],
        message: 'Las preguntas de selección necesitan al menos dos opciones',
      });
    }
    if (!selectable && question.options.length > 0) {
      context.addIssue({
        code: 'custom',
        path: ['options'],
        message: 'Este tipo de pregunta no admite opciones',
      });
    }
  });

export const updateTeacherEvaluationQuestionnaireSchema = z.object({
  questions: z.array(questionSchema).min(1).max(100),
});

const answerSchema = z.object({
  questionId: z.uuid(),
  scaleValue: z.number().int().min(1).max(5).nullable().optional(),
  selectedOptions: z.array(z.string().max(300)).max(20).default([]),
  textValue: z.string().trim().max(10_000).nullable().optional(),
});

export const submitTeacherEvaluationSchema = z.object({
  teacherId: z.uuid(),
  answers: z.array(answerSchema).min(1).max(100),
});

export const setTeacherEvaluationEnabledSchema = z.object({
  enabled: z.boolean(),
});

export class UpdateTeacherEvaluationQuestionnaireDto extends createZodDto(
  updateTeacherEvaluationQuestionnaireSchema,
) {}
export class SubmitTeacherEvaluationDto extends createZodDto(
  submitTeacherEvaluationSchema,
) {}
export class SetTeacherEvaluationEnabledDto extends createZodDto(
  setTeacherEvaluationEnabledSchema,
) {}
