import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CalendarService } from './calendar.service';
import { CreateReminderDto, UpdateReminderDto } from './dto/calendar.dto';

// Calendario del panel derecho del usuario autenticado: fechas plazo de
// actividades + sus recordatorios. Solo requiere autenticación: cada usuario
// opera únicamente sobre sus propios datos (el servicio filtra por su id).
@ApiTags('calendar')
@ApiBearerAuth()
@Controller('me/calendar')
@UseGuards(JwtAuthGuard)
export class CalendarController {
  constructor(private readonly calendar: CalendarService) {}

  @Get('overview')
  overview(@CurrentUser() user: AuthenticatedUser) {
    return this.calendar.overview(user.id, user.role);
  }

  @Get('reminders')
  listReminders(@CurrentUser() user: AuthenticatedUser) {
    return this.calendar.listReminders(user.id);
  }

  @Post('reminders')
  createReminder(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateReminderDto,
  ) {
    return this.calendar.createReminder(user.id, dto);
  }

  @Patch('reminders/:id')
  updateReminder(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateReminderDto,
  ) {
    return this.calendar.updateReminder(user.id, id, dto);
  }

  @Delete('reminders/:id')
  removeReminder(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.calendar.removeReminder(user.id, id);
  }
}
