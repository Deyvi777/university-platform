import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { AdminCoursesController } from './admin-courses.controller';
import { KardexController } from './kardex.controller';
import { MyCoursesController } from './my-courses.controller';
import { CoursesService } from './courses.service';

@Module({
  imports: [NotificationsModule],
  controllers: [AdminCoursesController, MyCoursesController, KardexController],
  providers: [CoursesService],
})
export class CoursesModule {}
