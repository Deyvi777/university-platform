import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createPartnerSchema = z.object({
  name: z.string().min(1),
  logoUrl: z.string().min(1),
  // Opcional: si no se envía, la institución se agrega al final de la lista.
  displayOrder: z.coerce.number().int().min(0).optional(),
  isPublished: z.boolean().default(true),
});

export const updatePartnerSchema = createPartnerSchema.partial();

export const reorderPartnersSchema = z.object({
  orderedIds: z.array(z.string().min(1)).min(1),
});

export class CreatePartnerDto extends createZodDto(createPartnerSchema) {}
export class UpdatePartnerDto extends createZodDto(updatePartnerSchema) {}
export class ReorderPartnersDto extends createZodDto(reorderPartnersSchema) {}
