import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const uploadFolders = [
  'programs',
  'partners',
  'team',
  'gallery',
] as const;

export const uploadQuerySchema = z.object({
  folder: z.enum(uploadFolders),
});

export class UploadQueryDto extends createZodDto(uploadQuerySchema) {}

// Carpetas de video (POST /uploads/video). Opcional: por defecto va al video
// promocional de programas; la galería de la landing usa su propia carpeta.
export const videoUploadFolders = [
  'programs-videos',
  'gallery-videos',
] as const;

export const videoUploadQuerySchema = z.object({
  folder: z.enum(videoUploadFolders).default('programs-videos'),
});

export class VideoUploadQueryDto extends createZodDto(videoUploadQuerySchema) {}
