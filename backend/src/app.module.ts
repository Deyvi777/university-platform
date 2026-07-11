import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_PIPE } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ZodValidationPipe } from 'nestjs-zod';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
import { AuthModule } from './auth/auth.module';
import { CalendarModule } from './calendar/calendar.module';
import { CategoriesModule } from './categories/categories.module';
import { ChatModule } from './chat/chat.module';
import { CleanupModule } from './cleanup/cleanup.module';
import { CoursesModule } from './courses/courses.module';
import { EnrollmentRequestsModule } from './enrollment-requests/enrollment-requests.module';
import { ForumModule } from './forum/forum.module';
import { GalleryModule } from './gallery/gallery.module';
import { GradingModule } from './grading/grading.module';
import { ModuleContentModule } from './module-content/module-content.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PartnersModule } from './partners/partners.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProgramsModule } from './programs/programs.module';
import { QueueModule } from './queue/queue.module';
import { QuizModule } from './quiz/quiz.module';
import { ScheduleModule } from './schedule/schedule.module';
import { SettingsModule } from './settings/settings.module';
import { StorageModule } from './storage/storage.module';
import { TeamModule } from './team/team.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    PrismaModule,
    QueueModule,
    AuthModule,
    ProgramsModule,
    PartnersModule,
    GalleryModule,
    StorageModule,
    CategoriesModule,
    SettingsModule,
    TeamModule,
    UsersModule,
    EnrollmentRequestsModule,
    CoursesModule,
    ModuleContentModule,
    GradingModule,
    NotificationsModule,
    ChatModule,
    CalendarModule,
    ScheduleModule,
    ForumModule,
    QuizModule,
    CleanupModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_PIPE, useClass: ZodValidationPipe },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: PrismaExceptionFilter },
  ],
})
export class AppModule {}
