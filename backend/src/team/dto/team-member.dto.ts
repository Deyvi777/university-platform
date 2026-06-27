import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createTeamMemberSchema = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  photoUrl: z.string().min(1),
  // Opcional: si no se envía, el integrante se agrega al final de la lista.
  displayOrder: z.coerce.number().int().min(0).optional(),
  isPublished: z.boolean().default(true),
});

export const updateTeamMemberSchema = createTeamMemberSchema.partial();

export const reorderTeamSchema = z.object({
  orderedIds: z.array(z.string().min(1)).min(1),
});

export class CreateTeamMemberDto extends createZodDto(createTeamMemberSchema) {}
export class UpdateTeamMemberDto extends createZodDto(updateTeamMemberSchema) {}
export class ReorderTeamDto extends createZodDto(reorderTeamSchema) {}
