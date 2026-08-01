import { Module } from '@nestjs/common';
import { MailModule } from '../mail/mail.module';
import { StorageModule } from '../storage/storage.module';
import { AdminCallsController } from './admin-calls.controller';
import { CallsController } from './calls.controller';
import { CallsService } from './calls.service';

@Module({
  imports: [StorageModule, MailModule],
  controllers: [CallsController, AdminCallsController],
  providers: [CallsService],
})
export class CallsModule {}
