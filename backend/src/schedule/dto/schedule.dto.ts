import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// Fecha "YYYY-MM-DD" (se guarda como @db.Date) y horas "HH:mm" en texto (hora
// local de Bolivia, sin conversión de zona horaria).
const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida (use YYYY-MM-DD)');
const hhmm = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Hora inválida (use HH:mm)');

// Campos de texto opcionales: "" se normaliza a null.
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === '' ? null : v))
    .nullable()
    .optional();

export const createClassSessionSchema = z.object({
  date: isoDate,
  startTime: hhmm,
  endTime: hhmm.nullable().optional(),
  title: optionalText(200),
  location: optionalText(300),
});

export const updateClassSessionSchema = createClassSessionSchema.partial();

export class CreateClassSessionDto extends createZodDto(
  createClassSessionSchema,
) {}
export class UpdateClassSessionDto extends createZodDto(
  updateClassSessionSchema,
) {}
