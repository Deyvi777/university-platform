import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(1),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, 'Slug inválido')
    .optional(),
  displayOrder: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const updateCategorySchema = createCategorySchema.partial();

export class CreateCategoryDto extends createZodDto(createCategorySchema) {}
export class UpdateCategoryDto extends createZodDto(updateCategorySchema) {}
