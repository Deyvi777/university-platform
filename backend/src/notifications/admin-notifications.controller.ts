import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { SendNotificationDto } from './dto/send-notification.dto';
import { NotificationsService } from './notifications.service';

// Envío de avisos por parte del administrador (a uno, varios o masivo por rol)
// y el historial de lo enviado.
@ApiTags('admin-notifications')
@ApiBearerAuth()
@Controller('admin/notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminNotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Post()
  send(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SendNotificationDto,
  ) {
    return this.notifications.broadcast(dto, user.id);
  }

  @Get()
  history(
    @Query('page') page?: string,
    @Query('audience') audience?: string,
    @Query('q') q?: string,
  ) {
    return this.notifications.listAnnouncements({
      page: page ? Number.parseInt(page, 10) : undefined,
      audience,
      q,
    });
  }
}
