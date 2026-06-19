import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const listProgramsQuerySchema = z.object({
  // slug de la categoría por la que filtrar (ej. "maestria")
  category: z.string().optional(),
});

export class ListProgramsQueryDto extends createZodDto(
  listProgramsQuerySchema,
) {}
