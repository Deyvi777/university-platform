import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { StorageModule } from '../storage/storage.module';
import { AdminCoursesController } from './admin-courses.controller';
import { AdminStudentGradesController } from './admin-student-grades.controller';
import { KardexController } from './kardex.controller';
import { MyCoursesController } from './my-courses.controller';
import { CoursesService } from './courses.service';

@Module({
  imports: [NotificationsModule, StorageModule],
  controllers: [
    AdminCoursesController,
    AdminStudentGradesController,
    MyCoursesController,
    KardexController,
  ],
  providers: [CoursesService],
})
export class CoursesModule {}
