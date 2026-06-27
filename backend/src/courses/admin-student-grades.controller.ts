import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CoursesService } from './courses.service';

// Lectura de notas de un estudiante para el panel del ADMIN ("Notas de
// estudiantes"). Solo ADMIN. Reutiliza la lógica de notas del estudiante
// (`getKardex`/`getStudentGradeDetail`) pero apuntando a cualquier `:id`.
@ApiTags('admin-student-grades')
@ApiBearerAuth()
@Controller('admin/students')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminStudentGradesController {
  constructor(private readonly courses: CoursesService) {}

  /** Kárdex del estudiante (igual que el que ve el propio estudiante). */
  @Get(':id/kardex')
  kardex(@Param('id') id: string) {
    return this.courses.getKardex(id);
  }

  /** Detalle de notas por actividad (programas → módulos → actividades). */
  @Get(':id/grades')
  grades(@Param('id') id: string) {
    return this.courses.getStudentGradeDetail(id);
  }
}
