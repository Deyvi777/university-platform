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
});

export class UpdateSettingsDto extends createZodDto(updateSettingsSchema) {}
