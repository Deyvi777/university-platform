import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { GradingController } from './grading.controller';
import { GradingService } from './grading.service';

@Module({
  imports: [NotificationsModule],
  controllers: [GradingController],
  providers: [GradingService],
  exports: [GradingService],
})
export class GradingModule {}
