import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const uploadFolders = ['programs', 'partners', 'team'] as const;

export const uploadQuerySchema = z.object({
  folder: z.enum(uploadFolders),
});

export class UploadQueryDto extends createZodDto(uploadQuerySchema) {}
