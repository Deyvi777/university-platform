import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// Una fila de estudiante de la carga masiva. El rol es siempre STUDENT (no se
// envía), la contraseña viene en la plantilla (mínimo 6). El documento de
// identidad es opcional (cadena vacía → null).
export const bulkStudentRowSchema = z.object({
  firstName: z.string().trim().min(1, 'El nombre es obligatorio'),
  lastName: z.string().trim().min(1, 'El apellido es obligatorio'),
  email: z.email('Correo electrónico no válido'),
  phone: z.string().trim().min(1, 'El teléfono es obligatorio'),
  idDocument: z
    .string()
    .trim()
    .transform((v) => (v.length === 0 ? null : v))
    .nullable()
    .optional(),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
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
