import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { ModuleContentController } from './module-content.controller';
import { ModuleContentService } from './module-content.service';

@Module({
  imports: [NotificationsModule],
  controllers: [ModuleContentController],
  providers: [ModuleContentService],
})
export class ModuleContentModule {}
