import { Gender } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// Solicitud de inscripción pública (landing): los mismos datos que el alta de
// estudiante (sin contraseña), pero aquí TODOS los campos son obligatorios.
// Mismas normalizaciones que `createUserSchema` (nombres en MAYÚSCULAS,
// correo en minúsculas) para que la conversión a cuenta sea 1:1.
export const createEnrollmentRequestSchema = z.object({
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
  email: z
    .email('Ingresa un correo electrónico válido')
    .transform((v) => v.toLowerCase()),
  phone: z.string().trim().min(1, 'El teléfono es obligatorio'),
  idDocument: z
    .string()
    .trim()
    .min(1, 'El documento de identidad es obligatorio'),
  issuedIn: z.string().trim().min(1, 'El lugar de expedición es obligatorio'),
  gender: z.enum([Gender.MALE, Gender.FEMALE], {
    error: 'Selecciona el género',
  }),
  originUniversity: z
    .string()
    .trim()
    .min(1, 'La universidad de origen es obligatoria'),
  profession: z.string().trim().min(1, 'La profesión es obligatoria'),
  // Nombre del programa desde el que se envió el formulario (se guarda como
  // texto: el programa de la landing puede editarse o borrarse después).
  programTitle: z.string().trim().min(1, 'El programa es obligatorio'),
  programSlug: z.string().trim().min(1).nullish(),
});

export class CreateEnrollmentRequestDto extends createZodDto(
  createEnrollmentRequestSchema,
) {}
