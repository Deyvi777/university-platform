import { Module } from '@nestjs/common';
import { MailModule } from '../mail/mail.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';
import { AdminEnrollmentRequestsController } from './admin-enrollment-requests.controller';
import { EnrollmentRequestsController } from './enrollment-requests.controller';
import { EnrollmentRequestsService } from './enrollment-requests.service';

@Module({
  imports: [UsersModule, NotificationsModule, MailModule],
  controllers: [
    EnrollmentRequestsController,
    AdminEnrollmentRequestsController,
  ],
  providers: [EnrollmentRequestsService],
})
export class EnrollmentRequestsModule {}
