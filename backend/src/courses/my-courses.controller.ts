import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CoursesService } from './courses.service';

// Cursos asignados al usuario autenticado (panel docente/estudiante). Solo
// requiere estar autenticado: el servicio filtra según el rol del usuario.
@ApiTags('my-courses')
@ApiBearerAuth()
@Controller('me/courses')
@UseGuards(JwtAuthGuard)
export class MyCoursesController {
  constructor(private readonly courses: CoursesService) {}

  @Get()
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.courses.findForUser(user.id, user.role);
  }

  @Get(':id')
  findOneMine(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.courses.findOneForUser(user.id, user.role, id);
  }
}
