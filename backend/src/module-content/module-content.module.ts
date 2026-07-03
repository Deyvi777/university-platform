import { Module } from '@nestjs/common';
import { GradingModule } from '../grading/grading.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { StorageModule } from '../storage/storage.module';
import { ModuleContentController } from './module-content.controller';
import { ModuleContentService } from './module-content.service';

@Module({
  imports: [NotificationsModule, GradingModule, StorageModule],
  controllers: [ModuleContentController],
  providers: [ModuleContentService],
})
export class ModuleContentModule {}
