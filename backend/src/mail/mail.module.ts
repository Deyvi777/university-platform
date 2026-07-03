import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { MailProcessor } from './mail.processor';
import { MAIL_QUEUE, MailService } from './mail.service';

@Module({
  imports: [BullModule.registerQueue({ name: MAIL_QUEUE })],
  providers: [MailService, MailProcessor],
  exports: [MailService],
})
export class MailModule {}
