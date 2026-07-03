import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// Fecha en formato ISO de solo día ("2026-08-03"). Se guarda como @db.Date.
const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida (use YYYY-MM-DD)');

export const createReminderSchema = z.object({
  date: isoDate,
  note: z.string().trim().min(1, 'Escribe un apunte').max(500),
});

export const updateReminderSchema = z.object({
  date: isoDate.optional(),
  note: z.string().trim().min(1, 'Escribe un apunte').max(500).optional(),
});

export class CreateReminderDto extends createZodDto(createReminderSchema) {}
export class UpdateReminderDto extends createZodDto(updateReminderSchema) {}
