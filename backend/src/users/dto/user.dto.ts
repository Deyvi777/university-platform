import { Role } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// El admin solo crea cuentas de PROFESSOR o STUDENT desde el panel; las cuentas
// ADMIN no se emiten por este formulario.
export const createUserSchema = z.object({
  firstName: z.string().trim().min(1, 'El nombre es obligatorio'),
  lastName: z.string().trim().min(1, 'El apellido es obligatorio'),
  email: z.email('Ingresa un correo electrónico válido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  role: z.enum([Role.PROFESSOR, Role.STUDENT]),
  isActive: z.boolean().default(true),
});

// En edición la contraseña es opcional (solo se re-hashea si viene).
export const updateUserSchema = createUserSchema.partial();

export class CreateUserDto extends createZodDto(createUserSchema) {}
export class UpdateUserDto extends createZodDto(updateUserSchema) {}
