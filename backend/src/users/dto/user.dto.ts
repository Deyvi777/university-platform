import { Gender, Role } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// Campo de texto opcional: se recorta y una cadena vacía se guarda como null.
const optionalText = z
  .string()
  .trim()
  .transform((v) => (v.length === 0 ? null : v))
  .nullable()
  .optional();

// El admin solo crea cuentas de PROFESSOR o STUDENT desde el panel; las cuentas
// ADMIN no se emiten por este formulario.
export const createUserSchema = z.object({
  // Nombres y apellidos se guardan SIEMPRE en mayúsculas (convención
  // institucional; también homogeneiza orden/búsqueda, que son case-sensitive).
  firstName: z
    .string()
    .trim()
    .min(1, 'El nombre es obligatorio')
    .transform((v) => v.toUpperCase()),
  lastName: z
    .string()
    .trim()
    .min(1, 'El apellido es obligatorio')
    .transform((v) => v.toUpperCase()),
  // Normalizado a minúsculas (el login busca por email exacto; guardar
  // "Maria@..." dejaría la cuenta inaccesible para quien escribe "maria@...").
  email: z
    .email('Ingresa un correo electrónico válido')
    .transform((v) => v.toLowerCase()),
  // Opcional: al ALTA de un STUDENT la contraseña se genera automáticamente
  // (inicial nombre + inicial apellido + documento). Para PROFESSOR es
  // obligatoria; esa regla condicional la impone el servicio (`create`).
  password: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .optional(),
  phone: z.string().trim().min(1, 'El teléfono es obligatorio'),
  // Documento de identidad (carnet): obligatorio y único (lo valida la BD; un
  // duplicado devuelve 409 desde el servicio).
  idDocument: z
    .string()
    .trim()
    .min(1, 'El documento de identidad es obligatorio'),
  // "Expedido en": lugar de emisión del documento (opcional).
  issuedIn: optionalText,
  // Género (obligatorio).
  gender: z.enum([Gender.MALE, Gender.FEMALE], {
    error: 'Selecciona el género',
  }),
  // Universidad de origen y profesión (opcionales).
  originUniversity: optionalText,
  profession: optionalText,
  role: z.enum([Role.PROFESSOR, Role.STUDENT]),
  isActive: z.boolean().default(true),
});

// En edición la contraseña es opcional (solo se re-hashea si viene).
export const updateUserSchema = createUserSchema.partial();

export class CreateUserDto extends createZodDto(createUserSchema) {}
export class UpdateUserDto extends createZodDto(updateUserSchema) {}
