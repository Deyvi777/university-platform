import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// Cuerpo de un mensaje de chat (docente ↔ estudiante dentro de un módulo).
export const sendMessageSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, 'El mensaje no puede estar vacío')
    .max(4000, 'El mensaje es demasiado largo'),
});
export class SendMessageDto extends createZodDto(sendMessageSchema) {}
