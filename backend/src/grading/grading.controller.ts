import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { GradingService } from './grading.service';
import {
  GradeSubmissionDto,
  ModuleObservationDto,
  SubmitActivityDto,
} from './dto/grading.dto';

// Entregas (estudiante) y calificación (docente). Solo requiere autenticación:
// el servicio autoriza por inscripción (estudiante) o docencia (docente).
@ApiTags('grading')
@ApiBearerAuth()
@Controller('me')
@UseGuards(JwtAuthGuard)
export class GradingController {
  constructor(private readonly grading: GradingService) {}

  // Estudiante entrega su trabajo.
  @Post('activities/:activityId/submit')
  submit(
    @CurrentUser() user: AuthenticatedUser,
    @Param('activityId') activityId: string,
    @Body() dto: SubmitActivityDto,
  ) {
    return this.grading.submitActivity(user.id, activityId, dto);
  }

  // Estudiante borra el archivo de su entrega.
  @Delete('activities/:activityId/submission-file')
  removeSubmissionFile(
    @CurrentUser() user: AuthenticatedUser,
    @Param('activityId') activityId: string,
  ) {
    return this.grading.removeSubmissionFile(user.id, activityId);
  }

  // Docente: lista de estudiantes con sus entregas para calificar.
  @Get('activities/:activityId/grading')
  gradingList(
    @CurrentUser() user: AuthenticatedUser,
    @Param('activityId') activityId: string,
  ) {
    return this.grading.getActivityGrading(user.id, activityId);
  }

  // Docente: califica la entrega de un estudiante.
  @Put('activities/:activityId/students/:studentId/grade')
  grade(
    @CurrentUser() user: AuthenticatedUser,
    @Param('activityId') activityId: string,
    @Param('studentId') studentId: string,
    @Body() dto: GradeSubmissionDto,
  ) {
    return this.grading.gradeSubmission(user.id, activityId, studentId, dto);
  }

  // Docente: libreta de calificaciones del módulo (estudiantes × actividades).
  @Get('modules/:moduleId/gradebook')
  gradebook(
    @CurrentUser() user: AuthenticatedUser,
    @Param('moduleId') moduleId: string,
  ) {
    return this.grading.getModuleGradebook(user.id, moduleId);
  }

  // Docente: guarda su observación sobre la nota de módulo de un estudiante.
  @Put('modules/:moduleId/students/:studentId/observation')
  setObservation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('moduleId') moduleId: string,
    @Param('studentId') studentId: string,
    @Body() dto: ModuleObservationDto,
  ) {
    return this.grading.setModuleObservation(
      user.id,
      moduleId,
      studentId,
      dto.observations,
    );
  }
}
