import { Module } from '@nestjs/common';
import { AdminTeacherEvaluationsController } from './admin-teacher-evaluations.controller';
import { TeacherEvaluationsController } from './teacher-evaluations.controller';
import { TeacherEvaluationsService } from './teacher-evaluations.service';

@Module({
  controllers: [
    TeacherEvaluationsController,
    AdminTeacherEvaluationsController,
  ],
  providers: [TeacherEvaluationsService],
})
export class TeacherEvaluationsModule {}
