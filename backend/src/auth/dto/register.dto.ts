import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const registerSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().trim().min(1),
  idDocument: z
    .string()
    .trim()
    .transform((v) => (v.length === 0 ? null : v))
    .nullable()
    .optional(),
});

export class RegisterDto extends createZodDto(registerSchema) {}
