import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(1),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, 'Slug inválido')
    .optional(),
  // Opcional: si no se envía, la categoría se agrega al final de la lista.
  displayOrder: z.coerce.number().int().min(0).optional(),
  isActive: z.boolean().default(true),
});

export const updateCategorySchema = createCategorySchema.partial();

export const reorderCategoriesSchema = z.object({
  orderedIds: z.array(z.string().min(1)).min(1),
});

export class CreateCategoryDto extends createZodDto(createCategorySchema) {}
export class UpdateCategoryDto extends createZodDto(updateCategorySchema) {}
export class ReorderCategoriesDto extends createZodDto(
  reorderCategoriesSchema,
) {}
