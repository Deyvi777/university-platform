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
import {
  CreateClassSessionDto,
  UpdateClassSessionDto,
} from './dto/schedule.dto';
import { ScheduleService } from './schedule.service';

// Cronograma de clases de un módulo. Solo JwtAuthGuard: el servicio autoriza
// por docencia (escritura) o inscripción (lectura) y 404 en el resto.
@ApiTags('schedule')
@ApiBearerAuth()
@Controller('me')
@UseGuards(JwtAuthGuard)
export class ScheduleController {
  constructor(private readonly schedule: ScheduleService) {}

  @Get('modules/:moduleId/schedule')
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Param('moduleId') moduleId: string,
  ) {
    return this.schedule.list(user.id, moduleId);
  }

  @Post('modules/:moduleId/schedule')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('moduleId') moduleId: string,
    @Body() dto: CreateClassSessionDto,
  ) {
    return this.schedule.create(user.id, moduleId, dto);
  }

  @Patch('schedule/:sessionId')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('sessionId') sessionId: string,
    @Body() dto: UpdateClassSessionDto,
  ) {
    return this.schedule.update(user.id, sessionId, dto);
  }

  @Delete('schedule/:sessionId')
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('sessionId') sessionId: string,
  ) {
    return this.schedule.remove(user.id, sessionId);
  }
}
