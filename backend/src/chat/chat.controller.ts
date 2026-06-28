import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ChatService } from './chat.service';

// Chat docente ↔ estudiante dentro de un módulo. Solo requiere autenticación: el
// servicio autoriza por docencia (docente/admin) o inscripción (estudiante). El
// envío de mensajes va por WebSocket (ChatGateway); aquí se cargan los contactos
// y el historial.
@ApiTags('chat')
@ApiBearerAuth()
@Controller('me/chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  // Contactos del módulo: para el estudiante son los docentes; para el docente,
  // los estudiantes inscritos. Incluye el conteo de no leídos por contacto.
  @Get(':moduleId/contacts')
  getContacts(
    @CurrentUser() user: AuthenticatedUser,
    @Param('moduleId') moduleId: string,
  ) {
    return this.chat.getContacts(user.id, user.role, moduleId);
  }

  // Historial de la conversación con un contacto (marca como leídos los
  // mensajes entrantes y sus notificaciones de campana).
  @Get(':moduleId/contacts/:counterpartId/messages')
  getMessages(
    @CurrentUser() user: AuthenticatedUser,
    @Param('moduleId') moduleId: string,
    @Param('counterpartId') counterpartId: string,
  ) {
    return this.chat.getMessages(user.id, user.role, moduleId, counterpartId);
  }
}
