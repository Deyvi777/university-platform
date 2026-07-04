import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { MailProcessor } from './mail.processor';
import { MAIL_QUEUE, MailService } from './mail.service';

@Module({
  // NotificationsModule: el procesador avisa al ADMIN si un envío falla.
  imports: [
    BullModule.registerQueue({ name: MAIL_QUEUE }),
    NotificationsModule,
  ],
  providers: [MailService, MailProcessor],
  exports: [MailService],
})
export class MailModule {}
