import { Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

// Notificaciones del usuario autenticado (docente/estudiante). Solo requiere
// estar autenticado: cada usuario lee y marca únicamente las suyas (el servicio
// filtra por su id), por eso no usa RolesGuard.
@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.notifications.listForUser(user.id);
  }

  @Get('unread-count')
  async unreadCount(@CurrentUser() user: AuthenticatedUser) {
    return { count: await this.notifications.unreadCount(user.id) };
  }

  // Declarado DESPUÉS de las rutas estáticas (`unread-count`) para que estas
  // tengan prioridad sobre el parámetro `:id`. Abrir la notificación la marca
  // como leída (estilo Gmail).
  @Get(':id')
  open(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.notifications.openForUser(user.id, id);
  }

  @Patch('read-all')
  markAllRead(@CurrentUser() user: AuthenticatedUser) {
    return this.notifications.markAllRead(user.id);
  }

  @Patch(':id/read')
  markRead(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.notifications.markRead(user.id, id);
  }
}
