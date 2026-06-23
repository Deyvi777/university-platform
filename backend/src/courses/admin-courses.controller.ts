import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CoursesService } from './courses.service';
import {
  AddEnrollmentsDto,
  CreateCourseDto,
  SetModuleStatusDto,
  SetModuleTeachersDto,
  UpdateCourseDto,
} from './dto/course.dto';

// Capa académica real ("Programa" en el panel). Admin-only, sin controlador
// público (los cursos no se exponen en la landing).
@ApiTags('admin-courses')
@ApiBearerAuth()
@Controller('admin/courses')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminCoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  findAll() {
    return this.coursesService.findAllAdmin();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.coursesService.findOneAdmin(id);
  }

  @Post()
  create(@Body() dto: CreateCourseDto) {
    return this.coursesService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCourseDto) {
    return this.coursesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.coursesService.remove(id);
  }

  // Asignar (reemplazar) los docentes a cargo de un módulo (co-docencia).
  @Put(':id/modules/:moduleId/teachers')
  setModuleTeachers(
    @Param('id') id: string,
    @Param('moduleId') moduleId: string,
    @Body() dto: SetModuleTeachersDto,
  ) {
    return this.coursesService.setModuleTeachers(id, moduleId, dto);
  }

  // Cambiar el estado de un módulo (Borrador / Activo / Concluido).
  @Patch(':id/modules/:moduleId/status')
  setModuleStatus(
    @Param('id') id: string,
    @Param('moduleId') moduleId: string,
    @Body() dto: SetModuleStatusDto,
  ) {
    return this.coursesService.setModuleStatus(id, moduleId, dto);
  }

  // Inscribir estudiantes al programa (acceso a todos los módulos).
  @Post(':id/enrollments')
  addEnrollments(@Param('id') id: string, @Body() dto: AddEnrollmentsDto) {
    return this.coursesService.addEnrollments(id, dto);
  }

  @Delete(':id/enrollments/:studentId')
  removeEnrollment(
    @Param('id') id: string,
    @Param('studentId') studentId: string,
  ) {
    return this.coursesService.removeEnrollment(id, studentId);
  }
}
