import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import {
  SetTeacherEvaluationEnabledDto,
  UpdateTeacherEvaluationQuestionnaireDto,
} from './dto/teacher-evaluation.dto';
import { TeacherEvaluationsService } from './teacher-evaluations.service';

@ApiTags('admin-teacher-evaluations')
@ApiBearerAuth()
@Controller('admin/teacher-evaluations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminTeacherEvaluationsController {
  constructor(private readonly service: TeacherEvaluationsService) {}

  @Get('questionnaire')
  questionnaire() {
    return this.service.getQuestionnaire();
  }

  @Put('questionnaire')
  updateQuestionnaire(@Body() dto: UpdateTeacherEvaluationQuestionnaireDto) {
    return this.service.updateQuestionnaire(dto);
  }

  @Get('results')
  results() {
    return this.service.listResults();
  }

  @Patch('courses/:courseId/modules/:moduleId/enabled')
  setModuleEnabled(
    @Param('courseId') courseId: string,
    @Param('moduleId') moduleId: string,
    @Body() dto: SetTeacherEvaluationEnabledDto,
  ) {
    return this.service.setModuleEnabled(courseId, moduleId, dto);
  }
}
