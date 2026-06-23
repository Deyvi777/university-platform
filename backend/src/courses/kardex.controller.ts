import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CoursesService } from './courses.service';

// Kárdex del estudiante autenticado (todas sus notas por curso). Solo requiere
// autenticación; un docente/admin sin inscripciones recibe una lista vacía.
@ApiTags('kardex')
@ApiBearerAuth()
@Controller('me/kardex')
@UseGuards(JwtAuthGuard)
export class KardexController {
  constructor(private readonly courses: CoursesService) {}

  @Get()
  kardex(@CurrentUser() user: AuthenticatedUser) {
    return this.courses.getKardex(user.id);
  }
}
