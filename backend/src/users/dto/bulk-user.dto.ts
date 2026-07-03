import { Gender } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// Campo de texto opcional (recorta; cadena vacía → null).
const optionalText = z
  .string()
  .trim()
  .transform((v) => (v.length === 0 ? null : v))
  .nullable()
  .optional();

// Normaliza el género escrito en español en la plantilla ("Femenino"/"F"/…) al
// enum. En blanco o no reconocido → MALE (dato por defecto, como el resto del
// sistema); la carga masiva es tolerante para no rechazar filas por esto.
const bulkGender = z
  .string()
  .optional()
  .transform((v) => {
    const s = (v ?? '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '');
    return s.startsWith('f') ? Gender.FEMALE : Gender.MALE;
  });

// Una fila de estudiante de la carga masiva. El rol es siempre STUDENT (no se
// envía). La contraseña NO viene en la plantilla: se genera automáticamente
// (inicial nombre + inicial apellido + documento), por eso el documento de
// identidad es **obligatorio** aquí. "Expedido en", universidad de origen y
// profesión son opcionales (cadena vacía → null); el género se normaliza
// (por defecto MALE).
export const bulkStudentRowSchema = z.object({
  firstName: z.string().trim().min(1, 'El nombre es obligatorio'),
  lastName: z.string().trim().min(1, 'El apellido es obligatorio'),
  email: z
    .email('Correo electrónico no válido')
    .transform((v) => v.toLowerCase()),
  phone: z.string().trim().min(1, 'El teléfono es obligatorio'),
  idDocument: z
    .string()
    .trim()
    .min(1, 'El documento de identidad es obligatorio (genera la contraseña)'),
  issuedIn: optionalText,
  gender: bulkGender,
  originUniversity: optionalText,
  profession: optionalText,
});

export type BulkStudentRow = z.infer<typeof bulkStudentRowSchema>;

// El envelope se valida laxo (cada fila es un objeto) para permitir la **carga
// parcial**: el servicio valida fila por fila y reporta los errores, en vez de
// rechazar todo el lote si una fila falla.
export const bulkUsersSchema = z.object({
  students: z
    .array(z.record(z.string(), z.unknown()))
    .min(1, 'Envía al menos un estudiante')
    .max(1000, 'Máximo 1000 estudiantes por carga'),
});

export class BulkUsersDto extends createZodDto(bulkUsersSchema) {}
