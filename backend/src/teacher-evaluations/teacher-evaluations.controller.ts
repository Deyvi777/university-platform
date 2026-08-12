import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { SubmitTeacherEvaluationDto } from './dto/teacher-evaluation.dto';
import { TeacherEvaluationsService } from './teacher-evaluations.service';

@ApiTags('teacher-evaluations')
@ApiBearerAuth()
@Controller('me/modules/:moduleId/teacher-evaluations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.STUDENT)
export class TeacherEvaluationsController {
  constructor(private readonly service: TeacherEvaluationsService) {}

  @Get()
  get(
    @CurrentUser() user: AuthenticatedUser,
    @Param('moduleId') moduleId: string,
  ) {
    return this.service.getForStudent(user.id, moduleId);
  }

  @Post()
  submit(
    @CurrentUser() user: AuthenticatedUser,
    @Param('moduleId') moduleId: string,
    @Body() dto: SubmitTeacherEvaluationDto,
  ) {
    return this.service.submit(user.id, moduleId, dto);
  }
}
