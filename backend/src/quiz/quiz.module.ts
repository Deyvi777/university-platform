import { Module } from '@nestjs/common';
import { GradingModule } from '../grading/grading.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { QuizController } from './quiz.controller';
import { QuizService } from './quiz.service';

// PrismaModule es @Global. GradingModule exporta GradingService (para escribir
// la Submission y recalcular la nota del módulo al autocalificar).
@Module({
  imports: [GradingModule, NotificationsModule],
  controllers: [QuizController],
  providers: [QuizService],
})
export class QuizModule {}
