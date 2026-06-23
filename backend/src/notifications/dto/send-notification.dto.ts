import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// A quién va dirigido el aviso del administrador:
// - ALL: todos los docentes y estudiantes
// - PROFESSORS / STUDENTS: todos los de ese rol
// - SELECTED: una lista explícita de usuarios (requiere `userIds`)
export const notificationAudience = z.enum([
  'ALL',
  'PROFESSORS',
  'STUDENTS',
  'SELECTED',
]);

export const sendNotificationSchema = z
  .object({
    audience: notificationAudience,
    userIds: z.array(z.uuid()).optional(),
    title: z.string().trim().min(1, 'El título es obligatorio').max(120),
    body: z.string().trim().min(1, 'El mensaje es obligatorio').max(2000),
  })
  .refine((d) => d.audience !== 'SELECTED' || (d.userIds?.length ?? 0) > 0, {
    message: 'Selecciona al menos un destinatario',
    path: ['userIds'],
  });

export class SendNotificationDto extends createZodDto(sendNotificationSchema) {}
