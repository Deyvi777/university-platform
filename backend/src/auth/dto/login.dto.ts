import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const loginSchema = z.object({
  // Normalizado a minúsculas: el lookup por email es case-sensitive en
  // Postgres y todas las cuentas se guardan en minúsculas.
  email: z.email().transform((v) => v.toLowerCase()),
  password: z.string().min(6),
  // "Recordarme": emite un token de vida larga (JWT_REMEMBER_EXPIRES_IN) en vez
  // del TTL por defecto. El frontend alinea la sesión con el `exp` del token.
  remember: z.boolean().optional().default(false),
});

export class LoginDto extends createZodDto(loginSchema) {}
