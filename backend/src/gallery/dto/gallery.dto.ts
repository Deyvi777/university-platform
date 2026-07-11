import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createGalleryItemSchema = z.object({
  type: z.enum(['IMAGE', 'VIDEO']),
  // Ruta relativa devuelta por el storage (/files/gallery/... o
  // /files/gallery-videos/...).
  url: z.string().min(1),
  // Pie de foto opcional; "" se normaliza a null.
  title: z
    .string()
    .trim()
    .transform((v) => (v === '' ? null : v))
    .nullable()
    .optional(),
  isPublished: z.boolean().default(true),
});

export const updateGalleryItemSchema = createGalleryItemSchema.partial();

export const reorderGallerySchema = z.object({
  orderedIds: z.array(z.string().min(1)).min(1),
});

export class CreateGalleryItemDto extends createZodDto(
  createGalleryItemSchema,
) {}
export class UpdateGalleryItemDto extends createZodDto(
  updateGalleryItemSchema,
) {}
export class ReorderGalleryDto extends createZodDto(reorderGallerySchema) {}
