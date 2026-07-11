import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// Cada red social es opcional: cadena vacía se normaliza a null (oculta el
// icono en la landing). Si se envía un valor, debe ser una URL válida.
const linkField = z.preprocess(
  (value) => (value === '' ? null : value),
  z.string().url('Debe ser una URL válida').max(2048).nullish(),
);

export const updateSettingsSchema = z.object({
  facebook: linkField,
  instagram: linkField,
  linkedin: linkField,
  youtube: linkField,
  tiktok: linkField,
  whatsapp: linkField,
  // Buzón del aviso de solicitudes de inscripción. Opcional en el PATCH (los
  // formularios de redes no lo envían); si viene, debe ser un correo válido.
  enrollmentNotifyEmail: z
    .email('Debe ser un correo válido')
    .max(320)
    .transform((v) => v.toLowerCase())
    .optional(),
});

export class UpdateSettingsDto extends createZodDto(updateSettingsSchema) {}
