import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
  // "Recordarme": emite un token de vida larga (JWT_REMEMBER_EXPIRES_IN) en vez
  // del TTL por defecto. El frontend alinea la sesión con el `exp` del token.
  remember: z.boolean().optional().default(false),
});

export class LoginDto extends createZodDto(loginSchema) {}
