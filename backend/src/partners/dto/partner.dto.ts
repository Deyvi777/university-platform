import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createPartnerSchema = z.object({
  name: z.string().min(1),
  logoUrl: z.string().min(1),
  displayOrder: z.coerce.number().int().min(0).default(0),
  isPublished: z.boolean().default(true),
});

export const updatePartnerSchema = createPartnerSchema.partial();

export class CreatePartnerDto extends createZodDto(createPartnerSchema) {}
export class UpdatePartnerDto extends createZodDto(updatePartnerSchema) {}
