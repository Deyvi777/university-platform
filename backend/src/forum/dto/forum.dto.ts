import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// Crear un mensaje en el foro. `parentId` opcional → es una respuesta.
export const createForumPostSchema = z.object({
  body: z.string().trim().min(1).max(10000),
  parentId: z.string().uuid().nullish(),
});

export class CreateForumPostDto extends createZodDto(createForumPostSchema) {}

// Editar el cuerpo de un mensaje propio.
export const updateForumPostSchema = z.object({
  body: z.string().trim().min(1).max(10000),
});

export class UpdateForumPostDto extends createZodDto(updateForumPostSchema) {}
